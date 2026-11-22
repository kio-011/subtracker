import { zodResolver } from '@hookform/resolvers/zod'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { ApiError } from '@/api/errors'
import { useAuth } from '@/auth/AuthContext'
import { AuthLayout } from '@/components/AuthLayout'
import { SubmitButton } from '@/components/SubmitButton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const schema = z
  .object({
    email: z.string().trim().regex(EMAIL_PATTERN, 'Введите корректный email'),
    password: z
      .string()
      .min(8, 'Пароль должен быть не короче 8 символов')
      .max(128, 'Пароль не длиннее 128 символов'),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Пароли не совпадают',
  })
type Values = z.infer<typeof schema>

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState(false)
  const submitting = useRef(false) // защита от двойной отправки (правило 3.5)

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
    shouldFocusError: true,
  })
  const pending = form.formState.isSubmitting

  async function onSubmit(values: Values) {
    if (submitting.current) return
    submitting.current = true
    setServerError(false)
    try {
      await register(values.email.trim(), values.password)
      toast.success('Аккаунт создан')
      navigate('/subscriptions', { replace: true })
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        form.setError('email', { message: 'Этот email уже зарегистрирован' }, { shouldFocus: true })
      } else {
        setServerError(true)
      }
    } finally {
      submitting.current = false
    }
  }

  return (
    <AuthLayout>
      <h1 className="text-3xl leading-tight">Создать аккаунт</h1>
      <p className="mt-1.5 mb-5 font-light text-muted-foreground">
        Для входа нужны email и пароль не короче 8 символов.
      </p>

      {serverError && (
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
                  <Input type="email" autoComplete="email" placeholder="name@example.com" disabled={pending} {...field} />
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
                  <Input type="password" autoComplete="new-password" disabled={pending} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Повторите пароль</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" disabled={pending} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <SubmitButton pending={pending} pendingText="Создаём…" className="mt-2 w-full">
            Создать аккаунт
          </SubmitButton>
        </form>
      </Form>

      <p className="mt-5 text-center font-light text-muted-foreground">
        Уже есть аккаунт? <Link to="/login">Войти</Link>
      </p>
    </AuthLayout>
  )
}
