// Rotina de EXEMPLO para a demonstracao publica (portfolio).
// E so uma semana generica de um profissional, para mostrar o app funcionando.
// A rotina real do usuario fica apenas no aparelho (IndexedDB), nunca no codigo.
//
// Dias: 1=Seg 2=Ter 3=Qua 4=Qui 5=Sex 6=Sab 0=Dom
// Janelas: FIXO, FLEXIVEL, FOCO, LIVRE, BLOQUEADO

import type { Rotina } from '../types'

type Base = Omit<Rotina, 'id' | 'ordem'>

// Blocos de manha e tarde, de segunda a sexta (dias 1 a 5).
const MANHA_TARDE: Base[] = [
  { titulo: 'Acordar, higiene e cafe', categoria: 'Pessoal', janela: 'FIXO', inicio: '06:30', fim: '07:15', dias: [1, 2, 3, 4, 5], ativa: true },
  { titulo: 'Deslocamento', categoria: 'Deslocamento', janela: 'FIXO', inicio: '07:15', fim: '07:45', dias: [1, 2, 3, 4, 5], nota: 'Ouvir um podcast no caminho', ativa: true },
  { titulo: 'Trabalho', categoria: 'Trabalho', janela: 'FLEXIVEL', inicio: '08:00', fim: '09:00', dias: [1, 2, 3, 4, 5], ativa: true },
  { titulo: 'Reuniao da manha', categoria: 'Reunioes', janela: 'FIXO', inicio: '09:00', fim: '09:30', dias: [1, 2, 3, 4, 5], ativa: true },
  { titulo: 'Trabalho', categoria: 'Trabalho', janela: 'FLEXIVEL', inicio: '09:30', fim: '12:00', dias: [1, 2, 3, 4, 5], ativa: true },
  { titulo: 'Almoco e estudo', categoria: 'Estudo', janela: 'FOCO', inicio: '12:00', fim: '13:30', dias: [1, 2, 3, 4, 5], nota: 'Bloco de foco de estudo', ativa: true },
  { titulo: 'Trabalho', categoria: 'Trabalho', janela: 'FLEXIVEL', inicio: '13:30', fim: '17:00', dias: [1, 2, 3, 4, 5], ativa: true },
  { titulo: 'Volta pra casa', categoria: 'Deslocamento', janela: 'FIXO', inicio: '17:00', fim: '17:30', dias: [1, 2, 3, 4, 5], ativa: true },
]

// Exercicio a noite (seg, ter, qua, sex). Quinta sem treino.
const EXERCICIO_NOITE: Base[] = [
  { titulo: 'Ir para a academia', categoria: 'Saude', janela: 'FIXO', inicio: '18:00', fim: '18:15', dias: [1, 2, 3, 5], ativa: true },
  { titulo: 'Exercicio', categoria: 'Saude', janela: 'FOCO', inicio: '18:15', fim: '19:30', dias: [1, 2, 3, 5], ativa: true },
  { titulo: 'Banho e jantar', categoria: 'Pessoal', janela: 'FIXO', inicio: '19:30', fim: '20:00', dias: [1, 2, 3, 5], ativa: true },
]

const NOITE: Base[] = [
  // Segunda: respiro e uma aula longa de idioma fecha o dia.
  { titulo: 'Respiro', categoria: 'Descanso', janela: 'LIVRE', inicio: '20:00', fim: '20:30', dias: [1], ativa: true },
  { titulo: 'Aula de idioma', categoria: 'Idioma', janela: 'FOCO', inicio: '20:30', fim: '21:30', dias: [1], nota: 'Ultima atividade do dia', ativa: true },

  // Terca: idioma curto + projeto pessoal.
  { titulo: 'Aula de idioma', categoria: 'Idioma', janela: 'FOCO', inicio: '20:00', fim: '20:30', dias: [2], ativa: true },
  { titulo: 'Projeto pessoal', categoria: 'Projetos', janela: 'FOCO', inicio: '20:30', fim: '21:30', dias: [2], ativa: true },

  // Quarta: idioma curto + estudo.
  { titulo: 'Aula de idioma', categoria: 'Idioma', janela: 'FOCO', inicio: '20:00', fim: '20:30', dias: [3], ativa: true },
  { titulo: 'Estudo', categoria: 'Estudo', janela: 'FOCO', inicio: '20:30', fim: '21:30', dias: [3], ativa: true },

  // Sexta: idioma curto + projeto pessoal.
  { titulo: 'Aula de idioma', categoria: 'Idioma', janela: 'FOCO', inicio: '20:00', fim: '20:30', dias: [5], ativa: true },
  { titulo: 'Projeto pessoal', categoria: 'Projetos', janela: 'FOCO', inicio: '20:30', fim: '21:30', dias: [5], ativa: true },

  // Quinta (sem treino): jantar, estudo, idioma, projeto.
  { titulo: 'Jantar e respiro', categoria: 'Descanso', janela: 'FLEXIVEL', inicio: '18:00', fim: '19:00', dias: [4], ativa: true },
  { titulo: 'Estudo', categoria: 'Estudo', janela: 'FOCO', inicio: '19:00', fim: '20:00', dias: [4], ativa: true },
  { titulo: 'Aula de idioma', categoria: 'Idioma', janela: 'FOCO', inicio: '20:00', fim: '20:30', dias: [4], ativa: true },
  { titulo: 'Projeto pessoal', categoria: 'Projetos', janela: 'FOCO', inicio: '20:30', fim: '21:30', dias: [4], ativa: true },
]

// Dormir, bloqueado, dias uteis.
const DORMIR: Base[] = [
  { titulo: 'Desacelerar e dormir', categoria: 'Descanso', janela: 'BLOQUEADO', inicio: '21:30', fim: '22:30', dias: [1, 2, 3, 4, 5], nota: 'Sono protegido, nao agendar nada', ativa: true },
]

// Sabado.
const SABADO: Base[] = [
  { titulo: 'Aula de idioma', categoria: 'Idioma', janela: 'FOCO', inicio: '10:00', fim: '11:00', dias: [6], ativa: true },
  { titulo: 'Exercicio', categoria: 'Saude', janela: 'FOCO', inicio: '11:00', fim: '12:30', dias: [6], ativa: true },
  { titulo: 'Livre', categoria: 'Descanso', janela: 'LIVRE', inicio: '12:30', fim: '14:00', dias: [6], ativa: true },
  { titulo: 'Projeto pessoal', categoria: 'Projetos', janela: 'FOCO', inicio: '14:00', fim: '16:00', dias: [6], ativa: true },
  { titulo: 'Organizar a semana', categoria: 'Carreira', janela: 'FOCO', inicio: '16:00', fim: '17:00', dias: [6], ativa: true },
]

// Domingo fica livre de proposito.

export const ROTINA_SEED: Base[] = [
  ...MANHA_TARDE,
  ...EXERCICIO_NOITE,
  ...NOITE,
  ...DORMIR,
  ...SABADO,
]
