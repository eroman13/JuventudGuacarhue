import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req, res) => {
  res.json({ message: 'Obtener fotos', data: [] });
});

router.post('/', authMiddleware, requireRole('EDITOR', 'ADMIN', 'SUPERADMIN'), async (req, res) => {
  res.status(201).json({ message: 'Foto subida' });
});

router.delete('/:id', authMiddleware, requireRole('EDITOR', 'ADMIN', 'SUPERADMIN'), async (req, res) => {
  res.json({ message: 'Foto eliminada', id: req.params.id });
});

export default router;
