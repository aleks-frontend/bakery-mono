-- CreateTable
CREATE TABLE "repeating_order_clone_failures" (
    "id" TEXT NOT NULL,
    "errors" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedOrderId" TEXT,
    "cycleId" TEXT NOT NULL,
    "repeatingOrderId" TEXT NOT NULL,

    CONSTRAINT "repeating_order_clone_failures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "repeating_order_clone_failures_cycleId_idx" ON "repeating_order_clone_failures"("cycleId");

-- AddForeignKey
ALTER TABLE "repeating_order_clone_failures" ADD CONSTRAINT "repeating_order_clone_failures_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repeating_order_clone_failures" ADD CONSTRAINT "repeating_order_clone_failures_repeatingOrderId_fkey" FOREIGN KEY ("repeatingOrderId") REFERENCES "repeating_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
