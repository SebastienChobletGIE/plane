/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// GIE: saisie d'une charge (estimée ou réalisée) en jours, sur le modèle de EstimateDropdown.
import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { usePopper } from "react-popper";
import { Hourglass, Timer } from "lucide-react";
// plane imports
import { useOutsideClickDetector } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
// components
import { DropdownButton } from "./buttons";
import { BUTTON_VARIANTS_WITH_TEXT } from "./constants";
// types
import type { TDropdownProps } from "./types";

export type TEffortField = "estimated_effort" | "actual_effort";

export const EFFORT_FIELD_I18N: Record<TEffortField, string> = {
  estimated_effort: "common.estimated_effort",
  actual_effort: "common.actual_effort",
};

/** Convertit la valeur reçue de l'API (nombre, texte ou vide) en nombre ou null. */
export const parseEffort = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/** Affiche une charge selon la langue, ex. « 2,5 » en français. */
export const formatEffort = (value: number | string | null | undefined, locale?: string): string | null => {
  const parsed = parseEffort(value);
  if (parsed === null) return null;
  return parsed.toLocaleString(locale, { maximumFractionDigits: 2 });
};

export function EffortIcon({ field, className }: { field: TEffortField; className?: string }) {
  const Icon = field === "actual_effort" ? Timer : Hourglass;
  return <Icon className={cn("h-3 w-3 flex-shrink-0", className)} />;
}

type Props = TDropdownProps & {
  field: TEffortField;
  value: number | string | null | undefined;
  onChange: (value: number | null) => void;
  onClose?: () => void;
  renderByDefault?: boolean;
};

export const EffortDropdown = observer(function EffortDropdown(props: Props) {
  const {
    field,
    value,
    onChange,
    onClose,
    buttonClassName,
    buttonContainerClassName,
    buttonVariant,
    className = "",
    disabled = false,
    hideIcon = false,
    placeholder,
    placement,
    showTooltip = false,
    tabIndex,
    renderByDefault = true,
  } = props;
  const { t, currentLocale } = useTranslation();
  // states
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState(false);
  // refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  // popper
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: placement ?? "bottom-start",
    strategy: "fixed",
    modifiers: [{ name: "preventOverflow", options: { padding: 12 } }],
  });

  const label = t(EFFORT_FIELD_I18N[field]);
  const unit = t("common.effort_unit");
  const formatted = formatEffort(value, currentLocale);
  const displayValue = formatted !== null ? `${formatted} ${unit}` : null;

  const close = () => {
    setIsOpen(false);
    setError(false);
    onClose?.();
  };

  const open = () => {
    if (disabled) return;
    const current = parseEffort(value);
    setDraft(current === null ? "" : String(current));
    setError(false);
    setIsOpen(true);
  };

  const save = () => {
    const raw = draft.trim().replace(",", ".");
    if (raw === "") {
      if (parseEffort(value) !== null) onChange(null);
      close();
      return;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed >= 100000) {
      setError(true);
      return;
    }
    const rounded = Math.round(parsed * 100) / 100;
    if (rounded !== parseEffort(value)) onChange(rounded);
    close();
  };

  useOutsideClickDetector(containerRef, () => {
    if (isOpen) close();
  });

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  return (
    // oxlint-disable-next-line jsx_a11y/no-static-element-interactions
    <div
      ref={containerRef}
      tabIndex={tabIndex}
      className={cn("h-full w-full", className)}
      onKeyDown={(e) => {
        if (e.key === "Escape" && isOpen) {
          e.stopPropagation();
          close();
        }
      }}
    >
      <button
        ref={setReferenceElement}
        type="button"
        className={cn(
          "clickable block h-full max-w-full outline-none",
          { "cursor-not-allowed text-secondary": disabled, "cursor-pointer": !disabled },
          buttonContainerClassName
        )}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (isOpen) close();
          else open();
        }}
        disabled={disabled}
      >
        <DropdownButton
          className={buttonClassName}
          isActive={isOpen}
          tooltipHeading={label}
          tooltipContent={displayValue ?? t("common.none")}
          showTooltip={showTooltip}
          variant={buttonVariant}
          renderToolTipByDefault={renderByDefault}
        >
          {!hideIcon && <EffortIcon field={field} />}
          {BUTTON_VARIANTS_WITH_TEXT.includes(buttonVariant) && (displayValue || placeholder) && (
            <span className="truncate">{displayValue ?? <span className="text-placeholder">{placeholder}</span>}</span>
          )}
        </DropdownButton>
      </button>
      {isOpen && (
        <div
          ref={setPopperElement}
          style={styles.popper}
          {...attributes.popper}
          className="z-30 my-1 w-48 rounded-sm border-[0.5px] border-strong bg-surface-1 px-2 py-2.5 text-11 shadow-raised-200"
          data-prevent-outside-click
        >
          <label className="mb-1.5 block text-secondary" htmlFor={`effort-input-${field}`}>
            {label} ({unit})
          </label>
          <input
            id={`effort-input-${field}`}
            ref={inputRef}
            type="text"
            inputMode="decimal"
            className={cn(
              "w-full rounded-sm border bg-surface-2 px-2 py-1 text-11 text-primary focus:outline-none",
              error ? "border-red-500" : "border-subtle"
            )}
            value={draft}
            placeholder="0"
            onChange={(e) => {
              setDraft(e.target.value);
              setError(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                save();
              }
            }}
            onClick={(e) => e.stopPropagation()}
          />
          {error && <p className="text-red-500 mt-1">{t("common.effort_invalid")}</p>}
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              className="rounded-sm px-2 py-0.5 text-secondary hover:bg-layer-transparent-hover"
              onClick={(e) => {
                e.stopPropagation();
                close();
              }}
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              className="rounded-sm bg-accent-primary px-2 py-0.5 text-on-color hover:opacity-90"
              onClick={(e) => {
                e.stopPropagation();
                save();
              }}
            >
              {t("save")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
