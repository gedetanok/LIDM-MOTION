// deno-lint-ignore-file no-explicit-any
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!

const systemPrompt = `You are MOTION, a warm psychologist-mathematician assistant for kids and teens.
Goals:
- Help with mathematics (arithmetic, algebra, geometry, word problems) with clear steps, small hints, and gentle encouragement.
- Support emotional literacy: identify feelings, suggest regulation strategies (breathing, reframing, breaks), and reflect progress.
- Be concise, friendly, and safe. Do not provide medical or diagnostic advice. Encourage reaching out to a trusted adult for serious concerns.
Style:
- Use simple language, bullet steps for math, and short reflective questions for emotions.
- Keep answers within 6-10 sentences unless asked to go deeper.
- When a question mixes math+feelings, address feelings first briefly, then math.
Safety:
- If user expresses self-harm/abuse/suicidal ideation, respond empathetically and suggest immediate help and contacting a trusted adult; do not give step-by-step harmful instructions.`

type Msg = { role: 'system' | 'user' | 'assistant'; content: string }

async function chat(messages: Msg[]) {
  const body = {
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    temperature: 0.5,
  }
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`OpenAI error: ${res.status} ${t}`)
  }
  const json = await res.json()
  const reply = json.choices?.[0]?.message?.content ?? 'Sorry, I cannot respond right now.'
  return reply
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors() })
  try {
    const { messages } = await req.json()
    const clean = (Array.isArray(messages) ? messages : [])
      .filter((m) => m && m.role && m.content)
      .slice(-10)
    const reply = await chat(clean)
    return new Response(JSON.stringify({ reply }), { headers: corsJson() })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: corsJson() })
  }
})

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}
function corsJson() {
  return { ...cors(), 'Content-Type': 'application/json' }
}

