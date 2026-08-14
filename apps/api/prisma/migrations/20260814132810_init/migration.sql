-- CreateTable
CREATE TABLE "Club" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "logo_url" TEXT,
    "color_primario" TEXT NOT NULL DEFAULT '#2563eb',
    "plan" TEXT NOT NULL DEFAULT 'basico',
    "cuota_monto" DOUBLE PRECISION NOT NULL DEFAULT 5000,

    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" SERIAL NOT NULL,
    "club_id" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'admin',

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Socio" (
    "id" SERIAL NOT NULL,
    "club_id" INTEGER NOT NULL,
    "dni" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT NOT NULL DEFAULT '',
    "password_hash" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "rol" TEXT NOT NULL DEFAULT 'socio',

    CONSTRAINT "Socio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" SERIAL NOT NULL,
    "club_id" INTEGER NOT NULL,
    "socio_id" INTEGER NOT NULL,
    "mes" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "mp_preference_id" TEXT,
    "mp_init_point" TEXT,
    "fecha_pago" TIMESTAMP(3),

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Club_slug_key" ON "Club"("slug");

-- CreateIndex
CREATE INDEX "Admin_club_id_idx" ON "Admin"("club_id");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_club_id_email_key" ON "Admin"("club_id", "email");

-- CreateIndex
CREATE INDEX "Socio_club_id_idx" ON "Socio"("club_id");

-- CreateIndex
CREATE UNIQUE INDEX "Socio_club_id_dni_key" ON "Socio"("club_id", "dni");

-- CreateIndex
CREATE INDEX "Pago_club_id_mes_idx" ON "Pago"("club_id", "mes");

-- CreateIndex
CREATE INDEX "Pago_club_id_estado_idx" ON "Pago"("club_id", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "Pago_socio_id_mes_key" ON "Pago"("socio_id", "mes");

-- AddForeignKey
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Socio" ADD CONSTRAINT "Socio_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_socio_id_fkey" FOREIGN KEY ("socio_id") REFERENCES "Socio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
