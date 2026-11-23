// Общий набор данных из frontend/fixtures.md: тот же, что в макете и в демо бэкенда.
// Формат ответов совпадает с настоящим API (суммы строками, имена полей snake_case).

export const DEMO_USER = { id: 1, email: 'demo@example.com', plan: 'free', default_currency: 'USD' }

export interface ApiSubscription {
  id: number
  name: string
  amount: string
  billing_cycle: 'monthly' | 'yearly' | 'weekly' | 'custom_days'
  custom_interval_days: number | null
  is_active: boolean
  start_date: string
  next_billing_date: string
  note: string | null
  monthly_cost: string
  charge_date: string | null
  days_until: number | null
}

export const SUBSCRIPTIONS: ApiSubscription[] = [
  { id: 1, name: 'Netflix', amount: '15.49', billing_cycle: 'monthly', custom_interval_days: null, is_active: true, start_date: '2026-01-25', next_billing_date: '2026-11-25', note: null, monthly_cost: '15.49', charge_date: '2026-11-25', days_until: 2 },
  { id: 2, name: 'Spotify', amount: '10.99', billing_cycle: 'monthly', custom_interval_days: null, is_active: true, start_date: '2026-01-02', next_billing_date: '2026-12-02', note: null, monthly_cost: '10.99', charge_date: '2026-12-02', days_until: 9 },
  { id: 3, name: 'iCloud+ (annual)', amount: '35.88', billing_cycle: 'yearly', custom_interval_days: null, is_active: true, start_date: '2026-03-23', next_billing_date: '2027-03-23', note: null, monthly_cost: '2.99', charge_date: '2027-03-23', days_until: 120 },
  { id: 4, name: 'Gym pass', amount: '6.00', billing_cycle: 'weekly', custom_interval_days: null, is_active: true, start_date: '2026-01-05', next_billing_date: '2026-11-24', note: null, monthly_cost: '26.00', charge_date: '2026-11-24', days_until: 1 },
  { id: 5, name: 'VPN (every 90 days)', amount: '19.90', billing_cycle: 'custom_days', custom_interval_days: 90, is_active: true, start_date: '2026-09-19', next_billing_date: '2026-12-18', note: null, monthly_cost: '6.63', charge_date: '2026-12-18', days_until: 25 },
]

export const NEW_SUBSCRIPTION: ApiSubscription = {
  id: 6, name: 'Dropbox Plus', amount: '11.99', billing_cycle: 'monthly', custom_interval_days: null, is_active: true,
  start_date: '2026-12-07', next_billing_date: '2026-12-07', note: null, monthly_cost: '11.99', charge_date: '2026-12-07', days_until: 14,
}

export const PAUSED_SUBSCRIPTION: ApiSubscription = {
  id: 7, name: 'Курс английского', amount: '12.00', billing_cycle: 'monthly', custom_interval_days: null, is_active: false,
  start_date: '2026-02-01', next_billing_date: '2026-12-01', note: null, monthly_cost: '12.00', charge_date: null, days_until: null,
}

export const TOKENS = { access_token: 'access-1', refresh_token: 'refresh-1', token_type: 'bearer' }

export const SUMMARY = { monthly_total: '62.10', yearly_total: '745.20', currency: 'USD' }

export const UPCOMING = [
  { id: 4, name: 'Gym pass', amount: '6.00', billing_cycle: 'weekly', charge_date: '2026-11-24', days_until: 1 },
  { id: 1, name: 'Netflix', amount: '15.49', billing_cycle: 'monthly', charge_date: '2026-11-25', days_until: 2 },
]

export const BREAKDOWN = {
  currency: 'USD',
  monthly_total: '62.10',
  by_subscription: [
    { id: 4, name: 'Gym pass', billing_cycle: 'weekly', monthly_cost: '26.00', share_percent: '41.87' },
    { id: 1, name: 'Netflix', billing_cycle: 'monthly', monthly_cost: '15.49', share_percent: '24.94' },
    { id: 2, name: 'Spotify', billing_cycle: 'monthly', monthly_cost: '10.99', share_percent: '17.70' },
    { id: 5, name: 'VPN (every 90 days)', billing_cycle: 'custom_days', monthly_cost: '6.63', share_percent: '10.68' },
    { id: 3, name: 'iCloud+ (annual)', billing_cycle: 'yearly', monthly_cost: '2.99', share_percent: '4.81' },
  ],
  by_cycle: [
    { billing_cycle: 'monthly', subscription_count: 2, monthly_cost: '26.48', share_percent: '42.64' },
    { billing_cycle: 'weekly', subscription_count: 1, monthly_cost: '26.00', share_percent: '41.87' },
    { billing_cycle: 'custom_days', subscription_count: 1, monthly_cost: '6.63', share_percent: '10.68' },
    { billing_cycle: 'yearly', subscription_count: 1, monthly_cost: '2.99', share_percent: '4.81' },
  ],
}
