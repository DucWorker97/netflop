-- AlterTable
ALTER TABLE "users" ADD COLUMN     "disabled_at" TIMESTAMPTZ,
ADD COLUMN     "disabled_reason" VARCHAR(500),
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;
