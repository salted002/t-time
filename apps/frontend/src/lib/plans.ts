import type { PlanId } from '@/types/subscription'

/**
 * 플랜 이름·요금·기능 표시용 상수. 구독 관리 페이지, 사이드바 플랜 카드, 대시보드 안내 띠가 함께 쓴다.
 * 결제는 연동하지 않으므로 요금은 화면 표시용이다. (GET /subscription의 plans[].name은 사용하지 않는다)
 */
export const PLAN_INFO: Record<
  PlanId,
  { name: string; tagline: string; price: string; priceUnit?: string }
> = {
  FREE: {
    name: 'FREE',
    tagline: '성적 관리를 시작하는 학원을 위한 기본 플랜',
    price: '무료',
  },
  SUBSCRIBED: {
    name: 'AI PRO',
    tagline: 'AI로 피드백과 분석까지 맡기는 플랜',
    price: '5,000원',
    priceUnit: '/ 월',
  },
}

// 플랜 비교표. free/pro가 true면 ✓, false면 –
export const PLAN_COMPARE: { name: string; free: boolean; pro: boolean }[] = [
  { name: '기본 성적 관리', free: true, pro: true },
  { name: 'SMS 발송', free: true, pro: true },
  { name: 'AI 피드백', free: false, pro: true },
  { name: '시험/통계/리포트 AI 분석', free: false, pro: true },
]
