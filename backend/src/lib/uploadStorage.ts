import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Carpeta unica donde se escriben y desde donde se sirven las imagenes subidas
 * en el panel (logo, galeria, noticias, planteles, productos).
 *
 * Prioridad:
 *   1. `UPLOAD_DIR`: ruta explicita (recomendado en produccion).
 *   2. `RAILWAY_VOLUME_MOUNT_PATH`: Railway la inyecta al montar un volumen,
 *      por lo que las imagenes quedan en `<volumen>/uploads`.
 *   3. `backend/public/uploads`: desarrollo local.
 *
 * Importante: sin un volumen montado (o un bucket externo) el filesystem del
 * contenedor es efimero y cada redeploy borra las imagenes. Ver `docs/DEPLOY.md`.
 */
function resolverUploadDir(): string {
  const configurado = process.env.UPLOAD_DIR?.trim();

  if (configurado) {
    return path.isAbsolute(configurado) ? configurado : path.resolve(process.cwd(), configurado);
  }

  const volumen = process.env.RAILWAY_VOLUME_MOUNT_PATH?.trim();

  if (volumen) {
    return path.join(path.resolve(volumen), 'uploads');
  }

  return path.resolve(__dirname, '../../public/uploads');
}

/** Ruta absoluta de la carpeta de uploads. */
export const UPLOAD_DIR = resolverUploadDir();

/** Crea la carpeta de uploads si no existe (idempotente). */
export function ensureUploadDir(): string {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  return UPLOAD_DIR;
}
