-- CreateTable
CREATE TABLE "CategoriaCuota" (
    "id" SERIAL NOT NULL,
    "club_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "es_default" BOOLEAN NOT NULL DEFAULT false,
    "eliminado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CategoriaCuota_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Membresia" ADD COLUMN "categoria_id" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "CategoriaCuota_club_id_slug_key" ON "CategoriaCuota"("club_id", "slug");

-- CreateIndex
CREATE INDEX "CategoriaCuota_club_id_idx" ON "CategoriaCuota"("club_id");

-- CreateIndex
CREATE INDEX "CategoriaCuota_club_id_eliminado_idx" ON "CategoriaCuota"("club_id", "eliminado");

-- CreateIndex
CREATE INDEX "Membresia_categoria_id_idx" ON "Membresia"("categoria_id");

-- AddForeignKey
ALTER TABLE "CategoriaCuota" ADD CONSTRAINT "CategoriaCuota_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membresia" ADD CONSTRAINT "Membresia_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "CategoriaCuota"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed default "Socio pleno" for existing clubs
INSERT INTO "CategoriaCuota" ("club_id", "nombre", "slug", "monto", "es_default", "eliminado")
SELECT c."id", 'Socio pleno', 'socio-pleno', c."cuota_monto", true, false
FROM "Club" c
WHERE NOT EXISTS (
  SELECT 1 FROM "CategoriaCuota" x WHERE x."club_id" = c."id" AND x."slug" = 'socio-pleno'
);

-- Assign default category to member memberships that have none
UPDATE "Membresia" m
SET "categoria_id" = cat."id"
FROM "CategoriaCuota" cat
WHERE cat."club_id" = m."club_id"
  AND cat."slug" = 'socio-pleno'
  AND cat."eliminado" = false
  AND m."categoria_id" IS NULL
  AND m."rol" IN ('socio', 'profe');
