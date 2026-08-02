-- The lead pipeline was new → contacted → qualified → closed. The PRD names six
-- stages: Lead, Qualified, Consultation, Proposal, Negotiation, Client. `status`
-- is a string column precisely so renaming a stage costs no schema change, but
-- the rows already written still have to land somewhere sensible.
--
-- `contacted` becomes `qualified` (it is the stage that follows first contact)
-- and `closed` becomes `lost` — the won case now ends at `client`, and a closed
-- lead that actually converted will have a client account to prove it.
UPDATE "Lead" SET "status" = 'qualified' WHERE "status" = 'contacted';
UPDATE "Lead" SET "status" = 'lost' WHERE "status" = 'closed';
