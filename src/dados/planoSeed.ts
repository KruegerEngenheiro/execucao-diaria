// Conteudo do Plano de carreira: cursos, checklist do perfil e calendario de posts.
// E conteudo estatico (vive no codigo, sempre disponivel). O que o Carlos marca
// como feito fica salvo no aparelho (tabela planoProgresso), separado disto.

export interface CursoPlano {
  chave: string
  nome: string
  prazo?: string
  destrava: string
  alimenta: string
}

export interface ItemPerfil {
  chave: string
  texto: string
}

export interface PostPlano {
  chave: string
  numero: number
  data: string
  pilar: string
  gancho: string
  oQueFalar: string[]
  formato: string
  cta: string
  textoCompleto?: string
}

// Ordem de prioridade. Um curso por vez.
export const CURSOS: CursoPlano[] = [
  { chave: 'curso-dio', nome: 'Bootcamp DIO Itau, Java e IA', prazo: '17/01/2027', destrava: 'Prova que voce constroi IA em Java com Spring AI. Prioridade absoluta, ja em andamento.', alimenta: 'Posts 3 e 7' },
  { chave: 'curso-deeplearning', nome: 'DeepLearning.AI, RAG e avaliacao de LLM', destrava: 'Metodo de AI evaluation, o nicho mais perto da porta da Turing.', alimenta: 'Posts 6 e 8' },
  { chave: 'curso-anthropic', nome: 'Anthropic Academy, API do Claude e agentes', destrava: 'LLM em uso real e a camada de IA do Execucao Diaria.', alimenta: 'Post 4' },
  { chave: 'curso-duke', nome: 'AI Product Management, Duke, Coursera', destrava: 'O lado PM: definir produto de IA, metricas e risco. O seu destino.', alimenta: 'Post 7' },
  { chave: 'curso-psm', nome: 'PSM I, Scrum.org', destrava: 'Credencial agil reconhecida para PM internacional.', alimenta: 'Fase 2' },
]

export const ITENS_PERFIL: ItemPerfil[] = [
  { chave: 'perfil-headline', texto: 'Headline em ingles: constroi IA e lidera produto de IA' },
  { chave: 'perfil-sobre', texto: 'Sobre reescrito com os 3 pilares e numeros, em ingles' },
  { chave: 'perfil-destaques', texto: 'Destaques com o melhor post e os links dos apps' },
  { chave: 'perfil-projetos', texto: 'Projetos no formato problema, acao, resultado, com link do GitHub' },
  { chave: 'perfil-recomendacoes', texto: '2 ou 3 recomendacoes pedidas' },
  { chave: 'perfil-capa', texto: 'Capa com a sua marca' },
  { chave: 'perfil-github-readme', texto: 'GitHub: README de perfil' },
  { chave: 'perfil-github-repos', texto: 'GitHub: 4 repositorios fixados com README decente' },
]

const POST_1 = `I managed a US$40M yearly budget in the Army. Now I build AI apps. Here is why that is not a career change.

For seven years I was a logistics officer. I led teams, moved resources, and made decisions with incomplete information and no room to fail. In logistics, one wrong item can stop an operation. You learn to check before you trust.

Today I build with AI: small apps, RAG, chatbots. And I keep the same habit. I do not ship a feature until I can tell when it fails. A model that sounds confident and is wrong is like the wrong item in the wrong truck. It looks fine until it costs you.

So I do not see this as leaving logistics behind. I see it as the same job with new tools. Lead people, manage risk, deliver something that works.

I want to lead AI products, and I build them myself so I understand what I am leading.

If you hire for AI product or evaluation roles, which skill from your past career do you use the most today?`

const POST_2 = `I was tired of forgetting English words, so I built my own app for it.

I am learning English to work with international teams. My problem was simple. I would learn a word on Monday and forget it by Friday.

So I built a small app around spaced repetition. It shows me a word right before I am about to forget it, and the gap grows every time I get it right. Nothing fancy. Just the one thing that makes vocabulary stick.

The hardest product decision was what to leave out. No streaks, no badges, no social feed. Just the review that works. I use it every day.

I built it as a PWA, so it lives on my phone like a native app and works offline.

The next step I am thinking about is where AI could help, maybe generating example sentences in context. But only if it earns its place.

How do you remember what you learn? Spaced repetition, notes, or something else?`

export const POSTS: PostPlano[] = [
  {
    chave: 'post-1', numero: 1, data: 'Ter 03/11', pilar: 'Militar para tech',
    gancho: 'I managed a US$40M yearly budget in the Army. Now I build AI apps. Here is why that is not a career change.',
    oQueFalar: [
      'Sete anos como oficial de logistica, liderando equipes e orcamento',
      'Decisao com informacao incompleta e sob pressao, cultura de erro zero',
      'Hoje constroi com IA e mantem o habito de validar antes de confiar',
      'Quer liderar produto de IA e constroi para entender o que lidera',
    ],
    formato: 'Texto, 150 a 200 palavras. Sem midia obrigatoria.',
    cta: 'If you hire for AI product or evaluation roles, which skill from your past career do you use the most today?',
    textoCompleto: POST_1,
  },
  {
    chave: 'post-2', numero: 2, data: 'Qui 05/11', pilar: 'Construir em publico',
    gancho: 'I was tired of forgetting English words, so I built my own app for it.',
    oQueFalar: [
      'O problema real: aprender uma palavra e esquecer na semana',
      'A solucao: repeticao espacada, o app Meu Ingles, no ar',
      'Decisao de produto: o que cortou para ficar simples',
      'Usa todo dia; onde a IA poderia entrar depois',
    ],
    formato: 'Video de tela de 30 a 45s com legenda em ingles. Se nao quiser aparecer, so a tela.',
    cta: 'How do you remember what you learn? Spaced repetition, notes, or something else?',
    textoCompleto: POST_2,
  },
  {
    chave: 'post-3', numero: 3, data: 'Ter 10/11', pilar: 'Aprender em publico',
    gancho: 'I am building a Java API that talks to an LLM. Here is the part that surprised me.',
    oQueFalar: [
      'A Budgeting API do bootcamp DIO, com Spring AI',
      'O que entendeu ao ligar uma API de negocio a um modelo',
      'Uma surpresa real do projeto, so escreva depois de viver essa parte',
      'Um risco ja percebido: resposta errada, custo de tokens, latencia',
      'Por que ve isso como engenharia de produto, nao so codigo',
    ],
    formato: 'Carrossel de 5 a 6 slides: problema, arquitetura, risco, aprendizado.',
    cta: 'If you have shipped an LLM feature in a business app, what broke first for you?',
  },
  {
    chave: 'post-4', numero: 4, data: 'Qui 12/11', pilar: 'Opiniao sobre avaliacao de IA',
    gancho: 'A feature with AI is not a product until you can measure when it fails.',
    oQueFalar: [
      'Esta construindo a camada de IA do Execucao Diaria',
      'Antes de ligar, pergunta: como vou saber que a resposta esta certa',
      'Demo bonito nao e produto; produto tem criterio de sucesso e de falha',
      'O que pretende medir, em termos simples, sem inventar numero',
      'Vem do olhar de logistica: sem controle de qualidade, nao se entrega',
    ],
    formato: 'Texto de 150 a 250 palavras com uma lista curta.',
    cta: 'What is your simplest test to know an AI feature is working?',
  },
  {
    chave: 'post-5', numero: 5, data: 'Ter 17/11', pilar: 'Militar para tech',
    gancho: 'In logistics, one wrong item can stop an operation. That is how I look at AI hallucinations.',
    oQueFalar: [
      'Em logistica o erro tem custo claro e conhecido',
      'Com IA e igual: resposta plausivel e errada e o pior caso',
      'Como pensa em checagem, redundancia e responsabilidade',
      'Conecta com AI evaluation, safety e governance',
      'Nao e burocracia, e a parte que protege o negocio',
    ],
    formato: 'Texto com uma analogia simples. Pode ter imagem de checklist.',
    cta: 'Where do you see the highest cost of a wrong AI answer: finance, health, supply chain, something else?',
  },
  {
    chave: 'post-6', numero: 6, data: 'Qui 19/11', pilar: 'Aprender em publico',
    gancho: 'I am learning how to evaluate LLM apps. Three things I wish I knew earlier.',
    oQueFalar: [
      'Esta estudando RAG e avaliacao de LLM na DeepLearning.AI',
      'Tres aprendizados reais do modulo que de fato fez',
      'Conecta com o que construiu, Budgeting API ou Execucao Diaria',
      'A diferenca entre funcionou uma vez e funciona de forma confiavel',
    ],
    formato: 'Carrossel de 6 slides.',
    cta: 'Which LLM evaluation method do you trust the most today?',
  },
  {
    chave: 'post-7', numero: 7, data: 'Ter 24/11', pilar: 'Opiniao sobre avaliacao de IA',
    gancho: 'Before you build an AI feature, write down how you will know it failed.',
    oQueFalar: [
      'Uma regra pratica de PM de IA: criterio de falha antes do codigo',
      'Tres perguntas: qual o custo do erro, quem revisa, quando desligar',
      'Os riscos que as equipes esquecem: tokens, latencia, seguranca',
      'Como liderar equipe e orcamento ajuda nessa conversa com o negocio',
    ],
    formato: 'Texto com a lista de 3 perguntas. O seu post mais assinatura.',
    cta: 'What would you add as question number four?',
  },
  {
    chave: 'post-8', numero: 8, data: 'Qui 26/11', pilar: 'Construir em publico',
    gancho: 'I am starting a project to evaluate AI in logistics. I will share it step by step.',
    oQueFalar: [
      'O problema: como saber se uma IA de logistica e confiavel',
      'O plano em 3 passos: caso de uso, criterios de avaliacao, teste',
      'Por que escolheu logistica: conhece o dominio por dentro',
      'Promessa de atualizacoes, que da motivo para quem segue voltar',
    ],
    formato: 'Texto mais um diagrama simples do plano.',
    cta: 'If you work in supply chain or AI evaluation, what should I make sure to test?',
  },
]
