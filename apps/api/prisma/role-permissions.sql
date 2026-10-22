-- Keep legacy constraints and normalized email uniqueness alongside Prisma db push.
BEGIN;

DO $$
DECLARE
  conflicting_ids text;
BEGIN
  -- A fresh database is created by db push; its second upgrade pass installs checks.
  IF to_regclass('users') IS NULL THEN
    RETURN;
  END IF;

  LOCK TABLE users IN SHARE ROW EXCLUSIVE MODE;
  SELECT string_agg(ids, '; ')
    INTO conflicting_ids
    FROM (
      SELECT string_agg(user_id::text, ', ' ORDER BY user_id) AS ids
      FROM users
      GROUP BY lower(btrim(email))
      HAVING count(*) > 1
    ) conflicts;
  IF conflicting_ids IS NOT NULL THEN
    RAISE EXCEPTION 'Normalized email conflicts for user IDs: %. Resolve these accounts before upgrading; no users were merged or deleted.', conflicting_ids;
  END IF;

  ALTER TABLE users ADD COLUMN IF NOT EXISTS faculty_designation varchar(50);

  SELECT string_agg(user_id::text, ', ' ORDER BY user_id)
    INTO conflicting_ids
    FROM users
    WHERE role NOT IN ('ChapterOfficer', 'FacultyRepresentative', 'RegionalOfficer', 'RegionalAdmin');
  IF conflicting_ids IS NOT NULL THEN
    RAISE EXCEPTION 'Unsupported roles for user IDs: %. Correct these records before upgrading.', conflicting_ids;
  END IF;

  SELECT string_agg(user_id::text, ', ' ORDER BY user_id)
    INTO conflicting_ids
    FROM users
    WHERE role IN ('ChapterOfficer', 'FacultyRepresentative') AND chapter_id IS NULL;
  IF conflicting_ids IS NOT NULL THEN
    RAISE EXCEPTION 'Missing institutional affiliation for user IDs: %. Assign a registered chapter before upgrading.', conflicting_ids;
  END IF;

  SELECT string_agg(user_id::text, ', ' ORDER BY user_id)
    INTO conflicting_ids
    FROM users
    WHERE role = 'FacultyRepresentative'
      AND (faculty_designation IS NULL OR faculty_designation NOT IN ('Professor', 'Faculty Adviser', 'Program Coordinator', 'Other'));
  IF conflicting_ids IS NOT NULL THEN
    RAISE EXCEPTION 'Missing or unsupported faculty designation for user IDs: %. Correct these records before upgrading.', conflicting_ids;
  END IF;

  UPDATE users SET email = lower(btrim(email)) WHERE email <> lower(btrim(email));
  CREATE UNIQUE INDEX IF NOT EXISTS ux_users_email_normalized ON users (lower(btrim(email)));

  ALTER TABLE users
    DROP CONSTRAINT IF EXISTS ck_users_role,
    ADD CONSTRAINT ck_users_role CHECK (role IN ('ChapterOfficer', 'FacultyRepresentative', 'RegionalOfficer', 'RegionalAdmin')),
    DROP CONSTRAINT IF EXISTS ck_users_affiliation,
    ADD CONSTRAINT ck_users_affiliation CHECK (role NOT IN ('ChapterOfficer', 'FacultyRepresentative') OR chapter_id IS NOT NULL),
    DROP CONSTRAINT IF EXISTS ck_users_faculty_designation,
    ADD CONSTRAINT ck_users_faculty_designation CHECK (role <> 'FacultyRepresentative' OR (faculty_designation IS NOT NULL AND faculty_designation IN ('Professor', 'Faculty Adviser', 'Program Coordinator', 'Other')));

  CREATE TABLE IF NOT EXISTS content_actions (
    content_action_id bigserial PRIMARY KEY,
    resource varchar(30) NOT NULL,
    resource_id bigint NOT NULL,
    action varchar(30) NOT NULL,
    actor_user_id bigint,
    created_at timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT content_actions_actor_user_id_fkey FOREIGN KEY (actor_user_id)
      REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE
  );
  CREATE INDEX IF NOT EXISTS ix_content_actions_resource ON content_actions (resource, resource_id, created_at);
END $$;

DO $$
DECLARE
  conflicting_ids text;
BEGIN
  IF to_regclass('events') IS NULL THEN
    RETURN;
  END IF;

  ALTER TABLE events
    ADD COLUMN IF NOT EXISTS scope varchar(20) NOT NULL DEFAULT 'Regional',
    ADD COLUMN IF NOT EXISTS published_at timestamptz(6);

  SELECT string_agg(event_id::text, ', ' ORDER BY event_id)
    INTO conflicting_ids
    FROM events
    WHERE scope IS NOT NULL AND scope NOT IN ('Regional', 'Chapter', 'Academic');
  IF conflicting_ids IS NOT NULL THEN
    RAISE EXCEPTION 'Unsupported scopes for event IDs: %. Correct these records before upgrading.', conflicting_ids;
  END IF;

  -- Legacy events remain regional; an institutional organizer alone is not evidence of scope.
  UPDATE events SET scope = 'Regional' WHERE scope IS NULL;
  ALTER TABLE events
    ALTER COLUMN scope SET DEFAULT 'Regional',
    ALTER COLUMN scope SET NOT NULL,
    DROP CONSTRAINT IF EXISTS ck_events_scope,
    ADD CONSTRAINT ck_events_scope CHECK (scope IN ('Regional', 'Chapter', 'Academic'));
  CREATE INDEX IF NOT EXISTS ix_events_creator ON events (created_by_user_id);
  CREATE INDEX IF NOT EXISTS ix_events_scope_published ON events (scope, is_published);
END $$;

COMMIT;
