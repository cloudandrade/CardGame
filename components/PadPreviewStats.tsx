import type { ReactNode } from "react";
import { formatDefPreview, type PadCombatPreview } from "@/lib/battle/placement-preview";
import { STAT_ICONS } from "@/lib/icons";

interface PadPreviewStatsProps {
  preview: PadCombatPreview;
}

function MiniStat({ icon, label, children }: { icon: string; label: string; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-0.5" title={label}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={icon} alt="" className="h-3.5 w-3.5 object-contain opacity-90" />
      <span className="font-[family-name:var(--font-fira)] text-[10px] font-semibold text-zinc-200">
        {children}
      </span>
    </span>
  );
}

export function PadPreviewStats({ preview }: PadPreviewStatsProps) {
  const defText = formatDefPreview(preview.defSelf, preview.defAllyParts);
  const hasDef = defText !== "—";

  return (
    <div className="mb-2 w-full max-w-[140px] space-y-1 text-center">
      <p className="line-clamp-2 font-[family-name:var(--font-fira)] text-[9px] uppercase leading-tight tracking-wide text-amber-100/90">
        {preview.name}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-lg bg-black/50 px-2 py-1.5">
        <MiniStat icon={STAT_ICONS.hp} label="Pontos de vida">
          {preview.lp}
          {preview.lpHeal > 0 && <span className="text-emerald-400">+{preview.lpHeal}</span>}
        </MiniStat>
        {(preview.atk > 0 || preview.atkEnchant > 0) && (
          <MiniStat icon={STAT_ICONS.attack} label="Ataque">
            {preview.atk > 0 ? preview.atk : 0}
            {preview.atkEnchant > 0 && <span className="text-amber-300">+{preview.atkEnchant}</span>}
          </MiniStat>
        )}
        {hasDef && (
          <MiniStat icon={STAT_ICONS.defense} label="Defesa (si + aliados)">
            {defText}
          </MiniStat>
        )}
      </div>
    </div>
  );
}
