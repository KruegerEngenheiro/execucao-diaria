# 04. Design System

Identidade propria, inspirada na clareza de produtos como Things, Linear e Notion,
sem copiar nenhum. Minimalista, elegante, rapido.

## Cor
Tokens em `src/index.css`, via variaveis CSS, com tema claro e escuro.
- Escuro (padrao): fundo #0b0f1a, superficies #141a28 / #1b2334, texto #e9eef8.
- Claro: fundo #f4f6fb, superficies brancas, texto #0f1829.
- Acento: azul (#3b82f6 escuro, #2563eb claro).
- Cada categoria tem cor propria (pontos e barras).
- Janelas tem cor semantica: FOCO roxo, LIVRE verde, FLEXIVEL ambar, FIXO azul,
  BLOQUEADO cinza.

## Tipografia
Fonte do sistema (San Francisco no iPhone), pesos 600 a 800 para titulos. Numeros
com `tabular-nums` no cronometro e nas horas.

## Forma
Cantos arredondados (18px cartao, 12px campo), sombras suaves, cartoes com borda de 1px.

## Componentes base
Cartao, barra de progresso, anel de score, folha modal, chips de selecao, segmented
control, checkbox redondo, pill de status, tag de janela, KPI.

## iPhone
`viewport-fit=cover` e `env(safe-area-inset-*)` em cabecalho, tab bar e folhas.
Tab bar com blur. Botao + flutuante acima da tab bar.
