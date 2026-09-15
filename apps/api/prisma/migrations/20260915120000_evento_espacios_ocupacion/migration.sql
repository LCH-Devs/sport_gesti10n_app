-- AlterTable
ALTER TABLE "Evento" ADD COLUMN "fin" TIMESTAMP(3);
ALTER TABLE "Evento" ADD COLUMN "todos_espacios" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Horario" ADD COLUMN "espacio_id" INTEGER;

-- CreateTable
CREATE TABLE "EventoEspacio" (
    "evento_id" INTEGER NOT NULL,
    "espacio_id" INTEGER NOT NULL,

    CONSTRAINT "EventoEspacio_pkey" PRIMARY KEY ("evento_id","espacio_id")
);

-- CreateIndex
CREATE INDEX "EventoEspacio_espacio_id_idx" ON "EventoEspacio"("espacio_id");

-- CreateIndex
CREATE INDEX "Horario_espacio_id_idx" ON "Horario"("espacio_id");

-- AddForeignKey
ALTER TABLE "EventoEspacio" ADD CONSTRAINT "EventoEspacio_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "Evento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoEspacio" ADD CONSTRAINT "EventoEspacio_espacio_id_fkey" FOREIGN KEY ("espacio_id") REFERENCES "Espacio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Horario" ADD CONSTRAINT "Horario_espacio_id_fkey" FOREIGN KEY ("espacio_id") REFERENCES "Espacio"("id") ON DELETE SET NULL ON UPDATE CASCADE;
