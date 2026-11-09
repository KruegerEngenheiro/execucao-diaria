// Gerador do Plano de carreira: dada uma data, diz o que e DEVIDO naquele dia.
// Funcao pura e testavel. O conteudo vem de carreiraPlanoSeed; o que esta feito
// vem do conjunto de chaves `${id}::${data}` da tabela carreiraProgresso.
import type { AtividadeCarreira, CategoriaCarreira } from '../dados/carreiraPlanoSeed'
import { ORDEM_CATEGORIA } from '../dados/carreiraPlanoSeed'
import { diaDaSemana } from '../utils/datas'

// Chave estavel de progresso de uma atividade num dia.
export function chaveCarreira(id: string, dataISO: string): string {
  return `${id}::${dataISO}`
}

// Atividades devidas no dia, dentro da janela do plano.
//  diaria  -> dias uteis (segunda a sexta)
//  semanal -> no diaSemana marcado
//  mensal  -> no diaDoMes marcado
//  unica   -> na data marcada
export function atividadesDoDia(
  dataISO: string,
  atividades: AtividadeCarreira[],
  inicio: string,
  fim: string,
): AtividadeCarreira[] {
  if (dataISO < inicio || dataISO > fim) return []
  const dow = diaDaSemana(dataISO) // 0=dom ... 6=sab
  const diaDoMes = Number(dataISO.slice(8, 10))

  return atividades.filter((a) => {
    switch (a.frequencia) {
      case 'unica':
        return a.data === dataISO
      case 'diaria':
        return dow >= 1 && dow <= 5
      case 'semanal':
        return a.diaSemana === dow
      case 'mensal':
        return a.diaDoMes === diaDoMes
      default:
        return false
    }
  })
}

// Progresso finito do plano: conta so as atividades de entrega (unica), que tem
// comeco e fim. As recorrentes sao ritmo, nao marco, e ficam fora da conta.
export interface ProgressoPlano {
  feitas: number
  total: number
  pct: number
}

export function progressoPlano(
  atividades: AtividadeCarreira[],
  feitos: Set<string>,
): ProgressoPlano {
  const finitas = atividades.filter((a) => a.frequencia === 'unica')
  const feitas = finitas.filter((a) => feitos.has(chaveCarreira(a.id, a.data ?? ''))).length
  const total = finitas.length
  const pct = total > 0 ? Math.round((feitas / total) * 100) : 0
  return { feitas, total, pct }
}

// Chave de dispensa de uma entrega atrasada. Uma por atividade (nao por dia),
// porque uma entrega unica so acontece uma vez.
export function chaveDispensa(id: string): string {
  return `${id}::dispensado`
}

// Pendencias atrasadas: entregas (frequencia 'unica') cuja data ja passou e que
// nao foram feitas nem dispensadas. Servem de lembrete e ficam FORA do placar de
// qualquer dia, para nao atrapalhar a rotina dos dias seguintes.
export function pendenciasCarreira(
  hojeISO: string,
  atividades: AtividadeCarreira[],
  inicio: string,
  feitos: Set<string>,
  dispensados: Set<string>,
): AtividadeCarreira[] {
  return atividades
    .filter((a) => a.frequencia === 'unica' && !!a.data)
    .filter((a) => a.data! >= inicio && a.data! < hojeISO)
    .filter((a) => !feitos.has(chaveCarreira(a.id, a.data!)))
    .filter((a) => !dispensados.has(chaveDispensa(a.id)))
    .sort((x, y) => (x.data! < y.data! ? -1 : 1))
}

// Agrupa as atividades por categoria, na ordem de exibicao, pulando vazias.
export function porCategoria(
  atividades: AtividadeCarreira[],
): { categoria: CategoriaCarreira; itens: AtividadeCarreira[] }[] {
  return ORDEM_CATEGORIA
    .map((categoria) => ({ categoria, itens: atividades.filter((a) => a.categoria === categoria) }))
    .filter((g) => g.itens.length > 0)
}
