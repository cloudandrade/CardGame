/**
 * Busca ilustrações gratuitas (CC) na API Openverse e atualiza artUrl no catálogo.
 * Uso: node scripts/fetch-art.mjs [limite]
 * Respeita ~1 req/s. Créditos salvos em artCredit.
 */
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CATALOG = join(__dirname, "../data/cards/catalog.json");
const limit = Number(process.argv[2] || 30);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function searchOpenverse(query) {
  const url = new URL("https://api.openverse.org/v1/images/");
  url.searchParams.set("q", query);
  url.searchParams.set("license", "cc0,pdm,by,by-sa");
  url.searchParams.set("category", "illustration");
  url.searchParams.set("page_size", "5");
  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "VSF-CardGame/1.0 (educational; local dev)" },
  });
  if (!res.ok) throw new Error(`Openverse ${res.status}`);
  const data = await res.json();
  const hit = data.results?.find((r) => r.url && r.thumbnail);
  if (!hit) return null;
  return {
    url: hit.url,
    credit: `${hit.title || "Sem título"} — ${hit.creator || "Autor desconhecido"} (${hit.license?.toUpperCase() || "CC"}) via Openverse`,
  };
}

const catalog = JSON.parse(readFileSync(CATALOG, "utf8"));
let updated = 0;

for (const card of catalog.cards) {
  if (updated >= limit) break;
  if (card.artCredit && !card.artCredit.includes("Placeholder")) continue;

  const q = card.artQuery || `${card.race} fantasy illustration`;
  try {
    const art = await searchOpenverse(q);
    await sleep(1100);
    if (art) {
      card.artUrl = art.url;
      card.artCredit = art.credit;
      updated++;
      console.log(`✓ ${card.name}`);
    } else {
      console.log(`– sem resultado: ${card.name}`);
    }
  } catch (e) {
    console.warn(`! ${card.name}:`, e.message);
    await sleep(2000);
  }
}

writeFileSync(CATALOG, JSON.stringify(catalog, null, 2), "utf8");
console.log(`Atualizadas ${updated} artes em ${CATALOG}`);
