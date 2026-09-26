import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import type { FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { LOGIN_FIELD_ORDER, loginSchema } from '@/types/auth';
import type { LoginFormValues } from '@/types/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorPopup, setErrorPopup] = useState<{ title: string; messages: string[] } | null>(
    null
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: true },
  });

  const handleInvalid = (formErrors: FieldErrors<LoginFormValues>) => {
    const messages = LOGIN_FIELD_ORDER.map((field) => formErrors[field]?.message).filter(
      (message): message is string => Boolean(message)
    );
    if (messages.length > 0) {
      setErrorPopup({ title: '입력 확인이 필요합니다', messages });
    }
  };

  const onSubmit = handleSubmit(async (data) => {
    setIsSubmitting(true);
    try {
      await login(data.email, data.password, data.rememberMe);
      navigate('/students');
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data as { message?: string } | undefined)?.message
        : undefined;
      setErrorPopup({
        title: '로그인에 실패했습니다',
        messages: [message ?? '이메일 또는 비밀번호를 확인해주세요.'],
      });
    } finally {
      setIsSubmitting(false);
    }
  }, handleInvalid);

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <div className="hidden flex-1 flex-col justify-center bg-[#2C4F41] px-16 py-20 lg:flex">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#F3F1E9]">
            <Check className="h-4 w-4 text-[#2C4F41]" />
          </span>
          <span className="text-lg font-bold text-white">티타임</span>
        </div>
        <h1 className="mt-16 text-4xl font-bold leading-tight text-white">
          학원 운영을
          <br />
          한눈에
        </h1>
        <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/70">
          성적 입력부터 학부모 알림톡 발송까지,
          <br />
          학원 업무를 한 곳에서 관리하세요.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-white px-6 py-16">
        <form onSubmit={onSubmit} className="w-full max-w-[320px] space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="email">이메일(로그인 아이디)</Label>
            <Input id="email" type="email" placeholder="admin@hanbit.kr" {...register('email')} />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">비밀번호</Label>
            <Input id="password" type="password" {...register('password')} />
            {errors.password && (
              <p className="text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name="rememberMe"
              render={({ field }) => (
                <Checkbox
                  id="rememberMe"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="rememberMe" className="text-sm font-normal text-gray-700">
              로그인 상태 유지
            </Label>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#3F6D59] text-white hover:bg-[#375D4C]"
          >
            {isSubmitting ? '로그인 중...' : '로그인'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            학원을 처음 등록하시나요?{' '}
            <Link
              to="/signup?step=academy"
              className="font-medium text-[#3F6D59] underline underline-offset-2 hover:text-[#375D4C]"
            >
              학원 계정 만들기
            </Link>
          </p>
        </form>
      </div>

      <AlertDialog open={errorPopup !== null} onOpenChange={(open) => !open && setErrorPopup(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{errorPopup?.title}</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-line">
              {errorPopup?.messages.join('\n')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorPopup(null)}>확인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
