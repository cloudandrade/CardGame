import { computeDefenseForColumn, totalDefense } from "@/lib/battle/defense";
import { logRef, type BattleLogEntry } from "@/lib/battle/log";
import { HEAL_MAX_ROUND } from "@/lib/config";
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

function rowDefenseSources(row: BoardRow) {
  return row.map((u) => (u ? { column: u.column, effects: u.effects } : null));
}

function initDefensePools(row: BoardRow): void {
  for (const unit of aliveUnits(row)) {
    const breakdown = computeDefenseForColumn(rowDefenseSources(row), unit.column);
    unit.defenseRemaining = totalDefense(breakdown);
  }
}

function sumMaxHp(row: BoardRow): number {
  return row.reduce((sum, u) => sum + (u?.maxHp ?? 0), 0);
}

function attackDamage(effect: CardEffect, attacker: BattleUnit): number {
  let power = effect.power;
  if (effect.variant === "attack-double") power *= 2;
  return power + attacker.enchantBonus;
}

interface DamageHit {
  target: BattleUnit;
  attacker: BattleUnit;
  damage: number;
}

function applyEnchantments(state: BattleState): BattleLogEntry[] {
  if (state.round !== 1) return [];
  const logs: BattleLogEntry[] = [];
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
        logs.push({
          kind: "enchant",
          source: logRef(unit.row, unit.name),
          target: logRef(target.row, target.name),
          amount: effect.power,
        });
      }
    }
  }

  return logs;
}

function applyHeals(state: BattleState): BattleLogEntry[] {
  if (state.round > HEAL_MAX_ROUND) return [];

  const logs: BattleLogEntry[] = [];
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
          logs.push({
            kind: "heal",
            target: logRef(target.row, target.name),
            amount: healed,
          });
        }
      }
    }
  }

  return logs;
}

function gatherAttacks(state: BattleState): DamageHit[] {
  const hits: DamageHit[] = [];

  const sides: { row: BoardRow }[] = [{ row: state.playerRow }, { row: state.enemyRow }];

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
          hits.push({ target, attacker, damage: dmg });
        }
      }
    }
  }

  return hits;
}

function applyDamageHits(state: BattleState, hits: DamageHit[]): BattleLogEntry[] {
  const logs: BattleLogEntry[] = [];
  const deathsLogged = new Set<string>();

  for (const { target, attacker, damage } of hits) {
    if (target.currentHp <= 0) continue;

    let hpDamage = damage;
    const source = logRef(attacker.row, attacker.name);
    const victim = logRef(target.row, target.name);

    if (state.round === 1 && target.defenseRemaining > 0) {
      const blocked = Math.min(hpDamage, target.defenseRemaining);
      target.defenseRemaining -= blocked;
      hpDamage -= blocked;
      if (blocked > 0) {
        logs.push({ kind: "block", target: victim, source, amount: blocked });
      }
    }

    if (hpDamage > 0) {
      target.currentHp = Math.max(0, target.currentHp - hpDamage);
      logs.push({ kind: "damage", target: victim, source, amount: hpDamage });
    }

    if (target.currentHp <= 0 && !deathsLogged.has(target.instanceId)) {
      deathsLogged.add(target.instanceId);
      logs.push({ kind: "death", unit: victim });
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

function checkRoundLimit(state: BattleState): void {
  if (state.status === "finished" || state.round !== 5) return;

  const playerHp = totalHp(state.playerRow);
  const enemyHp = totalHp(state.enemyRow);
  state.status = "finished";

  if (playerHp > enemyHp) {
    state.winner = "player";
    state.log.push({
      kind: "result",
      message: `Fim da rodada 5 — vitória por PV (${playerHp} vs ${enemyHp}).`,
    });
  } else if (enemyHp > playerHp) {
    state.winner = "enemy";
    state.log.push({
      kind: "result",
      message: `Fim da rodada 5 — derrota por PV (${enemyHp} vs ${playerHp}).`,
    });
  } else {
    state.winner = "draw";
    state.log.push({
      kind: "result",
      message: `Fim da rodada 5 — empate (${playerHp} PV).`,
    });
  }
}

function checkWinner(state: BattleState): void {
  const playerAlive = aliveUnits(state.playerRow).length;
  const enemyAlive = aliveUnits(state.enemyRow).length;

  if (playerAlive === 0 && enemyAlive === 0) {
    state.status = "finished";
    state.winner = "draw";
    state.log.push({ kind: "result", message: "Empate — ambas as fileiras caíram." });
    return;
  }
  if (enemyAlive === 0) {
    state.status = "finished";
    state.winner = "player";
    state.log.push({ kind: "result", message: "Vitória! Todas as cartas inimigas caíram." });
    return;
  }
  if (playerAlive === 0) {
    state.status = "finished";
    state.winner = "enemy";
    state.log.push({ kind: "result", message: "Derrota... Suas cartas foram destruídas." });
  }
}

export function createBattleState(playerUnits: BattleUnit[], enemyUnits: BattleUnit[]): BattleState {
  const playerRow: BoardRow = [null, null, null];
  const enemyRow: BoardRow = [null, null, null];

  for (const u of playerUnits) setUnit(playerRow, u.column, { ...u, row: "player" });
  for (const u of enemyUnits) setUnit(enemyRow, u.column, { ...u, row: "enemy" });

  initDefensePools(playerRow);
  initDefensePools(enemyRow);

  return {
    round: 0,
    playerRow,
    enemyRow,
    playerHpMax: sumMaxHp(playerRow),
    enemyHpMax: sumMaxHp(enemyRow),
    log: [
      {
        kind: "meta",
        message: "Batalha iniciada! Use «Iniciar rodada» ou «Batalha instantânea».",
      },
    ],
    status: "active",
  };
}

const INSTANT_BATTLE_ROUND_CAP = 10;

/** Resolve rodadas até o fim (vitória, derrota, empate ou limite de rodadas). */
export function resolveBattleInstant(state: BattleState): BattleState {
  let current = state;
  let guard = 0;
  while (current.status === "active" && guard < INSTANT_BATTLE_ROUND_CAP) {
    current = resolveRound(current);
    guard++;
  }
  return current;
}

export function resolveRound(state: BattleState): BattleState {
  if (state.status === "finished") return state;

  const next: BattleState = {
    ...state,
    round: state.round + 1,
    playerRow: cloneRow(state.playerRow),
    enemyRow: cloneRow(state.enemyRow),
    log: [...state.log, { kind: "round", round: state.round + 1 }],
  };

  next.log.push(...applyEnchantments(next));
  next.log.push(...applyHeals(next));

  const hits = gatherAttacks(next);
  next.log.push(...applyDamageHits(next, hits));

  removeDead(next.playerRow);
  removeDead(next.enemyRow);

  checkWinner(next);
  checkRoundLimit(next);
  return next;
}

export function totalHp(row: BoardRow): number {
  return aliveUnits(row).reduce((sum, u) => sum + u.currentHp, 0);
}
