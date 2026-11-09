// Plano de carreira internacional de 90 dias, do manual de carreira.
// Conteudo estatico (vive no codigo). O que o Carlos marca como feito fica salvo
// no aparelho (tabela carreiraProgresso), separado disto. O gerador em
// logica/carreiraPlano.ts decide o que e devido em cada dia.
//
// Janela do plano: 02/11/2026 (segunda) a 31/01/2027.

export const INICIO_PLANO = '2026-11-02'
export const FIM_PLANO = '2027-01-31'

export type FreqCarreira = 'diaria' | 'semanal' | 'mensal' | 'unica'
export type PrioridadeCarreira = 'P0' | 'P1' | 'P2' | 'P3'
export type CategoriaCarreira =
  | 'LinkedIn' | 'Publicacoes' | 'Portfolio' | 'GitHub'
  | 'Candidaturas' | 'Networking' | 'Recrutadores' | 'Entrevistas'

export interface AtividadeCarreira {
  id: string
  categoria: CategoriaCarreira
  nome: string
  descricao: string
  frequencia: FreqCarreira
  diaSemana?: number // 0=dom ... 6=sab (getDay), para semanais
  diaDoMes?: number // para mensais
  data?: string // ISO, para unicas/datadas
  prioridade: PrioridadeCarreira
  resultadoEsperado: string
  indicador: string
  checklist?: string[]
  pilar?: string
  textoPost?: string // texto em ingles pronto pra copiar (posts)
  condicional?: string // aviso quando a tarefa so vale sob condicao
}

// Ordem e rotulos de exibicao das 8 categorias.
export const ORDEM_CATEGORIA: CategoriaCarreira[] = [
  'LinkedIn', 'Publicacoes', 'Portfolio', 'GitHub',
  'Candidaturas', 'Networking', 'Recrutadores', 'Entrevistas',
]
export const LABEL_CATEGORIA: Record<CategoriaCarreira, string> = {
  LinkedIn: 'LinkedIn',
  Publicacoes: 'Publicacoes',
  Portfolio: 'Portfolio',
  GitHub: 'GitHub',
  Candidaturas: 'Candidaturas',
  Networking: 'Networking',
  Recrutadores: 'Recrutadores',
  Entrevistas: 'Entrevistas',
}

// ---------------- Textos dos 10 posts (ingles, prontos pra copiar) ----------------
const POST_1 = `I'm a Forward Deployed Engineer. I learned the job before I knew it had a name.

For almost 8 years I was a logistics officer in the Brazilian Army. On a humanitarian operation run alongside UN agencies, I worked on a budget of about US$ 40M a year. I was the first person to bring AI into that operation.

Here is how the FDE job looked for me:

1. I sat with the people who did the work, not with a spec.
2. With a Navy captain, I defined the real problem: what the assistant should answer and how it should use the data.
3. We built on the data they actually had, which was messier than anyone admits.
4. The team built it. I owned the engineering review and the final call on whether it was correct and safe enough to go live.

About 100 people used it for roughly 3 months. It replaced 42 spreadsheets.

The Army did not make me an engineer. I studied software engineering and I build every week. But the hard part of AI in a real operation is rarely the model. It is trust, messy data, and someone who answers for the result.

If you work with FDEs, what skill do you see missing the most in new hires?`

const POST_2 = `My online store was losing up to R$ 42 on some shipments, and nobody had noticed.

I built a store and back office for a cosmetics retailer. Shipping was priced with a fixed table by region. It looked fine.

Then I connected the real shipping quote API. Now I could compare the table with the real quote, order by order. For orders going to the North, Northeast and Center-West of Brazil, the fixed table was losing up to R$ 42 per shipment. On a small shop, that adds up fast.

The lesson is small and a bit boring. When a system touches money, compare what it says with what actually happened. A table is not true just because it was true once.

There is no AI in this one. I'm sharing it because the habit is the same one I use with LLM features: check the output against reality before you trust it.

What is the last "quiet" bug you found in a system that looked healthy?`

const POST_3 = `I write about 30% of the code in my projects. Claude Code writes most of the rest. I'm responsible for 100% of what goes to production.

This is the process that makes that work:

1. I design first: the data model, the integrations, and what can go wrong. The AI implements a plan, not a wish.
2. The one who builds is not the one who tests. One agent builds. An independent one tests every change. Another reviews the result as if it were the client paying for it.
3. A green test suite does not authorize a deploy. Before production I click through the real flow, as a real customer and as a real manager, with a real login.
4. Every delivery says what it does not cover.

On one project this meant about 700 automated checks before each release of a store that handles real payments.

What this does not replace is reading code and judging it. That part I can't hand to anyone.

AI-assisted development is not "the AI did it". It is engineering with faster hands and the same responsibility.`

const POST_4 = `I tested an AI budget assistant and the percentages by agency added up to 105.5%.

The data underneath was official and up to date. The model read the right numbers and still did the math wrong. That is the part people miss: correct data does not guarantee a correct answer.

What I recommended to the team: do the calculation in code, and let the model only explain the result. Language is what the model is good at. Arithmetic is not.

The same assistant refused a question it had no data for, and it ignored an instruction to dump everything it knew. Those two behaviors I'm happy with. The percentage error is the one that would have gone unnoticed if nobody had tested it.

The habit I take from this: write down a few questions with known answers, run them on every change, and watch what breaks.

How do you keep numbers honest in your LLM apps?`

const POST_5 = `We went from about 250 open tickets to about 50. The most useful tool was not AI.

I was helping a maintenance team get a support backlog under control, and I coordinated 10 developers. The first thing I built was not a fix. It was visibility.

A set of Node.js jobs reads the ticket tracker through its GraphQL API, calculates deadlines, workload and trends, and publishes a dashboard. GitHub Actions runs it on a schedule, so it updates around the clock.

Then the question was: where do these tickets come from? I could have used an LLM to classify them. I didn't. A simple keyword classifier on the ticket title was enough to see the pattern: three areas generated about 60% of the tickets in one cycle. It was not perfect, and we called it "indicative". But it changed the talk from "the team needs to be faster" to "three places create most of the work".

In one 14-day cycle, demand grew 57%, the backlog went from 42 to 27, and the median resolution time was 2.8 days.

What we did not measure: reopened tickets. The tracker clears the completion date when a ticket reopens. A metric you can't see is one you should name.`

const POST_6 = `A payment arrived and my system didn't know.

In a store I built, Pix payments were confirmed by a webhook from the payment provider. It worked, until it didn't. The money was in the account and the order stayed unpaid.

A webhook is fast, but it is a message that can get lost. So I added a daily reconciliation: a job that asks the payment provider what it actually received and compares it with the orders in my database. Anything that doesn't match is fixed or flagged.

The webhook is the fast path. The reconciliation is the safety net.

I think this pattern matters even more with AI features. The model's answer is the fast path. The check against a trusted source is the safety net. If you only have the first one, you are betting that nothing ever gets lost.

Where in your system do you only have the fast path?`

const POST_7 = `I published a 52% accuracy number on purpose.

I gave technical help to a research prototype: a search tool over a set of regulations. It runs a small multilingual embedding model in the browser, with 60 passages. It answers by quoting the source with its reference, and it does not use generative AI.

We wrote 66 tests, including questions the system had never seen. On those new questions, accuracy was about 52%, and about 42% of the time it refused to answer when it should have answered.

Those two numbers are more useful than a nice demo. They tell you the system is safe in one way (it quotes, it doesn't invent) and weak in another (it says "I don't know" too often). That tells me where to look next: how the passages are split and how they are retrieved.

A demo shows what works once. A test set shows how it fails.

When you evaluate search or RAG, which failure worries you more: a wrong answer or a wrong refusal?`

const POST_8 = `I'm building a cited-answers assistant in Python. The test set comes first.

The goal is simple: you ask a question about a body of public documents, and the system answers only from the passages it retrieved, shows the citation, and says "I don't know" when the evidence isn't there.

Before I wrote the answer step, I wrote the questions with known answers, plus the attacks (prompt injection attempts). The CI runs them on every change and blocks the merge if accuracy drops.

Why this order? If you add the test set after the demo works, you end up measuring what you already believe.

Next, I'll add token, cost and latency tracking, so every answer has a price tag and a response time.

The repo is here: [link in first comment]. I'll share the numbers as they come, including the bad ones.

If you build RAG for work, what is the first thing you test?`

const POST_9 = `Why I'm learning Java when I mostly write TypeScript and Python.

I'm doing a bootcamp with DIO and Itau on Java and AI. The project is a budgeting API in Spring that talks to an LLM through Spring AI.

My reason is practical. When I read AI engineer job posts, most ask for Python or TypeScript. But a few, mostly from consultancies, ask for Java and Spring on the backend, with an LLM connected to it. Many companies run their business systems in Java. If I can connect an LLM to a business API there, I can work where the data already is.

I'm not going to say what surprised me yet, because I'm still in the middle of it. When I finish, I'll write what broke first.

The part I care about is not the syntax. It is the same question in any language: what happens when the model is wrong, slow or expensive?

If you moved between stacks to follow the work, was it worth it?`

const POST_10 = `I was tired of forgetting English words, so I built my own app for it.

I'm learning English to work with international teams. My problem was simple. I would learn a word on Monday and forget it by Friday.

So I built a small app around spaced repetition. It shows me a word right before I am about to forget it, and the gap grows every time I get it right. It is a PWA, so it lives on my phone and works offline.

The hardest product decision was what to leave out. No streaks, no badges, no social feed. Just the review that works. I use it every day.

I'm thinking about where AI could help, maybe by generating example sentences in context. But only if it earns its place.

How do you remember what you learn? Spaced repetition, notes, or something else?`

function post(
  id: string, data: string, pilar: string, nome: string, texto: string,
  condicional?: string,
): AtividadeCarreira {
  return {
    id, categoria: 'Publicacoes', nome, descricao: nome, frequencia: 'unica', data,
    prioridade: 'P1', resultadoEsperado: 'Post publicado e respondido nas 2 primeiras horas',
    indicador: 'Posts publicados e engajamento qualificado', pilar, textoPost: texto, condicional,
  }
}

const POSTS_CARREIRA: AtividadeCarreira[] = [
  post('post-c1', '2026-11-03', 'Experiencia e lideranca', 'Post 1: como aprendi o papel de FDE no Exercito', POST_1),
  post('post-c2', '2026-11-05', 'Problema de negocio com dados', 'Post 2: a loja perdia R$ 42 por envio', POST_2),
  post('post-c3', '2026-11-10', 'Arquitetura e processo', 'Post 3: como construo com IA e respondo por 100%', POST_3),
  post('post-c4', '2026-11-12', 'Avaliacao de IA', 'Post 4: o assistente somou 105,5%', POST_4,
    'So publique se puder falar do teste, sem o print marcado como nao publicar e sem numero de execucao orcamentaria.'),
  post('post-c5', '2026-11-17', 'Problema de negocio com dados', 'Post 5: de 250 para 50 chamados, sem IA', POST_5),
  post('post-c6', '2026-11-19', 'Arquitetura e confiabilidade', 'Post 6: webhook e o caminho rapido, conciliacao e a rede', POST_6),
  post('post-c7', '2026-11-24', 'Avaliacao de IA', 'Post 7: publiquei 52% de acerto de proposito', POST_7),
  post('post-c8', '2026-11-26', 'Projeto de IA em publico', 'Post 8: o carro-chefe em Python, o teste vem primeiro', POST_8,
    'So sai com o repositorio publico e o conjunto de teste no ar; senao adie uma semana.'),
  post('post-c9', '2026-12-01', 'Aprendizado e evolucao', 'Post 9: por que estou aprendendo Java', POST_9),
  post('post-c10', '2026-12-03', 'Aprendizado e evolucao', 'Post 10: construi meu app de ingles', POST_10),
]

// ---------------- Atividades recorrentes e marcos ----------------
const RECORRENTES: AtividadeCarreira[] = [
  {
    id: 'li-diario', categoria: 'LinkedIn', nome: 'LinkedIn do dia, 30 a 45 min',
    descricao: 'A rotina que mantem o perfil ativo e visto. Cronometro, no maximo 10 min de feed, toda sessao termina com uma acao registrada.',
    frequencia: 'diaria', prioridade: 'P0',
    resultadoEsperado: 'Perfil ativo, visto por recrutadores', indicador: 'Visualizacoes de perfil e aparicoes em busca',
    checklist: [
      'Notificacoes e mensagens: responder quem escreveu primeiro',
      '3 a 5 comentarios de valor em posts do seu alvo (30 palavras ou mais)',
      '3 acoes de contato: 2 convites com nota e 1 follow-up',
      'Varrer 10 a 15 vagas das buscas salvas, dar nota e anotar as 3 melhores',
    ],
  },
  {
    id: 'sem-planejar', categoria: 'LinkedIn', nome: 'Planejar a semana e ver os numeros',
    descricao: 'Segunda: define o foco da semana e olha os indicadores.',
    frequencia: 'semanal', diaSemana: 1, prioridade: 'P1',
    resultadoEsperado: 'Semana planejada', indicador: 'Metas semanais definidas',
  },
  {
    id: 'sem-convites', categoria: 'Networking', nome: 'Enviar 10 a 15 convites com nota',
    descricao: 'Recrutadores tecnicos, AI engineers, FDEs, founders e hiring managers do alvo.',
    frequencia: 'semanal', diaSemana: 1, prioridade: 'P0',
    resultadoEsperado: 'Rede relevante crescendo', indicador: 'Novas conexoes relevantes',
  },
  {
    id: 'sem-codigo', categoria: 'Entrevistas', nome: 'Codigo sem IA, 2 sessoes de 30 min na semana',
    descricao: 'Treino para entrevista tecnica. Resolver sem assistente.',
    frequencia: 'semanal', diaSemana: 2, prioridade: 'P1',
    resultadoEsperado: 'Pronto para live coding', indicador: 'Sessoes de treino feitas',
  },
  {
    id: 'sem-candidaturas', categoria: 'Candidaturas', nome: 'Sessao de candidaturas, 1 a 3 vagas nota alta',
    descricao: 'Quarta: candidatar em 1 a 3 vagas com nota 75 ou mais, CV ajustado e contato com o recrutador.',
    frequencia: 'semanal', diaSemana: 3, prioridade: 'P0',
    resultadoEsperado: '5 a 8 candidaturas direcionadas por semana', indicador: 'Candidaturas realizadas',
  },
  {
    id: 'sem-followup', categoria: 'Candidaturas', nome: 'Follow-ups, rastreador e indicadores',
    descricao: 'Sexta: follow-up das candidaturas (5 a 7 dias uteis, no maximo 2) e revisao das taxas.',
    frequencia: 'semanal', diaSemana: 5, prioridade: 'P1',
    resultadoEsperado: 'Nenhuma candidatura esquecida', indicador: 'Respostas recebidas',
  },
  {
    id: 'sem-escrever-posts', categoria: 'Publicacoes', nome: 'Escrever e agendar os 2 posts da semana seguinte',
    descricao: 'Fim de semana: deixa os 2 posts prontos antes da semana comecar.',
    frequencia: 'semanal', diaSemana: 6, prioridade: 'P1',
    resultadoEsperado: 'Posts prontos no prazo', indicador: 'Posts agendados',
  },
  {
    id: 'sem-video', categoria: 'Portfolio', nome: 'Gravar 2 min em ingles explicando um post',
    descricao: 'Fim de semana: treina o ingles falado e gera material de portfolio.',
    frequencia: 'semanal', diaSemana: 6, prioridade: 'P1',
    resultadoEsperado: 'Ingles falado em evolucao', indicador: 'Gravacoes feitas',
  },
  {
    id: 'mes-metas', categoria: 'LinkedIn', nome: 'Revisar metas do plano e decidir ajuste',
    descricao: 'Comeco do mes: olha os numeros de 30 dias e ajusta o rumo.',
    frequencia: 'mensal', diaDoMes: 1, prioridade: 'P1',
    resultadoEsperado: 'Plano calibrado', indicador: 'Revisao mensal feita',
  },
  {
    id: 'mes-destaques', categoria: 'LinkedIn', nome: 'Atualizar os Destaques do perfil',
    descricao: 'Comeco do mes: deixa em Destaques o melhor post e os links vivos dos apps.',
    frequencia: 'mensal', diaDoMes: 1, prioridade: 'P1',
    resultadoEsperado: 'Prova clicavel sempre visivel', indicador: 'Cliques nos Destaques',
  },
  {
    id: 'mes-cv', categoria: 'Candidaturas', nome: 'Rever as 3 variantes de CV',
    descricao: 'Comeco do mes: FDE, AI Engineer e AI PM/Technical PM alinhados com os posts e o perfil.',
    frequencia: 'mensal', diaDoMes: 1, prioridade: 'P1',
    resultadoEsperado: 'CV pronto pra cada vaga', indicador: 'Variantes atualizadas',
  },
  {
    id: 'mes-recomendacao', categoria: 'LinkedIn', nome: 'Pedir 1 recomendacao',
    descricao: 'Meio do mes: pedir a quem trabalhou com voce. Meta de 2 a 3 ate o dia 90.',
    frequencia: 'mensal', diaDoMes: 15, prioridade: 'P2',
    resultadoEsperado: 'Prova social no perfil', indicador: 'Recomendacoes recebidas',
  },
]

function marco(
  id: string, categoria: CategoriaCarreira, data: string, nome: string,
  descricao: string, prioridade: PrioridadeCarreira, indicador: string,
): AtividadeCarreira {
  return { id, categoria, nome, descricao, frequencia: 'unica', data, prioridade, resultadoEsperado: nome, indicador }
}

const MARCOS: AtividadeCarreira[] = [
  marco('li-about', 'LinkedIn', '2026-11-03', 'Trocar o About pela versao Forward Deployed Engineer',
    'Pendencia numero 1. A versao nova ja esta pronta. O Post 1 depende dela no ar.', 'P0', 'About atualizado'),
  marco('gh-auditar', 'GitHub', '2026-11-03', 'Auditar o GitHub',
    'Confirmar o login e revisar o repositorio de fretamento por risco de dado de contrato publico exposto.', 'P0', 'Auditoria feita'),
  marco('li-acolhida', 'LinkedIn', '2026-11-08', 'Alinhar o papel na Acolhida',
    'Mesma versao do papel (pioneiro, definiu, validou) em About, Projetos e CV.', 'P0', 'Historia consistente'),
  marco('gh-readme', 'GitHub', '2026-11-08', 'Criar o README de perfil do GitHub',
    'Quem voce e, o que constroi, links. A vitrine do seu codigo.', 'P1', 'README no ar'),
  marco('li-projetos', 'LinkedIn', '2026-11-15', 'Reordenar os Projetos no LinkedIn',
    'IA e dados no topo, formato problema, acao, resultado, com link do GitHub.', 'P1', 'Cliques nos projetos'),
  marco('rec-lista', 'Recrutadores', '2026-11-15', 'Montar lista de 50 recrutadores tecnicos',
    'EUA e Canada, com horario amigavel ao Brasil. Base pra abordagem semanal.', 'P1', 'Contatos na lista'),
  marco('gh-apps', 'GitHub', '2026-11-22', 'Publicar os 2 apps com README',
    'Meu Ingles e Execucao Diaria no GitHub, com README decente.', 'P1', 'Repositorios publicados'),
  marco('port-video', 'Portfolio', '2026-12-20', 'Gravar video de 2 min do carro-chefe em ingles',
    'Demonstra o projeto principal funcionando, com a sua voz.', 'P1', 'Video publicado'),
  marco('port-caso', 'Portfolio', '2026-12-20', 'Estudo de caso da Acolhida em PDF',
    'Formato STAR, anonimizado, pra anexar no perfil e nas candidaturas.', 'P1', 'Estudo de caso pronto'),
  marco('gh-pins', 'GitHub', '2026-12-27', 'Fixar 6 repositorios no GitHub',
    'Os melhores projetos em destaque no perfil.', 'P1', 'Pins configurados'),
  marco('port-flagship', 'Portfolio', '2027-01-10', 'Entregar a v1.0 do carro-chefe em Python',
    'Assistente com respostas citadas: RAG, avaliacao, observabilidade e seguranca.', 'P0', 'Marco entregue'),
  marco('ent-star', 'Entrevistas', '2027-01-10', 'Escrever as 6 historias STAR',
    'Acolhida, frete, PIGZ, enchentes, comando e uma falha. Base pras entrevistas.', 'P1', 'Historias escritas'),
  marco('port-dio', 'Portfolio', '2027-01-17', 'Entregar a Budgeting API com Spring AI',
    'Desafio final do bootcamp DIO, carro-chefe em Java.', 'P0', 'Entrega aceita'),
]

export const ATIVIDADES_CARREIRA: AtividadeCarreira[] = [
  ...RECORRENTES,
  ...MARCOS,
  ...POSTS_CARREIRA,
]

// Rotulo curto da frequencia, pra exibir na aba Plano.
export const LABEL_FREQ: Record<FreqCarreira, string> = {
  diaria: 'todo dia util',
  semanal: 'toda semana',
  mensal: 'todo mes',
  unica: 'uma vez',
}
