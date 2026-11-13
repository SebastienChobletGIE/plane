/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// GIE: statuts et priorités de projet, communs à l'espace de travail (administrateur de l'espace uniquement).
import { observer } from "mobx-react";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { ProjectCharacteristicsSettingsRoot } from "@/components/project/gie/settings/root";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
import type { Route } from "./+types/page";
import { ProjectCharacteristicsSettingsHeader } from "./header";

function ProjectCharacteristicsSettingsPage({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;
  const { t } = useTranslation();
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const isWorkspaceAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const pageTitle = currentWorkspace?.name
    ? `${currentWorkspace.name} - ${t("gie_project.settings.title")}`
    : undefined;

  if (workspaceUserInfo && !isWorkspaceAdmin) return <NotAuthorizedView section="settings" className="h-auto" />;

  return (
    <SettingsContentWrapper header={<ProjectCharacteristicsSettingsHeader />}>
      <PageHead title={pageTitle} />
      <div className="w-full">
        <SettingsHeading title={t("gie_project.settings.title")} description={t("gie_project.settings.description")} />
        <div className="mt-6">
          <ProjectCharacteristicsSettingsRoot workspaceSlug={workspaceSlug} />
        </div>
      </div>
    </SettingsContentWrapper>
  );
}

export default observer(ProjectCharacteristicsSettingsPage);
