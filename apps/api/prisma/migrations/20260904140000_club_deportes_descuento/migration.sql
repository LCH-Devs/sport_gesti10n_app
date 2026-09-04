-- Onboarding: deportes declarados + % descuento familiar.

ALTER TABLE "Club" ADD COLUMN "deportes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Club" ADD COLUMN "descuento_familiar_pct" DOUBLE PRECISION NOT NULL DEFAULT 0;
