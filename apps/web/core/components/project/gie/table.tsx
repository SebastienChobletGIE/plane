/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// GIE: disposition « Tableau » de la page des projets : une ligne par projet, une colonne par champ affiché.
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowDown, ArrowUp } from "lucide-react";
import { PROJECT_DISPLAY_PROPERTIES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Logo } from "@plane/propel/emoji-icon-picker";
import type { TProject, TProjectDisplayPropertyKey, TProjectOrderByOptions } from "@plane/types";
import { cn } from "@plane/utils";
import { useProject } from "@/hooks/store/use-project";
import { useProjectFilter } from "@/hooks/store/use-project-filter";
import {
  ProjectCopilValue,
  ProjectDeliveryDateValue,
  ProjectPriorityValue,
  ProjectProgressValue,
  ProjectRemainingWorkValue,
  ProjectStatusValue,
} from "./display";

// colonnes triables (le reste à faire ne l'est pas)
const SORTABLE: Partial<Record<TProjectDisplayPropertyKey | "name", TProjectOrderByOptions>> = {
  name: "name",
  project_status: "project_status",
  project_priority: "project_priority",
  estimated_delivery_date: "estimated_delivery_date",
  is_copil: "is_copil",
  progress: "progress",
};

const renderCell = (key: TProjectDisplayPropertyKey, project: TProject, workspaceSlug: string) => {
  switch (key) {
    case "project_status":
      return <ProjectStatusValue project={project} workspaceSlug={workspaceSlug} />;
    case "project_priority":
      return <ProjectPriorityValue project={project} workspaceSlug={workspaceSlug} />;
    case "estimated_delivery_date":
      return <ProjectDeliveryDateValue project={project} />;
    case "is_copil":
      return <ProjectCopilValue project={project} />;
    case "progress":
      return <ProjectProgressValue project={project} />;
    case "remaining_work":
      return <ProjectRemainingWorkValue project={project} lines={2} />;
  }
};

export const ProjectTable = observer(function ProjectTable(props: { projectIds: string[] }) {
  const { projectIds } = props;
  const { workspaceSlug } = useParams();
  const slug = workspaceSlug?.toString() ?? "";
  const { t } = useTranslation();
  const { getProjectById } = useProject();
  const { currentWorkspaceDisplayFilters: displayFilters, updateDisplayFilters } = useProjectFilter();
  const show = displayFilters?.display_properties ?? {};
  const columns = PROJECT_DISPLAY_PROPERTIES.filter((p) => show[p.key]);
  const orderBy = displayFilters?.order_by;

  const handleSort = (key: TProjectDisplayPropertyKey | "name") => {
    const sortKey = SORTABLE[key];
    if (!sortKey || !slug) return;
    const next = orderBy === sortKey ? (`-${sortKey}` as TProjectOrderByOptions) : sortKey;
    updateDisplayFilters(slug, { order_by: next });
  };

  const renderHeader = (key: TProjectDisplayPropertyKey | "name", label: string, className?: string) => {
    const sortKey = SORTABLE[key];
    const isActive = !!sortKey && (orderBy === sortKey || orderBy === `-${sortKey}`);
    return (
      <th
        key={key}
        className={cn("px-3 py-2 text-left text-12 font-medium whitespace-nowrap text-tertiary", className)}
      >
        {sortKey ? (
          <button type="button" className="flex items-center gap-1 hover:text-primary" onClick={() => handleSort(key)}>
            {label}
            {isActive &&
              (orderBy?.startsWith("-") ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
          </button>
        ) : (
          label
        )}
      </th>
    );
  };

  return (
    <div className="h-full w-full overflow-auto">
      <table className="w-full min-w-[720px] border-collapse">
        <thead className="sticky top-0 z-[1] bg-surface-1">
          <tr className="border-b border-subtle">
            {renderHeader("name", t("gie_project.table.project"), "min-w-[240px]")}
            {columns.map((c) =>
              renderHeader(c.key, t(c.i18n_label), c.key === "remaining_work" ? "min-w-[260px]" : undefined)
            )}
          </tr>
        </thead>
        <tbody>
          {projectIds.map((projectId) => {
            const project = getProjectById(projectId);
            if (!project) return null;
            const isMember = !!project.member_role;
            const nameCell = (
              <span className="flex min-w-0 items-center gap-2">
                <span className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-sm bg-layer-1">
                  <Logo logo={project.logo_props} size={14} />
                </span>
                <span className="truncate font-medium text-primary">{project.name}</span>
                <span className="flex-shrink-0 text-11 text-placeholder">{project.identifier}</span>
              </span>
            );
            return (
              <tr key={project.id} className="border-b border-subtle align-top text-13 hover:bg-layer-1">
                <td className="px-3 py-2">
                  {isMember && !project.archived_at ? (
                    <Link href={`/${slug}/projects/${project.id}/issues`} className="block">
                      {nameCell}
                    </Link>
                  ) : (
                    nameCell
                  )}
                </td>
                {columns.map((c) => (
                  <td key={c.key} className="px-3 py-2 text-secondary">
                    {renderCell(c.key, project, slug)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});
