import assert from 'node:assert/strict';
import test from 'node:test';
import {
  categoriaDeMensaje,
  contenidoDeMensaje,
  extractoDeMensaje,
  fechaDePublicacion,
  fotosDePublicacion,
  mapearPublicacion,
  nombreDeArchivo,
  separarMensaje,
  tituloDeMensaje,
} from '../src/lib/facebook.js';

test('tituloDeMensaje usa la primera linea sin hashtags, enlaces ni emojis', () => {
  const mensaje = [
    '⚽ ¡Gran victoria en el clásico! #JuventudGuacarhue',
    'https://www.facebook.com/Guacarhue/posts/123',
    '',
    'Ganamos 3 a 1 con goles de prueba.',
  ].join('\n');

  assert.equal(tituloDeMensaje(mensaje), '¡Gran victoria en el clásico!');
});

test('tituloDeMensaje salta las lineas que se quedan vacias al limpiarlas', () => {
  assert.equal(tituloDeMensaje('🔥🔥🔥\nhttps://bit.ly/x\n\nBingo del club'), 'Bingo del club');
  assert.equal(tituloDeMensaje(''), '');
  assert.equal(tituloDeMensaje(undefined), '');
});

test('tituloDeMensaje recorta los titulares largos sin cortar palabras', () => {
  const titulo = tituloDeMensaje('palabra '.repeat(30));

  assert.ok(titulo.length <= 90, `quedo en ${titulo.length} caracteres`);
  assert.ok(!titulo.endsWith(' '));
  assert.ok(!titulo.endsWith('palab'), titulo);
});

test('separarMensaje ignora las lineas vacias del principio', () => {
  assert.deepEqual(separarMensaje('\n\n  Titular  \n\nCuerpo de la noticia.'), {
    titulo: 'Titular',
    cuerpo: 'Cuerpo de la noticia.',
  });
  assert.deepEqual(separarMensaje('   '), { titulo: '', cuerpo: '' });
});

test('extractoDeMensaje toma el primer parrafo del cuerpo, no el titular', () => {
  const mensaje = 'Titular\n\nEste es el primer parrafo\ny sigue en la misma linea.\n\nSegundo parrafo.';

  assert.equal(extractoDeMensaje(mensaje), 'Este es el primer parrafo y sigue en la misma linea.');
  assert.equal(extractoDeMensaje('Solo titular'), '');
});

test('contenidoDeMensaje arma parrafos y escapa el HTML que venga de Facebook', () => {
  const html = contenidoDeMensaje('Titular\n\nGanamos <3 a 1 & festejamos\n\nSegundo "parrafo"');

  assert.equal(
    html,
    '<p>Ganamos &lt;3 a 1 &amp; festejamos</p><p>Segundo &quot;parrafo&quot;</p>',
  );
  assert.equal(contenidoDeMensaje('Solo titular'), '');
});

test('categoriaDeMensaje adivina la categoria por palabra clave', () => {
  assert.equal(categoriaDeMensaje('Bienvenido al club el nuevo refuerzo'), 'Fichajes');
  assert.equal(categoriaDeMensaje('Victoria 3 a 1 frente a Deportivo Sur'), 'Resultados');
  assert.equal(categoriaDeMensaje('Se lesionó el capitán en el entrenamiento'), 'Lesiones');
  assert.equal(categoriaDeMensaje('Programación del fin de semana'), 'Fixtures');
  assert.equal(categoriaDeMensaje('Arreglos en la cancha de entrenamiento'), 'Instalaciones');
  assert.equal(categoriaDeMensaje('Reunión de socios el jueves'), 'Institucional');
  assert.equal(categoriaDeMensaje(undefined), 'Institucional');
});

test('fechaDePublicacion usa la hora de Chile, no la de UTC', () => {
  // 02:30 UTC del 11 son las 23:30 del 10 en Chile: la noticia es del dia 10.
  assert.equal(fechaDePublicacion('2026-11-11T02:30:00+0000'), '2026-11-10');
  assert.equal(fechaDePublicacion('2026-07-01T12:00:00+0000'), '2026-07-01');
  assert.equal(fechaDePublicacion('no-es-una-fecha'), '');
  assert.equal(fechaDePublicacion(undefined), '');
});

test('fotosDePublicacion junta portada y adjuntos sin repetir', () => {
  const portada = 'https://scontent.xx.fbcdn.net/portada.jpg';
  const segunda = 'https://scontent.xx.fbcdn.net/segunda.jpg';

  assert.deepEqual(
    fotosDePublicacion({
      full_picture: portada,
      attachments: {
        data: [
          {
            media: { image: { src: portada } },
            subattachments: { data: [{ media: { image: { src: segunda } } }] },
          },
        ],
      },
    }),
    [portada, segunda],
  );

  assert.deepEqual(fotosDePublicacion({}), []);
});

test('nombreDeArchivo es estable y conserva la extension', () => {
  assert.equal(
    nombreDeArchivo('123456789_987654321', 2, 'https://scontent.xx.fbcdn.net/a.jpg?stp=1'),
    'fb-123456789-987654321-2.jpg',
  );
  assert.equal(nombreDeArchivo(undefined, 1, 'https://x.cl/foto.png'), 'fb-publicacion-1.png');
});

test('mapearPublicacion arma la noticia y manda las fotos extra a la galeria', () => {
  const resultado = mapearPublicacion(
    {
      id: '123_456',
      created_time: '2026-11-10T23:00:00+0000',
      message: 'Gran victoria en el clasico\n\nGanamos 3 a 1.\n\nVamos equipo.',
    },
    { archivos: ['fb-123-1.jpg', 'fb-123-2.jpg'], id: 7, categoriaGaleria: 'Eventos' },
  );

  assert.deepEqual(resultado.noticia, {
    id: 7,
    titulo: 'Gran victoria en el clasico',
    imagen: 'fb-123-1.jpg',
    fecha: '2026-11-10',
    categoria: 'Resultados',
    extracto: 'Ganamos 3 a 1.',
    contenido: '<p>Ganamos 3 a 1.</p><p>Vamos equipo.</p>',
  });

  assert.deepEqual(resultado.galeria, [
    { archivo: 'fb-123-2.jpg', fecha: '2026-11-10', categoria: 'Eventos' },
  ]);
  assert.equal(resultado.motivo, undefined);
});

test('mapearPublicacion manda a la galeria las publicaciones sin texto', () => {
  const resultado = mapearPublicacion(
    { created_time: '2026-11-09T15:00:00+0000', message: '   ' },
    { archivos: ['fb-1.jpg', 'fb-2.jpg'], categoriaGaleria: 'Partidos' },
  );

  assert.equal(resultado.noticia, undefined);
  assert.deepEqual(resultado.galeria, [
    { archivo: 'fb-1.jpg', fecha: '2026-11-09', categoria: 'Partidos' },
    { archivo: 'fb-2.jpg', fecha: '2026-11-09', categoria: 'Partidos' },
  ]);
});

test('mapearPublicacion omite lo que no se puede publicar y dice por que', () => {
  assert.equal(
    mapearPublicacion({ created_time: '2026-11-09T15:00:00+0000' }, { archivos: [] }).motivo,
    'sin fotos',
  );

  const sinFecha = mapearPublicacion({}, { archivos: ['fb-1.jpg'] });
  assert.match(String(sinFecha.motivo), /fecha invalida/);
  assert.deepEqual(sinFecha.galeria, []);
});

test('mapearPublicacion no escribe extracto ni contenido vacios y respeta la categoria', () => {
  const resultado = mapearPublicacion(
    { created_time: '2026-11-09T15:00:00+0000', message: 'Solo un titular' },
    { archivos: ['fb-1.jpg'], categoria: 'Institucional' },
  );

  assert.ok(resultado.noticia);
  assert.equal(resultado.noticia.extracto, undefined);
  assert.equal(resultado.noticia.contenido, undefined);
  assert.equal(resultado.noticia.categoria, 'Institucional');
  assert.equal(resultado.noticia.id, undefined);
  assert.deepEqual(resultado.galeria, []);
  assert.equal(resultado.noticia.imagen, 'fb-1.jpg');
});

