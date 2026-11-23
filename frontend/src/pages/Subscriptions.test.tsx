import { screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, delay, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { PAUSED_SUBSCRIPTION, SUBSCRIPTIONS } from '@/test/fixtures'
import { renderApp, trackRequests } from '@/test/renderApp'
import { server, url } from '@/test/server'

const listCalls = (seen: { method: string; url: string }[]) =>
  seen.filter((r) => r.method === 'GET' && new URL(r.url).pathname === '/api/subscriptions')

describe('Список подписок (spec раздел 4)', () => {
  it('4.1 загрузка: скелетон с aria-busy и текст «Загружаем подписки…»', async () => {
    server.use(
      http.get(url('/api/subscriptions'), async () => {
        await delay(300)
        return HttpResponse.json(SUBSCRIPTIONS)
      }),
    )
    renderApp({ route: '/subscriptions', signedIn: true })
    expect(await screen.findByText('Загружаем подписки…', { selector: 'p' })).toBeInTheDocument()
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull()
    expect(await screen.findByText('Netflix')).toBeInTheDocument()
  })

  it('4.2 пустой ответ: «Подписок пока нет» и кнопка «Добавить подписку»', async () => {
    server.use(http.get(url('/api/subscriptions'), () => HttpResponse.json([])))
    renderApp({ route: '/subscriptions', signedIn: true })
    expect(await screen.findByText('Подписок пока нет')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Добавить подписку' }).length).toBeGreaterThanOrEqual(2)
  })

  it('4.3 результат: название, сумма, период, дата списания и стоимость в месяц из данных API', async () => {
    renderApp({ route: '/subscriptions', signedIn: true })
    const list = await screen.findByRole('list', { name: 'Список подписок' })
    const netflix = within(list).getByText('Netflix').closest('li')!
    expect(netflix).toHaveTextContent('15,49')
    expect(netflix).toHaveTextContent('каждый месяц · списание 25 нояб., через 2 дня')
    expect(netflix).toHaveTextContent('в месяц')
    const icloud = within(list).getByText('iCloud+ (annual)').closest('li')!
    expect(icloud).toHaveTextContent('35,88')
    expect(icloud).toHaveTextContent('каждый год · списание 23 мар., через 120 дней')
    expect(icloud).toHaveTextContent('2,99')
    expect(within(list).getByText('VPN (every 90 days)').closest('li')).toHaveTextContent('каждые 90 дней')
    expect(screen.getByRole('status')).toHaveTextContent('5 подписок')
  })

  it('4.4 ошибка загрузки: сообщение и «Повторить» делает новый запрос', async () => {
    let calls = 0
    server.use(
      http.get(url('/api/subscriptions'), () => {
        calls += 1
        return calls === 1 ? HttpResponse.json({ detail: 'oops' }, { status: 500 }) : HttpResponse.json(SUBSCRIPTIONS)
      }),
    )
    const { user } = renderApp({ route: '/subscriptions', signedIn: true })
    expect(await screen.findByText('Не удалось загрузить подписки')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Повторить' }))
    expect(await screen.findByText('Netflix')).toBeInTheDocument()
    expect(calls).toBe(2)
  })

  it('4.5 приостановленная подписка помечена «Приостановлена» без даты списания', async () => {
    server.use(http.get(url('/api/subscriptions'), () => HttpResponse.json([PAUSED_SUBSCRIPTION])))
    renderApp({ route: '/subscriptions', signedIn: true })
    const row = (await screen.findByText('Курс английского')).closest('li')!
    expect(within(row).getByText('Приостановлена')).toBeInTheDocument()
    expect(row).not.toHaveTextContent('списание')
  })
})

describe('Поиск, фильтры, сортировка (spec 9.1–9.4)', () => {
  it('9.1 поиск уходит в запрос параметром q после паузы', async () => {
    const seen = trackRequests(server)
    const { user } = renderApp({ route: '/subscriptions', signedIn: true })
    await screen.findByText('Netflix')
    await user.type(screen.getByRole('searchbox', { name: 'Поиск по названию' }), 'spot')
    await waitFor(() => expect(screen.queryByText('Netflix')).not.toBeInTheDocument())
    expect(screen.getByText('Spotify')).toBeInTheDocument()
    expect(listCalls(seen).some((r) => new URL(r.url).searchParams.get('q') === 'spot')).toBe(true)
    // Пауза: на каждый символ отдельный запрос не уходит.
    expect(listCalls(seen).filter((r) => new URL(r.url).searchParams.has('q'))).toHaveLength(1)
  })

  it('9.4 ничего не найдено: «Ничего не найдено» и «Сбросить фильтры» возвращает список', async () => {
    const { user } = renderApp({ route: '/subscriptions', signedIn: true })
    await screen.findByText('Netflix')
    await user.type(screen.getByRole('searchbox', { name: 'Поиск по названию' }), 'нет-такой')
    expect(await screen.findByText('Ничего не найдено', { selector: 'h2' })).toBeInTheDocument()
    expect(screen.queryByText('Подписок пока нет')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Сбросить фильтры' }))
    expect(await screen.findByText('Netflix')).toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: 'Поиск по названию' })).toHaveValue('')
  })

  it('9.2 фильтр по периоду оплаты уходит в запрос', async () => {
    const seen = trackRequests(server)
    const { user } = renderApp({ route: '/subscriptions', signedIn: true })
    await screen.findByText('Netflix')
    await user.click(screen.getByRole('combobox', { name: 'Период оплаты' }))
    await user.click(await screen.findByRole('option', { name: 'Каждый год' }))
    await waitFor(() => expect(screen.queryByText('Netflix')).not.toBeInTheDocument())
    expect(screen.getByText('iCloud+ (annual)')).toBeInTheDocument()
    expect(listCalls(seen).some((r) => new URL(r.url).searchParams.get('billing_cycle') === 'yearly')).toBe(true)
  })
})

describe('Приостановка и удаление (spec 9.6–9.7)', () => {
  it('9.6 «Приостановить» меняет статус запросом PATCH и строка получает бейдж', async () => {
    const seen = trackRequests(server)
    const { user } = renderApp({ route: '/subscriptions', signedIn: true })
    await user.click(await screen.findByRole('button', { name: 'Приостановить Netflix' }))
    const row = screen.getByText('Netflix').closest('li')!
    expect(await within(row).findByText('Приостановлена')).toBeInTheDocument()
    expect(seen.some((r) => r.method === 'PATCH' && r.url.endsWith('/api/subscriptions/1'))).toBe(true)
  })

  it('9.6 ошибка при смене статуса: сообщение, статус не меняется', async () => {
    server.use(http.patch(url('/api/subscriptions/:id'), () => HttpResponse.json({ detail: 'x' }, { status: 500 })))
    const { user } = renderApp({ route: '/subscriptions', signedIn: true })
    await user.click(await screen.findByRole('button', { name: 'Приостановить Netflix' }))
    expect(await screen.findByText('Не удалось изменить статус. Повторите попытку')).toBeInTheDocument()
    expect(within(screen.getByText('Netflix').closest('li')!).queryByText('Приостановлена')).not.toBeInTheDocument()
  })

  it('9.7 удаление: подтверждение, запись исчезает, повторный клик создаёт один запрос', async () => {
    const seen = trackRequests(server)
    let removed = false
    server.use(
      http.get(url('/api/subscriptions'), () =>
        HttpResponse.json(removed ? SUBSCRIPTIONS.filter((item) => item.id !== 1) : SUBSCRIPTIONS),
      ),
      http.delete(url('/api/subscriptions/:id'), async () => {
        await delay(150)
        removed = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderApp({ route: '/subscriptions', signedIn: true })
    await user.click(await screen.findByRole('button', { name: 'Удалить Netflix' }))
    const dialog = await screen.findByRole('alertdialog')
    expect(dialog).toHaveTextContent('Удалить подписку «Netflix»?')
    await user.dblClick(within(dialog).getByRole('button', { name: 'Удалить' }))
    await waitFor(() => expect(screen.queryByText('Netflix')).not.toBeInTheDocument())
    expect((await screen.findAllByText('Подписка удалена')).length).toBeGreaterThan(0)
    expect(seen.filter((r) => r.method === 'DELETE')).toHaveLength(1)
  })

  it('9.7 ошибка удаления: диалог остаётся с сообщением, запись остаётся в списке', async () => {
    server.use(http.delete(url('/api/subscriptions/:id'), () => HttpResponse.json({ detail: 'x' }, { status: 500 })))
    const { user } = renderApp({ route: '/subscriptions', signedIn: true })
    await user.click(await screen.findByRole('button', { name: 'Удалить Netflix' }))
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Удалить' }))
    expect(await within(dialog).findByText('Не удалось удалить. Повторите попытку')).toBeInTheDocument()
    expect(screen.getAllByText('Netflix').length).toBeGreaterThanOrEqual(1)
  })

  it('9.7 «Отмена» закрывает подтверждение без запроса', async () => {
    const seen = trackRequests(server)
    const { user } = renderApp({ route: '/subscriptions', signedIn: true })
    await user.click(await screen.findByRole('button', { name: 'Удалить Netflix' }))
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Отмена' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(seen.filter((r) => r.method === 'DELETE')).toHaveLength(0)
  })
})
