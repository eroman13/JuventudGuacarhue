# Juventud Guacarhue - Sitio Web Oficial

Plataforma web completa para el club deportivo Juventud Guacarhue con sistema de administración integrado para mantenedores.

## 📋 Características

- **Noticias y actualizaciones** - Sistema completo de gestión de noticias
- **Galería de fotos** - Almacenamiento y gestión de imágenes
- **Información de jugadores/equipo** - Perfiles de jugadores, equipo técnico
- **Calendario de partidos** - Calendario completo de competiciones
- **Resultados de partidos** - Seguimiento de resultados y estadísticas
- **Tienda online** - E-commerce integrado
- **Sistema de abonados** - Gestión de membresías y abonos
- **Videos/multimedia** - Galería de videos
- **Estadísticas** - Estadísticas de jugadores y equipo
- **Panel de administración** - Mantenedores para todas las secciones
- **Autenticación y autorización** - Sistema de roles y permisos

## 🛠️ Stack Tecnológico

### Frontend
- **Vite** - Build tool moderno y rápido
- **React 18** - Librería de UI
- **TypeScript** - Tipado estático
- **React Router** - Navegación de SPA
- **Tailwind CSS** - Estilos utilitarios
- **Context API** - State management
- **Axios** - Cliente HTTP

### Backend
- **Node.js** - Runtime de JavaScript
- **Express** - Framework web
- **TypeScript** - Tipado estático
- **Prisma** - ORM y migrations
- **PostgreSQL** - Base de datos
- **JWT** - Autenticación
- **Bcryptjs** - Hash de contraseñas
- **AWS S3/Cloudflare R2** - Almacenamiento de archivos
- **Docker** - Contenedorización

## 📦 Estructura del Proyecto

```
JuventudGuacarhue/
├── frontend/           # Aplicación React
│   ├── src/
│   │   ├── components/ # Componentes reutilizables
│   │   ├── pages/      # Páginas de la aplicación
│   │   ├── services/   # Llamadas a API
│   │   ├── context/    # Context API
│   │   ├── hooks/      # Custom hooks
│   │   └── utils/      # Utilidades
│   └── package.json
├── backend/            # API REST
│   ├── src/
│   │   ├── controllers/ # Controladores
│   │   ├── routes/      # Rutas
│   │   ├── middleware/  # Middlewares
│   │   ├── types/       # Tipos TypeScript
│   │   └── lib/         # Librerías compartidas
│   ├── prisma/          # Esquema y migrations
│   └── package.json
└── docs/              # Documentación

```

## 🚀 Inicio Rápido

### Requisitos
- Node.js 18+
- npm o yarn
- PostgreSQL 13+

### Backend

```bash
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 🔐 Autenticación

- **Superadmin** - Acceso completo al sistema
- **Admin** - Gestión de contenidos
- **Moderador** - Aprobación de contenidos
- **Editor** - Creación y edición de contenidos
- **Viewer** - Solo lectura

## 📚 API Endpoints

### Autenticación
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

### Contenido del sitio (panel de administración)
- `GET /api/contenido` - Contenido publicado (público, sin autenticación)
- `PUT /api/contenido` - Reemplaza el documento completo (requiere EDITOR o superior)

Todo lo editable del sitio (noticias, partidos, planteles, galería, productos,
videos, pedidos, abonados y la configuración del sitio) se guarda como **un
único documento JSON** en la tabla `ContenidoSitio`. Así, cualquier cambio hecho
desde el panel lo ven todos los visitantes, en cualquier dispositivo.

> Las rutas de sección que aparecen más abajo (`/api/noticias`, `/api/galeria`,
> etc.) son *placeholders* heredados del diseño inicial: responden pero todavía
> no persisten datos. El sitio usa `/api/contenido`.

### Noticias
- `GET /api/noticias` - Listar todas
- `POST /api/noticias` - Crear nueva
- `GET /api/noticias/:id` - Obtener una
- `PUT /api/noticias/:id` - Actualizar
- `DELETE /api/noticias/:id` - Eliminar

### Jugadores
- `GET /api/jugadores` - Listar todos
- `POST /api/jugadores` - Crear nuevo
- `GET /api/jugadores/:id` - Obtener uno
- `PUT /api/jugadores/:id` - Actualizar
- `DELETE /api/jugadores/:id` - Eliminar

### Partidos
- `GET /api/partidos` - Listar todos
- `POST /api/partidos` - Crear nuevo
- `GET /api/partidos/:id` - Obtener uno
- `PUT /api/partidos/:id` - Actualizar
- `DELETE /api/partidos/:id` - Eliminar

### Galería
- `GET /api/galeria` - Listar fotos
- `POST /api/galeria` - Subir foto
- `DELETE /api/galeria/:id` - Eliminar foto

### Videos
- `GET /api/videos` - Listar videos
- `POST /api/videos` - Crear video
- `DELETE /api/videos/:id` - Eliminar video

### Pedidos
- `GET /api/pedidos` - Listar pedidos
- `POST /api/pedidos` - Crear pedido
- `GET /api/pedidos/:id` - Obtener pedido
- `PUT /api/pedidos/:id` - Actualizar pedido

### Abonados
- `GET /api/abonados` - Listar abonados
- `POST /api/abonados` - Registrar abonado
- `GET /api/abonados/:id` - Obtener abonado
- `PUT /api/abonados/:id` - Actualizar abonado

## 🐳 Deployment

### Con Docker

```bash
docker build -t juventud-guacarhue-backend ./backend
docker run -e DATABASE_URL=... -p 3000:3000 juventud-guacarhue-backend
```

### En Railway o Vercel
Ver la guía paso a paso en `docs/DEPLOY.md`.

## 📝 Licencia

MIT

## 👨‍💻 Autor

Juventud Guacarhue - 2026
