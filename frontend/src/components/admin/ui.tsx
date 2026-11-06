import { useEffect, useState, type ReactNode } from 'react'
import { apiUrl, resolveMediaUrl } from '../../lib/api'

export type Notify = (message: string, tone?: 'success' | 'error') => void

export interface ManagerProps {
  canManage: boolean
  notify: Notify
}

export type BadgeTone = 'blue' | 'green' | 'amber' | 'rose' | 'slate'

export const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100'

export const textareaClass = `${inputClass} min-h-[96px] resize-y`

export const selectClass = inputClass

export const labelClass = 'mb-1.5 block text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500'

export const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50'

export const secondaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50'

export const dangerButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50'

export const subtleButtonClass =
  'inline-flex items-center justify-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40'

export const dangerLinkClass =
  'inline-flex items-center justify-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40'

const badgeTones: Record<BadgeTone, string> = {
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  rose: 'bg-rose-50 text-rose-700 ring-rose-200',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
}

export function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: BadgeTone }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ring-1 ring-inset ${badgeTones[tone]}`}
    >
      {children}
    </span>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  )
}

export function SectionHeading({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-2xl font-bold uppercase tracking-[0.04em] text-slate-950">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function Field({
  label,
  error,
  hint,
  className = '',
  children,
}: {
  label: string
  error?: string
  hint?: string
  className?: string
  children: ReactNode
}) {
  return (
    <label className={`block ${className}`}>
      <span className={labelClass}>{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-[11px] font-semibold text-rose-600">{error}</span>
      ) : (
        hint && <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>
      )}
    </label>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-12 text-center">
      <p className="text-sm font-bold uppercase tracking-[0.08em] text-slate-700">{title}</p>
      {description && <p className="max-w-md text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export function ImagePreview({
  url,
  alt,
  className = '',
}: {
  url: string
  alt: string
  className?: string
}) {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [url])

  if (!url.trim() || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-100 text-center text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 ${className}`}
      >
        Sin imagen
      </div>
    )
  }

  return (
    <img
      src={resolveMediaUrl(url)}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  )
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'danger',
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'primary'
  onConfirm: () => void
  onCancel: () => void
}) {
  useEffect(() => {
    if (!open) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onCancel])

  if (!open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="text-xl font-bold text-slate-950">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{message}</p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onCancel} className={secondaryButtonClass}>
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={tone === 'danger' ? dangerButtonClass : primaryButtonClass}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export function formatFecha(value: string): string {
  if (!value) {
    return 'Sin fecha'
  }

  const [year, month, day] = value.split('-')
  if (!year || !month || !day) {
    return value
  }

  return `${day}-${month}-${year}`
}

export function formatPrecio(value: number): string {
  return `$${value.toLocaleString('es-CL')}`
}

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function isImageSource(value: string): boolean {
  const normalized = value.trim()
  if (!normalized) {
    return false
  }

  return isHttpUrl(normalized) || /^data:image\//i.test(normalized)
}

export async function uploadImageFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo debe ser una imagen.')
  }

  const formData = new FormData()
  formData.append('image', file)

  const response = await fetch(apiUrl('/uploads'), {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    // El backend explica el motivo (formato no permitido, imagen de mas de 5 MB,
    // almacenamiento sin configurar). Sin leerlo, el panel solo decia "no se pudo
    // subir" y no habia forma de saber que habia que cambiar.
    const detalle = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(detalle?.error || 'No se pudo subir la imagen al servidor.')
  }

  const payload = (await response.json()) as { url?: string }
  if (!payload.url) {
    throw new Error('La respuesta del servidor no incluyó la URL de la imagen.')
  }

  // Guardamos la URL absoluta del backend para que la imagen se vea igual
  // desde el sitio publicado en Vercel.
  return resolveMediaUrl(payload.url)
}

export function readImageFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    return Promise.reject(new Error('El archivo debe ser una imagen.'))
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      if (!result) {
        reject(new Error('No se pudo leer la imagen seleccionada.'))
        return
      }
      resolve(result)
    }
    reader.onerror = () => reject(new Error('No se pudo leer la imagen seleccionada.'))
    reader.readAsDataURL(file)
  })
}

export function todayInputValue(): string {
  const now = new Date()
  const month = `${now.getMonth() + 1}`.padStart(2, '0')
  const day = `${now.getDate()}`.padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}
