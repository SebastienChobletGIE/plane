/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// GIE: filtres de la page des projets sur les caractéristiques (statut, priorité, date de livraison, COPIL, avancement).
import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import {
  PROJECT_DELIVERY_DATE_FILTER_OPTIONS,
  PROJECT_PROGRESS_FILTER_OPTIONS,
  PROJECT_STATUS_GROUPS,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TProjectFilters } from "@plane/types";
import { DateFilterModal } from "@/components/core/filters/date-filter-modal";
import { FilterHeader, FilterOption } from "@/components/issues/issue-layouts/filters";
import { useProjectCharacteristics } from "@/hooks/store/use-project-characteristics";
import { ColorDot } from "./display";

type TOption = { key: string; title: string; icon?: React.ReactNode; multiple?: boolean };

type TSectionProps = {
  title: string;
  options: TOption[];
  applied: string[] | null | undefined;
  onToggle: (key: string) => void;
  searchQuery: string;
  extra?: React.ReactNode;
};

function FilterSection(props: TSectionProps) {
  const { title, options, applied, onToggle, searchQuery, extra } = props;
  const { t } = useTranslation();
  const [previewEnabled, setPreviewEnabled] = useState(true);
  const count = applied?.length ?? 0;
  const visible = options.filter((o) => o.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="py-2">
      <FilterHeader
        title={`${title}${count > 0 ? ` (${count})` : ""}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {visible.length > 0 ? (
            visible.map((option) => (
              <FilterOption
                key={option.key}
                isChecked={!!applied?.includes(option.key)}
                onClick={() => onToggle(option.key)}
                icon={option.icon}
                title={option.title}
                multiple={option.multiple ?? true}
              />
            ))
          ) : (
            <p className="text-11 text-placeholder italic">{t("common.search.no_matches_found")}</p>
          )}
          {extra}
        </div>
      )}
    </div>
  );
}

type Props = {
  filters: TProjectFilters;
  handleFiltersUpdate: (key: keyof TProjectFilters, value: string | string[]) => void;
  searchQuery: string;
};

export const ProjectCharacteristicsFilters = observer(function ProjectCharacteristicsFilters(props: Props) {
  const { filters, handleFiltersUpdate, searchQuery } = props;
  const { workspaceSlug } = useParams();
  const slug = workspaceSlug?.toString() ?? "";
  const { t } = useTranslation();
  const store = useProjectCharacteristics();
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);

  useSWR(slug ? `GIE_PROJECT_STATUSES_${slug}` : null, () => store.fetchStatuses(slug));
  useSWR(slug ? `GIE_PROJECT_PRIORITIES_${slug}` : null, () => store.fetchPriorities(slug));

  const statuses = store.getStatuses(slug) ?? [];
  const priorities = store.getPriorities(slug) ?? [];
  const noneOption = { key: "none", title: t("gie_project.none") };

  const statusOptions: TOption[] = [
    ...PROJECT_STATUS_GROUPS.flatMap((group) =>
      statuses
        .filter((s) => s.group === group.key)
        .map((s) => ({ key: s.id, title: s.name, icon: <ColorDot color={s.color} /> }))
    ),
    noneOption,
  ];
  const priorityOptions: TOption[] = [
    ...priorities.map((p) => ({
      key: p.id,
      title: p.name,
      icon: p.color ? <ColorDot color={p.color} /> : undefined,
    })),
    noneOption,
  ];
  const deliveryCustom = (filters.estimated_delivery_date ?? []).filter((f) => f.includes(";"));
  const deliveryOptions: TOption[] = PROJECT_DELIVERY_DATE_FILTER_OPTIONS.map((o) => ({
    key: o.key,
    title: t(o.i18n_label),
  }));

  return (
    <>
      {isDateModalOpen && (
        <DateFilterModal
          isOpen={isDateModalOpen}
          handleClose={() => setIsDateModalOpen(false)}
          title={t("gie_project.fields.estimated_delivery_date")}
          // remplace la plage personnalisée précédente
          onSelect={(values) => handleFiltersUpdate("estimated_delivery_date", [...deliveryCustom, ...values])}
        />
      )}
      <FilterSection
        title={t("gie_project.fields.project_status")}
        options={statusOptions}
        applied={filters.project_status}
        onToggle={(key) => handleFiltersUpdate("project_status", key)}
        searchQuery={searchQuery}
      />
      <FilterSection
        title={t("gie_project.fields.project_priority")}
        options={priorityOptions}
        applied={filters.project_priority}
        onToggle={(key) => handleFiltersUpdate("project_priority", key)}
        searchQuery={searchQuery}
      />
      <FilterSection
        title={t("gie_project.fields.estimated_delivery_date")}
        options={deliveryOptions}
        applied={filters.estimated_delivery_date}
        onToggle={(key) => handleFiltersUpdate("estimated_delivery_date", key)}
        searchQuery={searchQuery}
        extra={
          <FilterOption
            isChecked={deliveryCustom.length > 0}
            onClick={() => {
              if (deliveryCustom.length > 0) handleFiltersUpdate("estimated_delivery_date", deliveryCustom);
              else setIsDateModalOpen(true);
            }}
            title={t("gie_project.filters.delivery.custom")}
          />
        }
      />
      <FilterSection
        title={t("gie_project.fields.is_copil")}
        options={[
          { key: "true", title: t("gie_project.yes") },
          { key: "false", title: t("gie_project.no") },
        ]}
        applied={filters.is_copil}
        onToggle={(key) => handleFiltersUpdate("is_copil", key)}
        searchQuery={searchQuery}
      />
      <FilterSection
        title={t("gie_project.fields.progress")}
        options={PROJECT_PROGRESS_FILTER_OPTIONS.map((o) => ({
          key: o.key,
          title: o.min === o.max ? `${o.min} %` : `${o.min} – ${o.max} %`,
        }))}
        applied={filters.progress}
        onToggle={(key) => handleFiltersUpdate("progress", key)}
        searchQuery={searchQuery}
      />
    </>
  );
});
