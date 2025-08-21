import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const navigate = useNavigate()
  const { isTeacher } = useAuth()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <nav className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src="/Group 21.png" alt="MOTION" className="h-8 w-auto" />
        </Link>
        {/* Desktop */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/exercises" className="text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100">Latihan</Link>
          {isTeacher && (
            <div className="relative group">
              <Link to="/teacher/portal" className="text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100">Portal Guru</Link>
              <div className="absolute hidden group-hover:block bg-white border border-slate-200 rounded-xl shadow p-2 mt-1">
                <Link to="/teacher/exercises" className="block px-3 py-1.5 rounded-lg hover:bg-gray-100">Soal Saya</Link>
                <Link to="/teacher/quizzes" className="block px-3 py-1.5 rounded-lg hover:bg-gray-100">Kuis Saya</Link>
                <Link to="/teacher/quizzes/new" className="block px-3 py-1.5 rounded-lg hover:bg-gray-100">Buat Kuis</Link>
                <Link to="/teacher/upload-csv" className="block px-3 py-1.5 rounded-lg hover:bg-gray-100">Unggah CSV</Link>
              </div>
            </div>
          )}
          <Link to="/profile" className="text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100">Profil</Link>
          <button onClick={handleLogout} className="ml-2 bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-black">Keluar</button>
        </div>
        {/* Mobile hamburger */}
        <button className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-lg hover:bg-gray-100" aria-label="Menu" onClick={() => setOpen(!open)}>
          <svg width="20" height="20" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
      </div>
      {/* Mobile popup menu */}
      {open && (
        <div className="md:hidden fixed inset-0 z-30" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/0" />
          <div className="absolute right-4 top-14 w-56 rounded-xl border bg-white shadow-xl p-2" onClick={(e) => e.stopPropagation()}>
            <Link to="/exercises" className="block px-3 py-2 rounded-lg hover:bg-gray-100" onClick={() => setOpen(false)}>Latihan</Link>
            {isTeacher && <Link to="/teacher/portal" className="block px-3 py-2 rounded-lg hover:bg-gray-100" onClick={() => setOpen(false)}>Portal Guru</Link>}
            <Link to="/profile" className="block px-3 py-2 rounded-lg hover:bg-gray-100" onClick={() => setOpen(false)}>Profil</Link>
            <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100">Keluar</button>
          </div>
        </div>
      )}
    </nav>
  )
}