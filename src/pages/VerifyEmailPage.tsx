import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { insforge } from '../lib/insforge'

const schema = z.object({
  otp: z.string().length(6, 'Code must be 6 digits').regex(/^\d+$/, 'Numbers only'),
})

type FormData = z.infer<typeof schema>

export function VerifyEmailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const email = (location.state as { email?: string } | null)?.email ?? ''
  const [serverError, setServerError] = useState<string | null>(null)
  const [resent, setResent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setServerError(null)
    const { error } = await insforge.auth.verifyEmail({ email, otp: data.otp })
    if (error) {
      setServerError(error.message)
    } else {
      navigate('/', { replace: true })
    }
  }

  async function handleResend() {
    await insforge.auth.resendVerificationEmail({ email })
    setResent(true)
    setTimeout(() => setResent(false), 5000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-semibold text-gray-900">Verify email</h1>
            <p className="text-sm text-gray-500 mt-2">
              Enter the 6-digit code sent to{' '}
              <span className="font-medium text-gray-700">{email}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                {...register('otp')}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.otp && (
                <p className="mt-1 text-xs text-red-600 text-center">{errors.otp.message}</p>
              )}
            </div>

            {serverError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {serverError}
              </div>
            )}

            {resent && (
              <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
                Code resent
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isSubmitting ? 'Verifying...' : 'Verify'}
            </button>

            <button
              type="button"
              onClick={handleResend}
              className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Resend code
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
