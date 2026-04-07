import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Layout } from '../../components/Layout'
import { FormField } from '../../components/shared/FormField'
import { CurrencyInput } from '../../components/shared/CurrencyInput'
import { IYBudgetCard } from '../../components/shared/IYBudgetCard'
import { AutocompleteInput } from '../../components/shared/AutocompleteInput'
import { useToast } from '../../components/shared/Toast'
import { useLicense, useLicenses, useCreateLicense, useUpdateLicense } from '../../hooks/useLicenses'
import { useCollaborators } from '../../hooks/useCollaborators'
import { useIYBudgetSummary } from '../../hooks/useIYBudgetSummary'
const licenseSchema = z.object({
  nombre_producto: z.string().min(1, 'Product name is required'),
  tipo: z.enum(['Monthly', 'Annual', 'Quarterly'], { error: 'Select a type' }),
  categoria: z.enum(['IY', 'General'], { error: 'Select a category' }),
  costo_usd: z.number({ error: 'Cost is required' }).min(0.01, 'Cost must be greater than 0'),
  fecha_renovacion: z.string().min(1, 'Renewal date is required'),
  colaborador_id: z.string().min(1, 'Collaborator is required'),
  activa: z.boolean(),
})

type FormValues = z.infer<typeof licenseSchema>


export function LicenseFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const { toast } = useToast()

  const { data: existing, isLoading: isLoadingExisting } = useLicense(id ?? '')
  const createMutation = useCreateLicense()
  const updateMutation = useUpdateLicense()
  const { data: collaborators = [] } = useCollaborators({ activo: true })
  const { data: allLicenses = [] } = useLicenses()

  const productNameSuggestions = useMemo(
    () => [...new Set(allLicenses.map((l) => l.nombre_producto))].sort(),
    [allLicenses]
  )

  const [iyBudgetError, setIyBudgetError] = useState<string | null>(null)
  const [currencyInputKey, setCurrencyInputKey] = useState(0)
  const [prefillCostUSD, setPrefillCostUSD] = useState(0)

  function handleProductNameChange(value: string, fieldOnChange: (v: string) => void) {
    fieldOnChange(value)
    if (isEdit || !productNameSuggestions.includes(value)) return

    const matching = allLicenses.filter((l) => l.nombre_producto === value)
    if (matching.length === 0) return

    const tipos = [...new Set(matching.map((l) => l.tipo))]
    const categorias = [...new Set(matching.map((l) => l.categoria))]
    const costos = [...new Set(matching.map((l) => l.costo_usd))]

    const consistentTipo = tipos.length === 1 ? tipos[0] : null
    if (consistentTipo) setValue('tipo', consistentTipo)
    if (categorias.length === 1) setValue('categoria', categorias[0])

    if (costos.length === 1) {
      setValue('costo_usd', costos[0])
      setPrefillCostUSD(costos[0])
      setCurrencyInputKey((k) => k + 1)
    }

    if (consistentTipo) {
      const today = new Date()
      const renewal = new Date(today)
      if (consistentTipo === 'Monthly') renewal.setMonth(renewal.getMonth() + 1)
      else if (consistentTipo === 'Annual') renewal.setFullYear(renewal.getFullYear() + 1)
      else if (consistentTipo === 'Quarterly') renewal.setMonth(renewal.getMonth() + 3)
      setValue('fecha_renovacion', renewal.toISOString().substring(0, 10))
    }
  }

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(licenseSchema),
    defaultValues: {
      nombre_producto: '',
      tipo: 'Monthly',
      categoria: 'General',
      costo_usd: 0,
      fecha_renovacion: '',
      colaborador_id: '',
      activa: true,
    },
  })

  useEffect(() => {
    if (existing) {
      reset({
        nombre_producto: existing.nombre_producto,
        tipo: existing.tipo,
        categoria: existing.categoria,
        costo_usd: existing.costo_usd,
        fecha_renovacion: existing.fecha_renovacion.substring(0, 10),
        colaborador_id: existing.colaborador_id,
        activa: existing.activa,
      })
    }
  }, [existing, reset])

  const watchedCategoria = watch('categoria')
  const watchedCollaboradorId = watch('colaborador_id')

  const { montoDisponible, isLoading: isLoadingBudget } = useIYBudgetSummary(
    watchedCategoria === 'IY' && watchedCollaboradorId ? watchedCollaboradorId : ''
  )

  async function onSubmit(values: FormValues) {
    setIyBudgetError(null)

    // Validate IY budget if categoria = IY
    if (values.categoria === 'IY' && values.colaborador_id) {
      if (!isLoadingBudget && values.costo_usd > montoDisponible) {
        setIyBudgetError(
          `Cost exceeds available IY budget. Available: $${montoDisponible.toFixed(2)} USD`
        )
        return
      }
    }

    try {
      if (isEdit && id) {
        const updated = await updateMutation.mutateAsync({
          id,
          data: {
            nombre_producto: values.nombre_producto,
            tipo: values.tipo,
            categoria: values.categoria,
            fecha_renovacion: values.fecha_renovacion,
            colaborador_id: values.colaborador_id,
            activa: values.activa,
          },
        })
        toast('License updated successfully', 'success')
        navigate(`/licencias/${updated.id}`)
      } else {
        const created = await createMutation.mutateAsync({
          nombre_producto: values.nombre_producto,
          tipo: values.tipo,
          categoria: values.categoria,
          costo_usd: values.costo_usd,
          fecha_renovacion: values.fecha_renovacion,
          colaborador_id: values.colaborador_id,
          activa: values.activa,
        })
        toast('License created successfully', 'success')
        navigate(`/licencias/${created.id}`)
      }
    } catch (err) {
      toast(
        err instanceof Error ? err.message : 'Error saving license',
        'error'
      )
    }
  }

  if (isEdit && isLoadingExisting) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-48 text-gray-400">
          Loading...
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-xl">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Go back"
          >
            ←
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">
            {isEdit ? 'Edit License' : 'New License'}
          </h1>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-xl border border-gray-200 p-6 space-y-4"
        >
          <FormField label="Product name" error={errors.nombre_producto?.message} required>
            <Controller
              name="nombre_producto"
              control={control}
              render={({ field }) => (
                <AutocompleteInput
                  {...field}
                  onChange={(v) => handleProductNameChange(v, field.onChange)}
                  suggestions={productNameSuggestions}
                  placeholder="Ej: GitHub Copilot, Figma..."
                />
              )}
            />
          </FormField>

          <FormField label="Type" error={errors.tipo?.message} required>
            <select
              {...register('tipo')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white"
            >
              <option value="Monthly">Monthly</option>
              <option value="Annual">Annual</option>
              <option value="Quarterly">Quarterly</option>
            </select>
          </FormField>

          <FormField label="Category" error={errors.categoria?.message} required>
            <select
              {...register('categoria')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white"
            >
              <option value="General">General</option>
              <option value="IY">IY (Improve Yourself)</option>
            </select>
          </FormField>

          <FormField label="Collaborator" error={errors.colaborador_id?.message} required>
            <select
              {...register('colaborador_id')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white"
            >
              <option value="">Select a collaborator...</option>
              {collaborators.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </FormField>

          {/* IY Budget Card when categoria = IY and collaborator selected */}
          {watchedCategoria === 'IY' && watchedCollaboradorId && (
            <div className="pt-1">
              <IYBudgetCard collaboratorId={watchedCollaboradorId} compact />
            </div>
          )}

          {!isEdit && (
            <Controller
              name="costo_usd"
              control={control}
              render={() => (
                <CurrencyInput
                  key={currencyInputKey}
                  valueMXN={0}
                  valueUSD={prefillCostUSD > 0 ? prefillCostUSD : undefined}
                  onChange={(_mxn, usd) => {
                    setValue('costo_usd', usd)
                  }}
                  label="Cost"
                  error={errors.costo_usd?.message}
                />
              )}
            />
          )}

          {iyBudgetError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              {iyBudgetError}
            </p>
          )}

          <FormField label="Renewal date" error={errors.fecha_renovacion?.message} required>
            <input
              {...register('fecha_renovacion')}
              type="date"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
            />
          </FormField>

          <FormField label="Status" error={errors.activa?.message}>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                {...register('activa')}
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Active license</span>
            </label>
          </FormField>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting
                ? 'Saving...'
                : isEdit
                ? 'Save changes'
                : 'Create license'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
