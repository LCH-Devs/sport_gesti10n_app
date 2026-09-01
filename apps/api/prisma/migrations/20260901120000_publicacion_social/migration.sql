-- Feed social entre clubes (torneos abiertos). Independiente de Noticia.

CREATE TABLE "PublicacionSocial" (
    "id" SERIAL NOT NULL,
    "club_id" INTEGER,
    "autor_tipo" TEXT NOT NULL,
    "autor_id" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "cuerpo" TEXT NOT NULL,
    "imagen_url" TEXT,
    "fecha_evento" TIMESTAMP(3),
    "lugar" TEXT,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "eliminado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicacionSocial_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "PublicacionSocial"
    ADD CONSTRAINT "PublicacionSocial_club_id_fkey"
    FOREIGN KEY ("club_id") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "PublicacionSocial_eliminado_visible_created_at_idx"
    ON "PublicacionSocial"("eliminado", "visible", "created_at");

CREATE INDEX "PublicacionSocial_club_id_eliminado_idx"
    ON "PublicacionSocial"("club_id", "eliminado");
