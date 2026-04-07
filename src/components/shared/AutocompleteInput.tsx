import { useState, useRef, useEffect, forwardRef } from 'react'

type Props = {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  name?: string
  suggestions: string[]
  placeholder?: string
  id?: string
  disabled?: boolean
}

export const AutocompleteInput = forwardRef<HTMLInputElement, Props>(
  ({ value, onChange, onBlur, name, suggestions, placeholder, id, disabled }, ref) => {
    const [open, setOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const filtered = suggestions.filter(
      (s) =>
        s.toLowerCase().includes(value.toLowerCase()) &&
        s.toLowerCase() !== value.toLowerCase()
    )

    useEffect(() => {
      function handleClickOutside(e: MouseEvent) {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setOpen(false)
        }
      }
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
      <div ref={containerRef} className="relative">
        <input
          ref={ref}
          id={id}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={onBlur}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
        />
        {open && filtered.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filtered.map((s) => (
              <li
                key={s}
                onMouseDown={(e) => {
                  e.preventDefault()
                  onChange(s)
                  setOpen(false)
                }}
                className="px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer"
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }
)

AutocompleteInput.displayName = 'AutocompleteInput'
