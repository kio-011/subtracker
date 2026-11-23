import { screen, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@/test/renderApp'
import { server, url } from '@/test/server'

const nbsp = (text: string) => text.replace(/\s/g, ' ')

describe('Обзор (spec раздел 10)', () => {
  it('10.1 итоги за месяц и за год из статистики', async () => {
    renderApp({ route: '/overview', signedIn: true })
    expect(await screen.findByText('62,10 $', { exact: false })).toBeInTheDocument()
    expect(nbsp(document.body.textContent ?? '')).toContain('745,20 $')
  })

  it('10.2 ближайшие списания на 7 дней: название, сумма, дата и «через N дней»', async () => {
    renderApp({ route: '/overview', signedIn: true })
    const section = (await screen.findByRole('heading', { name: 'Ближайшие списания' })).closest('section')!
    const gym = await within(section).findByText('Gym pass')
    expect(gym.closest('li')).toHaveTextContent('списание 24 нояб., через 1 день')
    expect(within(section).getByText('Netflix').closest('li')).toHaveTextContent('через 2 дня')
  })

  it('10.2 нет списаний: «В ближайшие 7 дней списаний нет»', async () => {
    server.use(http.get(url('/api/subscriptions/upcoming'), () => HttpResponse.json([])))
    renderApp({ route: '/overview', signedIn: true })
    expect(await screen.findByText('В ближайшие 7 дней списаний нет')).toBeInTheDocument()
  })

  it('10.3 доли числом по подпискам и по периодам', async () => {
    renderApp({ route: '/overview', signedIn: true })
    const section = (await screen.findByRole('heading', { name: 'Доли расходов' })).closest('section')!
    expect(await within(section).findByText('По подпискам')).toBeInTheDocument()
    expect(nbsp(section.textContent ?? '')).toContain('26,00 $ · 41,87%')
    expect(nbsp(section.textContent ?? '')).toContain('каждый месяц (2)')
    expect(nbsp(section.textContent ?? '')).toContain('26,48 $ · 42,64%')
  })

  it('10.3 нет активных подписок: «Активных подписок пока нет» и ссылка на добавление', async () => {
    server.use(
      http.get(url('/api/stats/breakdown'), () =>
        HttpResponse.json({ currency: 'USD', monthly_total: '0.00', by_subscription: [], by_cycle: [] }),
      ),
    )
    renderApp({ route: '/overview', signedIn: true })
    expect(await screen.findByText('Активных подписок пока нет')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Добавить подписку' })).toHaveAttribute('href', '/subscriptions')
  })

  it('10.4 блоки независимы: ошибка итогов не мешает остальным, «Повторить» перезапрашивает', async () => {
    let calls = 0
    server.use(
      http.get(url('/api/stats/summary'), () => {
        calls += 1
        return calls === 1
          ? HttpResponse.json({ detail: 'x' }, { status: 500 })
          : HttpResponse.json({ monthly_total: '62.10', yearly_total: '745.20', currency: 'USD' })
      }),
    )
    const { user } = renderApp({ route: '/overview', signedIn: true })
    expect(await screen.findByText('Не удалось загрузить итоги')).toBeInTheDocument()
    expect((await screen.findAllByText('Gym pass')).length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: 'Повторить' }))
    expect(await screen.findByText('62,10 $', { exact: false })).toBeInTheDocument()
    expect(calls).toBe(2)
  })

  it('навигация: текущий раздел отмечен aria-current="page"', async () => {
    renderApp({ route: '/overview', signedIn: true })
    expect(await screen.findByRole('link', { name: 'Обзор' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Подписки' })).not.toHaveAttribute('aria-current')
  })
})
