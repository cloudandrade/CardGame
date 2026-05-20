import type { BattleLogEntry } from "@/lib/battle/log";

export type Column = 0 | 1 | 2;
export type Row = "player" | "enemy";
export type EffectOrientation = "up" | "down";
export type EffectDirection = "left" | "middle" | "right" | "row";
export type EffectCategory = "attack" | "defense" | "magic";

export type AttackVariant = "attack" | "attack-double" | "group-attack";
export type DefenseVariant = "defense";
export type MagicVariant = "enchant" | "heal";

/** Referência no JSON (ex.: "stats.attack") ou valor numérico literal. */
export type EffectPowerRef = number | `stats.${keyof CardStats}`;

export interface CardEffect {
  orientation: EffectOrientation;
  category: EffectCategory;
  variant: AttackVariant | DefenseVariant | MagicVariant;
  power: number;
  directions: EffectDirection[];
}

export interface CardStats {
  hp: number;
  attack?: number;
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
  /** Pool de bloqueio (rodada 1); debita antes do PV. */
  defenseRemaining: number;
}

export type BoardRow = [BattleUnit | null, BattleUnit | null, BattleUnit | null];

export interface BattleState {
  round: number;
  playerRow: BoardRow;
  enemyRow: BoardRow;
  log: BattleLogEntry[];
  playerHpMax: number;
  enemyHpMax: number;
  status: "active" | "finished";
  winner?: "player" | "enemy" | "draw";
}

export interface PlayerSave {
  xp: number;
  wins: number;
  /** XP ganho em vitórias (só sobe ao vencer; não depende do .env ao recarregar). */
  totalXpEarned: number;
  /** 6 cartas fixas usadas em toda partida (escolhe 3 por batalha). */
  rosterCardIds: string[];
  /** Acervo completo; +1 carta a cada 100 XP de totalXpEarned. */
  collectionCardIds: string[];
}

export const COLUMN_LABELS = ["Esquerda", "Centro", "Direita"] as const;
