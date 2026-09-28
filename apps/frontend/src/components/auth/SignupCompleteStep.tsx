import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Stepper } from '@/components/common/Stepper'

interface SignupCompleteStepProps {
  academyName: string
  message: string
  onContinue?: () => void
}

export default function SignupCompleteStep({
  academyName,
  message,
  onContinue,
}: SignupCompleteStepProps) {
  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <Card className="mx-auto w-full max-w-130 px-8 py-12">
        <CardContent>
          <div className="mb-6 px-2">
            <Stepper steps={['학원 정보', '계정 정보', '완료']} current={2} />
          </div>

          <div className="flex flex-col items-center py-6 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
              <Check className="h-8 w-8 text-primary-foreground" />
            </span>
            <h1 className="mt-6 text-xl font-semibold text-foreground">{academyName}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>

            <Button type="button" onClick={onContinue} className="mt-8 w-full">
              학생 관리 시작하기 →
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
