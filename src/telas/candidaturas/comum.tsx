// Pecas compartilhadas das telas de candidaturas: dados, pill de status e rotulos.
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../../db'
import type { Vaga, Candidatura, Elegibilidade, StatusCandidatura } from '../../types'
import { STATUS_ROTULO, corDoStatus, type CorStatus } from '../../logica/candidaturas/status'
import { urlHttpValida } from '../../logica/candidaturas/dedup'

export type SubVagas = 'resumo' | 'vagas' | 'aprovar' | 'enviadas' | 'entrevistas' | 'historico'

export const ELEGIBILIDADE_ROTULO: Record<Elegibilidade, string> = {
  remote_brazil: 'Remoto Brasil',
  remote_latam: 'Remoto LATAM',
  remote_americas: 'Remoto Americas',
  remote_worldwide: 'Remoto mundo todo',
  remote_us_only: 'Remoto so EUA',
  hybrid: 'Hibrido',
  onsite: 'Presencial',
  desconhecida: 'Elegibilidade nao confirmada',
}

export interface DadosCandidaturas {
  vagas: Vaga[]
  candidaturas: Candidatura[]
  vagaPorId: Map<number, Vaga>
}

type Estado =
  | { fase: 'carregando' }
  | { fase: 'erro' }
  | { fase: 'ok'; dados: DadosCandidaturas }

// Leitura reativa com os 3 estados (carregando, erro, ok). Nunca devolve lista
// vazia enquanto carrega: zero falso esconderia candidatura pendente.
export function useDadosCandidaturas(): { estado: Estado; tentarDeNovo: () => void } {
  const [tentativa, setTentativa] = useState(0)
  const estado = useLiveQuery(async (): Promise<Estado> => {
    try {
      const [vagas, candidaturas] = await Promise.all([db.vagas.toArray(), db.candidaturas.toArray()])
      return { fase: 'ok', dados: { vagas, candidaturas, vagaPorId: new Map(vagas.map((v) => [v.id!, v])) } }
    } catch {
      return { fase: 'erro' }
    }
  }, [tentativa], { fase: 'carregando' } as Estado)
  return { estado, tentarDeNovo: () => setTentativa((n) => n + 1) }
}

export function StatusPill({ status }: { status: StatusCandidatura }) {
  return <Pill cor={corDoStatus(status)} texto={STATUS_ROTULO[status]} />
}

export function Pill({ cor, texto }: { cor: CorStatus; texto: string }) {
  const c = cor === 'faint' ? 'var(--faint)' : `var(--${cor})`
  return (
    <span className="pill" style={{ color: c, background: `color-mix(in srgb, ${c} 16%, transparent)` }}>{texto}</span>
  )
}

// Link externo seguro: so http e https, abre em outra aba sem vazar o referrer.
export function LinkExterno({ url, rotulo = 'Abrir vaga', classe = 'btn pequeno' }: { url?: string; rotulo?: string; classe?: string }) {
  if (!url || !urlHttpValida(url)) return null
  return <a className={classe} href={url} target="_blank" rel="noopener noreferrer">{rotulo}</a>
}

export function dataBR(ms: number): string {
  const d = new Date(ms)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

export function msde(dataISO: string): number {
  // Meio-dia local: evita virar o dia por fuso.
  return new Date(`${dataISO}T12:00:00`).getTime()
}
