import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, requireRole('ADMIN', 'SUPERADMIN'), async (_req, res) => {
  res.json({ message: 'Obtener pedidos', data: [] });
});

router.post('/', async (_req, res) => {
  res.status(201).json({ message: 'Pedido creado' });
});

router.get('/:id', authMiddleware, async (req, res) => {
  res.json({ message: 'Obtener pedido', id: req.params.id });
});

router.put('/:id', authMiddleware, requireRole('ADMIN', 'SUPERADMIN'), async (_req, res) => {
  res.json({ message: 'Pedido actualizado', id: req.params.id });
});

export default router;
