// Componentes visuais reutilizados: folha modal, barra de progresso e anel de score.
import type { ReactNode } from 'react'
import { Icon } from './Icon'

export function Folha({ titulo, onFechar, children }: { titulo: string; onFechar: () => void; children: ReactNode }) {
  return (
    <div className="sheet-bg" onClick={onFechar} role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="puxador" />
        <div className="row">
          <h2 className="sp">{titulo}</h2>
          <button className="btn pequeno" onClick={onFechar} aria-label="Fechar">
            <Icon nome="fechar" tam={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Barra({ pct }: { pct: number }) {
  const v = Math.max(0, Math.min(100, pct))
  return (
    <div className="barra" role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ width: `${v}%` }} />
    </div>
  )
}

export function Anel({ valor, cor }: { valor: number; cor?: string }) {
  const r = 40
  const circ = 2 * Math.PI * r
  const off = circ * (1 - Math.max(0, Math.min(100, valor)) / 100)
  const stroke = cor ?? 'var(--accent)'
  return (
    <div className="anel">
      <svg width="92" height="92" viewBox="0 0 92 92">
        <circle cx="46" cy="46" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="8" />
        <circle
          cx="46" cy="46" r={r} fill="none" stroke={stroke} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={off} transform="rotate(-90 46 46)"
          style={{ transition: 'stroke-dashoffset .5s ease' }}
        />
      </svg>
      <div className="v">{Math.round(valor)}</div>
    </div>
  )
}

export function Vazio({ icone, texto }: { icone: string; texto: string }) {
  return (
    <div className="vazio">
      <div className="ic"><Icon nome={icone} tam={34} /></div>
      <div>{texto}</div>
    </div>
  )
}
