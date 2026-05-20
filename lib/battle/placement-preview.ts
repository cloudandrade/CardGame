import { computeDefenseForColumn } from "@/lib/battle/defense";
import { getRelativeTargetColumns } from "@/lib/battle/targets";
import type { CardEffect, CardTemplate, Column } from "@/lib/types";

const COLS: Column[] = [0, 1, 2];

export interface PadCombatPreview {
  cardId: string;
  name: string;
  lp: number;
  /** Cura da rodada 1 (efeito heal de aliados). */
  lpHeal: number;
  atk: number;
  atkEnchant: number;
  defSelf: number;
  /** Bônus de defesa de aliados, por coluna (esq → dir). */
  defAllyParts: number[];
}

export interface LineupPreview {
  pads: Record<Column, PadCombatPreview | null>;
  totalLp: number;
}

function attackPowerFromEffects(effects: CardEffect[]): number {
  let total = 0;
  for (const effect of effects) {
    if (effect.category !== "attack" || effect.orientation !== "up") continue;
    let power = effect.power;
    if (effect.variant === "attack-double") power *= 2;
    total += power;
  }
  return total;
}

function enchantBonusForColumn(
  placements: Record<Column, string | null>,
  getTemplate: (id: string) => CardTemplate | undefined,
  targetCol: Column,
): number {
  let bonus = 0;
  for (const col of COLS) {
    const id = placements[col];
    if (!id) continue;
    const card = getTemplate(id);
    if (!card) continue;
    for (const effect of card.effects) {
      if (effect.category !== "magic" || effect.variant !== "enchant") continue;
      const targets = getRelativeTargetColumns(col, effect.directions);
      if (targets.includes(targetCol)) bonus += effect.power;
    }
  }
  return bonus;
}

function healBonusForColumn(
  placements: Record<Column, string | null>,
  getTemplate: (id: string) => CardTemplate | undefined,
  targetCol: Column,
): number {
  let heal = 0;
  for (const col of COLS) {
    const id = placements[col];
    if (!id) continue;
    const card = getTemplate(id);
    if (!card) continue;
    for (const effect of card.effects) {
      if (effect.category !== "magic" || effect.variant !== "heal") continue;
      const targets = getRelativeTargetColumns(col, effect.directions);
      if (targets.includes(targetCol)) heal += effect.power;
    }
  }
  return heal;
}

function defenseForColumn(
  placements: Record<Column, string | null>,
  getTemplate: (id: string) => CardTemplate | undefined,
  targetCol: Column,
): { self: number; allyParts: number[] } {
  const sources = COLS.map((col) => {
    const id = placements[col];
    if (!id) return null;
    const card = getTemplate(id);
    return card ? { column: col, effects: card.effects } : null;
  });
  return computeDefenseForColumn(sources, targetCol);
}

export function computeLineupPreview(
  placements: Record<Column, string | null>,
  getTemplate: (id: string) => CardTemplate | undefined,
): LineupPreview {
  const pads = {} as Record<Column, PadCombatPreview | null>;
  let totalLp = 0;

  for (const col of COLS) {
    const id = placements[col];
    if (!id) {
      pads[col] = null;
      continue;
    }
    const card = getTemplate(id);
    if (!card) {
      pads[col] = null;
      continue;
    }

    const lpHeal = healBonusForColumn(placements, getTemplate, col);
    const atkEnchant = enchantBonusForColumn(placements, getTemplate, col);
    const { self: defSelf, allyParts: defAllyParts } = defenseForColumn(
      placements,
      getTemplate,
      col,
    );

    const preview: PadCombatPreview = {
      cardId: id,
      name: card.name,
      lp: card.stats.hp,
      lpHeal,
      atk: attackPowerFromEffects(card.effects),
      atkEnchant,
      defSelf,
      defAllyParts,
    };
    pads[col] = preview;
    totalLp += preview.lp + preview.lpHeal;
  }

  return { pads, totalLp };
}

export function formatDefPreview(defSelf: number, defAllyParts: number[]): string {
  const parts: number[] = [];
  if (defSelf > 0) parts.push(defSelf);
  parts.push(...defAllyParts);
  if (parts.length === 0) return "—";
  return parts.join("+");
}
