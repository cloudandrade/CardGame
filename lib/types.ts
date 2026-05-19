export type Column = 0 | 1 | 2;
export type Row = "player" | "enemy";
export type EffectOrientation = "up" | "down";
export type EffectDirection = "left" | "middle" | "right";
export type EffectCategory = "attack" | "defense" | "magic";

export type AttackVariant = "attack" | "attack-double" | "group-attack";
export type DefenseVariant = "defense";
export type MagicVariant = "enchant" | "heal";

export interface CardEffect {
  orientation: EffectOrientation;
  category: EffectCategory;
  variant: AttackVariant | DefenseVariant | MagicVariant;
  power: number;
  directions: EffectDirection[];
}

export interface CardStats {
  hp: number;
  attack: number;
  defense?: number;
  magic?: number;
}

export interface CardTemplate {
  id: string;
  name: string;
  race: string;
  cardType: string;
  description: string;
  effectSummary: string;
  stats: CardStats;
  level: 1 | 2 | 3 | 4;
  effects: CardEffect[];
  artUrl: string;
  artQuery?: string;
  artCredit?: string;
  emoji?: string;
}

export interface BattleUnit {
  instanceId: string;
  templateId: string;
  name: string;
  race: string;
  cardType: string;
  description: string;
  effectSummary: string;
  stats: CardStats;
  artUrl: string;
  level: 1 | 2 | 3 | 4;
  emoji?: string;
  maxHp: number;
  currentHp: number;
  column: Column;
  row: Row;
  effects: CardEffect[];
  enchantBonus: number;
}

export type BoardRow = [BattleUnit | null, BattleUnit | null, BattleUnit | null];

export interface BattleState {
  round: number;
  playerRow: BoardRow;
  enemyRow: BoardRow;
  log: string[];
  status: "active" | "finished";
  winner?: "player" | "enemy";
}

export interface PlayerSave {
  xp: number;
  level: number;
  wins: number;
  unlockedCardIds: string[];
}

export const COLUMN_LABELS = ["Esquerda", "Centro", "Direita"] as const;
