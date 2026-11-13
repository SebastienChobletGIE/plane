/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// GIE: appels API des caractéristiques de projet.
import { API_BASE_URL } from "@plane/constants";
import type {
  TProjectCharacteristicActivity,
  TProjectCharacteristics,
  TProjectPriority,
  TProjectStatus,
} from "@plane/types";
import { APIService } from "@/services/api.service";

export class ProjectCharacteristicsService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  private async run<T>(request: Promise<{ data: T }>): Promise<T> {
    try {
      const response = await request;
      return response?.data;
    } catch (error: any) {
      throw error?.response?.data;
    }
  }

  // statuts
  getStatuses = (slug: string) => this.run<TProjectStatus[]>(this.get(`/api/workspaces/${slug}/project-statuses/`));
  createStatus = (slug: string, data: Partial<TProjectStatus>) =>
    this.run<TProjectStatus>(this.post(`/api/workspaces/${slug}/project-statuses/`, data));
  updateStatus = (slug: string, id: string, data: Partial<TProjectStatus>) =>
    this.run<TProjectStatus>(this.patch(`/api/workspaces/${slug}/project-statuses/${id}/`, data));
  deleteStatus = (slug: string, id: string) =>
    this.run<void>(this.delete(`/api/workspaces/${slug}/project-statuses/${id}/`));
  markStatusAsDefault = (slug: string, id: string) =>
    this.run<void>(this.post(`/api/workspaces/${slug}/project-statuses/${id}/mark-default/`, {}));

  // priorités
  getPriorities = (slug: string) =>
    this.run<TProjectPriority[]>(this.get(`/api/workspaces/${slug}/project-priorities/`));
  createPriority = (slug: string, data: Partial<TProjectPriority>) =>
    this.run<TProjectPriority>(this.post(`/api/workspaces/${slug}/project-priorities/`, data));
  updatePriority = (slug: string, id: string, data: Partial<TProjectPriority>) =>
    this.run<TProjectPriority>(this.patch(`/api/workspaces/${slug}/project-priorities/${id}/`, data));
  deletePriority = (slug: string, id: string) =>
    this.run<void>(this.delete(`/api/workspaces/${slug}/project-priorities/${id}/`));

  // valeurs d'un projet et historique
  updateCharacteristics = (slug: string, projectId: string, data: Partial<TProjectCharacteristics>) =>
    this.run<TProjectCharacteristics>(
      this.patch(`/api/workspaces/${slug}/projects/${projectId}/characteristics/`, data)
    );
  getActivities = (slug: string, projectId: string) =>
    this.run<TProjectCharacteristicActivity[]>(
      this.get(`/api/workspaces/${slug}/projects/${projectId}/characteristics/activities/`)
    );
}
