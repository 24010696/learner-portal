import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import LogoutButton from '../components/LogoutButton'

export default function Submissions() {
  const { user, profile } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [uploading, setUploading] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (profile) fetchData() }, [profile])

  const fetchData = async () => {
    setLoading(true)
    const { data: assigs } = await supabase
      .from('assignments')
      .select('*')
      .eq('grade', profile.grade)
      .in('subject', profile.subjects?.length > 0 ? profile.subjects : ['Geography'])
      .order('created_at', { ascending: false })

    const { data: subs } = await supabase
      .from('submissions')
      .select('*')
      .eq('learner_id', user.id)

    setAssignments(assigs || [])
    setSubmissions(subs || [])
    setLoading(false)
  }

  const handleUpload = async (assignmentId, file) => {
    if (!file || file.type !== 'application/pdf') return setError('PDF only.')
    setUploading(assignmentId)
    setError(''); setSuccess('')

    try {
      const cleanName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '')
      const path = `${user.id}/${assignmentId}_${Date.now()}_${cleanName}`

      const { error: uploadErr } = await supabase.storage.from('submissions').upload(path, file)
      if (uploadErr) throw uploadErr

      const { data: { publicUrl } } = supabase.storage.from('submissions').getPublicUrl(path)

      await supabase.from('submissions').upsert({
        learner_id: user.id,
        assignment_id: assignmentId,
        file_url: publicUrl,
        submitted_at: new Date().toISOString()
      }, { onConflict: 'learner_id,assignment_id' })

      setSuccess('✅ Uploaded!')
      fetchData()
    } catch (err) {
      setError(err.message || 'Upload failed.')
    } finally {
      setUploading(null)
    }
  }

  if (loading) return <div className="p-8 text-center">Loading assignments...</div>

  return (
    <div className="max-w-4xl mx-auto p-6">
     
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">📝 My Assignments</h1>
        <LogoutButton />
      </div>

      {error && <p className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
      {success && <p className="mb-4 text-sm text-green-600 bg-green-50 p-2 rounded">{success}</p>}

      {assignments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg">No assignments available for your subjects.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map(ass => {
            const submitted = submissions.find(s => s.assignment_id === ass.id)
            const now = new Date()
            const due = ass.due_date ? new Date(ass.due_date) : null
            const submittedAt = submitted?.submitted_at ? new Date(submitted.submitted_at) : null

            // Determine status badge
            let statusBadge, statusText
            if (submitted) {
              if (due && submittedAt > due) {
                statusBadge = 'bg-amber-100 text-amber-800'
                statusText = '⚠️ Late'
              } else {
                statusBadge = 'bg-green-100 text-green-800'
                statusText = '✅ Submitted'
              }
            } else {
              if (due && now > due) {
                statusBadge = 'bg-red-100 text-red-800'
                statusText = '❌ Missing'
              } else {
                statusBadge = 'bg-gray-100 text-gray-800'
                statusText = '⏳ Open'
              }
            }

            return (
              <div key={ass.id} className="bg-white p-4 rounded-lg shadow border">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div>
                    <h3 className="font-semibold text-lg">{ass.title}</h3>
                    <p className="text-sm text-gray-600">{ass.subject} • Grade {ass.grade}</p>
                    {due && <p className="text-xs text-gray-500 mt-1">📅 Due: {due.toLocaleDateString()}</p>}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <span className={`px-3 py-1 text-sm rounded font-medium ${statusBadge}`}>
                      {statusText}
                    </span>
                    
                    {submitted && (
                      <a href={submitted.file_url} target="_blank" className="text-sm text-blue-600 hover:underline">
                        🔗 View
                      </a>
                    )}
                    
                    {!submitted && (
                      <label className="cursor-pointer">
                        <input 
                          type="file" 
                          accept=".pdf" 
                          className="hidden" 
                          onChange={e => handleUpload(ass.id, e.target.files[0])} 
                          disabled={uploading === ass.id} 
                        />
                        <span className={`inline-block px-4 py-2 text-sm rounded font-medium transition ${
                          uploading === ass.id 
                            ? 'bg-gray-300 cursor-not-allowed' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}>
                          {uploading === ass.id ? 'Uploading...' : '📤 Submit PDF'}
                        </span>
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
