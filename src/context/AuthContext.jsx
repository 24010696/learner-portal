import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch profile helper
  const fetchProfile = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, grade, subjects, role')
      .eq('id', userId)
      .maybeSingle()
    
    setProfile(data || null)
    setLoading(false) // ✅ ALWAYS stop loading after fetch
  }

  useEffect(() => {
    // 1. Check for existing session on mount (handles refresh)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false) // No session → done loading
    })

    // 2. Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) fetchProfile(session.user.id)
      else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user: session?.user || null, profile, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)