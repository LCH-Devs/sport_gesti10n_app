-- AlterTable
ALTER TABLE "Club" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "PlatformAdmin" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformAdmin_email_key" ON "PlatformAdmin"("email");
