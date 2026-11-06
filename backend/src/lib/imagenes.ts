/**
 * Imagenes publicas que se suben desde el panel: logo del club, fotos de la
 * galeria, portadas de noticias, jugadores y productos.
 *
 * Dos modos, decididos solos segun lo que este configurado:
 *
 *   · `r2`    -> **Cloudflare R2** (produccion). La imagen va al bucket publico
 *                y en la base de datos queda solo su URL, servida por la CDN.
 *   · `disco` -> `uploads/` del backend (desarrollo, o volumen de Railway).
 *                Sin R2 la imagen la sirve el propio backend: no hay CDN, no se
 *                comparte entre replicas y depende de que el volumen exista.
 *                Ver docs/DEPLOY.md.
 *
 * El bucket es **publico** (las imagenes se ven en el sitio y son las que viajan
 * en la vista previa de WhatsApp), asi que se sirven sin firmar y con cache
 * larga: cada subida estrena clave (`uploads/<timestamp>-<nombre>.<ext>`), por lo
 * que `Cache-Control: immutable` nunca deja pegada una imagen vieja.
 *
 * Mismo patron que el proyecto MiCelebra (`backend/src/lib/imagenes.ts`): sin
 * `R2_BUCKET_IMAGENES`/`R2_URL_IMAGENES` (desarrollo y tests) se sigue usando el
 * disco, para poder probar el flujo completo sin credenciales de Cloudflare.
 */

import fs from 'node:fs';
import path from 'node:path';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ensureUploadDir, UPLOAD_DIR } from './uploadStorage.js';

export type ModoImagenes = 'r2' | 'disco';

/** Carpeta dentro del bucket que agrupa todo lo subido desde el panel. */
const PREFIJO = 'uploads';

interface ConfigImagenes {
  bucket: string;
  /** URL publica del bucket (sin barra final), ej. `https://fotos.tudominio.cl`. */
  url: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
}

/**
 * Lee la configuracion del bucket publico del entorno.
 *
 * Devuelve `null` si falta cualquier pieza: con media configuracion es mejor el
 * disco que subir imagenes a un bucket cuya URL publica no se conoce.
 */
function leerConfig(): ConfigImagenes | null {
  const bucket = (process.env.R2_BUCKET_IMAGENES || '').trim();
  const url = (process.env.R2_URL_IMAGENES || '').trim().replace(/\/+$/, '');
  const accessKeyId = (process.env.R2_ACCESS_KEY_ID || '').trim();
  const secretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || '').trim();
  const cuenta = (process.env.R2_ACCOUNT_ID || '').trim();
  const endpoint =
    (process.env.R2_ENDPOINT || '').trim() ||
    (cuenta ? `https://${cuenta}.r2.cloudflarestorage.com` : '');

  if (!bucket || !url || !accessKeyId || !secretAccessKey || !endpoint) return null;

  return { bucket, url, endpoint, accessKeyId, secretAccessKey };
}

/** ¿Las imagenes se guardan en R2? (`false` = disco, como hasta ahora). */
export function imagenesEnR2(): boolean {
  return leerConfig() !== null;
}

/** Donde terminan las imagenes que se suben desde el panel. */
export function modoImagenes(): ModoImagenes {
  return imagenesEnR2() ? 'r2' : 'disco';
}

/** Formato aceptado -> extension con la que se guarda. */
const MIME_A_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

/**
 * Extension para un MIME aceptado, o `null` si no se permite.
 *
 * Se deja fuera el SVG a proposito: es un documento con scripts y, servido desde
 * el dominio publico, podria usarse para phishing. Si el escudo del club esta en
 * SVG hay que exportarlo a PNG (o pegar su URL externa en el campo del logo).
 */
export function extensionDe(mime: string): string | null {
  return MIME_A_EXT[mime.trim().toLowerCase()] || null;
}

/**
 * Revisa los primeros bytes: confirma que el archivo es lo que dice ser, para que
 * no se pueda guardar cualquier cosa haciendose pasar por imagen.
 */
export function firmaValida(mime: string, buffer: Buffer): boolean {
  if (buffer.length < 12) return false;

  const texto = (desde: number, hasta: number) => buffer.toString('latin1', desde, hasta);

  switch (mime.trim().toLowerCase()) {
    case 'image/jpeg':
    case 'image/jpg':
      return buffer[0] === 0xff && buffer[1] === 0xd8;
    case 'image/png':
      return buffer[0] === 0x89 && texto(1, 4) === 'PNG';
    case 'image/gif':
      return texto(0, 4) === 'GIF8';
    case 'image/webp':
      return texto(0, 4) === 'RIFF' && texto(8, 12) === 'WEBP';
    case 'image/avif':
      return texto(4, 8) === 'ftyp' && /^avi[fs]$/.test(texto(8, 12));
    default:
      return false;
  }
}

/**
 * Clave del objeto: `uploads/<timestamp>-<nombre-saneado>.<ext>`.
 *
 * El timestamp conserva el esquema de nombres que ya usaba el panel y, ademas,
 * hace que cada subida estrene URL: asi se puede cachear para siempre sin que
 * quede pegada la imagen anterior.
 */
export function claveDeImagen(nombreOriginal: string, ext: string): string {
  const base =
    (nombreOriginal || 'imagen')
      .replace(/\.[^/.]+$/, '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'imagen';

  return `${PREFIJO}/${Date.now()}-${base}.${ext}`;
}

/** Nombre del archivo (sin la carpeta) que se devuelve al panel. */
export function nombreDeClave(clave: string): string {
  return path.basename(clave);
}

/**
 * Cliente S3 de R2 (se crea una vez, la primera vez que se usa).
 *
 * Se guarda junto a la huella de la configuracion con la que se creo: si cambian
 * el endpoint o las claves (por ejemplo al corregir una variable sin reiniciar),
 * se arma uno nuevo en vez de seguir hablandole al endpoint viejo.
 */
let clienteCache: { huella: string; cliente: S3Client } | null = null;

function huellaDe(cfg: ConfigImagenes): string {
  return `${cfg.endpoint}|${cfg.accessKeyId}|${cfg.secretAccessKey}`;
}

function cliente(cfg: ConfigImagenes): S3Client {
  const huella = huellaDe(cfg);

  if (!clienteCache || clienteCache.huella !== huella) {
    clienteCache = {
      huella,
      cliente: new S3Client({
        // R2 ignora la region, pero el SDK la exige.
        region: 'auto',
        endpoint: cfg.endpoint,
        credentials: {
          accessKeyId: cfg.accessKeyId,
          secretAccessKey: cfg.secretAccessKey,
        },
        // R2 no implementa los checksums automaticos del SDK
        // (`x-amz-checksum-crc32`) y firmarlos rompe la subida.
        requestChecksumCalculation: 'WHEN_REQUIRED',
        responseChecksumValidation: 'WHEN_REQUIRED',
      }),
    };
  }

  return clienteCache.cliente;
}

/** URL publica (CDN) de una clave. Lanza si R2 no esta configurado. */
export function urlDeImagen(clave: string): string {
  const cfg = leerConfig();
  if (!cfg) throw new Error('El bucket publico de imagenes no esta configurado');
  return `${cfg.url}/${clave}`;
}

/**
 * ¿La URL publica configurada es el subdominio de pruebas de R2 (`*.r2.dev`)?
 *
 * Cloudflare lo llama *R2.dev subdomain* y lo marca como **solo para pruebas**:
 * tiene limite de peticiones y no ofrece garantias de servicio. El codigo
 * funciona igual (solo necesita una URL base), asi que sirve para arrancar sin
 * tocar el DNS; antes de darlo por definitivo conviene conectar un dominio
 * propio (*Settings* -> *Public access* -> *Custom Domains*).
 */
export function urlPublicaDeDesarrollo(): boolean {
  const cfg = leerConfig();
  if (!cfg) return false;

  try {
    return new URL(cfg.url).hostname.endsWith('.r2.dev');
  } catch {
    // URL sin esquema (`fotos.tudominio.cl`): no es r2.dev y `npm run r2:probar`
    // lo va a decir al intentar leerla.
    return false;
  }
}

/** ¿Estamos en produccion? (ahi el disco no basta: no se comparte entre replicas). */
function esProduccion(): boolean {
  return process.env.NODE_ENV === 'production';
}

/** Escribe la imagen en el disco (`UPLOAD_DIR`) y devuelve su ruta relativa. */
function guardarEnDisco(clave: string, buffer: Buffer): string {
  const nombre = nombreDeClave(clave);
  fs.writeFileSync(path.join(ensureUploadDir(), nombre), buffer);
  return `/uploads/${nombre}`;
}

/**
 * Guarda la imagen en R2 (si esta configurado) o en el disco, y devuelve la URL
 * definitiva que hay que guardar en el contenido del sitio.
 *
 * Con R2 configurado **no** se cae al disco si la subida falla: en produccion eso
 * dejaria la imagen en un solo contenedor, se perderia en el siguiente
 * despliegue y nadie se enteraria. El error sube para que el panel lo muestre.
 */
export async function guardarImagen(
  clave: string,
  buffer: Buffer,
  tipo: string,
): Promise<string> {
  const cfg = leerConfig();

  if (!cfg) {
    if (esProduccion()) {
      console.warn(
        '[imagenes] R2 no esta configurado: la imagen se guarda en el disco (volumen). ' +
          'Sin CDN y sin compartirse entre replicas. Ver docs/DEPLOY.md.',
      );
    }
    return guardarEnDisco(clave, buffer);
  }

  await cliente(cfg).send(
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: clave,
      Body: buffer,
      ContentType: tipo,
      // La clave es unica por subida: se puede cachear un anio sin miedo.
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );

  return `${cfg.url}/${clave}`;
}

/**
 * Borra la imagen del bucket (o del disco). Nunca lanza: no es critico.
 *
 * Hoy la usa `scripts/probar-r2.ts` para no dejar basura de prueba. Sirve ademas
 * para limpiar a mano objetos huerfanos: cuando el panel reemplaza una imagen, el
 * objeto viejo se queda guardado (la app no borra sola).
 */
export async function borrarImagen(clave: string): Promise<void> {
  const cfg = leerConfig();

  if (!cfg) {
    try {
      fs.rmSync(path.join(UPLOAD_DIR, nombreDeClave(clave)), { force: true });
    } catch (error) {
      console.error('[imagenes] no se pudo borrar el archivo local', clave, error);
    }
    return;
  }

  try {
    await cliente(cfg).send(new DeleteObjectCommand({ Bucket: cfg.bucket, Key: clave }));
  } catch (error) {
    console.error('[imagenes] no se pudo borrar el objeto', clave, error);
  }
}

/**
 * Pregunta a la URL publica si esta sirviendo de verdad el bucket.
 *
 * Se le pide una clave que no existe: es la consulta mas barata que distingue un
 * bucket de «otra cosa». Un bucket publico contesta XML (`404 NoSuchKey`, o `403
 * AccessDenied` si al dominio le falta permiso de lectura); si el dominio apunta a
 * otra web —por ejemplo al comodin del dominio que manda todo a Vercel— contesta
 * **HTML**.
 *
 * Importa porque este fallo es invisible desde el resto del sistema: la subida
 * funciona, el objeto se guarda y la URL se arma bien, pero el visitante ve una
 * imagen rota (y la CDN la cachea un anio).
 */
export async function revisarUrlPublica(
  url: string,
): Promise<{ ok: boolean; motivo: string | null }> {
  try {
    const respuesta = await fetch(`${url}/${PREFIJO}/.revision-del-bucket`, {
      // Sin esto, un dominio que no contesta dejaria colgado el script.
      signal: AbortSignal.timeout(5000),
    });
    const tipo = (respuesta.headers.get('content-type') || '').toLowerCase();

    if (tipo.includes('text/html')) {
      return {
        ok: false,
        motivo: `ese dominio responde una pagina web (HTTP ${respuesta.status}), no el bucket`,
      };
    }

    return { ok: true, motivo: null };
  } catch {
    return {
      ok: false,
      motivo: 'ese dominio no responde por HTTPS (revisa el DNS y el certificado)',
    };
  }
}

/**
 * Comprueba que el bucket publico este realmente utilizable (lo usa
 * `scripts/probar-r2.ts`).
 *
 * Dos preguntas, porque son dos fallos distintos: primero las **credenciales**
 * (¿se puede escribir en el bucket?) y despues la **URL publica** (¿el visitante
 * puede ver lo escrito?).
 *
 * La prueba de credenciales es un `DELETE` de un objeto que no existe: si el
 * bucket contesta «no encontrado» es que las claves y el endpoint funcionan; un
 * 403 significa claves sin permiso sobre **este** bucket.
 */
export async function revisarImagenes(): Promise<{
  modo: ModoImagenes;
  listo: boolean;
  mensaje: string;
}> {
  const cfg = leerConfig();

  if (!cfg) {
    return {
      modo: 'disco',
      listo: false,
      mensaje:
        'Sin R2_BUCKET_IMAGENES/R2_URL_IMAGENES: las imagenes se guardan en el disco del backend (uploads/). En produccion sobreviven a los despliegues mientras exista el volumen, pero no usan CDN y no se comparten entre replicas.',
    };
  }

  try {
    await cliente(cfg).send(
      new DeleteObjectCommand({ Bucket: cfg.bucket, Key: `${PREFIJO}/.revision-del-bucket` }),
    );
  } catch (error) {
    const estado = (error as { $metadata?: { httpStatusCode?: number } })?.$metadata
      ?.httpStatusCode;

    if (estado === 403) {
      return {
        modo: 'r2',
        listo: false,
        mensaje:
          'R2 rechazo las claves (403): revisa que el token tenga permiso Object Read & Write sobre este bucket.',
      };
    }

    return {
      modo: 'r2',
      listo: false,
      mensaje: `No se pudo hablar con R2${estado ? ` (HTTP ${estado})` : ''}. Revisa R2_BUCKET_IMAGENES y R2_ENDPOINT.`,
    };
  }

  // Las claves y el bucket responden. Falta lo que ve el visitante: «las imagenes
  // se suben bien pero salen rotas» es el fallo mas probable en produccion (basta
  // con que R2_URL_IMAGENES apunte a un dominio que no esta conectado al bucket).
  const publica = await revisarUrlPublica(cfg.url);

  if (!publica.ok) {
    return {
      modo: 'r2',
      listo: false,
      mensaje: `Las claves funcionan y las imagenes se suben, pero la URL publica (${cfg.url}) no sirve imagenes: ${publica.motivo}. Revisa que ese dominio este conectado al bucket en R2 -> «${cfg.bucket}» -> Settings -> Public access (Custom Domains).`,
    };
  }

  const dePruebas = urlPublicaDeDesarrollo()
    ? ' Es el subdominio de pruebas (*.r2.dev): sirve para probar, pero conviene apuntarle un dominio propio.'
    : '';

  return {
    modo: 'r2',
    listo: true,
    mensaje: `Conectado al bucket publico de imagenes (${cfg.url}).${dePruebas}`,
  };
}

