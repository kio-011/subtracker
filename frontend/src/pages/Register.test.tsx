import { screen } from '@testing-library/react'
import { HttpResponse, delay, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { renderApp, trackRequests } from '@/test/renderApp'
import { server, url } from '@/test/server'

const registerCalls = (seen: { method: string; url: string }[]) =>
  seen.filter((r) => r.method === 'POST' && r.url.endsWith('/api/auth/register'))

async function fill(user: ReturnType<typeof renderApp>['user'], email: string, password: string, repeat = password) {
  await user.type(screen.getByLabelText('Email'), email)
  await user.type(screen.getByLabelText('Пароль', { exact: true }), password)
  await user.type(screen.getByLabelText('Повторите пароль'), repeat)
}

describe('Регистрация (spec раздел 3)', () => {
  it('3.1 неверный email: сообщение, запрос не уходит', async () => {
    const seen = trackRequests(server)
    const { user } = renderApp({ route: '/register' })
    await fill(user, 'anna.example.com', 'password-123')
    await user.click(screen.getByRole('button', { name: 'Создать аккаунт' }))
    expect(await screen.findByText('Введите корректный email')).toBeInTheDocument()
    expect(registerCalls(seen)).toHaveLength(0)
  })

  it('3.2 пароль короче 8 символов', async () => {
    const { user } = renderApp({ route: '/register' })
    await fill(user, 'anna@example.com', 'short')
    await user.click(screen.getByRole('button', { name: 'Создать аккаунт' }))
    expect(await screen.findByText('Пароль должен быть не короче 8 символов')).toBeInTheDocument()
  })

  it('3.3 пароли не совпадают', async () => {
    const seen = trackRequests(server)
    const { user } = renderApp({ route: '/register' })
    await fill(user, 'anna@example.com', 'password-123', 'password-124')
    await user.click(screen.getByRole('button', { name: 'Создать аккаунт' }))
    expect(await screen.findByText('Пароли не совпадают')).toBeInTheDocument()
    expect(registerCalls(seen)).toHaveLength(0)
  })

  it('3.4 email занят (409): сообщение у поля, значения остаются', async () => {
    const { user } = renderApp({ route: '/register' })
    await fill(user, 'demo@example.com', 'password-123')
    await user.click(screen.getByRole('button', { name: 'Создать аккаунт' }))
    expect(await screen.findByText('Этот email уже зарегистрирован')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveValue('demo@example.com')
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
  })

  it('3.5 двойной клик во время отправки создаёт один запрос', async () => {
    const seen = trackRequests(server)
    server.use(
      http.post(url('/api/auth/register'), async () => {
        await delay(150)
        return HttpResponse.json({ id: 2, email: 'anna@example.com', plan: 'free', default_currency: 'USD' }, { status: 201 })
      }),
      http.post(url('/api/auth/login'), () =>
        HttpResponse.json({ access_token: 'a', refresh_token: 'r', token_type: 'bearer' }),
      ),
    )
    const { user } = renderApp({ route: '/register' })
    await fill(user, 'anna@example.com', 'password-123')
    await user.dblClick(screen.getByRole('button', { name: 'Создать аккаунт' }))
    expect(await screen.findByRole('heading', { name: 'Мои подписки' })).toBeInTheDocument()
    expect(registerCalls(seen)).toHaveLength(1)
  })

  it('3.6 успех: автоматический вход, список и сообщение «Аккаунт создан»', async () => {
    server.use(
      http.post(url('/api/auth/login'), () =>
        HttpResponse.json({ access_token: 'a', refresh_token: 'r', token_type: 'bearer' }),
      ),
    )
    const { user } = renderApp({ route: '/register' })
    await fill(user, 'anna@example.com', 'password-123')
    await user.click(screen.getByRole('button', { name: 'Создать аккаунт' }))
    expect(await screen.findByRole('heading', { name: 'Мои подписки' })).toBeInTheDocument()
    expect((await screen.findAllByText('Аккаунт создан')).length).toBeGreaterThan(0)
  })
})
