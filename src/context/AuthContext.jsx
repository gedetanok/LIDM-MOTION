import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let isMounted = true

    console.debug('[AuthProvider] mount')
    async function init() {
      const { data } = await supabase.auth.getSession()
      if (!isMounted) return
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
      setReady(true)
      console.debug('[AuthProvider] getSession done, ready=true')
    }

    init()

    const { data: subscription } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
      setReady(true)
      console.debug('[AuthProvider] onAuth event:', event, 'ready=true')
      // If user just logged in and we have a pending role from sign-up, try to apply it now
      try {
        const pending = localStorage.getItem('pendingRole')
        if (newSession?.user?.id && pending) {
          await supabase.from('users').upsert({ id: newSession.user.id, role: pending })
          localStorage.removeItem('pendingRole')
        }
      } catch (_) {}
    })

    return () => {
      isMounted = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  // Load role from public.users when user changes
  useEffect(() => {
    let active = true
    async function loadRole() {
      if (!user) { setRole(null); return }
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
      if (!active) return
      if (!error && data) setRole(data.role || 'student')
      else setRole('student')
    }
    loadRole()
    return () => { active = false }
  }, [user])

  return (
    <AuthContext.Provider value={{ session, user, loading, ready, role, isTeacher: role === 'teacher' }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}