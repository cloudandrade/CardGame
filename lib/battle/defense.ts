import { getRelativeTargetColumns } from "@/lib/battle/targets";
import type { CardEffect, Column } from "@/lib/types";

const COLS: Column[] = [0, 1, 2];

export interface DefenseBreakdown {
  self: number;
  allyParts: number[];
}

export interface DefenseSource {
  column: Column;
  effects: CardEffect[];
}

/** Defesa aplicável a uma coluna (própria + aliados na fileira). */
export function computeDefenseForColumn(
  sources: (DefenseSource | null)[],
  targetCol: Column,
): DefenseBreakdown {
  let self = 0;
  const allyParts: number[] = [];

  const own = sources[targetCol];
  if (own) {
    for (const effect of own.effects) {
      if (effect.category !== "defense" || effect.variant !== "defense") continue;
      if (effect.orientation !== "down") continue;
      const protectedCols = getRelativeTargetColumns(targetCol, effect.directions);
      if (protectedCols.includes(targetCol)) self += effect.power;
    }
  }

  for (const col of COLS) {
    if (col === targetCol) continue;
    const src = sources[col];
    if (!src) continue;
    for (const effect of src.effects) {
      if (effect.category !== "defense" || effect.variant !== "defense") continue;
      if (effect.orientation !== "down") continue;
      const protectedCols = getRelativeTargetColumns(col, effect.directions);
      if (protectedCols.includes(targetCol)) allyParts.push(effect.power);
    }
  }

  return { self, allyParts };
}

export function totalDefense(breakdown: DefenseBreakdown): number {
  return breakdown.self + breakdown.allyParts.reduce((a, b) => a + b, 0);
}
