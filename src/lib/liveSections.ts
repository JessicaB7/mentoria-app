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
