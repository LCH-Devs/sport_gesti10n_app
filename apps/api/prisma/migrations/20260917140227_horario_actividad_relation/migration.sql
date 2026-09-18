-- AlterTable
ALTER TABLE "Horario" ADD COLUMN     "actividad_id" INTEGER;

-- CreateIndex
CREATE INDEX "Horario_actividad_id_idx" ON "Horario"("actividad_id");

-- AddForeignKey
ALTER TABLE "Horario" ADD CONSTRAINT "Horario_actividad_id_fkey" FOREIGN KEY ("actividad_id") REFERENCES "Actividad"("id") ON DELETE SET NULL ON UPDATE CASCADE;
