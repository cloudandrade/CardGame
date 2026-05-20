"use client";

export const GAME_RULES_SECTIONS: { title: string; items: string[] }[] = [
  {
    title: "Objetivo",
    items: [
      "VSF (Very Snap Fight) é um TCG em que você enfrenta a IA com 3 cartas contra 3 cartas.",
      "Vença eliminando todas as cartas inimigas ou, ao fim da rodada 5, tendo mais PV total que o oponente.",
      "Se ambas as fileiras caírem ao mesmo tempo, ou os PV forem iguais na rodada 5, a partida é empate.",
    ],
  },
  {
    title: "Tabuleiro",
    items: [
      "Duas fileiras de 3 posições: Esquerda, Centro e Direita.",
      "Sua fileira fica embaixo; a do inimigo, em cima.",
      "Cada posição aceita no máximo uma carta.",
      "Depois que a batalha começa, as posições não mudam.",
    ],
  },
  {
    title: "Preparação da partida",
    items: [
      "Você recebe 6 cartas da sua coleção desbloqueada (aleatórias se tiver muitas cartas).",
      "Escolha 3 cartas e coloque cada uma em um pad (Esquerda, Centro ou Direita).",
      "Toque uma carta no grid e depois um pad vazio; toque uma carta já colocada no pad para trocá-la.",
      "Acima de cada pad aparecem LP, ATK e DEF previstos (incluindo sinergia entre as 3 cartas).",
      "O PV total da equipe é exibido antes de iniciar.",
      "Com 3 cartas posicionadas, use «Iniciar batalha» quando estiver pronto.",
      "A IA escolhe 3 cartas aleatórias e posiciona-as aleatoriamente na fileira de cima.",
    ],
  },
  {
    title: "Rodadas de combate",
    items: [
      "Clique em «Próxima rodada» para resolver uma rodada completa.",
      "Ordem em cada rodada: encantamentos → curas → ataques e dano → remoção de cartas derrotadas.",
      "O log de batalha registra encantamentos, bloqueios, ataques e dano recebido.",
    ],
  },
  {
    title: "Encantamentos e bloqueios (só na rodada 1)",
    items: [
      "Encantamentos só são aplicados na primeira rodada de combate.",
      "O bônus de ataque do encantamento permanece até o fim da partida.",
      "Bloqueios de defesa só reduzem dano na primeira rodada.",
      "Das rodadas 2 em diante, o dano dos ataques não é reduzido por defesa.",
    ],
  },
  {
    title: "Curas",
    items: [
      "Efeitos de cura são resolvidos no início de cada rodada, antes dos ataques.",
      "Curas só funcionam até a rodada 3 (da rodada 4 em diante não curam mais).",
      "Curam aliados nas colunas indicadas pelas direções do efeito, até o PV máximo da carta.",
    ],
  },
  {
    title: "Ataques",
    items: [
      "Ataques ocorrem em todas as rodadas, depois de encantamentos e curas.",
      "Ataque simples: aplica o poder do efeito em cada alvo válido nas direções indicadas.",
      "Ataque duplo: o poder base conta em dobro.",
      "Ataque em grupo: atinge todas as cartas ocupadas na fileira inimiga.",
      "As direções esquerda, centro e direita são relativas à coluna de quem ataca.",
      "A direção fileira (row) atinge ou protege todas as posições da fileira, em qualquer coluna — recurso raro.",
      "Dano final = poder do ataque + bônus de encantamento acumulado.",
      "Só há dano se existir carta inimiga na coluna alvo.",
    ],
  },
  {
    title: "Defesa (na rodada 1)",
    items: [
      "Cartas com defesa protegem aliados nas colunas indicadas (ou na fileira inteira com row).",
      "Cada bloqueio reduz até o valor de poder da defesa no dano recebido.",
      "Vários bloqueios na mesma coluna podem se somar na mesma rodada.",
    ],
  },
  {
    title: "Fim de jogo",
    items: [
      "Vitória: todas as cartas inimigas são destruídas.",
      "Derrota: todas as suas cartas são destruídas.",
      "Empate: ambas as fileiras caem ao mesmo tempo.",
      "Rodada 5: se ainda houver cartas dos dois lados, vence quem tiver mais PV total (soma das cartas vivas).",
      "Empate na rodada 5: PV totais iguais.",
    ],
  },
  {
    title: "Setas nas cartas",
    items: [
      "Vermelho (ataque): fora da carta, apontando para o oponente — em cima nas suas cartas, embaixo nas do inimigo.",
      "Azul (defesa) e roxo (magia): apontam para aliados — embaixo nas suas cartas, em cima nas do inimigo.",
      "Setas diagonais indicam colunas vizinhas; a seta central indica a mesma coluna.",
    ],
  },
  {
    title: "Progresso e coleção",
    items: [
      "Progresso salvo no navegador, sem login.",
      "+5 XP por vitória contra a IA.",
      "A cada 100 XP você sobe de nível e pode desbloquear uma carta nova.",
      "Use «Ver coleção» para ver todas as cartas e abrir o detalhe ampliado.",
      "«Zerar progresso» apaga XP, vitórias e cartas desbloqueadas.",
    ],
  },
];

interface GameRulesPanelProps {
  open: boolean;
  onClose: () => void;
}

export function GameRulesPanel({ open, onClose }: GameRulesPanelProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden bg-black/80 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Regras do jogo"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/10 bg-[var(--panel)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-semibold text-amber-100">Regras do VSF</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl font-light leading-none text-white/45 transition-colors hover:text-white/85"
            aria-label="Fechar regras"
          >
            ×
          </button>
        </div>

        <div className="log-scroll overflow-y-auto px-5 py-4">
          <div className="space-y-5 text-sm leading-relaxed text-[var(--muted)]">
            {GAME_RULES_SECTIONS.map((section) => (
              <section key={section.title}>
                <h3 className="mb-2 font-semibold text-[var(--text)]">{section.title}</h3>
                <ul className="list-disc space-y-1.5 pl-5">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>

        <div className="shrink-0 border-t border-white/10 p-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-[var(--accent)] py-2.5 text-sm font-semibold hover:bg-[var(--accent-hover)]"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}
