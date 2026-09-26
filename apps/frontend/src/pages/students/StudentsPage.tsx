import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

export default function StudentsPage() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F3F1E9] p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-10 text-center shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
        <h1 className="text-xl font-semibold text-gray-900">학생 관리</h1>
        <p className="mt-2 text-sm text-muted-foreground">{user?.email}님, 환영합니다.</p>
        <Button type="button" variant="outline" className="mt-6" onClick={logout}>
          로그아웃
        </Button>
      </div>
    </div>
  );
}
