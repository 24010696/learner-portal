import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import LogoutButton from '../components/LogoutButton'

const SUBJECTS = ['Mathematics (Pure)', 'Mathematics (Lit)', 'Physics', 'Geography']
const GRADES = [10, 11, 12]

export default function AdminDashboard() {
  const { user, profile } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    title: '', type: 'note', grade: '10', subject: SUBJECTS[0], due_date: null, file: null
  })

  useEffect(() => { fetchContent() }, [])

  const fetchContent = async () => {
    setLoading(true)
    try {
      const { data: notes } = await supabase.from('notes').select('*').order('created_at', { ascending: false })
      const { data: assignments } = await supabase.from('assignments').select('*').order('created_at', { ascending: false })
      const merged = [
        ...(notes || []).map(n => ({ ...n, content_type: 'note' })),
        ...(assignments || []).map(a => ({ ...a, content_type: 'assignment' }))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setItems(merged)
    } finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    if (!form.file) return setError('Select a PDF file.')
    setSubmitting(true)

    try {
      const cleanName = form.file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '')
      const filePath = `${form.grade}/${form.subject}/${Date.now()}_${cleanName}`

      const { error: uploadErr } = await supabase.storage.from('content').upload(filePath, form.file, { upsert: false })
      if (uploadErr) throw uploadErr

      const { data: { publicUrl } } = supabase.storage.from('content').getPublicUrl(filePath)

      const tableName = form.type === 'note' ? 'notes' : 'assignments'
      
      // ✅ Build insert data dynamically — only add due_date for assignments
      const insertData = {
        title: form.title.trim(),
        subject: form.subject,
        grade: Number(form.grade),
        file_url: publicUrl,
        uploaded_by: user.id
      }
      if (form.type === 'assignment' && form.due_date) {
        insertData.due_date = form.due_date
      }

      const { error: dbErr } = await supabase.from(tableName).insert(insertData)
      if (dbErr) throw dbErr

      setSuccess('✅ Uploaded!')
      setForm({ title: '', type: 'note', grade: '10', subject: SUBJECTS[0], due_date: null, file: null })
      e.target.reset()
      fetchContent()
    } catch (err) { setError(err.message || 'Upload failed') } finally { setSubmitting(false) }
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.title}"?`)) return
    try {
      await supabase.from(item.content_type === 'note' ? 'notes' : 'assignments').delete().eq('id', item.id)
      setItems(prev => prev.filter(i => i.id !== item.id))
      setSuccess('✅ Deleted.')
    } catch (err) { setError('Delete failed') }
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">👨‍🏫 Admin Dashboard</h1>
        <LogoutButton />
      </div>

      {/* 📊 Analytics Cards */}
      <AdminAnalytics />

      {/* Upload Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Upload Content</h2>
        {error && <p className="mb-3 text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
        {success && <p className="mb-3 text-sm text-green-600 bg-green-50 p-2 rounded">{success}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input type="text" placeholder="Title" required className="p-2 border rounded" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <select className="p-2 border rounded" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
            <option value="note">📖 Note</option>
            <option value="assignment">📝 Assignment</option>
          </select>
          <select className="p-2 border rounded" value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })}>
            {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
          </select>
          <select className="p-2 border rounded" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}>
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="datetime-local" className="p-2 border rounded" onChange={e => setForm({ ...form, due_date: e.target.value ? new Date(e.target.value).toISOString() : null })} />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">PDF File</label>
          <input type="file" accept=".pdf" required className="w-full text-sm" onChange={e => setForm({ ...form, file: e.target.files[0] })} />
        </div>
        <button type="submit" disabled={submitting} className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
          {submitting ? 'Uploading...' : 'Upload'}
        </button>
      </form>

      {/* Content List */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr><th className="p-4">Title</th><th className="p-4">Type</th><th className="p-4">Grade/Subject</th><th className="p-4">Actions</th></tr>
          </thead>
          <tbody>
            {items.length === 0 ? <tr><td colSpan="4" className="p-6 text-center text-gray-500">No content yet.</td></tr>
              : items.map(item => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium">{item.title}</td>
                  <td className="p-4"><span className={`px-2 py-1 rounded text-xs ${item.content_type === 'note' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>{item.content_type}</span></td>
                  <td className="p-4 text-sm text-gray-600">Grade {item.grade} • {item.subject}</td>
                  <td className="p-4 flex gap-3">
                    <a href={item.file_url} target="_blank" className="text-blue-600 text-sm">🔗 View</a>
                    <button onClick={() => handleDelete(item)} className="text-red-600 text-sm">🗑️ Delete</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* 📝 Grading Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">📝 Grade Submissions</h2>
        <SimpleGrading />
      </div>

      {/* 🔧 Fix Student Profile Tool */}
      <FixStudentProfile />
    </div>
  )
}

// 📊 Analytics Component
function AdminAnalytics() {
  const [stats, setStats] = useState({ total: 0, subjects: {}, loading: true })

  useEffect(() => {
    const fetch = async () => {
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student')
      const { data } = await supabase.from('profiles').select('subjects').eq('role', 'student')
      
      const counts = {}
      data?.forEach(p => p.subjects?.forEach(s => { counts[s] = (counts[s] || 0) + 1 }))
      setStats({ total: count || 0, subjects: counts, loading: false })
    }
    fetch()
  }, [])

  if (stats.loading) return <div className="grid grid-cols-2 gap-4 mb-8"><div className="bg-gray-100 h-20 rounded animate-pulse"></div></div>

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
        <p className="text-sm text-gray-600">Registered Learners</p>
        <p className="text-2xl font-bold">{stats.total}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
        <p className="text-sm text-gray-600">Most Enrolled Subject</p>
        <p className="text-2xl font-bold">{Object.entries(stats.subjects).sort((a,b)=>b[1]-a[1])[0]?.[0] || '—'}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
        <p className="text-sm text-gray-600">Subject Breakdown</p>
        <p className="text-sm mt-1">
          {Object.entries(stats.subjects).map(([sub, count]) => `${sub} (${count})`).join(', ') || '—'}
        </p>
      </div>
    </div>
  )
}

// 📝 Grading Component
function SimpleGrading() {
  const { user } = useAuth()
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => { fetchSubmissions() }, [])

  const fetchSubmissions = async () => {
    setLoading(true)
    const { data: subs } = await supabase.from('submissions').select('*').order('submitted_at', { ascending: false })
    if (!subs?.length) { setSubmissions([]); setLoading(false); return }

    const learnerIds = [...new Set(subs.map(s => s.learner_id))]
    const { data: learners } = await supabase.from('profiles').select('id, full_name, subjects').in('id', learnerIds)

    const enriched = subs.map(sub => {
      const learner = learners?.find(l => l.id === sub.learner_id)
      return { ...sub, name: learner?.full_name || 'Unknown', subjects: learner?.subjects || [] }
    })
    setSubmissions(enriched)
    setLoading(false)
  }

  const handleGrade = async (sub, score) => {
    setMessage('')
    const { error } = await supabase.from('marks').upsert({
      learner_id: sub.learner_id, assignment_id: sub.assignment_id,
      score: Number(score), max_score: 100, graded_by: user?.id, graded_at: new Date().toISOString()
    }, { onConflict: 'learner_id,assignment_id' })

    if (error) setMessage('❌ Failed: ' + error.message)
    else { setMessage('✅ Grade saved!'); fetchSubmissions() }
  }

  if (loading) return <p className="text-gray-500">Loading submissions...</p>
  if (submissions.length === 0) return <p className="text-gray-500">No submissions to grade yet.</p>

  return (
    <div className="space-y-3">
      {message && <p className="text-sm text-green-600 bg-green-50 p-2 rounded">{message}</p>}
      {submissions.map(sub => (
        <div key={sub.id} className="border p-4 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="font-medium text-lg">{sub.name}</p>
            <p className="text-sm text-gray-600">📚 {sub.subjects.join(', ') || 'No subjects listed'}</p>
            <p className="text-xs text-gray-400 mt-1">Submitted: {new Date(sub.submitted_at).toLocaleString()}</p>
            <a href={sub.file_url} target="_blank" className="text-xs text-blue-600 hover:underline mt-1 inline-block">🔗 View PDF</a>
          </div>
          <div className="flex items-center gap-2">
            <input type="number" min="0" max="100" placeholder="0-100"
              className="w-20 p-2 border rounded text-center text-sm"
              onBlur={e => e.target.value && handleGrade(sub, e.target.value)} />
            <span className="text-xs text-gray-500">/100</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// 🔧 Fix Student Profile (Admin tool — no SQL needed)
function FixStudentProfile() {
  const [email, setEmail] = useState('')
  const [grade, setGrade] = useState('10')
  const [subjects, setSubjects] = useState('Geography')
  const [message, setMessage] = useState('')

  const handleFix = async () => {
    setMessage('')
    const { data: user } = await supabase.from('auth.users').select('id').eq('email', email).single()
    if (!user?.id) return setMessage('❌ User not found')

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      grade: Number(grade),
      subjects: subjects.split(',').map(s => s.trim())
    })
    
    if (error) setMessage('❌ Failed: ' + error.message)
    else { setMessage('✅ Profile updated! Student will see content on next login.'); setEmail('') }
  }

  return (
    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <h3 className="font-medium mb-2">🔧 Fix Student Profile</h3>
      <div className="flex flex-wrap gap-2">
        <input type="email" placeholder="student@email.com" className="p-2 border rounded text-sm" value={email} onChange={e => setEmail(e.target.value)} />
        <select className="p-2 border rounded text-sm" value={grade} onChange={e => setGrade(e.target.value)}>
          {[10,11,12].map(g => <option key={g} value={g}>Grade {g}</option>)}
        </select>
        <input type="text" placeholder="Geography,Physics" className="p-2 border rounded text-sm w-40" value={subjects} onChange={e => setSubjects(e.target.value)} />
        <button onClick={handleFix} className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">Fix Profile</button>
      </div>
      {message && <p className="text-xs mt-2 text-blue-800">{message}</p>}
    </div>
  )
}