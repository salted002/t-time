import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import type { FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImagePlus, X } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SignupStepIndicator } from '@/pages/auth/SignupStepIndicator';
import { ACADEMY_INFO_FIELD_ORDER, academyInfoSchema } from '@/types/academy';
import type { AcademyInfoFormValues } from '@/types/academy';

interface AvailabilityResponse {
  success: boolean;
  available: { slug: boolean; businessNumber: boolean };
  message: string;
}

function RequiredMark() {
  return <span className="text-red-500">*</span>;
}

interface SignupStep1PageProps {
  academyInfo?: AcademyInfoFormValues | null;
  onNext?: (data: AcademyInfoFormValues) => void;
  onCancel?: () => void;
}

export default function SignupStep1Page({ academyInfo, onNext, onCancel }: SignupStep1PageProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [errorPopup, setErrorPopup] = useState<{ title: string; messages: string[] } | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AcademyInfoFormValues>({
    resolver: zodResolver(academyInfoSchema),
    defaultValues: academyInfo ?? undefined,
  });

  useEffect(() => {
    if (!academyInfo?.logo) return;

    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(academyInfo.logo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setValue('logo', file, { shouldValidate: true });
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setValue('logo', undefined, { shouldValidate: true });
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCancel = () => {
    reset();
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onCancel?.();
  };

  const handleInvalid = (formErrors: FieldErrors<AcademyInfoFormValues>) => {
    const messages = ACADEMY_INFO_FIELD_ORDER.map((field) => formErrors[field]?.message).filter(
      (message): message is string => Boolean(message)
    );
    if (messages.length > 0) {
      setErrorPopup({ title: '입력 확인이 필요합니다', messages });
    }
  };

  const onSubmit = handleSubmit(async (data) => {
    setIsChecking(true);
    try {
      const response = await api.post<AvailabilityResponse>('/academies/availability', null, {
        params: {
          slug: data.academySlug,
          businessNumber: data.businessRegistrationNumber,
        },
      });

      const { available } = response.data;
      const messages: string[] = [];
      if (!available.slug) messages.push('입력한 학원슬러그가 사용 중으로 재입력을 하세요');
      if (!available.businessNumber) {
        messages.push('입력한 사업자등록번호가 사용 중으로 재입력을 하세요');
      }

      if (messages.length > 0) {
        setErrorPopup({ title: '확인이 필요합니다', messages });
        return;
      }

      onNext?.(data);
    } catch {
      setErrorPopup({
        title: '오류가 발생했습니다',
        messages: ['확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'],
      });
    } finally {
      setIsChecking(false);
    }
  }, handleInvalid);

  return (
    <div className="min-h-screen bg-[#F3F1E9] px-6 py-10">
      <div className="mx-auto w-full max-w-[520px] rounded-2xl bg-white p-10 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
        <SignupStepIndicator currentStep={1} />

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="academyName" className="gap-1">
              학원명 <RequiredMark />
            </Label>
            <Input id="academyName" placeholder="한빛영어학원" {...register('academyName')} />
            {errors.academyName && (
              <p className="text-xs text-red-500">{errors.academyName.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="representativePhone" className="gap-1">
              대표연락처 <RequiredMark />
            </Label>
            <Input
              id="representativePhone"
              placeholder="032-123-4567"
              {...register('representativePhone')}
            />
            {errors.representativePhone && (
              <p className="text-xs text-red-500">{errors.representativePhone.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="academySlug" className="gap-1">
              학원 슬러그 <RequiredMark />
            </Label>
            <Input id="academySlug" placeholder="hanbit" {...register('academySlug')} />
            {errors.academySlug ? (
              <p className="text-xs text-red-500">{errors.academySlug.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">hanbit.t-time.kr 형태로 사용됩니다</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="logo">학원 로고</Label>
            <div className="flex items-center gap-3">
              <label
                htmlFor="logo"
                className="flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-400 transition-colors hover:border-gray-400 hover:text-gray-500"
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="학원 로고 미리보기" className="h-full w-full object-cover" />
                ) : (
                  <ImagePlus className="h-5 w-5" />
                )}
              </label>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    이미지 업로드
                  </Button>
                  {logoPreview && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveLogo}
                      className="text-muted-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                      삭제
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">PNG, JPG (최대 5MB, 선택 사항)</p>
              </div>
              <input
                ref={fileInputRef}
                id="logo"
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={handleLogoChange}
              />
            </div>
            {errors.logo && <p className="text-xs text-red-500">{errors.logo.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address">주소</Label>
            <Input id="address" placeholder="인천 부평구 ..." {...register('address')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="businessRegistrationNumber" className="gap-1">
              사업자등록번호 <RequiredMark />
            </Label>
            <Input
              id="businessRegistrationNumber"
              placeholder="123-45-67890"
              {...register('businessRegistrationNumber')}
            />
            {errors.businessRegistrationNumber && (
              <p className="text-xs text-red-500">{errors.businessRegistrationNumber.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="representativeName">대표자명</Label>
            <Input id="representativeName" placeholder="김선주" {...register('representativeName')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="smsSenderNumber">SMS 발신번호</Label>
            <Input
              id="smsSenderNumber"
              placeholder="032-123-4567"
              {...register('smsSenderNumber')}
            />
            {errors.smsSenderNumber && (
              <p className="text-xs text-red-500">{errors.smsSenderNumber.message}</p>
            )}
            <div className="rounded-lg bg-[#E7F0F5] px-4 py-3 text-xs leading-relaxed text-[#4A6B80]">
              대표 발신번호는 SMS 발신 승인 신청 시 필요하며 학원 설정에서 언제든 입력할 수 있습니다.
            </div>
          </div>

          <div className="flex items-center justify-between pt-3">
            <Button type="button" variant="outline" className="px-5" onClick={handleCancel}>
              취소
            </Button>
            <Button
              type="submit"
              disabled={isChecking}
              className="bg-[#3F6D59] px-5 text-white hover:bg-[#375D4C]"
            >
              {isChecking ? '확인 중...' : '다음 단계 →'}
            </Button>
          </div>
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
