/*
  # Fix: Restore active epoch so latest_player_values returns data

  ## Root Cause
  The `latest_player_values` view filters by the active epoch from `value_epochs`:

    WHERE pv.value_epoch_id = (
      SELECT id FROM value_epochs WHERE status = 'active'
      ORDER BY epoch_number DESC LIMIT 1
    )

  A failed `rebuild-player-values-v2` run called `create_new_epoch()` which:
  1. Archived the 'dynasty_2026_baseline' epoch (id = e5334014-f2b1-4569-b7d7-5e8c3411e7ab)
  2. Created a new empty epoch as 'active'
  3. Failed validation → left canonical data under the archived epoch

  Result: `latest_player_values` returns zero rows, breaking rankings,
  the trade calculator ("initializing player values"), and system health checks.

  ## Fix
  1. Archive any active epoch that has no canonical data (the empty leftover epoch)
  2. Restore 'active' status on the epoch that holds the dynasty_2026_baseline data
*/

-- Step 1: Archive empty active epochs (failed rebuild leftovers)
UPDATE value_epochs
SET status = 'archived'
WHERE status = 'active'
  AND id NOT IN (
    SELECT DISTINCT value_epoch_id
    FROM player_values_canonical
    WHERE value_epoch_id IS NOT NULL
  );

-- Step 2: Re-activate the epoch that has the actual canonical data.
-- Uses ON CONFLICT so this works whether the epoch was archived or never inserted.
INSERT INTO value_epochs (id, status, trigger_reason, created_by)
VALUES (
  'e5334014-f2b1-4569-b7d7-5e8c3411e7ab',
  'active',
  'dynasty_2026_baseline',
  'migration'
)
ON CONFLICT (id) DO UPDATE
  SET status = 'active';
