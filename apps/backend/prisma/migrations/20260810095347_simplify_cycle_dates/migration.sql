-- AlterTable
ALTER TABLE "cycles" DROP COLUMN "orderWindowClosesAt",
ADD COLUMN     "nextCycleStartDate" TIMESTAMP(3);
