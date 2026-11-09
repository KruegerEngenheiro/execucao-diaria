// Tela Plano. O mapa de carreira dos 90 dias (ate 31/01/2027): cursos e as 8
// frentes do plano, com os marcos marcaveis e os textos de post prontos pra copiar.
// O dia a dia (o que fazer hoje) aparece na tela Hoje; aqui e a visao do roteiro.
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../db'
import { marcarPlano, marcarCarreira } from '../servicos'
import type { PlanoProgresso, CarreiraProgresso } from '../types'
import { CURSOS } from '../dados/planoSeed'
import {
  LABEL_CATEGORIA, LABEL_FREQ, type AtividadeCarreira,
} from '../dados/carreiraPlanoSeed'
import { usePlanoCarreira } from '../logica/planoCarreira'
import { progressoPlano, porCategoria, chaveCarreira } from '../logica/carreiraPlano'
import { Icon } from '../componentes/Icon'
import { Barra } from '../componentes/comuns'
import { copiarTexto } from '../utils/clipboard'
import { dataCurta } from '../utils/datas'

const CICLO = ['a-fazer', 'fazendo', 'feito']
const ROTULO: Record<string, string> = { 'a-fazer': 'a fazer', fazendo: 'fazendo', feito: 'feito' }

export function Plano() {
  const progresso = useLiveQuery(() => db.planoProgresso.toArray(), [], [] as PlanoProgresso[])
  const carreiraProg = useLiveQuery(() => db.carreiraProgresso.toArray(), [], [] as CarreiraProgresso[])
  const planoCarreira = usePlanoCarreira()
  if (!progresso || !carreiraProg || !planoCarreira) return null

  const mapa = new Map(progresso.map((p) => [p.chave, p.valor]))
  const val = (chave: string) => mapa.get(chave) ?? ''
  const feitosCarreira = new Set(carreiraProg.filter((c) => c.feito).map((c) => c.chave))
  const feitoAtiv = (a: AtividadeCarreira) => feitosCarreira.has(chaveCarreira(a.id, a.data ?? ''))

  const plano = progressoPlano(planoCarreira.atividades, feitosCarreira)
  const cursosFeitos = CURSOS.filter((c) => val(c.chave) === 'feito').length
  const grupos = porCategoria(planoCarreira.atividades)

  function ciclaCurso(chave: string) {
    const atual = val(chave) || 'a-fazer'
    const prox = CICLO[(CICLO.indexOf(atual) + 1) % CICLO.length]
    marcarPlano(chave, prox === 'a-fazer' ? '' : prox)
  }

  return (
    <>
      <div className="cab">
        <h1>Plano</h1>
        <div className="sub">90 dias ate 31/01/2027: AI Engineer, Forward Deployed Engineer e AI Product</div>
      </div>

      <div className="cartao">
        <div className="row">
          <div className="sp">
            <div className="titulo-secao" style={{ margin: '0 0 6px' }}>Progresso do plano de 90 dias</div>
            <Barra pct={plano.pct} />
          </div>
          <div className="big" style={{ fontSize: 30, minWidth: 58, textAlign: 'right' }}>{plano.pct}%</div>
        </div>
        <div className="mut" style={{ fontSize: 13, marginTop: 8 }}>
          {plano.feitas} de {plano.total} entregas feitas. As tarefas do dia a dia aparecem na tela Hoje.
        </div>
      </div>

      <div className="titulo-secao">Cursos, um por vez ({cursosFeitos} de {CURSOS.length})</div>
      <div className="cartao">
        {CURSOS.map((c) => {
          const st = val(c.chave) || 'a-fazer'
          const cor = st === 'feito' ? 'var(--ok)' : st === 'fazendo' ? 'var(--accent)' : 'var(--surface-2)'
          const txt = st === 'a-fazer' ? 'var(--muted)' : '#fff'
          return (
            <div className="tarefa" key={c.chave} onClick={() => ciclaCurso(c.chave)} style={{ padding: '11px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer', alignItems: 'flex-start' }}>
              <button className={`check ${st === 'feito' ? 'on' : ''}`} aria-label="Avancar status do curso" style={{ marginTop: 2 }}>
                {st === 'feito' && <Icon nome="check" tam={16} />}
              </button>
              <div className="corpo">
                <div className="tit" style={st === 'feito' ? { color: 'var(--muted)' } : undefined}>{c.nome}</div>
                <div className="linha-meta">
                  {c.prazo && <span>prazo {c.prazo}</span>}
                  <span>alimenta {c.alimenta}</span>
                </div>
                <div className="mut" style={{ fontSize: 12.5, marginTop: 5, lineHeight: 1.4 }}>{c.destrava}</div>
              </div>
              <span className="pill" style={{ background: cor, color: txt, flex: 'none' }}>{ROTULO[st]}</span>
            </div>
          )
        })}
      </div>

      {grupos.map(({ categoria, itens }) => {
        const unicas = itens.filter((a) => a.frequencia === 'unica')
        const feitas = unicas.filter(feitoAtiv).length
        return (
          <div key={categoria}>
            <div className="titulo-secao">
              {LABEL_CATEGORIA[categoria]}
              {unicas.length > 0 && <span className="mut" style={{ fontWeight: 400 }}> ({feitas} de {unicas.length})</span>}
            </div>
            <div className="cartao">
              {itens.map((a) => (
                <AtivRow key={a.id} atividade={a} feito={feitoAtiv(a)} />
              ))}
            </div>
          </div>
        )
      })}
    </>
  )
}

function AtivRow({ atividade, feito }: { atividade: AtividadeCarreira; feito: boolean }) {
  const [copiado, setCopiado] = useState(false)
  const recorrente = atividade.frequencia !== 'unica'

  async function copiar() {
    if (!atividade.textoPost) return
    const ok = await copiarTexto(atividade.textoPost)
    if (ok) { setCopiado(true); setTimeout(() => setCopiado(false), 1800) }
  }

  // Recorrente: ritmo, nao marco. Mostra a frequencia e nao tem check (marca no Hoje).
  if (recorrente) {
    return (
      <div className="tarefa" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}>
        <div className="corpo">
          <div className="tit" style={{ fontWeight: 500 }}>{atividade.nome}</div>
          <div className="linha-meta"><span>{LABEL_FREQ[atividade.frequencia]}</span><span>· {atividade.prioridade}</span></div>
        </div>
      </div>
    )
  }

  // Unica (inclui posts): marcavel. Post tem botao de copiar o texto.
  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <div className="tarefa" style={{ padding: 0, alignItems: 'flex-start' }}>
        <button
          className={`check ${feito ? 'on' : ''}`}
          onClick={() => marcarCarreira(atividade.id, atividade.data!, !feito)}
          aria-label="Marcar entrega"
          style={{ marginTop: 2 }}
        >
          {feito && <Icon nome="check" tam={16} />}
        </button>
        <div className="corpo">
          <div className="tit" style={feito ? { color: 'var(--muted)' } : undefined}>{atividade.nome}</div>
          <div className="linha-meta">
            {atividade.data && <span>{dataCurta(atividade.data)}</span>}
            <span>· {atividade.prioridade}</span>
            {atividade.pilar && <span>· {atividade.pilar}</span>}
          </div>
          {atividade.condicional && (
            <div style={{ fontSize: 12.5, lineHeight: 1.4, marginTop: 5, color: 'var(--accent)' }}>{atividade.condicional}</div>
          )}
          {atividade.textoPost && (
            <div className="linha-btns mt">
              <button className="btn pequeno" onClick={copiar}><Icon nome="copiar" tam={15} /> {copiado ? 'Copiado' : 'Copiar texto'}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
