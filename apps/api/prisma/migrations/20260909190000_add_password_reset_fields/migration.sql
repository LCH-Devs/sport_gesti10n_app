ALTER TABLE "Usuario" ADD COLUMN "reset_token_hash" TEXT;
ALTER TABLE "Usuario" ADD COLUMN "reset_expires_at" TIMESTAMP(3);
ALTER TABLE "Usuario" ADD COLUMN "reset_used_at" TIMESTAMP(3);
