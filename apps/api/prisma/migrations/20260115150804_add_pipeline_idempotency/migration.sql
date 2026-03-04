/*
  Warnings:

  - A unique constraint covering the columns `[input_key]` on the table `encode_jobs` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[object_key]` on the table `uploads` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "encode_jobs" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "encode_jobs_input_key_key" ON "encode_jobs"("input_key");

-- CreateIndex
CREATE UNIQUE INDEX "uploads_object_key_key" ON "uploads"("object_key");
