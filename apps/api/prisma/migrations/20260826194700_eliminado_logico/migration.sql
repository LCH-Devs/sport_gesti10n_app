-- Soft delete: eliminado = false (visible) / true (oculto).

ALTER TABLE "Membresia" ADD COLUMN "eliminado" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "GrupoFamiliar" ADD COLUMN "eliminado" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Actividad" ADD COLUMN "eliminado" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Espacio" ADD COLUMN "eliminado" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Horario" ADD COLUMN "eliminado" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Noticia" ADD COLUMN "eliminado" BOOLEAN NOT NULL DEFAULT false;

DROP INDEX IF EXISTS "Membresia_admin_usuario_unique";
CREATE UNIQUE INDEX "Membresia_admin_usuario_unique" ON "Membresia"("usuario_id") WHERE "rol" = 'admin' AND "eliminado" = false;

CREATE INDEX "Membresia_club_id_eliminado_idx" ON "Membresia"("club_id", "eliminado");
CREATE INDEX "GrupoFamiliar_club_id_eliminado_idx" ON "GrupoFamiliar"("club_id", "eliminado");
CREATE INDEX "Actividad_club_id_eliminado_idx" ON "Actividad"("club_id", "eliminado");
CREATE INDEX "Espacio_club_id_eliminado_idx" ON "Espacio"("club_id", "eliminado");
CREATE INDEX "Horario_club_id_eliminado_idx" ON "Horario"("club_id", "eliminado");
CREATE INDEX "Noticia_club_id_eliminado_idx" ON "Noticia"("club_id", "eliminado");
