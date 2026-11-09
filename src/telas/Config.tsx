// Folha de configuracoes: tema, rotina, backup e notificacoes.
import { useState } from 'react'
import type { Config as TConfig } from '../types'
import { Folha } from '../componentes/comuns'
import { Icon } from '../componentes/Icon'
import { salvarConfig } from '../db'
import { baixarBackup, restaurarBackup, type Backup } from '../utils/exportar'
import { EditorRotina } from './EditorRotina'
import { pedirPermissaoNotificacao, notificacoesSuportadas } from '../logica/notificacoes'

export function Config({ config, onFechar }: { config: TConfig; onFechar: () => void }) {
  const [rotinaAberta, setRotinaAberta] = useState(false)
  const [tema, setTema] = useState(config.tema)
  const [msg, setMsg] = useState('')

  async function trocarTema(t: TConfig['tema']) {
    setTema(t)
    await salvarConfig({ tema: t })
  }

  async function importar(ev: React.ChangeEvent<HTMLInputElement>) {
    const f = ev.target.files?.[0]
    if (!f) return
    try {
      const texto = await f.text()
      const backup = JSON.parse(texto) as Backup
      if (!confirm('Isso substitui todos os dados atuais pelo backup. Continuar?')) return
      await restaurarBackup(backup)
      setMsg('Backup restaurado. Reabra o app pra ver tudo.')
    } catch {
      setMsg('Nao consegui ler esse arquivo de backup.')
    }
  }

  if (rotinaAberta) return <EditorRotina onFechar={() => setRotinaAberta(false)} />

  return (
    <Folha titulo="Configuracoes" onFechar={onFechar}>
      <div className="titulo-secao" style={{ marginTop: 4 }}>Tema</div>
      <div className="seg">
        <button className={tema === 'claro' ? 'on' : ''} onClick={() => trocarTema('claro')}><Icon nome="sol" tam={16} /> Claro</button>
        <button className={tema === 'escuro' ? 'on' : ''} onClick={() => trocarTema('escuro')}><Icon nome="lua" tam={16} /> Escuro</button>
        <button className={tema === 'sistema' ? 'on' : ''} onClick={() => trocarTema('sistema')}>Sistema</button>
      </div>

      <div className="titulo-secao">Rotina</div>
      <button className="btn bloco" onClick={() => setRotinaAberta(true)}><Icon nome="rotina" tam={18} /> Editar minha rotina</button>

      <div className="titulo-secao">Backup</div>
      <button className="btn bloco" onClick={() => baixarBackup()}><Icon nome="ganho" tam={18} /> Exportar meus dados (JSON)</button>
      <div style={{ height: 10 }} />
      <label className="btn bloco" style={{ cursor: 'pointer' }}>
        <Icon nome="volta" tam={18} /> Importar backup
        <input type="file" accept="application/json" onChange={importar} style={{ display: 'none' }} />
      </label>

      <div className="titulo-secao">Notificacoes</div>
      {notificacoesSuportadas() ? (
        <button className="btn bloco" onClick={async () => { const ok = await pedirPermissaoNotificacao(); setMsg(ok ? 'Notificacoes liberadas.' : 'Notificacoes nao foram liberadas.') }}>
          <Icon nome="alerta" tam={18} /> Liberar notificacoes
        </button>
      ) : (
        <div className="mut" style={{ fontSize: 13 }}>
          No iPhone, as notificacoes so funcionam depois de instalar o app na tela inicial, e ainda assim com limites do iOS.
        </div>
      )}

      {msg && <div className="aviso ok mt">{msg}</div>}

      <div className="center mut" style={{ fontSize: 12, marginTop: 20 }}>Execucao Diaria · dados ficam so no seu aparelho</div>
    </Folha>
  )
}
