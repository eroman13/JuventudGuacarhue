import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import 'express-async-errors';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Importar rutas
import authRoutes from './routes/auth.js';
import noticiasRoutes from './routes/noticias.js';
import jugadoresRoutes from './routes/jugadores.js';
import partidosRoutes from './routes/partidos.js';
import galeriaRoutes from './routes/galeria.js';
import videosRoutes from './routes/videos.js';
import productosRoutes from './routes/productos.js';
import pedidosRoutes from './routes/pedidos.js';
import abonadosRoutes from './routes/abonados.js';

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas de salud
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'API is running', timestamp: new Date() });
});

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/noticias', noticiasRoutes);
app.use('/api/jugadores', jugadoresRoutes);
app.use('/api/partidos', partidosRoutes);
app.use('/api/galeria', galeriaRoutes);
app.use('/api/videos', videosRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/abonados', abonadosRoutes);

// Manejo de errores global
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  
  const status = err.status || 500;
  const message = err.message || 'Error interno del servidor';
  
  res.status(status).json({
    error: {
      status,
      message,
      timestamp: new Date(),
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: {
      status: 404,
      message: 'Ruta no encontrada',
      path: req.path,
    },
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor escuchando en puerto ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API disponible en http://localhost:${PORT}`);
});
