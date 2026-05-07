-- CreateTable
CREATE TABLE "RecurringExpiration" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT,
    "dayOfMonth" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringExpiration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecurringExpiration_studioId_idx" ON "RecurringExpiration"("studioId");

-- CreateIndex
CREATE INDEX "RecurringExpiration_clientId_idx" ON "RecurringExpiration"("clientId");

-- AddForeignKey
ALTER TABLE "RecurringExpiration" ADD CONSTRAINT "RecurringExpiration_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringExpiration" ADD CONSTRAINT "RecurringExpiration_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
