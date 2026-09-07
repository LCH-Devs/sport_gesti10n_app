-- CreateTable
CREATE TABLE "PlanTramo" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "desde" INTEGER NOT NULL,
    "hasta" INTEGER,
    "precio_usd" DOUBLE PRECISION NOT NULL,
    "orden" INTEGER NOT NULL,

    CONSTRAINT "PlanTramo_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PlanTramo_orden_idx" ON "PlanTramo"("orden");

ALTER TABLE "Club" ADD COLUMN "plan_hasta" INTEGER NOT NULL DEFAULT 50;
ALTER TABLE "Club" ADD COLUMN "plan_consentido_hasta" INTEGER NOT NULL DEFAULT 50;
ALTER TABLE "Club" ADD COLUMN "plan_pendiente_precio" DOUBLE PRECISION;
ALTER TABLE "Club" ADD COLUMN "plan_pendiente_hasta" INTEGER;
ALTER TABLE "Club" ADD COLUMN "plan_pendiente_en_at" TIMESTAMP(3);
ALTER TABLE "Club" ADD COLUMN "plan_pendiente_mail_enviado_at" TIMESTAMP(3);
ALTER TABLE "Club" ADD COLUMN "plan_pendiente_confirmado_at" TIMESTAMP(3);
ALTER TABLE "Club" ADD COLUMN "plan_pendiente_aplica_desde" TIMESTAMP(3);
ALTER TABLE "Club" ADD COLUMN "plan_pendiente_token_hash" TEXT;

CREATE INDEX "Club_plan_pendiente_confirmado_at_idx" ON "Club"("plan_pendiente_confirmado_at");

UPDATE "Club" SET "plan" = 'Hasta 50 socios' WHERE "plan" = 'basico' OR "plan" IS NULL OR "plan" = '';

INSERT INTO "PlanTramo" ("nombre", "desde", "hasta", "precio_usd", "orden") VALUES
  ('Hasta 50 socios', 1, 50, 15, 1),
  ('Hasta 100 socios', 51, 100, 30, 2),
  ('Más de 100 socios', 101, NULL, 45, 3);

-- Clubes existentes: tope 100 (el soft-limit anterior) salvo que el precio ya matchee un tramo.
UPDATE "Club" SET "plan_hasta" = 100, "plan_consentido_hasta" = 100 WHERE "eliminado" = false;

UPDATE "Club" c
SET
  "plan_hasta" = t."hasta",
  "plan_consentido_hasta" = COALESCE(t."hasta", 100000),
  "plan" = t."nombre"
FROM "PlanTramo" t
WHERE c."eliminado" = false
  AND t."hasta" IS NOT NULL
  AND c."precio_usd_mes" = t."precio_usd";
