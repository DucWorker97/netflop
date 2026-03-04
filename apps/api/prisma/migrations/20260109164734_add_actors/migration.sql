-- CreateTable
CREATE TABLE "actors" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "avatar_url" VARCHAR(1000),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "actors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movie_actors" (
    "movie_id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,
    "role" VARCHAR(255),

    CONSTRAINT "movie_actors_pkey" PRIMARY KEY ("movie_id","actor_id")
);

-- CreateIndex
CREATE INDEX "movie_actors_actor_id_idx" ON "movie_actors"("actor_id");

-- AddForeignKey
ALTER TABLE "movie_actors" ADD CONSTRAINT "movie_actors_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_actors" ADD CONSTRAINT "movie_actors_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "actors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
