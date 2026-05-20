import type { CardEffect, EffectCategory, EffectDirection } from "@/lib/types";

export const ARROW_ZONE_H = 36;

const COLORS: Record<EffectCategory, string> = {
  attack: "#f87171",
  defense: "#60a5fa",
  magic: "#c084fc",
};

type ArrowDir = "left" | "middle" | "right";

interface ArrowSpec {
  category: EffectCategory;
  direction: ArrowDir;
}

function dirsFor(effect: CardEffect): ArrowDir[] {
  if (effect.variant === "group-attack") return ["left", "middle", "right"];
  const dirs = effect.directions.length > 0 ? effect.directions : ["middle"];
  if (dirs.includes("row")) return ["left", "middle", "right"];
  return dirs.filter((d): d is ArrowDir => d !== "row");
}

function collectArrows(effects: CardEffect[], zone: "top" | "bottom"): ArrowSpec[] {
  const out: ArrowSpec[] = [];
  for (const effect of effects) {
    const isAttack = effect.category === "attack";
    if (zone === "top" && !isAttack) continue;
    if (zone === "bottom" && isAttack) continue;
    for (const direction of dirsFor(effect)) {
      out.push({ category: effect.category, direction });
    }
  }
  return out;
}

const X_POS: Record<ArrowDir, string> = {
  left: "22%",
  middle: "50%",
  right: "78%",
};

const VIEW_H = 40;

/** Espelha coordenadas Y para setas do inimigo (ataque embaixo ↓, defesa/magia em cima ↑). */
function flipPathY(path: string): string {
  return path.replace(/([ML])\s*([\d.]+)\s+([\d.]+)/g, (_, cmd, x, y) => {
    return `${cmd} ${x} ${VIEW_H - Number(y)}`;
  });
}

/** Ataque (topo do jogador): diagonal para colunas inimigas. Defesa/magia (base): middle = ↑; laterais = ← → */
function arrowPath(spec: ArrowSpec, zone: "attack" | "ally", flip: boolean): string {
  let path: string;
  if (zone === "attack") {
    if (spec.direction === "left") path = "M 50 34 L 38 6";
    else if (spec.direction === "right") path = "M 50 34 L 62 6";
    else path = "M 50 34 L 50 6";
  } else if (spec.direction === "middle") {
    path = "M 50 34 L 50 6";
  } else if (spec.direction === "left") {
    path = "M 78 20 L 18 20";
  } else {
    path = "M 22 20 L 82 20";
  }
  return flip ? flipPathY(path) : path;
}

function ExternalArrow({
  spec,
  zone,
  idPrefix,
  index,
  flip,
}: {
  spec: ArrowSpec;
  zone: "attack" | "ally";
  idPrefix: string;
  index: number;
  flip: boolean;
}) {
  const color = COLORS[spec.category];
  const markerId =
    spec.category === "attack"
      ? `${idPrefix}-red-${index}`
      : spec.category === "defense"
        ? `${idPrefix}-blue-${index}`
        : `${idPrefix}-purple-${index}`;

  const path = arrowPath(spec, zone, flip);

  return (
    <svg className="h-full w-[72px]" viewBox="0 0 100 40" preserveAspectRatio="xMidYMid meet" aria-hidden>
      <defs>
        <marker id={markerId} markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
          <polygon points="0 0, 7 3.5, 0 7" fill={color} />
        </marker>
      </defs>
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        markerEnd={`url(#${markerId})`}
      />
    </svg>
  );
}

function ArrowZone({
  arrows,
  placement,
  zone,
  idPrefix,
  flip,
}: {
  arrows: ArrowSpec[];
  placement: "top" | "bottom";
  zone: "attack" | "ally";
  idPrefix: string;
  flip: boolean;
}) {
  if (arrows.length === 0) return null;

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 z-30 ${placement === "top" ? "top-0" : "bottom-0"}`}
      style={{ height: ARROW_ZONE_H }}
    >
      {arrows.map((spec, i) => (
        <div
          key={`${spec.category}-${spec.direction}-${i}`}
          className="absolute top-0 h-full"
          style={{ left: X_POS[spec.direction], transform: "translateX(-50%)" }}
        >
          <ExternalArrow spec={spec} zone={zone} idPrefix={idPrefix} index={i} flip={flip} />
        </div>
      ))}
    </div>
  );
}

export type ArrowSide = "player" | "enemy";

interface EffectArrowsProps {
  effects: CardEffect[];
  cardId?: string;
  /** Inimigo: ataque embaixo (↓ jogador), defesa/magia em cima (↑ aliados). */
  side?: ArrowSide;
}

export function EffectArrows({ effects, cardId = "card", side = "player" }: EffectArrowsProps) {
  const invert = side === "enemy";
  const topArrows = collectArrows(effects, invert ? "bottom" : "top");
  const bottomArrows = collectArrows(effects, invert ? "top" : "bottom");

  return (
    <>
      <ArrowZone
        arrows={topArrows}
        placement="top"
        zone={invert ? "ally" : "attack"}
        idPrefix={`${cardId}-top`}
        flip={invert}
      />
      <ArrowZone
        arrows={bottomArrows}
        placement="bottom"
        zone={invert ? "attack" : "ally"}
        idPrefix={`${cardId}-bot`}
        flip={invert}
      />
    </>
  );
}

export function arrowPadding(effects: CardEffect[], side: ArrowSide = "player") {
  const invert = side === "enemy";
  const top = collectArrows(effects, invert ? "bottom" : "top").length > 0;
  const bottom = collectArrows(effects, invert ? "top" : "bottom").length > 0;
  return {
    top: top ? ARROW_ZONE_H : 0,
    bottom: bottom ? ARROW_ZONE_H : 0,
  };
}

export function effectLegend() {
  return (
    <div className="flex flex-wrap gap-3 text-[10px] text-zinc-400">
      <span className="flex items-center gap-1">
        <span className="inline-block h-0.5 w-3 bg-[#f87171]" /> Ataque (fora · topo)
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block h-0.5 w-3 bg-[#60a5fa]" /> Defesa (↑ si · ← → aliado)
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block h-0.5 w-3 bg-[#c084fc]" /> Magia (↑ si · ← → aliado)
      </span>
    </div>
  );
}
