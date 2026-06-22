-- ============================================================
-- DOKAN — Migration 005: opening_hours default fix
-- Existing restaurants may have opening_hours = '{}'::jsonb
-- (empty object) if created before migration 003 was applied.
-- The app handles this gracefully via parseHours(), but fix
-- the data for cleanliness.
-- ============================================================

UPDATE restaurants
SET opening_hours = '{
  "sun": {"open": "08:00", "close": "23:00", "closed": false},
  "mon": {"open": "08:00", "close": "23:00", "closed": false},
  "tue": {"open": "08:00", "close": "23:00", "closed": false},
  "wed": {"open": "08:00", "close": "23:00", "closed": false},
  "thu": {"open": "08:00", "close": "23:00", "closed": false},
  "fri": {"open": "12:00", "close": "24:00", "closed": false},
  "sat": {"open": "08:00", "close": "24:00", "closed": false}
}'::jsonb
WHERE opening_hours IS NULL OR opening_hours = '{}'::jsonb;