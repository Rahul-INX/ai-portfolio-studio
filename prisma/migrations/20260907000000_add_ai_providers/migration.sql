CREATE TYPE "AiProviderType" AS ENUM ('GEMINI', 'OPENAI', 'ANTHROPIC', 'XAI');

CREATE TABLE "AiProviderConfig" (
    "id" TEXT NOT NULL,
    "provider" "AiProviderType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL,
    "selectedModel" TEXT,
    "maxOutputTokens" INTEGER NOT NULL DEFAULT 1200,
    "dailyRequestLimit" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AiProviderConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiApiKey" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "encryptedValue" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "authTag" TEXT NOT NULL,
    "keyHint" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "lastTestedAt" TIMESTAMP(3),
    "lastTestStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AiApiKey_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AiProviderConfig_provider_key" ON "AiProviderConfig"("provider");
CREATE INDEX "AiApiKey_providerId_enabled_priority_idx" ON "AiApiKey"("providerId", "enabled", "priority");

ALTER TABLE "AiApiKey" ADD CONSTRAINT "AiApiKey_providerId_fkey"
FOREIGN KEY ("providerId") REFERENCES "AiProviderConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
