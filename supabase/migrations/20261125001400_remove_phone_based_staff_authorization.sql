-- Do not authorize staff by a mutable phone number. Staff access is tied to
-- administrator status or explicit moderator permissions on the authenticated user row.
CREATE OR REPLACE FUNCTION public.is_staff(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT CASE
    WHEN uid IS NULL OR uid IS DISTINCT FROM (SELECT auth.uid()) THEN false
    ELSE (
      private.is_admin()
      OR private.has_staff_permission('view_requests')
    )
  END;
$function$;
