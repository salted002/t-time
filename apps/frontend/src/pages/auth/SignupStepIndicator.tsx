import { Fragment } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { step: 1, label: '학원 정보' },
  { step: 2, label: '계정 정보' },
  { step: 3, label: '완료' },
];

export function SignupStepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-9 flex items-center">
      {STEPS.map((s, idx) => {
        const isDone = s.step < currentStep;
        const isCurrentOrDone = s.step <= currentStep;
        return (
          <Fragment key={s.step}>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                  isCurrentOrDone ? 'bg-[#3F6D59] text-white' : 'bg-[#EFEBE1] text-[#A39C8C]'
                )}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : s.step}
              </span>
              <span
                className={cn(
                  'text-sm',
                  s.step === currentStep ? 'font-semibold text-gray-900' : 'text-[#A39C8C]'
                )}
              >
                {s.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <span
                className={cn('mx-3 h-px flex-1', isDone ? 'bg-[#A9C4B8]' : 'bg-[#E4DFD2]')}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
