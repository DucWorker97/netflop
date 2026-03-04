/*
  Warnings:

  - A unique constraint covering the columns `[tmdb_id]` on the table `movies` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "movies" ADD COLUMN     "original_language" VARCHAR(10),
ADD COLUMN     "popularity" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "tmdb_id" INTEGER,
ADD COLUMN     "trailer_url" VARCHAR(500),
ADD COLUMN     "vote_average" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "vote_count" INTEGER DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "movies_tmdb_id_key" ON "movies"("tmdb_id");
