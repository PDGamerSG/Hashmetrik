-- Suspension is a column rather than a third `UserStatus`, because status says
-- where someone sits commercially and suspending a client should not erase the
-- fact that they are one. Nullable, so every existing row is in good standing.
ALTER TABLE "User" ADD COLUMN "suspendedAt" TIMESTAMP(3);
