-- AlterTable
ALTER TABLE "cycles" DROP COLUMN "holidayMessage",
ADD COLUMN     "holidayMessageEn" TEXT,
ADD COLUMN     "holidayMessageSr" TEXT,
ADD COLUMN     "holidayMessageHu" TEXT;
