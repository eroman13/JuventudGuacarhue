import { NextFunction, Request, Response, Router } from 'express';
import multer from 'multer';
import {
  claveDeImagen,
  extensionDe,
  firmaValida,
  guardarImagen,
  nombreDeClave,
} from '../lib/imagenes.js';

const router = Router();

/**
 * La imagen se mantiene en memoria (tope de 5 MB, un archivo por peticion) y
 * `lib/imagenes.ts` decide donde queda: bucket publico de Cloudflare R2 en
 * produccion, o `uploads/` (UPLOAD_DIR / volumen) cuando R2 no esta configurado.
 *
 * Antes se escribia siempre en el disco del contenedor y eso se perdia en cada
 * redeploy de Railway (ver docs/DEPLOY.md).
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
});

router.post('/', upload.single('image'), async (req: Request, res: Response) => {
  const archivo = req.file;

  if (!archivo) {
    res.status(400).json({ error: 'No se recibió ninguna imagen.' });
    return;
  }

  const extension = extensionDe(archivo.mimetype);

  if (!extension) {
    res.status(400).json({
      error:
        'Formato no permitido: usa PNG, JPG, WebP, GIF o AVIF. Los SVG no se aceptan porque pueden ejecutar scripts.',
    });
    return;
  }

  if (!firmaValida(archivo.mimetype, archivo.buffer)) {
    res.status(400).json({ error: 'El archivo no parece una imagen válida.' });
    return;
  }

  const clave = claveDeImagen(archivo.originalname, extension);

  try {
    // Devuelve la URL definitiva: `https://...` si esta en R2, o `/uploads/...`
    // (relativa al backend) cuando se guarda en disco.
    const url = await guardarImagen(clave, archivo.buffer, archivo.mimetype);

    res.status(201).json({
      url,
      filename: nombreDeClave(clave),
      originalName: archivo.originalname,
    });
  } catch (error) {
    // Con R2 configurado no se cae al disco: la imagen se perderia en el
    // siguiente despliegue sin que nadie se entere.
    console.error('No se pudo guardar la imagen:', error);
    res.status(500).json({
      error:
        'No se pudo guardar la imagen en el almacenamiento del servidor. Revisa la configuración de R2 (npm run r2:probar).',
    });
  }
});

// Errores de multer (por ejemplo, archivo de mas de 5 MB) como 400 y no 500.
router.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    const mensaje =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'La imagen supera el límite de 5 MB.'
        : `No se pudo recibir la imagen (${err.code}).`;

    res.status(400).json({ error: mensaje });
    return;
  }

  next(err);
});

export default router;

