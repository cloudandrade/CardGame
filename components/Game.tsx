"use client";

import { useCallback, useEffect, useState } from "react";
import { Board } from "@/components/Board";
import { CardTile } from "@/components/CardTile";
import { createBattleState, resolveRound, totalHp } from "@/lib/battle/engine";
import {
  createBattleUnit,
  getCardTemplate,
  getStarterHand,
  pickRandomTemplates,
  randomEnemyPlacement,
} from "@/lib/cards";
import { effectLegend } from "@/components/EffectArrows";
import Link from "next/link";
import { addWinXp, loadSave, resetSave } from "@/lib/storage";
import type { BattleState, CardTemplate, Column, PlayerSave } from "@/lib/types";
import { COLUMN_LABELS } from "@/lib/types";

type Phase = "menu" | "select" | "place" | "battle" | "result";

const COLS: Column[] = [0, 1, 2];

export function Game() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [save, setSave] = useState<PlayerSave | null>(null);
  const [pool, setPool] = useState<CardTemplate[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [placements, setPlacements] = useState<Record<Column, string | null>>({
    0: null,
    1: null,
    2: null,
  });
  const [pendingCardId, setPendingCardId] = useState<string | null>(null);
  const [battle, setBattle] = useState<BattleState | null>(null);
  const [lastReward, setLastReward] = useState<string | null>(null);
  const [handForRun, setHandForRun] = useState<CardTemplate[]>([]);

  useEffect(() => {
    const s = loadSave();
    setSave(s);
    const cards = s.unlockedCardIds
      .map((id) => getCardTemplate(id))
      .filter((c): c is CardTemplate => Boolean(c));
    setPool(cards.length >= 3 ? cards : cards);
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const startPlacement = () => {
    if (selectedIds.length !== 3) return;
    setPlacements({ 0: null, 1: null, 2: null });
    setPendingCardId(selectedIds[0]);
    setPhase("place");
  };

  const placeOnColumn = (col: Column) => {
    if (!pendingCardId || placements[col]) return;
    const next: Record<Column, string | null> = { ...placements, [col]: pendingCardId };
    setPlacements(next);
    const placedCount = Object.values(next).filter(Boolean).length;
    if (placedCount === 3) {
      startBattle(next);
      return;
    }
    const nextCard = selectedIds.find((id) => !Object.values(next).includes(id));
    setPendingCardId(nextCard ?? null);
  };

  const startBattle = useCallback(
    (slots: Record<Column, string | null>) => {
      const playerUnits = COLS.map((col) => {
        const id = slots[col];
        const t = id ? getCardTemplate(id) : undefined;
        return t ? createBattleUnit(t, col, "player") : null;
      }).filter(Boolean) as ReturnType<typeof createBattleUnit>[];

      const enemyTemplates = pickRandomTemplates(3, pool);
      const enemyUnits = randomEnemyPlacement(enemyTemplates);

      setBattle(createBattleState(playerUnits, enemyUnits));
      setPhase("battle");
    },
    [pool],
  );

  const nextRound = () => {
    if (!battle || battle.status === "finished") return;
    const next = resolveRound(battle);
    setBattle(next);
    if (next.status === "finished") {
      if (next.winner === "player" && save) {
        const { save: updated, leveledUp, newCardId } = addWinXp(save);
        setSave(updated);
        let msg = "+5 XP";
        if (leveledUp) msg += " · Subiu de nível!";
        if (newCardId) {
          const c = getCardTemplate(newCardId);
          msg += ` · Nova carta: ${c?.emoji} ${c?.name}`;
        }
        setLastReward(msg);
      } else {
        setLastReward(null);
      }
      setPhase("result");
    }
  };

  const resetRun = () => {
    setSelectedIds([]);
    setPlacements({ 0: null, 1: null, 2: null });
    setBattle(null);
    setLastReward(null);
    setPhase("menu");
  };

  const handleResetSave = () => {
    resetSave();
    const s = loadSave();
    setSave(s);
    const cards = s.unlockedCardIds
      .map((id) => getCardTemplate(id))
      .filter((c): c is CardTemplate => Boolean(c));
    setPool(cards);
    resetRun();
  };

  if (!save) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg items-center justify-center p-6">
        <p className="text-[var(--muted)]">Carregando...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg p-4 pb-10">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight">VSF</h1>
        <p className="text-sm text-[var(--muted)]">Very Snap Fight</p>
        <p className="mt-2 text-xs text-[var(--muted)]">
          Nv. {save.level} · {save.xp}/100 XP · {save.wins} vitórias
        </p>
      </header>

      {phase === "menu" && (
        <section className="space-y-4 rounded-2xl bg-[var(--panel)] p-6">
          <p className="text-sm leading-relaxed text-[var(--muted)]">
            Escolha 3 cartas, posicione na fileira e enfrente a IA. Partidas rápidas, sem login — progresso salvo no
            navegador.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedIds([]);
              const hand =
                pool.length <= 6
                  ? getStarterHand(pool.map((c) => c.id))
                  : pickRandomTemplates(6, pool);
              setHandForRun(hand);
              setPhase("select");
            }}
            className="w-full rounded-xl bg-[var(--accent)] py-3 font-semibold hover:bg-[var(--accent-hover)]"
          >
            Jogar vs IA
          </button>
          <Link
            href="/collection"
            className="block w-full rounded-xl border border-amber-700/40 py-3 text-center text-sm font-medium text-amber-100 hover:bg-amber-950/40"
          >
            Ver coleção (10 cartas)
          </Link>
          <div className="pt-1">{effectLegend()}</div>
          <button
            type="button"
            onClick={handleResetSave}
            className="w-full rounded-xl border border-white/10 py-2 text-sm text-[var(--muted)] hover:border-white/20"
          >
            Zerar progresso
          </button>
        </section>
      )}

      {phase === "select" && (
        <section className="space-y-4">
          <p className="text-center text-sm text-[var(--muted)]">
            Escolha 3 cartas ({selectedIds.length}/3)
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {handForRun.map((card) => (
              <CardTile
                key={card.id}
                card={card}
                selected={selectedIds.includes(card.id)}
                onClick={() => toggleSelect(card.id)}
              />
            ))}
          </div>
          <button
            type="button"
            disabled={selectedIds.length !== 3}
            onClick={startPlacement}
            className="w-full rounded-xl bg-[var(--accent)] py-3 font-semibold disabled:opacity-40"
          >
            Posicionar
          </button>
        </section>
      )}

      {phase === "place" && (
        <section className="space-y-4">
          <p className="text-center text-sm">
            Coloque: <strong>{getCardTemplate(pendingCardId ?? "")?.name ?? "—"}</strong>
          </p>
          <div className="grid grid-cols-3 gap-3">
            {COLS.map((col) => (
              <div key={col}>
                <p className="mb-1 text-center text-[10px] text-[var(--muted)]">{COLUMN_LABELS[col]}</p>
                {placements[col] ? (
                  <CardTile card={getCardTemplate(placements[col]!)} disabled compact />
                ) : (
                  <button
                    type="button"
                    onClick={() => placeOnColumn(col)}
                    className="slot-empty flex min-h-[120px] w-full items-center justify-center text-sm text-[var(--accent)] hover:border-[var(--accent)]"
                  >
                    +
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {phase === "battle" && battle && (
        <section className="space-y-4">
          <div className="flex justify-between text-xs text-[var(--muted)]">
            <span>PV inimigo: {totalHp(battle.enemyRow)}</span>
            <span>Rodada {battle.round}</span>
            <span>Seus PV: {totalHp(battle.playerRow)}</span>
          </div>
          <Board enemyRow={battle.enemyRow} playerRow={battle.playerRow} />
          <div className="log-scroll max-h-36 overflow-y-auto rounded-xl bg-black/30 p-3 text-xs leading-relaxed text-zinc-300">
            {battle.log.slice(-12).map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
          <button
            type="button"
            onClick={nextRound}
            className="w-full rounded-xl bg-[var(--accent)] py-3 font-semibold hover:bg-[var(--accent-hover)]"
          >
            Próxima rodada
          </button>
        </section>
      )}

      {phase === "result" && battle && (
        <section className="space-y-4 rounded-2xl bg-[var(--panel)] p-6 text-center">
          <p className="text-2xl font-bold">
            {battle.winner === "player" ? "Vitória!" : "Derrota"}
          </p>
          {lastReward && <p className="text-sm text-[var(--success)]">{lastReward}</p>}
          <button
            type="button"
            onClick={resetRun}
            className="w-full rounded-xl bg-[var(--accent)] py-3 font-semibold"
          >
            Voltar ao menu
          </button>
        </section>
      )}
    </main>
  );
}
