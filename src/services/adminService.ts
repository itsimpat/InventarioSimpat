import { insforge } from '../lib/insforge'

export interface AdminUser {
  id: string
  email: string
  name: string
}

export const adminService = {
  async listAdmins(): Promise<AdminUser[]> {
    const { data, error } = await insforge.database
      .from('admins')
      .select('id, email, name')
      .order('created_at', { ascending: true })

    if (error) throw new Error(error.message)

    return (data ?? []) as AdminUser[]
  },

  async inviteAdmin(email: string, name: string): Promise<void> {
    const { data, error } = await insforge.auth.signUp({
      email,
      password: Math.random().toString(36).slice(-12),
      name,
    })

    if (error) throw new Error(error.message)

    const userId = data?.user?.id
    if (!userId) throw new Error('No se pudo obtener el ID del usuario creado')

    const { error: insertError } = await insforge.database
      .from('admins')
      .insert({ id: userId, email, name })

    if (insertError) throw new Error(insertError.message)
  },
}
