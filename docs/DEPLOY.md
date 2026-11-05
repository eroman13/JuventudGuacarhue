# Despliegue: Backend en Railway + Frontend en Vercel

Arquitectura final:

```
Vercel (sitio estático React/Vite)  ──fetch /api──▶  Railway (Express + Prisma + PostgreSQL)
        https://<proyecto>.vercel.app                 https://<servicio>.up.railway.app
```

El frontend **no** habla con un backend en el mismo dominio: todas las llamadas
se resuelven contra `VITE_API_URL`, por eso esa variable es obligatoria en Vercel.

---

## 1. Backend en Railway (ya desplegado)

1. En el servicio → **Settings → Networking → Generate Domain** y copia la URL
   pública, por ejemplo `https://juventud-guacarhue-production.up.railway.app`.
2. Verifica que responda:
   - `https://<servicio>.up.railway.app/health` → `{"status":"OK"}`
   - `https://<servicio>.up.railway.app/api/health` → `{"status":"OK"}`
3. Variables de entorno del servicio (Railway → **Variables**):

   | Variable | Valor |
   | --- | --- |
   | `DATABASE_URL` | Referencia al plugin PostgreSQL (`${{Postgres.DATABASE_URL}}`) |
   | `JWT_SECRET` | Cadena larga y aleatoria (no la de ejemplo) |
   | `NODE_ENV` | `production` |
   | `CORS_ORIGIN` | `https://<proyecto>.vercel.app,http://localhost:5173` |
   | `DEFAULT_ADMIN_EMAIL` | Correo del administrador real |
   | `DEFAULT_ADMIN_PASSWORD` | Contraseña fuerte (cámbiala, el default es público) |
   | `DEFAULT_ADMIN_NOMBRE` | Nombre del admin |
   | `DEFAULT_ADMIN_APELLIDO` | Apellido del admin |

   `CORS_ORIGIN` acepta **varios orígenes separados por coma** (sin espacios al
   final). Si falta el dominio de Vercel, el navegador bloqueará login, subida de
   imágenes y cualquier llamada a la API. Para los *Preview Deployments* de
   Vercel (dominios `*.vercel.app` aleatorios) puedes agregar cada dominio o usar
   `CORS_ORIGIN=*` mientras pruebas; para producción deja solo los dominios reales.
4. No definas `PORT`: Railway lo inyecta y el `Dockerfile` ya ejecuta
   `prisma migrate deploy && npm start` (`railway.json` usa `backend/Dockerfile`).
5. Cada `push` a `main` vuelve a desplegar el backend automáticamente.

### Limitación conocida de los uploads

Las imágenes subidas se guardan en el filesystem del contenedor
(`backend/public/uploads`) y se sirven en `/uploads/...`. En Railway el
filesystem es **efímero**: cada redeploy borra las imágenes. Para producción
estable conviene moverlas a S3 / Cloudflare R2 / Cloudinary (el `.env.example`
ya lista las variables de AWS).

---

## 2. Frontend en Vercel

1. Entra a <https://vercel.com/new> e importa el repositorio
   `eroman13/JuventudGuacarhue`.
2. En la pantalla de configuración del proyecto:

   | Ajuste | Valor |
   | --- | --- |
   | Framework Preset | `Vite` |
   | **Root Directory** | `frontend` |
   | Build Command | `npm run build` (lo toma de `frontend/vercel.json`) |
   | Output Directory | `dist` |
   | Install Command | `npm install` |

3. En **Environment Variables** (Production, Preview y Development) agrega:

   ```
   VITE_API_URL = https://<servicio>.up.railway.app/api
   ```

   Debe terminar en `/api` y **sin** barra final. Si la defines sin `/api`, el
   código la normaliza agregándolo automáticamente.

4. **Deploy**.
5. Copia el dominio asignado por Vercel (`https://<proyecto>.vercel.app`) y
   agrégalo a `CORS_ORIGIN` en Railway. Railway redeployará solo.
6. Si después cambias `VITE_API_URL`, recuerda **Redeploy** en Vercel: las
   variables `VITE_*` se incrustan en el bundle durante el build.

### Qué incluye `frontend/vercel.json`

- `framework: vite` y `outputDirectory: dist`.
- `rewrites`: todas las rutas se sirven con `index.html`, necesario para que
  React Router (`/noticias`, `/admin`, etc.) funcione al recargar o entrar
  directamente por URL.

---

---

## 3.1 Diagnóstico rápido si aparece "Sesión de demostración"

Ese aviso solo aparece cuando el `fetch` falla **a nivel de red** (no es un 401):
el build quedó apuntando al dominio equivocado, CORS bloquea, o el backend está
caído. Ahora el panel muestra la línea `API configurada: …` bajo el aviso: eso es
exactamente la URL incrustada en el bundle.

| Lo que ves en DevTools → Network | Causa | Solución |
| --- | --- | --- |
| La petición va a `https://<proyecto>.vercel.app/api/auth/login` (mismo dominio) | `VITE_API_URL` no existía cuando se construyó el bundle | Definirla en Vercel y **Redeploy** (no basta con guardarla) |
| La petición va a `https://<servicio>.up.railway.app/api/auth/login` y falla con error de CORS | `CORS_ORIGIN` en Railway no incluye el dominio de Vercel, o el backend aún corre la versión anterior sin el CORS multi-origen | Actualizar `CORS_ORIGIN` y verificar que el deploy de Railway tenga el commit con el cambio |
| `net::ERR_CONNECTION_REFUSED`, `502` o timeout | El servicio de Railway está caído o redesplegando | Revisar **Deploy Logs** en Railway (`/api/health` debe responder `OK`) |
| La petición responde `200` con HTML | El rewrite SPA estaba capturando `/api/*` (versión antigua de `vercel.json`) | Usar el `vercel.json` actual, que excluye `/api/` |

Comprobación manual del backend desde la terminal:

```bash
# 1) ¿Está vivo?
curl -i https://<servicio>.up.railway.app/api/health

# 2) ¿Permite el origen de Vercel? (debe devolver Access-Control-Allow-Origin)
curl -i -X OPTIONS https://<servicio>.up.railway.app/api/auth/login \
  -H "Origin: https://<proyecto>.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type"
```

Si el paso 2 **no** devuelve `access-control-allow-origin: https://<proyecto>.vercel.app`,
el problema está en `CORS_ORIGIN` de Railway (variables + redeploy).

---

## 3.2 Verificación posterior al deploy
- [ ] `https://<proyecto>.vercel.app/` carga la portada.
- [ ] Recargar con F5 en `/noticias`, `/galeria` y `/admin` no da 404.
- [ ] Login en `/login` con el administrador real (no la cuenta demo) entra al panel.
- [ ] Subir una imagen en el panel devuelve una URL `https://<servicio>.up.railway.app/uploads/...` y se visualiza.
- [ ] DevTools → Network: las peticiones van a `...up.railway.app/api/...` y la respuesta incluye `Access-Control-Allow-Origin`.
- [ ] `/api/health` responde `OK`.

---

## 3.3 Contenido editable y logo del club

Todo el contenido del sitio (noticias, fotos, jugadores, partidos, tienda y la
configuración) se guarda en el backend, en la tabla `ContenidoSitio`, mediante
`GET/PUT /api/contenido`. El frontend lo descarga al abrir cualquier página y
envía los cambios automáticamente al guardar en el panel.

### Cambiar el logo y el "Desde"

1. Entra a `https://<proyecto>.vercel.app/admin`.
2. Abre la pestaña **Configuración**.
3. En **Identidad del club** cambia:
   - **Nombre del club** (encabezado y pie del sitio).
   - **Año de fundación** → se muestra como *"Desde 1990"*. Vacío = se oculta.
   - **Logo o escudo**: pega una URL o usa **Subir imagen** (se sube a
     `/uploads/` del backend). Vacío = se usa el escudo actual del club.
4. Pulsa **Guardar Cambios**.

El indicador de la esquina superior derecha del panel dice en qué estado está el
guardado:

| Indicador | Significado |
| --- | --- |
| `Contenido en el servidor` | Todo guardado: lo ven todos los visitantes |
| `Guardando...` | Enviando los cambios al backend |
| `Solo este navegador` | No hay sesión real (modo demo) o la sesión expiró: **los cambios no se publican** |
| `Sin conexión al servidor` | El backend no responde (revisar `/api/health`) |

> Si el panel muestra `Solo este navegador`, cierra sesión y vuelve a entrar con
> la cuenta real (`DEFAULT_ADMIN_EMAIL`). La cuenta de demostración nunca guarda
> en el servidor.

### Publicar el contenido que ya tenías cargado

Si ya habías editado noticias, fotos, etc. antes de este cambio, ese contenido
estaba solo en tu navegador. Para publicarlo:

1. Abre el panel en **el mismo navegador** donde lo editaste.
2. Ve a **Configuración** y pulsa **Guardar Cambios** (o edita cualquier cosa).
3. El indicador debe pasar a `Contenido en el servidor`.

---

## 4. Problemas comunes

| Síntoma | Causa probable | Solución |
| --- | --- | --- |
| "El servidor no responde…" y entra en modo demo | `VITE_API_URL` vacía/incorrecta o backend caído | Probar `/api/health`, corregir la variable y redeployar en Vercel |
| 401 al hacer login | Estás usando las credenciales demo (`admin@example.com` / `ChangeMe123!`) que no existen en Railway | Usar `DEFAULT_ADMIN_*` configurado en Railway |
| Error CORS en consola | `CORS_ORIGIN` en Railway no incluye el dominio de Vercel | Agregarlo (separado por coma) y redeployar |
| 404 al recargar `/admin` o `/noticias` | Falta el rewrite SPA o `Root Directory` no es `frontend` | Revisar `frontend/vercel.json` y la configuración del proyecto |
| Imágenes `/uploads/...` dan 404 | El contenedor se redeployó y borró los archivos, o la URL no apunta al backend | Volver a subirlas y/o migrar a S3/R2 |
| Cambio algo en el panel y otro dispositivo no lo ve | El panel muestra `Solo este navegador` (modo demo / sesión expirada) o no se pulsó Guardar | Volver a iniciar sesión con la cuenta real y guardar; comprobar `GET /api/contenido` |
| Build de Vercel falla con `tsc` | Errores de TypeScript | Ejecutar `cd frontend && npm run build` localmente antes de pushear |

---

## 5. Despliegue por CLI (opcional)

```bash
# Backend: Railway detecta el push a main
git push origin main

# Frontend desde la carpeta frontend/
cd frontend
npx vercel --prod        # primera vez pide vincular el proyecto
```
