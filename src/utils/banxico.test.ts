import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchExchangeRate } from './banxico'

function mockFetch(body: unknown, status = 200, ok = true) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response)
}

describe('fetchExchangeRate', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_INSFORGE_URL', 'https://api.insforge.test')
    vi.stubEnv('VITE_INSFORGE_API_KEY', 'test-api-key')
  })

  it('retorna el tipo de cambio cuando la función responde correctamente', async () => {
    mockFetch({ rate: 17.5432 })
    const rate = await fetchExchangeRate()
    expect(rate).toBeCloseTo(17.5432)
  })

  it('llama al endpoint /functions/banxico-rate con el apikey en header', async () => {
    mockFetch({ rate: 17 })
    await fetchExchangeRate()
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/functions/banxico-rate'),
      expect.objectContaining({ headers: { apikey: 'test-api-key' } })
    )
  })

  it('lanza error cuando la respuesta HTTP no es ok', async () => {
    mockFetch({}, 500, false)
    await expect(fetchExchangeRate()).rejects.toThrow('500')
  })

  it('lanza error cuando la función retorna un campo error', async () => {
    mockFetch({ error: 'Token de Banxico inválido' })
    await expect(fetchExchangeRate()).rejects.toThrow('Token de Banxico inválido')
  })

  it('lanza error cuando rate no es número', async () => {
    mockFetch({ rate: 'N/E' })
    await expect(fetchExchangeRate()).rejects.toThrow('Respuesta inesperada')
  })

  it('lanza error cuando hay error de red', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
    await expect(fetchExchangeRate()).rejects.toThrow('Error de red')
  })

  it('retorna número con decimales correctamente', async () => {
    mockFetch({ rate: 19.8756 })
    const rate = await fetchExchangeRate()
    expect(rate).toBe(19.8756)
  })
})
