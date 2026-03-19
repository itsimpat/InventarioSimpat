import { useState, useEffect } from 'react'
import { fetchExchangeRate } from '../../utils/banxico'
import { convertMXNtoUSD, formatUSD } from '../../utils/currency'
import { FormField } from './FormField'

const CACHE_KEY = 'banxico_rate'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

function getCachedRate(): number | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { rate: number; timestamp: number }
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }
    return parsed.rate
  } catch {
    return null
  }
}

function setCachedRate(rate: number) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ rate, timestamp: Date.now() })
    )
  } catch {
    // ignore storage errors
  }
}

type Props = {
  valueMXN: number
  onChange: (mxn: number, usd: number) => void
  label?: string
  error?: string
}

export function CurrencyInput({ valueMXN, onChange, label = 'Costo', error }: Props) {
  const [rate, setRate] = useState<number | null>(getCachedRate())
  const [rateError, setRateError] = useState<string | null>(null)

  useEffect(() => {
    if (rate !== null) return
    fetchExchangeRate()
      .then((r) => {
        setRate(r)
        setCachedRate(r)
      })
      .catch((err: unknown) => {
        setRateError(
          err instanceof Error ? err.message : 'Error al obtener tipo de cambio'
        )
      })
  }, [rate])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const mxn = parseFloat(e.target.value) || 0
    const usd = rate ? convertMXNtoUSD(mxn, rate) : 0
    onChange(mxn, usd)
  }

  const usdValue = rate && valueMXN ? convertMXNtoUSD(valueMXN, rate) : null

  return (
    <FormField label={`${label} (MXN)`} error={error} required>
      <div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
          <input
            type="number"
            min={0}
            step={0.01}
            value={valueMXN || ''}
            onChange={handleChange}
            className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="0.00"
          />
        </div>
        {rateError && (
          <p className="text-xs text-red-500 mt-1">{rateError}</p>
        )}
        {usdValue !== null && !rateError && (
          <p className="text-xs text-gray-400 mt-1">
            ≈ {formatUSD(usdValue)} USD
          </p>
        )}
        {rate === null && !rateError && (
          <p className="text-xs text-gray-400 mt-1">Cargando tipo de cambio...</p>
        )}
      </div>
    </FormField>
  )
}
