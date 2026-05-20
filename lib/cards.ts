import catalogData from "@/data/cards/catalog.json";
import type { BattleUnit, CardEffect, CardStats, CardTemplate, Column, Row } from "@/lib/types";
import type { EffectPowerRef } from "@/lib/types";

interface RawCardEffect {
  orientation: CardEffect["orientation"];
  category: CardEffect["category"];
  variant: CardEffect["variant"];
  power: EffectPowerRef;
  directions: CardEffect["directions"];
}

interface RawCardTemplate {
  id: string;
  name: string;
  race: string;
  cardType: string;
  description: string;
  effectSummary: string;
  stats: CardStats;
  level: CardTemplate["level"];
  effects: RawCardEffect[];
  artUrl?: string;
  artQuery?: string;
  artCredit?: string;
  emoji?: string;
}

interface CatalogData {
  images?: Record<string, string>;
  cards: RawCardTemplate[];
}

const catalog = catalogData as CatalogData;

export function resolveEffectPower(stats: CardStats, power: EffectPowerRef): number {
  if (typeof power === "number") return power;
  const key = power.slice("stats.".length) as keyof CardStats;
  const value = stats[key];
  return typeof value === "number" ? value : 0;
}

function resolveEffects(stats: CardStats, effects: RawCardEffect[]): CardEffect[] {
  return effects.map((effect) => ({
    orientation: effect.orientation,
    category: effect.category,
    variant: effect.variant,
    directions: [...effect.directions],
    power: resolveEffectPower(stats, effect.power),
  }));
}

function resolveTemplate(raw: RawCardTemplate): CardTemplate {
  const artUrl =
    catalog.images?.[raw.id] ?? raw.artUrl ?? `/cards/art/${raw.race}.png`;
  const stats = { ...raw.stats };
  return {
    id: raw.id,
    name: raw.name,
    race: raw.race,
    cardType: raw.cardType,
    description: raw.description,
    effectSummary: raw.effectSummary,
    level: raw.level,
    artUrl,
    artQuery: raw.artQuery,
    artCredit: raw.artCredit,
    emoji: raw.emoji,
    stats,
    effects: resolveEffects(stats, raw.effects),
  };
}

const templates = catalog.cards.map(resolveTemplate);

export function getAllCardTemplates(): CardTemplate[] {
  return templates;
}

export function getCardImages(): Record<string, string> {
  return catalog.images ?? {};
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
    defenseRemaining: 0,
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

/** Embaralha e retorna até `count` cartas distintas. */
export function pickUniqueTemplates(count: number, pool?: CardTemplate[]): CardTemplate[] {
  const source = pool && pool.length > 0 ? pool : templates;
  const shuffled = [...source].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function randomEnemyPlacement(cards: CardTemplate[]): BattleUnit[] {
  const cols: Column[] = [0, 1, 2];
  const shuffledCols = [...cols].sort(() => Math.random() - 0.5);
  return cards.map((t, i) => createBattleUnit(t, shuffledCols[i], "enemy"));
}
