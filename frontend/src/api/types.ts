// Типы данных API (после преобразования в camelCase). Суммы приходят строками, даты строками YYYY-MM-DD.

export type BillingCycle = 'monthly' | 'yearly' | 'weekly' | 'custom_days'

export interface User {
  id: number
  email: string
  plan: string
  defaultCurrency: string
}

export interface Tokens {
  accessToken: string
  refreshToken: string
  tokenType: string
}

export interface Subscription {
  id: number
  name: string
  amount: string
  billingCycle: BillingCycle
  customIntervalDays: number | null
  isActive: boolean
  startDate: string
  nextBillingDate: string
  note: string | null
  monthlyCost: string
  chargeDate: string | null
  daysUntil: number | null
}

export interface SubscriptionInput {
  name: string
  amount: string
  billingCycle: BillingCycle
  customIntervalDays?: number | null
  startDate: string
  note?: string | null
  isActive?: boolean
}

export type SubscriptionPatch = Partial<SubscriptionInput>

export interface ListParams {
  q?: string
  billingCycle?: BillingCycle
  isActive?: boolean
  sort?: 'id' | 'name' | 'amount' | 'monthly_cost' | 'charge_date'
  order?: 'asc' | 'desc'
}

export interface UpcomingCharge {
  id: number
  name: string
  amount: string
  billingCycle: BillingCycle
  chargeDate: string
  daysUntil: number
}

export interface StatsSummary {
  monthlyTotal: string
  yearlyTotal: string
  currency: string
}

export interface SubscriptionShare {
  id: number
  name: string
  billingCycle: BillingCycle
  monthlyCost: string
  sharePercent: string
}

export interface CycleShare {
  billingCycle: BillingCycle
  subscriptionCount: number
  monthlyCost: string
  sharePercent: string
}

export interface StatsBreakdown {
  currency: string
  monthlyTotal: string
  bySubscription: SubscriptionShare[]
  byCycle: CycleShare[]
}
