-- CreateTable
CREATE TABLE IF NOT EXISTS "PostMedia" (
    "postId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostMedia_pkey" PRIMARY KEY ("postId","mediaId")
);

-- CreateIndex (only if they don't exist)
CREATE INDEX IF NOT EXISTS "PostMedia_postId_idx" ON "PostMedia"("postId");
CREATE INDEX IF NOT EXISTS "PostMedia_mediaId_idx" ON "PostMedia"("mediaId");

-- AddForeignKey (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PostMedia_postId_fkey') THEN
        ALTER TABLE "PostMedia" ADD CONSTRAINT "PostMedia_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PostMedia_mediaId_fkey') THEN
        ALTER TABLE "PostMedia" ADD CONSTRAINT "PostMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- Migrate existing data (only if PostMedia table is empty)
INSERT INTO "PostMedia" ("postId", "mediaId", "createdAt")
SELECT "postId", "id", NOW()
FROM "Media"
WHERE "postId" IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM "PostMedia" WHERE "PostMedia"."postId" = "Media"."postId" AND "PostMedia"."mediaId" = "Media"."id");

-- DropForeignKey (only if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Media_postId_fkey') THEN
        ALTER TABLE "Media" DROP CONSTRAINT "Media_postId_fkey";
    END IF;
END $$;

-- DropIndex (only if it exists)
DROP INDEX IF EXISTS "Media_postId_idx";

-- AlterTable (only if column exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Media' AND column_name = 'postId') THEN
        ALTER TABLE "Media" DROP COLUMN "postId";
    END IF;
END $$;