import { CardTile } from "@/components/CardTile";
import { PadPreviewStats } from "@/components/PadPreviewStats";
import { PAD_PLACEMENT_SCALE } from "@/components/TcgCard";
import { unitToPadPreview } from "@/lib/battle/battle-preview";
import { COLUMN_LABELS, type BoardRow, type BattleUnit } from "@/lib/types";

interface BoardProps {
  enemyRow: BoardRow;
  playerRow: BoardRow;
  showBattleStats?: boolean;
}

function Slot({
  unit,
  arrowSide,
  showStats,
}: {
  unit: BattleUnit | null;
  arrowSide: "player" | "enemy";
  showStats: boolean;
}) {
  const alive = unit && unit.currentHp > 0;

  return (
    <div className="flex flex-col items-center">
      {showStats && alive && unit && <PadPreviewStats preview={unitToPadPreview(unit)} />}
      {alive ? (
        <CardTile card={unit} compact sizeScale={PAD_PLACEMENT_SCALE} arrowSide={arrowSide} />
      ) : (
        <div
          className="slot-empty flex items-center justify-center text-sm text-[var(--muted)]"
          style={{ minHeight: 80, minWidth: 60 }}
        >
          —
        </div>
      )}
    </div>
  );
}

function RowDisplay({
  label,
  row,
  arrowSide,
  showStats,
}: {
  label: string;
  row: BoardRow;
  arrowSide: "player" | "enemy";
  showStats: boolean;
}) {
  return (
    <div>
      <p className="mb-2 text-center text-xs uppercase tracking-wider text-[var(--muted)]">{label}</p>
      <div className="grid grid-cols-3 justify-items-center gap-3">
        {row.map((unit, i) => (
          <div key={i} className="flex flex-col items-center">
            <p className="mb-1 text-center text-[10px] text-[var(--muted)]">{COLUMN_LABELS[i]}</p>
            <Slot unit={unit} arrowSide={arrowSide} showStats={showStats} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function Board({ enemyRow, playerRow, showBattleStats = false }: BoardProps) {
  return (
    <div className="space-y-4">
      <RowDisplay
        label="Inimigo"
        row={enemyRow}
        arrowSide="enemy"
        showStats={showBattleStats}
      />
      <div className="h-px bg-white/10" />
      <RowDisplay label="Você" row={playerRow} arrowSide="player" showStats={showBattleStats} />
    </div>
  );
}
