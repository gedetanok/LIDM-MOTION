import { useEffect, useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import Card from '../components/Card'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState({ username: null, points: 0 })
  const [badges, setBadges] = useState([])
  const [avatarUrl, setAvatarUrl] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  const [pw1, setPw1] = useState('')
  const [pw2, setPw2] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState('')

  const [recent, setRecent] = useState([]) // { id, title, is_correct, timestamp }
  const [totalBadges, setTotalBadges] = useState(0)

  useEffect(() => {
    let active = true
    async function load() {
      if (!user) return
      const [{ data: u }, { data: ub }, { data: allBadges }] = await Promise.all([
        supabase.from('users').select('username, points, avatar_url').eq('id', user.id).single(),
        supabase
          .from('user_badges')
          .select('badges (id, name, description, icon_url)')
          .eq('user_id', user.id),
        supabase.from('badges').select('id'),
      ])
      if (!active) return
      if (u) {
        setProfile({ username: u.username, points: u.points ?? 0 })
        setAvatarUrl(u.avatar_url || '')
        setNameInput(u.username || '')
      }
      const list = (ub ?? [])
        .map(r => r.badges)
        .filter(Boolean)
      setBadges(list)
      setTotalBadges(Array.isArray(allBadges) ? allBadges.length : 0)
    }
    load()
    return () => { active = false }
  }, [user])

  // Recent activity (last 5 answered questions)
  useEffect(() => {
    let active = true
    async function loadRecent() {
      if (!user) return
      const { data: rows, error } = await supabase
        .from('exercise_results')
        .select('exercise_id,is_correct,timestamp')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(5)
      if (!active) return
      if (error || !Array.isArray(rows) || rows.length === 0) { setRecent([]); return }
      const ids = Array.from(new Set(rows.map(r => r.exercise_id)))
      const { data: ex } = await supabase
        .from('exercises')
        .select('id,title')
        .in('id', ids)
      const idToTitle = new Map((ex || []).map(e => [e.id, e.title]))
      const combined = rows.map(r => ({
        id: `${r.exercise_id}-${r.timestamp}`,
        title: idToTitle.get(r.exercise_id) || `Soal ${r.exercise_id}`,
        is_correct: r.is_correct,
        timestamp: r.timestamp,
      }))
      setRecent(combined)
    }
    loadRecent()
    return () => { active = false }
  }, [user])

  const nextBadgeTarget = useMemo(() => {
    const thresholds = [10, 50, 100]
    const p = Number(profile.points || 0)
    // If user already has all badges available, no next target
    if (totalBadges > 0 && badges.length >= totalBadges) return null
    const next = thresholds.find(t => p < t)
    return next ?? null
  }, [profile.points, badges.length, totalBadges])

  // Foto profil dinonaktifkan sesuai permintaan, jadi tidak ada unggah avatar di sini

  async function saveProfile() {
    if (!user) return
    setSavingProfile(true)
    setSaveMsg('')
    try {
      await supabase.from('users').update({ username: (nameInput || '').trim() || null, avatar_url: (avatarUrl || '').trim() || null }).eq('id', user.id)
      setProfile(prev => ({ ...prev, username: (nameInput || '').trim() }))
      setSaveMsg('Profil tersimpan')
    } catch (err) {
      setSaveMsg(err?.message || 'Gagal menyimpan profil')
    } finally {
      setSavingProfile(false)
    }
  }

  async function changePassword(e) {
    e.preventDefault()
    setPwMsg('')
    if (!pw1 || pw1.length < 6) { setPwMsg('Kata sandi minimal 6 karakter'); return }
    if (pw1 !== pw2) { setPwMsg('Konfirmasi kata sandi tidak cocok'); return }
    setPwSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: pw1 })
      if (error) throw error
      setPwMsg('Kata sandi berhasil diubah')
      setPw1(''); setPw2('')
    } catch (err) {
      setPwMsg(err?.message || 'Gagal mengubah kata sandi')
    } finally {
      setPwSaving(false)
    }
  }

  const displayName = profile.username || user?.email || 'Pengguna'

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Header card */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="px-5 py-6 md:px-8 md:py-7 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-indigo-50 to-white">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full overflow-hidden bg-slate-200 grid place-items-center text-2xl">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  <span>👤</span>
                )}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold text-slate-800">{displayName}</h1>
                <p className="text-slate-600 mt-0.5">{user?.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div className="text-xs text-slate-500">Poin</div>
                <div className="text-xl font-semibold text-indigo-600">{profile.points}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div className="text-xs text-slate-500">Lencana</div>
                <div className="text-xl font-semibold text-slate-800">{badges.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Edit profile */}
          <Card title="Edit Profil" className="md:col-span-2 lg:col-span-2">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full overflow-hidden bg-slate-200 grid place-items-center text-2xl">
                  {avatarUrl ? <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" /> : <span>👤</span>}
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-600">Nama tampilan</label>
                <input value={nameInput} onChange={e=>setNameInput(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="Nama kamu" />
              </div>
              <div className="flex items-center gap-3">
                <button onClick={saveProfile} disabled={savingProfile} className="rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50">Simpan Profil</button>
                {saveMsg && <div className="text-sm text-slate-600">{saveMsg}</div>}
              </div>
            </div>
          </Card>

          {/* Progress to next badge */}
          <Card title="Progres Lencana Berikutnya">
            {nextBadgeTarget ? (
              <div>
                <div className="text-sm text-slate-600">Target: {nextBadgeTarget} poin</div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, (profile.points / nextBadgeTarget) * 100)}%` }} />
                </div>
                <div className="mt-1 text-xs text-slate-500">{profile.points} / {nextBadgeTarget}</div>
              </div>
            ) : (
              <div className="text-slate-600">Kamu sudah mencapai semua target lencana saat ini. Mantap!</div>
            )}
          </Card>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Change password */}
          <Card title="Ganti Kata Sandi">
            <form onSubmit={changePassword} className="space-y-3">
              <div>
                <label className="text-sm text-slate-600">Kata sandi baru</label>
                <input type="password" value={pw1} onChange={e=>setPw1(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
              </div>
              <div>
                <label className="text-sm text-slate-600">Ulangi kata sandi</label>
                <input type="password" value={pw2} onChange={e=>setPw2(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
              </div>
              <div className="flex items-center gap-3">
                <button disabled={pwSaving} className="rounded-xl bg-gray-900 px-4 py-2 text-white hover:bg-black disabled:opacity-50">Simpan Kata Sandi</button>
                {pwMsg && <div className="text-sm text-slate-600">{pwMsg}</div>}
              </div>
            </form>
          </Card>

          {/* Recent activity */}
          <Card title="Aktivitas Terbaru" className="lg:col-span-2">
            {recent.length === 0 ? (
              <div className="text-slate-500">Belum ada aktivitas.</div>
            ) : (
              <ul className="divide-y divide-slate-200">
                {recent.map(r => (
                  <li key={r.id} className="py-2 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-800">{r.title}</div>
                      <div className="text-xs text-slate-500">{new Date(r.timestamp).toLocaleString()}</div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${r.is_correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{r.is_correct ? 'Benar' : 'Salah'}</span>
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