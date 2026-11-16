// Cadastro manual de vaga: o Carlos cola o link e o texto. Nada e lido da internet.
import { useState } from 'react'
import { Folha } from '../../componentes/comuns'
import type { Elegibilidade } from '../../types'
import { criarVaga, RegraViolada, type ResultadoCriarVaga } from '../../servicos/candidaturas'
import { ELEGIBILIDADE_ROTULO } from './comum'

const linhas = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean)
const virgulas = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean)

export function FormVaga({ onFechar, onCriada }: { onFechar: () => void; onCriada: (r: ResultadoCriarVaga, empresa: string) => void }) {
  const [empresa, setEmpresa] = useState('')
  const [cargo, setCargo] = useState('')
  const [url, setUrl] = useState('')
  const [plataforma, setPlataforma] = useState('')
  const [descricao, setDescricao] = useState('')
  const [elegibilidade, setElegibilidade] = useState<Elegibilidade>('desconhecida')
  const [evidencia, setEvidencia] = useState('')
  const [idioma, setIdioma] = useState('')
  const [pais, setPais] = useState('')
  const [faixa, setFaixa] = useState('')
  const [senioridade, setSenioridade] = useState('')
  const [tecnologias, setTecnologias] = useState('')
  const [obrigatorios, setObrigatorios] = useState('')
  const [desejaveis, setDesejaveis] = useState('')
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    if (salvando) return
    setErro('')
    setAviso('')
    setSalvando(true)
    try {
      const r = await criarVaga({
        empresa, cargo, url, plataforma, descricao, elegibilidade, elegibilidadeEvidencia: evidencia,
        idioma, pais, faixaSalarial: faixa, senioridade,
        tecnologias: virgulas(tecnologias), obrigatorios: linhas(obrigatorios), desejaveis: linhas(desejaveis),
      })
      if (!r.criada) {
        setAviso(r.jaCandidatada
          ? 'Essa vaga ja existe e voce ja se candidatou. Nada foi duplicado.'
          : 'Essa vaga ja esta cadastrada. Nada foi duplicado.')
        setSalvando(false)
        return
      }
      onCriada(r, empresa.trim())
      onFechar()
    } catch (e) {
      setErro(e instanceof RegraViolada ? e.message : 'Nao consegui salvar a vaga. Tente de novo.')
      setSalvando(false)
    }
  }

  return (
    <Folha titulo="Nova vaga" onFechar={onFechar}>
      <div className="campo"><label>Empresa</label><input value={empresa} onChange={(e) => setEmpresa(e.target.value)} maxLength={120} autoComplete="off" /></div>
      <div className="campo"><label>Cargo</label><input value={cargo} onChange={(e) => setCargo(e.target.value)} maxLength={160} autoComplete="off" /></div>
      <div className="campo"><label>Link da vaga</label><input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." inputMode="url" autoCapitalize="none" autoCorrect="off" /></div>
      <div className="campo"><label>Onde achou (opcional)</label><input value={plataforma} onChange={(e) => setPlataforma(e.target.value)} placeholder="LinkedIn, Gupy, site da empresa..." maxLength={60} /></div>
      <div className="campo"><label>Texto da vaga (cole aqui)</label><textarea style={{ minHeight: 120 }} value={descricao} onChange={(e) => setDescricao(e.target.value)} maxLength={20000} /></div>

      <div className="campo">
        <label>Quem pode se candidatar</label>
        <select value={elegibilidade} onChange={(e) => setElegibilidade(e.target.value as Elegibilidade)}>
          {(Object.keys(ELEGIBILIDADE_ROTULO) as Elegibilidade[]).map((k) => <option key={k} value={k}>{ELEGIBILIDADE_ROTULO[k]}</option>)}
        </select>
      </div>
      {elegibilidade !== 'desconhecida' && (
        <div className="campo">
          <label>Trecho da vaga que comprova (obrigatorio)</label>
          <textarea value={evidencia} onChange={(e) => setEvidencia(e.target.value)} maxLength={600} placeholder="Cole a frase exata da vaga" />
        </div>
      )}

      <div className="grade-2">
        <div className="campo"><label>Idioma da vaga</label>
          <select value={idioma} onChange={(e) => setIdioma(e.target.value)}>
            <option value="">Nao sei</option><option value="en">Ingles</option><option value="pt">Portugues</option>
          </select>
        </div>
        <div className="campo"><label>Pais</label><input value={pais} onChange={(e) => setPais(e.target.value)} maxLength={80} /></div>
      </div>
      <div className="grade-2">
        <div className="campo"><label>Faixa salarial</label><input value={faixa} onChange={(e) => setFaixa(e.target.value)} maxLength={80} /></div>
        <div className="campo"><label>Senioridade</label><input value={senioridade} onChange={(e) => setSenioridade(e.target.value)} maxLength={40} /></div>
      </div>
      <div className="campo"><label>Tecnologias (separe por virgula)</label><input value={tecnologias} onChange={(e) => setTecnologias(e.target.value)} /></div>
      <div className="campo"><label>Requisitos obrigatorios (um por linha)</label><textarea value={obrigatorios} onChange={(e) => setObrigatorios(e.target.value)} /></div>
      <div className="campo"><label>Requisitos desejaveis (um por linha)</label><textarea value={desejaveis} onChange={(e) => setDesejaveis(e.target.value)} /></div>

      {aviso && <div className="aviso warn">{aviso}</div>}
      {erro && <div className="aviso erro" role="alert">{erro}</div>}
      <button className="btn pri bloco" onClick={salvar} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar vaga'}</button>
    </Folha>
  )
}
