import { supabase } from '../lib/supabase'

// Calls Supabase Edge Function `generate-exercises` to create exercises via OpenAI and insert into DB
export async function generateExercises({ subject, difficulty, count = 1 }) {
  const { data, error } = await supabase.functions.invoke('generate-exercises', {
    body: { subject, difficulty, count },
  })
  if (error) throw error
  return data?.inserted ?? []
}

// Live (no DB): generate questions and return to client
export async function generateExercisesLive({ subject, difficulty, count = 10 }) {
  const { data, error } = await supabase.functions.invoke('generate-exercises-live', {
    body: { subject, difficulty, count },
  })
  if (error) throw error
  return data?.questions ?? []
}