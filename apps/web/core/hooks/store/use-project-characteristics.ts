/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// GIE: accès au store des caractéristiques de projet.
import { useContext } from "react";
import { StoreContext } from "@/lib/store-context";
import type { IProjectCharacteristicsStore } from "@/store/project/gie-characteristics.store";

export const useProjectCharacteristics = (): IProjectCharacteristicsStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useProjectCharacteristics must be used within StoreProvider");
  return context.projectRoot.characteristics;
};
