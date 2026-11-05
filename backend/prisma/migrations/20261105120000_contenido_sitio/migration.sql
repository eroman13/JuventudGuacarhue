-- CreateTable
CREATE TABLE "ContenidoSitio" (
    "id" TEXT NOT NULL DEFAULT 'principal',
    "datos" JSONB NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContenidoSitio_pkey" PRIMARY KEY ("id")
);
