import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { formatDate, daysUntil, formatRelative } from './dates'

describe('formatDate', () => {
  it('formatea una fecha ISO en español', () => {
    expect(formatDate('2025-03-15')).toBe('15 mar 2025')
  })

  it('formatea enero correctamente', () => {
    expect(formatDate('2025-01-01')).toBe('1 ene 2025')
  })

  it('formatea diciembre correctamente', () => {
    expect(formatDate('2024-12-31')).toBe('31 dic 2024')
  })

  it('maneja todos los meses', () => {
    const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
    meses.forEach((mes, i) => {
      const month = String(i + 1).padStart(2, '0')
      expect(formatDate(`2025-${month}-01`)).toContain(mes)
    })
  })
})

describe('daysUntil', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date('2025-03-27T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('retorna 0 para hoy', () => {
    expect(daysUntil('2025-03-27')).toBe(0)
  })

  it('retorna 7 para una fecha 7 días en el futuro', () => {
    expect(daysUntil('2025-04-03')).toBe(7)
  })

  it('retorna -1 para ayer', () => {
    expect(daysUntil('2025-03-26')).toBe(-1)
  })

  it('retorna número positivo para fechas futuras', () => {
    expect(daysUntil('2025-04-01')).toBeGreaterThan(0)
  })

  it('retorna número negativo para fechas pasadas', () => {
    expect(daysUntil('2025-03-01')).toBeLessThan(0)
  })
})

describe('formatRelative', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date('2025-03-27T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('retorna "hoy" para la fecha actual', () => {
    expect(formatRelative('2025-03-27')).toBe('hoy')
  })

  it('retorna "en 1 día" para mañana', () => {
    expect(formatRelative('2025-03-28')).toBe('en 1 día')
  })

  it('retorna "en N días" para días futuros menores a 30', () => {
    expect(formatRelative('2025-04-03')).toBe('en 7 días')
  })

  it('retorna "en 1 mes" para ~30-59 días en el futuro', () => {
    expect(formatRelative('2025-04-26')).toBe('en 1 mes')
  })

  it('retorna "en N meses" para fechas lejanas', () => {
    expect(formatRelative('2025-09-27')).toMatch(/en \d+ meses/)
  })

  it('retorna "hace 1 día" para ayer', () => {
    expect(formatRelative('2025-03-26')).toBe('hace 1 día')
  })

  it('retorna "hace N días" para días pasados menores a 30', () => {
    expect(formatRelative('2025-03-20')).toBe('hace 7 días')
  })

  it('retorna "hace 1 mes" para ~30-59 días en el pasado', () => {
    expect(formatRelative('2025-02-25')).toBe('hace 1 mes')
  })

  it('retorna "hace N meses" para fechas muy pasadas', () => {
    expect(formatRelative('2024-09-27')).toMatch(/hace \d+ meses/)
  })
})
