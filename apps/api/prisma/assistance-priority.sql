-- Prisma db push does not manage the legacy database's check constraints.
ALTER TABLE assistance_requests
  DROP CONSTRAINT IF EXISTS ck_assistance_requests_priority,
  ADD CONSTRAINT ck_assistance_requests_priority
    CHECK (priority IN ('Low', 'Normal', 'High', 'Urgent'));
