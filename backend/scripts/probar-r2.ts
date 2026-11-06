/**
 * Comprueba que el almacenamiento de imagenes este bien configurado.
 *
 * Uso:
 *   npm run r2:probar
 *
 * Con las claves de R2 puestas hace la vuelta completa contra el bucket publico:
 * sube un PNG de prueba, **lee su URL publica** (lo que ve el visitante, servido
 * por la CDN) y lo borra. Es la forma de saber, antes de dar por buena la
 * configuracion, que no solo las variables estan puestas sino que las imagenes se
 * ven.
 *
 * Sin claves (o sea, en desarrollo) solo informa de que esta activo el disco
 * `uploads/`, que es lo normal en local.
 */

import dotenv from 'dotenv';
import {
  borrarImagen,
  claveDeImagen,
  firmaValida,
  guardarImagen,
  modoImagenes,
  revisarImagenes,
} from '../src/lib/imagenes.js';

dotenv.config();

/** PNG de 1x1: el archivo mas chico posible con firma PNG valida. */
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==',
  'base64',
);

async function main(): Promise<void> {
  console.log('\n🖼️  Imagenes del panel (logo, galeria, noticias, jugadores, productos)');
  console.log(`   Modo: ${modoImagenes()}`);

  const revision = await revisarImagenes();
  console.log(`${revision.listo ? '✅' : '⚠️ '} ${revision.mensaje}`);

  if (!revision.listo) return;

  if (!firmaValida('image/png', PNG_1X1)) {
    console.error('❌ La validacion de firma rechaza el PNG de prueba.');
    process.exitCode = 1;
    return;
  }

  const clave = claveDeImagen('prueba.png', 'png');

  try {
    const url = await guardarImagen(clave, PNG_1X1, 'image/png');
    console.log(`✅ Imagen de prueba subida: ${url}`);

    // Esta es la comprobacion que de verdad importa: si el bucket no tiene la URL
    // publica conectada (o el comodin del dominio manda ese subdominio a Vercel),
    // la subida funciona pero el visitante ve la imagen rota.
    const lectura = await fetch(url);

    if (lectura.ok) {
      console.log(
        `✅ La URL publica responde HTTP ${lectura.status} (${lectura.headers.get('content-type')})`,
      );
    } else {
      console.warn(
        `⚠️  La URL publica responde HTTP ${lectura.status}. Revisa que R2_URL_IMAGENES apunte a **este** bucket: el dominio propio se conecta en Settings -> Public access -> Custom Domains, y el subdominio r2.dev se habilita en Public access -> R2.dev subdomain.`,
      );
      process.exitCode = 1;
    }

    // Se limpia la prueba. Cloudflare cachea estas imagenes un anio
    // (`immutable`), asi que la copia en el CDN puede seguir viva un rato.
    await borrarImagen(clave);
    console.log('✅ Imagen de prueba borrada');
  } catch (error) {
    console.error('❌ Fallo la prueba del bucket de imagenes:', error);
    process.exitCode = 1;
  }
}

main();
