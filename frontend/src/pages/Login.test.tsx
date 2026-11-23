import { screen } from '@testing-library/react'
import { HttpResponse, delay, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { renderApp, trackRequests } from '@/test/renderApp'
import { server, url } from '@/test/server'

const loginCalls = (seen: { method: string; url: string }[]) =>
  seen.filter((r) => r.method === 'POST' && r.url.endsWith('/api/auth/login'))

describe('Вход (spec раздел 2)', () => {
  it('2.1 пустые поля: сообщения у полей, запрос не отправляется, фокус на первом поле', async () => {
    const seen = trackRequests(server)
    const { user } = renderApp()
    await user.click(screen.getByRole('button', { name: 'Войти' }))

    expect(await screen.findByText('Введите email')).toBeInTheDocument()
    expect(screen.getByText('Введите пароль')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveFocus()
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
    expect(loginCalls(seen)).toHaveLength(0)
  })

  it('2.2 двойной клик во время отправки создаёт один запрос, кнопка показывает «Входим…»', async () => {
    const seen = trackRequests(server)
    server.use(
      http.post(url('/api/auth/login'), async () => {
        await delay(150)
        return HttpResponse.json({ access_token: 'a', refresh_token: 'r', token_type: 'bearer' })
      }),
    )
    const { user } = renderApp()
    await user.type(screen.getByLabelText('Email'), 'demo@example.com')
    await user.type(screen.getByLabelText('Пароль'), 'demo-password')
    await user.dblClick(screen.getByRole('button', { name: 'Войти' }))

    expect(await screen.findByRole('button', { name: /Входим/ })).toBeDisabled()
    expect(await screen.findByRole('heading', { name: 'Мои подписки' })).toBeInTheDocument()
    expect(loginCalls(seen)).toHaveLength(1)
  })

  it('2.2 повторное нажатие Enter во время отправки не создаёт второй запрос', async () => {
    const seen = trackRequests(server)
    server.use(
      http.post(url('/api/auth/login'), async () => {
        await delay(150)
        return HttpResponse.json({ access_token: 'a', refresh_token: 'r', token_type: 'bearer' })
      }),
    )
    const { user } = renderApp()
    await user.type(screen.getByLabelText('Email'), 'demo@example.com')
    await user.type(screen.getByLabelText('Пароль'), 'demo-password{Enter}{Enter}')

    expect(await screen.findByRole('heading', { name: 'Мои подписки' })).toBeInTheDocument()
    expect(loginCalls(seen)).toHaveLength(1)
  })

  it('2.3 неверный пароль: сообщение со ссылкой на регистрацию, введённые значения остаются', async () => {
    const { user } = renderApp()
    await user.type(screen.getByLabelText('Email'), 'demo@example.com')
    await user.type(screen.getByLabelText('Пароль'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: 'Войти' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Неверный email или пароль')
    expect(alert).toHaveTextContent('Нет аккаунта?')
    expect(alert.querySelector('a')).toHaveAttribute('href', '/register')
    expect(screen.getByLabelText('Email')).toHaveValue('demo@example.com')
    expect(screen.getByLabelText('Пароль')).toHaveValue('wrong-password')
    expect(screen.getByRole('button', { name: 'Войти' })).toBeEnabled()
  })

  it('2.4 сбой сервера: сообщение, значения остаются, можно повторить', async () => {
    server.use(http.post(url('/api/auth/login'), () => HttpResponse.json({ detail: 'oops' }, { status: 500 })))
    const { user } = renderApp()
    await user.type(screen.getByLabelText('Email'), 'demo@example.com')
    await user.type(screen.getByLabelText('Пароль'), 'demo-password')
    await user.click(screen.getByRole('button', { name: 'Войти' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось связаться с сервером. Повторите попытку')
    expect(screen.getByLabelText('Email')).toHaveValue('demo@example.com')

    server.resetHandlers()
    await user.click(screen.getByRole('button', { name: 'Войти' }))
    expect(await screen.findByRole('heading', { name: 'Мои подписки' })).toBeInTheDocument()
  })

  it('2.4 сетевая ошибка: то же сообщение', async () => {
    server.use(http.post(url('/api/auth/login'), () => HttpResponse.error()))
    const { user } = renderApp()
    await user.type(screen.getByLabelText('Email'), 'demo@example.com')
    await user.type(screen.getByLabelText('Пароль'), 'demo-password')
    await user.click(screen.getByRole('button', { name: 'Войти' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось связаться с сервером')
  })

  it('2.5 успешный вход открывает список подписок', async () => {
    const { user } = renderApp()
    await user.type(screen.getByLabelText('Email'), 'demo@example.com')
    await user.type(screen.getByLabelText('Пароль'), 'demo-password')
    await user.click(screen.getByRole('button', { name: 'Войти' }))
    expect(await screen.findByRole('heading', { name: 'Мои подписки' })).toBeInTheDocument()
    expect(await screen.findByText('Netflix')).toBeInTheDocument()
  })
})

describe('Доступ и сессия (spec раздел 1)', () => {
  it('1.2 без входа /subscriptions ведёт на вход с пояснением', async () => {
    renderApp({ route: '/subscriptions' })
    expect(await screen.findByRole('heading', { name: 'Вход в аккаунт' })).toBeInTheDocument()
    expect(screen.getByText('Войдите, чтобы продолжить')).toBeInTheDocument()
  })

  it('1.3 вошедшего со страницы входа ведёт в приложение', async () => {
    renderApp({ route: '/login', signedIn: true })
    expect(await screen.findByRole('heading', { name: 'Мои подписки' })).toBeInTheDocument()
  })

  it('1.4 при 401 токен обновляется один раз и запрос повторяется', async () => {
    const seen = trackRequests(server)
    server.use(
      http.get(url('/api/subscriptions'), ({ request }) => {
        if (request.headers.get('Authorization') === 'Bearer access-1') {
          return HttpResponse.json({ detail: 'expired' }, { status: 401 })
        }
        return HttpResponse.json([])
      }),
    )
    renderApp({ route: '/subscriptions', signedIn: true })
    expect(await screen.findByText('Подписок пока нет')).toBeInTheDocument()
    expect(seen.filter((r) => r.url.endsWith('/api/auth/refresh'))).toHaveLength(1)
  })

  it('1.4 если обновить токен не удалось, пользователь на входе с сообщением «Сессия истекла»', async () => {
    server.use(
      http.get(url('/api/subscriptions'), () => HttpResponse.json({ detail: 'expired' }, { status: 401 })),
      http.post(url('/api/auth/refresh'), () => HttpResponse.json({ detail: 'bad' }, { status: 401 })),
    )
    renderApp({ route: '/subscriptions', signedIn: true })
    expect(await screen.findByRole('heading', { name: 'Вход в аккаунт' })).toBeInTheDocument()
    expect(screen.getByText('Сессия истекла, войдите снова')).toBeInTheDocument()
  })

  it('1.5 «Выйти» очищает сессию и ведёт на вход', async () => {
    const { user } = renderApp({ route: '/subscriptions', signedIn: true })
    await user.click(await screen.findByRole('button', { name: 'Выйти' }))
    expect(await screen.findByRole('heading', { name: 'Вход в аккаунт' })).toBeInTheDocument()
    expect(localStorage.getItem('subtracker.access')).toBeNull()
  })
})
