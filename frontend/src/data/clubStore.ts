import {
  abonadosSeed,
  clubDataSeed,
  configuracionSeed,
  pedidosSeed,
  type ClubData,
  type ConfiguracionSitio,
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
import { apiUrl } from '../lib/api'

/**
 * Almacén de contenidos del club.
 *
 * Es la única fuente de verdad para las páginas públicas y el panel de
 * administración. Se hidrata desde el backend (`GET /api/contenido`), se
 * guarda en localStorage como caché y cada cambio se envía al servidor
 * (`PUT /api/contenido`) para que todos los visitantes vean lo mismo.
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

function normalizarConfig(valor: unknown): ConfiguracionSitio {
  const origen = isRecord(valor) ? valor : {}

  return {
    carouselItems:
      typeof origen.carouselItems === 'number' && Number.isFinite(origen.carouselItems)
        ? origen.carouselItems
        : configuracionSeed.carouselItems,
    nombreClub:
      typeof origen.nombreClub === 'string' && origen.nombreClub.trim()
        ? origen.nombreClub
        : configuracionSeed.nombreClub,
    desde: typeof origen.desde === 'string' ? origen.desde : configuracionSeed.desde,
    logoUrl: typeof origen.logoUrl === 'string' ? origen.logoUrl : configuracionSeed.logoUrl,
  }
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
    config: normalizarConfig(value.config),
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

function guardarEnNavegador(next: ClubData): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Si el almacenamiento está lleno o bloqueado mantenemos el estado en memoria.
  }
}

function commit(next: ClubData): void {
  snapshot = next
  guardarEnNavegador(next)
  // El cambio ya vive en este navegador, pero aún no en el servidor.
  marcarCambiosSinGuardar(true)
  emit()
  programarGuardado()
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

/* ------------------------------------------------------------------ */
/* Sincronizacion con el servidor                                      */
/* ------------------------------------------------------------------ */

export type EstadoSincronizacion =
  | 'inicial'
  | 'guardando'
  | 'sincronizado'
  | 'sin-sesion'
  | 'error'
  /** Hay cambios hechos en este navegador que el servidor todavía no confirmó. */
  | 'pendiente'

export interface EstadoSync {
  estado: EstadoSincronizacion
  /** Texto listo para mostrar al administrador. */
  mensaje: string
  /** Última vez que el servidor confirmó un guardado (ISO 8601). */
  actualizadoEn: string | null
  /**
   * Detalle técnico del último intento (`PUT https://.../contenido → 401`).
   * Se muestra en el panel para que el problema no quede en "algo falló".
   */
  detalle: string | null
}

const TOKEN_KEY = 'token'
const DEMO_TOKEN = 'demo-token-local'
/**
 * Marca (en localStorage) de que existen cambios hechos en este navegador que el
 * servidor todavía no confirmó. Sirve para dos cosas:
 *   1. no perder el trabajo si el guardado falla (sesión vencida, sin conexión),
 *   2. no pisar esos cambios con el contenido publicado al recargar la página.
 */
const PENDIENTE_KEY = 'juventud_club_data_pendiente'
/** Tiempo mínimo entre descargas para no pedir el contenido en cada navegación. */
const INTERVALO_ENTRE_CARGAS_MS = 20_000
/** Espera tras el último cambio antes de enviarlo al servidor. */
const RETARDO_GUARDADO_MS = 800

function leerBanderaPendiente(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    return window.localStorage.getItem(PENDIENTE_KEY) === '1'
  } catch {
    return false
  }
}

/** ¿Hay cambios locales que el servidor todavía no confirmó? */
let cambiosSinGuardar = leerBanderaPendiente()

export function hayCambiosSinGuardar(): boolean {
  return cambiosSinGuardar
}

function marcarCambiosSinGuardar(valor: boolean): void {
  cambiosSinGuardar = valor

  if (typeof window === 'undefined') {
    return
  }

  try {
    if (valor) {
      window.localStorage.setItem(PENDIENTE_KEY, '1')
    } else {
      window.localStorage.removeItem(PENDIENTE_KEY)
    }
  } catch {
    // Sin almacenamiento la marca vive solo en memoria.
  }
}

let almacenamientoOk: boolean | null = null

/**
 * ¿El navegador deja guardar datos localmente?
 *
 * Si está bloqueado (modo privado, datos del sitio bloqueados, cuota llena) los
 * cambios en curso se pierden al recargar, así que el panel tiene que avisarlo
 * en vez de dar por hecho que quedaron "solo en este navegador".
 */
export function almacenamientoDisponible(): boolean {
  if (almacenamientoOk !== null) {
    return almacenamientoOk
  }

  if (typeof window === 'undefined') {
    return false
  }

  try {
    const prueba = `${STORAGE_KEY}-prueba`
    window.localStorage.setItem(prueba, '1')
    window.localStorage.removeItem(prueba)
    almacenamientoOk = true
  } catch {
    almacenamientoOk = false
  }

  return almacenamientoOk
}

let estadoSync: EstadoSync = {
  estado: 'inicial',
  mensaje: 'Cargando el contenido del servidor...',
  actualizadoEn: null,
  detalle: null,
}

const syncListeners = new Set<Listener>()

export function getSyncSnapshot(): EstadoSync {
  return estadoSync
}

export function subscribeSync(listener: Listener): () => void {
  syncListeners.add(listener)
  return () => {
    syncListeners.delete(listener)
  }
}

function setEstadoSync(parcial: Partial<EstadoSync>): void {
  const siguiente: EstadoSync = { ...estadoSync, ...parcial }

  // El detalle describe un intento concreto: no debe sobrevivir al siguiente.
  if (parcial.detalle === undefined) {
    siguiente.detalle = null
  }

  estadoSync = siguiente
  syncListeners.forEach((listener) => listener())
}

/** Token real del backend; devuelve null en modo demostración o sin sesión. */
function leerToken(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const token = window.localStorage.getItem(TOKEN_KEY)
    if (!token || token === DEMO_TOKEN) {
      return null
    }
    return token
  } catch {
    return null
  }
}

let ultimaCarga = 0

/**
 * Descarga el contenido publicado en el servidor y reemplaza el estado local.
 * Cada dispositivo ve exactamente el mismo contenido.
 *
 * Salvo que se fuerce (`forzar = true`), no reemplaza nada mientras haya cambios
 * locales sin confirmar: así una recarga no borra el trabajo del administrador
 * cuando el guardado falló (sesión vencida, sin conexión).
 */
export async function cargarContenidoRemoto(forzar = false): Promise<void> {
  if (typeof window === 'undefined') {
    return
  }

  const ahora = Date.now()
  if (!forzar && ultimaCarga !== 0 && ahora - ultimaCarga < INTERVALO_ENTRE_CARGAS_MS) {
    return
  }

  if (!forzar && (cambiosSinGuardar || guardadoEnCurso)) {
    setEstadoSync({
      estado: 'pendiente',
      mensaje:
        'Hay cambios en este navegador que el servidor todavía no recibió. Usa "Reintentar guardado" para publicarlos o "Descartar cambios locales" para volver al contenido publicado.',
    })
    return
  }

  ultimaCarga = ahora

  try {
    const respuesta = await fetch(apiUrl('/contenido'), {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })

    if (!respuesta.ok) {
      throw new Error(`HTTP ${respuesta.status}`)
    }

    const payload = (await respuesta.json()) as {
      datos?: unknown
      actualizadoEn?: string | null
    }

    const normalizado = payload.datos ? normalizeClubData(payload.datos) : null

    if (normalizado) {
      const siguiente = clone(normalizado)
      snapshot = siguiente
      guardarEnNavegador(siguiente)
      marcarCambiosSinGuardar(false)
      emit()
    }

    setEstadoSync({
      estado: 'sincronizado',
      mensaje: normalizado
        ? 'Contenido compartido: lo ven todos los visitantes.'
        : 'El servidor aún no tiene contenido guardado; se muestra el contenido inicial.',
      actualizadoEn: payload.actualizadoEn ?? null,
    })
  } catch {
    setEstadoSync({
      estado: 'error',
      mensaje: 'No se pudo leer el servidor: los cambios quedan solo en este navegador.',
      actualizadoEn: null,
    })
  }
}

let temporizadorGuardado: ReturnType<typeof setTimeout> | null = null
let temporizadorReintento: ReturnType<typeof setTimeout> | null = null
let guardadoEnCurso = false
let guardadoPendiente = false

/** Esperas (ms) entre reintentos automáticos antes de molestar al administrador. */
const REINTENTOS_MS = [2_000, 5_000, 15_000, 30_000]
let reintentosHechos = 0

function cancelarReintento(): void {
  if (temporizadorReintento) {
    clearTimeout(temporizadorReintento)
    temporizadorReintento = null
  }
}

/**
 * Reintenta el guardado por su cuenta (corte de red o error 5xx del servidor),
 * para que un fallo pasajero no obligue a volver a cargar la noticia a mano.
 * Devuelve false cuando ya no quedan reintentos y hay que avisar en el panel.
 */
function programarReintento(): boolean {
  if (typeof window === 'undefined' || reintentosHechos >= REINTENTOS_MS.length) {
    return false
  }

  const espera = REINTENTOS_MS[reintentosHechos]
  reintentosHechos += 1
  cancelarReintento()
  temporizadorReintento = setTimeout(() => {
    temporizadorReintento = null
    void guardarEnServidor({ desdeReintento: true })
  }, espera)

  return true
}

function programarGuardado(): void {
  if (typeof window === 'undefined') {
    return
  }

  if (temporizadorGuardado) {
    clearTimeout(temporizadorGuardado)
  }

  temporizadorGuardado = setTimeout(() => {
    temporizadorGuardado = null
    void guardarEnServidor()
  }, RETARDO_GUARDADO_MS)
}

/** Mensaje que devuelve el backend cuando rechaza el contenido. */
async function leerMensajeDeError(respuesta: Response): Promise<string> {
  try {
    const payload = (await respuesta.json()) as {
      error?: { message?: string }
      message?: string
    }
    return (payload.error?.message ?? payload.message ?? '').trim()
  } catch {
    return ''
  }
}

export interface OpcionesGuardado {
  /** `true` cuando la llamada viene del reintento automático. */
  desdeReintento?: boolean
}

/**
 * Envía el documento completo al backend. Requiere una sesión real
 * (el modo demostración solo guarda en este navegador).
 *
 * Los cortes de red y los errores 5xx se reintentan solos; cualquier 4xx avisa
 * con el motivo exacto que devolvió el servidor, sin dar nada por guardado.
 */
export async function guardarEnServidor(opciones: OpcionesGuardado = {}): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false
  }

  const endpoint = apiUrl('/contenido')

  if (!opciones.desdeReintento) {
    // Un intento nuevo (o del administrador) vuelve a tener reintentos disponibles.
    reintentosHechos = 0
    cancelarReintento()
  }

  const token = leerToken()
  if (!token) {
    setEstadoSync({
      estado: 'sin-sesion',
      mensaje:
        'No hay una sesión real abierta: inicia sesión con tu cuenta del club para publicar los cambios.',
      detalle: `No se envió nada a ${endpoint}: falta el token de sesión.`,
    })
    return false
  }

  if (guardadoEnCurso) {
    guardadoPendiente = true
    return false
  }

  // Un guardado explícito cancela el envío automático que estaba programado.
  if (temporizadorGuardado) {
    clearTimeout(temporizadorGuardado)
    temporizadorGuardado = null
  }

  guardadoEnCurso = true
  setEstadoSync({
    estado: 'guardando',
    mensaje:
      reintentosHechos > 0
        ? `Reintentando guardado (${reintentosHechos} de ${REINTENTOS_MS.length})...`
        : 'Guardando en el servidor...',
    detalle: `PUT ${endpoint}`,
  })

  try {
    const respuesta = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ datos: getSnapshot() }),
    })

    if (respuesta.status === 401 || respuesta.status === 403) {
      setEstadoSync({
        estado: 'sin-sesion',
        mensaje:
          'El servidor no acepta esta sesión. Inicia sesión de nuevo: al entrar, los cambios pendientes se publican solos.',
        detalle: `PUT ${endpoint} → ${respuesta.status}. El token guardado en este navegador ya no sirve.`,
      })
      return false
    }

    if (!respuesta.ok) {
      const motivo = await leerMensajeDeError(respuesta)
      const detalle = `PUT ${endpoint} → ${respuesta.status}${motivo ? `: ${motivo}` : ''}`

      // Un 4xx es un problema del contenido o de los permisos: reintentar no sirve.
      if (respuesta.status < 500) {
        setEstadoSync({
          estado: 'error',
          mensaje: `El servidor rechazó el guardado${motivo ? `: ${motivo}` : ''}. Los cambios siguen en este navegador.`,
          detalle,
        })
        return false
      }

      if (programarReintento()) {
        setEstadoSync({
          estado: 'guardando',
          mensaje: `El servidor falló (${respuesta.status}). Reintentando solo: intento ${reintentosHechos} de ${REINTENTOS_MS.length}.`,
          detalle,
        })
        return false
      }

      setEstadoSync({
        estado: 'error',
        mensaje:
          'El servidor no pudo guardar tras varios intentos. Los cambios siguen en este navegador: usa "Reintentar guardado".',
        detalle,
      })
      return false
    }

    const payload = (await respuesta.json()) as { actualizadoEn?: string | null }

    // El servidor confirmó: ya no hay nada pendiente en este navegador.
    reintentosHechos = 0
    cancelarReintento()
    marcarCambiosSinGuardar(false)

    setEstadoSync({
      estado: 'sincronizado',
      mensaje: 'Guardado en el servidor: todos los visitantes ven estos cambios.',
      actualizadoEn: payload.actualizadoEn ?? new Date().toISOString(),
      detalle: `PUT ${endpoint} → ${respuesta.status}`,
    })
    return true
  } catch (error) {
    const motivo = error instanceof Error ? error.message : 'sin conexión'
    const detalle = `PUT ${endpoint} → error de red (${motivo})`

    if (programarReintento()) {
      setEstadoSync({
        estado: 'guardando',
        mensaje: `Sin conexión con el servidor. Reintentando solo: intento ${reintentosHechos} de ${REINTENTOS_MS.length}.`,
        detalle,
      })
      return false
    }

    setEstadoSync({
      estado: 'error',
      mensaje:
        'No se pudo guardar en el servidor. Los cambios siguen en este navegador: revisa la conexión y usa "Reintentar guardado".',
      detalle,
    })
    return false
  } finally {
    guardadoEnCurso = false

    if (guardadoPendiente) {
      guardadoPendiente = false
      programarGuardado()
    }
  }
}
