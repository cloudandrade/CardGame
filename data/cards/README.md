# Cartas VSF — `catalog.json`

Edite este arquivo para alterar nomes, stats, efeitos e textos. Não é necessário banco de dados.

## Estrutura de cada carta

```json
{
  "id": "id-unico",
  "name": "Nome na carta",
  "race": "golem",
  "cardType": "Golem · Terra",
  "description": "Texto de lore no rodapé.",
  "effectSummary": "Resumo curto na barra preta.",
  "level": 1,
  "artUrl": "/cards/art/golem.png",
  "stats": {
    "hp": 6,
    "attack": 3,
    "defense": 3,
    "magic": 2
  },
  "effects": [ ... ]
}
```

## Stats (ícones na carta)

| Campo | Ícone | Obrigatório |
|-------|--------|-------------|
| `hp` | coração | sim |
| `attack` | espadas | sim (use `0` se não ataca) |
| `defense` | escudo | não — omita ou `0` se não tiver |
| `magic` | poção | não — omita ou `0` se não tiver |

Ícones em `public/icons/`. Artes em `public/cards/art/`.

## Efeitos (`effects`)

Cada efeito define direção das setas e potência na batalha. Mantenha `power` alinhado aos stats quando possível.

### Direções (`directions`)

| Valor | Significado |
|-------|-------------|
| `left`, `middle`, `right` | Coluna relativa à posição da carta (vizinho, si, vizinho) |
| `row` | **Fileira inteira** — todas as colunas aliadas (defesa/magia) ou todas as colunas inimigas (ataque), independente da posição. Recurso raro. |

Exemplo (Golem — defesa na fileira):

```json
"directions": ["row"]
```
