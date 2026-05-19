import type { BattleUnit, CardEffect, Column } from "@/lib/types";

/** Colunas alvo relativas à coluna da carta de origem. */
export function getRelativeTargetColumns(
  sourceColumn: Column,
  directions: CardEffect["directions"],
): Column[] {
  const cols = new Set<Column>();

  for (const dir of directions) {
    if (dir === "left" && sourceColumn > 0) cols.add((sourceColumn - 1) as Column);
    if (dir === "middle") cols.add(sourceColumn);
    if (dir === "right" && sourceColumn < 2) cols.add((sourceColumn + 1) as Column);
  }

  if (cols.size === 0) cols.add(sourceColumn);
  return [...cols].sort();
}

export function getAttackTargetColumns(unit: BattleUnit, effect: CardEffect): Column[] {
  if (effect.variant === "group-attack") {
    return [0, 1, 2];
  }

  return getRelativeTargetColumns(unit.column, effect.directions);
}
