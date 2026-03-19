import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Layout } from '../../components/Layout'
import { FormField } from '../../components/shared/FormField'
import { CurrencyInput } from '../../components/shared/CurrencyInput'
import { useToast } from '../../components/shared/Toast'
import { useCreateOfficeItem } from '../../hooks/useOfficeItems'

const officeItemSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  categoria: z.enum(['Silla', 'Mesa', 'TV', 'Otro'], { error: 'Selecciona una categoría' }),
  marca: z.string().optional(),
  costo_mxn: z.number({ error: 'El costo es requerido' }).min(0.01, 'El costo debe ser mayor a 0'),
  fecha_compra: z.string().min(1, 'La fecha de compra es requerida'),
  cantidad: z.number({ error: 'La cantidad es requerida' }).int().min(1, 'La cantidad mínima es 1'),
})

type FormValues = z.infer<typeof officeItemSchema>

export function OfficeFormPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const createMutation = useCreateOfficeItem()

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(officeItemSchema),
    defaultValues: {
      nombre: '',
      categoria: 'Otro',
      marca: '',
      costo_mxn: 0,
      fecha_compra: '',
      cantidad: 1,
    },
  })

  async function onSubmit(values: FormValues) {
    try {
      const created = await createMutation.mutateAsync({
        nombre: values.nombre,
        categoria: values.categoria,
        marca: values.marca ?? '',
        costo_mxn: values.costo_mxn,
        costo_usd: 0, // overwritten by service
        fecha_compra: values.fecha_compra,
        cantidad: values.cantidad,
      })
      toast('Artículo de oficina creado correctamente', 'success')
      navigate(`/oficina/${created.id}`)
    } catch (err) {
      toast(
        err instanceof Error ? err.message : 'Error al crear el artículo',
        'error'
      )
    }
  }

  return (
    <Layout>
      <div className="max-w-xl">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Volver"
          >
            ←
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">Nuevo Artículo de Oficina</h1>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-xl border border-gray-200 p-6 space-y-4"
        >
          <FormField label="Nombre" error={errors.nombre?.message} required>
            <input
              {...register('nombre')}
              type="text"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
              placeholder="Ej: Silla ergonómica..."
            />
          </FormField>

          <FormField label="Categoría" error={errors.categoria?.message} required>
            <select
              {...register('categoria')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white"
            >
              <option value="Silla">Silla</option>
              <option value="Mesa">Mesa</option>
              <option value="TV">TV</option>
              <option value="Otro">Otro</option>
            </select>
          </FormField>

          <FormField label="Marca" error={errors.marca?.message}>
            <input
              {...register('marca')}
              type="text"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
              placeholder="Ej: Herman Miller, IKEA..."
            />
          </FormField>

          <Controller
            name="costo_mxn"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                valueMXN={field.value}
                onChange={(mxn) => {
                  setValue('costo_mxn', mxn)
                }}
                label="Costo"
                error={errors.costo_mxn?.message}
              />
            )}
          />

          <FormField label="Fecha de compra" error={errors.fecha_compra?.message} required>
            <input
              {...register('fecha_compra')}
              type="date"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
            />
          </FormField>

          <FormField label="Cantidad" error={errors.cantidad?.message} required>
            <input
              {...register('cantidad', { valueAsNumber: true })}
              type="number"
              min={1}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
              placeholder="1"
            />
          </FormField>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Guardando...' : 'Crear artículo'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
