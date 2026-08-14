-- AlterTable
ALTER TABLE "Club" ADD COLUMN     "bloquear_entrada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bloquear_reservas" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "cancelar_reserva_horas" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "cumples_auto" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "max_reservas_activas" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "regla_moroso_cuotas" INTEGER NOT NULL DEFAULT 2;

-- AlterTable
ALTER TABLE "Socio" ADD COLUMN     "fecha_nacimiento" TIMESTAMP(3),
ADD COLUMN     "grupo_familiar_id" INTEGER;

-- CreateTable
CREATE TABLE "GrupoFamiliar" (
    "id" SERIAL NOT NULL,
    "club_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "titular_id" INTEGER NOT NULL,

    CONSTRAINT "GrupoFamiliar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Actividad" (
    "id" SERIAL NOT NULL,
    "club_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "modo_cobro" TEXT NOT NULL DEFAULT 'club',
    "monto_adicional" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "profe_id" INTEGER,
    "comision_tipo" TEXT,
    "comision_valor" DOUBLE PRECISION,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Actividad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocioActividad" (
    "socio_id" INTEGER NOT NULL,
    "actividad_id" INTEGER NOT NULL,

    CONSTRAINT "SocioActividad_pkey" PRIMARY KEY ("socio_id","actividad_id")
);

-- CreateTable
CREATE TABLE "CobroProfe" (
    "id" SERIAL NOT NULL,
    "club_id" INTEGER NOT NULL,
    "actividad_id" INTEGER NOT NULL,
    "socio_id" INTEGER NOT NULL,
    "profe_id" INTEGER NOT NULL,
    "mes" TEXT NOT NULL,
    "monto_alumno" DOUBLE PRECISION NOT NULL,
    "comision_club" DOUBLE PRECISION NOT NULL,
    "cobrado" BOOLEAN NOT NULL DEFAULT true,
    "medio" TEXT NOT NULL DEFAULT 'efectivo',
    "nota" TEXT,

    CONSTRAINT "CobroProfe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiquidacionProfe" (
    "id" SERIAL NOT NULL,
    "club_id" INTEGER NOT NULL,
    "profe_id" INTEGER NOT NULL,
    "mes" TEXT NOT NULL,
    "total_club" DOUBLE PRECISION NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "mp_init_point" TEXT,
    "fecha_pago" TIMESTAMP(3),

    CONSTRAINT "LiquidacionProfe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Espacio" (
    "id" SERIAL NOT NULL,
    "club_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "duracion_slot_min" INTEGER NOT NULL DEFAULT 60,
    "precio_opcional" DOUBLE PRECISION,
    "hora_apertura" TEXT NOT NULL DEFAULT '08:00',
    "hora_cierre" TEXT NOT NULL DEFAULT '23:00',

    CONSTRAINT "Espacio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reserva" (
    "id" SERIAL NOT NULL,
    "club_id" INTEGER NOT NULL,
    "espacio_id" INTEGER NOT NULL,
    "socio_id" INTEGER NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'confirmada',
    "nota" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reserva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Horario" (
    "id" SERIAL NOT NULL,
    "club_id" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "dias" TEXT NOT NULL,
    "hora_inicio" TEXT NOT NULL,
    "hora_fin" TEXT NOT NULL,
    "profe_id" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Horario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Noticia" (
    "id" SERIAL NOT NULL,
    "club_id" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "cuerpo" TEXT NOT NULL,
    "imagen_url" TEXT,
    "es_evento" BOOLEAN NOT NULL DEFAULT false,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Noticia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asistencia" (
    "id" SERIAL NOT NULL,
    "club_id" INTEGER NOT NULL,
    "horario_id" INTEGER NOT NULL,
    "socio_id" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "estado" TEXT NOT NULL,
    "marcada_por" INTEGER NOT NULL,

    CONSTRAINT "Asistencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Torneo" (
    "id" SERIAL NOT NULL,
    "club_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "deporte" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'activo',

    CONSTRAINT "Torneo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partido" (
    "id" SERIAL NOT NULL,
    "torneo_id" INTEGER NOT NULL,
    "club_id" INTEGER NOT NULL,
    "rival_a" TEXT NOT NULL,
    "rival_b" TEXT NOT NULL,
    "fecha" TIMESTAMP(3),
    "goles_a" INTEGER,
    "goles_b" INTEGER,
    "jugado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Partido_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GrupoFamiliar_club_id_idx" ON "GrupoFamiliar"("club_id");

-- CreateIndex
CREATE INDEX "Actividad_club_id_idx" ON "Actividad"("club_id");

-- CreateIndex
CREATE INDEX "CobroProfe_club_id_mes_idx" ON "CobroProfe"("club_id", "mes");

-- CreateIndex
CREATE UNIQUE INDEX "CobroProfe_actividad_id_socio_id_mes_key" ON "CobroProfe"("actividad_id", "socio_id", "mes");

-- CreateIndex
CREATE INDEX "LiquidacionProfe_club_id_mes_idx" ON "LiquidacionProfe"("club_id", "mes");

-- CreateIndex
CREATE UNIQUE INDEX "LiquidacionProfe_profe_id_mes_key" ON "LiquidacionProfe"("profe_id", "mes");

-- CreateIndex
CREATE INDEX "Espacio_club_id_idx" ON "Espacio"("club_id");

-- CreateIndex
CREATE INDEX "Reserva_club_id_espacio_id_inicio_idx" ON "Reserva"("club_id", "espacio_id", "inicio");

-- CreateIndex
CREATE INDEX "Reserva_club_id_inicio_idx" ON "Reserva"("club_id", "inicio");

-- CreateIndex
CREATE INDEX "Horario_club_id_idx" ON "Horario"("club_id");

-- CreateIndex
CREATE INDEX "Noticia_club_id_fecha_idx" ON "Noticia"("club_id", "fecha");

-- CreateIndex
CREATE INDEX "Asistencia_club_id_fecha_idx" ON "Asistencia"("club_id", "fecha");

-- CreateIndex
CREATE INDEX "Asistencia_socio_id_fecha_idx" ON "Asistencia"("socio_id", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "Asistencia_horario_id_socio_id_fecha_key" ON "Asistencia"("horario_id", "socio_id", "fecha");

-- CreateIndex
CREATE INDEX "Torneo_club_id_idx" ON "Torneo"("club_id");

-- CreateIndex
CREATE INDEX "Partido_club_id_idx" ON "Partido"("club_id");

-- CreateIndex
CREATE INDEX "Partido_torneo_id_idx" ON "Partido"("torneo_id");

-- CreateIndex
CREATE INDEX "Socio_grupo_familiar_id_idx" ON "Socio"("grupo_familiar_id");

-- AddForeignKey
ALTER TABLE "GrupoFamiliar" ADD CONSTRAINT "GrupoFamiliar_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrupoFamiliar" ADD CONSTRAINT "GrupoFamiliar_titular_id_fkey" FOREIGN KEY ("titular_id") REFERENCES "Socio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Socio" ADD CONSTRAINT "Socio_grupo_familiar_id_fkey" FOREIGN KEY ("grupo_familiar_id") REFERENCES "GrupoFamiliar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Actividad" ADD CONSTRAINT "Actividad_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Actividad" ADD CONSTRAINT "Actividad_profe_id_fkey" FOREIGN KEY ("profe_id") REFERENCES "Socio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocioActividad" ADD CONSTRAINT "SocioActividad_socio_id_fkey" FOREIGN KEY ("socio_id") REFERENCES "Socio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocioActividad" ADD CONSTRAINT "SocioActividad_actividad_id_fkey" FOREIGN KEY ("actividad_id") REFERENCES "Actividad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CobroProfe" ADD CONSTRAINT "CobroProfe_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CobroProfe" ADD CONSTRAINT "CobroProfe_actividad_id_fkey" FOREIGN KEY ("actividad_id") REFERENCES "Actividad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CobroProfe" ADD CONSTRAINT "CobroProfe_socio_id_fkey" FOREIGN KEY ("socio_id") REFERENCES "Socio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CobroProfe" ADD CONSTRAINT "CobroProfe_profe_id_fkey" FOREIGN KEY ("profe_id") REFERENCES "Socio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiquidacionProfe" ADD CONSTRAINT "LiquidacionProfe_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiquidacionProfe" ADD CONSTRAINT "LiquidacionProfe_profe_id_fkey" FOREIGN KEY ("profe_id") REFERENCES "Socio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Espacio" ADD CONSTRAINT "Espacio_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_espacio_id_fkey" FOREIGN KEY ("espacio_id") REFERENCES "Espacio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_socio_id_fkey" FOREIGN KEY ("socio_id") REFERENCES "Socio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Horario" ADD CONSTRAINT "Horario_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Noticia" ADD CONSTRAINT "Noticia_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asistencia" ADD CONSTRAINT "Asistencia_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asistencia" ADD CONSTRAINT "Asistencia_horario_id_fkey" FOREIGN KEY ("horario_id") REFERENCES "Horario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asistencia" ADD CONSTRAINT "Asistencia_socio_id_fkey" FOREIGN KEY ("socio_id") REFERENCES "Socio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Torneo" ADD CONSTRAINT "Torneo_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partido" ADD CONSTRAINT "Partido_torneo_id_fkey" FOREIGN KEY ("torneo_id") REFERENCES "Torneo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partido" ADD CONSTRAINT "Partido_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
