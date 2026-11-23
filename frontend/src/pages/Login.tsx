import { zodResolver } from '@hookform/resolvers/zod'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { ApiError } from '@/api/errors'
import { useAuth } from '@/auth/AuthContext'
import { AuthLayout } from '@/components/AuthLayout'
import { SubmitButton } from '@/components/SubmitButton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const schema = z.object({
  email: z.string().trim().min(1, 'Введите email'),
  password: z.string().min(1, 'Введите пароль'),
})
type Values = z.infer<typeof schema>

type FormError = 'credentials' | 'server' | null

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const reason = (location.state as { reason?: string } | null)?.reason
  const [formError, setFormError] = useState<FormError>(null)
  const submitting = useRef(false) // защита от двойной отправки (правило 2.2)

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
    shouldFocusError: true,
  })
  const pending = form.formState.isSubmitting

  async function onSubmit(values: Values) {
    if (submitting.current) return
    submitting.current = true
    setFormError(null)
    try {
      await login(values.email.trim(), values.password)
      navigate('/subscriptions', { replace: true })
    } catch (error) {
      setFormError(error instanceof ApiError && error.status === 401 ? 'credentials' : 'server')
    } finally {
      submitting.current = false
    }
  }

  return (
    <AuthLayout>
      <h1 className="text-3xl leading-tight">Вход в аккаунт</h1>
      <p className="mt-1.5 mb-5 font-light text-muted-foreground">Войдите, чтобы видеть свои подписки.</p>

      {reason === 'required' && !formError && (
        <p role="status" className="mb-4 text-foreground">Войдите, чтобы продолжить</p>
      )}
      {reason === 'expired' && !formError && (
        <p role="status" className="mb-4 text-foreground">Сессия истекла, войдите снова</p>
      )}
      {formError === 'credentials' && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            Неверный email или пароль. Нет аккаунта? <Link to="/register">Зарегистрируйтесь</Link>
          </AlertDescription>
        </Alert>
      )}
      {formError === 'server' && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>Не удалось связаться с сервером. Повторите попытку</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4" aria-busy={pending}>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" disabled={pending} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Пароль</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="current-password" disabled={pending} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <SubmitButton pending={pending} pendingText="Входим…" className="mt-2 w-full">
            Войти
          </SubmitButton>
        </form>
      </Form>

      <p className="mt-5 text-center font-light text-muted-foreground">
        Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
      </p>
    </AuthLayout>
  )
}
