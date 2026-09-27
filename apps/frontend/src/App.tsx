import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import SignupPage from '@/pages/auth/SignupPage';
import LoginPage from '@/pages/auth/loginPage';
import StudentListPage from '@/pages/students/StudentListPage';
import ProtectedRoute from '@/router/ProtectedRoute';

// slug 불일치로 "/{내 slug}/"로 리다이렉트된 뒤, 실제 화면인 학생 목록으로 이어주는 보조 라우트
function AcademyRoot() {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={`/${slug}/students`} replace />;
}

function App() {
  return (
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
      <Route path="*" element={<Navigate to="/signup?step=academy" replace />} />
    </Routes>
  );
}

export default App;
