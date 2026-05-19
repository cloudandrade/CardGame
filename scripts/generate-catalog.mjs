/**
 * Gera data/cards/catalog.json com ~200 cartas (mitologia, raças, efeitos).
 * Rodar: node scripts/generate-catalog.mjs
 */
import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../data/cards/catalog.json");

const EPITHETS = [
  "Destemido",
  "Sombrio",
  "Glacial",
  "Ardente",
  "Silencioso",
  "Velho",
  "Jovem",
  "Primal",
  "Sagrado",
  "Maldito",
  "Espectral",
  "Feral",
  "Nobre",
  "Exilado",
  "Runado",
  "Selvagem",
  "Etéreo",
  "Rúnico",
  "Ancestral",
  "Corajoso",
  "Vingativo",
  "Pacífico",
  "Astuto",
  "Feroz",
  "Luminoso",
  "Abissal",
  "Tempestuoso",
  "Venerável",
  "Inquieto",
  "Solitário",
];

const RACES = {
  humano: {
    names: [
      "Demian",
      "Liora",
      "Cassian",
      "Mira",
      "Thalen",
      "Elara",
      "Roric",
      "Senna",
      "Darian",
      "Ysolde",
      "Gavril",
      "Nessa",
      "Orin",
      "Petra",
      "Halden",
      "Isolde",
      "Kael",
      "Bruna",
      "Torren",
      "Vale",
    ],
    roles: [
      "explorador de ruínas",
      "caçador de relíquias",
      "mercador errante",
      "escriba arcano",
      "capitão de milícia",
      "curandeiro de campo",
      "ladrão de guilda",
      "cartógrafo místico",
    ],
    traits: [
      "curioso e perspicaz",
      "órfão, mas destemido",
      "leal aos poucos amigos que ainda tem",
      "cresceu entre contrabandistas e aprendeu a sobreviver",
      "busca redenção por um erro do passado",
    ],
  },
  elfo: {
    names: [
      "Aelindra",
      "Faelar",
      "Silveth",
      "Nymeris",
      "Caerion",
      "Luneth",
      "Thalorin",
      "Eryndil",
      "Vaeris",
      "Myrel",
      "Sylvara",
      "Orendil",
    ],
    roles: [
      "guardião da Floresta Antiga",
      "arqueiro da lua",
      "cantor de éter",
      "tecelão de sonhos",
      "sentinela élfica",
    ],
    traits: [
      "ouve segredos no vento",
      "memória longa e paciência curta para invasores",
      "exilado por profecia que recusa cumprir",
    ],
  },
  orc: {
    names: [
      "Grokhan",
      "Urza",
      "Moknar",
      "Drakka",
      "Harg",
      "Skarn",
      "Brakka",
      "Thurn",
      "Zagra",
      "Korgath",
    ],
    roles: [
      "chefe de clã das cinzas",
      "domador de wargs",
      "xamã de guerra",
      "ferreiro ritualístico",
    ],
    traits: [
      "honra o código do clã acima de tudo",
      "rejeitou a tirania do próprio chefe",
      "cicatrizes contam histórias que não precisa repetir",
    ],
  },
  anao: {
    names: [
      "Borin",
      "Helga",
      "Durik",
      "Magda",
      "Thrain",
      "Kilda",
      "Grimnar",
      "Sigrid",
    ],
    roles: [
      "forjador de runas",
      "minerador profundo",
      "guardião de salão ancestral",
    ],
    traits: [
      "teimosia maior que a montanha",
      "perdeu o clã num desabamento e jurou vingança",
    ],
  },
  fada: {
    names: [
      "Piprel",
      "Mossara",
      "Lirien",
      "Thistle",
      "Oberin",
      "Nixie",
      "Brumara",
      "Flick",
    ],
    roles: [
      "mensageira dos bosques",
      "trapaceira benevolente",
      "guardiã de fontes",
    ],
    traits: [
      "riso perigoso e promessas verdadeiras",
      "odeia promessas quebradas sob luar",
    ],
  },
  demonio: {
    names: [
      "Malachar",
      "Vexis",
      "Kallidor",
      "Sareth",
      "Nyxhar",
      "Azrakel",
    ],
    roles: [
      "senhor de contratos",
      "tentador de corações",
      "príncipe das cinzas",
    ],
    traits: [
      "sorri antes de cobrar o preço",
      "exilado do inferno por ter mentido para um deus",
    ],
  },
  dragao: {
    names: [
      "Vermithrax",
      "Seryn",
      "Kavros",
      "Ignivar",
      "Aurelion",
    ],
    roles: [
      "guardião de covil antigo",
      "filho do céu em forma menor",
    ],
    traits: [
      "orgulho que precede a queda — ou a vitória",
      "coleciona histórias em vez de ouro",
    ],
  },
  morto_vivo: {
    names: [
      "Morwen",
      "Kethis",
      "Varnak",
      "Sylth",
      "Ossian",
    ],
    roles: [
      "cavaleiro esqueleto",
      "necromante arrependido",
      "espectro de batalha",
    ],
    traits: [
      "memória que recusa apodrecer",
      "busca o nome que perdeu na morte",
    ],
  },
  celestial: {
    names: [
      "Seraphiel",
      "Lumina",
      "Caelion",
      "Auriel",
    ],
    roles: [
      "heraldo da aurora",
      "juiz de almas",
    ],
    traits: [
      "compaixão temperada por julgamento",
    ],
  },
  besta: {
    names: [
      "Fenrir",
      "Grifo das Dunas",
      "Lycanis",
      "Chimera",
      "Basilisco Menor",
    ],
    roles: [
      "predador lendário",
      "espírito totêmico",
    ],
    traits: [
      "instinto que ainda escuta deuses antigos",
    ],
  },
  elemental: {
    names: [
      "Pyrrion",
      "Glaciel",
      "Zephyra",
      "Terranox",
    ],
    roles: [
      "avatar do elemento",
      "tempestade personificada",
    ],
    traits: [
      "poucas palavras, muita consequência",
    ],
  },
  nagá: {
    names: ["Ssethris", "Vassara", "Nehmet", "Zyss"],
    roles: ["oráculo serpentino", "guardião de templo inundado"],
    traits: ["sussurra profecias entre escamas"],
  },
  vampiro: {
    names: ["Vladren", "Morana", "Duskiel", "Kaspar"],
    roles: ["nobre da noite eterna", "caçador de sangue ritual"],
    traits: ["elegância que esconde fome antiga"],
  },
  licantropo: {
    names: ["Ragnulf", "Mireya", "Fenris", "Ulric"],
    roles: ["alfa da matilha lunar", "exilado entre duas luas"],
    traits: ["humanidade disputada a cada lua cheia"],
  },
  titã: {
    names: ["Kronar", "Gaiaen", "Hyperion Menor"],
    roles: ["filho de titã adormecido"],
    traits: ["passos que fazem tremer a terra"],
  },
  construto: {
    names: ["Golem-7", "Autarco", "Brassik"],
    roles: ["guardião de biblioteca viva", "autômato despertado"],
    traits: ["lógica fria, lealdade escolhida"],
  },
  harpia: {
    names: ["Aello", "Ocypete", "Stormclaw"],
    roles: ["rainha dos penhascos"],
    traits: ["canto que arrasta navios ao abismo"],
  },
  quimera: {
    names: ["Tríceps", "Chimera das Brumas"],
    roles: ["fusão impossível de naturezas"],
    traits: ["três mentes, um ódio"],
  },
};

const EFFECT_PRESETS = [
  {
    effects: [{ orientation: "up", category: "attack", variant: "attack", power: 3, directions: ["middle"] }],
    summary: "Golpe frontal contra o centro inimigo.",
  },
  {
    effects: [
      { orientation: "up", category: "attack", variant: "attack", power: 3, directions: ["middle", "left"] },
    ],
    summary: "Ataca centro e esquerda do campo adversário.",
  },
  {
    effects: [{ orientation: "down", category: "defense", variant: "defense", power: 3, directions: ["right"] }],
    summary: "Protege o aliado à direita.",
  },
  {
    effects: [
      { orientation: "up", category: "attack", variant: "attack-double", power: 2, directions: ["middle"] },
    ],
    summary: "Ataque duplo no centro.",
  },
  {
    effects: [{ orientation: "up", category: "attack", variant: "group-attack", power: 2, directions: [] }],
    summary: "Varre toda a fileira inimiga.",
  },
  {
    effects: [{ orientation: "down", category: "magic", variant: "heal", power: 3, directions: ["middle"] }],
    summary: "Cura o aliado central.",
  },
  {
    effects: [{ orientation: "down", category: "magic", variant: "enchant", power: 2, directions: ["middle"] }],
    summary: "Encanta o aliado central (+ataque).",
  },
  {
    effects: [
      { orientation: "up", category: "attack", variant: "attack", power: 2, directions: ["right"] },
      { orientation: "down", category: "defense", variant: "defense", power: 3, directions: ["middle"] },
    ],
    summary: "Ataca à direita e defende o centro aliado.",
  },
  {
    effects: [
      { orientation: "up", category: "attack", variant: "attack", power: 4, directions: ["left"] },
      { orientation: "down", category: "defense", variant: "defense", power: 2, directions: ["left", "middle"] },
    ],
    summary: "Pressiona a esquerda inimiga e protege aliados.",
  },
];

function slug(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function pick(arr, i) {
  return arr[i % arr.length];
}

function rand(min, max, seed) {
  const x = Math.sin(seed * 9999) * 10000;
  return min + Math.floor((x - Math.floor(x)) * (max - min + 1));
}

function buildDescription(race, epithet, name, seed) {
  const r = RACES[race];
  const role = pick(r.roles, seed);
  const trait = pick(r.traits, seed + 1);
  const extra = pick(
    [
      "Carrega um amuleto que nunca mostra a ninguém.",
      "Dizem que já viu um deus e sobreviveu para contar — quase.",
      "Sua lenda começou com um acidente e um juramento.",
      "Bebe chá amargo antes de cada batalha.",
    ],
    seed + 2,
  );
  return `${epithet} ${name} é um ${role}, ${trait}. ${extra}`;
}

const raceKeys = Object.keys(RACES);
const cards = [];
const usedSlugs = new Set();

for (let i = 0; i < 200; i++) {
  const race = raceKeys[i % raceKeys.length];
  const r = RACES[race];
  const epithet = pick(EPITHETS, i * 3);
  const name = pick(r.names, i * 7 + 2);
  const fullName = `${epithet} ${name}`;
  let id = slug(fullName);
  let n = 1;
  while (usedSlugs.has(id)) {
    id = `${slug(fullName)}-${++n}`;
  }
  usedSlugs.add(id);

  const hp = rand(4, 11, i);
  const level = rand(1, 4, i + 50);
  const preset = pick(EFFECT_PRESETS, i * 11);
  const effects = preset.effects.map((e) => ({
    ...e,
    power: Math.min(12, Math.max(1, e.power + rand(-1, 1, i))),
  }));

  cards.push({
    id,
    name: fullName,
    race,
    description: buildDescription(race, epithet, name, i),
    effectSummary: preset.summary,
    hp,
    level,
    effects,
    artUrl: `https://picsum.photos/seed/vsf-${id}/400/560`,
    artQuery: `${race} fantasy character illustration`,
    artCredit: "Placeholder — rode scripts/fetch-art.mjs para artes Openverse",
  });
}

// Carta exemplo canônica no início
cards.unshift({
  id: "destemido-demian",
  name: "Destemido Demian",
  race: "humano",
  description:
    "Jovem explorador, curioso e perspicaz, órfão mas destemido o suficiente para sobreviver sozinho explorando e caçando tesouros e sua própria sobrevivência.",
  effectSummary: "Ataca o centro e a esquerda inimigos; defende o aliado à direita.",
  hp: 7,
  level: 1,
  effects: [
    { orientation: "up", category: "attack", variant: "attack", power: 3, directions: ["middle", "left"] },
    { orientation: "down", category: "defense", variant: "defense", power: 3, directions: ["right"] },
  ],
  artUrl: "https://picsum.photos/seed/vsf-destemido-demian/400/560",
  artQuery: "young adventurer fantasy illustration",
  artCredit: "Placeholder",
});

writeFileSync(OUT, JSON.stringify({ version: 1, count: cards.length, cards }, null, 2), "utf8");
console.log(`Gerado ${cards.length} cartas em ${OUT}`);
