import { Navigate, Route, Routes } from 'react-router-dom'
import SignupPage from '@/pages/auth/SignupPage'
import LoginPage from '@/pages/auth/loginPage'
import StudentsPage from '@/pages/students/StudentsPage'
import ProtectedRoute from '@/router/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/students"
        element={
          <ProtectedRoute>
            <StudentsPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/signup?step=academy" replace />} />
    </Routes>
  )
}

export default App
