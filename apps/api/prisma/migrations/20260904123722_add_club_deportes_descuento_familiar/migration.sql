-- AlterTable
ALTER TABLE "Club" ADD COLUMN     "deportes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "descuento_familiar_pct" DOUBLE PRECISION DEFAULT 0;

-- AlterTable
ALTER TABLE "PublicacionSocial" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Solicitud" ALTER COLUMN "updated_at" DROP DEFAULT;
