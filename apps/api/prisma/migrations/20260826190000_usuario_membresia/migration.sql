-- Identidad unificada (admin/entrada/socio/profe). Superadmin sigue en PlatformAdmin.

CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL DEFAULT '',
    "dni" TEXT NOT NULL DEFAULT '',
    "telefono" TEXT NOT NULL DEFAULT '',
    "fecha_nacimiento" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

CREATE TABLE "Membresia" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "club_id" INTEGER NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'socio',
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "must_change_password" BOOLEAN NOT NULL DEFAULT false,
    "grupo_familiar_id" INTEGER,
    "old_socio_id" INTEGER,

    CONSTRAINT "Membresia_pkey" PRIMARY KEY ("id")
);

-- FKs que apuntaban a Socio: las cortamos para reasignar IDs.
ALTER TABLE "Pago" DROP CONSTRAINT IF EXISTS "Pago_socio_id_fkey";
ALTER TABLE "Reserva" DROP CONSTRAINT IF EXISTS "Reserva_socio_id_fkey";
ALTER TABLE "Asistencia" DROP CONSTRAINT IF EXISTS "Asistencia_socio_id_fkey";
ALTER TABLE "SocioActividad" DROP CONSTRAINT IF EXISTS "SocioActividad_socio_id_fkey";
ALTER TABLE "Actividad" DROP CONSTRAINT IF EXISTS "Actividad_profe_id_fkey";
ALTER TABLE "CobroProfe" DROP CONSTRAINT IF EXISTS "CobroProfe_socio_id_fkey";
ALTER TABLE "CobroProfe" DROP CONSTRAINT IF EXISTS "CobroProfe_profe_id_fkey";
ALTER TABLE "LiquidacionProfe" DROP CONSTRAINT IF EXISTS "LiquidacionProfe_profe_id_fkey";
ALTER TABLE "GrupoFamiliar" DROP CONSTRAINT IF EXISTS "GrupoFamiliar_titular_id_fkey";
ALTER TABLE "Socio" DROP CONSTRAINT IF EXISTS "Socio_grupo_familiar_id_fkey";

INSERT INTO "Usuario" ("email", "password_hash", "nombre", "apellido", "dni", "telefono", "fecha_nacimiento")
SELECT lower(s.email), s.password_hash, s.nombre, s.apellido, s.dni, s.telefono, s.fecha_nacimiento
FROM (
    SELECT DISTINCT ON (lower(email))
        email, password_hash, nombre, apellido, dni, telefono, fecha_nacimiento
    FROM (
        SELECT email, password_hash, nombre, apellido, dni, telefono, fecha_nacimiento, 1 AS pri FROM "Socio"
        UNION ALL
        SELECT email, password_hash, nombre, '', '', '', NULL::timestamp, 2 FROM "Admin"
    ) u
    ORDER BY lower(email), pri
) s;

INSERT INTO "Membresia" ("usuario_id", "club_id", "rol", "estado", "must_change_password", "grupo_familiar_id", "old_socio_id")
SELECT u.id, s.club_id, s.rol, s.estado, false, s.grupo_familiar_id, s.id
FROM "Socio" s
JOIN "Usuario" u ON u.email = lower(s.email);

INSERT INTO "Membresia" ("usuario_id", "club_id", "rol", "estado", "must_change_password", "grupo_familiar_id")
SELECT u.id, a.club_id, a.rol, 'activo', a.must_change_password, NULL
FROM "Admin" a
JOIN "Usuario" u ON u.email = lower(a.email)
WHERE NOT EXISTS (
    SELECT 1 FROM "Membresia" m
    WHERE m.usuario_id = u.id AND m.club_id = a.club_id
);

UPDATE "Pago" p
SET "socio_id" = m.id
FROM "Membresia" m
WHERE m.old_socio_id = p."socio_id";

UPDATE "Reserva" r
SET "socio_id" = m.id
FROM "Membresia" m
WHERE m.old_socio_id = r."socio_id";

UPDATE "Asistencia" a
SET "socio_id" = m.id
FROM "Membresia" m
WHERE m.old_socio_id = a."socio_id";

UPDATE "SocioActividad" sa
SET "socio_id" = m.id
FROM "Membresia" m
WHERE m.old_socio_id = sa."socio_id";

UPDATE "Actividad" act
SET "profe_id" = m.id
FROM "Membresia" m
WHERE act."profe_id" IS NOT NULL AND m.old_socio_id = act."profe_id";

UPDATE "CobroProfe" c
SET "socio_id" = m.id
FROM "Membresia" m
WHERE m.old_socio_id = c."socio_id";

UPDATE "CobroProfe" c
SET "profe_id" = m.id
FROM "Membresia" m
WHERE m.old_socio_id = c."profe_id";

UPDATE "LiquidacionProfe" l
SET "profe_id" = m.id
FROM "Membresia" m
WHERE m.old_socio_id = l."profe_id";

UPDATE "Horario" h
SET "profe_id" = m.id
FROM "Membresia" m
WHERE h."profe_id" IS NOT NULL AND m.old_socio_id = h."profe_id";

UPDATE "GrupoFamiliar" g
SET "titular_id" = m.id
FROM "Membresia" m
WHERE m.old_socio_id = g."titular_id";

UPDATE "Asistencia" a
SET "marcada_por" = m.id
FROM "Membresia" m
WHERE m.old_socio_id = a."marcada_por";

ALTER TABLE "Membresia" DROP COLUMN "old_socio_id";

CREATE UNIQUE INDEX "Membresia_usuario_id_club_id_key" ON "Membresia"("usuario_id", "club_id");
CREATE INDEX "Membresia_club_id_idx" ON "Membresia"("club_id");
CREATE INDEX "Membresia_usuario_id_idx" ON "Membresia"("usuario_id");
CREATE INDEX "Membresia_club_id_rol_idx" ON "Membresia"("club_id", "rol");
CREATE INDEX "Membresia_grupo_familiar_id_idx" ON "Membresia"("grupo_familiar_id");
CREATE UNIQUE INDEX "Membresia_admin_usuario_unique" ON "Membresia"("usuario_id") WHERE "rol" = 'admin';

ALTER TABLE "Membresia" ADD CONSTRAINT "Membresia_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Membresia" ADD CONSTRAINT "Membresia_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Membresia" ADD CONSTRAINT "Membresia_grupo_familiar_id_fkey" FOREIGN KEY ("grupo_familiar_id") REFERENCES "GrupoFamiliar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Pago" ADD CONSTRAINT "Pago_socio_id_fkey" FOREIGN KEY ("socio_id") REFERENCES "Membresia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_socio_id_fkey" FOREIGN KEY ("socio_id") REFERENCES "Membresia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Asistencia" ADD CONSTRAINT "Asistencia_socio_id_fkey" FOREIGN KEY ("socio_id") REFERENCES "Membresia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SocioActividad" ADD CONSTRAINT "SocioActividad_socio_id_fkey" FOREIGN KEY ("socio_id") REFERENCES "Membresia"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Actividad" ADD CONSTRAINT "Actividad_profe_id_fkey" FOREIGN KEY ("profe_id") REFERENCES "Membresia"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CobroProfe" ADD CONSTRAINT "CobroProfe_socio_id_fkey" FOREIGN KEY ("socio_id") REFERENCES "Membresia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CobroProfe" ADD CONSTRAINT "CobroProfe_profe_id_fkey" FOREIGN KEY ("profe_id") REFERENCES "Membresia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LiquidacionProfe" ADD CONSTRAINT "LiquidacionProfe_profe_id_fkey" FOREIGN KEY ("profe_id") REFERENCES "Membresia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GrupoFamiliar" ADD CONSTRAINT "GrupoFamiliar_titular_id_fkey" FOREIGN KEY ("titular_id") REFERENCES "Membresia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

DROP TABLE IF EXISTS "Admin";
DROP TABLE IF EXISTS "Socio";
