/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// GIE: étiquettes des filtres appliqués sur les caractéristiques de projet.
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { PROJECT_DELIVERY_DATE_FILTER_OPTIONS, PROJECT_PROGRESS_FILTER_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { CloseIcon } from "@plane/propel/icons";
import type { TProjectFilters } from "@plane/types";
import { useProjectCharacteristics } from "@/hooks/store/use-project-characteristics";
import { formatProjectDate } from "@/helpers/gie-project.helper";

export const PROJECT_CHARACTERISTIC_FILTER_KEYS: (keyof TProjectFilters)[] = [
  "project_status",
  "project_priority",
  "estimated_delivery_date",
  "is_copil",
  "progress",
];

export const ProjectCharacteristicFilterLabel = observer(function ProjectCharacteristicFilterLabel({
  filterKey,
}: {
  filterKey: keyof TProjectFilters;
}) {
  const { t } = useTranslation();
  return <span className="text-11 text-tertiary">{t(`gie_project.fields.${filterKey}`)}</span>;
});

type Props = {
  filterKey: keyof TProjectFilters;
  values: string[];
  editable: boolean | undefined;
  handleRemove: (val: string) => void;
};

export const AppliedProjectCharacteristicFilters = observer(function AppliedProjectCharacteristicFilters(props: Props) {
  const { filterKey, values, editable, handleRemove } = props;
  const { workspaceSlug } = useParams();
  const slug = workspaceSlug?.toString() ?? "";
  const { t, currentLocale } = useTranslation();
  const { getStatusById, getPriorityById } = useProjectCharacteristics();

  const getLabel = (value: string): string => {
    if (value === "none" && filterKey !== "estimated_delivery_date") return t("gie_project.none");
    if (filterKey === "project_status") return getStatusById(slug, value)?.name ?? value;
    if (filterKey === "project_priority") return getPriorityById(slug, value)?.name ?? value;
    if (filterKey === "is_copil") return value === "true" ? t("gie_project.yes") : t("gie_project.no");
    if (filterKey === "progress") {
      const option = PROJECT_PROGRESS_FILTER_OPTIONS.find((o) => o.key === value);
      if (!option) return value;
      return option.min === option.max ? `${option.min} %` : `${option.min} – ${option.max} %`;
    }
    if (filterKey === "estimated_delivery_date") {
      const option = PROJECT_DELIVERY_DATE_FILTER_OPTIONS.find((o) => o.key === value);
      if (option) return t(option.i18n_label);
      const [date, operator] = value.split(";");
      return `${operator === "after" ? "≥" : "≤"} ${formatProjectDate(date, currentLocale) ?? date}`;
    }
    return value;
  };

  return (
    <>
      {values.map((value) => (
        <div key={value} className="flex items-center gap-1 rounded-sm bg-layer-1 px-1.5 py-1 text-11">
          {getLabel(value)}
          {editable && (
            <button
              type="button"
              className="grid place-items-center text-tertiary hover:text-secondary"
              onClick={() => handleRemove(value)}
            >
              <CloseIcon height={10} width={10} strokeWidth={2} />
            </button>
          )}
        </div>
      ))}
    </>
  );
});
