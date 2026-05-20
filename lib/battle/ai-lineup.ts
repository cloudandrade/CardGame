import { computeLineupPreview } from "@/lib/battle/placement-preview";
import {
  createBattleUnit,
  getAllCardTemplates,
  pickRandomTemplates,
  pickUniqueTemplates,
  randomEnemyPlacement,
} from "@/lib/cards";
import type { BattleUnit, CardTemplate, Column } from "@/lib/types";

const COLS: Column[] = [0, 1, 2];

function permuteAssignments(ids: string[]): Record<Column, string>[] {
  if (ids.length !== 3) return [];
  const [a, b, c] = ids;
  return [
    { 0: a, 1: b, 2: c },
    { 0: a, 1: c, 2: b },
    { 0: b, 1: a, 2: c },
    { 0: b, 1: c, 2: a },
    { 0: c, 1: a, 2: b },
    { 0: c, 1: b, 2: a },
  ];
}

function scorePlacements(
  placements: Record<Column, string | null>,
  getTemplate: (id: string) => CardTemplate | undefined,
): number {
  const preview = computeLineupPreview(placements, getTemplate);
  let score = preview.totalLp * 1.2;

  for (const col of COLS) {
    const pad = preview.pads[col];
    if (!pad) continue;
    score += pad.atk + pad.atkEnchant * 1.5;
    score += pad.defSelf + pad.defAllyParts.reduce((s, n) => s + n, 0);
  }

  return score;
}

function combinations3(pool: CardTemplate[]): CardTemplate[][] {
  const out: CardTemplate[][] = [];
  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      for (let k = j + 1; k < pool.length; k++) {
        out.push([pool[i], pool[j], pool[k]]);
      }
    }
  }
  return out;
}

/** Escolhe 3 cartas e posição com melhor sinergia (preview de combate). */
export function buildEnemyLineup(pool: CardTemplate[]): BattleUnit[] {
  const getTemplate = (id: string) => pool.find((c) => c.id === id);

  if (pool.length < 3) {
    return pool.map((t, i) => createBattleUnit(t, COLS[i] as Column, "enemy"));
  }

  let bestScore = -Infinity;
  let bestPlacements: Record<Column, string> | null = null;

  for (const trio of combinations3(pool)) {
    const ids = trio.map((c) => c.id);
    for (const placements of permuteAssignments(ids)) {
      const score = scorePlacements(placements, getTemplate);
      if (score > bestScore) {
        bestScore = score;
        bestPlacements = placements;
      }
    }
  }

  if (!bestPlacements) {
    const fallback = pool.slice(0, 3);
    return fallback.map((t, i) => createBattleUnit(t, COLS[i], "enemy"));
  }

  return COLS.map((col) => {
    const id = bestPlacements[col];
    const t = getTemplate(id);
    return createBattleUnit(t!, col, "enemy");
  });
}

/** Inimigo fácil: 3 cartas e posição aleatórias. */
export function buildEasyEnemyLineup(pool: CardTemplate[]): BattleUnit[] {
  const source = pool.length >= 3 ? pool : getAllCardTemplates();
  const picks = pickRandomTemplates(3, source);
  return randomEnemyPlacement(picks);
}

/** Usa IA avançada só quando o jogador tem cartas nível 3+ no acervo. */
export function buildEnemyForBattle(
  pool: CardTemplate[],
  smartAi: boolean,
): BattleUnit[] {
  if (smartAi) return buildEnemyLineup(pool);
  return buildEasyEnemyLineup(pool);
}
