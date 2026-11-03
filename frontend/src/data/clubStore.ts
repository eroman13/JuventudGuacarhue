import {
  abonadosSeed,
  clubDataSeed,
  pedidosSeed,
  type ClubData,
  type AbonadoItem,
  type GaleriaItem,
  type JugadorItem,
  type NoticiaItem,
  type PedidoItem,
  type PartidoItem,
  type ProductoItem,
  type VideoItem,
  videosSeed,
} from './seedData'

/**
 * Almacén local de contenidos del club.
 *
 * Es la única fuente de verdad para las páginas públicas y el panel de
 * administración. Persiste en localStorage y notifica a todos los componentes
 * suscritos (useClubData) para que los cambios se reflejen al instante.
 */
export const CLUB_DATA_STORAGE_KEY = 'juventud_club_data_v1'
const STORAGE_KEY = CLUB_DATA_STORAGE_KEY

type Listener = () => void

let snapshot: ClubData | null = null
const listeners = new Set<Listener>()

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function isValidClubData(value: unknown): value is ClubData {
  if (!isRecord(value)) {
    return false
  }

  return (
    Array.isArray(value.noticias) &&
    Array.isArray(value.partidos) &&
    Array.isArray(value.galeria) &&
    Array.isArray(value.productos) &&
    Array.isArray(value.videos) &&
    Array.isArray(value.pedidos) &&
    Array.isArray(value.abonados) &&
    Array.isArray(value.planteles) &&
    value.planteles.every(
      (plantel) =>
        isRecord(plantel) &&
        typeof plantel.nombre === 'string' &&
        Array.isArray(plantel.jugadores),
    )
  )
}

function normalizeClubData(value: unknown): ClubData | null {
  if (!isRecord(value)) {
    return null
  }

  const baseShapeValid =
    Array.isArray(value.noticias) &&
    Array.isArray(value.partidos) &&
    Array.isArray(value.galeria) &&
    Array.isArray(value.productos) &&
    Array.isArray(value.planteles)

  if (!baseShapeValid) {
    return null
  }

  const normalized: ClubData = {
    noticias: value.noticias as NoticiaItem[],
    partidos: value.partidos as PartidoItem[],
    planteles: value.planteles as ClubData['planteles'],
    galeria: value.galeria as GaleriaItem[],
    productos: value.productos as ProductoItem[],
    videos: Array.isArray(value.videos) ? (value.videos as VideoItem[]) : clone(videosSeed),
    pedidos: Array.isArray(value.pedidos) ? (value.pedidos as PedidoItem[]) : clone(pedidosSeed),
    abonados: Array.isArray(value.abonados)
      ? (value.abonados as AbonadoItem[])
      : clone(abonadosSeed),
    config: isRecord(value.config) && typeof value.config.carouselItems === 'number' 
      ? (value.config as ClubData['config'])
      : clone(clubDataSeed.config),
  }

  return normalized
}

function readFromStorage(): ClubData {
  if (typeof window === 'undefined') {
    return clone(clubDataSeed)
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return clone(clubDataSeed)
    }

    const parsed: unknown = JSON.parse(raw)
    const normalized = normalizeClubData(parsed)
    return normalized ? clone(normalized) : clone(clubDataSeed)
  } catch {
    return clone(clubDataSeed)
  }
}

export function getSnapshot(): ClubData {
  if (!snapshot) {
    snapshot = readFromStorage()
  }
  return snapshot
}

function emit(): void {
  listeners.forEach((listener) => listener())
}

function commit(next: ClubData): void {
  snapshot = next

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Si el almacenamiento está lleno o bloqueado mantenemos el estado en memoria.
    }
  }

  emit()
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      snapshot = null
      emit()
    }
  })
}

function nextNumericId(items: Array<{ id: number }>): number {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1
}

function nextJugadorId(): string {
  return `j-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/* ------------------------------------------------------------------ */
/* Noticias                                                            */
/* ------------------------------------------------------------------ */

export function addNoticia(payload: Omit<NoticiaItem, 'id'>): number {
  const data = getSnapshot()
  const id = nextNumericId(data.noticias)
  commit({ ...data, noticias: [{ id, ...payload }, ...data.noticias] })
  return id
}

export function updateNoticia(id: number, payload: Partial<Omit<NoticiaItem, 'id'>>): boolean {
  const data = getSnapshot()
  if (!data.noticias.some((noticia) => noticia.id === id)) {
    return false
  }

  commit({
    ...data,
    noticias: data.noticias.map((noticia) =>
      noticia.id === id ? { ...noticia, ...payload, id } : noticia,
    ),
  })
  return true
}

export function deleteNoticia(id: number): void {
  const data = getSnapshot()
  commit({ ...data, noticias: data.noticias.filter((noticia) => noticia.id !== id) })
}

/* ------------------------------------------------------------------ */
/* Partidos                                                            */
/* ------------------------------------------------------------------ */

export function addPartido(payload: Omit<PartidoItem, 'id'>): number {
  const data = getSnapshot()
  const id = nextNumericId(data.partidos)
  commit({ ...data, partidos: [{ id, ...payload }, ...data.partidos] })
  return id
}

export function updatePartido(id: number, payload: Partial<Omit<PartidoItem, 'id'>>): boolean {
  const data = getSnapshot()
  if (!data.partidos.some((partido) => partido.id === id)) {
    return false
  }

  commit({
    ...data,
    partidos: data.partidos.map((partido) =>
      partido.id === id ? { ...partido, ...payload, id } : partido,
    ),
  })
  return true
}

export function deletePartido(id: number): void {
  const data = getSnapshot()
  commit({ ...data, partidos: data.partidos.filter((partido) => partido.id !== id) })
}

/* ------------------------------------------------------------------ */
/* Planteles y jugadores                                               */
/* ------------------------------------------------------------------ */

export function addPlantel(nombre: string): boolean {
  const limpio = nombre.trim()
  if (!limpio) {
    return false
  }

  const data = getSnapshot()
  const exists = data.planteles.some(
    (plantel) => plantel.nombre.toLowerCase() === limpio.toLowerCase(),
  )
  if (exists) {
    return false
  }

  commit({
    ...data,
    planteles: [...data.planteles, { nombre: limpio, jugadores: [] }],
  })
  return true
}

export function renamePlantel(actual: string, nuevo: string): boolean {
  const limpio = nuevo.trim()
  if (!limpio) {
    return false
  }

  const data = getSnapshot()
  const plantel = data.planteles.find((item) => item.nombre === actual)
  if (!plantel) {
    return false
  }

  const duplicate = data.planteles.some(
    (item) => item.nombre !== actual && item.nombre.toLowerCase() === limpio.toLowerCase(),
  )
  if (duplicate) {
    return false
  }

  commit({
    ...data,
    planteles: data.planteles.map((item) =>
      item.nombre === actual ? { ...item, nombre: limpio } : item,
    ),
  })
  return true
}

export function deletePlantel(nombre: string): boolean {
  const data = getSnapshot()
  const plantel = data.planteles.find((item) => item.nombre === nombre)
  if (!plantel || plantel.jugadores.length > 0) {
    return false
  }

  commit({
    ...data,
    planteles: data.planteles.filter((item) => item.nombre !== nombre),
  })
  return true
}

export function addJugador(
  plantelNombre: string,
  payload: Omit<JugadorItem, 'id'>,
): string {
  const data = getSnapshot()
  const id = nextJugadorId()
  const jugador: JugadorItem = { id, ...payload }
  const target = plantelNombre.trim() || 'Primer Equipo'

  const exists = data.planteles.some((plantel) => plantel.nombre === target)
  const planteles = exists
    ? data.planteles.map((plantel) =>
        plantel.nombre === target
          ? { ...plantel, jugadores: [...plantel.jugadores, jugador] }
          : plantel,
      )
    : [...data.planteles, { nombre: target, jugadores: [jugador] }]

  commit({ ...data, planteles })
  return id
}

export function updateJugador(
  jugadorId: string,
  payload: Omit<JugadorItem, 'id'>,
  plantelDestino?: string,
): boolean {
  const data = getSnapshot()
  const plantelOrigen = data.planteles.find((plantel) =>
    plantel.jugadores.some((jugador) => jugador.id === jugadorId),
  )
  const jugadorOrigen = plantelOrigen?.jugadores.find((jugador) => jugador.id === jugadorId)

  if (!plantelOrigen || !jugadorOrigen) {
    return false
  }

  const destino = (plantelDestino ?? plantelOrigen.nombre).trim() || plantelOrigen.nombre
  const jugadorActualizado: JugadorItem = { ...jugadorOrigen, ...payload, id: jugadorId }

  const sinJugador = data.planteles.map((plantel) => {
    if (plantel.nombre === plantelOrigen.nombre) {
      return {
        ...plantel,
        jugadores: plantel.jugadores.filter((jugador) => jugador.id !== jugadorId),
      }
    }
    return plantel
  })

  const destinoExiste = sinJugador.some((plantel) => plantel.nombre === destino)
  const planteles = destinoExiste
    ? sinJugador.map((plantel) =>
        plantel.nombre === destino
          ? { ...plantel, jugadores: [...plantel.jugadores, jugadorActualizado] }
          : plantel,
      )
    : [...sinJugador, { nombre: destino, jugadores: [jugadorActualizado] }]

  commit({ ...data, planteles })
  return true
}

export function deleteJugador(plantelNombre: string, jugadorId: string): void {
  const data = getSnapshot()
  commit({
    ...data,
    planteles: data.planteles.map((plantel) =>
      plantel.nombre === plantelNombre
        ? {
            ...plantel,
            jugadores: plantel.jugadores.filter((jugador) => jugador.id !== jugadorId),
          }
        : plantel,
    ),
  })
}

/* ------------------------------------------------------------------ */
/* Galería                                                             */
/* ------------------------------------------------------------------ */

export function addFoto(payload: Omit<GaleriaItem, 'id'>): number {
  const data = getSnapshot()
  const id = nextNumericId(data.galeria)
  commit({ ...data, galeria: [{ id, ...payload }, ...data.galeria] })
  return id
}

export function updateFoto(id: number, payload: Partial<Omit<GaleriaItem, 'id'>>): boolean {
  const data = getSnapshot()
  if (!data.galeria.some((foto) => foto.id === id)) {
    return false
  }

  commit({
    ...data,
    galeria: data.galeria.map((foto) => (foto.id === id ? { ...foto, ...payload, id } : foto)),
  })
  return true
}

export function deleteFoto(id: number): void {
  const data = getSnapshot()
  commit({ ...data, galeria: data.galeria.filter((foto) => foto.id !== id) })
}

/* ------------------------------------------------------------------ */
/* Productos                                                           */
/* ------------------------------------------------------------------ */

export function addProducto(payload: Omit<ProductoItem, 'id'>): number {
  const data = getSnapshot()
  const id = nextNumericId(data.productos)
  commit({ ...data, productos: [{ id, ...payload }, ...data.productos] })
  return id
}

export function updateProducto(
  id: number,
  payload: Partial<Omit<ProductoItem, 'id'>>,
): boolean {
  const data = getSnapshot()
  if (!data.productos.some((producto) => producto.id === id)) {
    return false
  }

  commit({
    ...data,
    productos: data.productos.map((producto) =>
      producto.id === id ? { ...producto, ...payload, id } : producto,
    ),
  })
  return true
}

export function deleteProducto(id: number): void {
  const data = getSnapshot()
  commit({ ...data, productos: data.productos.filter((producto) => producto.id !== id) })
}

/* ------------------------------------------------------------------ */
/* Videos                                                              */
/* ------------------------------------------------------------------ */

export function addVideo(payload: Omit<VideoItem, 'id'>): number {
  const data = getSnapshot()
  const id = nextNumericId(data.videos)
  commit({ ...data, videos: [{ id, ...payload }, ...data.videos] })
  return id
}

export function updateVideo(id: number, payload: Partial<Omit<VideoItem, 'id'>>): boolean {
  const data = getSnapshot()
  if (!data.videos.some((video) => video.id === id)) {
    return false
  }

  commit({
    ...data,
    videos: data.videos.map((video) => (video.id === id ? { ...video, ...payload, id } : video)),
  })
  return true
}

export function deleteVideo(id: number): void {
  const data = getSnapshot()
  commit({ ...data, videos: data.videos.filter((video) => video.id !== id) })
}

/* ------------------------------------------------------------------ */
/* Pedidos                                                             */
/* ------------------------------------------------------------------ */

export function addPedido(payload: Omit<PedidoItem, 'id'>): number {
  const data = getSnapshot()
  const id = nextNumericId(data.pedidos)
  commit({ ...data, pedidos: [{ id, ...payload }, ...data.pedidos] })
  return id
}

export function updatePedido(id: number, payload: Partial<Omit<PedidoItem, 'id'>>): boolean {
  const data = getSnapshot()
  if (!data.pedidos.some((pedido) => pedido.id === id)) {
    return false
  }

  commit({
    ...data,
    pedidos: data.pedidos.map((pedido) =>
      pedido.id === id ? { ...pedido, ...payload, id } : pedido,
    ),
  })
  return true
}

export function deletePedido(id: number): void {
  const data = getSnapshot()
  commit({ ...data, pedidos: data.pedidos.filter((pedido) => pedido.id !== id) })
}

/* ------------------------------------------------------------------ */
/* Abonados                                                            */
/* ------------------------------------------------------------------ */

export function addAbonado(payload: Omit<AbonadoItem, 'id'>): number {
  const data = getSnapshot()
  const id = nextNumericId(data.abonados)
  commit({ ...data, abonados: [{ id, ...payload }, ...data.abonados] })
  return id
}

export function updateAbonado(id: number, payload: Partial<Omit<AbonadoItem, 'id'>>): boolean {
  const data = getSnapshot()
  if (!data.abonados.some((abonado) => abonado.id === id)) {
    return false
  }

  commit({
    ...data,
    abonados: data.abonados.map((abonado) =>
      abonado.id === id ? { ...abonado, ...payload, id } : abonado,
    ),
  })
  return true
}

export function deleteAbonado(id: number): void {
  const data = getSnapshot()
  commit({ ...data, abonados: data.abonados.filter((abonado) => abonado.id !== id) })
}

/* ------------------------------------------------------------------ */
/* Configuracion del sitio                                             */
/* ------------------------------------------------------------------ */

export function updateConfig(config: Partial<ClubData['config']>): void {
  const data = getSnapshot()
  commit({ ...data, config: { ...data.config, ...config } })
}

/* ------------------------------------------------------------------ */
/* Respaldo de datos                                                   */
/* ------------------------------------------------------------------ */

export function exportClubData(): string {
  return JSON.stringify(getSnapshot(), null, 2)
}

export function importClubData(raw: string): { ok: true } | { ok: false; error: string } {
  try {
    const parsed: unknown = JSON.parse(raw)
    const normalized = normalizeClubData(parsed)
    if (!normalized) {
      return {
        ok: false,
        error:
          'El archivo no tiene el formato esperado para el respaldo del club.',
      }
    }

    commit(clone(normalized))
    return { ok: true }
  } catch {
    return { ok: false, error: 'No pudimos leer el archivo. Verifica que sea un JSON válido.' }
  }
}

export function resetClubData(): void {
  commit(clone(clubDataSeed))
}
