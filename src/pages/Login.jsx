import { useState, useEffect } from 'react'  // ✅ Add useEffect
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // ✅ Move redirect logic into useEffect
  useEffect(() => {
    if (profile) {
      navigate(profile.role === 'admin' ? '/admin' : '/student', { replace: true })
    }
  }, [profile, navigate])  // ✅ Dependencies array

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError(error.message)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Learner Portal Login</h2>
        {error && <p className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
        <input type="email" placeholder="Email" required className="w-full mb-3 p-2 border rounded"
          value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" required className="w-full mb-4 p-2 border rounded"
          value={password} onChange={e => setPassword(e.target.value)} />
        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Signing in...' : 'Login'}
        </button>
        <p className="mt-4 text-center text-sm">
          No account? <button type="button" onClick={() => navigate('/register')} className="text-blue-600 hover:underline">Register</button>
        </p>
      </form>
    </div>
  )
}