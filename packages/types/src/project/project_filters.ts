/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TProjectDisplayProperties, TProjectLayout } from "./gie-characteristics";

export type TProjectOrderByOptions =
  | "sort_order"
  | "name"
  | "-name"
  | "created_at"
  | "-created_at"
  | "members_length"
  | "-members_length"
  // GIE: tris sur les caractéristiques
  | "project_status"
  | "-project_status"
  | "project_priority"
  | "-project_priority"
  | "estimated_delivery_date"
  | "-estimated_delivery_date"
  | "is_copil"
  | "-is_copil"
  | "progress"
  | "-progress";

export type TProjectDisplayFilters = {
  my_projects?: boolean;
  archived_projects?: boolean;
  order_by?: TProjectOrderByOptions;
  // GIE: disposition et champs affichés
  layout?: TProjectLayout;
  display_properties?: TProjectDisplayProperties;
};

export type TProjectAppliedDisplayFilterKeys = "my_projects" | "archived_projects";

export type TProjectFilters = {
  access?: string[] | null;
  lead?: string[] | null;
  members?: string[] | null;
  created_at?: string[] | null;
  // GIE: filtres sur les caractéristiques
  project_status?: string[] | null;
  project_priority?: string[] | null;
  estimated_delivery_date?: string[] | null;
  is_copil?: string[] | null;
  progress?: string[] | null;
};

export type TProjectStoredFilters = {
  display_filters?: TProjectDisplayFilters;
  filters?: TProjectFilters;
};
