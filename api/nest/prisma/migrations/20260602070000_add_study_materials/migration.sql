-- CreateEnum
CREATE TYPE "StudyMaterialCategory" AS ENUM ('exam', 'textbook', 'other');

-- CreateTable
CREATE TABLE "study_materials" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "StudyMaterialCategory" NOT NULL,
    "file_url" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size_bytes" INTEGER NOT NULL,
    "uploader_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_materials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "study_materials_uploader_id_created_at_idx" ON "study_materials"("uploader_id", "created_at");

-- CreateIndex
CREATE INDEX "study_materials_category_created_at_idx" ON "study_materials"("category", "created_at");

-- CreateIndex
CREATE INDEX "study_materials_created_at_idx" ON "study_materials"("created_at");

-- AddForeignKey
ALTER TABLE "study_materials" ADD CONSTRAINT "study_materials_uploader_id_fkey"
FOREIGN KEY ("uploader_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
