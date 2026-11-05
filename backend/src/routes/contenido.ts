import { Router } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

/** Identificador del unico documento de contenido del sitio. */
const CONTENIDO_ID = 'principal';

/** Secciones que siempre deben venir en el documento. */
const SECCIONES_OBLIGATORIAS = [
  'noticias',
  'partidos',
  'planteles',
  'galeria',
  'productos',
  'videos',
  'pedidos',
  'abonados',
] as const;

function esContenidoValido(valor: unknown): valor is Record<string, unknown> {
  if (typeof valor !== 'object' || valor === null || Array.isArray(valor)) {
    return false;
  }

  const documento = valor as Record<string, unknown>;

  const seccionesCompletas = SECCIONES_OBLIGATORIAS.every((clave) => Array.isArray(documento[clave]));
  const configValida =
    typeof documento.config === 'object' && documento.config !== null && !Array.isArray(documento.config);

  return seccionesCompletas && configValida;
}

// GET /api/contenido - Contenido publicado del sitio (publico)
router.get('/', async (_req, res) => {
  const registro = await prisma.contenidoSitio.findUnique({ where: { id: CONTENIDO_ID } });

  // El contenido cambia con frecuencia: evitar cache en navegador y CDN.
  res.set('Cache-Control', 'no-store');

  res.json({
    message: 'Contenido del sitio',
    datos: registro?.datos ?? null,
    actualizadoEn: registro?.updatedAt ?? null,
  });
});

// PUT /api/contenido - Reemplaza el documento completo (requiere EDITOR o superior)
router.put(
  '/',
  authMiddleware,
  requireRole('EDITOR', 'MODERADOR', 'ADMIN', 'SUPERADMIN'),
  async (req, res) => {
    const cuerpo = req.body as { datos?: unknown } | undefined;
    const datos = cuerpo?.datos;

    if (!esContenidoValido(datos)) {
      return res.status(400).json({
        error: {
          status: 400,
          message:
            'El contenido no tiene el formato esperado. Debe incluir las secciones noticias, partidos, planteles, galeria, productos, videos, pedidos, abonados y config.',
        },
      });
    }

    const registro = await prisma.contenidoSitio.upsert({
      where: { id: CONTENIDO_ID },
      create: { id: CONTENIDO_ID, datos: datos as Prisma.InputJsonValue },
      update: { datos: datos as Prisma.InputJsonValue },
    });

    return res.json({
      message: 'Contenido guardado',
      actualizadoEn: registro.updatedAt,
    });
  },
);

export default router;
