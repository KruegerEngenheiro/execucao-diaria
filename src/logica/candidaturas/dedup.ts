// Chave de duplicidade de vaga. Logica pura.
// Regra: plataforma + id externo quando existe; senao empresa + cargo
// normalizado + URL canonica. Serve para "vaga duplicada" e "ja candidatada".

export function normalizarTexto(s: string | undefined): string {
  return (s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const PARAMS_RASTREIO = /^(utm_|fbclid|gclid|mc_|ref$|refid$|trk|trackingid|source$|src$|campaign)/i

// Tira o que nao identifica a vaga: protocolo, www, rastreio, hash, barra final.
// Devolve '' se nao for uma URL valida.
export function urlCanonica(url: string | undefined): string {
  const bruto = (url ?? '').trim()
  if (!bruto) return ''
  let u: URL
  try {
    u = new URL(/^[a-z]+:\/\//i.test(bruto) ? bruto : `https://${bruto}`)
  } catch {
    return ''
  }
  const host = u.hostname.toLowerCase().replace(/^www\./, '')
  const caminho = u.pathname.replace(/\/+$/, '')
  const params = [...u.searchParams.entries()]
    .filter(([k]) => !PARAMS_RASTREIO.test(k))
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('&')
  return `${host}${caminho}${params ? `?${params}` : ''}`
}

export interface EntradaDedup {
  plataforma?: string
  idExterno?: string
  empresa: string
  cargo: string
  url?: string
}

export function chaveDedup(e: EntradaDedup): string {
  const plat = normalizarTexto(e.plataforma)
  const id = (e.idExterno ?? '').trim().toLowerCase()
  if (plat && plat !== 'manual' && id) return `ext:${plat}:${id}`
  return `ec:${normalizarTexto(e.empresa)}|${normalizarTexto(e.cargo)}|${urlCanonica(e.url)}`
}

// Chave "frouxa" (so empresa + cargo) para avisar de possivel duplicata quando a
// URL difere. Aviso, nao bloqueio.
export function chaveFrouxa(e: { empresa: string; cargo: string }): string {
  return `${normalizarTexto(e.empresa)}|${normalizarTexto(e.cargo)}`
}

export function possivelDuplicata<T extends { empresa: string; cargo: string }>(
  nova: { empresa: string; cargo: string },
  existentes: T[],
): T | undefined {
  const k = chaveFrouxa(nova)
  return existentes.find((v) => chaveFrouxa(v) === k)
}

// Link so e aceito (e so vira href na tela) se for http ou https. Bloqueia
// javascript:, data: e afins.
export function urlHttpValida(url: string | undefined): boolean {
  const u = (url ?? '').trim()
  if (!u) return false
  try {
    const p = new URL(u)
    return p.protocol === 'http:' || p.protocol === 'https:'
  } catch {
    return false
  }
}
