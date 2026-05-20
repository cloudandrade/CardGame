import { BattleLogLine } from "@/lib/battle/log-render";
import type { BattleLogEntry } from "@/lib/battle/log";

interface BattleLogProps {
  entries: BattleLogEntry[];
  maxLines?: number;
  /** Log completo (tela de resultado / batalha instantânea). */
  expanded?: boolean;
}

export function BattleLog({ entries, maxLines = 14, expanded = false }: BattleLogProps) {
  const visible = expanded ? entries : entries.slice(-maxLines);

  return (
    <div
      className={[
        "log-scroll space-y-1 overflow-y-auto rounded-xl bg-black/30 p-3 text-xs leading-relaxed",
        expanded ? "max-h-[min(28rem,60vh)]" : "max-h-44",
      ].join(" ")}
    >
      {visible.map((entry, i) => (
        <BattleLogLine key={`${entry.kind}-${i}`} entry={entry} />
      ))}
    </div>
  );
}
