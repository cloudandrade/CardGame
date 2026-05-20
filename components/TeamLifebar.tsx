interface TeamLifebarProps {
  label: string;
  current: number;
  max: number;
  variant: "player" | "enemy";
}

export function TeamLifebar({ label, current, max, variant }: TeamLifebarProps) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  const fill =
    variant === "player"
      ? "bg-gradient-to-r from-emerald-600 to-emerald-400"
      : "bg-gradient-to-r from-red-700 to-red-500";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] uppercase tracking-wide text-zinc-400">
        <span>{label}</span>
        <span className="font-[family-name:var(--font-fira)] tabular-nums text-zinc-200">
          {current} / {max}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-black/50 ring-1 ring-white/10">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ease-out ${fill}`}
          style={{ width: `${pct}%` }}
        ></div>
      </div>
    </div>
  );
}
