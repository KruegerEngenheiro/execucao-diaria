// Categorias de EXEMPLO para a demonstracao publica (portfolio).
// Dados reais ficam apenas no aparelho do usuario (IndexedDB), nunca no codigo.
import type { Categoria } from '../types'

export const CATEGORIAS_SEED: Omit<Categoria, 'id'>[] = [
  { nome: 'Trabalho', cor: '#64748b', icone: 'trabalho', ordem: 1, sistema: true },
  { nome: 'Reunioes', cor: '#0d9488', icone: 'reuniao', ordem: 2, sistema: true },
  { nome: 'Projetos', cor: '#3b82f6', icone: 'carreira', ordem: 3, sistema: true },
  { nome: 'Estudo', cor: '#8b5cf6', icone: 'estudo', ordem: 4, sistema: true },
  { nome: 'Idioma', cor: '#22c55e', icone: 'idioma', ordem: 5, sistema: true },
  { nome: 'Leitura', cor: '#a855f7', icone: 'estudo', ordem: 6, sistema: true },
  { nome: 'Carreira', cor: '#0ea5e9', icone: 'carreira', ordem: 7, sistema: true },
  { nome: 'Saude', cor: '#f97316', icone: 'saude', ordem: 8, sistema: true },
  { nome: 'Pessoal', cor: '#ec4899', icone: 'pessoal', ordem: 9, sistema: true },
  { nome: 'Deslocamento', cor: '#94a3b8', icone: 'deslocamento', ordem: 10, sistema: true },
  { nome: 'Descanso', cor: '#7c8aa0', icone: 'descanso', ordem: 11, sistema: true },
  { nome: 'Financeiro', cor: '#10b981', icone: 'dinheiro', ordem: 12, sistema: true },
  { nome: 'Outros', cor: '#9ca3af', icone: 'outros', ordem: 13, sistema: true },
]
