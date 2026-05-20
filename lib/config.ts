/** XP necessário para desbloquear cada nova carta no acervo. */
export const XP_PER_CARD_UNLOCK = 100;

/** Curas só resolvem da rodada 1 até esta (inclusive). */
export const HEAL_MAX_ROUND = 3;

/** XP ganho por vitória (definir em `.env` como `NEXT_PUBLIC_BATTLE_XP_REWARD`). */
export function getBattleXpReward(): number {
  const raw = process.env.NEXT_PUBLIC_BATTLE_XP_REWARD;
  if (raw === undefined || raw === "") return 5;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return 5;
  return Math.floor(n);
}
