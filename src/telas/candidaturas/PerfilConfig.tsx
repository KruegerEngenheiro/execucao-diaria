// Secao "Perfil para candidaturas" da Config. O perfil e as respostas entram por
// JSON importado, ficam so neste aparelho e nunca vao no codigo.
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../../db'
import { Icon } from '../../componentes/Icon'
import { ErroBloco } from '../../componentes/comuns'
import { importarPerfil, RegraViolada } from '../../servicos/candidaturas'
import { Pill } from './comum'

const EXEMPLO = `{
  "perfil": [
    { "chave": "nome", "valor": "...", "confirmado": true }
  ],
  "respostasBase": [
    { "chave": "por-que-essa-vaga",
      "rotulo": "Por que essa vaga",
      "pergunta": "Why this role?",
      "textoPt": "...", "textoEn": "...",
      "confirmado": true }
  ],
  "curriculos": [
    { "chave": "EN-internacional",
      "versao": "...", "arquivo": "..." }
  ]
}`

export function PerfilConfig({ onMsg }: { onMsg: (m: string) => void }) {
  // Falha de leitura vira estado de erro (null), nunca "Carregando" eterno.
  const [tentativa, setTentativa] = useState(0)
  const dados = useLiveQuery(async () => {
    try {
      const [perfil, respostas, curriculos] = await Promise.all([
        db.perfilProfissional.toArray(), db.respostasBase.toArray(), db.curriculos.toArray(),
      ])
      return { perfil, respostas, curriculos }
    } catch {
      return null
    }
  }, [tentativa])
  const perfil = dados?.perfil
  const respostas = dados?.respostas
  const curriculos = dados?.curriculos
  const [ajuda, setAjuda] = useState(false)

  async function importar(ev: React.ChangeEvent<HTMLInputElement>) {
    const f = ev.target.files?.[0]
    ev.target.value = ''
    if (!f) return
    let dados: unknown
    try {
      dados = JSON.parse(await f.text())
    } catch {
      onMsg('Nao consegui ler esse arquivo: o JSON esta quebrado.')
      return
    }
    try {
      const r = await importarPerfil(dados)
      const avisos = r.avisos.length > 0 ? ` Avisos: ${r.avisos.join(' ')}` : ''
      onMsg(`Perfil importado: ${r.campos} campos, ${r.respostas} respostas. ${r.pendentes > 0 ? `${r.pendentes} item(ns) pendente(s) de confirmacao, nao entram em candidaturas.` : 'Tudo confirmado.'}${avisos}`)
    } catch (e) {
      onMsg(e instanceof RegraViolada ? `Importacao recusada: ${e.message}` : 'Nao consegui importar o perfil.')
    }
  }

  const campos = perfil?.[0]?.campos ?? []
  const confCampos = campos.filter((c) => c.confirmado).length
  const confResp = (respostas ?? []).filter((r) => r.confirmado).length

  return (
    <>
      <div className="titulo-secao">Perfil para candidaturas</div>
      <label className="btn bloco" style={{ cursor: 'pointer' }}>
        <Icon nome="volta" tam={18} /> Importar perfil e respostas (JSON)
        <input type="file" accept="application/json" onChange={importar} style={{ display: 'none' }} />
      </label>
      <div className="mut" style={{ fontSize: 12.5, marginTop: 8, lineHeight: 1.4 }}>
        So o que tiver confirmado=true entra em uma candidatura. O resto fica pendente de confirmacao. Os dados ficam so neste aparelho. O backup (JSON) tambem leva esses dados, entao guarde o arquivo com cuidado.
      </div>

      {dados === null && (
        <div style={{ marginTop: 10 }}><ErroBloco texto="Nao consegui ler o perfil deste aparelho." onTentar={() => setTentativa((n) => n + 1)} /></div>
      )}
      <div className="row" style={{ marginTop: 10, flexWrap: 'wrap' }}>
        <Pill cor={campos.length ? 'accent' : 'faint'} texto={`Perfil: ${confCampos}/${campos.length} confirmados`} />
        <Pill cor={(respostas ?? []).length ? 'accent' : 'faint'} texto={`Respostas: ${confResp}/${(respostas ?? []).length} confirmadas`} />
      </div>
      {(curriculos ?? []).map((c) => (
        <div className="mut" key={c.id} style={{ fontSize: 13, marginTop: 6 }}>
          Curriculo {c.chave}: {c.arquivo ? c.arquivo : 'arquivo nao informado'}{c.versao ? ` (versao ${c.versao})` : ''}
        </div>
      ))}

      <button className="btn pequeno" style={{ marginTop: 10 }} onClick={() => setAjuda(!ajuda)}>{ajuda ? 'Esconder formato' : 'Ver formato do JSON'}</button>
      {ajuda && (
        <pre style={{ fontSize: 11.5, background: 'var(--surface-2)', padding: 12, borderRadius: 12, overflowX: 'auto', marginTop: 8 }}>{EXEMPLO}</pre>
      )}
    </>
  )
}
