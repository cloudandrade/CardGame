import { XP_PER_CARD_UNLOCK, getBattleXpReward } from "@/lib/config";
import { getAllCardTemplates, getCardTemplate, pickUniqueTemplates } from "@/lib/cards";
import type { CardTemplate } from "@/lib/types";
import type { PlayerSave } from "@/lib/types";

const STORAGE_KEY = "vsf-save-v2";
const LEGACY_STORAGE_KEY = "vsf-save-v1";
const ROSTER_SIZE = 6;
/** XP por vitória antes de `totalXpEarned` existir (migração; não usa .env atual). */
const LEGACY_XP_PER_WIN = 5;

function pickInitialRosterIds(): string[] {
  return pickUniqueTemplates(ROSTER_SIZE, getAllCardTemplates()).map((c) => c.id);
}

function createNewSave(): PlayerSave {
  const rosterCardIds = pickInitialRosterIds();
  return {
    xp: 0,
    wins: 0,
    totalXpEarned: 0,
    rosterCardIds,
    collectionCardIds: [...rosterCardIds],
  };
}

/** Cartas extras = marcos de 100 XP já alcançados no total ganho em batalhas. */
function xpUnlocksEarned(totalXpEarned: number): number {
  return Math.floor(Math.max(0, totalXpEarned) / XP_PER_CARD_UNLOCK);
}

function rebuildCollection(
  rosterCardIds: string[],
  totalXpEarned: number,
  previousCollection: string[],
): string[] {
  const roster = rosterCardIds
    .slice(0, ROSTER_SIZE)
    .filter((id) => Boolean(getCardTemplate(id)));
  const unlocks = xpUnlocksEarned(totalXpEarned);
  const validExtras = previousCollection.filter(
    (id) => Boolean(getCardTemplate(id)) && !roster.includes(id),
  );
  const extras = validExtras.slice(0, unlocks);

  while (extras.length < unlocks) {
    const pool = getAllCardTemplates().filter(
      (c) => !roster.includes(c.id) && !extras.includes(c.id),
    );
    if (pool.length === 0) break;
    extras.push(pool[Math.floor(Math.random() * pool.length)].id);
  }

  return [...roster, ...extras];
}

/** Garante XP total persistido; não recalcula com o .env atual. */
function ensureTotalXpEarned(save: PlayerSave): number {
  if (typeof save.totalXpEarned === "number" && save.totalXpEarned >= 0) {
    return save.totalXpEarned;
  }
  return save.wins * LEGACY_XP_PER_WIN;
}

function repairSave(save: PlayerSave): PlayerSave {
  const totalXpEarned = ensureTotalXpEarned(save);
  const collectionCardIds = rebuildCollection(
    save.rosterCardIds,
    totalXpEarned,
    save.collectionCardIds,
  );
  const sameCollection =
    collectionCardIds.length === save.collectionCardIds.length &&
    collectionCardIds.every((id, i) => id === save.collectionCardIds[i]);
  const sameXp = save.totalXpEarned === totalXpEarned;
  if (sameCollection && sameXp) return save;
  return { ...save, totalXpEarned, collectionCardIds };
}

function migrateLegacySave(parsed: Record<string, unknown>): PlayerSave {
  const legacyUnlocked = Array.isArray(parsed.unlockedCardIds)
    ? (parsed.unlockedCardIds as string[])
    : [];

  let rosterCardIds: string[];
  if (legacyUnlocked.length >= ROSTER_SIZE) {
    rosterCardIds = pickUniqueTemplates(
      ROSTER_SIZE,
      legacyUnlocked
        .map((id) => getCardTemplate(id))
        .filter((c): c is CardTemplate => Boolean(c)),
    ).map((c) => c.id);
  } else {
    rosterCardIds = pickInitialRosterIds();
  }

  const wins = typeof parsed.wins === "number" ? parsed.wins : 0;
  const xp = typeof parsed.xp === "number" ? parsed.xp : 0;
  const totalXpEarned = wins * LEGACY_XP_PER_WIN;

  return repairSave({
    xp,
    wins,
    totalXpEarned,
    rosterCardIds,
    collectionCardIds: rebuildCollection(rosterCardIds, totalXpEarned, []),
  });
}

function normalizeSave(raw: unknown): PlayerSave {
  if (!raw || typeof raw !== "object") return createNewSave();

  const parsed = raw as Record<string, unknown>;

  if (Array.isArray(parsed.rosterCardIds) && Array.isArray(parsed.collectionCardIds)) {
    const rosterCardIds = (parsed.rosterCardIds as string[]).slice(0, ROSTER_SIZE);
    while (rosterCardIds.length < ROSTER_SIZE) {
      const extra = pickInitialRosterIds().find((id) => !rosterCardIds.includes(id));
      if (!extra) break;
      rosterCardIds.push(extra);
    }
    const wins = typeof parsed.wins === "number" ? parsed.wins : 0;
    const xp = typeof parsed.xp === "number" ? parsed.xp : 0;
    const totalXpEarned =
      typeof parsed.totalXpEarned === "number" && parsed.totalXpEarned >= 0
        ? parsed.totalXpEarned
        : wins * LEGACY_XP_PER_WIN;

    return repairSave({
      xp,
      wins,
      totalXpEarned,
      rosterCardIds,
      collectionCardIds: rebuildCollection(
        rosterCardIds,
        totalXpEarned,
        parsed.collectionCardIds as string[],
      ),
    });
  }

  return migrateLegacySave(parsed);
}

export function loadSave(): PlayerSave {
  if (typeof window === "undefined") return createNewSave();
  try {
    const rawV2 = localStorage.getItem(STORAGE_KEY);
    if (rawV2) {
      const save = repairSave(normalizeSave(JSON.parse(rawV2)));
      persistSave(save);
      return save;
    }

    const rawV1 = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (rawV1) {
      const migrated = repairSave(normalizeSave(JSON.parse(rawV1)));
      persistSave(migrated);
      return migrated;
    }

    return createNewSave();
  } catch {
    return createNewSave();
  }
}

export function persistSave(save: PlayerSave): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
}

export function getRosterTemplates(save: PlayerSave): CardTemplate[] {
  return save.rosterCardIds
    .map((id) => getCardTemplate(id))
    .filter((c): c is CardTemplate => Boolean(c));
}

export function getCollectionTemplates(save: PlayerSave): CardTemplate[] {
  return save.collectionCardIds
    .map((id) => getCardTemplate(id))
    .filter((c): c is CardTemplate => Boolean(c));
}

export function playerHasLevel3Card(save: PlayerSave): boolean {
  return save.collectionCardIds.some((id) => {
    const card = getCardTemplate(id);
    return card !== undefined && card.level >= 3;
  });
}

export function addWinXp(save: PlayerSave): {
  save: PlayerSave;
  xpGained: number;
  cardsUnlocked: string[];
} {
  const xpGained = getBattleXpReward();
  const totalXpEarned = ensureTotalXpEarned(save) + xpGained;
  const next: PlayerSave = {
    ...save,
    xp: save.xp + xpGained,
    wins: save.wins + 1,
    totalXpEarned,
  };
  const cardsUnlocked: string[] = [];

  while (next.xp >= XP_PER_CARD_UNLOCK) {
    next.xp -= XP_PER_CARD_UNLOCK;
    const pool = getAllCardTemplates().filter((c) => !next.collectionCardIds.includes(c.id));
    if (pool.length === 0) break;
    const card = pool[Math.floor(Math.random() * pool.length)];
    next.collectionCardIds = [...next.collectionCardIds, card.id];
    cardsUnlocked.push(card.id);
  }

  next.collectionCardIds = rebuildCollection(
    next.rosterCardIds,
    next.totalXpEarned,
    next.collectionCardIds,
  );

  persistSave(next);
  return { save: next, xpGained, cardsUnlocked };
}

export function resetSave(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}

export { ROSTER_SIZE, XP_PER_CARD_UNLOCK };
