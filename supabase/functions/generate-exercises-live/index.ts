// Supabase Edge Function: generate-exercises-live
// Deploy: supabase functions deploy generate-exercises-live
// Invoke from client: supabase.functions.invoke('generate-exercises-live', { body: { subject, difficulty, count } })

// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!

const corsHeaders: HeadersInit = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { status: 200, headers: corsHeaders })
    }

    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
    }

    const { subject = 'geometry', difficulty = 'easy', count = 10 } = await req.json()

    const prompt = `Generate exactly ${count} math exercises about "${subject}".
Return ONLY strict JSON (no markdown) with this shape:
{
  "questions": [
    {
      "title": string,
      "question_text": string,
      "answer": string,
      "difficulty": "easy" | "medium" | "hard",
      "diagram": {
        "width": 320,
        "height": 200,
        "shapes": [
          { "type": "line", "x1": number, "y1": number, "x2": number, "y2": number },
          { "type": "circle", "cx": number, "cy": number, "r": number },
          { "type": "polygon", "points": [ [number, number], ... ] },
          { "type": "label", "x": number, "y": number, "text": string }
        ]
      } | null
    }
  ]
}
Rules:
- If subject relates to geometry, include a helpful 2D diagram (use shapes above) to aid visualization; otherwise set diagram to null.
- Use a 0..320 (x) by 0..200 (y) coordinate space for shapes.
- Keep titles short and statements clear.
- Make answers strings.`

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Return ONLY strict JSON. No markdown or commentary.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.4,
      }),
    })

    if (!aiRes.ok) {
      const raw = await aiRes.text()
      console.log('OpenAI HTTP error (live):', raw)
      return new Response(JSON.stringify({ error: 'openai_http_error', detail: raw }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const aiJson = await aiRes.json()
    const content: string = aiJson?.choices?.[0]?.message?.content ?? '{}'
    console.log('AI live raw content:', content)

    let parsed: any
    try {
      parsed = JSON.parse(content)
    } catch (err) {
      console.log('JSON.parse failed (live):', String(err))
      return new Response(JSON.stringify({ error: 'invalid_json_from_model', raw: content }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const items: any[] = Array.isArray(parsed?.questions)
      ? parsed.questions
      : (Array.isArray(parsed) ? parsed : [parsed])

    // Normalize
    const normalized = items.slice(0, count).map((q) => ({
      title: String(q?.title ?? 'Untitled'),
      question_text: String(q?.question_text ?? ''),
      answer: String(q?.answer ?? ''),
      difficulty: ['easy', 'medium', 'hard'].includes(String(q?.difficulty)) ? String(q?.difficulty) : String(difficulty),
      diagram: q?.diagram && typeof q.diagram === 'object' ? q.diagram : null,
    }))

    return new Response(JSON.stringify({ questions: normalized }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    console.log('Unhandled server error (live):', String(e))
    return new Response(JSON.stringify({ error: 'server_error', detail: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})