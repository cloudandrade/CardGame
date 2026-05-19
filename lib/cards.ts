import catalogData from "@/data/cards/catalog.json";
import type { BattleUnit, CardTemplate, Column, Row } from "@/lib/types";

const templates = catalogData.cards as CardTemplate[];

export function getAllCardTemplates(): CardTemplate[] {
  return templates;
}

export function getCardTemplate(id: string): CardTemplate | undefined {
  return templates.find((c) => c.id === id);
}

export function getStarterHand(unlockedIds?: string[]): CardTemplate[] {
  const pool = unlockedIds
    ? templates.filter((c) => unlockedIds.includes(c.id))
    : templates;
  return pool.slice(0, 6);
}

export function searchCards(query: string, limit = 50): CardTemplate[] {
  const q = query.trim().toLowerCase();
  if (!q) return templates.slice(0, limit);
  return templates
    .filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.race.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q),
    )
    .slice(0, limit);
}

export function createBattleUnit(
  template: CardTemplate,
  column: Column,
  row: Row,
  instanceId?: string,
): BattleUnit {
  return {
    instanceId:
      instanceId ?? `${template.id}-${row}-${column}-${Math.random().toString(36).slice(2, 8)}`,
    templateId: template.id,
    name: template.name,
    race: template.race,
    cardType: template.cardType,
    description: template.description,
    effectSummary: template.effectSummary,
    artUrl: template.artUrl,
    level: template.level,
    emoji: template.emoji,
    stats: { ...template.stats },
    maxHp: template.stats.hp,
    currentHp: template.stats.hp,
    column,
    row,
    effects: template.effects.map((e) => ({ ...e })),
    enchantBonus: 0,
  };
}

export function pickRandomTemplates(count: number, pool?: CardTemplate[]): CardTemplate[] {
  const source = pool && pool.length > 0 ? pool : templates;
  const shuffled = [...source].sort(() => Math.random() - 0.5);
  const picked: CardTemplate[] = [];
  for (let i = 0; i < count; i++) {
    picked.push(shuffled[i % shuffled.length]);
  }
  return picked;
}

export function randomEnemyPlacement(cards: CardTemplate[]): BattleUnit[] {
  const cols: Column[] = [0, 1, 2];
  const shuffledCols = [...cols].sort(() => Math.random() - 0.5);
  return cards.map((t, i) => createBattleUnit(t, shuffledCols[i], "enemy"));
}
