import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { BREAKDOWN, DEMO_USER, SUBSCRIPTIONS, SUMMARY, TOKENS, UPCOMING, type ApiSubscription } from './fixtures'

const BASE = 'http://localhost:8000'
export const url = (path: string) => `${BASE}${path}`

/** Обработчики по умолчанию: «сервер» с набором подписок из fixtures.md и состоянием в памяти. */
export function createHandlers(initial: ApiSubscription[] = SUBSCRIPTIONS) {
  let items = initial.map((item) => ({ ...item }))
  return [
    http.post(url('/api/auth/login'), async ({ request }) => {
      const body = (await request.json()) as { email: string; password: string }
      if (body.email === DEMO_USER.email && body.password === 'demo-password') return HttpResponse.json(TOKENS)
      return HttpResponse.json({ detail: 'Incorrect email or password' }, { status: 401 })
    }),
    http.post(url('/api/auth/register'), async ({ request }) => {
      const body = (await request.json()) as { email: string }
      if (body.email === DEMO_USER.email) return HttpResponse.json({ detail: 'Email already registered' }, { status: 409 })
      return HttpResponse.json({ ...DEMO_USER, id: 2, email: body.email }, { status: 201 })
    }),
    http.post(url('/api/auth/refresh'), () => HttpResponse.json({ access_token: 'access-2', token_type: 'bearer' })),
    http.get(url('/api/auth/me'), () => HttpResponse.json(DEMO_USER)),
    http.get(url('/api/subscriptions'), ({ request }) => {
      const params = new URL(request.url).searchParams
      let result = items
      const q = params.get('q')
      if (q) result = result.filter((item) => item.name.toLowerCase().includes(q.toLowerCase()))
      const cycle = params.get('billing_cycle')
      if (cycle) result = result.filter((item) => item.billing_cycle === cycle)
      const active = params.get('is_active')
      if (active !== null) result = result.filter((item) => String(item.is_active) === active)
      return HttpResponse.json(result)
    }),
    http.get(url('/api/subscriptions/upcoming'), () => HttpResponse.json(UPCOMING)),
    http.post(url('/api/subscriptions'), async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>
      const created = {
        id: items.length + 10,
        custom_interval_days: null,
        is_active: true,
        note: null,
        next_billing_date: body.start_date,
        monthly_cost: body.amount,
        charge_date: body.start_date,
        days_until: 14,
        ...body,
      } as ApiSubscription
      items = [...items, created]
      return HttpResponse.json(created, { status: 201 })
    }),
    http.patch(url('/api/subscriptions/:id'), async ({ request, params }) => {
      const body = (await request.json()) as Partial<ApiSubscription>
      items = items.map((item) => (item.id === Number(params.id) ? { ...item, ...body } : item))
      return HttpResponse.json(items.find((item) => item.id === Number(params.id)))
    }),
    http.delete(url('/api/subscriptions/:id'), ({ params }) => {
      items = items.filter((item) => item.id !== Number(params.id))
      return new HttpResponse(null, { status: 204 })
    }),
    http.get(url('/api/stats/summary'), () => HttpResponse.json(SUMMARY)),
    http.get(url('/api/stats/breakdown'), () => HttpResponse.json(BREAKDOWN)),
  ]
}

export const server = setupServer(...createHandlers())
