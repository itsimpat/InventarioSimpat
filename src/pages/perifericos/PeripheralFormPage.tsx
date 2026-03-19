import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import { FormField } from '../../components/shared/FormField'
import { CurrencyInput } from '../../components/shared/CurrencyInput'
import { useToast } from '../../components/shared/Toast'
import { usePeripheral, useCreatePeripheral, useUpdatePeripheral } from '../../hooks/usePeripherals'
import { useCollaborators } from '../../hooks/useCollaborators'
import type { Peripheral, PeripheralType, EquipmentStatus } from '../../types'

const PERIPHERAL_TYPES: PeripheralType[] = ['Monitor', 'Teclado', 'Audífonos', 'Mouse', 'Otro']

const EQUIPMENT_STATUSES: EquipmentStatus[] = [
  'Asignado',
  'En Bodega',
  'En Reparación',
  'Vendido',
  'Dado de Baja',
  'Solicitado',
]

type FormState = {
  tipo: PeripheralType
  marca: string
  modelo: string
  costo_mxn: number
  costo_usd: number
  fecha_compra: string
  estatus: EquipmentStatus
  colaborador_id: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

const INITIAL_STATE: FormState = {
  tipo: 'Monitor',
  marca: '',
  modelo: '',
  costo_mxn: 0,
  costo_usd: 0,
  fecha_compra: new Date().toISOString().split('T')[0],
  estatus: 'En Bodega',
  colaborador_id: '',
}

function validate(values: FormState, isEditing: boolean): FormErrors {
  const errors: FormErrors = {}
  if (!values.marca.trim()) errors.marca = 'La marca es requerida'
  if (!values.modelo.trim()) errors.modelo = 'El modelo es requerido'
  if (!isEditing && values.costo_mxn <= 0) errors.costo_mxn = 'El costo es requerido'
  if (!values.fecha_compra) errors.fecha_compra = 'La fecha de compra es requerida'
  return errors
}

export function PeripheralFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditing = !!id

  const { data: existing, isLoading: isLoadingExisting } = usePeripheral(id ?? '')
  const { data: collaborators = [] } = useCollaborators({ activo: true })
  const { mutateAsync: create, isPending: isCreating } = useCreatePeripheral()
  const { mutateAsync: update, isPending: isUpdating } = useUpdatePeripheral()
  const { toast } = useToast()

  const [values, setValues] = useState<FormState>(INITIAL_STATE)
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (existing && isEditing) {
      setValues({
        tipo: existing.tipo,
        marca: existing.marca,
        modelo: existing.modelo,
        costo_mxn: existing.costo_mxn,
        costo_usd: existing.costo_usd,
        fecha_compra: existing.fecha_compra.split('T')[0],
        estatus: existing.estatus,
        colaborador_id: existing.colaborador_id ?? '',
      })
    }
  }, [existing, isEditing])

  const isPending = isCreating || isUpdating

  const ownership = values.colaborador_id ? 'Colaborador' : 'Bodega'

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value }))
    if (errors[name as keyof FormState]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  function handleCurrencyChange(mxn: number, usd: number) {
    setValues((prev) => ({ ...prev, costo_mxn: mxn, costo_usd: usd }))
    if (errors.costo_mxn) setErrors((prev) => ({ ...prev, costo_mxn: undefined }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors = validate(values, isEditing)
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      if (isEditing && id) {
        const updateData: Partial<Peripheral> = {
          tipo: values.tipo,
          marca: values.marca.trim(),
          modelo: values.modelo.trim(),
          fecha_compra: new Date(values.fecha_compra).toISOString(),
          estatus: values.estatus,
          colaborador_id: values.colaborador_id || null,
        }
        if (values.costo_mxn > 0) {
          updateData.costo_mxn = values.costo_mxn
        }
        await update({ id, data: updateData })
        toast('Periférico actualizado correctamente', 'success')
        navigate(`/perifericos/${id}`)
      } else {
        const created = await create({
          tipo: values.tipo,
          marca: values.marca.trim(),
          modelo: values.modelo.trim(),
          costo_mxn: values.costo_mxn,
          costo_usd: values.costo_usd,
          fecha_compra: new Date(values.fecha_compra).toISOString(),
          estatus: values.estatus,
          colaborador_id: values.colaborador_id || null,
        })
        toast('Periférico creado correctamente', 'success')
        navigate(`/perifericos/${created.id}`)
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al guardar el periférico', 'error')
    }
  }

  if (isEditing && isLoadingExisting) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      </Layout>
    )
  }

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(isEditing ? `/perifericos/${id}` : '/perifericos')}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Periférico' : 'Nuevo Periférico'}
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <FormField label="Tipo" required>
            <select
              name="tipo"
              value={values.tipo}
              onChange={handleChange}
              className={inputClass}
            >
              {PERIPHERAL_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Marca" error={errors.marca} required>
              <input
                type="text"
                name="marca"
                value={values.marca}
                onChange={handleChange}
                className={inputClass}
                placeholder="Logitech, Dell..."
              />
            </FormField>

            <FormField label="Modelo" error={errors.modelo} required>
              <input
                type="text"
                name="modelo"
                value={values.modelo}
                onChange={handleChange}
                className={inputClass}
                placeholder="MX Keys, U2722D..."
              />
            </FormField>
          </div>

          <CurrencyInput
            valueMXN={values.costo_mxn}
            onChange={handleCurrencyChange}
            label={isEditing ? 'Costo (dejar en 0 para no cambiar)' : 'Costo'}
            error={errors.costo_mxn}
          />

          <FormField label="Fecha de compra" error={errors.fecha_compra} required>
            <input
              type="date"
              name="fecha_compra"
              value={values.fecha_compra}
              onChange={handleChange}
              className={inputClass}
            />
          </FormField>

          <FormField label="Estatus" required>
            <select
              name="estatus"
              value={values.estatus}
              onChange={handleChange}
              className={inputClass}
            >
              {EQUIPMENT_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Ownership">
            <p className="text-sm text-gray-500 mb-2">
              Ownership actual: <span className="font-medium">{ownership}</span>
            </p>
            <select
              name="colaborador_id"
              value={values.colaborador_id}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">Bodega (sin colaborador)</option>
              {collaborators.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} — {c.area}
                </option>
              ))}
            </select>
          </FormField>

          <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate(isEditing ? `/perifericos/${id}` : '/perifericos')}
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear periférico'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
