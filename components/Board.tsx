import { CardTile } from "@/components/CardTile";
import { COLUMN_LABELS, type BoardRow, type BattleUnit } from "@/lib/types";

interface BoardProps {
  enemyRow: BoardRow;
  playerRow: BoardRow;
}

function RowDisplay({ label, row }: { label: string; row: BoardRow }) {
  return (
    <div>
      <p className="mb-2 text-center text-xs uppercase tracking-wider text-[var(--muted)]">{label}</p>
      <div className="grid grid-cols-3 gap-3">
        {row.map((unit, i) => (
          <div key={i}>
            <p className="mb-1 text-center text-[10px] text-[var(--muted)]">{COLUMN_LABELS[i]}</p>
            <CardTile card={unit as BattleUnit | null} disabled compact />
          </div>
        ))}
      </div>
    </div>
  );
}

export function Board({ enemyRow, playerRow }: BoardProps) {
  return (
    <div className="space-y-4">
      <RowDisplay label="Inimigo" row={enemyRow} />
      <div className="h-px bg-white/10" />
      <RowDisplay label="Você" row={playerRow} />
    </div>
  );
}
