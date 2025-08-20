// Supabase Edge Function: generate-exercises
// Deploy: supabase functions deploy generate-exercises
// Invoke: supabase.functions.invoke('generate-exercises', { body: { subject, difficulty } })

// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PROJECT_URL = Deno.env.get('PROJECT_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY')!
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!

const supabase = createClient(PROJECT_URL!, SERVICE_ROLE_KEY!)

const corsHeaders: HeadersInit = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response('ok', { status: 200, headers: corsHeaders })
    }

    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
    }

    const { subject = 'general math', difficulty = 'easy' } = await req.json()

    const prompt = `Generate exactly ONE math exercise about "${subject}".
Return ONLY strict JSON (no markdown, no text) with this exact shape:
{
  "title": string,
  "question_text": string,
  "answer": string,
  "difficulty": "easy" | "medium" | "hard"
}
Rules:
- Keep title short.
- question_text must be a clear problem statement.
- answer must be the correct answer as a string.
- difficulty must be one of: easy, medium, hard (prefer "${difficulty}").`

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
      console.log('OpenAI HTTP error:', raw)
      return new Response(JSON.stringify({ error: 'openai_http_error', detail: raw }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const aiJson = await aiRes.json()
    const content: string = aiJson?.choices?.[0]?.message?.content ?? '{}'
    console.log('AI raw content:', content)

    let parsed: any
    try {
      parsed = JSON.parse(content)
    } catch (err) {
      console.log('JSON.parse failed:', String(err))
      return new Response(JSON.stringify({ error: 'invalid_json_from_model', raw: content }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Handle unexpected wrappers gracefully
    if (Array.isArray(parsed?.questions)) parsed = parsed.questions[0]
    if (Array.isArray(parsed)) parsed = parsed[0]

    const row = {
      title: String(parsed?.title ?? 'Untitled'),
      question_text: String(parsed?.question_text ?? ''),
      answer: String(parsed?.answer ?? ''),
      difficulty: ['easy', 'medium', 'hard'].includes(String(parsed?.difficulty))
        ? String(parsed.difficulty)
        : String(difficulty),
    }

    console.log('Parsed object:', JSON.stringify(row))

    const { data: inserted, error } = await supabase
      .from('exercises')
      .insert(row)
      .select('id, title, question_text, answer, difficulty, created_at')
      .single()

    if (error) {
      console.log('DB insert error:', error.message)
      return new Response(JSON.stringify({ error: 'db_insert_error', detail: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    console.log('Insert result:', JSON.stringify(inserted))
    return new Response(JSON.stringify({ inserted }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    console.log('Unhandled server error:', String(e))
    return new Response(JSON.stringify({ error: 'server_error', detail: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})