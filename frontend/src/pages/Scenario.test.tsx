import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@/test/renderApp'

describe('Основной сценарий целиком (scenario.md)', () => {
  it('вход → список → добавить подписку → новая подписка видна в списке с суммой и датой', async () => {
    const { user } = renderApp({ route: '/login' })

    // Вход
    await user.type(screen.getByLabelText('Email'), 'demo@example.com')
    await user.type(screen.getByLabelText('Пароль'), 'demo-password')
    await user.click(screen.getByRole('button', { name: 'Войти' }))

    // Список подписок
    const list = await screen.findByRole('list', { name: 'Список подписок' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(5)
    expect(screen.getByRole('status')).toHaveTextContent('5 подписок')

    // Добавление
    await user.click(screen.getByRole('button', { name: 'Добавить подписку' }))
    const dialog = await screen.findByRole('dialog', { name: 'Добавить подписку' })
    await user.type(within(dialog).getByLabelText('Название'), 'Dropbox Plus')
    await user.type(within(dialog).getByLabelText('Сумма'), '11,99')
    await user.type(within(dialog).getByLabelText('Дата начала'), '07.12.2026')
    await user.click(within(dialog).getByRole('button', { name: 'Добавить' }))

    // Результат: подписка видна в списке
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    const row = (await screen.findByText('Dropbox Plus')).closest('li')!
    expect(row).toHaveTextContent('11,99')
    expect(row).toHaveTextContent('каждый месяц')
    expect(screen.getByRole('status')).toHaveTextContent('6 подписок')
  })
})
