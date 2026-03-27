import { describe, it, expect } from 'vitest'
import { convertMXNtoUSD, convertUSDtoMXN, formatUSD, formatMXN } from './currency'

describe('convertMXNtoUSD', () => {
  it('convierte correctamente MXN a USD', () => {
    expect(convertMXNtoUSD(17000, 17)).toBeCloseTo(1000)
  })

  it('maneja tasas no enteras', () => {
    expect(convertMXNtoUSD(1000, 16.5)).toBeCloseTo(60.606, 2)
  })

  it('retorna 0 cuando el monto es 0', () => {
    expect(convertMXNtoUSD(0, 17)).toBe(0)
  })

  it('lanza error cuando la tasa es 0', () => {
    expect(() => convertMXNtoUSD(1000, 0)).toThrow('El tipo de cambio debe ser mayor a cero')
  })

  it('lanza error cuando la tasa es negativa', () => {
    expect(() => convertMXNtoUSD(1000, -5)).toThrow('El tipo de cambio debe ser mayor a cero')
  })
})

describe('convertUSDtoMXN', () => {
  it('convierte correctamente USD a MXN', () => {
    expect(convertUSDtoMXN(1000, 17)).toBeCloseTo(17000)
  })

  it('es la operación inversa de convertMXNtoUSD', () => {
    const rate = 19.5
    const mxn = 5000
    const usd = convertMXNtoUSD(mxn, rate)
    expect(convertUSDtoMXN(usd, rate)).toBeCloseTo(mxn)
  })

  it('retorna 0 cuando el monto es 0', () => {
    expect(convertUSDtoMXN(0, 17)).toBe(0)
  })

  it('lanza error cuando la tasa es 0', () => {
    expect(() => convertUSDtoMXN(100, 0)).toThrow('El tipo de cambio debe ser mayor a cero')
  })

  it('lanza error cuando la tasa es negativa', () => {
    expect(() => convertUSDtoMXN(100, -5)).toThrow('El tipo de cambio debe ser mayor a cero')
  })

  it('maneja tasas no enteras', () => {
    expect(convertUSDtoMXN(100, 19.75)).toBeCloseTo(1975)
  })
})

describe('formatUSD', () => {
  it('formatea un número como dólares americanos', () => {
    expect(formatUSD(1000)).toBe('$1,000.00')
  })

  it('formatea números con decimales', () => {
    expect(formatUSD(1234.56)).toBe('$1,234.56')
  })

  it('formatea cero', () => {
    expect(formatUSD(0)).toBe('$0.00')
  })

  it('redondea a 2 decimales', () => {
    expect(formatUSD(1.999)).toBe('$2.00')
  })
})

describe('formatMXN', () => {
  it('formatea un número con sufijo MXN', () => {
    expect(formatMXN(1000)).toBe('$1,000.00 MXN')
  })

  it('formatea cero con sufijo MXN', () => {
    expect(formatMXN(0)).toBe('$0.00 MXN')
  })

  it('siempre termina en MXN', () => {
    expect(formatMXN(500.5)).toMatch(/MXN$/)
  })
})
