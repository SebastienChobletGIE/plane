/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// GIE: calculs, filtres et tris sur les caractéristiques de projet (faits dans le navigateur, comme les autres
// filtres de la page des projets).
import { orderBy as lodashOrderBy, sortBy } from "lodash-es";
import { differenceInCalendarDays } from "date-fns";
import { PROJECT_PROGRESS_FILTER_OPTIONS } from "@plane/constants";
import type { TProject, TProjectFilters, TProjectOrderByOptions, TProjectPriority, TProjectStatus } from "@plane/types";
import { getDate, satisfiesDateFilter } from "@plane/utils";

/** Avancement en pourcentage arrondi : work items terminés / (total hors annulés). 0 si aucun work item. */
export const getProjectProgress = (project: Pick<TProject, "progress_total_count" | "progress_completed_count">) => {
  const total = project.progress_total_count ?? 0;
  const completed = project.progress_completed_count ?? 0;
  return total > 0 ? Math.round((completed * 100) / total) : 0;
};

/** Date au format de la langue de l'utilisateur, ex. 31/12/2026 en français. */
export const formatProjectDate = (value: string | null | undefined, locale?: string): string | null => {
  const date = getDate(value);
  if (!date) return null;
  return date.toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "numeric" });
};

const matchesDeliveryDate = (value: string | null | undefined, filter: string): boolean => {
  const date = getDate(value);
  if (filter === "none") return !date;
  if (!date) return false;
  const days = differenceInCalendarDays(date, new Date());
  if (filter === "overdue") return days < 0;
  if (filter === "next_7_days") return days >= 0 && days <= 7;
  if (filter === "next_30_days") return days >= 0 && days <= 30;
  if (filter === "later") return days > 30;
  // plage personnalisée : "AAAA-MM-JJ;after" / "AAAA-MM-JJ;before"
  return satisfiesDateFilter(date, filter);
};

const isCustomDateFilter = (filter: string) => filter.includes(";");

/** Filtres GIE : retourne false si le projet est exclu par au moins un filtre. */
export const shouldFilterProjectByCharacteristics = (project: TProject, filters: TProjectFilters): boolean => {
  const status = filters.project_status ?? [];
  if (status.length > 0 && !status.includes(project.project_status ?? "none")) return false;

  const priority = filters.project_priority ?? [];
  if (priority.length > 0 && !priority.includes(project.project_priority ?? "none")) return false;

  const copil = filters.is_copil ?? [];
  if (copil.length > 0 && !copil.includes(project.is_copil ? "true" : "false")) return false;

  const progress = filters.progress ?? [];
  if (progress.length > 0) {
    const percent = getProjectProgress(project);
    const inRange = PROJECT_PROGRESS_FILTER_OPTIONS.some(
      (option) => progress.includes(option.key) && percent >= option.min && percent <= option.max
    );
    if (!inRange) return false;
  }

  const delivery = filters.estimated_delivery_date ?? [];
  if (delivery.length > 0) {
    // les bornes d'une plage personnalisée doivent toutes être respectées, les options rapides se cumulent (OU)
    const custom = delivery.filter(isCustomDateFilter);
    const quick = delivery.filter((f) => !isCustomDateFilter(f));
    if (custom.length > 0 && !custom.every((f) => matchesDeliveryDate(project.estimated_delivery_date, f)))
      return false;
    if (quick.length > 0 && !quick.some((f) => matchesDeliveryDate(project.estimated_delivery_date, f))) return false;
  }

  return true;
};

const GIE_ORDER_KEYS = new Set([
  "project_status",
  "project_priority",
  "estimated_delivery_date",
  "is_copil",
  "progress",
]);

export const isCharacteristicOrderBy = (orderBy: TProjectOrderByOptions | undefined): boolean =>
  !!orderBy && GIE_ORDER_KEYS.has(orderBy.replace(/^-/, ""));

/**
 * Tri GIE. Les projets sans valeur sont toujours placés à la fin.
 * Statut : ordre des groupes puis ordre dans le groupe. Priorité : ordre de la liste (la première = la plus prioritaire).
 */
export const orderProjectsByCharacteristics = (
  projects: TProject[],
  orderBy: TProjectOrderByOptions,
  statusMap: Record<string, TProjectStatus> | undefined,
  priorityMap: Record<string, TProjectPriority> | undefined,
  groupOrder: string[]
): TProject[] => {
  const descending = orderBy.startsWith("-");
  const key = orderBy.replace(/^-/, "");

  const getValue = (project: TProject): number | string | null => {
    if (key === "project_status") {
      const status = project.project_status ? statusMap?.[project.project_status] : undefined;
      return status ? groupOrder.indexOf(status.group) * 1e9 + status.sequence : null;
    }
    if (key === "project_priority") {
      const priority = project.project_priority ? priorityMap?.[project.project_priority] : undefined;
      return priority ? priority.sequence : null;
    }
    if (key === "estimated_delivery_date") return project.estimated_delivery_date ?? null;
    if (key === "is_copil") return project.is_copil ? 1 : 0;
    if (key === "progress") return getProjectProgress(project);
    return null;
  };

  const withValue = projects.filter((p) => getValue(p) !== null);
  const withoutValue = projects.filter((p) => getValue(p) === null);
  const sorted = lodashOrderBy(
    withValue,
    [(p) => getValue(p), (p) => p.name.toLowerCase()],
    [descending ? "desc" : "asc", "asc"]
  );
  return [...sorted, ...sortBy(withoutValue, (p) => p.name.toLowerCase())];
};
