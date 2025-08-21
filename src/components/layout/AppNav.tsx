import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

export default function AppNav() {
  const [open, setOpen] = useState(false)
  const { isTeacher } = useAuth()

  async function logout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src="/Group 21.png" alt="MOTION" className="h-8 w-auto" />
        </Link>
        <div className="hidden md:flex items-center gap-2">
          <Link to="/exercises" className="px-3 py-1.5 rounded-lg hover:bg-gray-100">Exercises</Link>
          {isTeacher && <Link to="/teacher/exercises" className="px-3 py-1.5 rounded-lg hover:bg-gray-100">Teacher Portal</Link>}
          <Link to="/profile" className="px-3 py-1.5 rounded-lg hover:bg-gray-100">Profile</Link>
          <button onClick={logout} className="ml-2 rounded-xl bg-gray-900 px-3 py-1.5 text-white hover:bg-black">Logout</button>
        </div>
        <button className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-lg hover:bg-gray-100" onClick={() => setOpen(true)} aria-label="Open menu">
          <svg width="20" height="20" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-80 max-w-[90vw] bg-white shadow-xl p-4 flex flex-col">
            <div className="flex items-center justify-between">
              <img src="/Group 21.png" alt="MOTION" className="h-8 w-auto" />
              <button className="h-9 w-9 grid place-items-center rounded-lg hover:bg-gray-100" onClick={() => setOpen(false)} aria-label="Close menu">
                <svg width="20" height="20" viewBox="0 0 24 24"><path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="mt-4 space-y-1">
              <Link to="/exercises" className="block rounded-lg px-3 py-2 hover:bg-gray-100" onClick={() => setOpen(false)}>Exercises</Link>
              {isTeacher && <Link to="/teacher/exercises" className="block rounded-lg px-3 py-2 hover:bg-gray-100" onClick={() => setOpen(false)}>Teacher Portal</Link>}
              <Link to="/profile" className="block rounded-lg px-3 py-2 hover:bg-gray-100" onClick={() => setOpen(false)}>Profile</Link>
              <button onClick={logout} className="w-full text-left rounded-lg px-3 py-2 hover:bg-gray-100">Logout</button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

