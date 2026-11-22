import { request } from './client'
import type {
  ListParams,
  StatsBreakdown,
  StatsSummary,
  Subscription,
  SubscriptionInput,
  SubscriptionPatch,
  Tokens,
  UpcomingCharge,
  User,
} from './types'

export const authApi = {
  login: (email: string, password: string, signal?: AbortSignal) =>
    request<Tokens>('/api/auth/login', { method: 'POST', body: { email, password }, auth: false, signal }),
  register: (email: string, password: string) =>
    request<User>('/api/auth/register', { method: 'POST', body: { email, password }, auth: false }),
  me: (signal?: AbortSignal) => request<User>('/api/auth/me', { signal }),
}

export const subscriptionsApi = {
  list: (params: ListParams = {}, signal?: AbortSignal) =>
    request<Subscription[]>('/api/subscriptions', {
      query: {
        q: params.q?.trim() || undefined,
        billing_cycle: params.billingCycle,
        is_active: params.isActive,
        sort: params.sort,
        order: params.order,
      },
      signal,
    }),
  create: (input: SubscriptionInput) => request<Subscription>('/api/subscriptions', { method: 'POST', body: input }),
  update: (id: number, patch: SubscriptionPatch) =>
    request<Subscription>(`/api/subscriptions/${id}`, { method: 'PATCH', body: patch }),
  remove: (id: number) => request<void>(`/api/subscriptions/${id}`, { method: 'DELETE' }),
  upcoming: (days = 7, signal?: AbortSignal) =>
    request<UpcomingCharge[]>('/api/subscriptions/upcoming', { query: { days }, signal }),
}

export const statsApi = {
  summary: (signal?: AbortSignal) => request<StatsSummary>('/api/stats/summary', { signal }),
  breakdown: (signal?: AbortSignal) => request<StatsBreakdown>('/api/stats/breakdown', { signal }),
}
