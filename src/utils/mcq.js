export function isNumeric(value) {
  if (value == null) return false
  const n = Number(value)
  return Number.isFinite(n)
}

export function buildOptions(answer) {
  const correct = String(answer)
  const options = new Set()
  options.add(correct)

  if (isNumeric(correct)) {
    const base = Math.round(Number(correct))
    const deltas = [0.05, 0.1, 0.2]
    let i = 0
    while (options.size < 4 && i < 100) {
      const pct = deltas[i % deltas.length]
      const sign = i % 2 === 0 ? 1 : -1
      let distractor = Math.max(1, base + Math.round(base * pct * sign))
      if (distractor === base) distractor += 1
      options.add(String(distractor))
      i++
    }
  } else {
    const candidates = new Set()
    const lower = correct.toLowerCase()
    const upper = correct.toUpperCase()
    const capitalized = correct.charAt(0).toUpperCase() + correct.slice(1).toLowerCase()
    candidates.add(lower)
    candidates.add(upper)
    candidates.add(capitalized)
    const generic = ['None of the above', 'All of the above', 'Cannot be determined']
    generic.forEach((g) => candidates.add(g))
    for (const c of candidates) {
      if (options.size >= 4) break
      if (c !== correct) options.add(c)
    }
    let i = 1
    while (options.size < 4 && i <= 10) {
      const alt = `${correct} ${i}`
      if (!options.has(alt)) options.add(alt)
      i++
    }
  }

  const arr = Array.from(options).slice(0, 4)
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}