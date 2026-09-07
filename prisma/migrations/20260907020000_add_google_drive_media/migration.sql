CREATE TYPE "MediaProvider" AS ENUM ('GOOGLE_DRIVE');

CREATE TABLE "DriveConnection" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "accountEmail" TEXT,
    "encryptedValue" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "authTag" TEXT NOT NULL,
    "rootFolderId" TEXT NOT NULL,
    "folderIds" JSONB NOT NULL,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVerifiedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DriveConnection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "provider" "MediaProvider" NOT NULL DEFAULT 'GOOGLE_DRIVE',
    "externalId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "folder" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trashedAt" TIMESTAMP(3),
    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MediaAsset_externalId_key" ON "MediaAsset"("externalId");
CREATE INDEX "MediaAsset_folder_createdAt_idx" ON "MediaAsset"("folder", "createdAt");
