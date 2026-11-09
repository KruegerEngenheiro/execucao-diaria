// Expande as regras de rotina nas atividades concretas de um dia,
// aplicando as excecoes daquele dia (pular ou mover).
import type { Rotina, Excecao, Janela } from '../types'
import { diaDaSemana, hhmmParaMin } from '../utils/datas'

export interface BlocoDia {
  rotinaId: number
  titulo: string
  categoria: string
  janela: Janela
  inicio: string
  fim: string
  inicioMin: number
  fimMin: number
  nota?: string
}

export function blocosDoDia(
  dataISO: string,
  rotinas: Rotina[],
  excecoes: Excecao[],
): BlocoDia[] {
  const dow = diaDaSemana(dataISO)
  const excDoDia = new Map<number, Excecao>()
  for (const e of excecoes) {
    if (e.data === dataISO) excDoDia.set(e.rotinaId, e)
  }

  const blocos: BlocoDia[] = []
  for (const r of rotinas) {
    if (!r.ativa) continue
    if (!r.dias.includes(dow)) continue
    const exc = r.id != null ? excDoDia.get(r.id) : undefined
    if (exc?.acao === 'pular') continue

    const inicio = exc?.acao === 'mover' && exc.novoInicio ? exc.novoInicio : r.inicio
    const fim = exc?.acao === 'mover' && exc.novoFim ? exc.novoFim : r.fim

    blocos.push({
      rotinaId: r.id ?? -1,
      titulo: r.titulo,
      categoria: r.categoria,
      janela: r.janela,
      inicio,
      fim,
      inicioMin: hhmmParaMin(inicio),
      fimMin: hhmmParaMin(fim),
      nota: r.nota,
    })
  }

  blocos.sort((a, b) => a.inicioMin - b.inicioMin)
  return blocos
}
