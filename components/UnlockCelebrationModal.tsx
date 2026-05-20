"use client";

import { useEffect, useState } from "react";
import { TCG_CARD_FRAME_H, TCG_CARD_FRAME_W, TcgCard } from "@/components/TcgCard";
import type { CardTemplate } from "@/lib/types";

function fitPreviewScale() {
  const w = window.innerWidth * 0.94;
  const h = window.innerHeight * 0.78;
  return Math.min(w / TCG_CARD_FRAME_W, h / TCG_CARD_FRAME_H, 1.6);
}

interface UnlockCelebrationModalProps {
  cards: CardTemplate[];
  onClose: () => void;
}

export function UnlockCelebrationModal({ cards, onClose }: UnlockCelebrationModalProps) {
  const [index, setIndex] = useState(0);
  const [scale, setScale] = useState(1.4);

  const card = cards[index];
  const hasNext = index < cards.length - 1;
  const hasPrev = index > 0;

  useEffect(() => {
    setIndex(0);
  }, [cards]);

  useEffect(() => {
    const update = () => setScale(fitPreviewScale());
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && hasNext) setIndex((i) => i + 1);
      if (e.key === "ArrowLeft" && hasPrev) setIndex((i) => i - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, hasNext, hasPrev]);

  if (!card || cards.length === 0) return null;

  const handleContinue = () => {
    if (hasNext) {
      setIndex((i) => i + 1);
    } else {
      onClose();
    }
  };

  return (
    <div
      className="unlock-backdrop fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-black/90 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Nova carta desbloqueada"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-1/4 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute -right-16 bottom-1/4 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <div className="relative flex w-full max-w-lg flex-col items-center">
        <div className="unlock-title mb-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-400/90">
            Nova carta
          </p>
          <h2 className="mt-2 font-serif text-2xl font-bold text-amber-50 sm:text-3xl">
            Desbloqueada!
          </h2>
          {cards.length > 1 && (
            <p className="mt-1 text-sm text-zinc-400">
              {index + 1} de {cards.length}
            </p>
          )}
        </div>

        <div key={card.id} className="unlock-card-wrap relative">
          <div
            className="unlock-glow absolute -inset-4 rounded-3xl bg-gradient-to-b from-amber-500/20 via-transparent to-violet-500/15 blur-sm"
            aria-hidden
          />
          <TcgCard card={card} sizeScale={scale} />
        </div>

        <div key={`${card.id}-details`} className="unlock-details mt-6 w-full max-w-sm space-y-3 text-center">
          <p className="text-sm leading-relaxed text-zinc-300">{card.effectSummary}</p>
          <p className="text-xs text-zinc-500">
            Nível {card.level} · {card.cardType}
          </p>
        </div>

        <div className="unlock-actions mt-8 flex w-full max-w-sm flex-col gap-3 sm:flex-row">
          {cards.length > 1 && (
            <button
              type="button"
              disabled={!hasPrev}
              onClick={() => setIndex((i) => i - 1)}
              className="rounded-xl border border-white/15 py-3 text-sm font-medium text-zinc-300 hover:border-white/30 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-1"
            >
              Anterior
            </button>
          )}
          <button
            type="button"
            onClick={handleContinue}
            className="rounded-xl bg-[var(--accent)] py-3 text-sm font-semibold hover:bg-[var(--accent-hover)] sm:flex-1"
          >
            {hasNext ? "Próxima carta" : "Continuar"}
          </button>
        </div>
      </div>
    </div>
  );
}
