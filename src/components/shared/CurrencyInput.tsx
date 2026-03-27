import { useState, useEffect } from 'react'
import { fetchExchangeRate } from '../../utils/banxico'
import { convertMXNtoUSD, convertUSDtoMXN, formatUSD, formatMXN } from '../../utils/currency'
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

type Currency = 'MXN' | 'USD'

type Props = {
  valueMXN: number
  onChange: (mxn: number, usd: number) => void
  label?: string
  error?: string
}

export function CurrencyInput({ valueMXN, onChange, label = 'Costo', error }: Props) {
  const [rate, setRate] = useState<number | null>(getCachedRate())
  const [rateError, setRateError] = useState<string | null>(null)
  const [currency, setCurrency] = useState<Currency>('MXN')
  // raw input value in the selected currency
  const [inputValue, setInputValue] = useState<string>(valueMXN > 0 ? String(valueMXN) : '')

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

  // Sync inputValue when valueMXN changes externally (e.g. editing existing record)
  useEffect(() => {
    if (valueMXN > 0 && inputValue === '') {
      if (currency === 'MXN') {
        setInputValue(String(valueMXN))
      } else if (rate) {
        setInputValue(String(parseFloat(convertMXNtoUSD(valueMXN, rate).toFixed(2))))
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueMXN])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    setInputValue(raw)
    const amount = parseFloat(raw) || 0

    if (currency === 'MXN') {
      const usd = rate ? convertMXNtoUSD(amount, rate) : 0
      onChange(amount, usd)
    } else {
      const mxn = rate ? convertUSDtoMXN(amount, rate) : 0
      onChange(mxn, amount)
    }
  }

  function handleCurrencyToggle(next: Currency) {
    if (next === currency) return
    const current = parseFloat(inputValue) || 0

    if (next === 'USD' && rate && current > 0) {
      // was MXN → convert to USD
      const usd = convertMXNtoUSD(current, rate)
      setInputValue(parseFloat(usd.toFixed(2)).toString())
    } else if (next === 'MXN' && rate && current > 0) {
      // was USD → convert to MXN
      const mxn = convertUSDtoMXN(current, rate)
      setInputValue(parseFloat(mxn.toFixed(2)).toString())
    }

    setCurrency(next)
  }

  // Compute preview in the other currency
  const amount = parseFloat(inputValue) || 0
  let preview: string | null = null
  if (rate && amount > 0 && !rateError) {
    if (currency === 'MXN') {
      preview = `≈ ${formatUSD(convertMXNtoUSD(amount, rate))} USD`
    } else {
      preview = `≈ ${formatMXN(convertUSDtoMXN(amount, rate))}`
    }
  }

  return (
    <FormField label={label} error={error} required>
      <div>
        {/* Toggle */}
        <div className="flex rounded-lg border border-gray-300 overflow-hidden mb-2 w-fit">
          {(['MXN', 'USD'] as Currency[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => handleCurrencyToggle(c)}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                currency === c
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
            {currency === 'MXN' ? '$' : 'US$'}
          </span>
          <input
            type="number"
            min={0}
            step={0.01}
            value={inputValue}
            onChange={handleChange}
            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="0.00"
          />
        </div>

        {rateError && (
          <p className="text-xs text-red-500 mt-1">{rateError}</p>
        )}
        {preview && (
          <p className="text-xs text-gray-400 mt-1">{preview}</p>
        )}
        {rate === null && !rateError && (
          <p className="text-xs text-gray-400 mt-1">Cargando tipo de cambio...</p>
        )}
        {rate && (
          <p className="text-xs text-gray-300 mt-0.5">TC: ${rate.toFixed(2)} MXN/USD</p>
        )}
      </div>
    </FormField>
  )
}
