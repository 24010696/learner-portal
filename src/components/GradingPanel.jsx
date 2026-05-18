import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function GradingPanel() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [grades, setGrades] = useState({})

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const fetchSubmissions = async () => {
    const { data } = await supabase
      .from('submissions')
      .select(`
        *,
        learner:profiles!learner_id(full_name, grade, subjects),
        assignment:assignments!assignment_id(title, subject, grade, max_score)
      `)
      .order('submitted_at', { ascending: false })
    setSubmissions(data || [])
    setLoading(false)
  }

  const handleGrade = async (submissionId, score) => {
    const assignment = submissions.find(s => s.id === submissionId)?.assignment
    await supabase.from('marks').upsert({
      learner_id: submissions.find(s => s.id === submissionId).learner_id,
      assignment_id: submissions.find(s => s.id === submissionId).assignment_id,
      score: Number(score),
      max_score: assignment?.max_score || 100,
      graded_by: (await supabase.auth.getUser()).data.user?.id
    })
    setGrades(prev => ({ ...prev, [submissionId]: score }))
  }

  if (loading) return <p className="text-gray-500">Loading submissions...</p>
  if (submissions.length === 0) return <p className="text-gray-500">No submissions to grade.</p>

  return (
    <div className="space-y-4">
      {submissions.map(sub => {
        const isGraded = grades[sub.id] !== undefined
        return (
          <div key={sub.id} className="border p-4 rounded flex justify-between items-center">
            <div>
              <p className="font-medium">{sub.assignment?.title}</p>
              <p className="text-sm text-gray-600">{sub.learner?.full_name} • Grade {sub.learner?.grade}</p>
              <a href={sub.file_url} target="_blank" className="text-sm text-blue-600 hover:underline">🔗 View submission</a>
            </div>
            <div className="flex items-center gap-2">
              <input type="number" min="0" max="100" placeholder="Score" 
                className="w-20 p-2 border rounded text-center"
                disabled={isGraded}
                onBlur={e => e.target.value && handleGrade(sub.id, e.target.value)} />
              {isGraded && <span className="text-green-600 text-sm">✓ Graded: {grades[sub.id]}/100</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}