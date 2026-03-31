import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Layout } from '../../components/Layout'
import { FormField } from '../../components/shared/FormField'
import { useToast } from '../../components/shared/Toast'
import { useCollaborator, useCreateCollaborator, useUpdateCollaborator } from '../../hooks/useCollaborators'

const collaboratorSchema = z.object({
  nombre: z.string().min(1, 'Name is required'),
  area: z.string().min(1, 'Area is required'),
  puesto: z.string().min(1, 'Position is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  fecha_ingreso: z.string().min(1, 'Start date is required'),
})

type FormValues = z.infer<typeof collaboratorSchema>

export function CollaboratorFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const { toast } = useToast()

  const { data: existing, isLoading: isLoadingExisting } = useCollaborator(id ?? '')
  const createMutation = useCreateCollaborator()
  const updateMutation = useUpdateCollaborator()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(collaboratorSchema),
    defaultValues: {
      nombre: '',
      area: '',
      puesto: '',
      email: '',
      fecha_ingreso: '',
    },
  })

  useEffect(() => {
    if (existing) {
      reset({
        nombre: existing.nombre,
        area: existing.area,
        puesto: existing.puesto,
        email: existing.email,
        fecha_ingreso: existing.fecha_ingreso.substring(0, 10),
      })
    }
  }, [existing, reset])

  async function onSubmit(values: FormValues) {
    try {
      if (isEdit && id) {
        const updated = await updateMutation.mutateAsync({ id, data: values })
        toast('Collaborator updated successfully', 'success')
        navigate(`/collaborators/${updated.id}`)
      } else {
        const created = await createMutation.mutateAsync({
          ...values,
          activo: true,
        })
        toast('Collaborator created successfully', 'success')
        navigate(`/collaborators/${created.id}`)
      }
    } catch (err) {
      toast(
        err instanceof Error ? err.message : 'Error saving collaborator',
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
            {isEdit ? 'Edit Collaborator' : 'New Collaborator'}
          </h1>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-xl border border-gray-200 p-6 space-y-4"
        >
          <FormField label="Name" error={errors.nombre?.message} required>
            <input
              {...register('nombre')}
              type="text"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
              placeholder="Full name"
            />
          </FormField>

          <FormField label="Area" error={errors.area?.message} required>
            <input
              {...register('area')}
              type="text"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
              placeholder="e.g. Engineering, Marketing..."
            />
          </FormField>

          <FormField label="Position" error={errors.puesto?.message} required>
            <input
              {...register('puesto')}
              type="text"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
              placeholder="e.g. Frontend Developer"
            />
          </FormField>

          <FormField label="Email" error={errors.email?.message} required>
            <input
              {...register('email')}
              type="email"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
              placeholder="email@company.com"
            />
          </FormField>

          <FormField label="Start date" error={errors.fecha_ingreso?.message} required>
            <input
              {...register('fecha_ingreso')}
              type="date"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
            />
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
              {isSubmitting ? 'Saving...' : isEdit ? 'Save changes' : 'Create collaborator'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
