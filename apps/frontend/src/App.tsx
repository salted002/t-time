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
import StudentDetailPage from '@/pages/students/StudentDetailPage'
import AcademySettingsPage from '@/pages/settings/AcademySettingsPage'
import PasswordChangePage from '@/pages/settings/PasswordChangePage'
import ComponentsPage from '@/pages/dev/ComponentsPage'
import ProtectedRoute from '@/router/ProtectedRoute'
import AdminProtectedRoute from '@/router/AdminProtectedRoute'
import AdminLoginPage from '@/pages/admin/AdminLoginPage'
import AdminAcademyListPage from '@/pages/admin/AdminAcademyListPage'
import ExamListPage from './pages/exams/ExamListPage'
import ExamFormPage from './pages/exams/ExamFormPage'
import ExamDetailPage from './pages/exams/ExamDetailPage'
import ExamResultFormPage from './pages/exams/ExamResultFormPage'
import ReportListPage from '@/pages/reports/ReportListPage'
import ClassListPage from '@/pages/classes/ClassListPage'
import MessageLogListPage from '@/pages/message-logs/MessageLogListPage'
import ReportBuildPage from '@/pages/reports/ReportBuildPage'
import ReportDetailPage from '@/pages/reports/ReportDetailPage'
import SharedReportPage from '@/pages/share/SharedReportPage'
import StudentExamDetailPage from '@/pages/students/StudentExamDetailPage'
import TemplateListPage from '@/pages/messages/TemplateListPage'

function App() {
  return (
    <TooltipProvider>
      <ConfirmProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* 운영자 페이지: 로그인은 레이아웃 밖, 나머지는 운영자 토큰이 있어야 접근 */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<Navigate to="academies" replace />} />
            <Route path="academies" element={<AdminAcademyListPage />} />
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
            <Route path="students/new" element={<StudentListPage />} />
            <Route path="students/:studentId" element={<StudentDetailPage />} />
            <Route path="students/:studentId/exams/:examId" element={<StudentExamDetailPage />} />
            <Route path="exams" element={<ExamListPage />} />
            <Route path="exams/new" element={<ExamFormPage />} />
            <Route path="exams/:examId" element={<ExamDetailPage />} />
            <Route path="exams/:examId/edit" element={<ExamFormPage />} />
            <Route path="exams/:examId/results" element={<ExamResultFormPage />} />
            <Route path="reports" element={<ReportListPage />} />
            <Route path="classes" element={<ClassListPage />} />
            <Route path="message-logs" element={<MessageLogListPage />} />
            <Route path="reports/new" element={<ReportBuildPage />} />
            <Route path="reports/:reportId" element={<ReportDetailPage />} />
            <Route path="templates" element={<TemplateListPage />} />

            <Route path="settings" element={<AcademySettingsPage />} />
            <Route path="settings/password" element={<PasswordChangePage />} />
          </Route>

          {/* 학부모 리포트 공유용 페이지 링크 (링크만 있으면 누구나 접속 가능) */}
          <Route path="/share/:token" element={<SharedReportPage />} />

          {import.meta.env.DEV && <Route path="/dev/components" element={<ComponentsPage />} />}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ConfirmProvider>

      <Toaster />
    </TooltipProvider>
  )
}

export default App
