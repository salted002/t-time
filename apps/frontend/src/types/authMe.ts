export interface AuthMe {
  user: { id: string; name: string; email: string }
  academy: {
    id: string
    name: string
    slug: string
    logoUrl: string | null
    phone: string | null
    address: string | null
    smsSenderNumber: string | null
    subscriptionStatus: 'FREE' | 'SUBSCRIBED'
  }
  isDemo: boolean
}
