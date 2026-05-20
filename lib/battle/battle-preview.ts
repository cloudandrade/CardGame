import type { PadCombatPreview } from "@/lib/battle/placement-preview";
import type { BattleUnit, CardEffect } from "@/lib/types";

function attackPowerFromEffects(effects: CardEffect[]): number {
  let total = 0;
  for (const effect of effects) {
    if (effect.category !== "attack" || effect.orientation !== "up") continue;
    let power = effect.power;
    if (effect.variant === "attack-double") power *= 2;
    total += power;
  }
  return total;
}

/** Stats ao vivo de uma carta em batalha (mesmo formato do planejamento). */
export function unitToPadPreview(unit: BattleUnit): PadCombatPreview {
  return {
    cardId: unit.templateId,
    name: unit.name,
    lp: unit.currentHp,
    lpHeal: 0,
    atk: attackPowerFromEffects(unit.effects),
    atkEnchant: unit.enchantBonus,
    defSelf: unit.defenseRemaining,
    defAllyParts: [],
  };
}
