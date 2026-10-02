import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';

import { adminApi, getAdminToken, setAdminToken } from '@/api/adminApi';
import { FormField } from '@/components/common/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getErrorMessage } from '@/lib/errors';

const adminLoginSchema = z.object({
  email: z.string().trim().min(1, 'ID를 입력해주세요.'),
  password: z.string().min(1, 'PW를 입력해주세요.'),
});

type AdminLoginValues = z.infer<typeof adminLoginSchema>;

// 운영자로그인페이지 (SCR-ADMIN-LOGIN)
export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { control, handleSubmit, formState } = useForm<AdminLoginValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { email: '', password: '' },
  });

  if (getAdminToken()) {
    return <Navigate to="/admin/academies" replace />;
  }

  const onSubmit = async (values: AdminLoginValues) => {
    try {
      const { token } = await adminApi.login(values.email, values.password);
      setAdminToken(token);
      toast.success('운영자 콘솔 계정으로 접속하였습니다.');
      navigate('/admin/academies', { replace: true });
    } catch (e) {
      toast.error(getErrorMessage(e, '로그인에 실패했습니다.'));
    }
  };

  return (
    <div className="theme-console flex min-h-screen items-center justify-center bg-sidebar px-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex w-full max-w-[320px] flex-col gap-4 rounded-2xl bg-card p-8 shadow-xl"
      >
        <h1 className="pb-2 text-center text-lg font-bold text-sidebar">T · TIME ADMIN</h1>

        <FormField control={control} name="email" label="ID">
          {(field) => <Input {...field} autoComplete="username" autoFocus />}
        </FormField>

        <FormField control={control} name="password" label="PW">
          {(field) => <Input {...field} type="password" autoComplete="current-password" />}
        </FormField>

        <Button type="submit" disabled={formState.isSubmitting} className="mt-1 w-full">
          {formState.isSubmitting ? '로그인 중...' : '로그인'}
        </Button>
      </form>
    </div>
  );
}
