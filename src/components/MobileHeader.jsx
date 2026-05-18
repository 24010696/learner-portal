
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LogoutButton from './LogoutButton'

export default function MobileHeader({ title }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile } = useAuth()

  // Don't show back button on root pages
  const isRoot = ['/admin', '/student', '/submissions'].includes(location.pathname)

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Back Button (mobile only) */}
          {!isRoot && (
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-gray-600 hover:text-gray-900 active:bg-gray-100 rounded-full"
              aria-label="Go back"
            >
              ← Back
            </button>
          )}
          {isRoot && <div className="w-10" />} {/* Spacer for alignment */}

          {/* Page Title */}
          <h1 className="text-lg font-semibold text-center flex-1">{title}</h1>

          {/* Logout */}
          <LogoutButton />
        </div>
      </header>

      {/* Bottom Nav (mobile only) */}
      {profile?.role === 'student' && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden">
          <div className="flex justify-around py-2">
            <button
              onClick={() => navigate('/student')}
              className={`flex flex-col items-center text-xs ${location.pathname === '/student' ? 'text-blue-600' : 'text-gray-500'}`}
              aria-label="Notes"
            >
              📚 Notes
            </button>
            <button
              onClick={() => navigate('/submissions')}
              className={`flex flex-col items-center text-xs ${location.pathname === '/submissions' ? 'text-blue-600' : 'text-gray-500'}`}
              aria-label="Submit"
            >
              📝 Submit
            </button>
          </div>
        </nav>
      )}
    </>
  )
}
