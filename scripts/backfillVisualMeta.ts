import { createClient } from '@supabase/supabase-js'

type VisualMeta = { dimension: '2D' | '3D'; shape: string; params: Record<string, number> }

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

function derive(ex: { title: string; question_text: string }): VisualMeta | null {
  const t = `${ex.title} ${ex.question_text}`.toLowerCase()
  const nums = (t.match(/\d+/g) || []).map((n) => parseInt(n, 10))
  const pick = (k: string) => t.includes(k)
  const num = (i: number, def: number) => (Number.isFinite(nums[i]) ? nums[i] : def)

  if (pick('kubus')) return { dimension: '3D', shape: 'cube', params: { s: num(0, 10) } }
  if (pick('balok')) return { dimension: '3D', shape: 'rect_prism', params: { l: num(0, 10), w: num(1, 8), h: num(2, 6) } }
  if (pick('tabung')) return { dimension: '3D', shape: 'cylinder', params: { r: num(0, 7), h: num(1, 10) } }
  if (pick('kerucut')) return { dimension: '3D', shape: 'cone', params: { r: num(0, 7), h: num(1, 10) } }
  if (pick('bola')) return { dimension: '3D', shape: 'sphere', params: { r: num(0, 7) } }

  if (pick('persegi panjang')) return { dimension: '2D', shape: 'rectangle', params: { l: num(0, 10), w: num(1, 8) } }
  if (pick('segitiga')) return { dimension: '2D', shape: 'triangle', params: { base: num(0, 10), h: num(1, 8) } }
  if (pick('lingkaran')) return { dimension: '2D', shape: 'circle', params: { r: num(0, 7) } }
  if (pick('trapes')) return { dimension: '2D', shape: 'trapezoid', params: { a: num(0, 10), b: num(1, 8), h: num(2, 6) } }

  return null
}

async function main() {
  let from = 0
  const page = 1000
  for (;;) {
    const { data, error } = await supabase
      .from('exercises')
      .select('id,title,question_text')
      .range(from, from + page - 1)
    if (error) throw error
    if (!data || data.length === 0) break

    const updates = data
      .map((ex) => ({ id: ex.id, visual_meta: derive(ex) }))
      .filter((x) => x.visual_meta !== null)

    if (updates.length) {
      const { error: upErr } = await supabase.from('exercises').upsert(updates, { onConflict: 'id' })
      if (upErr) throw upErr
    }

    from += page
  }
  console.log('✅ Backfill visual_meta done')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})