-- Evita reenviar el aviso de 10 días de trial.

ALTER TABLE "Solicitud" ADD COLUMN "mail_aviso_trial_enviado" BOOLEAN NOT NULL DEFAULT false;
