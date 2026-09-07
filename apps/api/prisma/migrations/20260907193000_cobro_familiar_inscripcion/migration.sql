-- Cobro familiar + inscripción / bonificación de cuota
ALTER TABLE "Pago" ADD COLUMN "grupo_familiar_id" INTEGER;
ALTER TABLE "Pago" ADD COLUMN "tipo" TEXT NOT NULL DEFAULT 'cuota';
ALTER TABLE "Pago" ADD COLUMN "concepto" TEXT;

DROP INDEX IF EXISTS "Pago_socio_id_mes_key";
CREATE UNIQUE INDEX "Pago_socio_id_mes_tipo_key" ON "Pago"("socio_id", "mes", "tipo");
CREATE INDEX "Pago_grupo_familiar_id_idx" ON "Pago"("grupo_familiar_id");

ALTER TABLE "Pago" ADD CONSTRAINT "Pago_grupo_familiar_id_fkey"
  FOREIGN KEY ("grupo_familiar_id") REFERENCES "GrupoFamiliar"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "BonificacionCuota" (
  "id" SERIAL NOT NULL,
  "club_id" INTEGER NOT NULL,
  "socio_id" INTEGER NOT NULL,
  "mes" TEXT NOT NULL,

  CONSTRAINT "BonificacionCuota_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BonificacionCuota_socio_id_mes_key" ON "BonificacionCuota"("socio_id", "mes");
CREATE INDEX "BonificacionCuota_club_id_mes_idx" ON "BonificacionCuota"("club_id", "mes");

ALTER TABLE "BonificacionCuota" ADD CONSTRAINT "BonificacionCuota_club_id_fkey"
  FOREIGN KEY ("club_id") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BonificacionCuota" ADD CONSTRAINT "BonificacionCuota_socio_id_fkey"
  FOREIGN KEY ("socio_id") REFERENCES "Membresia"("id") ON DELETE CASCADE ON UPDATE CASCADE;
