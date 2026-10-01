import { Navigate, Route, Routes } from 'react-router-dom'

import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { AppLayout } from '@/components/layout/AppLayout'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { ConfirmProvider } from '@/components/common/ConfirmDialog'

import LandingPage from '@/pages/landing/LandingPage'
import SignupPage from '@/pages/auth/SignupPage'
import LoginPage from '@/pages/auth/loginPage'
import StudentListPage from '@/pages/students/StudentListPage'
import ComponentsPage from '@/pages/dev/ComponentsPage'
import ProtectedRoute from '@/router/ProtectedRoute'
import ExamListPage from './pages/exams/ExamListPage'
import ExamFormPage from './pages/exams/ExamFormPage'
import ExamDetailPage from './pages/exams/ExamDetailPage'
import ExamResultFormPage from './pages/exams/ExamResultFormPage'

function App() {
  return (
    <TooltipProvider>
      <ConfirmProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* 운영자 페이지 (운영자 인증은 AdminAuthContext 구현 후 보호 예정) */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="academies" element={<div>학원 목록 (임시)</div>} />
          </Route>

          {/* 학원 관리자 영역: 로그인·slug 검증을 레이아웃 한 곳에서 처리 */}
          <Route
            path="/:slug"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="students" replace />} />
            <Route path="students" element={<StudentListPage />} />
            <Route path="exams" element={<ExamListPage />} />
            <Route path="exams/new" element={<ExamFormPage />} />
            <Route path="exams/:examId" element={<ExamDetailPage />} />
            <Route path="exams/:examId/edit" element={<ExamFormPage />} />
            <Route path="exams/:examId/results" element={<ExamResultFormPage />} />
          </Route>

          {import.meta.env.DEV && <Route path="/dev/components" element={<ComponentsPage />} />}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ConfirmProvider>

      <Toaster />
    </TooltipProvider>
  )
}

export default App
