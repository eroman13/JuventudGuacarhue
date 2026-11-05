/**
 * Configuracion central de acceso al backend.
 *
 * En desarrollo Vite redirige `/api` hacia el backend local (ver vite.config.ts).
 * En produccion el frontend se publica como sitio estatico (Vercel) y la API
 * vive en otro dominio (Railway), por lo que hay que definir `VITE_API_URL`
 * con la URL publica del backend, por ejemplo:
 *
 *   VITE_API_URL=https://juventud-guacarhue-production.up.railway.app/api
 */

const RAW_API_URL = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/+$/, '')

/** URL base de la API. Siempre termina en `/api`. */
export const API_BASE_URL = RAW_API_URL
  ? RAW_API_URL.endsWith('/api')
    ? RAW_API_URL
    : `${RAW_API_URL}/api`
  : '/api'

/**
 * Origen del backend (sin el sufijo `/api`), necesario para resolver recursos
 * estaticos como las imagenes subidas a `/uploads`.
 */
export const API_ORIGIN = API_BASE_URL.endsWith('/api')
  ? API_BASE_URL.slice(0, -'/api'.length)
  : ''

/** Construye la URL de un endpoint de la API: `apiUrl('/auth/login')`. */
export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalized}`
}

/**
 * Convierte rutas relativas de archivos subidos (`/uploads/foto.jpg`) en URLs
 * absolutas contra el backend, para que funcionen cuando el sitio se sirve
 * desde otro dominio (Vercel). Las URLs absolutas (http, https, data, blob)
 * se devuelven sin cambios y, sin `VITE_API_URL`, se mantiene la ruta relativa.
 */
export function resolveMediaUrl(url: string): string {
  const value = (url ?? '').trim()
  if (!value) {
    return ''
  }

  if (/^(?:https?:|data:|blob:)/i.test(value)) {
    return value
  }

  if (!API_ORIGIN) {
    return value
  }

  return `${API_ORIGIN}${value.startsWith('/') ? value : `/${value}`}`
}
