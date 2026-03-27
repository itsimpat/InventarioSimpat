import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CurrencyInput } from './CurrencyInput'

vi.mock('../../utils/banxico', () => ({
  fetchExchangeRate: vi.fn().mockResolvedValue(20),
}))

// Suppress localStorage errors in jsdom
beforeEach(() => {
  vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => undefined)
})

describe('CurrencyInput', () => {
  it('renderiza el label y el input', async () => {
    render(<CurrencyInput valueMXN={0} onChange={vi.fn()} label="Costo" />)
    expect(screen.getByText('Costo')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText('Cargando tipo de cambio...')).not.toBeInTheDocument())
  })

  it('muestra los botones MXN y USD', () => {
    render(<CurrencyInput valueMXN={0} onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'MXN' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'USD' })).toBeInTheDocument()
  })

  it('MXN está activo por defecto', () => {
    render(<CurrencyInput valueMXN={0} onChange={vi.fn()} />)
    const mxnBtn = screen.getByRole('button', { name: 'MXN' })
    expect(mxnBtn.className).toContain('bg-indigo-600')
  })

  it('llama onChange con mxn y usd al escribir en modo MXN', async () => {
    const onChange = vi.fn()
    render(<CurrencyInput valueMXN={0} onChange={onChange} />)
    // Esperar a que el TC esté cargado (rate = 20)
    await waitFor(() => expect(screen.getByText(/TC:.*20\.00/)).toBeInTheDocument())

    const input = screen.getByPlaceholderText('0.00')
    fireEvent.change(input, { target: { value: '2000' } })

    expect(onChange).toHaveBeenCalledWith(2000, expect.closeTo(100, 0)) // 2000 / 20 = 100
  })

  it('cambia a modo USD al hacer clic en USD', async () => {
    render(<CurrencyInput valueMXN={0} onChange={vi.fn()} />)
    await waitFor(() => screen.queryByText('Cargando tipo de cambio...') === null)

    const usdBtn = screen.getByRole('button', { name: 'USD' })
    fireEvent.click(usdBtn)

    expect(usdBtn.className).toContain('bg-indigo-600')
    const mxnBtn = screen.getByRole('button', { name: 'MXN' })
    expect(mxnBtn.className).not.toContain('bg-indigo-600')
  })

  it('en modo USD llama onChange con mxn calculado y usd ingresado', async () => {
    const onChange = vi.fn()
    render(<CurrencyInput valueMXN={0} onChange={onChange} />)
    await waitFor(() => screen.queryByText('Cargando tipo de cambio...') === null)

    fireEvent.click(screen.getByRole('button', { name: 'USD' }))

    const input = screen.getByPlaceholderText('0.00')
    fireEvent.change(input, { target: { value: '100' } })

    expect(onChange).toHaveBeenCalledWith(
      expect.closeTo(2000, 0), // 100 * 20 = 2000 MXN
      100
    )
  })

  it('muestra el preview en USD cuando se ingresa MXN', async () => {
    render(<CurrencyInput valueMXN={1000} onChange={vi.fn()} />)
    await waitFor(() => screen.getByText(/≈.*USD/))
    expect(screen.getByText(/≈.*USD/)).toBeInTheDocument()
  })

  it('muestra el preview en MXN cuando se ingresa USD', async () => {
    render(<CurrencyInput valueMXN={0} onChange={vi.fn()} />)
    await waitFor(() => screen.queryByText('Cargando tipo de cambio...') === null)

    fireEvent.click(screen.getByRole('button', { name: 'USD' }))
    const input = screen.getByPlaceholderText('0.00')
    fireEvent.change(input, { target: { value: '50' } })

    await waitFor(() => expect(screen.getByText(/≈.*MXN/)).toBeInTheDocument())
  })

  it('muestra el tipo de cambio cuando está disponible', async () => {
    render(<CurrencyInput valueMXN={0} onChange={vi.fn()} />)
    await waitFor(() => expect(screen.getByText(/TC:.*20\.00/)).toBeInTheDocument())
  })
})
