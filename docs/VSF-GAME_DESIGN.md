# VSF — Very Snap Fight

Documento de definição, regras e lógica do jogo. Base para implementação em **React** + **Next.js** (sem engine 3D).

---

## 1. Visão geral

| Item | Definição |
|------|-----------|
| Nome | **VSF** — Very Snap Fight |
| Gênero | Trading Card Game (TCG) |
| Objetivo | Montar um deck, posicionar 3 cartas em batalha e vencer a IA (PvE) ou outro jogador (PvP) |
| Tabuleiro | Duas fileiras de **3 posições** (esquerda, centro, direita): 3 cartas suas × 3 cartas do oponente |
| Stack alvo | Next.js (App Router), React, TypeScript, UI 2D (CSS / Tailwind) |

> **Nota sobre “3×3”:** o combate não usa grid 9×9. São **2 fileiras × 3 colunas** (6 slots no total). A expressão “3×3” refere-se ao confronto **3 cartas vs 3 cartas**.

---

## 2. Tabuleiro e posições

### 2.1 Layout

```
        [L0]  [M0]  [R0]   ← fileira do oponente (Up / “frente inimiga”)
        [L1]  [M1]  [R1]   ← sua fileira (Down / “suas cartas”)
```

- **Colunas:** `left` (L), `middle` (M), `right` (R).
- **Fileiras:** `enemy` (oponente, acima) e `player` (você, abaixo).
- Cada slot aceita **no máximo 1 carta**.
- Na fase de preparação, o jogador **escolhe 3 cartas** entre 6 iniciais e **define em qual coluna** cada uma fica. Essa configuração **não muda durante a batalha**.

### 2.2 Mapeamento de direções

Dado um slot `(fileira, coluna)` da carta origem:

| Orientação | Significado | Alvo típico |
|------------|-------------|-------------|
| **Up** | Efeito aponta para a fileira **inimiga** | Mesma coluna (e vizinhas, conforme `directions`) na fileira oposta |
| **Down** | Efeito aponta para a **sua** fileira | Mesma coluna (e vizinhas) na sua fileira |

Dentro de Up ou Down, cada efeito lista uma ou mais direções relativas:

| Direction | Up (fileira inimiga) | Down (sua fileira) |
|-----------|----------------------|---------------------|
| `middle` | Coluna da própria carta | Coluna da própria carta |
| `left` | Coluna à esquerda (do ponto de vista do jogador) | Idem |
| `right` | Coluna à direita | Idem |
| `row` | **Todas** as colunas da fileira alvo (inimiga ou aliada) | Idem — independente da posição da carta |

**Exemplo (carta no centro M1):**

- `up-attack`, `directions: [middle, left]` → ataca **M0** e **L0**.
- `down-defense`, `directions: [right]` → reduz dano recebido por **R1** (carta aliada à direita no seu campo).

Se a coluna alvo estiver **vazia** (sem carta), o efeito direcionado a carta **não aplica dano/defesa em unidade**; dano excedente ou efeitos sem alvo seguem regras da seção [6. Resolução de combate](#6-resolução-de-combate).

---

## 3. Cartas

### 3.1 Atributos base

| Atributo | Limite | Descrição |
|----------|--------|-----------|
| `hp` | 1–12 | Pontos de vida da carta |
| `effectPower` | 1–12 | Potência base dos efeitos (ataque, defesa, mágica) |
| `level` | 1–4 | Tier da carta para drop e balanceamento |
| `name`, `id`, `art` | — | Identidade e apresentação |

### 3.2 Estrutura de efeitos

Uma carta possui **zero ou mais** entradas de efeito. Cada entrada:

```ts
type EffectOrientation = "up" | "down";
type EffectDirection = "left" | "middle" | "right" | "row";

interface CardEffect {
  orientation: EffectOrientation;  // up | down
  category: "attack" | "defense" | "magic";
  variant: AttackVariant | DefenseVariant | MagicVariant;
  power: number;                   // usa effectPower ou override ≤ 12
  directions: EffectDirection[];   // uma ou mais
  // metadados opcionais por variant (ex.: alvo de protect)
}
```

**Exemplo canônico:**

```json
{
  "id": "card_example",
  "name": "Exemplo",
  "hp": 7,
  "effectPower": 3,
  "level": 1,
  "effects": [
    {
      "orientation": "up",
      "category": "attack",
      "variant": "attack",
      "power": 3,
      "directions": ["middle", "left"]
    },
    {
      "orientation": "down",
      "category": "defense",
      "variant": "defense",
      "power": 3,
      "directions": ["right"]
    }
  ]
}
```

Interpretação: ataca o centro e a esquerda do campo inimigo com 3 de dano cada (por rodada, após regras de defesa); na sua fileira, **reduz em até 3** o dano que a carta em **R1** receberia.

### 3.3 Variantes de efeito

#### Ataque (`category: attack`)

| Variant | Comportamento |
|---------|----------------|
| `attack` | Aplica `power` de dano a cada alvo válido nas `directions` (Up → fileira inimiga). Use `row` para atingir todas as colunas inimigas ocupadas. |
| `attack-double` | Igual a `attack`, mas o dano aplicado é `power × 2` (ainda capado por regras de defesa/protect). |
| `group-attack` | Aplica `power` a **todos os slots ocupados** na fileira alvo (Up = fileira inteira do inimigo; se combinado com Down, fileira inteira aliada — raro em design, mas suportado). Ignora lista `directions` ou trata como “linha completa”. |

#### Defesa (`category: defense`)

| Variant | Comportamento |
|---------|----------------|
| `defense` | Reduz dano **incoming** nas cartas aliadas indicadas por `directions` em até `power` por rodada. Use `row` para proteger a fileira inteira. |
| `deflect` | Após redução por `defense`, redireciona até `power` de dano restante de volta ao atacante (slot de origem do ataque) ou à carta inimiga na mesma coluna do atacante — implementação: **dano refletido na carta que declarou o ataque** naquela rodada. |
| `protect` | Absorve dano destinado a **uma** carta aliada alvo: a carta com `protect` perde PV no lugar do aliado, até `power` ou até sua morte. Custo: PV da protectora. |

#### Mágica (`category: magic`)

| Variant | Comportamento |
|---------|----------------|
| `enchant` | Aumenta o dano de ataques da carta alvo (Down, direções) em `power` até o fim da batalha ou por N rodadas (escolha de implementação: **até fim da batalha**). |
| `heal` | Na **próxima rodada**, cura `power` PV de alvos nas direções **antes** de aplicar dano. Se a carta alvo morrer na **mesma rodada** em que o heal seria aplicado (primeira rodada de efeito), **heal não ocorre**. |
| `transform` | Aumenta PV máximo e atual da carta alvo em `power` (cap global de PV por carta: 12). |

---

## 4. Pontos de vida do jogador

- **PV do jogador** = soma dos `hp` iniciais das **3 cartas** posicionadas.
- Quando uma carta perde todo o PV, ela é **destruída** (slot vazio).
- **Dano direto ao jogador:** opcional nesta versão — **vitória apenas por eliminar todas as cartas inimigas** OU reduzir PV agregado inimigo a 0. Padrão adotado:
  - **Vitória:** destruir as 3 cartas do oponente **OU** reduzir a soma dos PV das cartas vivas do oponente a 0.
  - PV “do jogador” é derivado das cartas; não há segundo pool separado, salvo efeitos futuros de “face”.

---

## 5. Fluxo do jogo (meta)

### 5.1 Conta e persistência

| Modo | Comportamento |
|------|----------------|
| **Guest** | Entrada imediata sem cadastro. Progresso local/servidor temporário. **Conta apagada após 3 dias** sem conversão. |
| **Registrado** | Login (e-mail ou OAuth — ver stack). Mantém coleção, nível, XP, histórico. |

### 5.2 Início de sessão de batalha

1. Jogador possui **6 cartas iniciais** (starter pool).
2. Escolhe **3 cartas** para a partida.
3. **Posiciona** cada uma em L / M / R (configuração fixa).
4. Sistema calcula PV agregado e monta o tabuleiro.
5. Escolhe **PvE** ou **PvP**.

### 5.3 PvE

- Oponente: **IA** que escolhe 3 cartas aleatórias de um pool compatível com o nível do jogador e posiciona aleatoriamente (ou heurística simples).
- **+5 XP** por vitória.
- A cada **100 XP acumulado**: +1 carta nova (tier adequado) e **+1 nível de jogador**; XP zera o excedente (`xp = xp % 100` após subir).

### 5.4 PvP

- **Fila de matchmaking** por faixa de nível do jogador (mesmo “nível de conta”, não nível de carta).
- Oponente humano com regras idênticas de preparação.
- **+20 XP** por vitória; mesma regra de 100 XP → carta + level up.

### 5.5 Progressão de jogador e cartas

| Nível jogador | Cartas que podem **dropar** (tier) |
|---------------|-------------------------------------|
| 1–20 | Tier 1 (sempre); Tier 2 raro opcional |
| 21–40 | Tier 1 e 2; Tier 3 raro |
| 41–60 | Tier 1, 2 e 3; Tier 4 raro |
| 61+ | Todos os tiers com peso menor para tiers baixos |

- Jogador nível 35 **pode** receber cartas Tier 1; **não pode** receber Tier 4.
- Drops “aleatórios” são ponderados pelo tier máximo permitido para o nível.

**Fórmula de nível do jogador (proposta):**

```
playerLevel = 1 + floor(totalXpFromLevelUps / 100)
// ou tabela explícita se preferir marcos customizados
```

---

## 6. Resolução de combate

### 6.1 Filosofia: “Very Snap”

Batalhas **curtas** (meta: 3–8 rodadas). Uma **rodada** resolve todos os efeitos de forma determinística.

### 6.2 Ordem de resolução por rodada

1. **Buffs mágicos persistentes** (`enchant`, `transform`) já ativos modificam stats base.
2. **Fase mágica instantânea:** `heal` agendado da rodada anterior aplica; novos `heal` agendam para próxima; `enchant` / `transform` entram em vigor.
3. **Fase de ataque:** todas as cartas vivas disparam ataques (ordem: carta esquerda → centro → direita; jogador atual primeiro, depois oponente — ou **simultâneo** com pool de dano; adotar **simultâneo** e depois aplicar defesas).
4. **Pool de dano:** para cada slot alvo, somar dano de todos os ataques que o miram na rodada.
5. **Fase de defesa:** aplicar `defense`, depois `deflect`, depois `protect` por prioridade em cada alvo.
6. **Aplicar dano** aos PV das cartas; remover mortas.
7. **Verificar fim:** se um lado não tem cartas vivas → fim de jogo.

**Prioridade defensiva no mesmo alvo:** `defense` → `deflect` → `protect` (protect só no aliado designado).

### 6.3 Regras adicionais

- **Múltiplos efeitos na mesma carta:** todos disparam na mesma rodada (ataques somam; defesas acumulam redução até cap por efeito).
- **Carta sem efeito de ataque:** não causa dano; ainda pode defender ou buffar.
- **group-attack:** um único efeito pode atingir até 3 slots se todos ocupados.
- **attack-double:** não duplica hits em duas direções; duplica o valor de `power` por hit.
- **Empate:** se ambos zeram cartas na mesma rodada → **vitória do defensor** (segundo jogador / IA) ou **empate sem XP** — adotar **empate sem XP** em PvP e **derrota** do jogador em PvE para incentivar builds agressivas.

### 6.4 Pseudocódigo da rodada

```
function resolveRound(state):
  applyScheduledHeals(state)
  damageMap = empty map Slot -> number

  for each alive card in attack order:
    for each attack effect:
      targets = resolveTargets(effect, board)
      for t in targets:
        damageMap[t] += computeDamage(effect, card)

  for each target slot with damage > 0:
    d = damageMap[target]
    d = applyDefenseChain(d, target, state)
    applyDamageToCard(target, d)

  removeDeadCards(state)
  return checkWin(state)
```

---

## 7. IA (PvE)

Nível de dificuldade inicial (MVP):

1. Sortear 3 cartas do pool `tier <= maxTierFor(playerLevel)`.
2. Posicionar aleatoriamente ou priorizar cartas com `up-attack` no centro.
3. Sem reroll mid-fight.

Evolução futura: escolher posição que maximize dano na fileira do jogador.

---

## 8. Matchmaking (PvP)

| Regra | Valor |
|-------|--------|
| Fila | FIFO por faixa de nível |
| Faixa | `playerLevel ± 2` (expansão +1 a cada 30s na fila) |
| Preparação | Ambos confirmam deck de 3 + posições em até 60s |
| Desconexão | 1 rodada de tolerância; depois vitória do oponente |
| Anti-AFK | timeout de 90s por partida total (opcional) |

Transporte sugerido: **WebSocket** (Socket.io ou PartyKit) via route API Next.js / servidor Node dedicado.

---

## 9. Modelo de dados (implementação)

### 9.1 Entidades principais

```ts
// Coleção / instância de carta do jogador
interface PlayerCard {
  instanceId: string;
  templateId: string;
  hp: number;
  effectPower: number;
  level: 1 | 2 | 3 | 4;
  effects: CardEffect[];
}

interface Player {
  id: string;
  isGuest: boolean;
  guestExpiresAt?: Date;
  level: number;
  xp: number;
  cards: PlayerCard[];
}

interface BattleSetup {
  playerSlots: [Slot | null, Slot | null, Slot | null]; // L, M, R
  enemySlots: [Slot | null, Slot | null, Slot | null];
}

interface BattleState {
  round: number;
  playerRow: BoardRow;
  enemyRow: BoardRow;
  pendingHeals: HealEntry[];
  buffs: BuffEntry[];
  status: "preparing" | "active" | "finished";
  winner?: "player" | "enemy" | "draw";
}
```

### 9.2 API (esboço REST + WS)

| Método | Rota | Uso |
|--------|------|-----|
| POST | `/api/auth/guest` | Criar sessão guest |
| POST | `/api/battle/pve` | Iniciar partida vs IA |
| POST | `/api/matchmaking/join` | Entrar na fila PvP |
| WS | `/battle/:id` | Sincronizar rodadas e setup PvP |
| GET | `/api/player/me` | Perfil, cartas, XP |

---

## 10. Stack técnica (decisões para o projeto)

| Camada | Escolha | Motivo |
|--------|---------|--------|
| Framework | **Next.js 15** (App Router) | SSR, rotas, API routes |
| UI | **React 19** + **Tailwind CSS** | Layout 2D do tabuleiro e cartas sem 3D |
| Linguagem | **TypeScript** | Tipos alinhados a este documento |
| Estado cliente | **Zustand** (batalha) + **React Query** (servidor) | Separação clara |
| Persistência | **PostgreSQL** + **Prisma** | Contas, cartas, histórico |
| Auth | **Auth.js (NextAuth)** | Guest + OAuth/e-mail |
| PvP realtime | **Socket.io** ou **PartyKit** | Fila e sincronização |
| Validação | **Zod** | Schemas de carta e efeitos |
| Testes regras | **Vitest** | Motor de combate puro (sem DOM) |

### 10.1 Estrutura de pastas (proposta)

```
/
├── app/                    # Rotas Next.js
│   ├── (game)/battle/
│   ├── (game)/collection/
│   └── api/
├── components/             # UI cartas, tabuleiro
├── lib/
│   ├── battle/             # Motor: resolveRound, targets
│   ├── cards/              # Templates, validação
│   └── matchmaking/
├── prisma/
├── data/cards/             # JSON templates por tier
└── docs/VSF-GAME_DESIGN.md # Este arquivo
```

### 10.2 UI do tabuleiro (sem 3D)

- Fileira inimiga no topo; sua fileira embaixo.
- Cartas como componentes `CardTile` com PV, ícones de efeito (setas Up/Down + L/M/R).
- Animações: CSS transitions (shake ao tomar dano, fade ao morrer).
- Drag-and-drop **apenas na fase de preparação**.

---

## 11. Conteúdo inicial (MVP)

- **6 cartas starter** fixas em `data/cards/starter.json`.
- **Pool PvE:** +12 cartas Tier 1 para IA.
- **Progressão:** apenas XP, nível e drops descritos (sem loja no MVP).
- **Guest:** cookie + registro mínimo no DB com `guestExpiresAt = now + 3 days`.

Cron job ou job diário: apagar guests expirados e dados órfãos.

---

## 12. Checklist de implementação (fases)

### Fase 1 — Núcleo
- [ ] Tipos TypeScript + Zod para cartas e efeitos
- [ ] Motor `resolveRound` + testes Vitest
- [ ] Tabuleiro React (preparação + batalha local)

### Fase 2 — Conta e progressão
- [ ] Guest + Auth registrado
- [ ] Prisma schema (Player, CardInstance, BattleHistory)
- [ ] PvE + IA + recompensa XP/carta

### Fase 3 — PvP e polish
- [ ] Matchmaking + WebSocket
- [ ] Animações e feedback de dano
- [ ] Balanceamento e telemetria básica

---

## 13. Glossário

| Termo | Significado |
|-------|-------------|
| Tier / level da carta | 1–4; limita drops por nível do jogador |
| Up / Down | Fileira alvo do efeito (inimiga vs aliada) |
| L / M / R | Coluna esquerda, centro, direita |
| Rodada | Ciclo completo de resolução de efeitos |
| Configuração | Posição L/M/R das 3 cartas escolhidas; imutável na luta |

---

## 14. Histórico do documento

| Versão | Data | Notas |
|--------|------|-------|
| 1.0 | 2026-05-19 | Definição inicial VSF; stack React/Next; regras de combate e progressão |

---

*Implementação web atual (MVP simples): ver [README.md](../README.md). Godot foi removido; o jogo roda em Next.js com progresso em localStorage, apenas PvE.*
