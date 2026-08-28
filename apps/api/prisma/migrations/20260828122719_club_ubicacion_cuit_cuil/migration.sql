-- AlterTable
ALTER TABLE "Club" ADD COLUMN     "cuit_cuil" TEXT,
ADD COLUMN     "provincia" TEXT,
ADD COLUMN     "ciudad" TEXT,
ADD COLUMN     "ubicacion_json" JSONB;

-- Migrar datos existentes de cuit/cuil al campo unificado antes de borrar las columnas
UPDATE "Club" SET "cuit_cuil" = COALESCE("cuit", "cuil") WHERE "cuit" IS NOT NULL OR "cuil" IS NOT NULL;

-- AlterTable
ALTER TABLE "Club" DROP COLUMN "cuit",
DROP COLUMN "cuil";
