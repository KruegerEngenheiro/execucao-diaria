# 02. Arquitetura

## Decisao de stack (secao 63 do prompt)
Avaliado: SwiftUI (nativo), React Native, Expo, PWA.

Escolhido: **PWA (React + TypeScript + Vite + vite-plugin-pwa), offline com IndexedDB via Dexie.**

Motivo: o desenvolvimento acontece numa maquina Windows, sem Mac. Nativo iOS
(SwiftUI) so compila e instala no iPhone a partir de um Mac com Xcode e conta Apple
paga. React Native e Expo, para rodar num iPhone de verdade, tambem dependem de
build na nuvem e conta Apple paga. O PWA instala na tela inicial do iPhone, roda em
tela cheia, funciona offline e guarda os dados no aparelho, sem custo e sem Mac. E o
mesmo padrao ja validado no iPhone do usuario (app Meu Ingles).

Troca honesta: no iOS, notificacoes de PWA tem limites (so com o app instalado, iOS
16.4+) e o app nao entra na App Store. Para uso pessoal, o ganho de custo e de
velocidade compensa.

## Camadas
- `src/types.ts`: modelo de dados e enums.
- `src/db.ts`: Dexie (IndexedDB). Schema, seed inicial, config. Camada isolada.
- `src/dados/`: sementes (rotina do Carlos e categorias).
- `src/logica/`: regras puras e testaveis (recorrencia, janelas, planejador, score, tempo, insights, notificacoes).
- `src/servicos.ts`: acoes de negocio que a interface chama (ponte db + logica).
- `src/componentes/` e `src/telas/`: interface React.
- `src/hooks/`: tema, relogio, categorias ao vivo.
- `src/utils/`: datas e exportacao/backup.

## Estado
Dexie + dexie-react-hooks (`useLiveQuery`). A interface observa o banco; qualquer
escrita reflete na tela na hora, sem gerenciador de estado extra.

## Persistencia e resiliencia
Tudo em IndexedDB. `semearSeNecessario` abre o banco em try/catch: se o IndexedDB
estiver indisponivel, o app ainda carrega (so nao persiste). Leituras toleram banco
vazio.

## Preparado para o futuro (fase 3, nao implementado)
- Backup JSON ja funciona (`utils/exportar.ts`), base para sincronizacao.
- Camada de dados limpa permite plugar um backend de sync sem reescrever a interface.
- `logica/notificacoes.ts` isola a API de notificacao para evoluir para push.
