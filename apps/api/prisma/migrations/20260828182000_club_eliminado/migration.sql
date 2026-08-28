-- Baja lógica de club: queda en DB, no entra, libera el mail del admin.

ALTER TABLE "Club" ADD COLUMN "eliminado" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Club_eliminado_idx" ON "Club"("eliminado");
