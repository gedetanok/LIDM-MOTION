import { supabase } from '../lib/supabase'

export const POINTS_PER_CORRECT = 10

export const MILESTONES = [
  { threshold: 10, name: 'Thinker Badge', description: 'Awarded for reaching 10 points', icon_url: '🏅', condition: 'Reach 10 points' },
  { threshold: 50, name: 'Focus Badge', description: 'Awarded for reaching 50 points', icon_url: '🎯', condition: 'Reach 50 points' },
  { threshold: 100, name: 'Achiever Badge', description: 'Awarded for reaching 100 points', icon_url: '🏆', condition: 'Reach 100 points' },
]

async function getBadgeIdByName(name) {
  const { data, error } = await supabase
    .from('badges')
    .select('id')
    .eq('name', name)
    .single()
  if (error) return null
  return data?.id ?? null
}

export async function applyGamification({ userId, isCorrect }) {
  if (!userId) return { points: null, unlocked: [] }

  const { data: userRow, error: userErr } = await supabase
    .from('users')
    .select('points')
    .eq('id', userId)
    .single()

  if (userErr) return { points: null, unlocked: [] }

  const currentPoints = userRow?.points ?? 0
  let newPoints = currentPoints

  if (isCorrect) {
    newPoints = currentPoints + POINTS_PER_CORRECT
    await supabase
      .from('users')
      .update({ points: newPoints })
      .eq('id', userId)
  }

  const toUnlock = MILESTONES.filter(m => currentPoints < m.threshold && newPoints >= m.threshold)

  const unlocked = []
  for (const m of toUnlock) {
    const badgeId = await getBadgeIdByName(m.name)
    if (!badgeId) continue
    const { error } = await supabase
      .from('user_badges')
      .insert({ user_id: userId, badge_id: badgeId })
    if (!error) unlocked.push(m.name)
  }

  return { points: newPoints, unlocked }
}