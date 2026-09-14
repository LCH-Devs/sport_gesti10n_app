-- Nullable primero para poder rellenar filas existentes sin invalidar de
-- golpe todas las sesiones activas al desplegar (se inicializa con
-- created_at, no con "ahora").
ALTER TABLE "Usuario" ADD COLUMN "password_changed_at" TIMESTAMP(3);

UPDATE "Usuario" SET "password_changed_at" = "created_at"
WHERE "password_changed_at" IS NULL;

ALTER TABLE "Usuario" ALTER COLUMN "password_changed_at" SET NOT NULL;
ALTER TABLE "Usuario" ALTER COLUMN "password_changed_at" SET DEFAULT CURRENT_TIMESTAMP;
