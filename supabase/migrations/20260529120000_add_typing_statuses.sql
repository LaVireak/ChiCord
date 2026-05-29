-- Create typing_statuses to track ephemeral typing indicators per channel
CREATE TABLE IF NOT EXISTS public.typing_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id text NOT NULL,
  user_id uuid NOT NULL,
  is_typing boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT typing_unique_per_user_per_channel UNIQUE (channel_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_typing_channel_updated ON public.typing_statuses(channel_id, updated_at DESC);
