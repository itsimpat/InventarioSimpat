import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Layout } from '../../components/Layout'
import { FormField } from '../../components/shared/FormField'
import { useToast } from '../../components/shared/Toast'
import { useAuth } from '../../contexts/AuthContext'
import { adminService } from '../../services/adminService'

const MAX_ADMINS = 5

const inviteSchema = z.object({
  email: z.string().min(1, 'El email es requerido').email('Formato de email inválido'),
  name: z.string().min(1, 'El nombre es requerido'),
})

type InviteFormValues = z.infer<typeof inviteSchema>

export function AdminsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: admins = [], isLoading } = useQuery({
    queryKey: ['admins'],
    queryFn: () => adminService.listAdmins(),
  })

  const inviteMutation = useMutation({
    mutationFn: ({ email, name }: { email: string; name: string }) =>
      adminService.inviteAdmin(email, name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admins'] })
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
  })

  async function onSubmit(values: InviteFormValues) {
    try {
      await inviteMutation.mutateAsync(values)
      toast(`Administrador ${values.email} invitado correctamente`, 'success')
      reset()
    } catch (err) {
      toast(
        err instanceof Error ? err.message : 'Error al invitar administrador',
        'error'
      )
    }
  }

  const atLimit = admins.length >= MAX_ADMINS

  return (
    <Layout>
      <div className="max-w-2xl space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Administradores</h1>

        {/* Current admins list */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">
              Administradores actuales
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({admins.length}/{MAX_ADMINS})
              </span>
            </h2>
          </div>
          {isLoading ? (
            <div className="px-6 py-8 text-center text-gray-400 text-sm">Cargando...</div>
          ) : admins.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-400 text-sm">
              No hay administradores registrados
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {admins.map((admin) => (
                <li key={admin.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{admin.name}</p>
                    <p className="text-xs text-gray-500">{admin.email}</p>
                  </div>
                  {admin.id === user?.id && (
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                      Tú
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Invite form or limit message */}
        {atLimit ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-6 py-4 text-sm text-yellow-800">
            Límite de administradores alcanzado. Máximo {MAX_ADMINS} administradores permitidos.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Invitar nuevo administrador</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FormField label="Nombre" error={errors.name?.message} required>
                <input
                  {...register('name')}
                  type="text"
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                  placeholder="Nombre completo"
                />
              </FormField>
              <FormField label="Email" error={errors.email?.message} required>
                <input
                  {...register('email')}
                  type="email"
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                  placeholder="correo@empresa.com"
                />
              </FormField>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Invitando...' : 'Invitar administrador'}
              </button>
            </form>
          </div>
        )}
      </div>
    </Layout>
  )
}
