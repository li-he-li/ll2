-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "secondmeId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" DATETIME,
    "name" TEXT,
    "email" TEXT,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "bargain_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "publisherId" TEXT NOT NULL,
    "bargainerId" TEXT NOT NULL,
    "publishPrice" INTEGER NOT NULL,
    "currentPrice" INTEGER NOT NULL,
    "targetPrice" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'negotiating',
    "finalPrice" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "bargain_sessions_publisherId_fkey" FOREIGN KEY ("publisherId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "bargain_sessions_bargainerId_fkey" FOREIGN KEY ("bargainerId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bargain_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderRole" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isFromAI" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "bargain_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "bargain_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "publishPrice" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "publisherId" TEXT NOT NULL,
    "category" TEXT,
    "durationDays" INTEGER NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "products_publisherId_fkey" FOREIGN KEY ("publisherId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_secondmeId_key" ON "users"("secondmeId");

-- CreateIndex
CREATE INDEX "products_publisherId_status_idx" ON "products"("publisherId", "status");

-- CreateIndex
CREATE INDEX "products_status_expiresAt_idx" ON "products"("status", "expiresAt");
