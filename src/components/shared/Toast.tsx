import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastItem {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const TYPE_STYLES: Record<ToastType, string> = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  warning: 'bg-yellow-400 text-gray-900',
  info: 'bg-blue-600 text-white',
}

const TYPE_ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
}

function ToastList({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: string) => void }) {
  return createPortal(
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80 max-w-full">
      {items.map((item) => (
        <div
          key={item.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg ${TYPE_STYLES[item.type]}`}
        >
          <span className="font-bold text-base leading-none mt-0.5 shrink-0">
            {TYPE_ICONS[item.type]}
          </span>
          <span className="flex-1 text-sm leading-snug">{item.message}</span>
          <button
            onClick={() => onDismiss(item.id)}
            className="shrink-0 opacity-70 hover:opacity-100 transition-opacity text-inherit leading-none"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
      ))}
    </div>,
    document.body
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => dismiss(id), 4000)
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastList items={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider')
  return ctx
}
