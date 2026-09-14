-- CreateEnum
CREATE TYPE "EventoTipo" AS ENUM ('seminario', 'torneo', 'social');

-- CreateEnum
CREATE TYPE "EventoVisibilidad" AS ENUM ('publico', 'privado');

-- CreateTable
CREATE TABLE "Evento" (
    "id" SERIAL NOT NULL,
    "club_id" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" "EventoTipo" NOT NULL,
    "visibilidad" "EventoVisibilidad" NOT NULL DEFAULT 'privado',
    "fecha" TIMESTAMP(3) NOT NULL,
    "lugar" TEXT,
    "descripcion" TEXT,
    "publicado" BOOLEAN NOT NULL DEFAULT false,
    "torneo_id" INTEGER,
    "eliminado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Evento_torneo_id_key" ON "Evento"("torneo_id");

-- CreateIndex
CREATE INDEX "Evento_club_id_fecha_idx" ON "Evento"("club_id", "fecha");

-- CreateIndex
CREATE INDEX "Evento_club_id_eliminado_idx" ON "Evento"("club_id", "eliminado");

-- CreateIndex
CREATE INDEX "Evento_visibilidad_publicado_fecha_idx" ON "Evento"("visibilidad", "publicado", "fecha");

-- AddForeignKey
ALTER TABLE "Evento" ADD CONSTRAINT "Evento_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evento" ADD CONSTRAINT "Evento_torneo_id_fkey" FOREIGN KEY ("torneo_id") REFERENCES "Torneo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
