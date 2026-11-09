// Modelo de dados do Sistema Pessoal de Execucao.
// Regra central: ROTINA (estrutura fixa do dia) e diferente de TAREFA (demanda variavel).

// Classificacao de janela de tempo. Decide o que pode ser agendado onde.
//  BLOQUEADO  nao recebe tarefa (ex: sono)
//  FIXO       tem uma atividade definida (ex: reuniao)
//  FLEXIVEL   tem atividade principal, mas cabe tarefa pequena nas brechas (ex: expediente)
//  FOCO       trabalho concentrado (ex: academia, ingles, projeto)
//  LIVRE      sem atividade planejada, pode receber tarefa
export type Janela = 'BLOQUEADO' | 'FIXO' | 'FLEXIVEL' | 'FOCO' | 'LIVRE'

export type Prioridade = 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAIXA'

// Status de tarefa. 'reagendada' e 'cancelada' sao replanejamento legitimo
// e NAO contam como falha no score (ver logica/score.ts).
export type StatusTarefa =
  | 'pendente'
  | 'em_andamento'
  | 'pausada'
  | 'concluida'
  | 'reagendada'
  | 'cancelada'

export type TipoResultado = 'dinheiro' | 'quantidade' | 'tempo' | 'entrega' | 'outro'

export interface Categoria {
  id?: number
  nome: string
  cor: string
  icone: string
  ordem: number
  sistema: boolean // categorias base nao podem ser apagadas
}

// Regra de rotina recorrente. Gera as atividades fixas de cada dia da semana.
export interface Rotina {
  id?: number
  titulo: string
  categoria: string
  janela: Janela
  inicio: string // 'HH:MM'
  fim: string // 'HH:MM'
  dias: number[] // 0=domingo ... 6=sabado (getDay)
  nota?: string
  ativa: boolean
  ordem: number
}

// Excecao de um unico dia, sem mexer na rotina padrao.
export interface Excecao {
  id?: number
  rotinaId: number
  data: string // 'YYYY-MM-DD'
  acao: 'pular' | 'mover' // pular = nao acontece; mover = muda horario
  novoInicio?: string
  novoFim?: string
}

// Registro de execucao de um bloco de rotina num dia (planejado x realizado).
export interface RegistroBloco {
  id?: number
  data: string
  rotinaId: number
  status: 'pendente' | 'feito' | 'pulado'
  inicioReal?: string
  fimReal?: string
}

export interface Tarefa {
  id?: number
  titulo: string
  descricao?: string
  categoria: string
  prioridade: Prioridade
  status: StatusTarefa
  data?: string // dia em que deve acontecer 'YYYY-MM-DD'
  prazo?: string // data limite 'YYYY-MM-DD'
  inicioPlanejado?: string // 'HH:MM', so quando agendada
  fimPlanejado?: string // 'HH:MM'
  duracaoEstimada: number // minutos
  // Cronometro (execucao real)
  duracaoReal: number // minutos acumulados concluidos
  cronometroInicio?: number // timestamp ms de quando o timer corrente comecou
  tempoAcumuladoMs: number // ms somados de sessoes ja pausadas
  // Resultado e meta
  metaId?: number
  tags: string[]
  criadoEm: number
  atualizadoEm: number
  concluidoEm?: number
}

export interface Execucao {
  id?: number
  tarefaId: number
  data: string
  inicioEm: number
  fimEm?: number
  duracaoMs: number
}

export interface Resultado {
  id?: number
  tarefaId?: number
  data: string
  tipo: TipoResultado
  valor: number
  unidade?: string
  descricao?: string
  categoria?: string
  metaId?: number
}

export interface Meta {
  id?: number
  titulo: string
  categoria?: string
  alvo: number
  atual: number
  unidade: string
  tipoResultado?: TipoResultado // soma automatica de resultados deste tipo
  inicio?: string
  fim?: string
  status: 'ativa' | 'concluida' | 'pausada'
}

export interface ResumoDiario {
  id?: number
  data: string
  percentualExecucao: number
  tarefasConcluidas: number
  tarefasContadas: number
  tempoExecutadoMin: number
  score: number
  pendencias: string[]
  adiadas: string[]
  conquistas: string
  aprendi: string
  melhorar: string
  fechadoEm: number
}

export interface Config {
  id?: number
  tema: 'claro' | 'escuro' | 'sistema'
  notifInicioAtividade: boolean
  notifProxima: boolean
  notifAtraso: boolean
  notifFechamento: boolean
}

// Progresso do Plano de carreira (cursos, checklist do LinkedIn, posts publicados).
// valor: itens binarios usam 'feito' ou vazio; cursos usam 'a-fazer' | 'fazendo' | 'feito'.
export interface PlanoProgresso {
  id?: number
  chave: string
  valor: string
  atualizadoEm: number
}

// Progresso das atividades do Plano de carreira de 90 dias (diluido por dia).
// chave: `${atividadeId}::${dataISO}`. Recorrentes marcam por dia; unicas, na sua data.
export interface CarreiraProgresso {
  id?: number
  chave: string
  feito: boolean
  atualizadoEm: number
}
