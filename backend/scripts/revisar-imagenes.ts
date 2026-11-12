/**
 * Revisa las imagenes del contenido publicado y avisa de las que estan rotas.
 *
 * Uso:
 *   npm run imagenes:revisar
 *
 * Sirve para lo mismo que se ve a ojo en el sitio (galeria, portadas, fotos de
 * jugadores, productos) pero sin abrir el navegador: recorre `GET /api/contenido`
 * y pide cada URL. Un 403 en `scontent-*.fbcdn.net` es una foto enlazada desde
 * Facebook: esos enlaces caducan y hay que volver a subirlas a nuestro
 * almacenamiento (ver importar/LEEME.md).
 */

const API_POR_DEFECTO = 'https://juventudguacarhue-production.up.railway.app/api';

const args = process.argv.slice(2);
const api = (
  args.find((arg) => arg.startsWith('--api='))?.slice('--api='.length) ||
  process.env.API_URL ||
  API_POR_DEFECTO
).replace(/\/$/, '');

interface Hallazgo {
  ruta: string;
  contexto: string;
  url: string;
}

function recorrer(valor: unknown, ruta: string, hallazgos: Hallazgo[]): void {
  if (typeof valor === 'string') {
    if (/^https?:\/\//i.test(valor)) {
      hallazgos.push({ ruta, contexto: '', url: valor });
      return;
    }

    // El campo `contenido` de las noticias guarda HTML: las imagenes que pega
    // el editor tambien se revisan.
    for (const encontrado of valor.matchAll(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/gi)) {
      hallazgos.push({ ruta: `${ruta} (HTML)`, contexto: '', url: encontrado[1] });
    }

    return;
  }

  if (Array.isArray(valor)) {
    valor.forEach((item, indice) => recorrer(item, `${ruta}[${indice}]`, hallazgos));
    return;
  }

  if (valor && typeof valor === 'object') {
    const registro = valor as Record<string, unknown>;
    const contexto = [registro.titulo, registro.nombre, registro.categoria]
      .find((campo) => typeof campo === 'string' && campo.trim() !== '') as string | undefined;
    const seccion = ruta.split(/[.[]/)[0];

    for (const [clave, contenido] of Object.entries(registro)) {
      const siguiente = ruta ? `${ruta}.${clave}` : clave;

      // En `videos`, `url` es el enlace a YouTube y `miniatura` la imagen: el
      // enlace no es una imagen, asi que no se revisa.
      if (clave === 'url' && seccion === 'videos') {
        continue;
      }

      if (typeof contenido === 'string' && /^https?:\/\//i.test(contenido)) {
        hallazgos.push({ ruta: siguiente, contexto: contexto ?? '', url: contenido });
      } else {
        recorrer(contenido, siguiente, hallazgos);
      }
    }
  }
}

async function estadoDe(url: string): Promise<string> {
  try {
    const respuesta = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    const tipo = respuesta.headers.get('content-type') ?? '';

    // Algunos servidores no aceptan HEAD: se reintenta con GET.
    if (respuesta.status === 405 || respuesta.status === 501) {
      const alternativa = await fetch(url, { method: 'GET' });
      return `${alternativa.status} ${alternativa.headers.get('content-type') ?? ''}`.trim();
    }

    return `${respuesta.status} ${tipo}`.trim();
  } catch (error) {
    return `ERROR ${(error as Error).message}`;
  }
}

async function main(): Promise<void> {
  console.log(`\n🔍 Imagenes del contenido (${api})\n`);

  const respuesta = await fetch(`${api}/contenido`);
  if (!respuesta.ok) {
    throw new Error(`GET /contenido respondio HTTP ${respuesta.status}.`);
  }

  const { datos } = (await respuesta.json()) as { datos: unknown };

  if (!datos) {
    throw new Error('El sitio todavia no tiene contenido guardado.');
  }

  const hallazgos: Hallazgo[] = [];
  recorrer(datos, '', hallazgos);

  // Se pregunta una sola vez por URL (varias noticias comparten la misma foto),
  // pero se informa de cada campo que la usa: hay que corregirlos todos.
  const estados = new Map<string, string>();
  const rotas: Hallazgo[] = [];

  for (const hallazgo of hallazgos) {
    if (!estados.has(hallazgo.url)) {
      estados.set(hallazgo.url, await estadoDe(hallazgo.url));
    }

    const estado = estados.get(hallazgo.url) as string;
    const bien = estado.startsWith('200') && estado.includes('image/');
    const contexto = hallazgo.contexto ? ` (${hallazgo.contexto})` : '';
    const corta = hallazgo.url.length > 80 ? `${hallazgo.url.slice(0, 80)}…` : hallazgo.url;

    if (bien) {
      console.log(`   ✅ ${estado.padEnd(18)} ${hallazgo.ruta}${contexto}`);
    } else {
      console.log(`   ❌ ${estado.padEnd(18)} ${hallazgo.ruta}${contexto}`);
      console.log(`      ${corta}`);
      rotas.push(hallazgo);
    }
  }

  console.log(`\n${rotas.length === 0 ? '✅ Todas las imagenes cargan' : `❌ ${rotas.length} imagenes rotas`}`);

  if (rotas.length > 0) {
    const facebook = rotas.filter((h) => h.url.includes('fbcdn.net')).length;
    if (facebook > 0) {
      console.log(
        `   ${facebook} son enlaces de Facebook: caducan. Sube esas fotos al sitio (ver importar/LEEME.md).`,
      );
    }
    console.log('   Se arreglan desde el panel: admin → Galeria / Noticias / Productos.\n');
    process.exitCode = 1;
    return;
  }

  console.log('');
}

main().catch((error: unknown) => {
  console.error(`\n❌ ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
