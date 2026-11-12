import assert from 'node:assert/strict';
import test from 'node:test';
import {
  fusionarGaleria,
  fusionarNoticias,
  normalizarTitulo,
  siguienteId,
  validarEntrada,
  esFechaValida,
  type DocumentoContenido,
} from '../src/lib/importar.js';

/**
 * Pruebas de la parte sin red del importador (`npm test`).
 * Lo que se sube y se guarda de verdad se prueba a mano con
 * `npm run importar` (simulacion) contra el sitio.
 */

const documento = (): DocumentoContenido => ({
  noticias: [
    {
      id: 7,
      fecha: '2026-10-23',
      imagen: 'https://sitio/vieja.jpg',
      titulo: 'Gran victoria en el clasico',
      extracto: 'Resumen viejo',
      categoria: 'Resultados',
    },
  ],
  galeria: [{ id: 3, url: 'https://sitio/foto-vieja.jpg', fecha: '2026-10-20', categoria: 'Partidos' }],
  config: { nombreClub: 'Juventud Guacarhue' },
});

test('normalizarTitulo ignora tildes, mayusculas y signos', () => {
  assert.equal(normalizarTitulo('¡Gran victoria en el Clásico!'), 'gran victoria en el clasico');
  assert.equal(normalizarTitulo('  GRAN   victoria '), 'gran victoria');
});

test('siguienteId parte de 1 y sigue al id mas alto', () => {
  assert.equal(siguienteId([]), 1);
  assert.equal(siguienteId([{ id: 1 }, { id: 4 }, { id: 2 }]), 5);
  assert.equal(siguienteId([{ id: 'no-es-numero' }, { id: 2 }]), 3);
});

test('esFechaValida rechaza formatos y dias inexistentes', () => {
  assert.equal(esFechaValida('2026-11-12'), true);
  assert.equal(esFechaValida('2024-02-29'), true);
  assert.equal(esFechaValida('2026-02-30'), false);
  assert.equal(esFechaValida('2026-13-01'), false);
  assert.equal(esFechaValida('12-11-2026'), false);
  assert.equal(esFechaValida(undefined), false);
});

test('validarEntrada lista lo que falta', () => {
  assert.deepEqual(validarEntrada({ titulo: 'Ok', imagen: 'a.jpg', fecha: '2026-11-12' }), []);

  const errores = validarEntrada({ titulo: '   ', imagen: '', fecha: 'ayer' });
  assert.equal(errores.length, 3);
});

test('fusionarNoticias agrega al principio, sigue los ids y no repite titulos', () => {
  const resultado = fusionarNoticias(documento(), [
    {
      archivo: 'nueva.jpg',
      urlImagen: 'https://sitio/nueva.jpg',
      entrada: { titulo: 'Nueva pretemporada', imagen: 'nueva.jpg', fecha: '2026-11-12' },
    },
    {
      archivo: 'repetida.jpg',
      urlImagen: 'https://sitio/repetida.jpg',
      entrada: { titulo: 'gran victoria en el CLASICO', imagen: 'repetida.jpg', fecha: '2026-11-01' },
    },
  ]);

  assert.equal(resultado.agregadas.length, 1);
  assert.equal(resultado.agregadas[0].id, 8);
  assert.equal(resultado.noticias[0].titulo, 'Nueva pretemporada');
  assert.equal(resultado.noticias[1].id, 7);

  assert.deepEqual(resultado.omitidas, [
    { titulo: 'gran victoria en el CLASICO', motivo: 'ya existe una noticia con ese titulo' },
  ]);
});

test('construirNoticia rellena categoria y extracto por defecto', () => {
  const resultado = fusionarNoticias(
    { noticias: [], galeria: [] },
    [
      {
        archivo: 'foto.jpg',
        urlImagen: 'https://sitio/foto.jpg',
        entrada: {
          titulo: 'Partido suspendido',
          imagen: 'foto.jpg',
          fecha: '2026-11-12',
          contenido: '<p>Se suspende por <b>lluvia</b>.</p>',
        },
      },
    ],
  );

  const noticia = resultado.agregadas[0];
  assert.equal(noticia.id, 1);
  assert.equal(noticia.categoria, 'Noticias');
  assert.equal(noticia.extracto, 'Se suspende por lluvia .');
  assert.equal(noticia.imagen, 'https://sitio/foto.jpg');
  assert.equal(noticia.destacada, undefined);
});

test('fusionarGaleria no repite fotos ni acepta fechas malas', () => {
  const resultado = fusionarGaleria(documento(), [
    {
      archivo: 'nueva.jpg',
      urlImagen: 'https://sitio/nueva.jpg',
      entrada: { archivo: 'nueva.jpg', fecha: '2026-11-12' },
    },
    {
      archivo: 'vieja.jpg',
      urlImagen: 'https://sitio/foto-vieja.jpg',
      entrada: { archivo: 'vieja.jpg', fecha: '2026-11-12' },
    },
    {
      archivo: 'mala.jpg',
      urlImagen: 'https://sitio/mala.jpg',
      entrada: { archivo: 'mala.jpg', fecha: '12-11-2026' },
    },
  ]);

  assert.equal(resultado.agregadas.length, 1);
  assert.equal(resultado.agregadas[0].id, 4);
  assert.equal(resultado.agregadas[0].categoria, 'Partidos');
  assert.equal(resultado.galeria[0].url, 'https://sitio/nueva.jpg');
  assert.equal(resultado.omitidas.length, 2);
});

test('fusionar no toca el documento original', () => {
  const original = documento();
  fusionarNoticias(original, [
    {
      archivo: 'a.jpg',
      urlImagen: 'https://sitio/a.jpg',
      entrada: { titulo: 'Otra', imagen: 'a.jpg', fecha: '2026-11-12' },
    },
  ]);

  assert.equal(original.noticias.length, 1);
});
