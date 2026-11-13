/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TProjectAppliedDisplayFilterKeys, TProjectFilters } from "@plane/types";
import { calculateTotalFilters } from "@plane/utils";
// components
import { PageHead } from "@/components/core/page-title";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useProjectFilter } from "@/hooks/store/use-project-filter";
import { useWorkspace } from "@/hooks/store/use-workspace";
// GIE
import useSWR from "swr";
import { useProjectCharacteristics } from "@/hooks/store/use-project-characteristics";
// local imports
import { ProjectAppliedFiltersList } from "./applied-filters";
import { ProjectCardList } from "./card-list";

export const ProjectRoot = observer(function ProjectRoot() {
  const { currentWorkspace } = useWorkspace();
  const { workspaceSlug } = useParams();
  const pathname = usePathname();
  const { t } = useTranslation();
  // store
  const { totalProjectIds, filteredProjectIds } = useProject();
  const {
    currentWorkspaceFilters,
    currentWorkspaceAppliedDisplayFilters,
    clearAllFilters,
    clearAllAppliedDisplayFilters,
    updateFilters,
    updateDisplayFilters,
  } = useProjectFilter();
  // derived values
  const pageTitle = currentWorkspace?.name
    ? `${currentWorkspace?.name} - ${t("workspace_projects.label", { count: 2 })}`
    : undefined;

  const isArchived = pathname.includes("/archives");

  const allowedDisplayFilters =
    currentWorkspaceAppliedDisplayFilters?.filter((filter) => filter !== "archived_projects") ?? [];

  const handleRemoveFilter = useCallback(
    (key: keyof TProjectFilters, value: string | null) => {
      if (!workspaceSlug) return;
      let newValues = currentWorkspaceFilters?.[key] ?? [];

      if (!value) newValues = [];
      else newValues = newValues.filter((val) => val !== value);

      updateFilters(workspaceSlug.toString(), { [key]: newValues });
    },
    [currentWorkspaceFilters, updateFilters, workspaceSlug]
  );

  const handleRemoveDisplayFilter = useCallback(
    (key: TProjectAppliedDisplayFilterKeys) => {
      if (!workspaceSlug) return;
      updateDisplayFilters(workspaceSlug.toString(), { [key]: false });
    },
    [updateDisplayFilters, workspaceSlug]
  );

  const handleClearAllFilters = useCallback(() => {
    if (!workspaceSlug) return;
    clearAllFilters(workspaceSlug.toString());
    clearAllAppliedDisplayFilters(workspaceSlug.toString());
    if (isArchived) updateDisplayFilters(workspaceSlug.toString(), { archived_projects: true });
  }, [clearAllFilters, clearAllAppliedDisplayFilters, workspaceSlug]);

  useEffect(() => {
    updateDisplayFilters(workspaceSlug.toString(), { archived_projects: isArchived });
  }, [pathname]);

  // GIE: à chaque retour sur la page, recharge les projets pour mettre à jour l'avancement
  // (le premier chargement est fait par la page elle-même)
  const { fetchProjects, fetchStatus } = useProject();
  useEffect(() => {
    if (workspaceSlug && fetchStatus === "complete") void fetchProjects(workspaceSlug.toString());
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug]);

  // GIE: statuts et priorités de projet (affichage, filtres, tris)
  const characteristics = useProjectCharacteristics();
  useSWR(workspaceSlug ? `GIE_PROJECT_STATUSES_${workspaceSlug}` : null, () =>
    characteristics.fetchStatuses(workspaceSlug.toString())
  );
  useSWR(workspaceSlug ? `GIE_PROJECT_PRIORITIES_${workspaceSlug}` : null, () =>
    characteristics.fetchPriorities(workspaceSlug.toString())
  );

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="flex h-full w-full flex-col">
        {(calculateTotalFilters(currentWorkspaceFilters ?? {}) !== 0 || allowedDisplayFilters.length > 0) && (
          <ProjectAppliedFiltersList
            appliedFilters={currentWorkspaceFilters ?? {}}
            appliedDisplayFilters={allowedDisplayFilters}
            handleClearAllFilters={handleClearAllFilters}
            handleRemoveFilter={handleRemoveFilter}
            handleRemoveDisplayFilter={handleRemoveDisplayFilter}
            filteredProjects={filteredProjectIds?.length ?? 0}
            totalProjects={totalProjectIds?.length ?? 0}
            alwaysAllowEditing
          />
        )}
        <ProjectCardList />
      </div>
    </>
  );
});
