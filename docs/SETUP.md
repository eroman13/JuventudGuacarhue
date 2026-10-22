# Guía de Configuración - Juventud Guacarhue

## Requisitos Previos

- Node.js 18+ ([Descargar](https://nodejs.org/))
- npm (viene con Node.js)
- PostgreSQL 13+ ([Descargar](https://www.postgresql.org/))
- Git ([Descargar](https://git-scm.com/))

## Configuración del Ambiente

### 1. Clonar el Repositorio

```bash
cd /Users/eduardo/Desktop/Proyectos/JuventudGuacarhue
```

### 2. Configurar Backend

```bash
cd backend

# Copiar archivo de configuración
cp .env.example .env

# Instalar dependencias
npm install

# Crear la base de datos (debes tener PostgreSQL corriendo)
# Actualizar DATABASE_URL en .env con tus credenciales
npm run prisma:migrate

# Crear usuario administrador
npm run db:superadmin

# Iniciar servidor
npm run dev
```

El servidor estará disponible en: `http://localhost:3000`

### 3. Configurar Frontend

En otra terminal:

```bash
cd frontend

# Copiar archivo de configuración
cp .env.example .env

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en: `http://localhost:5173`

## Estructura del Proyecto

### Backend (`/backend`)
- **src/index.ts** - Punto de entrada principal
- **src/routes/** - Definición de rutas de la API
- **src/controllers/** - Lógica de negocio
- **src/middleware/** - Middleware (autenticación, etc)
- **src/types/** - Definiciones de tipos TypeScript
- **prisma/schema.prisma** - Esquema de base de datos

### Frontend (`/frontend`)
- **src/main.tsx** - Punto de entrada
- **src/App.tsx** - Componente raíz
- **src/pages/** - Páginas de la aplicación
- **src/components/** - Componentes reutilizables
- **src/hooks/** - Custom hooks
- **src/services/** - Llamadas a API

## Usuarios de Prueba

Se puede crear un usuario superadmin ejecutando:

```bash
cd backend
npm run db:superadmin
```

O iniciar sesión con:
- Email: `admin@example.com`
- Contraseña: `ChangeMe123!` (cambiar en .env)

## Scripts Útiles

### Backend
```bash
npm run dev              # Iniciar en desarrollo
npm run build            # Compilar a TypeScript
npm start                # Ejecutar versión compilada
npm run prisma:studio    # Abrir interfaz gráfica de Prisma
npm run prisma:migrate   # Ejecutar migrations
npm run lint             # Ejecutar linter
npm test                 # Ejecutar tests
```

### Frontend
```bash
npm run dev              # Iniciar en desarrollo
npm run build            # Build para producción
npm run preview          # Ver build localmente
npm run lint             # Ejecutar linter
```

## Roles de Usuario

- **SUPERADMIN** - Acceso completo del sistema
- **ADMIN** - Gestión de todos los contenidos
- **MODERADOR** - Aprobación de contenidos
- **EDITOR** - Creación y edición de contenidos
- **VIEWER** - Solo lectura

## API Endpoints Principales

### Autenticación
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `GET /api/auth/me` - Obtener usuario actual

### Noticias
- `GET /api/noticias` - Listar
- `POST /api/noticias` - Crear
- `PUT /api/noticias/:id` - Actualizar
- `DELETE /api/noticias/:id` - Eliminar

### Jugadores
- `GET /api/jugadores` - Listar
- `POST /api/jugadores` - Crear
- `PUT /api/jugadores/:id` - Actualizar
- `DELETE /api/jugadores/:id` - Eliminar

### Partidos
- `GET /api/partidos` - Listar
- `POST /api/partidos` - Crear
- `PUT /api/partidos/:id` - Actualizar
- `DELETE /api/partidos/:id` - Eliminar

### Galería
- `GET /api/galeria` - Listar fotos
- `POST /api/galeria` - Subir foto
- `DELETE /api/galeria/:id` - Eliminar foto

### Productos
- `GET /api/productos` - Listar
- `POST /api/productos` - Crear
- `PUT /api/productos/:id` - Actualizar
- `DELETE /api/productos/:id` - Eliminar

### Pedidos
- `GET /api/pedidos` - Listar (solo admin)
- `POST /api/pedidos` - Crear
- `PUT /api/pedidos/:id` - Actualizar (solo admin)

## Configuración de Base de Datos

Por defecto, el proyecto está configurado para PostgreSQL. Para cambiar la base de datos, modifica `DATABASE_URL` en `.env`:

### PostgreSQL (default)
```
DATABASE_URL="postgresql://user:password@localhost:5432/juventud_guacarhue"
```

### MySQL
```
DATABASE_URL="mysql://user:password@localhost:3306/juventud_guacarhue"
```

## Deployment

### Backend (Docker)

```bash
cd backend
docker build -t juventud-guacarhue-backend .
docker run -e DATABASE_URL=... -p 3000:3000 juventud-guacarhue-backend
```

### Frontend (Vercel)

```bash
cd frontend
npm run build
# Seguir instrucciones de Vercel
```

### Backend (Railway/Render)

1. Conectar repositorio a Railway/Render
2. Configurar variables de entorno
3. Deployment automático

## Troubleshooting

### Puerto 3000 ya está en uso
```bash
# macOS
lsof -i :3000
kill -9 <PID>

# Linux
fuser -k 3000/tcp
```

### Problemas con base de datos
```bash
cd backend
npx prisma db push --force-reset
npm run prisma:migrate
```

### Limpiar node_modules
```bash
rm -rf node_modules package-lock.json
npm install
```

## Contribución

Por favor, sigue estas convenciones:

1. **Commits**: `git commit -m "feat: descripción"` (feat:, fix:, docs:, etc)
2. **Ramas**: `feature/nombre`, `fix/nombre`
3. **Code Style**: TypeScript strict, ESLint
4. **Tests**: Incluir tests para nuevas features

## Contacto y Soporte

Para preguntas o problemas, contacta al equipo de desarrollo.

---

**Última actualización**: Octubre 2026
