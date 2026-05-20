import { CardStats } from "@/components/CardStats";
import { arrowPadding, EffectArrows, type ArrowSide } from "@/components/EffectArrows";
import type { BattleUnit, CardEffect, CardTemplate } from "@/lib/types";

function isBattleUnit(card: CardTemplate | BattleUnit): card is BattleUnit {
  return "currentHp" in card;
}

export interface TcgCardProps {
  card: CardTemplate | BattleUnit;
  selected?: boolean;
  onClick?: () => void;
  compact?: boolean;
  /** Escala visual; sobrescreve o padrão de `compact`. */
  sizeScale?: number;
  disabled?: boolean;
  /** Orientação das setas; inimigo inverte ataque/defesa verticalmente. */
  arrowSide?: ArrowSide;
}

/** Largura/altura aproximadas do frame (carta + setas) para calcular zoom no modal. */
export const TCG_CARD_FRAME_W = 340;
export const TCG_CARD_FRAME_H = 560;

const CARD_W = 300;
const CARD_H = 450;

/** Escala dos pads na tela de seleção (igual ao compact das cartas no tabuleiro). */
export const PAD_PLACEMENT_SCALE = 0.42;

export function getTcgCardFrameSize(
  effects: CardEffect[],
  scale: number,
  arrowSide: ArrowSide = "player",
): { width: number; height: number } {
  const pad = arrowPadding(effects, arrowSide);
  return {
    width: CARD_W * scale,
    height: (CARD_H + pad.top + pad.bottom) * scale,
  };
}

export function TcgCard({
  card,
  selected,
  onClick,
  compact,
  sizeScale,
  disabled,
  arrowSide: arrowSideProp,
}: TcgCardProps) {
  const stats = card.stats;
  const currentHp = isBattleUnit(card) ? card.currentHp : undefined;
  const level = card.level;
  const cardId = isBattleUnit(card) ? card.instanceId : card.id;
  const arrowSide: ArrowSide =
    arrowSideProp ?? (isBattleUnit(card) ? card.row : "player");
  const pad = arrowPadding(card.effects, arrowSide);

  const scale = sizeScale ?? (compact ? 0.42 : 1);
  const isCompactView = compact || scale < 0.75;
  const frameH = CARD_H + pad.top + pad.bottom;
  const wrapW = CARD_W * scale;
  const wrapH = frameH * scale;

  const shellClass = [
    "relative overflow-visible bg-transparent",
    selected ? "ring-4 ring-[var(--accent)] rounded-[13px]" : "",
    onClick && !disabled ? "cursor-pointer hover:brightness-105" : "",
    disabled ? "opacity-60" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const inner = (
    <div
      className="relative origin-top-left"
      style={{ width: CARD_W, height: frameH, transform: `scale(${scale})` }}
    >
      <EffectArrows effects={card.effects} cardId={cardId} side={arrowSide} />

      <div
        className="absolute left-0 box-border overflow-hidden rounded-[13px] border-2 border-black bg-transparent shadow-lg"
        style={{ width: CARD_W, height: CARD_H, top: pad.top }}
      >
        {card.artUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.artUrl}
            alt=""
            className="absolute inset-0 h-full w-full rounded-[11px] object-cover object-top"
          />
        )}

        <div className="absolute left-1/2 top-1 z-20 flex w-[251px] -translate-x-1/2 items-center justify-center border border-black bg-black px-2 py-1">
          <p className="text-center font-[family-name:var(--font-jomhuria)] text-[19px] leading-[1.05] text-white">
            {card.name}
          </p>
        </div>

        <div
          className="absolute left-4 top-3 z-10 box-border border-2 border-black bg-transparent"
          style={{ width: 268, height: 310 }}
        >
          <div className="absolute left-1 top-2 z-20">
            <CardStats stats={stats} currentHp={currentHp} compact={isCompactView} />
          </div>
        </div>

        <div
          className="absolute left-4 z-20 box-border border-2 border-black bg-white/55 backdrop-blur-[1px]"
          style={{ width: 268, height: 44, top: 328 }}
        >
          <div className="absolute left-px top-1 flex h-[38px] w-[63px] flex-col items-center justify-center rounded-sm bg-[#090808]">
            <span className="font-[family-name:var(--font-fira)] text-[7px] text-white/80">LV.</span>
            <span className="font-[family-name:var(--font-jomhuria)] text-[28px] leading-none text-white">
              {String(level).padStart(2, "0")}
            </span>
          </div>
          <p className="absolute left-[72px] top-1 z-10 max-w-[188px] font-[family-name:var(--font-fira)] text-[8px] uppercase leading-tight tracking-wide text-black">
            {card.cardType}
          </p>
          <div className="absolute left-[68px] top-[22px] z-10 min-h-[18px] w-[196px] rounded bg-[#090808] px-1.5 py-0.5">
            <p className="font-[family-name:var(--font-jomhuria)] text-[12px] leading-[13px] text-[#edecec]">
              Effect: {card.effectSummary}
            </p>
          </div>
        </div>

        <div
          className="absolute left-4 z-20 box-border border-2 border-black bg-white/55 p-2 backdrop-blur-[1px]"
          style={{ width: 268, height: 67.5, top: 378 }}
        >
          <p className="line-clamp-4 font-[family-name:var(--font-jomhuria)] text-sm leading-[14px] text-black">
            {card.description}
          </p>
        </div>
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={shellClass}
        style={{ width: wrapW, height: wrapH }}
      >
        {inner}
      </button>
    );
  }

  return (
    <div className={shellClass} style={{ width: wrapW, height: wrapH }}>
      {inner}
    </div>
  );
}
