import type { Row } from "@/lib/types";

export interface LogUnitRef {
  row: Row;
  name: string;
}

export type BattleLogEntry =
  | { kind: "meta"; message: string }
  | { kind: "round"; round: number }
  | { kind: "enchant"; source: LogUnitRef; target: LogUnitRef; amount: number }
  | { kind: "heal"; target: LogUnitRef; amount: number }
  | { kind: "damage"; target: LogUnitRef; source: LogUnitRef; amount: number }
  | { kind: "block"; target: LogUnitRef; source: LogUnitRef; amount: number }
  | { kind: "death"; unit: LogUnitRef }
  | { kind: "result"; message: string };

export function logRef(row: Row, name: string): LogUnitRef {
  return { row, name };
}

export function sideTag(row: Row): string {
  return row === "player" ? "(seu)" : "(inimigo)";
}
