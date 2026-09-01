-- Solicitudes comerciales (landing). Tabla de plataforma, sin club_id.

CREATE TABLE "Solicitud" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "nombre_club" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "cantidad_miembros" INTEGER NOT NULL,
    "cantidad_socios" INTEGER NOT NULL,
    "eliminado" BOOLEAN NOT NULL DEFAULT false,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Solicitud_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Solicitud_estado_eliminado_idx" ON "Solicitud"("estado", "eliminado");
CREATE INDEX "Solicitud_eliminado_idx" ON "Solicitud"("eliminado");
