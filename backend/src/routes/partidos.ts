import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req, res) => {
  res.json({ message: 'Obtener partidos', data: [] });
});

router.post('/', authMiddleware, requireRole('EDITOR', 'ADMIN', 'SUPERADMIN'), async (req, res) => {
  res.status(201).json({ message: 'Partido creado' });
});

router.get('/:id', async (req, res) => {
  res.json({ message: 'Obtener partido', id: req.params.id });
});

router.put('/:id', authMiddleware, requireRole('EDITOR', 'ADMIN', 'SUPERADMIN'), async (req, res) => {
  res.json({ message: 'Partido actualizado', id: req.params.id });
});

router.delete('/:id', authMiddleware, requireRole('ADMIN', 'SUPERADMIN'), async (req, res) => {
  res.json({ message: 'Partido eliminado', id: req.params.id });
});

export default router;
