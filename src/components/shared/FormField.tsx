import type { ReactNode } from 'react'

type Props = {
  label: string
  error?: string
  required?: boolean
  children: ReactNode
}

export function FormField({ label, error, required = false, children }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-600 mt-0.5">{error}</p>
      )}
    </div>
  )
}
