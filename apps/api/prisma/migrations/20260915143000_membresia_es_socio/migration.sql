-- Los registros existentes eran miembros del padrón y conservan ese estado.
-- Un profesor contratado nuevo podrá usar false sin perder su Membresia,
-- necesaria para tenant, login y asignación a horarios.
ALTER TABLE "Membresia"
ADD COLUMN "es_socio" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "Membresia_club_id_es_socio_idx"
ON "Membresia"("club_id", "es_socio");
