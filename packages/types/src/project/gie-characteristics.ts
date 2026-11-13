/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// GIE: caractéristiques des projets (statut, priorité, date de livraison, COPIL, avancement, reste à faire).

export type TProjectStatusGroup = "backlog" | "unstarted" | "started" | "completed" | "cancelled";

export type TProjectStatus = {
  id: string;
  name: string;
  description: string;
  color: string;
  group: TProjectStatusGroup;
  sequence: number;
  default: boolean;
  workspace: string;
};

export type TProjectPriority = {
  id: string;
  name: string;
  color: string;
  sequence: number;
  workspace: string;
};

export type TProjectCharacteristicField =
  | "project_status"
  | "project_priority"
  | "estimated_delivery_date"
  | "is_copil"
  | "remaining_work";

export type TProjectCharacteristics = {
  project_status: string | null;
  project_priority: string | null;
  estimated_delivery_date: string | null;
  is_copil: boolean;
  remaining_work: string;
};

export type TProjectCharacteristicActivity = {
  id: string;
  project: string;
  actor: string | null;
  field: TProjectCharacteristicField;
  verb: "updated" | "removed";
  old_value: string | null;
  new_value: string | null;
  created_at: string;
};

/** Champs affichables sur la page des projets. */
export type TProjectDisplayPropertyKey =
  | "project_status"
  | "project_priority"
  | "estimated_delivery_date"
  | "is_copil"
  | "progress"
  | "remaining_work";

export type TProjectDisplayProperties = Partial<Record<TProjectDisplayPropertyKey, boolean>>;

export type TProjectLayout = "gallery" | "table";
