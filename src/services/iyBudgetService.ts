import { insforge } from '../lib/insforge'
import type { IYBudget } from '../types'

export const iyBudgetService = {
  async getByCollaboratorId(collaboratorId: string): Promise<IYBudget | null> {
    const { data, error } = await insforge.database
      .from('iy_budgets')
      .select()
      .eq('colaborador_id', collaboratorId)
      .single()

    if (error) {
      // .single() returns 406 when no row exists — treat as not found
      return null
    }

    return data ? (data as IYBudget) : null
  },

  async upsert(collaboratorId: string, montoTotal: number): Promise<IYBudget> {
    const existing = await iyBudgetService.getByCollaboratorId(collaboratorId)

    if (existing) {
      const { data, error } = await insforge.database
        .from('iy_budgets')
        .update({ monto_total: montoTotal })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw new Error(error.message)
      if (!data) throw new Error('No se pudo actualizar el presupuesto IY')
      return data as IYBudget
    }

    const { data, error } = await insforge.database
      .from('iy_budgets')
      .insert({ colaborador_id: collaboratorId, monto_total: montoTotal })
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('No se pudo crear el presupuesto IY')
    return data as IYBudget
  },
}
