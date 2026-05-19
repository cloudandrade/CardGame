"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { effectLegend } from "@/components/EffectArrows";
import { TCG_CARD_FRAME_H, TCG_CARD_FRAME_W, TcgCard } from "@/components/TcgCard";
import { getAllCardTemplates, searchCards } from "@/lib/cards";
import type { CardTemplate } from "@/lib/types";

const GRID_COLS = 3;
const GRID_GAP_PX = 24;

function fitGridScale(containerWidth: number) {
  const colW = (containerWidth - GRID_GAP_PX * (GRID_COLS - 1)) / GRID_COLS;
  return Math.min(1, Math.max(0.55, (colW - 12) / TCG_CARD_FRAME_W));
}

function fitPreviewScale() {
  const w = window.innerWidth * 0.94;
  const h = window.innerHeight * 0.92;
  return Math.min(w / TCG_CARD_FRAME_W, h / TCG_CARD_FRAME_H, 1.9);
}

export default function CollectionPage() {
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState<CardTemplate | null>(null);
  const [previewScale, setPreviewScale] = useState(1.4);
  const [gridScale, setGridScale] = useState(0.92);
  const gridRef = useRef<HTMLDivElement>(null);
  const all = getAllCardTemplates();
  const cards = useMemo(() => searchCards(query, 200), [query]);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const update = () => {
      setGridScale(fitGridScale(el.clientWidth));
      setPreviewScale(fitPreviewScale());
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    if (!preview) return;
    setPreviewScale(fitPreviewScale());
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreview(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [preview]);

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-4 pb-16">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/" className="text-sm text-[var(--accent)] hover:underline">
            ← Voltar ao jogo
          </Link>
          <h1 className="mt-2 font-serif text-3xl font-bold text-amber-100">Coleção VSF</h1>
          <p className="text-sm text-[var(--muted)]">
            {all.length} cartas · deck inicial VSF
          </p>
          <div className="mt-2">{effectLegend()}</div>
        </div>
        <input
          type="search"
          placeholder="Buscar nome, raça, lore..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
        />
      </header>

      <div
        ref={gridRef}
        className="grid grid-cols-3 justify-items-center gap-x-6 gap-y-12"
      >
        {cards.map((card) => (
          <TcgCard
            key={card.id}
            card={card}
            sizeScale={gridScale}
            onClick={() => setPreview(card)}
          />
        ))}
      </div>

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`Carta: ${preview.name}`}
        >
          <div className="relative max-h-[95vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="absolute -right-1 -top-1 z-[60] flex h-10 w-10 items-center justify-center rounded-full border-2 border-black bg-white text-2xl leading-none text-black shadow-lg hover:bg-amber-100"
              aria-label="Fechar"
            >
              ×
            </button>
            <TcgCard card={preview} sizeScale={previewScale} />
          </div>
        </div>
      )}
    </main>
  );
}
