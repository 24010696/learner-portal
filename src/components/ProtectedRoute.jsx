import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ requiredRole }) {
  const { user, profile, loading } = useAuth()

  // 1️⃣ STILL LOADING? Show spinner. NEVER redirect while loading.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // 2️⃣ NO SESSION? → Login
  if (!user) return <Navigate to="/login" replace />

  // 3️⃣ PROFILE MISSING OR WRONG ROLE? → Login
  if (!profile || profile.role !== requiredRole) return <Navigate to="/login" replace />

  // 4️⃣ ALL GOOD → Render dashboard
  return <Outlet />
}