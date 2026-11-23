import { screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, delay, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { renderApp, trackRequests } from '@/test/renderApp'
import { server, url } from '@/test/server'

type User = ReturnType<typeof renderApp>['user']

const postCalls = (seen: { method: string; url: string }[]) =>
  seen.filter((r) => r.method === 'POST' && new URL(r.url).pathname === '/api/subscriptions')

async function openAdd(user: User) {
  await screen.findByText('Netflix')
  await user.click(screen.getByRole('button', { name: 'Добавить подписку' }))
  return screen.findByRole('dialog', { name: 'Добавить подписку' })
}

async function fillValid(user: User, dialog: HTMLElement, name = 'Dropbox Plus') {
  await user.type(within(dialog).getByLabelText('Название'), name)
  await user.type(within(dialog).getByLabelText('Сумма'), '11,99')
  await user.type(within(dialog).getByLabelText('Дата начала'), '2026-12-07')
}

describe('Добавление подписки (spec раздел 5)', () => {
  it('5.2 пустая форма: сообщения у полей, запрос не уходит, фокус на первом неверном поле', async () => {
    const seen = trackRequests(server)
    const { user } = renderApp({ route: '/subscriptions', signedIn: true })
    const dialog = await openAdd(user)
    await user.click(within(dialog).getByRole('button', { name: 'Добавить' }))

    expect(await within(dialog).findByText('Введите название')).toBeInTheDocument()
    expect(within(dialog).getByText('Сумма должна быть больше 0')).toBeInTheDocument()
    expect(within(dialog).getByText('Укажите дату начала')).toBeInTheDocument()
    expect(within(dialog).getByLabelText('Название')).toHaveFocus()
    expect(within(dialog).getByLabelText('Название')).toHaveAttribute('aria-invalid', 'true')
    expect(postCalls(seen)).toHaveLength(0)
  })

  it('5.2 строка из пробелов вместо названия не подходит', async () => {
    const { user } = renderApp({ route: '/subscriptions', signedIn: true })
    const dialog = await openAdd(user)
    await user.type(within(dialog).getByLabelText('Название'), '    ')
    await user.click(within(dialog).getByRole('button', { name: 'Добавить' }))
    expect(await within(dialog).findByText('Введите название')).toBeInTheDocument()
  })

  it.each([
    ['0', 'Сумма должна быть больше 0'],
    ['abc', 'Сумма должна быть больше 0'],
    ['12.345', 'Не больше двух знаков после запятой'],
  ])('5.1 сумма «%s»: %s', async (value, message) => {
    const { user } = renderApp({ route: '/subscriptions', signedIn: true })
    const dialog = await openAdd(user)
    await user.type(within(dialog).getByLabelText('Сумма'), value)
    await user.click(within(dialog).getByRole('button', { name: 'Добавить' }))
    expect(await within(dialog).findByText(message)).toBeInTheDocument()
  })

  it('5.1 поле «Интервал в днях» видно только для своего интервала и проверяется', async () => {
    const { user } = renderApp({ route: '/subscriptions', signedIn: true })
    const dialog = await openAdd(user)
    expect(within(dialog).queryByLabelText('Интервал в днях')).not.toBeInTheDocument()

    await user.click(within(dialog).getByRole('combobox', { name: 'Период оплаты' }))
    await user.click(await screen.findByRole('option', { name: 'Свой интервал в днях' }))
    const interval = await within(dialog).findByLabelText('Интервал в днях')
    await user.type(interval, '4000')
    await user.click(within(dialog).getByRole('button', { name: 'Добавить' }))
    expect(await within(dialog).findByText('Введите число дней от 1 до 3650')).toBeInTheDocument()
  })

  it('5.3 двойной клик во время сохранения создаёт один запрос, кнопка «Сохраняем…», закрыть нельзя', async () => {
    const seen = trackRequests(server)
    server.use(
      http.post(url('/api/subscriptions'), async () => {
        await delay(200)
        return HttpResponse.json({ id: 99, name: 'Dropbox Plus' }, { status: 201 })
      }),
    )
    const { user } = renderApp({ route: '/subscriptions', signedIn: true })
    const dialog = await openAdd(user)
    await fillValid(user, dialog)
    await user.dblClick(within(dialog).getByRole('button', { name: 'Добавить' }))

    expect(await within(dialog).findByRole('button', { name: /Сохраняем/ })).toBeDisabled()
    expect(within(dialog).getByLabelText('Название')).toBeDisabled()
    await user.keyboard('{Escape}')
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(postCalls(seen)).toHaveLength(1)
  })

  it('5.4 успех: диалог закрыт, новая подписка в списке, сообщение, при следующем открытии форма пустая', async () => {
    const { user } = renderApp({ route: '/subscriptions', signedIn: true })
    const dialog = await openAdd(user)
    await fillValid(user, dialog)
    await user.click(within(dialog).getByRole('button', { name: 'Добавить' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(await screen.findByText('Dropbox Plus')).toBeInTheDocument()
    expect((await screen.findAllByText('Подписка добавлена')).length).toBeGreaterThan(0)
    expect(screen.getByRole('status')).toHaveTextContent('6 подписок')

    await user.click(screen.getByRole('button', { name: 'Добавить подписку' }))
    const again = await screen.findByRole('dialog', { name: 'Добавить подписку' })
    expect(within(again).getByLabelText('Название')).toHaveValue('')
    expect(within(again).getByLabelText('Сумма')).toHaveValue('')
  })

  it('5.5 ответ 422: сообщение сервера у соответствующего поля', async () => {
    server.use(
      http.post(url('/api/subscriptions'), () =>
        HttpResponse.json(
          { detail: [{ type: 'greater_than', loc: ['body', 'amount'], msg: 'Input should be greater than 0' }] },
          { status: 422 },
        ),
      ),
    )
    const { user } = renderApp({ route: '/subscriptions', signedIn: true })
    const dialog = await openAdd(user)
    await fillValid(user, dialog)
    await user.click(within(dialog).getByRole('button', { name: 'Добавить' }))
    expect(await within(dialog).findByText('Input should be greater than 0')).toBeInTheDocument()
    expect(within(dialog).getByLabelText('Сумма')).toHaveAttribute('aria-invalid', 'true')
  })

  it('5.6 ошибка сервера: сообщение, введённые значения остаются точно такими, можно повторить', async () => {
    server.use(http.post(url('/api/subscriptions'), () => HttpResponse.json({ detail: 'x' }, { status: 500 })))
    const { user } = renderApp({ route: '/subscriptions', signedIn: true })
    const dialog = await openAdd(user)
    const exact = 'Мой «сервис» 100% (тест)'
    await fillValid(user, dialog, exact)
    await user.click(within(dialog).getByRole('button', { name: 'Добавить' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Не удалось сохранить. Повторите попытку')
    expect(within(dialog).getByLabelText('Название')).toHaveValue(exact)
    expect(within(dialog).getByLabelText('Сумма')).toHaveValue('11,99')
    expect(within(dialog).getByLabelText('Дата начала')).toHaveValue('2026-12-07')

    server.resetHandlers()
    await user.click(within(dialog).getByRole('button', { name: 'Добавить' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(await screen.findByText(exact)).toBeInTheDocument()
  })

  it('5.7 «Отмена» и Esc закрывают диалог без запроса', async () => {
    const seen = trackRequests(server)
    const { user } = renderApp({ route: '/subscriptions', signedIn: true })
    let dialog = await openAdd(user)
    await user.type(within(dialog).getByLabelText('Название'), 'Черновик')
    await user.click(within(dialog).getByRole('button', { name: 'Отмена' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    dialog = await openAdd(user)
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(postCalls(seen)).toHaveLength(0)
  })

  it('6.4 фокус возвращается на кнопку «Добавить подписку» после закрытия диалога', async () => {
    const { user } = renderApp({ route: '/subscriptions', signedIn: true })
    await openAdd(user)
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(() => expect(screen.getByRole('button', { name: 'Добавить подписку' })).toHaveFocus())
  })
})

describe('Изменение подписки (spec 9.5)', () => {
  it('9.5 диалог заполнен значениями, отправляются только изменённые поля', async () => {
    let body: Record<string, unknown> | null = null
    server.use(
      http.patch(url('/api/subscriptions/:id'), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ id: 1 })
      }),
    )
    const { user } = renderApp({ route: '/subscriptions', signedIn: true })
    await user.click(await screen.findByRole('button', { name: 'Изменить Netflix' }))
    const dialog = await screen.findByRole('dialog', { name: 'Изменить подписку' })
    expect(within(dialog).getByLabelText('Название')).toHaveValue('Netflix')
    expect(within(dialog).getByLabelText('Сумма')).toHaveValue('15.49')

    const amount = within(dialog).getByLabelText('Сумма')
    await user.clear(amount)
    await user.type(amount, '17,99')
    await user.click(within(dialog).getByRole('button', { name: 'Сохранить' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(body).toEqual({ amount: '17.99' })
    expect((await screen.findAllByText('Изменения сохранены')).length).toBeGreaterThan(0)
  })
})
