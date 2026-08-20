-- AlterTable
ALTER TABLE "Admin" ADD COLUMN     "must_change_password" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Club" ADD COLUMN     "cuil" TEXT,
ADD COLUMN     "cuit" TEXT,
ADD COLUMN     "direccion" TEXT,
ADD COLUMN     "email_contacto" TEXT,
ADD COLUMN     "onboarding_completo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "telefono_club" TEXT,
ADD COLUMN     "titular_apellido" TEXT,
ADD COLUMN     "titular_nombre" TEXT;
