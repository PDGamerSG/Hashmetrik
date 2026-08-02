-- Team members assigned to a client, beyond the single account manager.
-- `Client.accountManagerId` stays exactly as it was: it answers "who picks up
-- the phone", which is a different question from "who works on this".
CREATE TABLE "ClientAssignment" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "teamMemberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClientAssignment_clientId_teamMemberId_key" ON "ClientAssignment"("clientId", "teamMemberId");
CREATE INDEX "ClientAssignment_teamMemberId_idx" ON "ClientAssignment"("teamMemberId");

ALTER TABLE "ClientAssignment" ADD CONSTRAINT "ClientAssignment_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClientAssignment" ADD CONSTRAINT "ClientAssignment_teamMemberId_fkey"
    FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Everyone who is already an account manager is, self-evidently, on that
-- account. Seeding the join from the column means the team pages do not
-- suddenly show one person fewer than they did yesterday.
INSERT INTO "ClientAssignment" ("id", "clientId", "teamMemberId")
SELECT gen_random_uuid()::text, "id", "accountManagerId"
FROM "Client"
WHERE "accountManagerId" IS NOT NULL;
