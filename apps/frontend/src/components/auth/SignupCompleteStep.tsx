import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SignupStepIndicator } from '@/pages/auth/SignupStepIndicator';

interface SignupCompleteStepProps {
  academyName: string;
  message: string;
  onContinue?: () => void;
}

export default function SignupCompleteStep({
  academyName,
  message,
  onContinue,
}: SignupCompleteStepProps) {
  return (
    <div className="min-h-screen bg-[#F3F1E9] px-6 py-10">
      <div className="mx-auto w-full max-w-[520px] rounded-2xl bg-white p-10 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
        <SignupStepIndicator currentStep={3} />

        <div className="flex flex-col items-center py-6 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#3F6D59]">
            <Check className="h-8 w-8 text-white" />
          </span>
          <h1 className="mt-6 text-xl font-semibold text-gray-900">{academyName}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>

          <Button
            type="button"
            onClick={onContinue}
            className="mt-8 w-full bg-[#3F6D59] text-white hover:bg-[#375D4C]"
          >
            학생 관리 시작하기 →
          </Button>
        </div>
      </div>
    </div>
  );
}
