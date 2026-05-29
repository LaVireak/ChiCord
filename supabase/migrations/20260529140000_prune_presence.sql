-- Server-side pruning for stale presence rows
-- This creates a function that marks presence rows as offline
-- when `last_seen` is older than the configured threshold.
-- It also attempts to schedule this function using pg_cron.

-- Threshold (in seconds) for considering a presence row stale
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_settings WHERE name = 'chiCord.presence_stale_seconds') THEN
    PERFORM set_config('chiCord.presence_stale_seconds', '35', true);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.prune_stale_presence()
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  threshold_interval interval;
  seconds_text text := current_setting('chiCord.presence_stale_seconds', true);
BEGIN
  IF seconds_text IS NULL OR seconds_text = '' THEN
    threshold_interval := INTERVAL '35 seconds';
  ELSE
    threshold_interval := (seconds_text || ' seconds')::interval;
  END IF;

  -- Mark users offline if last_seen is older than threshold
  UPDATE public.presence
  SET is_online = false
  WHERE is_online = true
    AND last_seen < now() - threshold_interval;
END;
$$;

-- Try to schedule via pg_cron if available. This will run every minute.
-- If pg_cron is not installed/available, this will fail silently for users.
DO $$
BEGIN
  -- create extension if allowed (may fail on managed hosts without permission)
  BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
  EXCEPTION WHEN others THEN
    -- ignore
    RAISE NOTICE 'pg_cron extension not installed or not available';
  END;

  -- If pg_cron is available, schedule the job to run every minute
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Use a distinct dollar-quote tag for the inner SQL string to avoid nesting conflicts
    PERFORM cron.schedule('prune_presence_every_minute', '*/1 * * * *', $job$SELECT public.prune_stale_presence();$job$);
  ELSE
    RAISE NOTICE 'pg_cron not available; please schedule prune_stale_presence() using your preferred scheduler';
  END IF;
END$$;

-- Alternative: If your Supabase project cannot install pg_cron, run the following periodically
-- from your server or an Edge Function:
-- SELECT public.prune_stale_presence();

-- NOTE: If the scheduled job already exists (e.g., migration re-run), pg_cron will create a second entry.
-- You may want to inspect pg_cron.job and remove duplicates manually.
