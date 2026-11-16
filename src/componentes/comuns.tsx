// Componentes visuais reutilizados: folha modal, barra de progresso e anel de score.
import { useState, type ReactNode } from 'react'
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

// Estado de carregamento. Existe para a tela nao mostrar "vazio" ou zero enquanto
// o dado ainda nao chegou (um zero falso esconde candidatura pendente).
export function Carregando({ texto = 'Carregando...' }: { texto?: string }) {
  return (
    <div className="vazio" role="status" aria-live="polite">
      <div>{texto}</div>
    </div>
  )
}

// Estado de erro com acao de tentar de novo.
export function ErroBloco({ texto, onTentar }: { texto: string; onTentar?: () => void }) {
  return (
    <div className="aviso erro" role="alert">
      <div>{texto}</div>
      {onTentar && (
        <button className="btn pequeno" style={{ marginTop: 10 }} onClick={onTentar}>Tentar de novo</button>
      )}
    </div>
  )
}

// Confirmacao propria, no lugar do confirm() nativo. Bloqueia clique duplo
// enquanto a acao roda e mostra o erro se ela falhar.
export function ConfirmaAcao({
  titulo, texto, rotuloConfirmar = 'Confirmar', perigo = false, onConfirmar, onCancelar,
}: {
  titulo: string
  texto: string
  rotuloConfirmar?: string
  perigo?: boolean
  onConfirmar: () => void | Promise<void>
  onCancelar: () => void
}) {
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')

  async function confirmar() {
    if (ocupado) return
    setOcupado(true)
    setErro('')
    try {
      await onConfirmar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Nao consegui concluir.')
      setOcupado(false)
    }
  }

  return (
    <Folha titulo={titulo} onFechar={ocupado ? () => {} : onCancelar}>
      <div style={{ fontSize: 15, lineHeight: 1.45, marginBottom: 14 }}>{texto}</div>
      {erro && <ErroBloco texto={erro} />}
      <div className="linha-btns">
        <button className="btn" onClick={onCancelar} disabled={ocupado}>Cancelar</button>
        <button className={`btn ${perigo ? 'perigo' : 'pri'}`} onClick={confirmar} disabled={ocupado}>
          {ocupado ? 'Aguarde...' : rotuloConfirmar}
        </button>
      </div>
    </Folha>
  )
}
