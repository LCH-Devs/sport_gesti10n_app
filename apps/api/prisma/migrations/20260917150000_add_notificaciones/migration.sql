-- CreateTable
CREATE TABLE "Notificacion" (
    "id" SERIAL NOT NULL,
    "club_id" INTEGER NOT NULL,
    "membresia_id" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notificacion_membresia_id_leido_idx" ON "Notificacion"("membresia_id", "leido");

-- CreateIndex
CREATE INDEX "Notificacion_club_id_idx" ON "Notificacion"("club_id");

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_membresia_id_fkey" FOREIGN KEY ("membresia_id") REFERENCES "Membresia"("id") ON DELETE CASCADE ON UPDATE CASCADE;
