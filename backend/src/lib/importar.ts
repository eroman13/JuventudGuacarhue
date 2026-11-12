/**
 * Utilidades para cargar noticias y fotos en bloque desde `importar/`.
 *
 * El panel de administracion crea las noticias de una en una; cuando hay que
 * pasar decenas de fotos de la pagina de Facebook del club al sitio, eso no es
 * viable. Estas funciones son la parte sin red de `scripts/importar-contenido.ts`:
 * aqui solo se valida y se mezcla con el documento actual, sin tocar el servidor,
 * para poder probarlas.
 *
 * El documento del sitio lo define `frontend/src/data/seedData.ts`.
 */

/** Noticia tal como la guarda el sitio. */
export interface NoticiaImportada {
  id: number;
  fecha: string;
  imagen: string;
  titulo: string;
  extracto: string;
  categoria: string;
  contenido?: string;
  destacada?: boolean;
}

/** Foto de la galeria tal como la guarda el sitio. */
export interface FotoImportada {
  id: number;
  url: string;
  fecha: string;
  categoria: string;
}

/** Producto de la tienda tal como lo guarda el sitio. */
export interface ProductoImportado {
  id: number;
  nombre: string;
  precio: number;
  categoria: string;
  stock: number;
  url: string;
}

/** Un producto del manifiesto. */
export interface EntradaProducto {
  /** Si coincide con un producto existente, se actualiza en vez de crearlo. */
  id?: number;
  nombre?: string;
  /** Nombre del archivo dentro de `importar/`, o una URL ya publicada. */
  imagen?: string;
  precio?: number;
  categoria?: string;
  stock?: number;
}

/** Una noticia del manifiesto, antes de subir su imagen. */
export interface EntradaNoticia {
  /** Si coincide con una noticia existente, se actualiza en vez de crearla. */
  id?: number;
  titulo?: string;
  /** Nombre del archivo dentro de `importar/`, o una URL ya publicada. */
  imagen?: string;
  fecha?: string;
  categoria?: string;
  extracto?: string;
  contenido?: string;
  destacada?: boolean;
}

/** Una foto del manifiesto, antes de subirla. */
export interface EntradaGaleria {
  /** Si coincide con una foto existente, se actualiza en vez de crearla. */
  id?: number;
  archivo?: string;
  fecha?: string;
  categoria?: string;
}

/** Documento de contenido que sirve `GET /api/contenido`. */
export interface DocumentoContenido {
  noticias: NoticiaImportada[];
  galeria: FotoImportada[];
  productos?: ProductoImportado[];
  [seccion: string]: unknown;
}

export interface EntradaLista<T> {
  entrada: T;
  /** URL definitiva de la imagen (bucket o disco). */
  urlImagen: string;
  /** Nombre del archivo de origen, para los mensajes. */
  archivo: string;
}

export interface Omitida {
  titulo: string;
  motivo: string;
}

export const CATEGORIA_POR_DEFECTO = 'Noticias';

/**
 * Clave para comparar titulos: sin tildes, sin mayusculas y sin signos.
 * "¡Gran victoria en el Clásico!" y "gran victoria en el clasico" son la misma
 * noticia, y sin esta normalizacion se duplicarian al reimportar.
 */
export function normalizarTitulo(titulo: string): string {
  return titulo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Id siguiente al mas alto de la lista (1 si esta vacia). */
export function siguienteId(items: Array<{ id?: unknown }>): number {
  const mayor = items.reduce<number>((max, item) => {
    const id = Number(item?.id);
    return Number.isFinite(id) && id > max ? id : max;
  }, 0);

  return mayor + 1;
}

/** `true` solo si es una fecha `YYYY-MM-DD` que existe en el calendario. */
export function esFechaValida(valor: unknown): valor is string {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return false;
  }

  const [anio, mes, dia] = valor.split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));

  return (
    fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia
  );
}


/** Lista de problemas de una entrada; vacia si esta bien. */
export function validarEntrada(entrada: EntradaNoticia): string[] {
  const problemas: string[] = [];

  if (!entrada.titulo?.trim()) {
    problemas.push('falta el titulo');
  }

  if (!esFechaValida(entrada.fecha)) {
    problemas.push(`la fecha "${entrada.fecha ?? ''}" no es valida (usa AAAA-MM-DD)`);
  }

  if (!entrada.imagen?.trim()) {
    problemas.push('falta la imagen (nombre del archivo o URL)');
  }

  return problemas;
}

/** Arma la noticia que se guarda en el documento. */
export function construirNoticia(
  entrada: EntradaNoticia,
  id: number,
  urlImagen: string,
): NoticiaImportada {
  const extracto = (entrada.extracto ?? '').trim();
  const contenido = (entrada.contenido ?? '').trim();

  const noticia: NoticiaImportada = {
    id,
    // `validarEntrada` ya comprobo el formato, pero el tipo no lo sabe.
    fecha: String(entrada.fecha),
    imagen: urlImagen,
    titulo: (entrada.titulo ?? '').trim(),
    extracto:
      extracto ||
      contenido
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 180),
    categoria: (entrada.categoria ?? '').trim() || CATEGORIA_POR_DEFECTO,
  };

  // `contenido` y `destacada` solo se escriben si aportan algo: asi el JSON del
  // sitio queda igual al que produce el panel.
  if (contenido) {
    noticia.contenido = contenido;
  }

  if (entrada.destacada) {
    noticia.destacada = true;
  }

  return noticia;
}

/**
 * Devuelve las noticias del documento con las nuevas **al principio** (el sitio
 * las muestra en ese orden) y sin repetir titulos. No modifica la entrada.
 */
export function fusionarNoticias(
  documento: DocumentoContenido,
  nuevas: Array<EntradaLista<EntradaNoticia>>,
): {
  noticias: NoticiaImportada[];
  agregadas: NoticiaImportada[];
  actualizadas: NoticiaImportada[];
  omitidas: Omitida[];
} {
  const actuales = Array.isArray(documento.noticias) ? documento.noticias : [];
  const resultado = [...actuales];
  const titulos = new Set(actuales.map((noticia) => normalizarTitulo(noticia?.titulo ?? '')));

  const agregadas: NoticiaImportada[] = [];
  const actualizadas: NoticiaImportada[] = [];
  const omitidas: Omitida[] = [];
  let id = siguienteId(actuales);

  for (const { entrada, urlImagen } of nuevas) {
    const titulo = (entrada.titulo ?? '').trim();
    const clave = normalizarTitulo(titulo);

    if (!clave) {
      omitidas.push({ titulo, motivo: 'sin titulo' });
      continue;
    }

    // Con `id` se actualiza una noticia que ya existe: sirve para cambiarle la
    // portada (o el texto) sin crear una copia.
    const idExistente = Number(entrada.id);
    const posicion =
      Number.isFinite(idExistente) && idExistente > 0
        ? resultado.findIndex((noticia) => Number(noticia?.id) === idExistente)
        : -1;

    if (posicion >= 0) {
      const anterior = resultado[posicion];
      const actualizada = construirNoticia(entrada, idExistente, urlImagen);

      // Lo que el manifiesto no dice se conserva: una entrada que solo cambia
      // la foto no debe borrar el texto, la categoria ni la destacada.
      if (!entrada.categoria?.trim() && anterior.categoria) {
        actualizada.categoria = anterior.categoria;
      }
      if (!entrada.extracto?.trim() && anterior.extracto) {
        actualizada.extracto = anterior.extracto;
      }
      if (!actualizada.contenido && anterior.contenido) {
        actualizada.contenido = anterior.contenido;
      }
      if (entrada.destacada === undefined && anterior.destacada) {
        actualizada.destacada = true;
      }

      resultado[posicion] = actualizada;
      actualizadas.push(actualizada);
      continue;
    }

    if (titulos.has(clave)) {
      omitidas.push({
        titulo,
        motivo: 'ya existe una noticia con ese titulo (agrega "id" para actualizarla)',
      });
      continue;
    }

    titulos.add(clave);
    agregadas.push(construirNoticia(entrada, id, urlImagen));
    id += 1;
  }

  return { noticias: [...agregadas, ...resultado], agregadas, actualizadas, omitidas };
}

/** Igual que `fusionarNoticias` pero para la galeria (dedupe por URL). */
export function fusionarGaleria(
  documento: DocumentoContenido,
  nuevas: Array<EntradaLista<EntradaGaleria>>,
): {
  galeria: FotoImportada[];
  agregadas: FotoImportada[];
  actualizadas: FotoImportada[];
  omitidas: Omitida[];
} {
  const actuales = Array.isArray(documento.galeria) ? documento.galeria : [];
  const resultado = [...actuales];
  const urls = new Set(actuales.map((foto) => foto?.url).filter(Boolean));

  const agregadas: FotoImportada[] = [];
  const actualizadas: FotoImportada[] = [];
  const omitidas: Omitida[] = [];
  let id = siguienteId(actuales);

  for (const { entrada, urlImagen, archivo } of nuevas) {
    if (!esFechaValida(entrada.fecha)) {
      omitidas.push({ titulo: archivo, motivo: `fecha invalida ("${entrada.fecha ?? ''}")` });
      continue;
    }

    const idExistente = Number(entrada.id);
    const posicion =
      Number.isFinite(idExistente) && idExistente > 0
        ? resultado.findIndex((foto) => Number(foto?.id) === idExistente)
        : -1;

    if (posicion >= 0) {
      const foto: FotoImportada = {
        id: idExistente,
        url: urlImagen,
        fecha: entrada.fecha,
        categoria: (entrada.categoria ?? '').trim() || resultado[posicion].categoria || 'Partidos',
      };

      resultado[posicion] = foto;
      actualizadas.push(foto);
      continue;
    }

    if (urls.has(urlImagen)) {
      omitidas.push({
        titulo: archivo,
        motivo: 'la foto ya esta en la galeria (agrega "id" para actualizarla)',
      });
      continue;
    }

    urls.add(urlImagen);
    agregadas.push({
      id,
      url: urlImagen,
      fecha: entrada.fecha,
      categoria: (entrada.categoria ?? '').trim() || 'Partidos',
    });
    id += 1;
  }

  return { galeria: [...agregadas, ...resultado], agregadas, actualizadas, omitidas };
}

/** Lista de problemas de un producto; vacia si esta bien. */
export function validarProducto(entrada: EntradaProducto): string[] {
  const problemas: string[] = [];

  if (!entrada.nombre?.trim()) {
    problemas.push('falta el nombre');
  }

  if (!entrada.imagen?.trim()) {
    problemas.push('falta la imagen (nombre del archivo o URL)');
  }

  return problemas;
}

function numero(valor: unknown, porDefecto: number): number {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : porDefecto;
}

/**
 * Mezcla los productos de la tienda. Con `id` se actualiza el producto (sirve
 * para cambiarle la foto); sin `id` se crea, salvo que el nombre ya exista.
 */
export function fusionarProductos(
  documento: DocumentoContenido,
  nuevas: Array<EntradaLista<EntradaProducto>>,
): {
  productos: ProductoImportado[];
  agregadas: ProductoImportado[];
  actualizadas: ProductoImportado[];
  omitidas: Omitida[];
} {
  const actuales = Array.isArray(documento.productos) ? documento.productos : [];
  const resultado = [...actuales];
  const nombres = new Set(actuales.map((producto) => normalizarTitulo(producto?.nombre ?? '')));

  const agregadas: ProductoImportado[] = [];
  const actualizadas: ProductoImportado[] = [];
  const omitidas: Omitida[] = [];
  let id = siguienteId(actuales);

  for (const { entrada, urlImagen, archivo } of nuevas) {
    const nombre = (entrada.nombre ?? '').trim();
    const clave = normalizarTitulo(nombre);

    if (!clave) {
      omitidas.push({ titulo: archivo, motivo: 'sin nombre' });
      continue;
    }

    const idExistente = Number(entrada.id);
    const posicion =
      Number.isFinite(idExistente) && idExistente > 0
        ? resultado.findIndex((producto) => Number(producto?.id) === idExistente)
        : -1;

    if (posicion >= 0) {
      const anterior = resultado[posicion];
      const producto: ProductoImportado = {
        id: idExistente,
        nombre,
        precio: numero(entrada.precio, anterior.precio),
        categoria: (entrada.categoria ?? '').trim() || anterior.categoria || 'Tienda',
        stock: numero(entrada.stock, anterior.stock),
        url: urlImagen,
      };

      resultado[posicion] = producto;
      actualizadas.push(producto);
      continue;
    }

    if (nombres.has(clave)) {
      omitidas.push({
        titulo: nombre,
        motivo: 'ya existe un producto con ese nombre (agrega "id" para actualizarlo)',
      });
      continue;
    }

    nombres.add(clave);
    agregadas.push({
      id,
      nombre,
      precio: numero(entrada.precio, 0),
      categoria: (entrada.categoria ?? '').trim() || 'Tienda',
      stock: numero(entrada.stock, 0),
      url: urlImagen,
    });
    id += 1;
  }

  return { productos: [...agregadas, ...resultado], agregadas, actualizadas, omitidas };
}

