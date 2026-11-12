/**
 * Baja las ultimas publicaciones de la pagina de Facebook del club y las deja
 * listas para publicarlas con el importador.
 *
 * Por que hace falta un token: la pagina no se puede leer sin sesion (Facebook
 * responde 400 a cualquier programa) y los enlaces de sus fotos viven en
 * `scontent-*.fbcdn.net`, que caducan y responden 403 — fue justo lo que dejo
 * las imagenes rotas en el sitio. Con un **token de pagina** la Graph API si
 * entrega los textos y las fotos, y aqui se bajan al disco para subirlas al
 * bucket del sitio.
 *
 * Uso:
 *   npm run facebook:sincronizar                  # baja y prepara importar/facebook/
 *   npm run facebook:sincronizar -- --publicar    # ademas publica en el sitio
 *
 * Variables (o flags, ver `--ayuda`):
 *   FB_PAGE_TOKEN      token de pagina (obligatorio)
 *   FB_PAGE_ID         id o nombre de la pagina (si falta se usa el del token)
 *   FB_API_VERSION     version de la Graph API (por defecto v21.0)
 *   API_URL            API del sitio (por defecto, la de produccion)
 *   ADMIN_EMAIL / ADMIN_PASSWORD   cuenta del panel, para --publicar
 *
 * El manifiesto se regenera en cada pasada. Las fotos se guardan con un nombre
 * estable (`fb-<publicacion>-<n>.jpg`), asi que una segunda pasada no vuelve a
 * subir nada y el importador solo agrega lo que falte.
 */

import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  fotosDePublicacion,
  mapearPublicacion,
  nombreDeArchivo,
  tituloDeMensaje,
  type PublicacionFacebook,
} from '../src/lib/facebook.js';
import {
  normalizarTitulo,
  type EntradaGaleria,
  type EntradaNoticia,
} from '../src/lib/importar.js';

const API_POR_DEFECTO = 'https://juventudguacarhue-production.up.railway.app/api';
const VERSION_POR_DEFECTO = 'v21.0';
const CAMPOS = [
  'id',
  'message',
  'created_time',
  'permalink_url',
  'full_picture',
  'attachments{media{image{src}},subattachments{media{image{src}}}}',
].join(',');

interface Opciones {
  api: string;
  carpeta: string;
  pagina: string;
  token: string;
  version: string;
  graph: string;
  limite: number;
  desde: string;
  categoriaGaleria: string;
  email: string;
  password: string;
  adminToken: string;
  publicar: boolean;
  ayuda: boolean;
}

function leerOpciones(): Opciones {
  const args = process.argv.slice(2);
  const valor = (nombre: string): string => {
    const prefijo = `--${nombre}=`;
    const encontrado = args.find((arg) => arg.startsWith(prefijo));
    return encontrado ? encontrado.slice(prefijo.length) : '';
  };

  const limite = Number(valor('limite') || 10);

  return {
    api: (valor('api') || process.env.API_URL || API_POR_DEFECTO).replace(/\/$/, ''),
    carpeta: path.resolve(valor('carpeta') || path.join('importar', 'facebook')),
    pagina: valor('pagina') || process.env.FB_PAGE_ID || '',
    token: valor('token') || process.env.FB_PAGE_TOKEN || '',
    version: valor('version') || process.env.FB_API_VERSION || VERSION_POR_DEFECTO,
    graph: valor('graph') || process.env.FB_GRAPH_URL || '',
    limite: Number.isFinite(limite) && limite > 0 ? Math.min(limite, 100) : 10,
    desde: valor('desde'),
    categoriaGaleria: valor('categoria-galeria') || 'Partidos',
    email: valor('email') || process.env.ADMIN_EMAIL || '',
    password: valor('password') || process.env.ADMIN_PASSWORD || '',
    adminToken: valor('admin-token') || process.env.ADMIN_TOKEN || '',
    publicar: args.includes('--publicar'),
    ayuda: args.includes('--ayuda') || args.includes('-h'),
  };
}

function ayuda(): void {
  console.log(`
Sincronizar la pagina de Facebook del club con el sitio

  npm run facebook:sincronizar                 Lee las ultimas publicaciones
  npm run facebook:sincronizar -- --publicar   Ademas las publica en el sitio

Opciones:
  --limite=<n>              Publicaciones a leer (por defecto 10, maximo 100)
  --desde=<AAAA-MM-DD>      Solo publicaciones desde esa fecha
  --carpeta=<ruta>          Donde dejar fotos y manifiesto (importar/facebook)
  --categoria-galeria=<c>   Categoria de las fotos sueltas (Partidos)
  --pagina=<id>             Id de la pagina (o variable FB_PAGE_ID)
  --token=<token>           Token de pagina (o variable FB_PAGE_TOKEN)
  --api=<url>               API del sitio (por defecto la de produccion)
  --graph=<url>             Host de la Graph API (avanzado; sirve para probar)
  --email=<correo>          Cuenta del panel, para --publicar (o ADMIN_EMAIL)
  --password=<clave>        Contrasena de esa cuenta (o ADMIN_PASSWORD)
  --publicar                Publica lo descargado con el importador

Como sacar el token (2 minutos, hay que ser administrador de la pagina):
  1. Entra a https://developers.facebook.com/apps y crea una app
     (tipo "Otro" -> "Empresa").
  2. Abre https://developers.facebook.com/tools/explorer, elige esa app y
     agrega los permisos pages_show_list y pages_read_engagement.
  3. Pulsa "Generate Access Token" y autoriza tu cuenta.
  4. En el desplegable de la izquierda elige la pagina del club: el token que
     aparece es el "Page Access Token". Dura ~60 dias.
  5. Pegalo en backend/.env como FB_PAGE_TOKEN (y el id de la pagina como
     FB_PAGE_ID, o dejalo vacio para que se lea del token).

Los textos y las fotos quedan en importar/facebook/ (no se versionan). Las
categorias se adivinan por palabra clave: revisa noticias.json antes de
publicar si quieres ajustarlas.
`);
}

/** Traduce los errores de la Graph API a algo accionable. */
function explicarError(error: { message?: string; code?: number }): string {
  const detalle = error?.message ?? 'error desconocido';

  switch (Number(error?.code)) {
    case 190:
      return `el token no sirve o expiro (${detalle}). Saca uno nuevo en el Graph API Explorer y actualiza FB_PAGE_TOKEN.`;
    case 10:
    case 200:
      return `a la app le faltan permisos (${detalle}). Revisa pages_show_list y pages_read_engagement.`;
    case 100:
      return `la pagina no existe o el token no es suyo (${detalle}). Revisa FB_PAGE_ID y que el token sea de la pagina, no de tu usuario.`;
    default:
      return `${detalle} (codigo ${error?.code ?? '?'})`;
  }
}

async function pedirJson(url: string): Promise<Record<string, unknown>> {
  const respuesta = await fetch(url);
  const texto = await respuesta.text();
  let datos: Record<string, unknown>;

  try {
    datos = JSON.parse(texto) as Record<string, unknown>;
  } catch {
    throw new Error(
      `respuesta inesperada de Facebook (HTTP ${respuesta.status}): ${texto.slice(0, 120)}`,
    );
  }

  const error = datos.error as { message?: string; code?: number } | undefined;

  if (error) {
    throw new Error(explicarError(error));
  }

  if (!respuesta.ok) {
    throw new Error(`HTTP ${respuesta.status} al consultar la Graph API`);
  }

  return datos;
}

/** Baja la foto si no esta ya en el disco (el nombre es estable). */
async function descargar(url: string, destino: string): Promise<'bajada' | 'en disco'> {
  if (existsSync(destino) && statSync(destino).size > 0) {
    return 'en disco';
  }

  const respuesta = await fetch(url);

  if (!respuesta.ok) {
    throw new Error(`HTTP ${respuesta.status} al bajar la foto`);
  }

  const bytes = Buffer.from(await respuesta.arrayBuffer());

  if (bytes.length === 0) {
    throw new Error('la foto vino vacia');
  }

  writeFileSync(destino, bytes);

  return 'bajada';
}

/** Titulo -> id de lo ya publicado, para actualizar en vez de duplicar. */
async function idsPublicados(api: string): Promise<Map<string, number>> {
  const mapa = new Map<string, number>();

  try {
    const respuesta = await fetch(`${api}/contenido`);
    const datos = (await respuesta.json()) as {
      datos?: { noticias?: Array<{ id?: number; titulo?: string }> };
    };

    for (const noticia of datos?.datos?.noticias ?? []) {
      const clave = normalizarTitulo(noticia?.titulo ?? '');
      const id = Number(noticia?.id);

      if (clave && Number.isFinite(id)) {
        mapa.set(clave, id);
      }
    }
  } catch {
    // Sin conexion al sitio se sigue igual: solo se pierde la actualizacion en
    // su sitio, y el importador avisara de los titulos repetidos.
  }

  return mapa;
}


async function main(): Promise<void> {
  const opciones = leerOpciones();

  if (opciones.ayuda) {
    ayuda();
    return;
  }

  if (!opciones.token) {
    console.error('\n❌ Falta el token de la pagina (FB_PAGE_TOKEN).');
    ayuda();
    process.exitCode = 1;
    return;
  }

  const base = opciones.graph
    ? opciones.graph.replace(/\/$/, '')
    : `https://graph.facebook.com/${opciones.version}`;

  console.log('\n📘 Sincronizar la pagina de Facebook con el sitio');
  console.log(`   Graph API: ${opciones.version}`);
  console.log(`   Carpeta:   ${opciones.carpeta}`);
  console.log(`   Modo:      ${opciones.publicar ? 'PUBLICAR' : 'solo descargar'}`);

  let pagina = opciones.pagina;

  if (!pagina) {
    const yo = await pedirJson(
      `${base}/me?fields=id,name&access_token=${encodeURIComponent(opciones.token)}`,
    );
    pagina = String(yo.id ?? '');
    console.log(`   Pagina:    ${String(yo.name ?? pagina)} (${pagina})`);

    if (!pagina) {
      throw new Error('no se pudo leer el id de la pagina; pasalo con --pagina=<id>');
    }
  }

  const url = new URL(`${base}/${encodeURIComponent(pagina)}/posts`);
  url.searchParams.set('fields', CAMPOS);
  url.searchParams.set('limit', String(opciones.limite));
  url.searchParams.set('access_token', opciones.token);

  if (opciones.desde) {
    const desde = new Date(`${opciones.desde}T00:00:00-03:00`);

    if (Number.isNaN(desde.getTime())) {
      throw new Error(`--desde=${opciones.desde} no es una fecha AAAA-MM-DD`);
    }

    url.searchParams.set('since', String(Math.floor(desde.getTime() / 1000)));
  }

  const datos = await pedirJson(url.toString());
  const publicaciones = (datos.data as PublicacionFacebook[] | undefined) ?? [];

  console.log(`   Leidas:    ${publicaciones.length} publicaciones`);

  mkdirSync(opciones.carpeta, { recursive: true });

  const ids = await idsPublicados(opciones.api);

  const noticias: EntradaNoticia[] = [];
  const galeria: EntradaGaleria[] = [];
  const omitidas: Array<{ id: string; motivo: string }> = [];
  const titulos = new Set<string>();
  let bajadas = 0;
  let reusadas = 0;

  console.log('\n🖼️  Publicaciones');

  for (const publicacion of publicaciones) {
    const idPublicacion = publicacion.id ?? '?';
    const fotos = fotosDePublicacion(publicacion);

    if (fotos.length === 0) {
      omitidas.push({ id: idPublicacion, motivo: 'sin fotos' });
      continue;
    }

    const archivos: string[] = [];
    let fallo = '';

    for (const [indice, foto] of fotos.entries()) {
      const archivo = nombreDeArchivo(publicacion.id, indice + 1, foto);

      try {
        const estado = await descargar(foto, path.join(opciones.carpeta, archivo));

        if (estado === 'bajada') {
          bajadas += 1;
        } else {
          reusadas += 1;
        }

        archivos.push(archivo);
      } catch (error) {
        fallo = error instanceof Error ? error.message : String(error);
        break;
      }
    }

    if (fallo) {
      omitidas.push({ id: idPublicacion, motivo: fallo });
      continue;
    }

    const clave = normalizarTitulo(tituloDeMensaje(publicacion.message));

    if (clave && titulos.has(clave)) {
      omitidas.push({ id: idPublicacion, motivo: 'titulo repetido en la misma lista' });
      continue;
    }

    const resultado = mapearPublicacion(publicacion, {
      archivos,
      id: clave ? ids.get(clave) : undefined,
      categoriaGaleria: opciones.categoriaGaleria,
    });

    if (resultado.motivo) {
      omitidas.push({ id: idPublicacion, motivo: resultado.motivo });
      continue;
    }

    if (clave) {
      titulos.add(clave);
    }

    galeria.push(...resultado.galeria);

    if (resultado.noticia) {
      noticias.push(resultado.noticia);
      console.log(`   · ${resultado.noticia.fecha} [${resultado.noticia.categoria}] ${resultado.noticia.titulo}`);
    } else {
      console.log(`   · (solo fotos) ${archivos.length} a la galeria`);
    }
  }


  const rutaManifiesto = path.join(opciones.carpeta, 'noticias.json');

  writeFileSync(
    rutaManifiesto,
    `${JSON.stringify(
      {
        _ayuda:
          'Generado por npm run facebook:sincronizar. Revisa titulos y categorias; puedes editarlo antes de publicar (se regenera en la proxima pasada).',
        noticias,
        galeria,
      },
      null,
      2,
    )}\n`,
  );

  console.log('\n📄 Manifiesto');
  console.log(`   ${rutaManifiesto}`);
  console.log(
    `   ${noticias.length} noticias y ${galeria.length} fotos de galeria ` +
      `(${bajadas} fotos bajadas, ${reusadas} ya estaban en el disco).`,
  );

  for (const omitida of omitidas) {
    console.log(`   = ${omitida.id}: ${omitida.motivo}`);
  }

  if (noticias.length === 0 && galeria.length === 0) {
    console.log('\n✅ Nada nuevo: esas publicaciones ya estan en el sitio.\n');
    return;
  }

  if (!opciones.publicar) {
    const relativa = path.relative(process.cwd(), opciones.carpeta);
    const carpetaCmd = relativa.startsWith('..') ? opciones.carpeta : relativa;

    console.log('\nℹ️  No se publico nada. Revisa el manifiesto y luego:');
    console.log(`   npm run importar -- --publicar --carpeta=${carpetaCmd}\n`);
    return;
  }

  console.log('\n🚀 Publicando en el sitio...\n');

  const resultado = spawnSync(
    'npx',
    [
      'tsx',
      path.resolve('scripts/importar-contenido.ts'),
      `--carpeta=${opciones.carpeta}`,
      '--publicar',
      ...(opciones.email ? [`--email=${opciones.email}`] : []),
      ...(opciones.password ? [`--password=${opciones.password}`] : []),
      ...(opciones.adminToken ? [`--token=${opciones.adminToken}`] : []),
      `--api=${opciones.api}`,
    ],
    { stdio: 'inherit' },
  );

  if (resultado.status !== 0) {
    throw new Error('el importador termino con error (mira los mensajes de arriba)');
  }
}

main().catch((error: unknown) => {
  console.error(`\n❌ ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});

