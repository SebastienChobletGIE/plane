/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// GIE: affichage en lecture des caractéristiques d'un projet (cartes, tableau).
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import type { TProject } from "@plane/types";
import { cn } from "@plane/utils";
import { useProjectCharacteristics } from "@/hooks/store/use-project-characteristics";
import { formatProjectDate, getProjectProgress } from "@/helpers/gie-project.helper";

export function ColorDot({ color, className }: { color?: string | null; className?: string }) {
  return (
    <span
      className={cn("inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full border border-subtle", className)}
      style={{ backgroundColor: color || "transparent" }}
    />
  );
}

export function ProgressBar({ percent, className }: { percent: number; className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span className="relative h-1.5 w-16 flex-shrink-0 overflow-hidden rounded-full bg-layer-3">
        <span
          className="absolute inset-y-0 left-0 rounded-full bg-success-primary"
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </span>
      <span className="tabular-nums">{percent} %</span>
    </span>
  );
}

type TValueProps = { project: TProject; workspaceSlug: string };

export const ProjectStatusValue = observer(function ProjectStatusValue({ project, workspaceSlug }: TValueProps) {
  const { getStatusById } = useProjectCharacteristics();
  const status = getStatusById(workspaceSlug, project.project_status);
  if (!status) return <span className="text-placeholder">—</span>;
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <ColorDot color={status.color} />
      <span className="truncate">{status.name}</span>
    </span>
  );
});

export const ProjectPriorityValue = observer(function ProjectPriorityValue({ project, workspaceSlug }: TValueProps) {
  const { getPriorityById } = useProjectCharacteristics();
  const priority = getPriorityById(workspaceSlug, project.project_priority);
  if (!priority) return <span className="text-placeholder">—</span>;
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      {priority.color && <ColorDot color={priority.color} />}
      <span className="truncate">{priority.name}</span>
    </span>
  );
});

export function ProjectDeliveryDateValue({ project }: { project: TProject }) {
  const { currentLocale } = useTranslation();
  const formatted = formatProjectDate(project.estimated_delivery_date, currentLocale);
  return formatted ? <span>{formatted}</span> : <span className="text-placeholder">—</span>;
}

export function ProjectCopilValue({ project }: { project: TProject }) {
  const { t } = useTranslation();
  return <span>{project.is_copil ? t("gie_project.yes") : t("gie_project.no")}</span>;
}

export function ProjectProgressValue({ project }: { project: TProject }) {
  return <ProgressBar percent={getProjectProgress(project)} />;
}

export function ProjectRemainingWorkValue({ project, lines = 2 }: { project: TProject; lines?: 1 | 2 | 3 }) {
  if (!project.remaining_work) return <span className="text-placeholder">—</span>;
  return (
    <span
      className={cn("break-words whitespace-pre-line", {
        "line-clamp-1": lines === 1,
        "line-clamp-2": lines === 2,
        "line-clamp-3": lines === 3,
      })}
      title={project.remaining_work}
    >
      {project.remaining_work}
    </span>
  );
}
