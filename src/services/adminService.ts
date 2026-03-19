import { insforge } from '../lib/insforge'

export interface AdminUser {
  id: string
  email: string
  name: string
}

export const adminService = {
  async listAdmins(): Promise<AdminUser[]> {
    const { data, error } = await insforge.database
      .from('profiles')
      .select('id, email, name')
      .eq('role', 'admin')

    if (error) throw new Error(error.message)

    return (data ?? []) as AdminUser[]
  },

  async inviteAdmin(email: string, name: string): Promise<void> {
    const { error } = await insforge.auth.signUp({
      email,
      password: Math.random().toString(36).slice(-12),
      name,
    })

    if (error) throw new Error(error.message)
  },
}
