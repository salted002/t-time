import { Navigate, Route, Routes, useParams } from 'react-router-dom';

import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { AppLayout } from '@/components/layout/AppLayout'
import { AdminLayout } from '@/components/layout/AdminLayout'

import SignupPage from '@/pages/auth/SignupPage';
import LoginPage from '@/pages/auth/loginPage';
import StudentListPage from '@/pages/students/StudentListPage';
import ProtectedRoute from '@/router/ProtectedRoute';

// slug 불일치로 "/{내 slug}/"로 리다이렉트된 뒤, 실제 화면인 학생 목록으로 이어주는 보조 라우트
function AcademyRoot() {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={`/${slug}/students`} replace />;
}
import ComponentsPage from './pages/dev/ComponentsPage'
import { ConfirmProvider } from './components/common/ConfirmDialog'

function App() {
  return (
    <TooltipProvider>
      <ConfirmProvider>
        <Routes>
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/:slug/students"
            element={
          <ProtectedRoute>
            <StudentListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/:slug"
        element={
              <ProtectedRoute>
                <AcademyRoot />
              </ProtectedRoute>
            }
          />
          {/* 레이아웃 확인용 임시 페이지 (localhost:5173/hanbit/exams) */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="academies" element={<div>학원 목록 (임시)</div>} />
          </Route>
          <Route path="/:slug" element={<AppLayout />}>
            <Route path="exams" element={<div>시험 관리 (임시)</div>} />
          </Route>
          <Route path="/dev/components" element={<ComponentsPage />} />

          <Route path="*" element={<Navigate to="/signup?step=academy" replace />} />
        </Routes>
      </ConfirmProvider>

      <Toaster />
    </TooltipProvider>
  );
}

export default App;
