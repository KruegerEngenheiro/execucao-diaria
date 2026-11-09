// Notificacoes locais. No iOS, so funcionam com o app instalado na tela inicial
// (iOS 16.4+) e com limites. A arquitetura ja fica pronta; o agendamento real
// por horario depende de evolucao futura (push ou service worker com periodic sync).
export function notificacoesSuportadas(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export async function pedirPermissaoNotificacao(): Promise<boolean> {
  if (!notificacoesSuportadas()) return false
  try {
    const p = await Notification.requestPermission()
    return p === 'granted'
  } catch {
    return false
  }
}

export function notificar(titulo: string, corpo?: string): void {
  if (!notificacoesSuportadas()) return
  if (Notification.permission !== 'granted') return
  try {
    new Notification(titulo, { body: corpo })
  } catch {
    // silencioso
  }
}
