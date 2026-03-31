import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Layout } from '../../components/Layout'
import { FormField } from '../../components/shared/FormField'
import { useToast } from '../../components/shared/Toast'
import { useNotificationConfig, useUpdateNotificationConfig } from '../../hooks/useNotificationConfig'

const configSchema = z.object({
  dias_anticipacion: z
    .number({ error: 'Enter a valid number' })
    .int()
    .min(1, 'Minimum 1 day')
    .max(90, 'Maximum 90 days'),
})

type FormValues = z.infer<typeof configSchema>

export function ConfiguracionPage() {
  const { toast } = useToast()
  const { data: config, isLoading } = useNotificationConfig()
  const updateMutation = useUpdateNotificationConfig()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      dias_anticipacion: 7,
    },
  })

  useEffect(() => {
    if (config) {
      reset({ dias_anticipacion: config.dias_anticipacion })
    }
  }, [config, reset])

  async function onSubmit(values: FormValues) {
    try {
      await updateMutation.mutateAsync(values.dias_anticipacion)
      toast('Settings saved successfully', 'success')
    } catch (err) {
      toast(
        err instanceof Error ? err.message : 'Error saving settings',
        'error'
      )
    }
  }

  return (
    <Layout>
      <div className="max-w-xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Notification Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage license renewal alerts
          </p>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
            <div className="h-4 bg-gray-100 rounded w-48 mb-4" />
            <div className="h-10 bg-gray-100 rounded" />
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white rounded-xl border border-gray-200 p-6 space-y-4"
          >
            <FormField
              label="Days in advance for renewal alerts"
              error={errors.dias_anticipacion?.message}
              required
            >
              <input
                {...register('dias_anticipacion', { valueAsNumber: true })}
                type="number"
                min={1}
                max={90}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                placeholder="7"
              />
            </FormField>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                Alerts will appear on the dashboard when a license expires within the configured period.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Saving...' : 'Save settings'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  )
}
