-- Hide provider profiles owned by suspended or deleted accounts from public discovery.
-- Legacy provider rows without an owner remain visible.
CREATE OR REPLACE FUNCTION private.provider_owner_is_active(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT target_user_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = target_user_id
        AND u.suspended IS NOT TRUE
    );
$function$;

REVOKE ALL ON FUNCTION private.provider_owner_is_active(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.provider_owner_is_active(uuid) TO anon, authenticated;

DROP POLICY IF EXISTS "providers public read" ON public.providers;
CREATE POLICY "providers public read"
ON public.providers
FOR SELECT
TO public
USING (private.provider_owner_is_active(user_id));
