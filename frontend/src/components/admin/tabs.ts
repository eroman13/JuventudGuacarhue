export type AdminTab =
  | 'dashboard'
  | 'noticias'
  | 'jugadores'
  | 'partidos'
  | 'galeria'
  | 'productos'
  | 'videos'
  | 'pedidos'
  | 'abonados'
  | 'config'
  | 'respaldo'

export interface AdminTabMeta {
  id: AdminTab
  label: string
}

export const ADMIN_TABS: AdminTabMeta[] = [
  { id: 'dashboard', label: 'Resumen' },
  { id: 'noticias', label: 'Noticias' },
  { id: 'jugadores', label: 'Planteles' },
  { id: 'partidos', label: 'Partidos' },
  { id: 'galeria', label: 'Galeria' },
  { id: 'productos', label: 'Tienda' },
  { id: 'videos', label: 'Videos' },
  { id: 'pedidos', label: 'Pedidos' },
  { id: 'abonados', label: 'Abonados' },
  { id: 'config', label: 'Configuracion' },
  { id: 'respaldo', label: 'Respaldo' },
]
