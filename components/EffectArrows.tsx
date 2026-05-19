import type { CardEffect, EffectCategory, EffectDirection } from "@/lib/types";

export const ARROW_ZONE_H = 36;

const COLORS: Record<EffectCategory, string> = {
  attack: "#f87171",
  defense: "#60a5fa",
  magic: "#c084fc",
};

interface ArrowSpec {
  category: EffectCategory;
  direction: EffectDirection;
}

function dirsFor(effect: CardEffect): EffectDirection[] {
  if (effect.variant === "group-attack") return ["left", "middle", "right"];
  return effect.directions.length > 0 ? effect.directions : ["middle"];
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

const X_POS: Record<EffectDirection, string> = {
  left: "22%",
  middle: "50%",
  right: "78%",
};

/** Ataque (topo): diagonal para colunas inimigas. Defesa/magia (base): middle = ↑ em si; laterais = ← → */
function arrowPath(spec: ArrowSpec, zone: "attack" | "ally"): string {
  if (zone === "attack") {
    if (spec.direction === "left") return "M 50 34 L 38 6";
    if (spec.direction === "right") return "M 50 34 L 62 6";
    return "M 50 34 L 50 6";
  }
  if (spec.direction === "middle") return "M 50 34 L 50 6";
  if (spec.direction === "left") return "M 78 20 L 18 20";
  return "M 22 20 L 82 20";
}

function ExternalArrow({
  spec,
  zone,
  idPrefix,
  index,
}: {
  spec: ArrowSpec;
  zone: "attack" | "ally";
  idPrefix: string;
  index: number;
}) {
  const color = COLORS[spec.category];
  const markerId =
    spec.category === "attack"
      ? `${idPrefix}-red-${index}`
      : spec.category === "defense"
        ? `${idPrefix}-blue-${index}`
        : `${idPrefix}-purple-${index}`;

  const path = arrowPath(spec, zone);

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
}: {
  arrows: ArrowSpec[];
  placement: "top" | "bottom";
  zone: "attack" | "ally";
  idPrefix: string;
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
          <ExternalArrow spec={spec} zone={zone} idPrefix={idPrefix} index={i} />
        </div>
      ))}
    </div>
  );
}

interface EffectArrowsProps {
  effects: CardEffect[];
  cardId?: string;
}

export function EffectArrows({ effects, cardId = "card" }: EffectArrowsProps) {
  const topArrows = collectArrows(effects, "top");
  const bottomArrows = collectArrows(effects, "bottom");

  return (
    <>
      <ArrowZone arrows={topArrows} placement="top" zone="attack" idPrefix={`${cardId}-top`} />
      <ArrowZone arrows={bottomArrows} placement="bottom" zone="ally" idPrefix={`${cardId}-bot`} />
    </>
  );
}

export function arrowPadding(effects: CardEffect[]) {
  const top = collectArrows(effects, "top").length > 0;
  const bottom = collectArrows(effects, "bottom").length > 0;
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
