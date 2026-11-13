/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// GIE: colonnes « charge estimée » et « charge réalisée » du tableur.
import { observer } from "mobx-react";
// types
import type { TIssue } from "@plane/types";
// components
import { EffortDropdown } from "@/components/dropdowns/effort";
import type { TEffortField } from "@/components/dropdowns/effort";
// hooks
import { useProject } from "@/hooks/store/use-project";

type Props = {
  issue: TIssue;
  onClose: () => void;
  onChange: (issue: TIssue, data: Partial<TIssue>, updates: any) => void;
  disabled: boolean;
};

const SpreadsheetEffortCell = observer(function SpreadsheetEffortCell(props: Props & { field: TEffortField }) {
  const { issue, onChange, disabled, onClose, field } = props;
  const { getProjectById } = useProject();
  const isEffortEnabled = !!getProjectById(issue.project_id)?.is_effort_enabled;

  return (
    <div className="h-11 border-b-[0.5px] border-subtle">
      {isEffortEnabled && (
        <EffortDropdown
          field={field}
          value={issue[field]}
          onChange={(value) => onChange(issue, { [field]: value }, { changed_property: field, change_details: value })}
          disabled={disabled}
          buttonVariant="transparent-with-text"
          buttonClassName="text-left rounded-none group-[.selected-issue-row]:bg-accent-primary/5 group-[.selected-issue-row]:hover:bg-accent-primary/10 px-page-x"
          buttonContainerClassName="w-full"
          onClose={onClose}
        />
      )}
    </div>
  );
});

export const SpreadsheetEstimatedEffortColumn = observer(function SpreadsheetEstimatedEffortColumn(props: Props) {
  return <SpreadsheetEffortCell {...props} field="estimated_effort" />;
});

export const SpreadsheetActualEffortColumn = observer(function SpreadsheetActualEffortColumn(props: Props) {
  return <SpreadsheetEffortCell {...props} field="actual_effort" />;
});
