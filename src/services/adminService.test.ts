import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeBuilder } from '../test/mockInsforge'

vi.mock('../lib/insforge', () => ({
  insforge: {
    database: { from: vi.fn() },
    auth: { signUp: vi.fn() },
  },
}))

import { insforge } from '../lib/insforge'
import { adminService } from './adminService'

const mockFrom = vi.mocked(insforge.database.from)
const mockSignUp = vi.mocked(insforge.auth.signUp)

const adminBase = { id: 'a1', email: 'admin@simpat.com', name: 'Admin Uno' }

beforeEach(() => vi.clearAllMocks())

describe('adminService.listAdmins', () => {
  it('retorna la lista de admins', async () => {
    const builder = makeBuilder({ data: [adminBase], error: null })
    mockFrom.mockReturnValue(builder)
    const result = await adminService.listAdmins()
    expect(result).toEqual([adminBase])
    expect(builder.eq).toHaveBeenCalledWith('role', 'admin')
  })

  it('retorna arreglo vacío cuando no hay admins', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: null, error: null }))
    const result = await adminService.listAdmins()
    expect(result).toEqual([])
  })

  it('lanza error cuando InsForge falla', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: null, error: { message: 'DB error' } }))
    await expect(adminService.listAdmins()).rejects.toThrow('DB error')
  })
})

describe('adminService.inviteAdmin', () => {
  it('llama a signUp con el email y nombre proporcionados', async () => {
    mockSignUp.mockResolvedValue({ error: null } as never)
    await adminService.inviteAdmin('nuevo@simpat.com', 'Nuevo Admin')
    expect(mockSignUp).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'nuevo@simpat.com', name: 'Nuevo Admin' })
    )
  })

  it('genera una contraseña aleatoria para el nuevo admin', async () => {
    mockSignUp.mockResolvedValue({ error: null } as never)
    await adminService.inviteAdmin('otro@simpat.com', 'Otro Admin')
    const call = mockSignUp.mock.calls[0][0] as { password: string }
    expect(typeof call.password).toBe('string')
    expect(call.password.length).toBeGreaterThan(0)
  })

  it('lanza error cuando signUp falla', async () => {
    mockSignUp.mockResolvedValue({ error: { message: 'signup error' } } as never)
    await expect(adminService.inviteAdmin('x@y.com', 'X')).rejects.toThrow('signup error')
  })
})
