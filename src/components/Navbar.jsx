import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Navbar() {
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white grid place-items-center font-bold">M</div>
          <span className="text-lg font-semibold text-gray-800">MOTION</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/exercises" className="text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100">Exercises</Link>
          <Link to="/profile" className="text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100">Profile</Link>
          <button onClick={handleLogout} className="ml-2 bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-black">Logout</button>
        </div>
      </div>
    </nav>
  )
}