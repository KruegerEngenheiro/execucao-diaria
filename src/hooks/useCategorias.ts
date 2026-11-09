// Categorias ao vivo, com um mapa nome -> cor para pintar os itens.
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { Categoria } from '../types'

export function useCategorias(): { lista: Categoria[]; cor: (nome: string) => string } {
  const lista = useLiveQuery(() => db.categorias.orderBy('ordem').toArray(), [], [] as Categoria[])
  const mapa = new Map((lista ?? []).map((c) => [c.nome, c.cor]))
  const cor = (nome: string) => mapa.get(nome) ?? '#9ca3af'
  return { lista: lista ?? [], cor }
}
