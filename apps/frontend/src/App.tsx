import { Navigate, Route, Routes } from 'react-router-dom'

import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { AppLayout } from '@/components/layout/AppLayout'
import SignupPage from '@/pages/auth/SignupPage'
import LoginPage from '@/pages/auth/loginPage'
import StudentsPage from '@/pages/students/StudentsPage'
import ProtectedRoute from '@/router/ProtectedRoute'

function App() {
  return (
    <TooltipProvider>
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
        {/* 레이아웃 확인용 임시 페이지 (localhost:5173/hanbit/exams) */}
        <Route path="/:slug" element={<AppLayout />}>
          <Route path="students" element={<StudentsPage />} />
          <Route path="exams" element={<div>시험 관리 (임시)</div>} />
        </Route>
        <Route path="*" element={<Navigate to="/signup?step=academy" replace />} />
      </Routes>
      <Toaster />
    </TooltipProvider>
  )
}

export default App
