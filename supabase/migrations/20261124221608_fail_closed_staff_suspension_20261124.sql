-- FasoService: make account suspension authorization fail closed.
-- Explicitly reject missing auth/profile/target and NULL decisions.

CREATE OR REPLACE FUNCTION public.staff_suspend_user(
  target_user_id uuid,
  new_suspended boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  caller_is_admin boolean := false;
  caller_is_moderator boolean := false;
  caller_can_suspend boolean := false;
  target_is_admin boolean := false;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifié';
  END IF;

  IF target_user_id IS NULL OR new_suspended IS NULL THEN
    RAISE EXCEPTION 'Paramètres de suspension invalides';
  END IF;

  SELECT
    COALESCE(u.is_admin, false),
    COALESCE(u.is_moderator, false),
    COALESCE(u.permissions ->> 'suspend_user', 'false') = 'true'
  INTO
    caller_is_admin,
    caller_is_moderator,
    caller_can_suspend
  FROM public.users u
  WHERE u.id = (SELECT auth.uid());

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profil utilisateur introuvable';
  END IF;

  IF NOT (
    caller_is_admin
    OR (caller_is_moderator AND caller_can_suspend)
  ) THEN
    RAISE EXCEPTION 'Accès refusé : permission de suspension requise';
  END IF;

  IF target_user_id = (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'Impossible de suspendre son propre compte';
  END IF;

  SELECT COALESCE(u.is_admin, false)
  INTO target_is_admin
  FROM public.users u
  WHERE u.id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Utilisateur cible introuvable';
  END IF;

  IF target_is_admin AND NOT caller_is_admin THEN
    RAISE EXCEPTION 'Un modérateur ne peut pas suspendre un administrateur';
  END IF;

  UPDATE public.users
  SET suspended = new_suspended
  WHERE id = target_user_id;

  RETURN FOUND;
END;
$function$;

REVOKE ALL ON FUNCTION public.staff_suspend_user(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.staff_suspend_user(uuid, boolean) TO authenticated, service_role;
