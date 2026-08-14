-- AlterTable
ALTER TABLE "Club" ALTER COLUMN "color_secundario" DROP NOT NULL,
ALTER COLUMN "color_secundario" DROP DEFAULT,
ALTER COLUMN "color_terciario" DROP NOT NULL,
ALTER COLUMN "color_terciario" DROP DEFAULT;
