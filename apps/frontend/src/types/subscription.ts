export type PlanId = 'FREE' | 'SUBSCRIBED'

export interface Plan {
  id: PlanId
  name: string
  description?: string
}

// GET /subscription (API 53)
export interface SubscriptionResponse {
  subscription: { status: PlanId; subscribedAt: string | null }
  plans: Plan[]
}
