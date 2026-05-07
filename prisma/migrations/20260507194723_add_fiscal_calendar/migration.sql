-- CreateTable
CREATE TABLE "TaxRule" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "frecuencia" TEXT NOT NULL,
    "regla" TEXT NOT NULL,
    "diasVencimiento" INTEGER[],
    "mesesAplicacion" INTEGER[],
    "aplicaA" TEXT[],
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientTaxAssignment" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "taxRuleId" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientTaxAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaxRule_nombre_key" ON "TaxRule"("nombre");

-- CreateIndex
CREATE INDEX "ClientTaxAssignment_studioId_idx" ON "ClientTaxAssignment"("studioId");

-- CreateIndex
CREATE INDEX "ClientTaxAssignment_clientId_idx" ON "ClientTaxAssignment"("clientId");

-- CreateIndex
CREATE INDEX "ClientTaxAssignment_taxRuleId_idx" ON "ClientTaxAssignment"("taxRuleId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientTaxAssignment_studioId_clientId_taxRuleId_key" ON "ClientTaxAssignment"("studioId", "clientId", "taxRuleId");

-- AddForeignKey
ALTER TABLE "ClientTaxAssignment" ADD CONSTRAINT "ClientTaxAssignment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientTaxAssignment" ADD CONSTRAINT "ClientTaxAssignment_taxRuleId_fkey" FOREIGN KEY ("taxRuleId") REFERENCES "TaxRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientTaxAssignment" ADD CONSTRAINT "ClientTaxAssignment_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
