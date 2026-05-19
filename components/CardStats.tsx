import { STAT_ICONS } from "@/lib/icons";
import type { CardStats as Stats } from "@/lib/types";

/** Escala do desenho dentro do slot fixo (alinhamento visual da coluna). */
const ICON_SCALE: Record<string, number> = {
  [STAT_ICONS.hp]: 1,
  [STAT_ICONS.attack]: 0.78,
  [STAT_ICONS.defense]: 0.84,
  [STAT_ICONS.magic]: 0.84,
};

interface CardStatsProps {
  stats: Stats;
  /** PV atual em batalha; se omitido, usa stats.hp */
  currentHp?: number;
  compact?: boolean;
}

function StatItem({
  icon,
  value,
  label,
  compact,
}: {
  icon: string;
  value: number;
  label: string;
  compact?: boolean;
}) {
  const slot = compact ? 36 : 48;
  const scale = ICON_SCALE[icon] ?? 1;
  const iconSize = Math.round(slot * scale);

  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: slot, height: slot }}
      title={label}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={icon}
        alt=""
        className="object-contain drop-shadow-md"
        style={{ width: iconSize, height: iconSize }}
      />
      <span
        className={`absolute inset-0 flex items-center justify-center font-[family-name:var(--font-jomhuria)] leading-none text-black ${compact ? "text-xl" : "text-[28px]"}`}
        style={{
          textShadow:
            "0 0 3px #fff, 0 0 3px #fff, 1px 1px 0 #fff, -1px -1px 0 #fff",
        }}
      >
        {value}
      </span>
    </div>
  );
}

export function CardStats({ stats, currentHp, compact }: CardStatsProps) {
  const hp = currentHp ?? stats.hp;

  return (
    <div className={`flex flex-col gap-1 ${compact ? "gap-0.5" : ""}`}>
      <StatItem icon={STAT_ICONS.hp} value={hp} label="Pontos de vida" compact={compact} />
      {stats.attack > 0 && (
        <StatItem icon={STAT_ICONS.attack} value={stats.attack} label="Ataque" compact={compact} />
      )}
      {stats.defense != null && stats.defense > 0 && (
        <StatItem icon={STAT_ICONS.defense} value={stats.defense} label="Defesa" compact={compact} />
      )}
      {stats.magic != null && stats.magic > 0 && (
        <StatItem icon={STAT_ICONS.magic} value={stats.magic} label="Magia" compact={compact} />
      )}
    </div>
  );
}
