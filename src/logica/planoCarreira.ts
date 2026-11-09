// Fonte do plano de carreira em tempo de execucao.
// Regra: se o usuario importou o plano real (tabela carreiraPlano, so no aparelho),
// usa ele; senao usa o plano de EXEMPLO (generico) que vem no codigo. Assim o build
// publico de portfolio nunca carrega o plano pessoal de ninguem.
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import {
  ATIVIDADES_CARREIRA, INICIO_PLANO, FIM_PLANO, type AtividadeCarreira,
} from '../dados/carreiraPlanoSeed'

export interface PlanoCarreira {
  atividades: AtividadeCarreira[]
  inicio: string
  fim: string
}

export const PLANO_GENERICO: PlanoCarreira = {
  atividades: ATIVIDADES_CARREIRA,
  inicio: INICIO_PLANO,
  fim: FIM_PLANO,
}

// Hook reativo. Retorna undefined enquanto carrega (as telas tratam), depois o
// plano do aparelho se existir, senao o generico.
export function usePlanoCarreira(): PlanoCarreira | undefined {
  const docs = useLiveQuery(() => db.carreiraPlano.toArray(), [])
  if (docs === undefined) return undefined
  const doc = docs[0]
  if (doc && Array.isArray(doc.atividades) && doc.atividades.length > 0) {
    return { atividades: doc.atividades, inicio: doc.inicio || INICIO_PLANO, fim: doc.fim || FIM_PLANO }
  }
  return PLANO_GENERICO
}

// Verdadeiro se o usuario ja importou um plano real neste aparelho.
export async function temPlanoImportado(): Promise<boolean> {
  return (await db.carreiraPlano.count()) > 0
}

// Importa o plano real para o aparelho. Substitui qualquer plano anterior.
// Mantem os mesmos ids das atividades, entao as marcacoes de feito continuam valendo.
export async function importarPlanoCarreira(dados: {
  atividades: AtividadeCarreira[]
  inicio?: string
  fim?: string
}): Promise<number> {
  if (!dados || !Array.isArray(dados.atividades) || dados.atividades.length === 0) {
    throw new Error('Arquivo invalido: nao encontrei a lista de atividades.')
  }
  await db.carreiraPlano.clear()
  await db.carreiraPlano.add({
    atividades: dados.atividades,
    inicio: dados.inicio || INICIO_PLANO,
    fim: dados.fim || FIM_PLANO,
    importadoEm: new Date().toISOString(),
  })
  return dados.atividades.length
}

// Remove o plano importado e volta ao plano de exemplo.
export async function limparPlanoImportado(): Promise<void> {
  await db.carreiraPlano.clear()
}
