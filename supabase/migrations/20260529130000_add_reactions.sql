-- Create reactions table to store per-message emoji reactions
CREATE TABLE IF NOT EXISTS public.reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reactions_unique_user_message_emoji UNIQUE (message_id, user_id, emoji),
  CONSTRAINT fk_message FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reactions_message ON public.reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_reactions_emoji ON public.reactions(emoji);
