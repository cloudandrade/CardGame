import { getAllCardTemplates } from "@/lib/cards";
import type { PlayerSave } from "@/lib/types";

const STORAGE_KEY = "vsf-save-v1";

const DEFAULT_UNLOCKED = getAllCardTemplates().map((c) => c.id);

const DEFAULT_SAVE: PlayerSave = {
  xp: 0,
  level: 1,
  wins: 0,
  unlockedCardIds: DEFAULT_UNLOCKED,
};

export function loadSave(): PlayerSave {
  if (typeof window === "undefined") return { ...DEFAULT_SAVE, unlockedCardIds: [...DEFAULT_UNLOCKED] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SAVE, unlockedCardIds: [...DEFAULT_UNLOCKED] };
    const parsed = JSON.parse(raw) as PlayerSave;
    if (!parsed.unlockedCardIds?.length) {
      parsed.unlockedCardIds = [...DEFAULT_UNLOCKED];
    }
    return { ...DEFAULT_SAVE, ...parsed };
  } catch {
    return { ...DEFAULT_SAVE, unlockedCardIds: [...DEFAULT_UNLOCKED] };
  }
}

export function persistSave(save: PlayerSave): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
}

export function addWinXp(save: PlayerSave): { save: PlayerSave; leveledUp: boolean; newCardId?: string } {
  const next = { ...save, xp: save.xp + 5, wins: save.wins + 1 };
  let leveledUp = false;
  let newCardId: string | undefined;

  if (next.xp >= 100) {
    next.xp = next.xp - 100;
    next.level += 1;
    leveledUp = true;
    const pool = getAllCardTemplates().filter((c) => !next.unlockedCardIds.includes(c.id));
    if (pool.length > 0) {
      const card = pool[Math.floor(Math.random() * pool.length)];
      next.unlockedCardIds = [...next.unlockedCardIds, card.id];
      newCardId = card.id;
    }
  }

  persistSave(next);
  return { save: next, leveledUp, newCardId };
}

export function resetSave(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
