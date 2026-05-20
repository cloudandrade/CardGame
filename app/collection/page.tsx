"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { arrowPadding, effectLegend } from "@/components/EffectArrows";
import { TCG_CARD_FRAME_H, TCG_CARD_FRAME_W, TcgCard } from "@/components/TcgCard";
import { getAllCardTemplates } from "@/lib/cards";
import { loadSave } from "@/lib/storage";
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

function sortCatalog(cards: CardTemplate[]): CardTemplate[] {
  return [...cards].sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, "pt"));
}

function filterCatalog(cards: CardTemplate[], query: string): CardTemplate[] {
  const q = query.trim().toLowerCase();
  if (!q) return cards;
  return cards.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.race.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.cardType.toLowerCase().includes(q),
  );
}

export default function CollectionPage() {
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState<CardTemplate | null>(null);
  const [previewScale, setPreviewScale] = useState(1.4);
  const [gridScale, setGridScale] = useState(0.92);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const gridRef = useRef<HTMLDivElement>(null);

  const catalog = useMemo(() => sortCatalog(getAllCardTemplates()), []);
  const cards = useMemo(() => filterCatalog(catalog, query), [catalog, query]);
  const unlockedCount = ownedIds.size;

  useEffect(() => {
    const s = loadSave();
    setOwnedIds(new Set(s.collectionCardIds));
  }, []);

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
          <h1 className="mt-2 font-serif text-3xl font-bold text-amber-100">Acervo VSF</h1>
          <p className="text-sm text-[var(--muted)]">
            <span className="font-medium text-zinc-200">{unlockedCount}</span> desbloqueada
            {unlockedCount === 1 ? "" : "s"} de {catalog.length} no catálogo
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
        {cards.map((card) => {
          const owned = ownedIds.has(card.id);
          return (
            <div
              key={card.id}
              className={[
                "relative rounded-lg transition-[filter,opacity]",
                owned ? "" : "opacity-50 grayscale",
              ].join(" ")}
            >
              <TcgCard
                card={card}
                sizeScale={gridScale}
                disabled={!owned}
                onClick={() => owned && setPreview(card)}
              />
              {!owned && (
                <div
                  className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
                  aria-hidden
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/60 shadow-lg ring-1 ring-white/25">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-7 w-7 text-zinc-200"
                      fill="currentColor"
                      aria-hidden
                    >
                      <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 8V7a3 3 0 1 1 6 0v3H9z" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/85 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`Carta: ${preview.name}`}
          onClick={() => setPreview(null)}
        >
          <div
            className="relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="absolute z-[60] flex h-7 w-7 items-center justify-center text-2xl font-light leading-none text-white/45 transition-colors hover:text-white/85"
              style={{
                top: arrowPadding(preview.effects).top * previewScale + 4,
                right: 6,
              }}
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
