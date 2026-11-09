// Casca do app: tab bar inferior, botao + global, tema e troca de telas.
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { getConfig } from './db'
import { useTema } from './hooks/useTema'
import { Icon } from './componentes/Icon'
import { Hoje } from './telas/Hoje'
import { Agenda } from './telas/Agenda'
import { Historico } from './telas/Historico'
import { Metas } from './telas/Metas'
import { Plano } from './telas/Plano'
import { Config } from './telas/Config'
import { FormTarefa } from './componentes/FormTarefa'
import { hojeISO } from './utils/datas'

type Aba = 'hoje' | 'agenda' | 'plano' | 'metas' | 'historico'

const ABAS: { id: Aba; icone: string; rotulo: string }[] = [
  { id: 'hoje', icone: 'hoje', rotulo: 'Hoje' },
  { id: 'agenda', icone: 'agenda', rotulo: 'Agenda' },
  { id: 'plano', icone: 'plano', rotulo: 'Plano' },
  { id: 'metas', icone: 'metas', rotulo: 'Metas' },
  { id: 'historico', icone: 'historico', rotulo: 'Historico' },
]

export default function App() {
  const [aba, setAba] = useState<Aba>('hoje')
  const [dataAgenda, setDataAgenda] = useState(hojeISO())
  const [novaTarefa, setNovaTarefa] = useState(false)
  const [config, setConfig] = useState(false)

  const cfg = useLiveQuery(() => getConfig(), [])
  useTema(cfg?.tema)

  const hoje = hojeISO()

  return (
    <div className="app">
      <div className="conteudo">
        {(aba === 'hoje' || aba === 'agenda' || aba === 'plano') && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: -8 }}>
            <button className="btn pequeno" onClick={() => setConfig(true)} aria-label="Configuracoes"><Icon nome="config" tam={18} /></button>
          </div>
        )}
        {aba === 'hoje' && <Hoje data={hoje} irParaPlano={() => setAba('plano')} />}
        {aba === 'agenda' && <Agenda data={dataAgenda} setData={setDataAgenda} />}
        {aba === 'plano' && <Plano />}
        {aba === 'metas' && <Metas />}
        {aba === 'historico' && <Historico data={hoje} />}
      </div>

      <button className="fab" onClick={() => setNovaTarefa(true)} aria-label="Nova tarefa"><Icon nome="mais" tam={28} /></button>

      <nav className="tabbar">
        {ABAS.map((a) => (
          <button key={a.id} className={aba === a.id ? 'at' : ''} onClick={() => setAba(a.id)}>
            <Icon nome={a.icone} tam={22} />
            <span>{a.rotulo}</span>
          </button>
        ))}
      </nav>

      {novaTarefa && (
        <FormTarefa data={aba === 'agenda' ? dataAgenda : hoje} onFechar={() => setNovaTarefa(false)} />
      )}
      {config && cfg && <Config config={cfg} onFechar={() => setConfig(false)} />}
    </div>
  )
}
