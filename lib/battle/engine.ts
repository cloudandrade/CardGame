import { getAttackTargetColumns, getRelativeTargetColumns } from "@/lib/battle/targets";
import type {
  BattleState,
  BattleUnit,
  BoardRow,
  CardEffect,
  Column,
} from "@/lib/types";

function cloneRow(row: BoardRow): BoardRow {
  return [
    row[0] ? { ...row[0], effects: row[0].effects.map((e) => ({ ...e })) } : null,
    row[1] ? { ...row[1], effects: row[1].effects.map((e) => ({ ...e })) } : null,
    row[2] ? { ...row[2], effects: row[2].effects.map((e) => ({ ...e })) } : null,
  ];
}

function getUnit(row: BoardRow, col: Column): BattleUnit | null {
  return row[col];
}

function setUnit(row: BoardRow, col: Column, unit: BattleUnit | null): void {
  row[col] = unit;
}

function aliveUnits(row: BoardRow): BattleUnit[] {
  return row.filter((u): u is BattleUnit => u !== null && u.currentHp > 0);
}

function attackDamage(effect: CardEffect, attacker: BattleUnit): number {
  let power = effect.power;
  if (effect.variant === "attack-double") power *= 2;
  return power + attacker.enchantBonus;
}

function collectDefense(
  row: BoardRow,
  targetCol: Column,
  incoming: number,
): { reduced: number; logLines: string[] } {
  let remaining = incoming;
  const logs: string[] = [];

  for (const defender of aliveUnits(row)) {
    if (remaining <= 0) break;
    for (const effect of defender.effects) {
      if (effect.category !== "defense" || effect.variant !== "defense") continue;
      if (effect.orientation !== "down") continue;

      const protectedCols = getRelativeTargetColumns(defender.column, effect.directions);
      if (!protectedCols.includes(targetCol)) continue;

      const block = Math.min(remaining, effect.power);
      if (block > 0) {
        remaining -= block;
        logs.push(`${defender.emoji} bloqueia ${block}`);
      }
    }
  }

  return { reduced: remaining, logLines: logs };
}

function applyEnchantments(state: BattleState): string[] {
  const logs: string[] = [];
  const allUnits = [...aliveUnits(state.playerRow), ...aliveUnits(state.enemyRow)];

  for (const unit of allUnits) {
    for (const effect of unit.effects) {
      if (effect.category !== "magic" || effect.variant !== "enchant") continue;
      const row = unit.row === "player" ? state.playerRow : state.enemyRow;
      const targetCols = getRelativeTargetColumns(unit.column, effect.directions);

      for (const col of targetCols) {
        const target = getUnit(row, col);
        if (!target || target.currentHp <= 0) continue;
        target.enchantBonus += effect.power;
        logs.push(`${unit.emoji} encanta ${target.emoji} (+${effect.power} atk)`);
      }
    }
  }

  return logs;
}

function applyHeals(state: BattleState): string[] {
  const logs: string[] = [];
  const allUnits = [...aliveUnits(state.playerRow), ...aliveUnits(state.enemyRow)];

  for (const unit of allUnits) {
    for (const effect of unit.effects) {
      if (effect.category !== "magic" || effect.variant !== "heal") continue;
      const row = unit.row === "player" ? state.playerRow : state.enemyRow;
      const targetCols = getRelativeTargetColumns(unit.column, effect.directions);

      for (const col of targetCols) {
        const target = getUnit(row, col);
        if (!target || target.currentHp <= 0) continue;
        const before = target.currentHp;
        target.currentHp = Math.min(target.maxHp, target.currentHp + effect.power);
        const healed = target.currentHp - before;
        if (healed > 0) {
          logs.push(`${target.emoji} cura +${healed}`);
        }
      }
    }
  }

  return logs;
}

function gatherAttacks(state: BattleState): Map<string, number> {
  const damageByTarget = new Map<string, number>();

  const sides: { row: BoardRow; opposite: BoardRow }[] = [
    { row: state.playerRow, opposite: state.enemyRow },
    { row: state.enemyRow, opposite: state.playerRow },
  ];

  for (const { row } of sides) {
    for (const attacker of aliveUnits(row)) {
      for (const effect of attacker.effects) {
        if (effect.category !== "attack" || effect.orientation !== "up") continue;
        const targetRow = attacker.row === "player" ? state.enemyRow : state.playerRow;
        const cols = getAttackTargetColumns(attacker, effect);
        const dmg = attackDamage(effect, attacker);

        for (const col of cols) {
          const target = getUnit(targetRow, col);
          if (!target || target.currentHp <= 0) continue;
          const key = `${target.row}-${col}`;
          damageByTarget.set(key, (damageByTarget.get(key) ?? 0) + dmg);
        }
      }
    }
  }

  return damageByTarget;
}

function applyDamageMap(state: BattleState, damageByTarget: Map<string, number>): string[] {
  const logs: string[] = [];

  for (const [key, rawDamage] of damageByTarget) {
    const [rowLabel, colStr] = key.split("-");
    const col = Number(colStr) as Column;
    const row = rowLabel === "player" ? state.playerRow : state.enemyRow;
    const target = getUnit(row, col);
    if (!target || rawDamage <= 0) continue;

    const { reduced, logLines } = collectDefense(
      rowLabel === "player" ? state.playerRow : state.enemyRow,
      col,
      rawDamage,
    );
    logs.push(...logLines);

    if (reduced > 0) {
      target.currentHp = Math.max(0, target.currentHp - reduced);
      logs.push(`${target.emoji} leva ${reduced} de dano`);
    }
  }

  return logs;
}

function removeDead(row: BoardRow): void {
  for (let c = 0; c < 3; c++) {
    const u = row[c as Column];
    if (u && u.currentHp <= 0) row[c as Column] = null;
  }
}

function checkWinner(state: BattleState): void {
  const playerAlive = aliveUnits(state.playerRow).length;
  const enemyAlive = aliveUnits(state.enemyRow).length;

  if (playerAlive === 0 && enemyAlive === 0) {
    state.status = "finished";
    state.winner = "enemy";
    state.log.push("Empate — a IA vence por desempate.");
    return;
  }
  if (enemyAlive === 0) {
    state.status = "finished";
    state.winner = "player";
    state.log.push("Vitória! Todas as cartas inimigas caíram.");
    return;
  }
  if (playerAlive === 0) {
    state.status = "finished";
    state.winner = "enemy";
    state.log.push("Derrota... Suas cartas foram destruídas.");
  }
}

export function createBattleState(playerUnits: BattleUnit[], enemyUnits: BattleUnit[]): BattleState {
  const playerRow: BoardRow = [null, null, null];
  const enemyRow: BoardRow = [null, null, null];

  for (const u of playerUnits) setUnit(playerRow, u.column, { ...u, row: "player" });
  for (const u of enemyUnits) setUnit(enemyRow, u.column, { ...u, row: "enemy" });

  return {
    round: 0,
    playerRow,
    enemyRow,
    log: ["Batalha iniciada! Clique em Próxima rodada."],
    status: "active",
  };
}

export function resolveRound(state: BattleState): BattleState {
  if (state.status === "finished") return state;

  const next: BattleState = {
    ...state,
    round: state.round + 1,
    playerRow: cloneRow(state.playerRow),
    enemyRow: cloneRow(state.enemyRow),
    log: [`—— Rodada ${state.round + 1} ——`],
  };

  next.log.push(...applyEnchantments(next));
  next.log.push(...applyHeals(next));

  const damageMap = gatherAttacks(next);
  next.log.push(...applyDamageMap(next, damageMap));

  removeDead(next.playerRow);
  removeDead(next.enemyRow);

  checkWinner(next);
  return next;
}

export function totalHp(row: BoardRow): number {
  return aliveUnits(row).reduce((sum, u) => sum + u.currentHp, 0);
}
