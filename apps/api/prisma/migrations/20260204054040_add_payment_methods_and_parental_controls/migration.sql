-- CreateEnum
CREATE TYPE "MaturityRating" AS ENUM ('G', 'PG', 'PG_13', 'R', 'NC_17');

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "max_rating" "MaturityRating" NOT NULL DEFAULT 'NC_17',
ADD COLUMN     "pin_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pin_hash" VARCHAR(255);

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "brand" VARCHAR(50) NOT NULL,
    "last4" VARCHAR(4) NOT NULL,
    "exp_month" INTEGER NOT NULL,
    "exp_year" INTEGER NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_methods_user_id_idx" ON "payment_methods"("user_id");

-- AddForeignKey
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
