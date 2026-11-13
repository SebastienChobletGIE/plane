/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// GIE: ligne d'activité pour la charge estimée / réalisée.
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// components
import { EFFORT_FIELD_I18N, EffortIcon, formatEffort } from "@/components/dropdowns/effort";
import type { TEffortField } from "@/components/dropdowns/effort";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// local components
import { IssueActivityBlockComponent, IssueLink } from "./";

type TIssueEffortActivity = { activityId: string; showIssue?: boolean; ends: "top" | "bottom" | undefined };

export const IssueEffortActivity = observer(function IssueEffortActivity(props: TIssueEffortActivity) {
  const { activityId, showIssue = true, ends } = props;
  const { t, currentLocale } = useTranslation();
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activity = getActivityById(activityId);
  if (!activity) return <></>;

  const field = activity.field as TEffortField;
  const fieldLabel = t(EFFORT_FIELD_I18N[field]).toLowerCase();
  const unit = t("common.effort_unit");
  const oldValue = formatEffort(activity.old_value, currentLocale);
  const newValue = formatEffort(activity.new_value, currentLocale);

  return (
    <IssueActivityBlockComponent
      icon={<EffortIcon field={field} className="h-3.5 w-3.5 text-secondary" />}
      activityId={activityId}
      ends={ends}
    >
      <>
        {newValue !== null ? (
          <>
            {t("common.effort_activity_set", { field: fieldLabel })}{" "}
            <span className="font-medium text-primary">
              {newValue} {unit}
            </span>
            {oldValue !== null && <> {t("common.effort_activity_previous", { value: `${oldValue} ${unit}` })}</>}
          </>
        ) : (
          <>{t("common.effort_activity_removed", { field: fieldLabel })}</>
        )}
        {showIssue ? ` ${t("common.effort_activity_for")} ` : ``}
        {showIssue && <IssueLink activityId={activityId} />}.
      </>
    </IssueActivityBlockComponent>
  );
});
