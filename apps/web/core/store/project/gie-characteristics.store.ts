/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// GIE: listes de statuts / priorités de projet de l'espace de travail, saisie des valeurs d'un projet, historique.
import { set, sortBy } from "lodash-es";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import type {
  TProjectCharacteristicActivity,
  TProjectCharacteristics,
  TProjectPriority,
  TProjectStatus,
} from "@plane/types";
import { ProjectCharacteristicsService } from "@/services/project/gie-characteristics.service";
import type { CoreRootStore } from "../root.store";

export interface IProjectCharacteristicsStore {
  statusMap: Record<string, Record<string, TProjectStatus>>;
  priorityMap: Record<string, Record<string, TProjectPriority>>;
  activityMap: Record<string, TProjectCharacteristicActivity[]>;
  // getters
  getStatuses: (workspaceSlug: string) => TProjectStatus[] | undefined;
  getPriorities: (workspaceSlug: string) => TProjectPriority[] | undefined;
  getStatusById: (workspaceSlug: string, id: string | null | undefined) => TProjectStatus | undefined;
  getPriorityById: (workspaceSlug: string, id: string | null | undefined) => TProjectPriority | undefined;
  getActivities: (projectId: string) => TProjectCharacteristicActivity[] | undefined;
  // actions
  fetchStatuses: (workspaceSlug: string) => Promise<TProjectStatus[]>;
  fetchPriorities: (workspaceSlug: string) => Promise<TProjectPriority[]>;
  createStatus: (workspaceSlug: string, data: Partial<TProjectStatus>) => Promise<TProjectStatus>;
  updateStatus: (workspaceSlug: string, id: string, data: Partial<TProjectStatus>) => Promise<TProjectStatus>;
  deleteStatus: (workspaceSlug: string, id: string) => Promise<void>;
  markStatusAsDefault: (workspaceSlug: string, id: string) => Promise<void>;
  createPriority: (workspaceSlug: string, data: Partial<TProjectPriority>) => Promise<TProjectPriority>;
  updatePriority: (workspaceSlug: string, id: string, data: Partial<TProjectPriority>) => Promise<TProjectPriority>;
  deletePriority: (workspaceSlug: string, id: string) => Promise<void>;
  movePriority: (workspaceSlug: string, id: string, direction: "up" | "down") => Promise<void>;
  moveStatus: (workspaceSlug: string, id: string, direction: "up" | "down") => Promise<void>;
  updateProjectCharacteristics: (
    workspaceSlug: string,
    projectId: string,
    data: Partial<TProjectCharacteristics>
  ) => Promise<TProjectCharacteristics>;
  fetchActivities: (workspaceSlug: string, projectId: string) => Promise<TProjectCharacteristicActivity[]>;
}

/** Nouvelle valeur de `sequence` pour déplacer un élément d'un cran dans une liste triée. */
const computeMovedSequence = <T extends { id: string; sequence: number }>(
  list: T[],
  id: string,
  direction: "up" | "down"
): number | undefined => {
  const index = list.findIndex((item) => item.id === id);
  if (index < 0) return;
  if (direction === "up") {
    if (index === 0) return;
    const before = list[index - 2];
    const target = list[index - 1];
    return before ? (before.sequence + target.sequence) / 2 : target.sequence - 15000;
  }
  if (index === list.length - 1) return;
  const target = list[index + 1];
  const after = list[index + 2];
  return after ? (target.sequence + after.sequence) / 2 : target.sequence + 15000;
};

export class ProjectCharacteristicsStore implements IProjectCharacteristicsStore {
  statusMap: Record<string, Record<string, TProjectStatus>> = {};
  priorityMap: Record<string, Record<string, TProjectPriority>> = {};
  activityMap: Record<string, TProjectCharacteristicActivity[]> = {};
  rootStore: CoreRootStore;
  service: ProjectCharacteristicsService;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      statusMap: observable,
      priorityMap: observable,
      activityMap: observable,
      fetchStatuses: action,
      fetchPriorities: action,
      createStatus: action,
      updateStatus: action,
      deleteStatus: action,
      markStatusAsDefault: action,
      createPriority: action,
      updatePriority: action,
      deletePriority: action,
      updateProjectCharacteristics: action,
      fetchActivities: action,
    });
    this.rootStore = _rootStore;
    this.service = new ProjectCharacteristicsService();
  }

  // getters
  getStatuses = computedFn((workspaceSlug: string) => {
    const map = this.statusMap[workspaceSlug];
    return map ? sortBy(Object.values(map), "sequence") : undefined;
  });

  getPriorities = computedFn((workspaceSlug: string) => {
    const map = this.priorityMap[workspaceSlug];
    return map ? sortBy(Object.values(map), "sequence") : undefined;
  });

  getStatusById = computedFn((workspaceSlug: string, id: string | null | undefined) =>
    id ? this.statusMap[workspaceSlug]?.[id] : undefined
  );

  getPriorityById = computedFn((workspaceSlug: string, id: string | null | undefined) =>
    id ? this.priorityMap[workspaceSlug]?.[id] : undefined
  );

  getActivities = computedFn((projectId: string) => this.activityMap[projectId]);

  // statuts
  fetchStatuses = async (workspaceSlug: string) => {
    const statuses = await this.service.getStatuses(workspaceSlug);
    runInAction(() => {
      this.statusMap[workspaceSlug] = Object.fromEntries(statuses.map((s) => [s.id, s]));
    });
    return statuses;
  };

  createStatus = async (workspaceSlug: string, data: Partial<TProjectStatus>) => {
    const status = await this.service.createStatus(workspaceSlug, data);
    runInAction(() => set(this.statusMap, [workspaceSlug, status.id], status));
    return status;
  };

  updateStatus = async (workspaceSlug: string, id: string, data: Partial<TProjectStatus>) => {
    const status = await this.service.updateStatus(workspaceSlug, id, data);
    runInAction(() => set(this.statusMap, [workspaceSlug, status.id], status));
    return status;
  };

  deleteStatus = async (workspaceSlug: string, id: string) => {
    await this.service.deleteStatus(workspaceSlug, id);
    runInAction(() => {
      delete this.statusMap[workspaceSlug]?.[id];
    });
  };

  markStatusAsDefault = async (workspaceSlug: string, id: string) => {
    await this.service.markStatusAsDefault(workspaceSlug, id);
    runInAction(() => {
      Object.values(this.statusMap[workspaceSlug] ?? {}).forEach((s) => (s.default = s.id === id));
    });
  };

  moveStatus = async (workspaceSlug: string, id: string, direction: "up" | "down") => {
    // déplacement à l'intérieur du groupe, comme pour les statuts des work items
    const group = this.statusMap[workspaceSlug]?.[id]?.group;
    const groupStatuses = (this.getStatuses(workspaceSlug) ?? []).filter((s) => s.group === group);
    const sequence = computeMovedSequence(groupStatuses, id, direction);
    if (sequence !== undefined) await this.updateStatus(workspaceSlug, id, { sequence });
  };

  // priorités
  fetchPriorities = async (workspaceSlug: string) => {
    const priorities = await this.service.getPriorities(workspaceSlug);
    runInAction(() => {
      this.priorityMap[workspaceSlug] = Object.fromEntries(priorities.map((p) => [p.id, p]));
    });
    return priorities;
  };

  createPriority = async (workspaceSlug: string, data: Partial<TProjectPriority>) => {
    const priority = await this.service.createPriority(workspaceSlug, data);
    runInAction(() => set(this.priorityMap, [workspaceSlug, priority.id], priority));
    return priority;
  };

  updatePriority = async (workspaceSlug: string, id: string, data: Partial<TProjectPriority>) => {
    const priority = await this.service.updatePriority(workspaceSlug, id, data);
    runInAction(() => set(this.priorityMap, [workspaceSlug, priority.id], priority));
    return priority;
  };

  deletePriority = async (workspaceSlug: string, id: string) => {
    await this.service.deletePriority(workspaceSlug, id);
    runInAction(() => {
      delete this.priorityMap[workspaceSlug]?.[id];
    });
  };

  movePriority = async (workspaceSlug: string, id: string, direction: "up" | "down") => {
    const sequence = computeMovedSequence(this.getPriorities(workspaceSlug) ?? [], id, direction);
    if (sequence !== undefined) await this.updatePriority(workspaceSlug, id, { sequence });
  };

  // valeurs d'un projet
  updateProjectCharacteristics = async (
    workspaceSlug: string,
    projectId: string,
    data: Partial<TProjectCharacteristics>
  ) => {
    const response = await this.service.updateCharacteristics(workspaceSlug, projectId, data);
    runInAction(() => {
      const project = this.rootStore.projectRoot.project.projectMap[projectId];
      if (project) Object.assign(project, response);
    });
    // l'historique est rechargé pour afficher la modification
    void this.fetchActivities(workspaceSlug, projectId);
    return response;
  };

  fetchActivities = async (workspaceSlug: string, projectId: string) => {
    const activities = await this.service.getActivities(workspaceSlug, projectId);
    runInAction(() => {
      this.activityMap[projectId] = activities;
    });
    return activities;
  };
}
