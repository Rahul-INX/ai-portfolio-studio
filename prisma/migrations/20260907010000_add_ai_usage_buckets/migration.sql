CREATE TABLE "AiUsageBucket" (
    "provider" "AiProviderType" NOT NULL,
    "day" DATE NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiUsageBucket_pkey" PRIMARY KEY ("provider", "day")
);
