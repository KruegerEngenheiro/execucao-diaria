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

// ---------------------------------------------------------------------------
// Modulo de candidaturas (E1). Tudo local, so no aparelho. Nada aqui envia
// candidatura: "enviada" e o registro manual de que o Carlos enviou.
// ---------------------------------------------------------------------------

// 1 nova, 2 analisando, 3 aguardando aprovacao, 4 preparada (aprovada), 5 enviada,
// 6 avaliacao do recrutador, 7 entrevista, 8 teste tecnico, 9 aprovado, 10 rejeitado,
// 11 encerrado. Transicoes validas em logica/candidaturas/status.ts.
export type StatusCandidatura = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11

export type Elegibilidade =
  | 'remote_brazil' | 'remote_latam' | 'remote_americas' | 'remote_worldwide'
  | 'remote_us_only' | 'hybrid' | 'onsite' | 'desconhecida'

export type SituacaoVaga = 'aberta' | 'expirada' | 'desconhecida'

export interface ParcelaScore {
  pontos: number
  max: number
  justificativa: string
}

export interface Vaga {
  id?: number
  chaveDedup: string // unica. Ver logica/candidaturas/dedup.ts
  empresa: string
  cargo: string
  pais?: string
  elegibilidade: Elegibilidade // sem evidencia, 'desconhecida' (nunca "aberta ao Brasil")
  elegibilidadeEvidencia?: string // trecho literal da vaga
  faixaSalarial?: string
  idioma?: string
  senioridade?: string
  tecnologias: string[]
  obrigatorios: string[]
  desejaveis: string[]
  url?: string
  plataforma: string // 'manual' quando colada pelo Carlos
  idExterno?: string
  publicadoEm?: string // 'YYYY-MM-DD'
  descricao?: string
  situacaoVaga: SituacaoVaga
  verificadaEm?: number
  status: StatusCandidatura // 1, 2 ou 11 ate existir candidatura; depois espelha a candidatura
  score?: number // preenchido so na entrega de compatibilidade (E2)
  scoreDetalhe?: Record<string, ParcelaScore>
  alertas: string[]
  criadoEm: number
  atualizadoEm: number
}

export interface RespostaCandidatura {
  pergunta: string
  texto: string
  origem: 'base' | 'manual' | 'ia'
  confirmado: boolean // so texto confirmado pode entrar numa peca aprovada
}

export type Desfecho = 'aprovado' | 'rejeitado' | 'encerrado' | 'desistencia'

export interface Candidatura {
  id?: number
  vagaId: number
  status: StatusCandidatura
  curriculoId?: number
  respostas: RespostaCandidatura[]
  camposPendentes: string[] // dado nao confirmado: fica pendente, nunca vira texto
  adiadaEm?: number // "salvar para depois"
  aprovadaEm?: number
  enviadaEm?: number
  desfecho?: Desfecho
  desfechoEm?: number
  idempotencyKey?: string // unica; so existe depois do envio registrado
  proximoFollowUp?: string // 'YYYY-MM-DD'
  entrevistaContadaEm?: number // meta "Entrevistas qualificadas" soma uma vez so
  criadoEm: number
  atualizadoEm: number
}

export type TipoEventoCandidatura =
  | 'criada' | 'editada' | 'aprovada' | 'aprovacao_revogada' | 'adiada' | 'envio'
  | 'avaliacao' | 'entrevista' | 'teste_tecnico' | 'contato_recrutador'
  | 'aprovado' | 'rejeicao' | 'encerrada' | 'followup' | 'nota' | 'status'

// Append-only: nao existe funcao de editar nem de apagar evento.
export interface EventoCandidatura {
  id?: number
  candidaturaId: number
  tipo: TipoEventoCandidatura
  em: number
  texto?: string
  deStatus?: StatusCandidatura
  paraStatus?: StatusCandidatura
  qualificada?: boolean // so em evento de entrevista; ausente = qualificada (eventos antigos)
}

// Central de dados: resposta reutilizavel. So vira peca se confirmado === true.
export interface RespostaBase {
  id?: number
  chave: string // unica
  rotulo: string
  pergunta?: string
  textoPt?: string
  textoEn?: string
  confirmado: boolean
  confirmadoEm?: number
  fonte?: string
}

export type ChaveCurriculo = 'EN-internacional' | 'PT-brasil'

// So os dois curriculos reais. O sistema escolhe entre eles, nao cria curriculo novo.
export interface Curriculo {
  id?: number
  chave: ChaveCurriculo
  rotulo: string
  idioma: 'en' | 'pt'
  formato?: string
  versao?: string
  hash?: string
  arquivo?: string // nome do arquivo (referencia), o arquivo em si nao e guardado
  atualizadoEm: number
}

export interface CampoPerfil {
  chave: string
  rotulo?: string
  valor: string
  confirmado: boolean
  fonte?: string
}

// Uma linha so (padrao carreiraPlano). Dado pessoal, so no aparelho, vindo de JSON.
export interface PerfilProfissional {
  id?: number
  campos: CampoPerfil[]
  importadoEm: number
}

export type TipoLogAcao =
  | 'vaga_criada' | 'vaga_duplicada' | 'vaga_descartada' | 'candidatura_criada'
  | 'candidatura_editada' | 'status' | 'aprovada' | 'envio_registrado' | 'envio_repetido'
  | 'envio_recusado' | 'evento' | 'perfil_importado' | 'backup_restaurado'

export interface LogAcao {
  id?: number
  em: number
  tipo: TipoLogAcao
  candidaturaId?: number
  vagaId?: number
  detalhe?: string // sem corpo de texto pessoal
}
