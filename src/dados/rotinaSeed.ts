// Rotina real do Carlos, fechada no chat, usada como semente editavel do app.
// (A versao neutra/ficticia, para o build publico de portfolio, e reaplicada
// quando a gente retomar a parte de LinkedIn. Aqui fica a real.)
//
// Dias: 1=Seg 2=Ter 3=Qua 4=Qui 5=Sex 6=Sab 0=Dom
// Resumo: Quartel 08-17 com reunioes PIGZ 09h e 17:30; curso de IA no almoco;
// academia seg/ter/qua/sex a noite e sabado; quinta sem academia; ingles em
// horario fixo (segunda 20:30-21:30, demais dias 20:00-20:30, sabado 10h);
// noites de carreira (IA e Krueger); sono protegido 21:30-22:30.

import type { Rotina } from '../types'

type Base = Omit<Rotina, 'id' | 'ordem'>

// Blocos de manha e tarde, iguais de segunda a sexta (dias 1 a 5).
const MANHA_TARDE: Base[] = [
  { titulo: 'Acordar, higiene e cafe', categoria: 'Pessoal', janela: 'FIXO', inicio: '06:30', fim: '07:15', dias: [1, 2, 3, 4, 5], nota: 'Leitura leve de ingles no cafe', ativa: true },
  { titulo: 'Trajeto pro quartel', categoria: 'Deslocamento', janela: 'FIXO', inicio: '07:15', fim: '07:45', dias: [1, 2, 3, 4, 5], nota: 'Imersao de ingles no caminho', ativa: true },
  { titulo: 'Expediente no quartel', categoria: 'Quartel', janela: 'FLEXIVEL', inicio: '08:00', fim: '09:00', dias: [1, 2, 3, 4, 5], nota: 'Brechas pra LinkedIn e ingles', ativa: true },
  { titulo: 'Reuniao PIGZ da manha', categoria: 'PIGZ', janela: 'FIXO', inicio: '09:00', fim: '09:30', dias: [1, 2, 3, 4, 5], nota: 'Do escritorio, notebook', ativa: true },
  { titulo: 'Expediente no quartel', categoria: 'Quartel', janela: 'FLEXIVEL', inicio: '09:30', fim: '12:00', dias: [1, 2, 3, 4, 5], nota: 'PIGZ no celular e imersao de ingles', ativa: true },
  { titulo: 'Almoco e curso de IA', categoria: 'IA', janela: 'FOCO', inicio: '12:00', fim: '13:30', dias: [1, 2, 3, 4, 5], nota: 'Bloco de foco de estudo de IA', ativa: true },
  { titulo: 'Expediente no quartel', categoria: 'Quartel', janela: 'FLEXIVEL', inicio: '13:30', fim: '17:00', dias: [1, 2, 3, 4, 5], nota: 'PIGZ no celular, LinkedIn e ingles', ativa: true },
  { titulo: 'Volta pra casa', categoria: 'Deslocamento', janela: 'FIXO', inicio: '17:00', fim: '17:30', dias: [1, 2, 3, 4, 5], ativa: true },
  { titulo: 'Reuniao PIGZ de fechamento', categoria: 'PIGZ', janela: 'FIXO', inicio: '17:30', fim: '18:00', dias: [1, 2, 3, 4, 5], nota: 'Em casa, notebook', ativa: true },
]

// Academia a noite (seg, ter, qua, sex). Quinta sem academia.
const ACADEMIA_NOITE: Base[] = [
  { titulo: 'Trocar e ir pra academia', categoria: 'Saude', janela: 'FIXO', inicio: '18:00', fim: '18:15', dias: [1, 2, 3, 5], ativa: true },
  { titulo: 'Academia', categoria: 'Saude', janela: 'FOCO', inicio: '18:15', fim: '19:30', dias: [1, 2, 3, 5], ativa: true },
  { titulo: 'Banho e jantar', categoria: 'Pessoal', janela: 'FIXO', inicio: '19:30', fim: '20:00', dias: [1, 2, 3, 5], ativa: true },
]

const NOITE: Base[] = [
  // Segunda: respiro, depois a aula longa de ingles fecha o dia (sem projeto depois).
  { titulo: 'Respiro', categoria: 'Descanso', janela: 'LIVRE', inicio: '20:00', fim: '20:30', dias: [1], ativa: true },
  { titulo: 'Ingles, aula de conversacao', categoria: 'Ingles', janela: 'FOCO', inicio: '20:30', fim: '21:30', dias: [1], nota: 'A aula longa, ultima atividade do dia', ativa: true },

  // Terca: ingles curto + Krueger Labs
  { titulo: 'Ingles, aula de conversacao', categoria: 'Ingles', janela: 'FOCO', inicio: '20:00', fim: '20:30', dias: [2], ativa: true },
  { titulo: 'Krueger Labs', categoria: 'KRUEGER LABS', janela: 'FOCO', inicio: '20:30', fim: '21:30', dias: [2], ativa: true },

  // Quarta: ingles curto + projeto de IA
  { titulo: 'Ingles, aula de conversacao', categoria: 'Ingles', janela: 'FOCO', inicio: '20:00', fim: '20:30', dias: [3], ativa: true },
  { titulo: 'Projeto de IA', categoria: 'IA', janela: 'FOCO', inicio: '20:30', fim: '21:30', dias: [3], ativa: true },

  // Sexta: ingles curto + projeto de IA
  { titulo: 'Ingles, aula de conversacao', categoria: 'Ingles', janela: 'FOCO', inicio: '20:00', fim: '20:30', dias: [5], ativa: true },
  { titulo: 'Projeto de IA', categoria: 'IA', janela: 'FOCO', inicio: '20:30', fim: '21:30', dias: [5], ativa: true },

  // Quinta (sem academia): jantar e respiro, IA, ingles, Krueger
  { titulo: 'Jantar e respiro', categoria: 'Descanso', janela: 'FLEXIVEL', inicio: '18:00', fim: '19:00', dias: [4], nota: 'Folga de treino', ativa: true },
  { titulo: 'Projeto de IA', categoria: 'IA', janela: 'FOCO', inicio: '19:00', fim: '20:00', dias: [4], ativa: true },
  { titulo: 'Ingles, aula de conversacao', categoria: 'Ingles', janela: 'FOCO', inicio: '20:00', fim: '20:30', dias: [4], ativa: true },
  { titulo: 'Krueger Labs', categoria: 'KRUEGER LABS', janela: 'FOCO', inicio: '20:30', fim: '21:30', dias: [4], ativa: true },
]

// Dormir, bloqueado, dias uteis.
const DORMIR: Base[] = [
  { titulo: 'Desacelerar e dormir', categoria: 'Descanso', janela: 'BLOQUEADO', inicio: '21:30', fim: '22:30', dias: [1, 2, 3, 4, 5], nota: 'Sono protegido, nao agendar nada', ativa: true },
]

// Sabado.
const SABADO: Base[] = [
  { titulo: 'Ingles, aula de conversacao', categoria: 'Ingles', janela: 'FOCO', inicio: '10:00', fim: '11:00', dias: [6], ativa: true },
  { titulo: 'Academia', categoria: 'Saude', janela: 'FOCO', inicio: '11:00', fim: '12:30', dias: [6], nota: 'Quinto treino da semana', ativa: true },
  { titulo: 'Livre', categoria: 'Descanso', janela: 'LIVRE', inicio: '12:30', fim: '14:00', dias: [6], ativa: true },
  { titulo: 'Projeto de IA', categoria: 'IA', janela: 'FOCO', inicio: '14:00', fim: '16:00', dias: [6], ativa: true },
  { titulo: 'LinkedIn e GitHub', categoria: 'LinkedIn', janela: 'FOCO', inicio: '16:00', fim: '17:00', dias: [6], nota: 'Escrever os 2 posts da semana, 1 item do perfil, organizar repos', ativa: true },
]

// Domingo nao tem rotina fixa (dia livre). Fica em branco de proposito.

export const ROTINA_SEED: Base[] = [
  ...MANHA_TARDE,
  ...ACADEMIA_NOITE,
  ...NOITE,
  ...DORMIR,
  ...SABADO,
]
