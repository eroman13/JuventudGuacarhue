import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Router } from 'express';
import multer from 'multer';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '../../public/uploads');

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDir);
  },
  filename: (_req, file, callback) => {
    const originalName = file.originalname || 'upload';
    const sanitizedBaseName = originalName
      .replace(/\.[^/.]+$/, '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, '-')
      .replace(/-+/g, '-') || 'upload';
    const extension = path.extname(originalName).toLowerCase();
    const timestamp = Date.now();
    callback(null, `${timestamp}-${sanitizedBaseName}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith('image/')) {
      callback(new Error('Solo se permiten archivos de imagen.'));
      return;
    }

    callback(null, true);
  },
});

router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No se recibió ninguna imagen.' });
    return;
  }

  const url = `/uploads/${req.file.filename}`;

  res.status(201).json({
    url,
    filename: req.file.filename,
    originalName: req.file.originalname,
  });
});

export default router;
