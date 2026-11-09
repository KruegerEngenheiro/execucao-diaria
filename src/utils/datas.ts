// Utilidades de data e hora. Datas como 'YYYY-MM-DD', horarios como 'HH:MM'.
// Tudo em horario local do aparelho.

const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
const DIAS_LONGOS = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado']
const MESES = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

export function hojeISO(d: Date = new Date()): string {
  const ano = d.getFullYear()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

export function dataParaDate(iso: string): Date {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(a, m - 1, d)
}

export function diaDaSemana(iso: string): number {
  return dataParaDate(iso).getDay()
}

export function nomeDiaLongo(iso: string): string {
  return DIAS_LONGOS[diaDaSemana(iso)]
}

export function nomeDiaCurto(dia: number): string {
  return DIAS_CURTOS[dia]
}

export function dataPorExtenso(iso: string): string {
  const d = dataParaDate(iso)
  return `${d.getDate()} de ${MESES[d.getMonth()]}`
}

export function dataCurta(iso: string): string {
  const d = dataParaDate(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

// 'HH:MM' para minutos desde a meia-noite.
export function hhmmParaMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export function minParaHhmm(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function agoraHhmm(d: Date = new Date()): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function agoraMin(d: Date = new Date()): number {
  return d.getHours() * 60 + d.getMinutes()
}

// Soma dias a uma data ISO.
export function somaDias(iso: string, dias: number): string {
  const d = dataParaDate(iso)
  d.setDate(d.getDate() + dias)
  return hojeISO(d)
}

// Segunda-feira da semana que contem a data.
export function inicioSemana(iso: string): string {
  const d = dataParaDate(iso)
  const dia = d.getDay()
  const diff = dia === 0 ? -6 : 1 - dia // semana comeca na segunda
  d.setDate(d.getDate() + diff)
  return hojeISO(d)
}

// Lista de 7 datas da semana que contem a data (segunda a domingo).
export function diasDaSemana(iso: string): string[] {
  const seg = inicioSemana(iso)
  return Array.from({ length: 7 }, (_, i) => somaDias(seg, i))
}

// Dias do mes da data, com os espacos vazios no inicio para alinhar o calendario (semana comeca domingo).
export function gradeDoMes(iso: string): (string | null)[] {
  const d = dataParaDate(iso)
  const primeiro = new Date(d.getFullYear(), d.getMonth(), 1)
  const ultimo = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  const grade: (string | null)[] = []
  for (let i = 0; i < primeiro.getDay(); i++) grade.push(null)
  for (let dia = 1; dia <= ultimo.getDate(); dia++) {
    grade.push(hojeISO(new Date(d.getFullYear(), d.getMonth(), dia)))
  }
  return grade
}

export function nomeMes(iso: string): string {
  const d = dataParaDate(iso)
  return `${MESES[d.getMonth()]} de ${d.getFullYear()}`
}
