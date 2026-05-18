import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import LogoutButton from '../components/LogoutButton'
import MobileHeader from '../components/MobileHeader'
export default function StudentDashboard() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState('notes')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (profile) fetchContent()
  }, [profile, activeTab])

  useEffect(() => {
    console.log('🔐 Auth debug:', { user: !!profile, role: profile?.role })
  }, [profile])

 const fetchContent = async () => {
  setLoading(true)
  const table = activeTab === 'notes' ? 'notes' : 'assignments'
  
  // Safety: if profile missing or subjects empty, use defaults that match your test data
  const grade = profile?.grade || 10
  const subjects = profile?.subjects?.length > 0 
    ? profile.subjects 
    : ['Geography']  // 🔴 Default fallback — change to match your most common subject

  let query = supabase.from(table).select('*').eq('grade', grade)
  query = query.in('subject', subjects)
  
  const { data, error } = await query.order('created_at', { ascending: false })
  if (!error) setItems(data || [])
  setLoading(false)
}
  const filtered = filter === 'all' ? items : items.filter(i => i.subject === filter)

  if (!profile) return <div className="p-6">Loading profile...</div>

  return (
    <div className="max-w-5xl mx-auto p-6">
     <MobileHeader title={`Grade ${profile?.grade} Dashboard`} />
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold">👨‍🎓 Grade {profile.grade} Dashboard</h1>
          <p className="text-gray-600">Subjects: {profile.subjects?.join(', ') || '—'}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/submissions')}
            className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 font-medium"
          >
            📤 Submit Assignments
          </button>
          <LogoutButton />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {['notes', 'assignments'].map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setFilter('all') }}
            className={`px-4 py-2 font-medium capitalize ${
              activeTab === tab
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Subject Filter */}
      <div className="mb-4 flex items-center gap-2">
        <span className="text-sm text-gray-600">Filter by subject:</span>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="all">All Subjects</option>
          {profile.subjects?.map(sub => (
            <option key={sub} value={sub}>{sub}</option>
          ))}
        </select>
      </div>

      {/* Content Grid */}
      {loading ? (
        <p className="text-gray-500">Loading {activeTab}...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg">No {activeTab} found for your subjects.</p>
          <p className="text-sm text-gray-400 mt-2">Ask your teacher to upload content!</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-lg shadow border hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.subject} • Grade {item.grade}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Added: {new Date(item.created_at).toLocaleDateString()}
                  </p>

                  {/* Show marks for assignments only */}
                  {activeTab === 'assignments' && profile.id && (
                    <MarksDisplay assignmentId={item.id} learnerId={profile.id} />
                  )}
                </div>

                <a
                  href={item.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition ml-3"
                >
                  📥 Download
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Inline MarksDisplay (no external import required)
function MarksDisplay({ assignmentId, learnerId }) {
  const [mark, setMark] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const fetchMark = async () => {
      const { data, error } = await supabase
        .from('marks')
        .select('score, max_score, graded_at')
        .eq('assignment_id', assignmentId)
        .eq('learner_id', learnerId)
        .single()

      if (mounted && !error && data) setMark(data)
      if (mounted) setLoading(false)
    }
    fetchMark()
    return () => { mounted = false }
  }, [assignmentId, learnerId])

  if (loading) return <span className="text-xs text-gray-400">Loading...</span>
  if (!mark) return <span className="text-xs text-amber-600 ml-1">⏳ Not graded</span>

  const percentage = Math.round((mark.score / mark.max_score) * 100)
  const color = percentage >= 70 ? 'text-green-600' : percentage >= 50 ? 'text-amber-600' : 'text-red-600'

  return (
    <div className={`text-xs font-medium mt-2 ${color}`}>
      🏆 {mark.score}/{mark.max_score} ({percentage}%)
      <span className="text-gray-400 ml-1">• {new Date(mark.graded_at).toLocaleDateString()}</span>
    </div>
  )// 📈 Progress Tracker (Shows subject avg + trend)
function ProgressTracker() {
  const { profile, user } = useAuth()
  const [progress, setProgress] = useState([])

  useEffect(() => {
    if (!user || !profile?.subjects) return
    const fetchProgress = async () => {
      const { data } = await supabase
        .from('marks')
        .select('score, assignment_id')
        .eq('learner_id', user.id)
      
      const { data: assignments } = await supabase
        .from('assignments')
        .select('id, subject')
        .in('id', data?.map(m => m.assignment_id) || [])

      // Calculate avg per subject
      const subjectScores = {}
      data?.forEach(m => {
        const subj = assignments?.find(a => a.id === m.assignment_id)?.subject
        if (subj) {
          if (!subjectScores[subj]) subjectScores[subj] = []
          subjectScores[subj].push(m.score)
        }
      })

      const result = Object.entries(subjectScores).map(([subject, scores]) => {
        const avg = Math.round(scores.reduce((a,b) => a+b, 0) / scores.length)
        const trend = scores.length >= 2 ? (scores[scores.length-1] >= scores[scores.length-2] ? '↑' : '↓') : '→'
        return { subject, avg, trend }
      })
      setProgress(result)
    }
    fetchProgress()
  }, [user, profile])

  if (!progress.length) return null

  return (
    <div className="mt-8 bg-white p-5 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-3">📈 Your Progress</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {progress.map(p => (
          <div key={p.subject} className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="text-sm font-medium">{p.subject}</span>
            <span className={`text-sm font-bold ${p.avg >= 70 ? 'text-green-600' : p.avg >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
              {p.avg}% {p.trend}
            </span>
          </div>
        ))}
      </div>
    <ProgressTracker />
    </div>

  )
}
}
