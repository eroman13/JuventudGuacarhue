export interface NoticiaItem {
  id: number
  titulo: string
  categoria: string
  fecha: string
  imagen: string
  extracto: string
  destacada?: boolean
  /**
   * Cuerpo completo de la noticia en HTML (editor enriquecido).
   * Opcional: si esta vacio se muestra solo el extracto.
   */
  contenido?: string
}

export interface PartidoItem {
  id: number
  local: string
  visitante: string
  fecha: string
  hora: string
  lugar: string
  estado: 'PROXIMO' | 'FINALIZADO'
  torneo: string
  resultado?: string
}

export interface JugadorItem {
  id: string
  numero: number
  nombre: string
  apellido: string
  posicion: string
  pais: string
}

export interface PlantelItem {
  nombre: string
  jugadores: JugadorItem[]
}

export interface GaleriaItem {
  id: number
  categoria: string
  fecha: string
  url: string
}

export interface ProductoItem {
  id: number
  nombre: string
  precio: number
  categoria: string
  stock: number
  url: string
}

export interface VideoItem {
  id: number
  titulo: string
  categoria: string
  fecha: string
  url: string
  miniatura: string
}

export type PedidoEstado = 'PENDIENTE' | 'CONFIRMADO' | 'ENVIADO' | 'ENTREGADO' | 'CANCELADO'

export interface PedidoItem {
  id: number
  numeroOrden: string
  cliente: string
  email: string
  telefono: string
  producto: string
  cantidad: number
  total: number
  estado: PedidoEstado
  fecha: string
}

export type AbonadoEstado = 'ACTIVO' | 'VENCIDO' | 'PAUSADO'

export interface AbonadoItem {
  id: number
  nombre: string
  email: string
  telefono: string
  plan: string
  estado: AbonadoEstado
  inicio: string
  fin: string
}

export const noticiasSeed: NoticiaItem[] = [
  {
    id: 1,
    titulo: 'Gran victoria en el clasico',
    categoria: 'Resultados',
    fecha: '2026-10-23',
    imagen:
      'https://scontent-scl3-1.xx.fbcdn.net/v/t39.30808-6/504256464_4212822292375757_2863909741882965330_n.jpg?stp=dst-jpg_tt6&cstp=mx1600x1066&ctp=s1600x1066&_nc_cat=101&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=EriwVdJyqEAQ7kNvwFpdPbw&_nc_oc=Ado2imdqW91-iVWGXiw9aZOVo9X9IwqDPa7CDXRtyr3OSwUKn9LQpgfhyyPfTcrydYMPbcIjX5R9cdzVx-qsDoV-&_nc_zt=23&_nc_ht=scontent-scl3-1.xx&_nc_gid=S0LzpK5khMq9F5tZoxF4vA&_nc_ss=792a8&oh=00_AQOsjMYxabeYHLuXQjodG1sMY6Pd9peVhDgyubuI4xt_bg&oe=6AE14558',
    extracto: 'Analisis del partido y estadisticas del encuentro mas importante de la temporada.',
    contenido:
      '<p>El primer equipo de Juventud Guacarhue se quedo con el clasico de la fecha tras un partido intenso, disputado ante un estadio repleto.</p>' +
      '<h2>Un primer tiempo de estudio</h2>' +
      '<p>Ambos equipos cuidaron el orden defensivo. La apertura del marcador llego con un remate de media distancia que descoloco al arquero visitante.</p>' +
      '<h2>Figuras del encuentro</h2>' +
      '<ul><li>El mediocampista <strong>destaco</strong> por su recuperacion y salida limpia.</li><li>La defensa sostuvo la ventaja en los minutos finales.</li></ul>' +
      '<blockquote>"Fue un triunfo del grupo, trabajamos toda la semana para esto", senalo el tecnico.</blockquote>' +
      '<p>Con este resultado el club suma tres puntos clave y se prepara para la proxima fecha del torneo.</p>',
    destacada: true,
  },
  {
    id: 2,
    titulo: 'Nuevas incorporaciones al plantel profesional',
    categoria: 'Fichajes',
    fecha: '2026-10-22',
    imagen:
      'https://scontent-scl3-1.xx.fbcdn.net/v/t39.30808-6/502568642_10233302015585647_3878340113690538090_n.jpg?stp=c256.0.1536.1536a_cp6_dst-jpg_tt6&cstp=mx1536x1536&ctp=s552x414&_nc_cat=109&ccb=1-7&_nc_sid=50ad20&_nc_ohc=ajsc7vj4mYMQ7kNvwH4BtnR&_nc_oc=AdpUm7T9wiVXeZKxN0Ex_C1Wu8byiVKR1WDJf4WFzIvVuEL3COcQh8ko0ptFQURkUcF6EcRSHb9CRSvFzU4Bz9Yw&_nc_zt=23&_nc_ht=scontent-scl3-1.xx&_nc_gid=IWqQJxCnp-qcDy3xQnCstw&_nc_ss=7b2a8&oh=00_AQPS1xu_zkQN8BriXI383byOAvhiQ8fENhbetFq-0XF5LQ&oe=6AE15102',
    extracto: 'Presentacion oficial de los nuevos refuerzos confirmados por la direccion.',
    destacada: true,
  },
  {
    id: 3,
    titulo: 'Inauguracion de nueva cancha de entrenamiento',
    categoria: 'Instalaciones',
    fecha: '2026-10-21',
    imagen:
      'https://scontent-scl3-1.xx.fbcdn.net/v/t39.30808-6/502757737_10233302013705600_6849197361037078782_n.jpg?stp=c256.0.1536.1536a_cp6_dst-jpg_tt6&cstp=mx1536x1536&ctp=s552x414&_nc_cat=106&ccb=1-7&_nc_sid=50ad20&_nc_ohc=DMz4ocWFaMQQ7kNvwGBPv8x&_nc_oc=AdrAUr6-g9g1uDWBsJ8bcZrJM6HBudutty3NdhtXNBiLNQPYEblmeapOHOpg-4aFuKs8Qbrho86TXooyqiqgRVPF&_nc_zt=23&_nc_ht=scontent-scl3-1.xx&_nc_gid=IWqQJxCnp-qcDy3xQnCstw&_nc_ss=7b2a8&oh=00_AQPgUGCWUvYuyXz-IERLhmUBSz6SddHtSN31I_Q2Yf5ciA&oe=6AE12A22',
    extracto: 'Modernizacion de infraestructura deportiva con nueva tecnologia de monitoreo.',
    destacada: true,
  },
  {
    id: 4,
    titulo: 'Proximo rival confirmado: Liga Nacional',
    categoria: 'Fixtures',
    fecha: '2026-10-20',
    imagen:
      'https://scontent-scl3-1.xx.fbcdn.net/v/t39.30808-6/503164103_10233302015745651_3540257250924494735_n.jpg?stp=c256.0.1536.1536a_cp6_dst-jpg_tt6&cstp=mx1536x1536&ctp=s552x414&_nc_cat=104&ccb=1-7&_nc_sid=50ad20&_nc_ohc=0AKVIioxcocQ7kNvwFKJ2ux&_nc_oc=Adouj5HtyDLf8gGj5hWUzzO8rkY_cNz-6GzCFF8UCrq1dFRij6JL9UUBNVJSwrE-GngC6XzDkfV0kOrKDCmDQ36v&_nc_zt=23&_nc_ht=scontent-scl3-1.xx&_nc_gid=IWqQJxCnp-qcDy3xQnCstw&_nc_ss=7b2a8&oh=00_AQMCk1xaqN5uRSHI5fVKrTL28HF1_iU_vqnv166LMA_KQw&oe=6AE129AF',
    extracto: 'Confirmacion de calendario oficial y sedes de los proximos encuentros.',
    destacada: true,
  },
]

export const partidosSeed: PartidoItem[] = [
  { id: 1, local: 'Juventud Guacarhue', visitante: 'Deportivo Sur', fecha: '2026-11-15', hora: '19:00', lugar: 'Estadio Municipal', estado: 'PROXIMO', torneo: 'Liga Nacional' },
  { id: 2, local: 'Juventud Guacarhue', visitante: 'Club Union Norte', fecha: '2026-11-22', hora: '21:00', lugar: 'Estadio Municipal', estado: 'PROXIMO', torneo: 'Copa Provincia' },
  { id: 3, local: 'El Andes', visitante: 'Juventud Guacarhue', fecha: '2026-11-29', hora: '18:30', lugar: 'Estadio Andes', estado: 'PROXIMO', torneo: 'Liga Nacional' },
  { id: 4, local: 'Juventud Guacarhue', visitante: 'Equipo D', fecha: '2026-10-15', hora: '20:00', lugar: 'Estadio Municipal', estado: 'FINALIZADO', resultado: '3-1', torneo: 'Liga Nacional' },
]

export const plantelesSeed: PlantelItem[] = [
  {
    nombre: 'Primer Equipo',
    jugadores: [
      { id: 'j-1', numero: 1, nombre: 'Carlos', apellido: 'Gonzalez', posicion: 'Portero', pais: 'Chile' },
      { id: 'j-2', numero: 2, nombre: 'Juan', apellido: 'Rodriguez', posicion: 'Defensa', pais: 'Chile' },
      { id: 'j-3', numero: 10, nombre: 'Diego', apellido: 'Vargas', posicion: 'Delantero', pais: 'Chile' },
      { id: 'j-4', numero: 9, nombre: 'Fernando', apellido: 'Silva', posicion: 'Delantero', pais: 'Brasil' },
    ],
  },
  {
    nombre: 'Reserva',
    jugadores: [
      { id: 'j-5', numero: 20, nombre: 'Francisco', apellido: 'Garcia', posicion: 'Portero', pais: 'Chile' },
      { id: 'j-6', numero: 23, nombre: 'Javier', apellido: 'Riquelme', posicion: 'Mediocampista', pais: 'Chile' },
    ],
  },
]

export const galeriaSeed: GaleriaItem[] = [
  {
    id: 1,
    categoria: 'Partidos',
    fecha: '2026-10-20',
    url: 'https://scontent-scl3-1.xx.fbcdn.net/v/t39.30808-6/504256464_4212822292375757_2863909741882965330_n.jpg?stp=dst-jpg_tt6&cstp=mx1600x1066&ctp=s1600x1066&_nc_cat=101&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=EriwVdJyqEAQ7kNvwFpdPbw&_nc_oc=Ado2imdqW91-iVWGXiw9aZOVo9X9IwqDPa7CDXRtyr3OSwUKn9LQpgfhyyPfTcrydYMPbcIjX5R9cdzVx-qsDoV-&_nc_zt=23&_nc_ht=scontent-scl3-1.xx&_nc_gid=S0LzpK5khMq9F5tZoxF4vA&_nc_ss=792a8&oh=00_AQOsjMYxabeYHLuXQjodG1sMY6Pd9peVhDgyubuI4xt_bg&oe=6AE14558',
  },
  {
    id: 2,
    categoria: 'Entrenamientos',
    fecha: '2026-10-19',
    url: 'https://scontent-scl3-1.xx.fbcdn.net/v/t39.30808-6/502568642_10233302015585647_3878340113690538090_n.jpg?stp=c256.0.1536.1536a_cp6_dst-jpg_tt6&cstp=mx1536x1536&ctp=s552x414&_nc_cat=109&ccb=1-7&_nc_sid=50ad20&_nc_ohc=ajsc7vj4mYMQ7kNvwH4BtnR&_nc_oc=AdpUm7T9wiVXeZKxN0Ex_C1Wu8byiVKR1WDJf4WFzIvVuEL3COcQh8ko0ptFQURkUcF6EcRSHb9CRSvFzU4Bz9Yw&_nc_zt=23&_nc_ht=scontent-scl3-1.xx&_nc_gid=IWqQJxCnp-qcDy3xQnCstw&_nc_ss=7b2a8&oh=00_AQPS1xu_zkQN8BriXI383byOAvhiQ8fENhbetFq-0XF5LQ&oe=6AE15102',
  },
  {
    id: 3,
    categoria: 'Eventos',
    fecha: '2026-10-18',
    url: 'https://scontent-scl3-1.xx.fbcdn.net/v/t39.30808-6/503164103_10233302015745651_3540257250924494735_n.jpg?stp=c256.0.1536.1536a_cp6_dst-jpg_tt6&cstp=mx1536x1536&ctp=s552x414&_nc_cat=104&ccb=1-7&_nc_sid=50ad20&_nc_ohc=0AKVIioxcocQ7kNvwFKJ2ux&_nc_oc=Adouj5HtyDLf8gGj5hWUzzO8rkY_cNz-6GzCFF8UCrq1dFRij6JL9UUBNVJSwrE-GngC6XzDkfV0kOrKDCmDQ36v&_nc_zt=23&_nc_ht=scontent-scl3-1.xx&_nc_gid=IWqQJxCnp-qcDy3xQnCstw&_nc_ss=7b2a8&oh=00_AQMCk1xaqN5uRSHI5fVKrTL28HF1_iU_vqnv166LMA_KQw&oe=6AE129AF',
  },
]

export const productosSeed: ProductoItem[] = [
  { id: 1, nombre: 'Camiseta Titular 2026', precio: 45990, categoria: 'Camisetas', stock: 15, url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80' },
  { id: 2, nombre: 'Camiseta Alternativa', precio: 45990, categoria: 'Camisetas', stock: 12, url: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=600&q=80' },
  { id: 3, nombre: 'Pantalon Oficial', precio: 34990, categoria: 'Equipamiento', stock: 20, url: 'https://images.unsplash.com/photo-1542272604-787c62d465d1?auto=format&fit=crop&w=600&q=80' },
]

export const videosSeed: VideoItem[] = [
  {
    id: 1,
    titulo: 'Resumen: Juventud Guacarhue vs Deportivo Sur',
    categoria: 'Partidos',
    fecha: '2026-10-25',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    miniatura: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 2,
    titulo: 'Entrenamiento semanal del plantel',
    categoria: 'Entrenamientos',
    fecha: '2026-10-21',
    url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    miniatura: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80',
  },
]

export const pedidosSeed: PedidoItem[] = [
  {
    id: 1,
    numeroOrden: 'JG-1001',
    cliente: 'Camila Perez',
    email: 'camila.perez@example.com',
    telefono: '+56 9 8765 4321',
    producto: 'Camiseta Titular 2026',
    cantidad: 1,
    total: 45990,
    estado: 'PENDIENTE',
    fecha: '2026-10-27',
  },
  {
    id: 2,
    numeroOrden: 'JG-1002',
    cliente: 'Matias Rojas',
    email: 'matias.rojas@example.com',
    telefono: '+56 9 2222 3333',
    producto: 'Pantalon Oficial',
    cantidad: 2,
    total: 69980,
    estado: 'CONFIRMADO',
    fecha: '2026-10-28',
  },
]

export const abonadosSeed: AbonadoItem[] = [
  {
    id: 1,
    nombre: 'Ana Morales',
    email: 'ana.morales@example.com',
    telefono: '+56 9 1111 1111',
    plan: 'Anual',
    estado: 'ACTIVO',
    inicio: '2026-01-15',
    fin: '2027-01-14',
  },
  {
    id: 2,
    nombre: 'Jorge Diaz',
    email: 'jorge.diaz@example.com',
    telefono: '+56 9 4444 5555',
    plan: 'Semestral',
    estado: 'VENCIDO',
    inicio: '2026-02-01',
    fin: '2026-08-01',
  },
]

export interface ConfiguracionSitio {
  /** Cuántas noticias destacadas se muestran en el carrusel de la portada. */
  carouselItems: number
  /** Nombre oficial del club, usado en el encabezado y el pie del sitio. */
  nombreClub: string
  /** Año de fundación que se muestra como "Desde 1990". */
  desde: string
  /** URL del escudo o logo del club. Vacío = se usa el escudo por defecto. */
  logoUrl: string
}

export interface ClubData {
  noticias: NoticiaItem[]
  partidos: PartidoItem[]
  planteles: PlantelItem[]
  galeria: GaleriaItem[]
  productos: ProductoItem[]
  videos: VideoItem[]
  pedidos: PedidoItem[]
  abonados: AbonadoItem[]
  config: ConfiguracionSitio
}

export const configuracionSeed: ConfiguracionSitio = {
  carouselItems: 4,
  nombreClub: 'Juventud Guacarhue',
  desde: '1990',
  logoUrl: '',
}

export const clubDataSeed: ClubData = {
  noticias: noticiasSeed,
  partidos: partidosSeed,
  planteles: plantelesSeed,
  galeria: galeriaSeed,
  productos: productosSeed,
  videos: videosSeed,
  pedidos: pedidosSeed,
  abonados: abonadosSeed,
  config: configuracionSeed,
}
