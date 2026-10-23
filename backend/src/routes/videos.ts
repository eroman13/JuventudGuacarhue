import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', async (_req, res) => {
  res.json({ message: 'Obtener videos', data: [] });
});

router.post('/', authMiddleware, requireRole('EDITOR', 'ADMIN', 'SUPERADMIN'), async (_req, res) => {
  res.status(201).json({ message: 'Video agregado' });
});

router.delete('/:id', authMiddleware, requireRole('EDITOR', 'ADMIN', 'SUPERADMIN'), async (req, res) => {
  res.json({ message: 'Video eliminado', id: req.params.id });
});

export default router;
