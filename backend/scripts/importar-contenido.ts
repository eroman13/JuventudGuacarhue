/**
 * Importa en bloque noticias y fotos de galeria al sitio publicado.
 *
 * Pensado para pasar al sitio las fotos y los textos de la pagina de Facebook
 * del club, que no se pueden enlazar directamente (los enlaces del CDN de
 * Facebook caducan y responden 403). Aqui cada foto se **sube** al bucket del
 * sitio y se guarda la URL definitiva.
 *
 * Uso:
 *   npm run importar                       # simula: no sube ni publica nada
 *   npm run importar -- --publicar         # sube las fotos y guarda en el sitio
 *
 * Variables (o flags, ver `--ayuda`):
 *   API_URL          URL base de la API (por defecto, la de produccion)
 *   ADMIN_EMAIL      cuenta del panel
 *   ADMIN_PASSWORD   contrasena de esa cuenta
 *
 * Detecta los duplicados, asi que se puede volver a ejecutar sin miedo: no
 * repite noticias con el mismo titulo ni fotos que ya esten en la galeria, y
 * recuerda en `importar/.importado.json` las fotos que ya subio.
 */

import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  esFechaValida,
  fusionarGaleria,
  fusionarNoticias,
  fusionarProductos,
  validarEntrada,
  validarProducto,
  type DocumentoContenido,
  type EntradaGaleria,
  type EntradaLista,
  type EntradaNoticia,
  type EntradaProducto,
} from '../src/lib/importar.js';

const API_POR_DEFECTO = 'https://juventudguacarhue-production.up.railway.app/api';
const MAXIMO_BYTES = 5 * 1024 * 1024;

/** Tipo MIME por extension; el backend rechaza el resto (SVG incluido). */
const TIPOS: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
};

interface Manifiesto {
  noticias?: EntradaNoticia[];
  galeria?: EntradaGaleria[];
  productos?: EntradaProducto[];
}

interface Opciones {
  api: string;
  carpeta: string;
  manifiesto: string;
  email: string;
  password: string;
  token: string;
  publicar: boolean;
}

function leerOpciones(): Opciones {
  const args = process.argv.slice(2);
  const valor = (nombre: string): string => {
    const prefijo = `--${nombre}=`;
    const encontrado = args.find((arg) => arg.startsWith(prefijo));
    return encontrado ? encontrado.slice(prefijo.length) : '';
  };

  return {
    api: (valor('api') || process.env.API_URL || API_POR_DEFECTO).replace(/\/$/, ''),
    carpeta: path.resolve(valor('carpeta') || 'importar'),
    manifiesto: valor('manifiesto') || 'noticias.json',
    email: valor('email') || process.env.ADMIN_EMAIL || '',
    password: valor('password') || process.env.ADMIN_PASSWORD || '',
    token: valor('token') || process.env.ADMIN_TOKEN || '',
    publicar: args.includes('--publicar'),
  };
}

function ayuda(): void {
  console.log(`
Importar noticias y fotos al sitio de Juventud Guacarhue

  npm run importar                       Simula (no toca el servidor)
  npm run importar -- --publicar         Sube las fotos y publica los cambios

Opciones:
  --api=<url>          API del sitio (por defecto ${API_POR_DEFECTO})
  --carpeta=<ruta>     Carpeta con las fotos y el manifiesto (por defecto importar/)
  --manifiesto=<file>  Nombre del manifiesto (por defecto noticias.json)
  --email=<correo>     Cuenta del panel (o variable ADMIN_EMAIL)
  --password=<clave>   Contrasena (o variable ADMIN_PASSWORD)
  --token=<jwt>        Usar un token ya emitido (o variable ADMIN_TOKEN)

En "imagen" puedes poner el nombre de un archivo de la carpeta o una URL que ya
este publicada (por ejemplo, una imagen del propio sitio).

Si pones "id" en una noticia (o en una foto de la galeria) que ya existe, se
actualiza en vez de crear una copia. Es la forma de cambiar una portada.
Ver importar/LEEME.md para el manifiesto completo.
`);
}

/** Inicia sesion y devuelve el token del panel. */
async function iniciarSesion(api: string, email: string, password: string): Promise<string> {
  const respuesta = await fetch(`${api}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const cuerpo = (await respuesta.json().catch(() => null)) as
    | { token?: string; error?: { message?: string } }
    | null;

  if (!respuesta.ok || !cuerpo?.token) {
    throw new Error(
      `No se pudo iniciar sesion (HTTP ${respuesta.status}): ${cuerpo?.error?.message ?? 'sin detalle'}. Usa --email y --password, o ADMIN_EMAIL / ADMIN_PASSWORD.`,
    );
  }

  return cuerpo.token;
}

async function leerDocumento(api: string): Promise<DocumentoContenido> {
  const respuesta = await fetch(`${api}/contenido`);

  if (!respuesta.ok) {
    throw new Error(`GET /contenido respondio HTTP ${respuesta.status}.`);
  }

  const cuerpo = (await respuesta.json()) as { datos?: DocumentoContenido | null };

  if (!cuerpo.datos) {
    throw new Error('El sitio todavia no tiene contenido guardado en el servidor.');
  }

  return cuerpo.datos;
}

async function guardarDocumento(
  api: string,
  token: string,
  datos: DocumentoContenido,
): Promise<void> {
  const respuesta = await fetch(`${api}/contenido`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ datos }),
  });

  if (!respuesta.ok) {
    const detalle = await respuesta.text().catch(() => '');
    throw new Error(`PUT /contenido respondio HTTP ${respuesta.status}. ${detalle}`);
  }
}



/** Fotos ya subidas en ejecuciones anteriores: archivo -> subida. */
interface Subida {
  url: string;
  bytes: number;
  mtimeMs: number;
}

function leerCache(carpeta: string): Record<string, Subida> {
  const ruta = path.join(carpeta, '.importado.json');

  if (!existsSync(ruta)) {
    return {};
  }

  try {
    const crudo = JSON.parse(readFileSync(ruta, 'utf8')) as Record<string, string | Subida>;
    const cache: Record<string, Subida> = {};

    for (const [archivo, valor] of Object.entries(crudo)) {
      // Formato viejo (solo la URL): se sube otra vez, no cuesta nada.
      cache[archivo] = typeof valor === 'string' ? { url: valor, bytes: -1, mtimeMs: -1 } : valor;
    }

    return cache;
  } catch {
    return {};
  }
}

function guardarCache(carpeta: string, cache: Record<string, Subida>): void {
  writeFileSync(path.join(carpeta, '.importado.json'), `${JSON.stringify(cache, null, 2)}\n`);
}

/**
 * Devuelve la URL publica de una foto: la sube al mismo almacenamiento que usa
 * el panel (`POST /api/uploads`) y recuerda el resultado para no repetirla.
 *
 * Si el archivo cambia (misma ruta, otra foto), se vuelve a subir: asi se
 * reemplazan los marcadores de posicion por las fotos reales.
 */
async function subirFoto(
  api: string,
  carpeta: string,
  archivo: string,
  cache: Record<string, Subida>,
  publicar: boolean,
): Promise<string> {
  if (/^https?:\/\//i.test(archivo)) {
    return archivo;
  }

  const ruta = path.join(carpeta, archivo);

  if (!existsSync(ruta)) {
    throw new Error(`No existe el archivo "${archivo}" en ${carpeta}.`);
  }

  const info = statSync(ruta);
  const mtimeMs = Math.trunc(info.mtimeMs);
  const subida = cache[archivo];

  if (subida && subida.bytes === info.size && subida.mtimeMs === mtimeMs) {
    console.log(`   · ya subida antes, se reutiliza: ${archivo}`);
    return subida.url;
  }

  if (!publicar) {
    return `SIMULADO/${archivo}`;
  }

  const buffer = readFileSync(ruta);
  const tipo = TIPOS[path.extname(archivo).toLowerCase()];

  if (!tipo) {
    throw new Error(`Formato no permitido en "${archivo}": usa JPG, PNG, WebP, GIF o AVIF.`);
  }

  if (buffer.byteLength > MAXIMO_BYTES) {
    const mb = (buffer.byteLength / 1024 / 1024).toFixed(1);
    throw new Error(
      `"${archivo}" pesa ${mb} MB y el limite es 5 MB. Comprime la foto o reducela antes de importar.`,
    );
  }

  const formulario = new FormData();
  formulario.append('image', new Blob([buffer], { type: tipo }), path.basename(archivo));

  const respuesta = await fetch(`${api}/uploads`, { method: 'POST', body: formulario });
  const cuerpo = (await respuesta.json().catch(() => null)) as
    | { url?: string; error?: string | { message?: string } }
    | null;

  if (!respuesta.ok || !cuerpo?.url) {
    const error = typeof cuerpo?.error === 'string' ? cuerpo.error : cuerpo?.error?.message;
    throw new Error(
      `No se pudo subir "${archivo}" (HTTP ${respuesta.status}): ${error ?? 'sin detalle'}`,
    );
  }

  cache[archivo] = { url: cuerpo.url, bytes: info.size, mtimeMs };
  console.log(`   · subida: ${archivo} -> ${cuerpo.url}`);
  return cuerpo.url;
}

/** Sube la imagen de cada entrada y devuelve la lista con su URL definitiva. */
async function subirLista<T extends object>(
  opciones: Opciones,
  cache: Record<string, Subida>,
  entradas: T[],
  campo: 'imagen' | 'archivo',
): Promise<Array<EntradaLista<T>>> {
  const listas: Array<EntradaLista<T>> = [];

  for (const entrada of entradas) {
    const archivo = String((entrada as Record<string, unknown>)[campo] ?? '').trim();
    const urlImagen = await subirFoto(
      opciones.api,
      opciones.carpeta,
      archivo,
      cache,
      opciones.publicar,
    );
    listas.push({ entrada, urlImagen, archivo });
  }

  return listas;
}

async function main(): Promise<void> {
  if (process.argv.includes('--ayuda') || process.argv.includes('--help')) {
    ayuda();
    return;
  }

  const opciones = leerOpciones();
  const rutaManifiesto = path.join(opciones.carpeta, opciones.manifiesto);

  console.log('\n📥 Importar noticias y fotos al sitio');
  console.log(`   API: ${opciones.api}`);
  console.log(`   Carpeta: ${opciones.carpeta}`);
  console.log(
    `   Modo: ${opciones.publicar ? 'PUBLICAR (sube fotos y guarda)' : 'simulacion (no toca nada)'}`,
  );

  if (!existsSync(rutaManifiesto)) {
    console.error(`\n❌ No encuentro ${rutaManifiesto}.`);
    console.error(
      '   Copia importar/noticias.ejemplo.json a importar/noticias.json y completa los datos.\n',
    );
    process.exitCode = 1;
    return;
  }

  let manifiesto: Manifiesto;

  try {
    manifiesto = JSON.parse(readFileSync(rutaManifiesto, 'utf8')) as Manifiesto;
  } catch (error) {
    console.error(`\n❌ El manifiesto no es JSON valido: ${(error as Error).message}\n`);
    process.exitCode = 1;
    return;
  }

  const noticias = manifiesto.noticias ?? [];
  const galeria = manifiesto.galeria ?? [];
  const productos = manifiesto.productos ?? [];

  if (noticias.length === 0 && galeria.length === 0 && productos.length === 0) {
    console.log('\nℹ️  El manifiesto no tiene noticias, fotos ni productos.');
    return;
  }

  // Se valida todo antes de subir nada: si una entrada esta mal, no queremos
  // dejar la mitad de las fotos en el bucket y el sitio a medio actualizar.
  const problemas: string[] = [];

  noticias.forEach((entrada, indice) => {
    const errores = validarEntrada(entrada);
    if (errores.length > 0) {
      problemas.push(`noticias[${indice}] "${entrada.titulo ?? 'sin titulo'}": ${errores.join(', ')}`);
    }
  });

  galeria.forEach((entrada, indice) => {
    if (!entrada.archivo?.trim()) {
      problemas.push(`galeria[${indice}]: falta "archivo"`);
    }
    if (!esFechaValida(entrada.fecha)) {
      problemas.push(
        `galeria[${indice}] "${entrada.archivo ?? ''}": la fecha "${entrada.fecha ?? ''}" no es valida`,
      );
    }
  });

  productos.forEach((entrada, indice) => {
    const errores = validarProducto(entrada);
    if (errores.length > 0) {
      problemas.push(`productos[${indice}] "${entrada.nombre ?? 'sin nombre'}": ${errores.join(', ')}`);
    }
  });

  if (problemas.length > 0) {
    console.error('\n❌ Corrige el manifiesto antes de continuar:');
    for (const problema of problemas) {
      console.error(`   · ${problema}`);
    }
    console.error('');
    process.exitCode = 1;
    return;
  }

  const documento = await leerDocumento(opciones.api);
  console.log(
    `   En el sitio: ${documento.noticias?.length ?? 0} noticias, ${documento.galeria?.length ?? 0} fotos`,
  );

  let token = opciones.token;

  if (opciones.publicar && !token) {
    if (!opciones.email || !opciones.password) {
      console.error(
        '\n❌ Falta la cuenta del panel. Usa --email y --password (o ADMIN_EMAIL / ADMIN_PASSWORD).\n',
      );
      process.exitCode = 1;
      return;
    }

    token = await iniciarSesion(opciones.api, opciones.email, opciones.password);
    console.log('   Sesion iniciada en el panel');
  }

  const cache = leerCache(opciones.carpeta);

  console.log('\n🖼️  Fotos');
  const listasNoticias = await subirLista(opciones, cache, noticias, 'imagen');
  const listasGaleria = await subirLista(opciones, cache, galeria, 'archivo');
  const listasProductos = await subirLista(opciones, cache, productos, 'imagen');

  if (opciones.publicar) {
    guardarCache(opciones.carpeta, cache);
  }

  const resultadoNoticias = fusionarNoticias(documento, listasNoticias);
  const resultadoGaleria = fusionarGaleria(documento, listasGaleria);
  const resultadoProductos = fusionarProductos(documento, listasProductos);

  console.log('\n📰 Noticias');
  for (const noticia of resultadoNoticias.agregadas) {
    console.log(`   + [${noticia.id}] ${noticia.titulo} (${noticia.fecha}, ${noticia.categoria})`);
  }
  for (const noticia of resultadoNoticias.actualizadas) {
    console.log(`   ~ [${noticia.id}] ${noticia.titulo} (actualizada)`);
  }
  for (const omitida of resultadoNoticias.omitidas) {
    console.log(`   = ${omitida.titulo}: ${omitida.motivo}`);
  }
  if (
    resultadoNoticias.agregadas.length === 0 &&
    resultadoNoticias.actualizadas.length === 0 &&
    resultadoNoticias.omitidas.length === 0
  ) {
    console.log('   (sin noticias en el manifiesto)');
  }

  console.log('\n📷 Galeria');
  for (const foto of resultadoGaleria.agregadas) {
    console.log(`   + [${foto.id}] ${foto.url} (${foto.fecha}, ${foto.categoria})`);
  }
  for (const foto of resultadoGaleria.actualizadas) {
    console.log(`   ~ [${foto.id}] ${foto.url} (actualizada)`);
  }
  for (const omitida of resultadoGaleria.omitidas) {
    console.log(`   = ${omitida.titulo}: ${omitida.motivo}`);
  }
  if (
    resultadoGaleria.agregadas.length === 0 &&
    resultadoGaleria.actualizadas.length === 0 &&
    resultadoGaleria.omitidas.length === 0
  ) {
    console.log('   (sin fotos en el manifiesto)');
  }

  console.log('\n🛒 Tienda');
  for (const producto of resultadoProductos.agregadas) {
    console.log(`   + [${producto.id}] ${producto.nombre} (${producto.categoria})`);
  }
  for (const producto of resultadoProductos.actualizadas) {
    console.log(`   ~ [${producto.id}] ${producto.nombre} (actualizado)`);
  }
  for (const omitida of resultadoProductos.omitidas) {
    console.log(`   = ${omitida.titulo}: ${omitida.motivo}`);
  }
  if (
    resultadoProductos.agregadas.length === 0 &&
    resultadoProductos.actualizadas.length === 0 &&
    resultadoProductos.omitidas.length === 0
  ) {
    console.log('   (sin productos en el manifiesto)');
  }

  const hayCambios =
    resultadoNoticias.agregadas.length > 0 ||
    resultadoNoticias.actualizadas.length > 0 ||
    resultadoGaleria.agregadas.length > 0 ||
    resultadoGaleria.actualizadas.length > 0 ||
    resultadoProductos.agregadas.length > 0 ||
    resultadoProductos.actualizadas.length > 0;

  if (!opciones.publicar) {
    console.log('\nℹ️  Simulacion: no se subio ni se guardo nada.');
    console.log('   Si el resumen es correcto, repite con:  npm run importar -- --publicar\n');
    return;
  }

  if (!hayCambios) {
    console.log('\n✅ Nada nuevo que publicar: el sitio ya tenia todo esto.\n');
    return;
  }

  await guardarDocumento(opciones.api, token as string, {
    ...documento,
    noticias: resultadoNoticias.noticias,
    galeria: resultadoGaleria.galeria,
    productos: resultadoProductos.productos,
  });

  console.log(
    `\n✅ Publicado: ${resultadoNoticias.agregadas.length} noticias, ${resultadoGaleria.agregadas.length} fotos y ${resultadoProductos.agregadas.length} productos nuevos; ` +
      `${resultadoNoticias.actualizadas.length} noticias, ${resultadoGaleria.actualizadas.length} fotos y ${resultadoProductos.actualizadas.length} productos actualizados.\n`,
  );
}

main().catch((error: unknown) => {
  console.error(`\n❌ ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
