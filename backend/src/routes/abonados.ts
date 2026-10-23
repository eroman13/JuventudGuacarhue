import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, requireRole('ADMIN', 'SUPERADMIN'), async (_req, res) => {
  res.json({ message: 'Obtener abonados', data: [] });
});

router.post('/', async (_req, res) => {
  res.status(201).json({ message: 'Abonado registrado' });
});

router.get('/:id', authMiddleware, async (req, res) => {
  res.json({ message: 'Obtener abonado', id: req.params.id });
});

router.put('/:id', authMiddleware, requireRole('ADMIN', 'SUPERADMIN'), async (_req, res) => {
  res.json({ message: 'Abonado actualizado', id: req.params.id });
});

export default router;
