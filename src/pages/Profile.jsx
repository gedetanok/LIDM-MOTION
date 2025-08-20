import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import Card from '../components/Card'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState({ username: null, points: 0 })
  const [badges, setBadges] = useState([])

  useEffect(() => {
    let active = true
    async function load() {
      if (!user) return
      const [{ data: u }, { data: ub }] = await Promise.all([
        supabase.from('users').select('username, points').eq('id', user.id).single(),
        supabase
          .from('user_badges')
          .select('badges (id, name, description, icon_url)')
          .eq('user_id', user.id),
      ])
      if (!active) return
      if (u?.data) setProfile({ username: u.data.username, points: u.data.points ?? 0 })
      const list = (ub?.data ?? [])
        .map(r => r.badges)
        .filter(Boolean)
      setBadges(list)
    }
    load()
    return () => { active = false }
  }, [user])

  const displayName = profile.username || user?.email || 'Learner'

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">Profile</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card title="User">
            <div className="text-gray-800 font-medium">{displayName}</div>
            <div className="text-sm text-gray-500">{user?.email}</div>
          </Card>
          <Card title="Points">
            <div className="text-3xl font-bold text-indigo-600">{profile.points}</div>
            <p className="text-sm text-gray-500 mt-1">+10 per correct answer</p>
          </Card>
          <Card title="Badges earned">
            <div className="text-3xl font-bold text-gray-800">{badges.length}</div>
            <p className="text-sm text-gray-500 mt-1">Keep going to unlock more</p>
          </Card>
        </div>

        <div className="mt-8">
          <Card title="Your badges">
            {badges.length === 0 ? (
              <div className="text-gray-500">No badges yet.</div>
            ) : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {badges.map((b) => (
                  <li key={b.id} className="flex items-center gap-3 border border-gray-200 rounded-xl p-3">
                    <div className="h-10 w-10 grid place-items-center text-xl">{b.icon_url || '🏅'}</div>
                    <div>
                      <div className="font-medium text-gray-800">{b.name}</div>
                      <div className="text-sm text-gray-500">{b.description}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}