export function shuffleWords(words: string[]): string[] {
  const shuffled = [...words]
  // Fisher-Yates shuffle, ensuring result differs from original
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  // If shuffle produced the same order, swap the first two
  if (shuffled.length > 1 && shuffled.every((w, i) => w === words[i])) {
    ;[shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]]
  }
  return shuffled
}

export function checkWordOrder(placed: string[], correct: string[]): boolean {
  if (placed.length !== correct.length) return false
  return placed.every((word, i) => word === correct[i])
}
