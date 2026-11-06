import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import 'express-async-errors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { PrismaClient, UserRole } from '@prisma/client';

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
import uploadsRoutes from './routes/uploads.js';
import contenidoRoutes from './routes/contenido.js';
import { ensureUploadDir } from './lib/uploadStorage.js';
import { modoImagenes } from './lib/imagenes.js';

const app: Express = express();
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();

const DEFAULT_ADMIN = {
  email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com',
  password: process.env.DEFAULT_ADMIN_PASSWORD || 'ChangeMe123!',
  nombre: process.env.DEFAULT_ADMIN_NOMBRE || 'Admin',
  apellido: process.env.DEFAULT_ADMIN_APELLIDO || 'Juventud',
};

async function ensureDefaultAdmin(): Promise<void> {
  const existing = await prisma.user.findUnique({
    where: { email: DEFAULT_ADMIN.email },
    select: { id: true },
  });

  if (existing) {
    return;
  }

  const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, 10);

  await prisma.user.create({
    data: {
      email: DEFAULT_ADMIN.email,
      password: hashedPassword,
      nombre: DEFAULT_ADMIN.nombre,
      apellido: DEFAULT_ADMIN.apellido,
      rol: UserRole.ADMIN,
      estado: true,
    },
  });

  console.log(`✅ Usuario admin por defecto creado: ${DEFAULT_ADMIN.email}`);
}

// Middlewares
// CORS_ORIGIN acepta una lista separada por comas, por ejemplo:
// CORS_ORIGIN=https://juventud-guacarhue.vercel.app,http://localhost:5173
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

console.log(`🌐 CORS permitido para: ${corsOrigins.join(', ') || '(ninguno)'}`);

// Donde terminan las imagenes del panel: bucket de R2 o disco. Verlo en los
// Deploy Logs es lo que permite detectar que se desplego sin bucket ni volumen.
const uploadDir = ensureUploadDir();

console.log(
  `🖼️  Imagenes del panel: ${
    modoImagenes() === 'r2' ? 'Cloudflare R2 (bucket publico)' : `disco local (${uploadDir})`
  }`,
);

app.use(cors({
  origin: (origin, callback) => {
    // Sin cabecera Origin (curl, health checks, mismo origen) se permite.
    if (!origin || corsOrigins.includes('*') || corsOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    console.warn(`⚠️ Origen bloqueado por CORS: ${origin}`);
    callback(null, false);
  },
  credentials: true,
}));

app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: true }));

// Imagenes subidas desde el panel. La carpeta se resuelve en uploadStorage
// (UPLOAD_DIR / volumen de Railway / public/uploads) para que escritura y
// lectura apunten siempre al mismo lugar.
app.use('/uploads', express.static(uploadDir));

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
app.use('/api/uploads', uploadsRoutes);
app.use('/api/contenido', contenidoRoutes);

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
async function startServer(): Promise<void> {
  try {
    await ensureDefaultAdmin();

    app.listen(PORT, () => {
      console.log(`✅ Servidor escuchando en puerto ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`API disponible en http://localhost:${PORT}`);
      console.log(`🔐 Login admin: ${DEFAULT_ADMIN.email}`);
    });
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
}

startServer();
