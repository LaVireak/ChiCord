-- Create presence table to track online users per workspace
CREATE TABLE IF NOT EXISTS public.presence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  user_id uuid NOT NULL,
  is_online boolean NOT NULL DEFAULT true,
  last_seen timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT presence_unique_per_user_per_workspace UNIQUE (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_presence_workspace_online ON public.presence(workspace_id, is_online);
CREATE INDEX IF NOT EXISTS idx_presence_workspace_lastseen ON public.presence(workspace_id, last_seen DESC);
