-- CreateEnum
CREATE TYPE "PublicationChannel" AS ENUM ('INSTAGRAM');

-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('DRAFT', 'SCHEDULED');

-- CreateTable
CREATE TABLE "publications" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "channel" "PublicationChannel" NOT NULL,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "publications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "publications_contentId_idx" ON "publications"("contentId");

-- AddForeignKey
ALTER TABLE "publications" ADD CONSTRAINT "publications_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "contents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
