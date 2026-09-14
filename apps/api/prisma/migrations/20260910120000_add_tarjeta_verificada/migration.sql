ALTER TABLE "Club" ADD COLUMN "tarjeta_verificada" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Club" ADD COLUMN "tarjeta_verificada_at" TIMESTAMP(3);
ALTER TABLE "Club" ADD COLUMN "tarjeta_verificacion_payment_id" TEXT;
