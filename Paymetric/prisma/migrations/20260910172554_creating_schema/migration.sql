-- CreateEnum
CREATE TYPE "StandardLevel" AS ENUM ('L1', 'L2', 'L3', 'L4', 'L5', 'L6');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameCanonical" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyLevelMapping" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nativeLevel" TEXT NOT NULL,
    "standardLevel" "StandardLevel" NOT NULL,
    "yoeMin" INTEGER NOT NULL,
    "yoeMax" INTEGER NOT NULL,
    "scopeWeight" INTEGER NOT NULL,
    "levelIndex" INTEGER NOT NULL,
    "totalLevels" INTEGER NOT NULL,
    "levelScore" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyLevelMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompensationEntry" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "nativeLevel" TEXT NOT NULL,
    "standardLevel" "StandardLevel" NOT NULL,
    "levelScore" INTEGER NOT NULL,
    "location" TEXT NOT NULL,
    "baseSalary" INTEGER NOT NULL,
    "bonus" INTEGER NOT NULL DEFAULT 0,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "totalComp" INTEGER NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompensationEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_nameCanonical_key" ON "Company"("nameCanonical");

-- CreateIndex
CREATE INDEX "Company_nameCanonical_idx" ON "Company"("nameCanonical");

-- CreateIndex
CREATE INDEX "CompanyLevelMapping_standardLevel_idx" ON "CompanyLevelMapping"("standardLevel");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyLevelMapping_companyId_nativeLevel_key" ON "CompanyLevelMapping"("companyId", "nativeLevel");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE INDEX "CompensationEntry_standardLevel_location_idx" ON "CompensationEntry"("standardLevel", "location");

-- CreateIndex
CREATE INDEX "CompensationEntry_companyId_idx" ON "CompensationEntry"("companyId");

-- CreateIndex
CREATE INDEX "CompensationEntry_totalComp_idx" ON "CompensationEntry"("totalComp");

-- AddForeignKey
ALTER TABLE "CompanyLevelMapping" ADD CONSTRAINT "CompanyLevelMapping_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompensationEntry" ADD CONSTRAINT "CompensationEntry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompensationEntry" ADD CONSTRAINT "CompensationEntry_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
