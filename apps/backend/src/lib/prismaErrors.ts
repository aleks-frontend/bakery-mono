/**
 * Prisma 7's pg driver adapter surfaces constraint violations as a raw
 * `DriverAdapterError` (name/cause.code from the underlying pg error), not the
 * usual `PrismaClientKnownRequestError` with a P20xx code — so callers can't
 * rely on `instanceof Prisma.PrismaClientKnownRequestError` here.
 */
export function isForeignKeyViolation(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (error.name !== "DriverAdapterError") return false;

  const cause = (error as { cause?: { code?: string } }).cause;
  return cause?.code === "23503" || cause?.code === "23001";
}
