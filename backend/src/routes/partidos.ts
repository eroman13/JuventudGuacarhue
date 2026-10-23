import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', async (_req, res) => {
  res.json({ message: 'Obtener partidos', data: [] });
});

router.post('/', authMiddleware, requireRole('EDITOR', 'ADMIN', 'SUPERADMIN'), async (_req, res) => {
  res.status(201).json({ message: 'Partido creado' });
});

router.get('/:id', async (_req, res) => {
  res.json({ message: 'Obtener partido', id: _req.params.id });
});

router.put('/:id', authMiddleware, requireRole('EDITOR', 'ADMIN', 'SUPERADMIN'), async (_req, res) => {
  res.json({ message: 'Partido actualizado', id: _req.params.id });
});

router.delete('/:id', authMiddleware, requireRole('ADMIN', 'SUPERADMIN'), async (_req, res) => {
  res.json({ message: 'Partido eliminado', id: _req.params.id });
});

export default router;
