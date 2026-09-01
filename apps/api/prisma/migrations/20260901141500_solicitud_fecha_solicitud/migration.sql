-- Fecha de alta de la solicitud (landing). Filas viejas copian created_at.

ALTER TABLE "Solicitud" ADD COLUMN "fecha_solicitud" TIMESTAMP(3);

UPDATE "Solicitud" SET "fecha_solicitud" = "created_at" WHERE "fecha_solicitud" IS NULL;

ALTER TABLE "Solicitud" ALTER COLUMN "fecha_solicitud" SET NOT NULL;
ALTER TABLE "Solicitud" ALTER COLUMN "fecha_solicitud" SET DEFAULT CURRENT_TIMESTAMP;
