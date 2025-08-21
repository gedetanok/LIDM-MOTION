import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      const userId = data?.user?.id
      if (userId) {
        // Ensure profile row exists without overwriting existing fields
        await supabase.from('users').upsert({ id: userId }, { onConflict: 'id' })
        if ((nickname || '').trim()) {
          await supabase.from('users').update({ username: nickname.trim() }).eq('id', userId)
        }
      }
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err?.message || 'Failed to sign in')
      console.error('[login]', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="px-6 py-6 bg-gradient-to-r from-indigo-100/70 to-white">
          <div className="flex">
            <img src="/logo-motion.png" alt="MOTION" className="h-10 w-auto" />
          </div>
          <h1 className="mt-3 text-xl font-semibold text-slate-800">Masuk ke MOTION</h1>
          <p className="text-slate-600 mt-1 text-sm">Belajar matematika + emosi dengan cara yang menyenangkan.</p>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Nama panggilan</label>
            <input
              type="text"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Contoh: Budi"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Email</label>
            <input
              type="email"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Kata sandi</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute inset-y-0 right-0 px-3 grid place-items-center text-slate-500 hover:text-slate-700"
                aria-label={showPw ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  {showPw ? (
                    <path d="M3.53 2.47a.75.75 0 0 0-1.06 1.06l2.054 2.054C2.8 7.005 1.5 8.87 1.5 12c0 0 3 7.5 10.5 7.5 2.11 0 3.856-.53 5.242-1.36l3.228 3.228a.75.75 0 0 0 1.06-1.06L3.53 2.47ZM12 6c3.357 0 5.79 1.687 7.246 3.2.794.812 1.379 1.638 1.754 2.3-.28.498-.689 1.15-1.246 1.86l-2.25-2.25a4.5 4.5 0 0 0-6.36-6.36L9.91 4.64C10.6 4.51 11.29 4.5 12 4.5Zm0 12c-3.357 0-5.79-1.687-7.246-3.2A13.71 13.71 0 0 1 3 12c.28-.498.689-1.15 1.246-1.86l2.25 2.25A4.5 4.5 0 0 0 15.36 16.75l1.73 1.73C15.4 18.99 13.84 18.5 12 18.5Z"/>
                  ) : (
                    <path d="M12 5c-7.5 0-10.5 7-10.5 7s3 7.5 10.5 7.5S22.5 12 22.5 12 19.5 5 12 5Zm0 12c-2.485 0-4.5-2.015-4.5-4.5S9.515 8 12 8s4.5 2.015 4.5 4.5S14.485 17 12 17Zm0-2.5A2 2 0 1 0 12 10a2 2 0 0 0 0 4Z"/>
                  )}
                </svg>
              </button>
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 shadow transition disabled:opacity-60"
          >
            {loading ? 'Masuk...' : 'Masuk'}
          </button>
        </form>
        <div className="px-6 pb-6">
          <p className="text-sm text-gray-600">Belum punya akun? <Link to="/register" className="text-indigo-600 hover:underline">Daftar sekarang</Link></p>
        </div>
      </div>
    </div>
  )
}