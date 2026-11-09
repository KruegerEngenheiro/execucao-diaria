// Traz o Plano de carreira para o dia a dia: decide o que fazer HOJE em cada
// frente (postar, estudar, organizar o perfil). Funcao pura e testavel.
// O conteudo vem do planoSeed; o que esta feito vem do mapa de progresso.
import type { CursoPlano, ItemPerfil, PostPlano } from '../dados/planoSeed'

export interface AcoesCarreira {
  postHoje?: PostPlano
  proximoPost?: { post: PostPlano; emDias: number }
  cursoFoco?: CursoPlano
  proximoPerfil?: ItemPerfil
  planoEmDia: boolean
}

// A data do post no seed vem como 'Ter 03/11'. Converte pra ISO usando o ano de
// referencia (o ano de hoje). Limite conhecido: nao cobre virada de ano, o que e
// aceitavel para um calendario curto e fixo.
function postISO(dataStr: string, ano: number): string | null {
  const m = dataStr.match(/(\d{2})\/(\d{2})/)
  if (!m) return null
  return `${ano}-${m[2]}-${m[1]}`
}

function diffDias(aISO: string, bISO: string): number {
  const a = new Date(aISO + 'T00:00:00').getTime()
  const b = new Date(bISO + 'T00:00:00').getTime()
  return Math.round((b - a) / 86400000)
}

export function carreiraHoje(
  hoje: string,
  cursos: CursoPlano[],
  itensPerfil: ItemPerfil[],
  posts: PostPlano[],
  progresso: Map<string, string>,
): AcoesCarreira {
  const ano = Number(hoje.slice(0, 4))
  const publicado = (chave: string) => progresso.get(chave) === 'feito'

  const postHoje = posts.find((p) => postISO(p.data, ano) === hoje && !publicado(p.chave))

  const futuros = posts
    .map((p) => ({ p, iso: postISO(p.data, ano) }))
    .filter((x) => x.iso != null && x.iso > hoje && !publicado(x.p.chave))
    .sort((a, b) => (a.iso! < b.iso! ? -1 : 1))
  const proximoPost = futuros.length > 0
    ? { post: futuros[0].p, emDias: diffDias(hoje, futuros[0].iso!) }
    : undefined

  const cursoFoco = cursos.find((c) => progresso.get(c.chave) === 'fazendo')
    ?? cursos.find((c) => progresso.get(c.chave) !== 'feito')

  const proximoPerfil = itensPerfil.find((i) => progresso.get(i.chave) !== 'feito')

  const planoEmDia = !postHoje && !proximoPost && !cursoFoco && !proximoPerfil
  return { postHoje, proximoPost, cursoFoco, proximoPerfil, planoEmDia }
}
