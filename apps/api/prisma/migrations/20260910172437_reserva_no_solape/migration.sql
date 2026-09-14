-- Prisma no puede expresar exclusion constraints en el DSL del schema, así
-- que esta migración es la única fuente de verdad para esta regla: dos
-- reservas "confirmada" del mismo espacio nunca pueden solaparse en el
-- tiempo, sin importar la concurrencia de la app (R15 del roadmap).
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Reserva"
  ADD CONSTRAINT reserva_no_solape
  EXCLUDE USING gist (
    espacio_id WITH =,
    tsrange(inicio, fin) WITH &&
  )
  WHERE (estado = 'confirmada');
