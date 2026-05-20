# VSF — Very Snap Fight

Jogo de cartas web simples: **3 vs 3** numa fileira, contra a IA.

## Rodar localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## O que tem hoje

- Escolher 3 cartas e posicionar (esquerda / centro / direita)
- Batalha por rodadas com ataque, defesa, cura e encantamento
- IA fácil (aleatória); IA avançada ao ter carta nível 3+ no acervo
- 6 cartas fixas por partida; acervo cresce a cada 100 XP
- Progresso no **localStorage**
- XP por vitória: `NEXT_PUBLIC_BATTLE_XP_REWARD` (copie `.env.sample` → `.env.local`)
- Sem login, sem banco, sem PvP — propositalmente enxuto

## Coleção e cartas

- **10 cartas** — edite `data/cards/catalog.json` (ver `data/cards/README.md`)
- Artes: `public/cards/art/` · Ícones de stats: `public/icons/`
- Layout estilo TCG (modelo Figma): tipo no topo, PV em círculo, moldura da arte, barra LV/nome/efeito, descrição
- Setas na arte: vermelho = ataque, azul = defesa, roxo = magia
- Galeria: [/collection](http://localhost:3000/collection)

## Documentação das regras

Ver [docs/VSF-GAME_DESIGN.md](docs/VSF-GAME_DESIGN.md) (versão completa). A implementação web cobre um subconjunto simples das regras.

## Stack

- Next.js 15 + React 19 + TypeScript + Tailwind CSS 4
