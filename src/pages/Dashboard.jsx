import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Container from '../components/layout/Container'
import Card from '../components/Card'
import ChatBot from '../components/chat/ChatBot'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from 'recharts'

const EMOTIONS = ['happy', 'anxious', 'neutral', 'frustrated', 'excited']

export default function Dashboard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState({ username: null, points: 0 })
  const [accuracySeries, setAccuracySeries] = useState([])
  const [emotionBars, setEmotionBars] = useState([])
  const [badges, setBadges] = useState([])

  useEffect(() => {
    let active = true
    async function loadProfile() {
      if (!user) return
      const { data, error } = await supabase
        .from('users')
        .select('username, points')
        .eq('id', user.id)
        .single()
      if (!active) return
      if (!error && data) setProfile({ username: data.username, points: data.points ?? 0 })
    }
    loadProfile()
    return () => { active = false }
  }, [user])

  // Load user's earned badges
  useEffect(() => {
    let active = true
    async function loadBadges() {
      if (!user) return
      const { data, error } = await supabase
        .from('user_badges')
        .select('badges (id, name, description, icon_url)')
        .eq('user_id', user.id)
      if (!active) return
      if (error || !Array.isArray(data)) return setBadges([])
      const list = data.map(r => r.badges).filter(Boolean)
      setBadges(list)
    }
    loadBadges()
    return () => { active = false }
  }, [user])

  useEffect(() => {
    let active = true
    async function loadAccuracy() {
      if (!user) return
      const { data, error } = await supabase
        .from('exercise_results')
        .select('is_correct, timestamp')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: true })
      if (!active) return
      if (error || !Array.isArray(data)) return setAccuracySeries([])
      const byDay = new Map()
      for (const r of data) {
        const day = new Date(r.timestamp).toISOString().slice(0, 10)
        if (!byDay.has(day)) byDay.set(day, { correct: 0, total: 0 })
        const agg = byDay.get(day)
        agg.total += 1
        if (r.is_correct) agg.correct += 1
      }
      const series = Array.from(byDay.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([day, agg]) => ({ day, accuracy: Math.round((agg.correct / agg.total) * 100) }))
      setAccuracySeries(series)
    }

    async function loadEmotions() {
      if (!user) return
      const { data, error } = await supabase
        .from('emotions')
        .select('emotion_before, emotion_after')
        .eq('user_id', user.id)
      if (!active) return
      if (error || !Array.isArray(data)) return setEmotionBars([])

      const countsBefore = Object.fromEntries(EMOTIONS.map(e => [e, 0]))
      const countsAfter = Object.fromEntries(EMOTIONS.map(e => [e, 0]))
      let totalBefore = 0
      let totalAfter = 0
      for (const row of data) {
        if (row.emotion_before && countsBefore[row.emotion_before] != null) {
          countsBefore[row.emotion_before] += 1
          totalBefore += 1
        }
        if (row.emotion_after && countsAfter[row.emotion_after] != null) {
          countsAfter[row.emotion_after] += 1
          totalAfter += 1
        }
      }
      const bars = EMOTIONS.map(emotion => ({
        emotion,
        Before: totalBefore ? Math.round((countsBefore[emotion] / totalBefore) * 100) : 0,
        After: totalAfter ? Math.round((countsAfter[emotion] / totalAfter) * 100) : 0,
      }))
      setEmotionBars(bars)
    }

    loadAccuracy()
    loadEmotions()
    return () => { active = false }
  }, [user])

  const displayName = profile.username || user?.email || 'Learner'

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="py-8">
        <Container>
        {/* Hero */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="px-5 py-6 md:px-8 md:py-7 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-indigo-50 to-white">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-slate-800">Selamat datang kembali, {displayName} 👋</h1>
              <p className="text-slate-600 mt-1">Tetap konsisten. Perjalanan matematika + emosimu ada di sini.</p>
            </div>
            <div className="flex gap-3">
              <Link to="/exercises" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-700">Mulai Latihan</Link>
              <Link to="/profile" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-800 hover:bg-slate-50">Lihat Profil</Link>
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
            <div className="text-sm text-slate-500">Poin</div>
            <div className="mt-1 text-3xl font-bold text-indigo-600">{profile.points}</div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, (profile.points % 100))}%` }} />
            </div>
            <div className="mt-1 text-xs text-slate-500">Progres ke lencana berikutnya</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
            <div className="text-sm text-slate-500">Lencana</div>
            <div className="mt-1 text-3xl font-bold text-slate-800">{badges.length}</div>
            {badges.length === 0 ? (
              <div className="mt-1 text-xs text-slate-500">Buka lencana seiring progresmu</div>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {badges.slice(0, 6).map(b => (
                  <span key={b.id} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-lg">
                    {b.icon_url || '🏅'}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
            <div className="text-sm text-slate-500">Tips</div>
            <div className="mt-2 text-slate-700">Latih konsisten dan refleksikan emosi untuk meningkatkan fokus.</div>
          </div>
        </div>

        {/* Charts */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="Akurasi dari waktu ke waktu">
            <div className="h-64 sm:h-72 lg:h-80 w-full">
              {accuracySeries.length === 0 ? (
                <div className="h-full grid place-items-center text-slate-400 text-sm">Belum ada hasil</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={accuracySeries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Line type="monotone" dataKey="accuracy" stroke="#6366F1" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          <Card title="Tren emosi (persentase per emosi)">
            <div className="h-64 sm:h-72 lg:h-80 w-full">
              {emotionBars.length === 0 ? (
                <div className="h-full grid place-items-center text-slate-400 text-sm">Belum ada catatan emosi</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={emotionBars} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="emotion" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Legend />
                    <Bar dataKey="Before" name="Sebelum" fill="#60A5FA" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="After" name="Sesudah" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>
        {/* MOTION ChatBot */}
        <div className="mt-8">
          <ChatBot />
        </div>
        </Container>
      </main>
    </div>
  )
}