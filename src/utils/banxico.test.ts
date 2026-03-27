import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchExchangeRate } from './banxico'

function makeBanxicoResponse(dato: string) {
  return {
    bmx: {
      series: [{ datos: [{ dato }] }],
    },
  }
}

function mockFetch(body: unknown, status = 200, ok = true) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok,
    status,
    statusText: ok ? 'OK' : 'Unauthorized',
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response)
}

describe('fetchExchangeRate', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_BANXICO_TOKEN', 'test-token-123')
  })

  it('retorna el tipo de cambio cuando la API responde correctamente', async () => {
    mockFetch(makeBanxicoResponse('17.5432'))
    const rate = await fetchExchangeRate()
    expect(rate).toBeCloseTo(17.5432)
  })

  it('llama al endpoint correcto con el token en el header', async () => {
    mockFetch(makeBanxicoResponse('17.00'))
    await fetchExchangeRate()
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('SF43718'),
      expect.objectContaining({ headers: { 'Bmx-Token': 'test-token-123' } })
    )
  })

  it('lanza error cuando VITE_BANXICO_TOKEN no está configurado', async () => {
    vi.stubEnv('VITE_BANXICO_TOKEN', '')
    await expect(fetchExchangeRate()).rejects.toThrow('VITE_BANXICO_TOKEN')
  })

  it('lanza error cuando la respuesta HTTP no es ok', async () => {
    mockFetch({}, 401, false)
    await expect(fetchExchangeRate()).rejects.toThrow('401')
  })

  it('lanza error cuando el dato no es un número válido', async () => {
    mockFetch(makeBanxicoResponse('N/E'))
    await expect(fetchExchangeRate()).rejects.toThrow('tipo de cambio')
  })

  it('lanza error cuando hay error de red', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
    await expect(fetchExchangeRate()).rejects.toThrow('Error de red')
  })

  it('lanza error cuando la respuesta no es JSON válido', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockRejectedValue(new SyntaxError('Unexpected token')),
    } as unknown as Response)
    await expect(fetchExchangeRate()).rejects.toThrow('JSON válido')
  })

  it('lanza error cuando la estructura de Banxico es inesperada', async () => {
    mockFetch({ bmx: { series: [] } })
    await expect(fetchExchangeRate()).rejects.toThrow('Estructura inesperada')
  })
})
