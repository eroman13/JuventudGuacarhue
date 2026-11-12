import assert from 'node:assert/strict';
import test from 'node:test';
import {
  fusionarGaleria,
  fusionarNoticias,
  fusionarProductos,
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
    {
      titulo: 'gran victoria en el CLASICO',
      motivo: 'ya existe una noticia con ese titulo (agrega "id" para actualizarla)',
    },
  ]);
});

test('fusionarNoticias actualiza en su sitio cuando la entrada trae id', () => {
  const resultado = fusionarNoticias(documento(), [
    {
      archivo: 'nueva-portada.jpg',
      urlImagen: 'https://sitio/nueva-portada.jpg',
      entrada: { id: 7, titulo: 'Gran victoria en el clasico', imagen: 'nueva-portada.jpg', fecha: '2026-10-23' },
    },
  ]);

  assert.equal(resultado.actualizadas.length, 1);
  assert.equal(resultado.agregadas.length, 0);
  assert.equal(resultado.noticias.length, 1, 'no debe crear una copia');
  assert.equal(resultado.noticias[0].id, 7);
  assert.equal(resultado.noticias[0].imagen, 'https://sitio/nueva-portada.jpg');
  assert.equal(resultado.noticias[0].extracto, 'Resumen viejo');
  assert.equal(resultado.noticias[0].categoria, 'Resultados');
});

test('al actualizar se conserva lo que el manifiesto no menciona', () => {
  const base = documento();
  base.noticias[0].destacada = true;
  base.noticias[0].contenido = '<p>Cuerpo que ya estaba.</p>';

  const resultado = fusionarNoticias(base, [
    {
      archivo: 'portada.jpg',
      urlImagen: 'https://sitio/portada.jpg',
      entrada: { id: 7, titulo: 'Gran victoria en el clasico', imagen: 'portada.jpg', fecha: '2026-10-23' },
    },
  ]);

  assert.equal(resultado.noticias[0].destacada, true);
  assert.equal(resultado.noticias[0].contenido, '<p>Cuerpo que ya estaba.</p>');
});

test('fusionarGaleria reemplaza la foto indicada por id', () => {
  const resultado = fusionarGaleria(documento(), [
    {
      archivo: 'nueva.jpg',
      urlImagen: 'https://sitio/nueva.jpg',
      entrada: { id: 3, archivo: 'nueva.jpg', fecha: '2026-11-12' },
    },
  ]);

  assert.equal(resultado.actualizadas.length, 1);
  assert.equal(resultado.galeria.length, 1);
  assert.equal(resultado.galeria[0].id, 3);
  assert.equal(resultado.galeria[0].url, 'https://sitio/nueva.jpg');
  assert.equal(resultado.galeria[0].categoria, 'Partidos', 'conserva la categoria anterior');
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

test('fusionarProductos actualiza la foto por id y crea los nuevos', () => {
  const base: DocumentoContenido = {
    noticias: [],
    galeria: [],
    productos: [
      {
        id: 3,
        nombre: 'Pantalon Oficial',
        precio: 25000,
        categoria: 'Indumentaria',
        stock: 4,
        url: 'https://sitio/viejo.jpg',
      },
    ],
  };

  const resultado = fusionarProductos(base, [
    {
      archivo: 'producto-3.jpg',
      urlImagen: 'https://sitio/producto-3.jpg',
      entrada: { id: 3, nombre: 'Pantalon Oficial', imagen: 'producto-3.jpg' },
    },
    {
      archivo: 'nuevo.jpg',
      urlImagen: 'https://sitio/nuevo.jpg',
      entrada: { nombre: 'Polera de entrenamiento', imagen: 'nuevo.jpg', precio: 18000 },
    },
  ]);

  assert.equal(resultado.actualizadas.length, 1);
  assert.equal(resultado.agregadas.length, 1);
  assert.equal(resultado.productos[0].id, 4, 'el nuevo va primero');
  assert.equal(resultado.productos[1].url, 'https://sitio/producto-3.jpg');
  assert.equal(resultado.productos[1].precio, 25000, 'conserva el precio si no se indica');
  assert.equal(resultado.productos[1].stock, 4);
  assert.equal(resultado.agregadas[0].categoria, 'Tienda');
});

