// Pede ao navegador que nao descarte o IndexedDB por falta de espaco.
// No iOS o efeito em PWA instalado nao esta garantido: por isso o backup continua
// sendo a protecao real. Falha em silencio (nunca derruba o app).
export async function pedirArmazenamentoPersistente(): Promise<boolean> {
  try {
    const s = typeof navigator !== 'undefined' ? navigator.storage : undefined
    if (!s || typeof s.persist !== 'function') return false
    if (typeof s.persisted === 'function' && (await s.persisted())) return true
    return await s.persist()
  } catch {
    return false
  }
}
