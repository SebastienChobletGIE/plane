/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// types
import type { IIssueDisplayProperties } from "@plane/types";
// lib
import { store } from "@/lib/store-context";

export const shouldRenderColumn = (key: keyof IIssueDisplayProperties): boolean => {
  const isEstimateEnabled: boolean = store.projectRoot.project.currentProjectDetails?.estimate !== null;
  switch (key) {
    case "estimate":
      return isEstimateEnabled;
    // GIE: charges — masquées si le projet courant ne les active pas (toujours visibles en vue d'espace de travail)
    case "estimated_effort":
    case "actual_effort": {
      const currentProject = store.projectRoot.project.currentProjectDetails;
      return currentProject ? !!currentProject.is_effort_enabled : true;
    }
    default:
      return true;
  }
};
