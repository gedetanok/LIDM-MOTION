export function deriveVisualizationMeta(ex) {
  if (!ex) return null
  const text = `${ex.title || ''} ${ex.question_text || ''}`.toLowerCase()
  const numbers = (text.match(/\d+\.?\d*/g) || []).map((n) => Number(n)).filter((n) => Number.isFinite(n))

  const pick = (idx, fallback = 1) => (numbers[idx] && numbers[idx] > 0 ? numbers[idx] : fallback)

  const has = (k) => text.includes(k)
  // 3D
  if (has('kubus') || has('cube')) {
    return { dimension: '3D', shape: 'cube', params: { s: pick(0, 2) } }
  }
  if (has('balok') || has('rect prism') || has('rectangular prism') || has('prisma persegi panjang')) {
    return { dimension: '3D', shape: 'rect_prism', params: { l: pick(0, 3), w: pick(1, 2), h: pick(2, 2) } }
  }
  if (has('tabung') || has('cylinder')) {
    return { dimension: '3D', shape: 'cylinder', params: { r: pick(0, 2), h: pick(1, 4) } }
  }
  if (has('kerucut') || has('cone')) {
    return { dimension: '3D', shape: 'cone', params: { r: pick(0, 2), h: pick(1, 4) } }
  }
  if (has('bola') || has('sphere')) {
    return { dimension: '3D', shape: 'sphere', params: { r: pick(0, 2) } }
  }

  // 2D
  if (has('persegi panjang') || has('rectangle')) {
    return { dimension: '2D', shape: 'rectangle', params: { l: pick(0, 4), w: pick(1, 3) } }
  }
  if (has('segitiga') || has('triangle')) {
    return { dimension: '2D', shape: 'triangle', params: { base: pick(0, 4), h: pick(1, 3) } }
  }
  if (has('lingkaran') || has('circle')) {
    return { dimension: '2D', shape: 'circle', params: { r: pick(0, 3) } }
  }
  if (has('trapesium') || has('trapezoid')) {
    return { dimension: '2D', shape: 'trapezoid', params: { a: pick(0, 6), b: pick(1, 4), h: pick(2, 3) } }
  }

  return null
}