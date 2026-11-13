/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// GIE: caractéristiques affichées sur la carte d'un projet, selon les champs choisis dans « Affichage ».
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import type { TProject } from "@plane/types";
import { useProjectFilter } from "@/hooks/store/use-project-filter";
import {
  ProjectCopilValue,
  ProjectDeliveryDateValue,
  ProjectPriorityValue,
  ProjectProgressValue,
  ProjectRemainingWorkValue,
  ProjectStatusValue,
} from "./display";

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-11 text-placeholder">{label}</span>
      <span className="min-w-0 text-12 text-secondary">{children}</span>
    </div>
  );
}

export const ProjectCardCharacteristics = observer(function ProjectCardCharacteristics(props: {
  project: TProject;
  workspaceSlug: string;
}) {
  const { project, workspaceSlug } = props;
  const { t } = useTranslation();
  const { currentWorkspaceDisplayFilters } = useProjectFilter();
  const show = currentWorkspaceDisplayFilters?.display_properties ?? {};
  const hasGridItems =
    show.project_status || show.project_priority || show.estimated_delivery_date || show.is_copil || show.progress;
  if (!hasGridItems && !show.remaining_work) return null;

  return (
    <div className="flex flex-col gap-2 border-b border-subtle px-4 py-3">
      {hasGridItems && (
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          {show.project_status && (
            <Item label={t("gie_project.fields.project_status")}>
              <ProjectStatusValue project={project} workspaceSlug={workspaceSlug} />
            </Item>
          )}
          {show.project_priority && (
            <Item label={t("gie_project.fields.project_priority")}>
              <ProjectPriorityValue project={project} workspaceSlug={workspaceSlug} />
            </Item>
          )}
          {show.estimated_delivery_date && (
            <Item label={t("gie_project.fields.estimated_delivery_date")}>
              <ProjectDeliveryDateValue project={project} />
            </Item>
          )}
          {show.is_copil && (
            <Item label={t("gie_project.fields.is_copil")}>
              <ProjectCopilValue project={project} />
            </Item>
          )}
          {show.progress && (
            <Item label={t("gie_project.fields.progress")}>
              <ProjectProgressValue project={project} />
            </Item>
          )}
        </div>
      )}
      {show.remaining_work && (
        <Item label={t("gie_project.fields.remaining_work")}>
          <ProjectRemainingWorkValue project={project} lines={2} />
        </Item>
      )}
    </div>
  );
});
