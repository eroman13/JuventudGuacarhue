-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPERADMIN', 'ADMIN', 'MODERADOR', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "NoticiasEstado" AS ENUM ('BORRADOR', 'PENDIENTE_REVISION', 'PUBLICADO', 'ARCHIVADO');

-- CreateEnum
CREATE TYPE "PartidoEstado" AS ENUM ('PROXIMO', 'JUGANDO', 'FINALIZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoGol" AS ENUM ('GOL', 'AUTOGOAL', 'PENAL');

-- CreateEnum
CREATE TYPE "FotoCategorias" AS ENUM ('PARTIDO', 'ENTRENAMIENTO', 'EVENTO', 'EQUIPO', 'GALERIA', 'OTROS');

-- CreateEnum
CREATE TYPE "VideoCategorias" AS ENUM ('PARTIDO', 'ENTRENAMIENTO', 'TUTORIAL', 'NOTICIA', 'ENTREVISTA', 'OTROS');

-- CreateEnum
CREATE TYPE "EstadoPedido" AS ENUM ('PENDIENTE', 'CONFIRMADO', 'ENVIADO', 'ENTREGADO', 'CANCELADO', 'DEVUELTO');

-- CreateEnum
CREATE TYPE "TipoAbono" AS ENUM ('ANUAL', 'SEMESTRAL', 'TRIMESTRAL', 'MENSUAL');

-- CreateEnum
CREATE TYPE "EstadoAbono" AS ENUM ('ACTIVO', 'VENCIDO', 'CANCELADO', 'SUSPENDIDO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "telefono" TEXT,
    "avatar" TEXT,
    "rol" "UserRole" NOT NULL DEFAULT 'EDITOR',
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Noticia" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "resumen" TEXT NOT NULL,
    "imagen" TEXT,
    "estado" "NoticiasEstado" NOT NULL DEFAULT 'BORRADOR',
    "fechaPublicacion" TIMESTAMP(3),
    "creadorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Noticia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comentario" (
    "id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "noticiaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "aprobado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comentario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Jugador" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "posicion" TEXT NOT NULL,
    "nacionalidad" TEXT,
    "fechaNacimiento" TIMESTAMP(3),
    "foto" TEXT,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "creadorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Jugador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstadisticasJugador" (
    "id" TEXT NOT NULL,
    "jugadorId" TEXT NOT NULL,
    "goles" INTEGER NOT NULL DEFAULT 0,
    "asistencias" INTEGER NOT NULL DEFAULT 0,
    "tarjetasAmarillas" INTEGER NOT NULL DEFAULT 0,
    "tarjetasRojas" INTEGER NOT NULL DEFAULT 0,
    "partidosJugados" INTEGER NOT NULL DEFAULT 0,
    "temporada" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EstadisticasJugador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partido" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "fechaPartido" TIMESTAMP(3) NOT NULL,
    "lugarPartido" TEXT NOT NULL,
    "estado" "PartidoEstado" NOT NULL DEFAULT 'PROXIMO',
    "equipoLocal" TEXT NOT NULL,
    "equipoVisitante" TEXT NOT NULL,
    "golesLocal" INTEGER DEFAULT 0,
    "golesVisitante" INTEGER DEFAULT 0,
    "arbitro" TEXT,
    "publico" INTEGER,
    "description" TEXT,
    "creadorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GolPartido" (
    "id" TEXT NOT NULL,
    "partidoId" TEXT NOT NULL,
    "jugadorId" TEXT,
    "minuto" INTEGER NOT NULL,
    "tipo" "TipoGol" NOT NULL DEFAULT 'GOL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GolPartido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Foto" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "categoria" "FotoCategorias" NOT NULL,
    "creadorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Foto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "urlVideo" TEXT NOT NULL,
    "thumbnail" TEXT,
    "categoria" "VideoCategorias" NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "creadorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Producto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "precio" DOUBLE PRECISION NOT NULL,
    "imagen" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "creadorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pedido" (
    "id" TEXT NOT NULL,
    "numeroOrden" TEXT NOT NULL,
    "estado" "EstadoPedido" NOT NULL DEFAULT 'PENDIENTE',
    "total" DOUBLE PRECISION NOT NULL,
    "nombreCliente" TEXT NOT NULL,
    "emailCliente" TEXT NOT NULL,
    "telefonoCliente" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "codigoPostal" TEXT NOT NULL,
    "notasEspeciales" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemPedido" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ItemPedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Abonado" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "tipoAbono" "TipoAbono" NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoAbono" NOT NULL DEFAULT 'ACTIVO',
    "precioAbono" DOUBLE PRECISION NOT NULL,
    "comprobante" TEXT,
    "numeroComprobante" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Abonado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracionClub" (
    "id" TEXT NOT NULL,
    "nombreClub" TEXT NOT NULL DEFAULT 'Juventud Guacarhue',
    "descripcion" TEXT,
    "logoUrl" TEXT,
    "bannerUrl" TEXT,
    "email" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "codigoPostal" TEXT NOT NULL,
    "paginaWeb" TEXT,
    "instagram" TEXT,
    "facebook" TEXT,
    "youtube" TEXT,
    "twitter" TEXT,
    "tiktok" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracionClub_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pagina" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pagina_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_rol_idx" ON "User"("rol");

-- CreateIndex
CREATE UNIQUE INDEX "Noticia_slug_key" ON "Noticia"("slug");

-- CreateIndex
CREATE INDEX "Noticia_creadorId_idx" ON "Noticia"("creadorId");

-- CreateIndex
CREATE INDEX "Noticia_estado_idx" ON "Noticia"("estado");

-- CreateIndex
CREATE INDEX "Noticia_fechaPublicacion_idx" ON "Noticia"("fechaPublicacion");

-- CreateIndex
CREATE INDEX "Comentario_noticiaId_idx" ON "Comentario"("noticiaId");

-- CreateIndex
CREATE INDEX "Comentario_aprobado_idx" ON "Comentario"("aprobado");

-- CreateIndex
CREATE INDEX "Jugador_creadorId_idx" ON "Jugador"("creadorId");

-- CreateIndex
CREATE INDEX "Jugador_numero_idx" ON "Jugador"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Jugador_numero_key" ON "Jugador"("numero");

-- CreateIndex
CREATE INDEX "EstadisticasJugador_jugadorId_idx" ON "EstadisticasJugador"("jugadorId");

-- CreateIndex
CREATE UNIQUE INDEX "EstadisticasJugador_jugadorId_temporada_key" ON "EstadisticasJugador"("jugadorId", "temporada");

-- CreateIndex
CREATE INDEX "Partido_creadorId_idx" ON "Partido"("creadorId");

-- CreateIndex
CREATE INDEX "Partido_fechaPartido_idx" ON "Partido"("fechaPartido");

-- CreateIndex
CREATE INDEX "Partido_estado_idx" ON "Partido"("estado");

-- CreateIndex
CREATE INDEX "GolPartido_partidoId_idx" ON "GolPartido"("partidoId");

-- CreateIndex
CREATE INDEX "GolPartido_jugadorId_idx" ON "GolPartido"("jugadorId");

-- CreateIndex
CREATE INDEX "Foto_creadorId_idx" ON "Foto"("creadorId");

-- CreateIndex
CREATE INDEX "Foto_categoria_idx" ON "Foto"("categoria");

-- CreateIndex
CREATE INDEX "Video_creadorId_idx" ON "Video"("creadorId");

-- CreateIndex
CREATE INDEX "Video_categoria_idx" ON "Video"("categoria");

-- CreateIndex
CREATE UNIQUE INDEX "Producto_slug_key" ON "Producto"("slug");

-- CreateIndex
CREATE INDEX "Producto_creadorId_idx" ON "Producto"("creadorId");

-- CreateIndex
CREATE INDEX "Producto_estado_idx" ON "Producto"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "Pedido_numeroOrden_key" ON "Pedido"("numeroOrden");

-- CreateIndex
CREATE INDEX "Pedido_estado_idx" ON "Pedido"("estado");

-- CreateIndex
CREATE INDEX "Pedido_emailCliente_idx" ON "Pedido"("emailCliente");

-- CreateIndex
CREATE INDEX "ItemPedido_pedidoId_idx" ON "ItemPedido"("pedidoId");

-- CreateIndex
CREATE INDEX "ItemPedido_productoId_idx" ON "ItemPedido"("productoId");

-- CreateIndex
CREATE UNIQUE INDEX "Abonado_email_key" ON "Abonado"("email");

-- CreateIndex
CREATE INDEX "Abonado_email_idx" ON "Abonado"("email");

-- CreateIndex
CREATE INDEX "Abonado_estado_idx" ON "Abonado"("estado");

-- CreateIndex
CREATE INDEX "Abonado_tipoAbono_idx" ON "Abonado"("tipoAbono");

-- CreateIndex
CREATE UNIQUE INDEX "Pagina_slug_key" ON "Pagina"("slug");

-- CreateIndex
CREATE INDEX "Pagina_slug_idx" ON "Pagina"("slug");

-- AddForeignKey
ALTER TABLE "Noticia" ADD CONSTRAINT "Noticia_creadorId_fkey" FOREIGN KEY ("creadorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comentario" ADD CONSTRAINT "Comentario_noticiaId_fkey" FOREIGN KEY ("noticiaId") REFERENCES "Noticia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jugador" ADD CONSTRAINT "Jugador_creadorId_fkey" FOREIGN KEY ("creadorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstadisticasJugador" ADD CONSTRAINT "EstadisticasJugador_jugadorId_fkey" FOREIGN KEY ("jugadorId") REFERENCES "Jugador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partido" ADD CONSTRAINT "Partido_creadorId_fkey" FOREIGN KEY ("creadorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GolPartido" ADD CONSTRAINT "GolPartido_partidoId_fkey" FOREIGN KEY ("partidoId") REFERENCES "Partido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GolPartido" ADD CONSTRAINT "GolPartido_jugadorId_fkey" FOREIGN KEY ("jugadorId") REFERENCES "Jugador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Foto" ADD CONSTRAINT "Foto_creadorId_fkey" FOREIGN KEY ("creadorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_creadorId_fkey" FOREIGN KEY ("creadorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_creadorId_fkey" FOREIGN KEY ("creadorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPedido" ADD CONSTRAINT "ItemPedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPedido" ADD CONSTRAINT "ItemPedido_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
