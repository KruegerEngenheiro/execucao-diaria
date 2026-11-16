// Folha de configuracoes: tema, rotina, backup e notificacoes.
import { useState } from 'react'
import type { Config as TConfig } from '../types'
import { Folha, ConfirmaAcao } from '../componentes/comuns'
import { Icon } from '../componentes/Icon'
import { salvarConfig } from '../db'
import { baixarBackup, restaurarBackup, prepararRestauracao, BackupInvalido, type Backup } from '../utils/exportar'
import { PerfilConfig } from './candidaturas/PerfilConfig'
import { EditorRotina } from './EditorRotina'
import { pedirPermissaoNotificacao, notificacoesSuportadas } from '../logica/notificacoes'
import { importarPlanoCarreira } from '../logica/planoCarreira'

export function Config({ config, onFechar }: { config: TConfig; onFechar: () => void }) {
  const [rotinaAberta, setRotinaAberta] = useState(false)
  const [tema, setTema] = useState(config.tema)
  const [msg, setMsg] = useState('')
  const [backupPendente, setBackupPendente] = useState<{ backup: Backup; tabelas: string[]; avisos: string[] } | null>(null)
  const [msgErro, setMsgErro] = useState(false)
  const dizer = (m: string, erro = false) => { setMsgErro(erro); setMsg(m) }

  async function trocarTema(t: TConfig['tema']) {
    setTema(t)
    await salvarConfig({ tema: t })
  }

  // Le e VALIDA o arquivo antes de pedir confirmacao. So depois do "sim" toca no banco.
  async function importar(ev: React.ChangeEvent<HTMLInputElement>) {
    const f = ev.target.files?.[0]
    ev.target.value = ''
    if (!f) return
    try {
      const backup = JSON.parse(await f.text()) as Backup
      const { tabelas, avisos } = await prepararRestauracao(backup)
      dizer('')
      setBackupPendente({ backup, tabelas, avisos })
    } catch (e) {
      dizer(e instanceof BackupInvalido ? e.message : 'Nao consegui ler esse arquivo de backup.', true)
    }
  }

  async function confirmarRestauracao() {
    if (!backupPendente) return
    try {
      const n = await restaurarBackup(backupPendente.backup)
      dizer(`Backup restaurado (${n.length} tabelas). Reabra o app pra ver tudo.`)
    } catch (e) {
      // Nunca mostra erro cru do banco: mensagem curta em portugues.
      dizer(e instanceof BackupInvalido ? e.message : 'Nao consegui restaurar o backup. Nada foi alterado.', true)
    }
    setBackupPendente(null)
  }

  async function importarPlano(ev: React.ChangeEvent<HTMLInputElement>) {
    const f = ev.target.files?.[0]
    if (!f) return
    try {
      const dados = JSON.parse(await f.text())
      const n = await importarPlanoCarreira(dados)
      dizer(`Plano de carreira importado: ${n} atividades. Fica so neste aparelho.`)
    } catch {
      dizer('Nao consegui ler esse arquivo de plano.', true)
    }
    ev.target.value = ''
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
      <div className="mut" style={{ fontSize: 12.5, marginTop: 8, lineHeight: 1.4 }}>
        Atencao: o arquivo leva seus dados pessoais (perfil e respostas de candidaturas). Guarde com cuidado e nao compartilhe.
      </div>
      <div style={{ height: 10 }} />
      <label className="btn bloco" style={{ cursor: 'pointer' }}>
        <Icon nome="volta" tam={18} /> Importar backup
        <input type="file" accept="application/json" onChange={importar} style={{ display: 'none' }} />
      </label>

      <div className="titulo-secao">Plano de carreira</div>
      <label className="btn bloco" style={{ cursor: 'pointer' }}>
        <Icon nome="volta" tam={18} /> Importar meu plano de carreira
        <input type="file" accept="application/json" onChange={importarPlano} style={{ display: 'none' }} />
      </label>
      <div className="mut" style={{ fontSize: 12.5, marginTop: 8, lineHeight: 1.4 }}>
        Sem importar, o app mostra um plano de exemplo. O seu plano real fica so neste aparelho, nunca no codigo publico.
      </div>

      <PerfilConfig onMsg={(m) => dizer(m)} />

      <div className="titulo-secao">Notificacoes</div>
      {notificacoesSuportadas() ? (
        <button className="btn bloco" onClick={async () => { const ok = await pedirPermissaoNotificacao(); dizer(ok ? 'Notificacoes liberadas.' : 'Notificacoes nao foram liberadas.') }}>
          <Icon nome="alerta" tam={18} /> Liberar notificacoes
        </button>
      ) : (
        <div className="mut" style={{ fontSize: 13 }}>
          No iPhone, as notificacoes so funcionam depois de instalar o app na tela inicial, e ainda assim com limites do iOS.
        </div>
      )}

      {msg && <div className={`aviso ${msgErro ? 'erro' : 'ok'} mt`} role={msgErro ? 'alert' : 'status'}>{msg}</div>}

      {backupPendente && (
        <ConfirmaAcao
          titulo="Restaurar backup" perigo rotuloConfirmar="Restaurar"
          texto={`Isso substitui o conteudo de ${backupPendente.tabelas.length} tabelas pelo do arquivo (${backupPendente.tabelas.join(', ')}). Tabelas que nao estao no arquivo ficam como estao.${backupPendente.avisos.length ? ` ATENCAO: ${backupPendente.avisos.join(' ')}` : ''} Continuar?`}
          onCancelar={() => setBackupPendente(null)}
          onConfirmar={confirmarRestauracao}
        />
      )}

      <div className="center mut" style={{ fontSize: 12, marginTop: 20 }}>Execucao Diaria · dados ficam so no seu aparelho</div>
    </Folha>
  )
}
