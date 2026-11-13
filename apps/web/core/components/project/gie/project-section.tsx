/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// GIE: section « Caractéristiques » de la page Général d'un projet, modifiable par tout membre du projet,
// suivie du fil d'activité des modifications.
import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import {
  EUserPermissions,
  EUserPermissionsLevel,
  PROJECT_CHARACTERISTICS_REMAINING_WORK_MAX_LENGTH,
  PROJECT_STATUS_GROUPS,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TProjectCharacteristicActivity, TProjectCharacteristics } from "@plane/types";
import { CustomSelect, TextArea, ToggleSwitch } from "@plane/ui";
import { calculateTimeAgo, renderFormattedPayloadDate } from "@plane/utils";
// components
import { DateDropdown } from "@/components/dropdowns/date";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
import { useProjectCharacteristics } from "@/hooks/store/use-project-characteristics";
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import { ColorDot, ProgressBar } from "./display";
import { formatProjectDate, getProjectProgress } from "@/helpers/gie-project.helper";

type Props = { workspaceSlug: string; projectId: string };

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-[220px_1fr]">
      <span className="pt-1.5 text-13 text-secondary">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

const ActivityItem = observer(function ActivityItem({ activity }: { activity: TProjectCharacteristicActivity }) {
  const { t, currentLocale } = useTranslation();
  const { getUserDetails } = useMember();
  const actor = activity.actor ? getUserDetails(activity.actor)?.display_name : undefined;
  const field = t(`gie_project.fields.${activity.field}`);

  const formatValue = (value: string | null) => {
    if (value === null) return "";
    if (activity.field === "is_copil") return value === "true" ? t("gie_project.yes") : t("gie_project.no");
    if (activity.field === "estimated_delivery_date") return formatProjectDate(value, currentLocale) ?? value;
    if (activity.field === "remaining_work") return `« ${value.length > 120 ? `${value.slice(0, 120)}…` : value} »`;
    return value;
  };

  const actorLabel = actor ?? t("gie_project.activity.unknown_actor");
  const text =
    activity.verb === "removed" || activity.new_value === null
      ? t("gie_project.activity.removed", { actor: actorLabel, field })
      : t("gie_project.activity.set", { actor: actorLabel, field, value: formatValue(activity.new_value) });

  return (
    <li className="flex flex-col gap-0.5 border-l-2 border-subtle py-1 pl-3">
      <span className="text-13 break-words text-primary">
        {text}
        {activity.old_value !== null && activity.new_value !== null && (
          <span className="text-tertiary">
            {" "}
            {t("gie_project.activity.previous", { value: formatValue(activity.old_value) })}
          </span>
        )}
      </span>
      <span className="text-11 text-placeholder" title={new Date(activity.created_at).toLocaleString(currentLocale)}>
        {calculateTimeAgo(activity.created_at)}
      </span>
    </li>
  );
});

export const ProjectCharacteristicsSection = observer(function ProjectCharacteristicsSection(props: Props) {
  const { workspaceSlug, projectId } = props;
  const { t } = useTranslation();
  // store hooks
  const { getProjectById } = useProject();
  const { allowPermissions } = useUserPermissions();
  const store = useProjectCharacteristics();
  // data
  useSWR(`GIE_PROJECT_STATUSES_${workspaceSlug}`, () => store.fetchStatuses(workspaceSlug));
  useSWR(`GIE_PROJECT_PRIORITIES_${workspaceSlug}`, () => store.fetchPriorities(workspaceSlug));
  // derived values
  const project = getProjectById(projectId);
  const statuses = store.getStatuses(workspaceSlug) ?? [];
  const priorities = store.getPriorities(workspaceSlug) ?? [];
  const isProjectMember = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
  );
  const canEdit = isProjectMember && !project?.archived_at;
  // remaining work draft
  const [remainingWork, setRemainingWork] = useState(project?.remaining_work ?? "");
  const [isSavingRemainingWork, setIsSavingRemainingWork] = useState(false);
  useEffect(() => {
    setRemainingWork(project?.remaining_work ?? "");
  }, [project?.remaining_work]);

  if (!project) return null;

  const save = async (data: Partial<TProjectCharacteristics>) => {
    try {
      await store.updateProjectCharacteristics(workspaceSlug, projectId, data);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("gie_project.project_section.saved"), message: "" });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("error"), message: t("gie_project.settings.errors.generic") });
    }
  };

  const currentStatus = statuses.find((s) => s.id === project.project_status);
  const currentPriority = priorities.find((p) => p.id === project.project_priority);
  const progress = getProjectProgress(project);
  const isRemainingWorkDirty = remainingWork !== (project.remaining_work ?? "");

  return (
    <section className="mt-10 flex w-full flex-col gap-6 border-t border-subtle pt-8">
      <div>
        <h3 className="text-16 font-semibold text-primary">{t("gie_project.project_section.title")}</h3>
        <p className="text-13 text-tertiary">{t("gie_project.project_section.description")}</p>
      </div>

      <div className="flex flex-col gap-4">
        {/* statut */}
        <FieldRow label={t("gie_project.fields.project_status")}>
          <CustomSelect
            value={project.project_status ?? null}
            onChange={(value: string | null) => {
              if (value !== (project.project_status ?? null)) void save({ project_status: value });
            }}
            label={
              currentStatus ? (
                <span className="flex items-center gap-1.5">
                  <ColorDot color={currentStatus.color} />
                  {currentStatus.name}
                </span>
              ) : (
                <span className="text-placeholder">{t("gie_project.none")}</span>
              )
            }
            buttonClassName="!border-subtle !shadow-none rounded-md"
            input
            disabled={!canEdit}
            maxHeight="lg"
          >
            <CustomSelect.Option value={null}>
              <span className="text-placeholder">{t("gie_project.none")}</span>
            </CustomSelect.Option>
            {PROJECT_STATUS_GROUPS.map((group) =>
              statuses
                .filter((s) => s.group === group.key)
                .map((status) => (
                  <CustomSelect.Option key={status.id} value={status.id}>
                    <span className="flex items-center gap-1.5">
                      <ColorDot color={status.color} />
                      {status.name}
                      <span className="text-11 text-placeholder">· {t(group.i18n_label)}</span>
                    </span>
                  </CustomSelect.Option>
                ))
            )}
          </CustomSelect>
        </FieldRow>

        {/* priorité */}
        <FieldRow label={t("gie_project.fields.project_priority")}>
          <CustomSelect
            value={project.project_priority ?? null}
            onChange={(value: string | null) => {
              if (value !== (project.project_priority ?? null)) void save({ project_priority: value });
            }}
            label={
              currentPriority ? (
                <span className="flex items-center gap-1.5">
                  {currentPriority.color && <ColorDot color={currentPriority.color} />}
                  {currentPriority.name}
                </span>
              ) : (
                <span className="text-placeholder">{t("gie_project.none")}</span>
              )
            }
            buttonClassName="!border-subtle !shadow-none rounded-md"
            input
            disabled={!canEdit}
            maxHeight="lg"
          >
            <CustomSelect.Option value={null}>
              <span className="text-placeholder">{t("gie_project.none")}</span>
            </CustomSelect.Option>
            {priorities.map((priority) => (
              <CustomSelect.Option key={priority.id} value={priority.id}>
                <span className="flex items-center gap-1.5">
                  {priority.color && <ColorDot color={priority.color} />}
                  {priority.name}
                </span>
              </CustomSelect.Option>
            ))}
          </CustomSelect>
        </FieldRow>

        {/* date de livraison estimée */}
        <FieldRow label={t("gie_project.fields.estimated_delivery_date")}>
          <div className="h-8 w-fit">
            <DateDropdown
              value={project.estimated_delivery_date ?? null}
              onChange={(date) => {
                const value = date ? (renderFormattedPayloadDate(date) ?? null) : null;
                if (value !== (project.estimated_delivery_date ?? null)) void save({ estimated_delivery_date: value });
              }}
              placeholder={t("gie_project.project_section.select_date")}
              buttonVariant="border-with-text"
              isClearable
              disabled={!canEdit}
              formatToken="dd/MM/yyyy"
            />
          </div>
        </FieldRow>

        {/* COPIL */}
        <FieldRow label={t("gie_project.fields.is_copil")}>
          <div className="flex items-center gap-2 pt-1">
            <ToggleSwitch
              value={!!project.is_copil}
              onChange={() => void save({ is_copil: !project.is_copil })}
              disabled={!canEdit}
              size="sm"
            />
            <span className="text-13 text-secondary">
              {project.is_copil ? t("gie_project.yes") : t("gie_project.no")}
            </span>
          </div>
        </FieldRow>

        {/* avancement (calculé) */}
        <FieldRow label={t("gie_project.fields.progress")}>
          <div className="flex flex-col gap-1 pt-1.5 text-13 text-primary">
            <ProgressBar percent={progress} />
            <span className="text-12 text-tertiary">
              {t("gie_project.project_section.progress_detail", {
                completed: project.progress_completed_count ?? 0,
                total: project.progress_total_count ?? 0,
              })}
            </span>
          </div>
        </FieldRow>

        {/* reste à faire */}
        <FieldRow label={t("gie_project.fields.remaining_work")}>
          <div className="flex flex-col gap-2">
            <TextArea
              value={remainingWork}
              onChange={(e) => setRemainingWork(e.target.value)}
              placeholder={t("gie_project.project_section.remaining_work_placeholder")}
              className="min-h-24 w-full text-13"
              maxLength={PROJECT_CHARACTERISTICS_REMAINING_WORK_MAX_LENGTH}
              disabled={!canEdit}
            />
            {canEdit && isRemainingWorkDirty && (
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  disabled={isSavingRemainingWork}
                  onClick={async () => {
                    setIsSavingRemainingWork(true);
                    await save({ remaining_work: remainingWork });
                    setIsSavingRemainingWork(false);
                  }}
                >
                  {t("gie_project.project_section.save")}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setRemainingWork(project.remaining_work ?? "")}>
                  {t("cancel")}
                </Button>
              </div>
            )}
          </div>
        </FieldRow>
      </div>
    </section>
  );
});

/** Fil d'activité des caractéristiques, affiché en bas de la page Général du projet. */
export const ProjectCharacteristicsActivity = observer(function ProjectCharacteristicsActivity(props: Props) {
  const { workspaceSlug, projectId } = props;
  const { t } = useTranslation();
  const store = useProjectCharacteristics();
  useSWR(`GIE_PROJECT_ACTIVITIES_${projectId}`, () => store.fetchActivities(workspaceSlug, projectId));
  const activities = store.getActivities(projectId);

  return (
    <section className="mt-10 flex w-full flex-col gap-3 border-t border-subtle pt-8">
      <h4 className="text-14 font-semibold text-primary">{t("gie_project.activity.title")}</h4>
      {activities && activities.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {activities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </ul>
      ) : (
        <p className="text-13 text-placeholder italic">{t("gie_project.activity.empty")}</p>
      )}
    </section>
  );
});
