-- Resolve recursive RLS evaluation in the moderator user-read policy.
-- The SECURITY DEFINER helper reads only the current caller's own permission.
CREATE OR REPLACE FUNCTION private.has_staff_permission(permission_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = (SELECT auth.uid())
      AND u.is_moderator IS TRUE
      AND COALESCE(u.permissions ->> permission_name, 'false') = 'true'
  );
$function$;

REVOKE ALL ON FUNCTION private.has_staff_permission(text) FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.has_staff_permission(text) TO authenticated, service_role;

DROP POLICY IF EXISTS "users admin read all" ON public.users;
CREATE POLICY "users admin read all"
ON public.users
FOR SELECT
TO authenticated
USING (
  public.is_admin((SELECT auth.uid()))
  OR (SELECT private.has_staff_permission('view_users'))
);
