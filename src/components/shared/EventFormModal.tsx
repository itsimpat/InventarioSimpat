import { useState } from 'react'
import { Modal } from './Modal'
import { FormField } from './FormField'
import { useCreateHistoryEvent } from '../../hooks/useHistoryEvents'
import { useToast } from './Toast'
import type { EntityType, HistoryEventType } from '../../types'

type Props = {
  isOpen: boolean
  onClose: () => void
  entityTipo: EntityType
  entityId: string
  registradoPor: string
}

type FormState = {
  tipo_evento: Exclude<HistoryEventType, 'Reasignación'>
  descripcion: string
  fecha_inicio: string
  fecha_fin: string
  tecnico_nombre: string
  tecnico_telefono: string
  costo: string
}

const INITIAL_STATE: FormState = {
  tipo_evento: 'Reparación',
  descripcion: '',
  fecha_inicio: new Date().toISOString().split('T')[0],
  fecha_fin: '',
  tecnico_nombre: '',
  tecnico_telefono: '',
  costo: '',
}

type FormErrors = Partial<Record<keyof FormState, string>>

function validate(values: FormState): FormErrors {
  const errors: FormErrors = {}
  if (!values.descripcion.trim()) {
    errors.descripcion = 'La descripción es requerida'
  }
  if (!values.fecha_inicio) {
    errors.fecha_inicio = 'La fecha de inicio es requerida'
  }
  if (values.costo && isNaN(parseFloat(values.costo))) {
    errors.costo = 'El costo debe ser un número válido'
  }
  return errors
}

export function EventFormModal({
  isOpen,
  onClose,
  entityTipo,
  entityId,
  registradoPor,
}: Props) {
  const [values, setValues] = useState<FormState>(INITIAL_STATE)
  const [errors, setErrors] = useState<FormErrors>({})
  const { mutateAsync, isPending } = useCreateHistoryEvent()
  const { toast } = useToast()

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value }))
    if (errors[name as keyof FormState]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  function handleClose() {
    setValues(INITIAL_STATE)
    setErrors({})
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors = validate(values)
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      await mutateAsync({
        entidad_tipo: entityTipo,
        entidad_id: entityId,
        tipo_evento: values.tipo_evento,
        descripcion: values.descripcion.trim(),
        fecha_inicio: new Date(values.fecha_inicio).toISOString(),
        fecha_fin: values.fecha_fin ? new Date(values.fecha_fin).toISOString() : null,
        tecnico_nombre: values.tecnico_nombre.trim() || null,
        tecnico_telefono: values.tecnico_telefono.trim() || null,
        costo_mxn: values.costo ? parseFloat(values.costo) : null,
        costo_usd: null,
        colaborador_anterior_id: null,
        colaborador_nuevo_id: null,
        registrado_por: registradoPor,
      })
      toast('Evento registrado correctamente', 'success')
      handleClose()
    } catch (err) {
      toast(
        err instanceof Error ? err.message : 'Error al registrar el evento',
        'error'
      )
    }
  }

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Registrar Evento" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Tipo de evento" required>
          <select
            name="tipo_evento"
            value={values.tipo_evento}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="Reparación">Reparación</option>
            <option value="Mantenimiento">Mantenimiento</option>
            <option value="Otro">Otro</option>
          </select>
        </FormField>

        <FormField label="Descripción" error={errors.descripcion} required>
          <textarea
            name="descripcion"
            value={values.descripcion}
            onChange={handleChange}
            rows={3}
            className={inputClass}
            placeholder="Describe el evento..."
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Fecha inicio" error={errors.fecha_inicio} required>
            <input
              type="date"
              name="fecha_inicio"
              value={values.fecha_inicio}
              onChange={handleChange}
              className={inputClass}
            />
          </FormField>

          <FormField label="Fecha fin">
            <input
              type="date"
              name="fecha_fin"
              value={values.fecha_fin}
              onChange={handleChange}
              className={inputClass}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Técnico">
            <input
              type="text"
              name="tecnico_nombre"
              value={values.tecnico_nombre}
              onChange={handleChange}
              className={inputClass}
              placeholder="Nombre del técnico"
            />
          </FormField>

          <FormField label="Teléfono">
            <input
              type="text"
              name="tecnico_telefono"
              value={values.tecnico_telefono}
              onChange={handleChange}
              className={inputClass}
              placeholder="555-000-0000"
            />
          </FormField>
        </div>

        <FormField label="Costo (MXN)" error={errors.costo}>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
            <input
              type="number"
              name="costo"
              value={values.costo}
              onChange={handleChange}
              min={0}
              step={0.01}
              className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="0.00"
            />
          </div>
        </FormField>

        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={handleClose}
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
            {isPending ? 'Guardando...' : 'Registrar evento'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
