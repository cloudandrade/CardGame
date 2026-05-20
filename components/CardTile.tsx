import { TcgCard, type TcgCardProps } from "@/components/TcgCard";
import type { BattleUnit, CardTemplate } from "@/lib/types";

interface CardTileProps {
  card?: CardTemplate | BattleUnit | null;
  selected?: boolean;
  onClick?: () => void;
  compact?: boolean;
  sizeScale?: number;
  disabled?: boolean;
  arrowSide?: TcgCardProps["arrowSide"];
}

export function CardTile({
  card,
  selected,
  onClick,
  compact,
  sizeScale,
  disabled,
  arrowSide,
}: CardTileProps) {
  if (!card) {
    return (
      <div className="slot-empty flex min-h-[120px] items-center justify-center text-sm text-[var(--muted)]">
        —
      </div>
    );
  }

  return (
    <TcgCard
      card={card}
      selected={selected}
      onClick={onClick}
      compact={compact}
      sizeScale={sizeScale}
      disabled={disabled}
      arrowSide={arrowSide}
    />
  );
}
