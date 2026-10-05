// "Módulo 1 — Posicionamento e Cliente Ideal" → { number: "01", name: "Posicionamento e Cliente Ideal" }
export function splitModuleTitle(title: string) {
  const match = title.match(/^Módulo\s+(\d+)\s*[—–-]\s*(.+)$/)
  if (!match) return { number: null, name: title }
  return { number: match[1].padStart(2, '0'), name: match[2] }
}

// Número da aula dentro do módulo: "1.1", "1.2"… (ou "01", "02"… se o módulo não tiver número).
export function lessonNumber(moduleTitle: string, index: number) {
  const { number } = splitModuleTitle(moduleTitle)
  return number ? `${Number(number)}.${index + 1}` : String(index + 1).padStart(2, '0')
}
