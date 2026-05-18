import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

const SUBJECTS = ['Mathematics (Pure)', 'Mathematics (Lit)', 'Physics', 'Geography']
const GRADES = [10, 11, 12]

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', fullName: '', grade: '', subjects: [] })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const toggleSubject = (sub) => setForm(prev => ({
    ...prev, subjects: prev.subjects.includes(sub) ? prev.subjects.filter(s => s !== sub) : [...prev.subjects, sub]
  }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    if (!form.grade || form.subjects.length === 0) return setError('Select grade & at least 1 subject.')

    const { data, error } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { full_name: form.fullName, role: 'student', grade: Number(form.grade), subjects: form.subjects.join(',') } }
    })
    setLoading(false)
    if (error) setError(error.message)
    else if (data.user) setSuccess('Account created! Check email to verify.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Create Learner Account</h2>
        {error && <p className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
        {success && <p className="mb-4 text-sm text-green-600 bg-green-50 p-2 rounded">{success}</p>}
        <input type="text" placeholder="Full Name" required className="w-full mb-3 p-2 border rounded" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} />
        <input type="email" placeholder="Email" required className="w-full mb-3 p-2 border rounded" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
        <input type="password" placeholder="Password (min 6)" required minLength={6} className="w-full mb-3 p-2 border rounded" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
        <select required className="w-full mb-3 p-2 border rounded" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})}>
          <option value="">Select Grade</option>
          {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
        </select>
        <fieldset className="mb-4">
          <legend className="text-sm font-medium mb-2">Subjects</legend>
          <div className="grid grid-cols-2 gap-2">
            {SUBJECTS.map(sub => (
              <label key={sub} className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" checked={form.subjects.includes(sub)} onChange={() => toggleSubject(sub)} className="rounded text-blue-600" />
                <span className="text-sm">{sub}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50">{loading ? 'Creating...' : 'Register'}</button>
        <p className="mt-4 text-center text-sm">Already have an account? <button type="button" onClick={() => navigate('/login')} className="text-blue-600 hover:underline">Login</button></p>
      </form>
    </div>
  )
}