/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// GIE: gestion des statuts (par groupe, comme les statuts des work items) et des priorités de projet.
import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { ArrowDown, ArrowUp, Pencil, Plus, Star, Trash2 } from "lucide-react";
// plane imports
import { PROJECT_STATUS_GROUPS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TProjectPriority, TProjectStatus, TProjectStatusGroup } from "@plane/types";
import { AlertModalCore, Loader } from "@plane/ui";
// hooks
import { useProjectCharacteristics } from "@/hooks/store/use-project-characteristics";
// local imports
import { CharacteristicItemForm } from "./item-form";

type TDeleteTarget = { kind: "status" | "priority"; id: string; name: string } | null;

function IconButton(props: { title: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  const { title, onClick, disabled = false, children } = props;
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className="grid h-6 w-6 place-items-center rounded-sm text-tertiary hover:bg-layer-1 hover:text-secondary disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export const ProjectCharacteristicsSettingsRoot = observer(function ProjectCharacteristicsSettingsRoot(props: {
  workspaceSlug: string;
}) {
  const { workspaceSlug } = props;
  const { t } = useTranslation();
  const store = useProjectCharacteristics();
  // states
  const [creatingInGroup, setCreatingInGroup] = useState<TProjectStatusGroup | null>(null);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [isCreatingPriority, setIsCreatingPriority] = useState(false);
  const [editingPriorityId, setEditingPriorityId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TDeleteTarget>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useSWR(`GIE_PROJECT_STATUSES_${workspaceSlug}`, () => store.fetchStatuses(workspaceSlug));
  useSWR(`GIE_PROJECT_PRIORITIES_${workspaceSlug}`, () => store.fetchPriorities(workspaceSlug));

  const statuses = store.getStatuses(workspaceSlug);
  const priorities = store.getPriorities(workspaceSlug);

  const showError = (message: string) => setToast({ type: TOAST_TYPE.ERROR, title: t("error"), message });

  const runSafely = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
    } catch {
      showError(t("gie_project.settings.errors.generic"));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.kind === "status") await store.deleteStatus(workspaceSlug, deleteTarget.id);
      else await store.deletePriority(workspaceSlug, deleteTarget.id);
      setDeleteTarget(null);
    } catch (error: any) {
      const message: string = error?.error ?? "";
      if (message.includes("default")) showError(t("gie_project.settings.errors.delete_default"));
      else if (message.includes("used")) showError(t("gie_project.settings.errors.delete_used"));
      else showError(t("gie_project.settings.errors.generic"));
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const renderStatus = (status: TProjectStatus, index: number, groupStatuses: TProjectStatus[]) => {
    if (editingStatusId === status.id)
      return (
        <CharacteristicItemForm
          key={status.id}
          withDescription
          initialData={{ name: status.name, color: status.color, description: status.description }}
          submitLabel={t("update")}
          onCancel={() => setEditingStatusId(null)}
          onSubmit={async (data) => {
            await store.updateStatus(workspaceSlug, status.id, data);
            setEditingStatusId(null);
          }}
        />
      );
    return (
      <div key={status.id} className="flex items-center gap-3 rounded-sm border border-subtle bg-layer-1 px-3 py-2">
        <span className="h-3.5 w-3.5 flex-shrink-0 rounded-full" style={{ backgroundColor: status.color }} />
        <div className="min-w-0 flex-grow">
          <div className="flex items-center gap-2">
            <span className="truncate text-13 font-medium text-primary">{status.name}</span>
            {status.default && (
              <span className="rounded-sm bg-layer-2 px-1.5 py-0.5 text-11 text-secondary">
                {t("gie_project.settings.statuses.default")}
              </span>
            )}
          </div>
          {status.description && <p className="truncate text-12 text-tertiary">{status.description}</p>}
        </div>
        <div className="flex flex-shrink-0 items-center gap-1">
          <IconButton
            title={t("gie_project.settings.move_up")}
            disabled={index === 0}
            onClick={() => runSafely(() => store.moveStatus(workspaceSlug, status.id, "up"))}
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </IconButton>
          <IconButton
            title={t("gie_project.settings.move_down")}
            disabled={index === groupStatuses.length - 1}
            onClick={() => runSafely(() => store.moveStatus(workspaceSlug, status.id, "down"))}
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </IconButton>
          <IconButton
            title={t("gie_project.settings.statuses.mark_default")}
            disabled={status.default}
            onClick={() => runSafely(() => store.markStatusAsDefault(workspaceSlug, status.id))}
          >
            <Star className="h-3.5 w-3.5" />
          </IconButton>
          <IconButton title={t("edit")} onClick={() => setEditingStatusId(status.id)}>
            <Pencil className="h-3.5 w-3.5" />
          </IconButton>
          <IconButton
            title={t("delete")}
            disabled={status.default}
            onClick={() => setDeleteTarget({ kind: "status", id: status.id, name: status.name })}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </IconButton>
        </div>
      </div>
    );
  };

  const renderPriority = (priority: TProjectPriority, index: number, list: TProjectPriority[]) => {
    if (editingPriorityId === priority.id)
      return (
        <CharacteristicItemForm
          key={priority.id}
          initialData={{ name: priority.name, color: priority.color }}
          submitLabel={t("update")}
          onCancel={() => setEditingPriorityId(null)}
          onSubmit={async (data) => {
            await store.updatePriority(workspaceSlug, priority.id, { name: data.name, color: data.color });
            setEditingPriorityId(null);
          }}
        />
      );
    return (
      <div key={priority.id} className="flex items-center gap-3 rounded-sm border border-subtle bg-layer-1 px-3 py-2">
        <span
          className="h-3.5 w-3.5 flex-shrink-0 rounded-full border border-subtle"
          style={{ backgroundColor: priority.color || "transparent" }}
        />
        <span className="min-w-0 flex-grow truncate text-13 font-medium text-primary">{priority.name}</span>
        <div className="flex flex-shrink-0 items-center gap-1">
          <IconButton
            title={t("gie_project.settings.move_up")}
            disabled={index === 0}
            onClick={() => runSafely(() => store.movePriority(workspaceSlug, priority.id, "up"))}
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </IconButton>
          <IconButton
            title={t("gie_project.settings.move_down")}
            disabled={index === list.length - 1}
            onClick={() => runSafely(() => store.movePriority(workspaceSlug, priority.id, "down"))}
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </IconButton>
          <IconButton title={t("edit")} onClick={() => setEditingPriorityId(priority.id)}>
            <Pencil className="h-3.5 w-3.5" />
          </IconButton>
          <IconButton
            title={t("delete")}
            onClick={() => setDeleteTarget({ kind: "priority", id: priority.id, name: priority.name })}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </IconButton>
        </div>
      </div>
    );
  };

  return (
    <div className="flex w-full flex-col gap-10">
      <AlertModalCore
        isOpen={!!deleteTarget}
        handleClose={() => setDeleteTarget(null)}
        handleSubmit={handleDelete}
        isSubmitting={isDeleting}
        title={t("delete")}
        content={<>{t("gie_project.settings.delete_confirm", { name: deleteTarget?.name ?? "" })}</>}
      />

      {/* statuts */}
      <section className="flex flex-col gap-4">
        <div>
          <h4 className="text-14 font-semibold text-primary">{t("gie_project.settings.statuses.title")}</h4>
          <p className="text-13 text-tertiary">{t("gie_project.settings.statuses.description")}</p>
        </div>
        {!statuses ? (
          <Loader className="space-y-2">
            <Loader.Item height="40px" />
            <Loader.Item height="40px" />
          </Loader>
        ) : (
          PROJECT_STATUS_GROUPS.map((group) => {
            const groupStatuses = statuses.filter((s) => s.group === group.key);
            return (
              <div key={group.key} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-13 font-medium text-secondary">{t(group.i18n_label)}</span>
                  <IconButton
                    title={t("gie_project.settings.statuses.add")}
                    onClick={() => setCreatingInGroup(group.key)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </IconButton>
                </div>
                {creatingInGroup === group.key && (
                  <CharacteristicItemForm
                    withDescription
                    initialData={{ name: "", color: group.color, description: "" }}
                    submitLabel={t("add")}
                    onCancel={() => setCreatingInGroup(null)}
                    onSubmit={async (data) => {
                      await store.createStatus(workspaceSlug, { ...data, group: group.key });
                      setCreatingInGroup(null);
                    }}
                  />
                )}
                {groupStatuses.map((status, index) => renderStatus(status, index, groupStatuses))}
              </div>
            );
          })
        )}
      </section>

      {/* priorités */}
      <section className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h4 className="text-14 font-semibold text-primary">{t("gie_project.settings.priorities.title")}</h4>
            <p className="text-13 text-tertiary">{t("gie_project.settings.priorities.description")}</p>
          </div>
          <IconButton title={t("gie_project.settings.priorities.add")} onClick={() => setIsCreatingPriority(true)}>
            <Plus className="h-3.5 w-3.5" />
          </IconButton>
        </div>
        {isCreatingPriority && (
          <CharacteristicItemForm
            initialData={{ name: "", color: "" }}
            submitLabel={t("add")}
            onCancel={() => setIsCreatingPriority(false)}
            onSubmit={async (data) => {
              await store.createPriority(workspaceSlug, { name: data.name, color: data.color });
              setIsCreatingPriority(false);
            }}
          />
        )}
        {!priorities ? (
          <Loader className="space-y-2">
            <Loader.Item height="40px" />
          </Loader>
        ) : priorities.length === 0 && !isCreatingPriority ? (
          <p className="text-13 text-placeholder italic">{t("gie_project.settings.priorities.empty")}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {priorities.map((priority, index) => renderPriority(priority, index, priorities))}
          </div>
        )}
      </section>
    </div>
  );
});
