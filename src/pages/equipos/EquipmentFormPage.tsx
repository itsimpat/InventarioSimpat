import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import { FormField } from '../../components/shared/FormField'
import { CurrencyInput } from '../../components/shared/CurrencyInput'
import { useToast } from '../../components/shared/Toast'
import { useEquipment, useCreateEquipment, useUpdateEquipment } from '../../hooks/useEquipment'
import { useCollaborators } from '../../hooks/useCollaborators'
import type { Equipment, EquipmentStatus } from '../../types'

const EQUIPMENT_STATUSES: EquipmentStatus[] = [
  'Asignado',
  'En Bodega',
  'En Reparación',
  'Vendido',
  'Dado de Baja',
  'Solicitado',
]

const CURRENT_YEAR = new Date().getFullYear()

type FormState = {
  marca: string
  modelo: string
  anio_compra: string
  costo_mxn: number
  costo_usd: number
  estatus: EquipmentStatus
  colaborador_id: string
  especificaciones: {
    cpu: string
    ram: string
    almacenamiento: string
    pantalla: string
  }
  admin_user: string
  admin_password: string
}

type FormErrors = Partial<Record<string, string>>

const INITIAL_STATE: FormState = {
  marca: '',
  modelo: '',
  anio_compra: String(CURRENT_YEAR),
  costo_mxn: 0,
  costo_usd: 0,
  estatus: 'En Bodega',
  colaborador_id: '',
  especificaciones: {
    cpu: '',
    ram: '',
    almacenamiento: '',
    pantalla: '',
  },
  admin_user: '',
  admin_password: '',
}

function validate(values: FormState, isEditing: boolean): FormErrors {
  const errors: FormErrors = {}
  if (!values.marca.trim()) errors.marca = 'La marca es requerida'
  if (!values.modelo.trim()) errors.modelo = 'El modelo es requerido'
  const year = parseInt(values.anio_compra)
  if (isNaN(year) || year < 2000 || year > CURRENT_YEAR) {
    errors.anio_compra = `El año debe estar entre 2000 y ${CURRENT_YEAR}`
  }
  if (!isEditing && values.costo_mxn <= 0) {
    errors.costo_mxn = 'El costo es requerido'
  }
  if (!values.estatus) errors.estatus = 'El estatus es requerido'
  return errors
}

export function EquipmentFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditing = !!id

  const { data: existing, isLoading: isLoadingExisting } = useEquipment(id ?? '')
  const { data: collaborators = [] } = useCollaborators({ activo: true })
  const { mutateAsync: create, isPending: isCreating } = useCreateEquipment()
  const { mutateAsync: update, isPending: isUpdating } = useUpdateEquipment()
  const { toast } = useToast()

  const [values, setValues] = useState<FormState>(INITIAL_STATE)
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (existing && isEditing) {
      const specs = existing.especificaciones as Record<string, string>
      setValues({
        marca: existing.marca,
        modelo: existing.modelo,
        anio_compra: String(existing.anio_compra),
        costo_mxn: existing.costo_mxn,
        costo_usd: existing.costo_usd,
        estatus: existing.estatus,
        colaborador_id: existing.colaborador_id ?? '',
        especificaciones: {
          cpu: specs.cpu ?? '',
          ram: specs.ram ?? '',
          almacenamiento: specs.almacenamiento ?? '',
          pantalla: specs.pantalla ?? '',
        },
        admin_user: existing.admin_user ?? '',
        admin_password: existing.admin_password ?? '',
      })
    }
  }, [existing, isEditing])

  const isPending = isCreating || isUpdating

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  function handleSpecChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setValues((prev) => ({
      ...prev,
      especificaciones: { ...prev.especificaciones, [name]: value },
    }))
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

    const specs: Record<string, string> = {}
    if (values.especificaciones.cpu) specs.cpu = values.especificaciones.cpu
    if (values.especificaciones.ram) specs.ram = values.especificaciones.ram
    if (values.especificaciones.almacenamiento) specs.almacenamiento = values.especificaciones.almacenamiento
    if (values.especificaciones.pantalla) specs.pantalla = values.especificaciones.pantalla

    try {
      if (isEditing && id) {
        const updateData: Partial<Equipment> = {
          marca: values.marca.trim(),
          modelo: values.modelo.trim(),
          anio_compra: parseInt(values.anio_compra),
          estatus: values.estatus,
          colaborador_id: values.colaborador_id || null,
          especificaciones: specs,
          admin_user: values.admin_user.trim() || null,
          admin_password: values.admin_password || null,
        }
        if (values.costo_mxn > 0) {
          updateData.costo_mxn = values.costo_mxn
        }
        await update({ id, data: updateData })
        toast('Equipo actualizado correctamente', 'success')
        navigate(`/equipos/${id}`)
      } else {
        const created = await create({
          marca: values.marca.trim(),
          modelo: values.modelo.trim(),
          anio_compra: parseInt(values.anio_compra),
          costo_mxn: values.costo_mxn,
          costo_usd: values.costo_usd,
          estatus: values.estatus,
          colaborador_id: values.colaborador_id || null,
          especificaciones: specs,
          fecha_compra: new Date().toISOString(),
          admin_user: values.admin_user.trim() || null,
          admin_password: values.admin_password || null,
        })
        toast('Equipo creado correctamente', 'success')
        navigate(`/equipos/${created.id}`)
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al guardar el equipo', 'error')
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
            onClick={() => navigate(isEditing ? `/equipos/${id}` : '/equipos')}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Equipo' : 'Nuevo Equipo'}
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Marca" error={errors.marca} required>
              <input
                type="text"
                name="marca"
                value={values.marca}
                onChange={handleChange}
                className={inputClass}
                placeholder="Apple, Dell, HP..."
              />
            </FormField>

            <FormField label="Modelo" error={errors.modelo} required>
              <input
                type="text"
                name="modelo"
                value={values.modelo}
                onChange={handleChange}
                className={inputClass}
                placeholder="MacBook Pro, XPS 15..."
              />
            </FormField>
          </div>

          <FormField label="Año de compra" error={errors.anio_compra} required>
            <input
              type="number"
              name="anio_compra"
              value={values.anio_compra}
              onChange={handleChange}
              min={2000}
              max={CURRENT_YEAR}
              className={inputClass}
            />
          </FormField>

          <CurrencyInput
            valueMXN={values.costo_mxn}
            onChange={handleCurrencyChange}
            label={isEditing ? 'Costo (dejar en 0 para no cambiar)' : 'Costo'}
            error={errors.costo_mxn}
          />

          <FormField label="Estatus" error={errors.estatus} required>
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

          <FormField label="Colaborador asignado">
            <select
              name="colaborador_id"
              value={values.colaborador_id}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">Sin asignar</option>
              {collaborators.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} — {c.area}
                </option>
              ))}
            </select>
          </FormField>

          {/* Cuenta de Administrador IT */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Cuenta de Administrador IT (opcional)</p>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Usuario administrador">
                <input
                  type="text"
                  name="admin_user"
                  value={values.admin_user}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="admin, Administrator..."
                  autoComplete="off"
                />
              </FormField>

              <FormField label="Contraseña administrador">
                <input
                  type="password"
                  name="admin_password"
                  value={values.admin_password}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </FormField>
            </div>
          </div>

          {/* Especificaciones */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Especificaciones (opcional)</p>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="CPU">
                <input
                  type="text"
                  name="cpu"
                  value={values.especificaciones.cpu}
                  onChange={handleSpecChange}
                  className={inputClass}
                  placeholder="Intel Core i7, M2..."
                />
              </FormField>

              <FormField label="RAM">
                <input
                  type="text"
                  name="ram"
                  value={values.especificaciones.ram}
                  onChange={handleSpecChange}
                  className={inputClass}
                  placeholder="16 GB, 32 GB..."
                />
              </FormField>

              <FormField label="Almacenamiento">
                <input
                  type="text"
                  name="almacenamiento"
                  value={values.especificaciones.almacenamiento}
                  onChange={handleSpecChange}
                  className={inputClass}
                  placeholder="512 GB SSD..."
                />
              </FormField>

              <FormField label="Pantalla">
                <input
                  type="text"
                  name="pantalla"
                  value={values.especificaciones.pantalla}
                  onChange={handleSpecChange}
                  className={inputClass}
                  placeholder='14" Retina...'
                />
              </FormField>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate(isEditing ? `/equipos/${id}` : '/equipos')}
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
              {isPending ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear equipo'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
