/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// GIE: constantes des caractéristiques de projet.
import type { TProjectDisplayPropertyKey, TProjectStatusGroup } from "@plane/types";

export const PROJECT_STATUS_GROUPS: { key: TProjectStatusGroup; i18n_label: string; color: string }[] = [
  { key: "backlog", i18n_label: "gie_project.status_groups.backlog", color: "#60646C" },
  { key: "unstarted", i18n_label: "gie_project.status_groups.unstarted", color: "#60646C" },
  { key: "started", i18n_label: "gie_project.status_groups.started", color: "#F59E0B" },
  { key: "completed", i18n_label: "gie_project.status_groups.completed", color: "#46A758" },
  { key: "cancelled", i18n_label: "gie_project.status_groups.cancelled", color: "#9AA4BC" },
];

export const PROJECT_DISPLAY_PROPERTIES: { key: TProjectDisplayPropertyKey; i18n_label: string }[] = [
  { key: "project_status", i18n_label: "gie_project.fields.project_status" },
  { key: "project_priority", i18n_label: "gie_project.fields.project_priority" },
  { key: "estimated_delivery_date", i18n_label: "gie_project.fields.estimated_delivery_date" },
  { key: "is_copil", i18n_label: "gie_project.fields.is_copil" },
  { key: "progress", i18n_label: "gie_project.fields.progress" },
  { key: "remaining_work", i18n_label: "gie_project.fields.remaining_work" },
];

/** Tranches du filtre « Avancement » : [min, max] inclus, en pourcentage arrondi. */
export const PROJECT_PROGRESS_FILTER_OPTIONS: { key: string; min: number; max: number }[] = [
  { key: "0-24", min: 0, max: 24 },
  { key: "25-49", min: 25, max: 49 },
  { key: "50-74", min: 50, max: 74 },
  { key: "75-99", min: 75, max: 99 },
  { key: "100", min: 100, max: 100 },
];

/** Options rapides du filtre « Date de livraison estimée » (les plages personnalisées utilisent "AAAA-MM-JJ;after|before"). */
export const PROJECT_DELIVERY_DATE_FILTER_OPTIONS: { key: string; i18n_label: string }[] = [
  { key: "overdue", i18n_label: "gie_project.filters.delivery.overdue" },
  { key: "next_7_days", i18n_label: "gie_project.filters.delivery.next_7_days" },
  { key: "next_30_days", i18n_label: "gie_project.filters.delivery.next_30_days" },
  { key: "later", i18n_label: "gie_project.filters.delivery.later" },
  { key: "none", i18n_label: "gie_project.filters.delivery.none" },
];

export const PROJECT_CHARACTERISTICS_REMAINING_WORK_MAX_LENGTH = 5000;
