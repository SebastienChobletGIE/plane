/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// GIE: menu « Affichage » de la page des projets : disposition (cartes / tableau) et champs affichés.
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { LayoutGrid, Settings2, Table2 } from "lucide-react";
import { PROJECT_DISPLAY_PROPERTIES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TProjectDisplayPropertyKey, TProjectLayout } from "@plane/types";
import { cn } from "@plane/utils";
import { FiltersDropdown } from "@/components/issues/issue-layouts/filters";
import { useProjectFilter } from "@/hooks/store/use-project-filter";

const LAYOUTS: { key: TProjectLayout; i18n_label: string; Icon: typeof LayoutGrid }[] = [
  { key: "gallery", i18n_label: "gie_project.layout.gallery", Icon: LayoutGrid },
  { key: "table", i18n_label: "gie_project.layout.table", Icon: Table2 },
];

export const ProjectDisplayDropdown = observer(function ProjectDisplayDropdown() {
  const { workspaceSlug } = useParams();
  const { t } = useTranslation();
  const { currentWorkspaceDisplayFilters: displayFilters, updateDisplayFilters } = useProjectFilter();
  const layout = displayFilters?.layout ?? "gallery";
  const properties = displayFilters?.display_properties ?? {};

  const toggleProperty = (key: TProjectDisplayPropertyKey) => {
    if (!workspaceSlug) return;
    updateDisplayFilters(workspaceSlug.toString(), {
      display_properties: { ...properties, [key]: !properties[key] },
    });
  };

  return (
    <FiltersDropdown
      icon={<Settings2 className="h-3 w-3" />}
      title={t("gie_project.display.title")}
      placement="bottom-end"
    >
      <div className="flex flex-col gap-3 p-2.5">
        <div className="flex flex-col gap-1.5">
          <span className="text-11 font-medium text-tertiary">{t("gie_project.layout.title")}</span>
          <div className="flex gap-1.5">
            {LAYOUTS.map(({ key, i18n_label, Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => workspaceSlug && updateDisplayFilters(workspaceSlug.toString(), { layout: key })}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-sm border px-2 py-1 text-12",
                  layout === key
                    ? "border-accent-strong bg-accent-primary/10 text-accent-primary"
                    : "border-subtle text-secondary hover:bg-layer-1"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t(i18n_label)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-11 font-medium text-tertiary">{t("gie_project.display.properties")}</span>
          <div className="flex flex-wrap gap-1.5">
            {PROJECT_DISPLAY_PROPERTIES.map((property) => (
              <button
                key={property.key}
                type="button"
                onClick={() => toggleProperty(property.key)}
                className={cn(
                  "rounded-sm border px-2 py-0.5 text-11 transition-all",
                  properties[property.key]
                    ? "border-accent-strong bg-accent-primary text-on-color"
                    : "border-subtle text-secondary hover:bg-layer-1"
                )}
              >
                {t(property.i18n_label)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </FiltersDropdown>
  );
});
