// Plano de carreira de EXEMPLO para a demonstracao publica (portfolio).
// E um esqueleto generico de um plano de 90 dias, so para mostrar a tela funcionando.
// O plano real do usuario fica apenas no aparelho (tabela carreiraPlano, importada
// pelo proprio usuario) e NUNCA no codigo. O que esta feito fica na tabela
// carreiraProgresso (chaves `${id}::${data}`), separado disto.
//
// Janela do plano de exemplo.

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
  textoPost?: string // texto pronto pra copiar (posts)
  condicional?: string
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

export const LABEL_FREQ: Record<FreqCarreira, string> = {
  diaria: 'todo dia util',
  semanal: 'toda semana',
  mensal: 'todo mes',
  unica: 'uma vez',
}

// Plano de EXEMPLO (generico). Importe o seu plano real pelas Configuracoes.
export const ATIVIDADES_CARREIRA: AtividadeCarreira[] = [
  {
    id: 'ex-li-diario', categoria: 'LinkedIn', nome: 'LinkedIn do dia, 30 min',
    descricao: 'Exemplo de habito diario: responder, comentar e enviar convites.',
    frequencia: 'diaria', prioridade: 'P0',
    resultadoEsperado: 'Perfil ativo', indicador: 'Visualizacoes de perfil',
    checklist: ['Responder mensagens', 'Comentar em 3 a 5 posts', 'Enviar 2 convites com nota'],
  },
  {
    id: 'ex-sem-planejar', categoria: 'LinkedIn', nome: 'Planejar a semana',
    descricao: 'Exemplo de ritual semanal: define o foco e olha os numeros.',
    frequencia: 'semanal', diaSemana: 1, prioridade: 'P1',
    resultadoEsperado: 'Semana planejada', indicador: 'Metas definidas',
  },
  {
    id: 'ex-sem-candidaturas', categoria: 'Candidaturas', nome: 'Sessao de candidaturas',
    descricao: 'Exemplo: candidatar em 1 a 3 vagas por semana.',
    frequencia: 'semanal', diaSemana: 3, prioridade: 'P0',
    resultadoEsperado: 'Candidaturas direcionadas', indicador: 'Candidaturas feitas',
  },
  {
    id: 'ex-marco-perfil', categoria: 'LinkedIn', nome: 'Exemplo de marco: revisar o perfil',
    descricao: 'Exemplo de entrega unica, com data, que entra no progresso do plano.',
    frequencia: 'unica', data: '2026-11-05', prioridade: 'P1',
    resultadoEsperado: 'Perfil revisado', indicador: 'Marco concluido',
  },
  {
    id: 'ex-post-1', categoria: 'Publicacoes', nome: 'Exemplo de post 1',
    descricao: 'Exemplo de post agendado. Escreva o seu no app e copie na hora de publicar.',
    frequencia: 'unica', data: '2026-11-06', prioridade: 'P1',
    resultadoEsperado: 'Post publicado', indicador: 'Engajamento',
    pilar: 'Exemplo', textoPost: 'This is where your post text goes. Write it here and copy it when you publish.',
  },
  {
    id: 'ex-port-github', categoria: 'GitHub', nome: 'Exemplo de marco: publicar um projeto',
    descricao: 'Exemplo: subir um repositorio com um bom README.',
    frequencia: 'unica', data: '2026-11-10', prioridade: 'P1',
    resultadoEsperado: 'Repositorio publicado', indicador: 'Projeto no ar',
  },
]
