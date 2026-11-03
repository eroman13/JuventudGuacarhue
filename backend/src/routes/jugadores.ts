import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req, res) => {
  res.json({ message: 'Obtener jugadores', data: [] });
});

router.post('/', authMiddleware, requireRole('EDITOR', 'ADMIN', 'SUPERADMIN'), async (req, res) => {
  res.status(201).json({ message: 'Jugador creado' });
});

router.get('/:id', async (req, res) => {
  res.json({ message: 'Obtener jugador', id: req.params.id });
});

router.put('/:id', authMiddleware, requireRole('EDITOR', 'ADMIN', 'SUPERADMIN'), async (req, res) => {
  res.json({ message: 'Jugador actualizado', id: req.params.id });
});

router.delete('/:id', authMiddleware, requireRole('ADMIN', 'SUPERADMIN'), async (req, res) => {
  res.json({ message: 'Jugador eliminado', id: req.params.id });
});

export default router;
