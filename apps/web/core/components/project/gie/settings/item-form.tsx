/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// GIE: formulaire de création / modification d'un statut ou d'une priorité de projet.
import { useState } from "react";
import { TwitterPicker } from "react-color";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Input, Popover, TextArea } from "@plane/ui";

export type TCharacteristicItemFormData = { name: string; color: string; description?: string };

type Props = {
  initialData: TCharacteristicItemFormData;
  withDescription?: boolean;
  submitLabel: string;
  onSubmit: (data: TCharacteristicItemFormData) => Promise<void>;
  onCancel: () => void;
};

export function CharacteristicItemForm(props: Props) {
  const { initialData, withDescription = false, submitLabel, onSubmit, onCancel } = props;
  const { t } = useTranslation();
  const [data, setData] = useState<TCharacteristicItemFormData>(initialData);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = data.name.trim();
    if (!name) {
      setError(t("gie_project.settings.errors.name_required"));
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({ ...data, name });
    } catch (err: any) {
      setError(err?.name ? t("gie_project.settings.errors.name_taken") : t("gie_project.settings.errors.generic"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 rounded-sm border border-subtle bg-surface-1 p-3">
      <div className="mt-2 flex-shrink-0" title={t("gie_project.settings.form.color")}>
        <Popover
          button={<span className="block h-5 w-5 rounded-sm" style={{ backgroundColor: data.color || "#60646C" }} />}
          panelClassName="mt-4 -ml-3"
        >
          <TwitterPicker color={data.color} onChange={(value) => setData((prev) => ({ ...prev, color: value.hex }))} />
        </Popover>
      </div>
      <div className="w-full space-y-2">
        <Input
          type="text"
          placeholder={t("gie_project.settings.form.name")}
          value={data.name}
          onChange={(e) => {
            setData((prev) => ({ ...prev, name: e.target.value }));
            setError(null);
          }}
          hasError={!!error}
          className="w-full"
          maxLength={100}
          autoFocus
        />
        {withDescription && (
          <TextArea
            placeholder={t("gie_project.settings.form.description")}
            value={data.description ?? ""}
            onChange={(e) => setData((prev) => ({ ...prev, description: e.target.value }))}
            className="min-h-14 w-full resize-none text-13"
          />
        )}
        {error && <p className="text-12 text-danger-primary">{error}</p>}
        <div className="flex items-center gap-2">
          <Button type="submit" variant="primary" size="lg" disabled={isSubmitting}>
            {submitLabel}
          </Button>
          <Button type="button" variant="secondary" size="lg" disabled={isSubmitting} onClick={onCancel}>
            {t("cancel")}
          </Button>
        </div>
      </div>
    </form>
  );
}
