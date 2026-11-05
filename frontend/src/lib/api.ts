/**
 * Configuracion central de acceso al backend.
 *
 * En desarrollo Vite redirige `/api` hacia el backend local (ver vite.config.ts).
 * En produccion el frontend se publica como sitio estatico (Vercel) y la API
 * vive en otro dominio (Railway), por lo que hay que apuntar a la URL publica
 * del backend. Ese valor es publico (viaja dentro del bundle), asi que se deja
 * como respaldo para que el sitio funcione aunque la variable de entorno no
 * este definida o tenga un valor invalido.
 *
 * Orden de prioridad:
 *   1. `VITE_API_URL`, solo si es una URL valida (http/https, sin `<>`).
 *   2. La URL de produccion de Railway (solo en builds de produccion).
 *   3. `/api` relativo (desarrollo y fallback final).
 */

/** Backend publico de produccion (Railway). */
export const PRODUCTION_API_URL = 'https://juventudguacarhue-production.up.railway.app/api'

/** Valida y normaliza `VITE_API_URL`; devuelve '' si no sirve. */
function leerApiUrlConfigurada(valor: string | undefined): string {
  const limpio = (valor ?? '').trim().replace(/\/+$/, '')

  if (!limpio) {
    return ''
  }

  if (!/^https?:\/\/[^\s<>]+$/i.test(limpio)) {
    console.warn(
      `[api] VITE_API_URL no es una URL valida ("${limpio}"): se ignora y se usa ` +
        `${import.meta.env.PROD ? PRODUCTION_API_URL : '/api'}.`,
    )
    return ''
  }

  return limpio
}

const CONFIGURED_API_URL = leerApiUrlConfigurada(import.meta.env.VITE_API_URL)
const RAW_API_URL =
  CONFIGURED_API_URL || (import.meta.env.PROD ? PRODUCTION_API_URL : '')

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
