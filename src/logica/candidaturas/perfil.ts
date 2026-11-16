// Validacao do JSON de perfil para candidaturas. Logica pura, sem banco.
//
// Formato esperado (ver docs/09-candidaturas-perfil-json.md):
// {
//   "perfil": [ { "chave": "nome", "valor": "...", "confirmado": true, "fonte": "..." } ],
//   "respostasBase": [ { "chave": "...", "rotulo": "...", "pergunta": "...",
//                        "textoPt": "...", "textoEn": "...", "confirmado": true } ],
//   "curriculos": [ { "chave": "EN-internacional", "versao": "...", "hash": "...", "arquivo": "...", "formato": "..." } ]
// }
//
// TRAVA 1 (honestidade): so `confirmado === true` (booleano de verdade) conta
// como confirmado. "true", "sim", 1 ou ausencia = pendente de confirmacao.
import type { CampoPerfil, ChaveCurriculo, RespostaBase, RespostaCandidatura } from '../../types'

export interface CurriculoImport {
  chave: ChaveCurriculo
  versao?: string
  hash?: string
  arquivo?: string
  formato?: string
}

export interface PerfilValidado {
  campos: CampoPerfil[]
  respostas: Omit<RespostaBase, 'id' | 'confirmadoEm'>[]
  curriculos: CurriculoImport[]
  erros: string[] // impedem a importacao
  avisos: string[] // informam (ex: itens pendentes de confirmacao)
}

const CHAVES_CURRICULO: ChaveCurriculo[] = ['EN-internacional', 'PT-brasil']

const txt = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')
const opc = (v: unknown): string | undefined => txt(v) || undefined

export function validarPerfilJson(dados: unknown): PerfilValidado {
  const out: PerfilValidado = { campos: [], respostas: [], curriculos: [], erros: [], avisos: [] }
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) {
    out.erros.push('O arquivo precisa ser um objeto JSON com "perfil", "respostasBase" e/ou "curriculos".')
    return out
  }
  const d = dados as Record<string, unknown>
  if (d.perfil === undefined && d.respostasBase === undefined && d.curriculos === undefined) {
    out.erros.push('Nada para importar: faltam "perfil", "respostasBase" e "curriculos".')
    return out
  }

  const vistas = new Set<string>()
  if (d.perfil !== undefined) {
    if (!Array.isArray(d.perfil)) out.erros.push('"perfil" precisa ser uma lista.')
    else d.perfil.forEach((c, i) => {
      const o = (c ?? {}) as Record<string, unknown>
      const chave = txt(o.chave)
      if (!chave) { out.erros.push(`perfil[${i}]: falta "chave".`); return }
      if (vistas.has(chave)) { out.erros.push(`perfil[${i}]: chave repetida "${chave}".`); return }
      vistas.add(chave)
      out.campos.push({
        chave, rotulo: opc(o.rotulo), valor: txt(o.valor),
        confirmado: o.confirmado === true && txt(o.valor) !== '', fonte: opc(o.fonte),
      })
    })
  }

  const chavesResp = new Set<string>()
  if (d.respostasBase !== undefined) {
    if (!Array.isArray(d.respostasBase)) out.erros.push('"respostasBase" precisa ser uma lista.')
    else d.respostasBase.forEach((r, i) => {
      const o = (r ?? {}) as Record<string, unknown>
      const chave = txt(o.chave)
      if (!chave) { out.erros.push(`respostasBase[${i}]: falta "chave".`); return }
      if (chavesResp.has(chave)) { out.erros.push(`respostasBase[${i}]: chave repetida "${chave}".`); return }
      chavesResp.add(chave)
      const textoPt = opc(o.textoPt)
      const textoEn = opc(o.textoEn)
      out.respostas.push({
        chave, rotulo: txt(o.rotulo) || chave, pergunta: opc(o.pergunta), textoPt, textoEn,
        confirmado: o.confirmado === true && !!(textoPt || textoEn), fonte: opc(o.fonte),
      })
    })
  }

  if (d.curriculos !== undefined) {
    if (!Array.isArray(d.curriculos)) out.erros.push('"curriculos" precisa ser uma lista.')
    else d.curriculos.forEach((c, i) => {
      const o = (c ?? {}) as Record<string, unknown>
      const chave = txt(o.chave) as ChaveCurriculo
      if (!CHAVES_CURRICULO.includes(chave)) {
        out.erros.push(`curriculos[${i}]: chave "${txt(o.chave)}" nao existe. So valem EN-internacional e PT-brasil.`)
        return
      }
      out.curriculos.push({ chave, versao: opc(o.versao), hash: opc(o.hash), arquivo: opc(o.arquivo), formato: opc(o.formato) })
    })
  }

  const pend = out.campos.filter((c) => !c.confirmado).length + out.respostas.filter((r) => !r.confirmado).length
  if (pend > 0) out.avisos.push(`${pend} item(ns) sem confirmado=true ficam pendentes de confirmacao e nunca entram em uma candidatura.`)
  return out
}

// Resposta pode virar texto de peca? So se confirmada e com texto no idioma pedido.
export function textoDaResposta(r: Pick<RespostaBase, 'confirmado' | 'textoPt' | 'textoEn'>, idioma: 'pt' | 'en'): string | undefined {
  if (r.confirmado !== true) return undefined
  const t = idioma === 'en' ? r.textoEn : r.textoPt
  return t && t.trim() ? t.trim() : undefined
}

export function campoUsavel(c: Pick<CampoPerfil, 'confirmado' | 'valor'>): boolean {
  return c.confirmado === true && c.valor.trim() !== ''
}

export type UsoResposta =
  | { tipo: 'ok'; resposta: RespostaCandidatura }
  | { tipo: 'pendente'; motivo: string }

// Decide se uma resposta da central de dados pode entrar numa candidatura.
// Nao confirmada, ou sem texto no idioma da vaga: PENDENTE, nunca texto.
export function usarBase(base: RespostaBase, idioma: 'pt' | 'en'): UsoResposta {
  if (base.confirmado !== true) return { tipo: 'pendente', motivo: 'Ainda nao foi confirmada.' }
  const texto = textoDaResposta(base, idioma)
  if (!texto) return { tipo: 'pendente', motivo: `Sem texto confirmado em ${idioma === 'pt' ? 'portugues' : 'ingles'}.` }
  return { tipo: 'ok', resposta: { pergunta: base.pergunta ?? base.rotulo, texto, origem: 'base', confirmado: true } }
}

export function idiomaDaVaga(idioma: string | undefined): 'pt' | 'en' {
  return (idioma ?? '').toLowerCase().startsWith('pt') ? 'pt' : 'en'
}
