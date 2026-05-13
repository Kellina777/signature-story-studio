-- Allow anonymous interview flow gated by an unguessable session token.

-- interviews
ALTER TABLE public.interviews ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS session_id text;
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS email text;
CREATE INDEX IF NOT EXISTS interviews_session_id_idx ON public.interviews(session_id);

DROP POLICY IF EXISTS "owner read interviews" ON public.interviews;
DROP POLICY IF EXISTS "owner insert interviews" ON public.interviews;
DROP POLICY IF EXISTS "owner update interviews" ON public.interviews;
DROP POLICY IF EXISTS "owner delete interviews" ON public.interviews;

CREATE POLICY "anon insert interviews" ON public.interviews
  FOR INSERT WITH CHECK (user_id IS NULL AND session_id IS NOT NULL);
CREATE POLICY "anon read interviews" ON public.interviews
  FOR SELECT USING (user_id IS NULL AND session_id IS NOT NULL);
CREATE POLICY "anon update interviews" ON public.interviews
  FOR UPDATE USING (user_id IS NULL AND session_id IS NOT NULL);
CREATE POLICY "anon delete interviews" ON public.interviews
  FOR DELETE USING (user_id IS NULL AND session_id IS NOT NULL);

-- interview_messages
ALTER TABLE public.interview_messages ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.interview_messages ADD COLUMN IF NOT EXISTS session_id text;
CREATE INDEX IF NOT EXISTS interview_messages_session_id_idx ON public.interview_messages(session_id);

DROP POLICY IF EXISTS "owner read messages" ON public.interview_messages;
DROP POLICY IF EXISTS "owner insert messages" ON public.interview_messages;
DROP POLICY IF EXISTS "owner delete messages" ON public.interview_messages;

CREATE POLICY "anon insert messages" ON public.interview_messages
  FOR INSERT WITH CHECK (user_id IS NULL AND session_id IS NOT NULL);
CREATE POLICY "anon read messages" ON public.interview_messages
  FOR SELECT USING (user_id IS NULL AND session_id IS NOT NULL);
CREATE POLICY "anon delete messages" ON public.interview_messages
  FOR DELETE USING (user_id IS NULL AND session_id IS NOT NULL);

-- blueprints
ALTER TABLE public.blueprints ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.blueprints ADD COLUMN IF NOT EXISTS email text;

DROP POLICY IF EXISTS "owner read blueprints" ON public.blueprints;
DROP POLICY IF EXISTS "owner insert blueprints" ON public.blueprints;
DROP POLICY IF EXISTS "owner update blueprints" ON public.blueprints;
DROP POLICY IF EXISTS "owner delete blueprints" ON public.blueprints;

CREATE POLICY "anon insert blueprints" ON public.blueprints
  FOR INSERT WITH CHECK (user_id IS NULL);
-- "public read blueprints by link" already exists and remains.