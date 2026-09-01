-- Fechas de cambio de estado en solicitudes comerciales.

ALTER TABLE "Solicitud" ADD COLUMN "fecha_trial" TIMESTAMP(3);
ALTER TABLE "Solicitud" ADD COLUMN "fecha_aprobada" TIMESTAMP(3);
ALTER TABLE "Solicitud" ADD COLUMN "fecha_cancelada" TIMESTAMP(3);
ALTER TABLE "Solicitud" ADD COLUMN "fecha_eliminada" TIMESTAMP(3);
