"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BattleLog } from "@/components/BattleLog";
import { Board } from "@/components/Board";
import { TeamLifebar } from "@/components/TeamLifebar";
import { CardTile } from "@/components/CardTile";
import {
  getTcgCardFrameSize,
  PAD_PLACEMENT_SCALE,
  TCG_CARD_FRAME_W,
  TcgCard,
} from "@/components/TcgCard";
import {
  createBattleState,
  resolveBattleInstant,
  resolveRound,
  totalHp,
} from "@/lib/battle/engine";
import { computeLineupPreview } from "@/lib/battle/placement-preview";
import {
  createBattleUnit,
  getCardTemplate,
  getStarterHand,
  pickRandomTemplates,
  randomEnemyPlacement,
} from "@/lib/cards";
import { effectLegend } from "@/components/EffectArrows";
import { GameRulesPanel } from "@/components/GameRules";
import { PadPreviewStats } from "@/components/PadPreviewStats";
import Link from "next/link";
import { addWinXp, loadSave, resetSave } from "@/lib/storage";
import type { BattleState, CardTemplate, Column, PlayerSave } from "@/lib/types";
import { COLUMN_LABELS } from "@/lib/types";

type Phase = "menu" | "select" | "battle" | "result";

const COLS: Column[] = [0, 1, 2];
const SELECT_GRID_COLS = 5;
const SELECT_GRID_GAP_PX = 12;

function fitSelectGridScale(containerWidth: number) {
  const colW = (containerWidth - SELECT_GRID_GAP_PX * (SELECT_GRID_COLS - 1)) / SELECT_GRID_COLS;
  return Math.min(1, Math.max(0.28, (colW - 8) / TCG_CARD_FRAME_W));
}

function maxHandPadFrame(hand: CardTemplate[]) {
  let width = 0;
  let height = 0;
  for (const card of hand) {
    const frame = getTcgCardFrameSize(card.effects, PAD_PLACEMENT_SCALE);
    width = Math.max(width, frame.width);
    height = Math.max(height, frame.height);
  }
  if (width === 0) {
    return getTcgCardFrameSize([], PAD_PLACEMENT_SCALE);
  }
  return { width, height };
}

function padFrameForColumn(
  hand: CardTemplate[],
  placedId: string | null,
  pendingCardId: string | null,
) {
  const template = placedId
    ? getCardTemplate(placedId)
    : pendingCardId
      ? getCardTemplate(pendingCardId)
      : null;
  if (template) {
    return getTcgCardFrameSize(template.effects, PAD_PLACEMENT_SCALE);
  }
  return maxHandPadFrame(hand);
}

export function Game() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [save, setSave] = useState<PlayerSave | null>(null);
  const [pool, setPool] = useState<CardTemplate[]>([]);
  const [placements, setPlacements] = useState<Record<Column, string | null>>({
    0: null,
    1: null,
    2: null,
  });
  const [pendingCardId, setPendingCardId] = useState<string | null>(null);
  const [battle, setBattle] = useState<BattleState | null>(null);
  const [lastReward, setLastReward] = useState<string | null>(null);
  const [handForRun, setHandForRun] = useState<CardTemplate[]>([]);
  const [gridScale, setGridScale] = useState(0.35);
  const [rulesOpen, setRulesOpen] = useState(false);
  const selectGridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s = loadSave();
    setSave(s);
    const cards = s.unlockedCardIds
      .map((id) => getCardTemplate(id))
      .filter((c): c is CardTemplate => Boolean(c));
    setPool(cards.length >= 3 ? cards : cards);
  }, []);

  useEffect(() => {
    if (!rulesOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setRulesOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [rulesOpen]);

  useEffect(() => {
    if (phase !== "select") return;
    const el = selectGridRef.current;
    if (!el) return;
    const update = () => setGridScale(fitSelectGridScale(el.clientWidth));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [phase]);

  const placedCount = Object.values(placements).filter(Boolean).length;
  const lineupPreview = useMemo(
    () => computeLineupPreview(placements, getCardTemplate),
    [placements],
  );
  const canStartBattle = placedCount === 3;

  const pickCard = (id: string) => {
    if (Object.values(placements).includes(id)) return;
    setPendingCardId((prev) => (prev === id ? null : id));
  };

  const placeOnColumn = (col: Column) => {
    const onPad = placements[col];
    if (onPad && !pendingCardId) {
      setPendingCardId(onPad);
      setPlacements((p) => ({ ...p, [col]: null }));
      return;
    }
    if (!pendingCardId || onPad) return;
    const next: Record<Column, string | null> = { ...placements, [col]: pendingCardId };
    setPlacements(next);
    setPendingCardId(null);
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

  const applyBattleRewards = useCallback(
    (finished: BattleState) => {
      if (finished.winner === "player" && save) {
        const { save: updated, leveledUp, newCardId } = addWinXp(save);
        setSave(updated);
        let msg = "+5 XP";
        if (leveledUp) msg += " · Subiu de nível!";
        if (newCardId) {
          const c = getCardTemplate(newCardId);
          msg += ` · Nova carta: ${c?.name}`;
        }
        setLastReward(msg);
      } else {
        setLastReward(null);
      }
    },
    [save],
  );

  const goToResult = useCallback(
    (finished: BattleState) => {
      setBattle(finished);
      applyBattleRewards(finished);
      setPhase("result");
    },
    [applyBattleRewards],
  );

  const nextRound = () => {
    if (!battle || battle.status === "finished") return;
    const next = resolveRound(battle);
    if (next.status === "finished") {
      goToResult(next);
    } else {
      setBattle(next);
    }
  };

  const runInstantBattle = () => {
    if (!battle || battle.status === "finished") return;
    const finished = resolveBattleInstant(battle);
    goToResult(finished);
  };

  const resetRun = () => {
    setPlacements({ 0: null, 1: null, 2: null });
    setPendingCardId(null);
    setBattle(null);
    setLastReward(null);
    setPhase("menu");
  };

  const beginSelectPhase = () => {
    setPlacements({ 0: null, 1: null, 2: null });
    setPendingCardId(null);
    const hand =
      pool.length <= 6 ? getStarterHand(pool.map((c) => c.id)) : pickRandomTemplates(6, pool);
    setHandForRun(hand);
    setPhase("select");
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
    <main
      className={`mx-auto min-h-screen p-4 pb-10 ${phase === "select" || phase === "battle" || phase === "result" ? "max-w-6xl" : "max-w-lg"}`}
    >
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
            onClick={beginSelectPhase}
            className="w-full rounded-xl bg-[var(--accent)] py-3 font-semibold hover:bg-[var(--accent-hover)]"
          >
            Jogar vs IA
          </button>
          <button
            type="button"
            onClick={() => setRulesOpen(true)}
            className="w-full rounded-xl border border-white/15 py-3 text-sm font-medium text-zinc-200 hover:border-white/25 hover:bg-white/5"
          >
            Regras do jogo
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

      <GameRulesPanel open={rulesOpen} onClose={() => setRulesOpen(false)} />

      {phase === "select" && (
        <section className="space-y-6">
          <p className="text-center text-sm text-[var(--muted)]">
            {pendingCardId ? (
              <>
                Toque um pad para colocar{" "}
                <strong className="text-[var(--text)]">
                  {getCardTemplate(pendingCardId)?.name ?? "—"}
                </strong>
              </>
            ) : canStartBattle ? (
              <>Três cartas posicionadas — revise a combinação e inicie quando quiser.</>
            ) : (
              <>Escolha uma carta e posicione nos pads ({placedCount}/3)</>
            )}
          </p>

          {placedCount > 0 && (
            <div className="rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-center text-sm">
              <p className="text-[var(--muted)]">
                PV total da equipe{" "}
                <span className="font-semibold text-emerald-300">{lineupPreview.totalLp}</span>
                <span className="text-[10px] text-zinc-500"> (inclui cura prevista na rodada 1)</span>
              </p>
            </div>
          )}

          <div className="grid grid-cols-3 justify-items-center gap-6">
            {COLS.map((col) => {
              const placedId = placements[col];
              const canDrop = Boolean(pendingCardId && !placedId);
              const frame = padFrameForColumn(handForRun, placedId, pendingCardId);
              const padPreview = lineupPreview.pads[col];
              return (
                <div key={col} className="flex flex-col items-center">
                  <p className="mb-1 text-center text-[10px] font-medium text-[var(--muted)]">
                    {COLUMN_LABELS[col]}
                  </p>
                  {padPreview && <PadPreviewStats preview={padPreview} />}
                  <div style={{ width: frame.width, height: frame.height }}>
                  {placedId ? (
                    <button
                      type="button"
                      onClick={() => placeOnColumn(col)}
                      className="block"
                      aria-label={`Remover carta de ${COLUMN_LABELS[col]}`}
                    >
                      <CardTile
                        card={getCardTemplate(placedId)}
                        sizeScale={PAD_PLACEMENT_SCALE}
                      />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => placeOnColumn(col)}
                      disabled={!canDrop}
                      className={[
                        "slot-empty flex h-full w-full items-center justify-center text-2xl text-[var(--accent)] transition-colors",
                        canDrop
                          ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/40"
                          : "opacity-70",
                      ].join(" ")}
                      aria-label={`Pad ${COLUMN_LABELS[col]}`}
                    >
                      +
                    </button>
                  )}
                  </div>
                </div>
              );
            })}
          </div>

          {canStartBattle && (
            <button
              type="button"
              onClick={() => startBattle(placements)}
              className="w-full rounded-xl bg-[var(--accent)] py-3.5 text-base font-semibold hover:bg-[var(--accent-hover)]"
            >
              Iniciar batalha
            </button>
          )}

          <div
            ref={selectGridRef}
            className="grid grid-cols-5 justify-items-center gap-x-3 gap-y-8"
          >
            {handForRun.map((card) => {
              const isPlaced = Object.values(placements).includes(card.id);
              return (
                <TcgCard
                  key={card.id}
                  card={card}
                  sizeScale={gridScale}
                  selected={pendingCardId === card.id}
                  disabled={isPlaced}
                  onClick={() => pickCard(card.id)}
                />
              );
            })}
          </div>
        </section>
      )}

      {phase === "battle" && battle && (
        <section className="space-y-4">
          <TeamLifebar
            label="Inimigo"
            current={totalHp(battle.enemyRow)}
            max={battle.enemyHpMax}
            variant="enemy"
          />
          <p className="text-center text-xs text-[var(--muted)]">Rodada {battle.round}</p>
          <Board
            enemyRow={battle.enemyRow}
            playerRow={battle.playerRow}
            showBattleStats
          />
          <TeamLifebar
            label="Sua equipe"
            current={totalHp(battle.playerRow)}
            max={battle.playerHpMax}
            variant="player"
          />
          <BattleLog entries={battle.log} />
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={runInstantBattle}
              className="w-full rounded-xl border border-white/20 py-3 text-sm font-semibold text-zinc-200 hover:border-white/35 hover:bg-white/5 sm:flex-1"
            >
              Batalha instantânea
            </button>
            <button
              type="button"
              onClick={nextRound}
              className="w-full rounded-xl bg-[var(--accent)] py-3 font-semibold hover:bg-[var(--accent-hover)] sm:flex-1"
            >
              {battle.round === 0 ? "Iniciar rodada" : "Próxima rodada"}
            </button>
          </div>
        </section>
      )}

      {phase === "result" && battle && (
        <section className="space-y-4">
          <div className="rounded-2xl bg-[var(--panel)] p-6 text-center">
            <p className="text-2xl font-bold">
              {battle.winner === "player"
                ? "Vitória!"
                : battle.winner === "enemy"
                  ? "Derrota"
                  : "Empate"}
            </p>
            {lastReward && <p className="mt-2 text-sm text-[var(--success)]">{lastReward}</p>}
          </div>
          <div>
            <p className="mb-2 text-center text-xs uppercase tracking-wider text-[var(--muted)]">
              Registro completo da batalha
            </p>
            <BattleLog entries={battle.log} expanded />
          </div>
          <button
            type="button"
            onClick={resetRun}
            className="w-full rounded-xl bg-[var(--accent)] py-3 font-semibold hover:bg-[var(--accent-hover)]"
          >
            Voltar ao menu
          </button>
        </section>
      )}
    </main>
  );
}
