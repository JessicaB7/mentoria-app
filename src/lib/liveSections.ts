import type { Lesson } from '@/types/database'

function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

// A página "Aula ao vivo" é montada a partir de três aulas que o mentor edita no admin,
// reconhecidas pelo título: "Como funcionam os Hot Seats", "Gravações…" e "Calendário…".
export function findLiveSections(lessons: Lesson[]) {
  const find = (keyword: string) => lessons.find((l) => normalize(l.title).includes(keyword)) ?? null
  return {
    intro: find('como funciona'),
    recordings: find('grava'),
    calendar: find('calendario'),
  }
}

const MONTHS = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

export type NextLiveSession = { date: Date; label: string | null; time: string | null }

// Lê as datas do texto do calendário ("- Outubro: dia 7 e dia 21", "Evento presencial: 7 de dezembro, no Porto")
// e devolve a próxima a partir de hoje. O ano não está no texto: uma data muito no passado passa para o ano seguinte.
export function findNextLiveSession(text: string, now = new Date()): NextLiveSession | null {
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const halfYear = 183 * 24 * 60 * 60 * 1000
  const toDate = (day: number, month: number) => {
    const date = new Date(today.getFullYear(), month, day)
    if (today.getTime() - date.getTime() > halfYear) date.setFullYear(date.getFullYear() + 1)
    return date
  }

  const plain = normalize(text)
  const timeMatch = plain.match(/das\s+(\d{1,2}h\d{0,2})\s+as\s+(\d{1,2}h\d{0,2})/)
  const defaultTime = timeMatch ? `${timeMatch[1]} às ${timeMatch[2]}` : null

  const found: NextLiveSession[] = []
  for (const line of plain.split('\n')) {
    // "outubro: dia 7 e dia 21"
    const listMatch = line.match(/^[\s\-•*]*([a-z]+)\s*:\s*(.*)$/)
    const listMonth = listMatch ? MONTHS.indexOf(listMatch[1]) : -1
    if (listMatch && listMonth >= 0) {
      for (const d of listMatch[2].matchAll(/\b(\d{1,2})\b/g)) {
        found.push({ date: toDate(Number(d[1]), listMonth), label: null, time: defaultTime })
      }
      continue
    }
    // "evento presencial: 7 de dezembro, no porto"
    for (const m of line.matchAll(/\b(\d{1,2})\s+de\s+([a-z]+)/g)) {
      const month = MONTHS.indexOf(m[2])
      if (month < 0) continue
      const original = text.split('\n')[plain.split('\n').indexOf(line)] ?? ''
      const label = original.split(':')[0].replace(/[*\-•]/g, '').trim()
      found.push({ date: toDate(Number(m[1]), month), label: line.includes(':') ? label : null, time: null })
    }
  }

  return (
    found
      .filter((s) => s.date.getTime() >= today.getTime())
      .sort((a, b) => a.date.getTime() - b.date.getTime())[0] ?? null
  )
}
