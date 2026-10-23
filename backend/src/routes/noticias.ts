import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/noticias - Obtener todas las noticias (públicas)
router.get('/', async (_req, res) => {
  res.json({ message: 'Obtener noticias', data: [] });
});

// POST /api/noticias - Crear nueva noticia (requiere EDITOR o superior)
router.post('/', authMiddleware, requireRole('EDITOR', 'MODERADOR', 'ADMIN', 'SUPERADMIN'), async (_req, res) => {
  res.status(201).json({ message: 'Noticia creada' });
});

// GET /api/noticias/:id - Obtener una noticia específica
router.get('/:id', async (req, res) => {
  res.json({ message: 'Obtener noticia', id: req.params.id });
});

// PUT /api/noticias/:id - Actualizar noticia
router.put('/:id', authMiddleware, requireRole('EDITOR', 'MODERADOR', 'ADMIN', 'SUPERADMIN'), async (_req, res) => {
  res.json({ message: 'Noticia actualizada', id: req.params.id });
});

// DELETE /api/noticias/:id - Eliminar noticia
router.delete('/:id', authMiddleware, requireRole('MODERADOR', 'ADMIN', 'SUPERADMIN'), async (_req, res) => {
  res.json({ message: 'Noticia eliminada', id: req.params.id });
});

export default router;
