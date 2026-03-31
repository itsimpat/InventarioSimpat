export type EquipmentStatus =
  | 'Assigned'
  | 'In Storage'
  | 'Under Repair'
  | 'Sold'
  | 'Decommissioned'
  | 'Requested'

export type PeripheralType = 'Monitor' | 'Keyboard' | 'Headphones' | 'Mouse' | 'Other'

export type LicenseType = 'Monthly' | 'Annual'

export type LicenseCategory = 'IY' | 'General'

export type OfficeItemCategory = 'Chair' | 'Desk' | 'TV' | 'Other'

export type HistoryEventType = 'Reassignment' | 'Repair' | 'Maintenance' | 'Other'

export type EntityType = 'Equipment' | 'Peripheral' | 'OfficeItem'

export interface Collaborator {
  id: string
  nombre: string
  area: string
  puesto: string
  email: string
  activo: boolean
  fecha_ingreso: string
  created_at: string
  updated_at: string
}

export interface Equipment {
  id: string
  marca: string
  modelo: string
  anio_compra: number
  costo_mxn: number
  costo_usd: number
  especificaciones: Record<string, string>
  estatus: EquipmentStatus
  colaborador_id: string | null
  fecha_compra: string
  admin_user: string | null
  admin_password: string | null
  created_at: string
  updated_at: string
}

export interface Peripheral {
  id: string
  tipo: PeripheralType
  marca: string
  modelo: string
  costo_mxn: number
  costo_usd: number
  fecha_compra: string
  estatus: EquipmentStatus
  colaborador_id: string | null
  created_at: string
  updated_at: string
}

export interface License {
  id: string
  nombre_producto: string
  tipo: LicenseType
  costo_mxn: number
  costo_usd: number
  fecha_renovacion: string
  colaborador_id: string
  categoria: LicenseCategory
  activa: boolean
  created_at: string
  updated_at: string
}

export interface IYBudget {
  id: string
  colaborador_id: string
  monto_total: number
  created_at: string
  updated_at: string
}

export interface OfficeItem {
  id: string
  nombre: string
  categoria: OfficeItemCategory
  marca: string
  costo_mxn: number
  costo_usd: number
  fecha_compra: string
  cantidad: number
  created_at: string
  updated_at: string
}

export interface HistoryEvent {
  id: string
  entidad_tipo: EntityType
  entidad_id: string
  tipo_evento: HistoryEventType
  descripcion: string
  fecha_inicio: string
  fecha_fin: string | null
  tecnico_nombre: string | null
  tecnico_telefono: string | null
  costo_mxn: number | null
  costo_usd: number | null
  colaborador_anterior_id: string | null
  colaborador_nuevo_id: string | null
  registrado_por: string
  created_at: string
}

export interface ExchangeRate {
  id: string
  fecha: string
  valor: number
  fuente: string
}

export interface NotificationConfig {
  id: string
  dias_anticipacion: number
  admin_id: string | null
  created_at: string
  updated_at: string
}
