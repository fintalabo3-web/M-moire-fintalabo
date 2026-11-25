-- A suspended account must not retain moderator or administrator powers.
CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = (SELECT auth.uid())
      AND u.is_admin IS TRUE
      AND COALESCE(u.suspended, false) IS FALSE
  );
$function$;

CREATE OR REPLACE FUNCTION private.has_staff_permission(permission_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = (SELECT auth.uid())
      AND u.is_moderator IS TRUE
      AND COALESCE(u.suspended, false) IS FALSE
      AND COALESCE(u.permissions ->> permission_name, 'false') = 'true'
  );
$function$;

-- Internal guard for authenticated RPCs. Keep it in the non-exposed schema.
CREATE OR REPLACE FUNCTION private.require_active_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'Connexion requise';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = (SELECT auth.uid())
      AND COALESCE(u.suspended, false) IS FALSE
  ) THEN
    RAISE EXCEPTION 'Compte suspendu ou profil utilisateur introuvable';
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION private.require_active_user() FROM PUBLIC, anon, authenticated;

-- Add the guard to every user-facing SECURITY DEFINER RPC that requires an existing profile.
DO $migration$
DECLARE
  fn regprocedure;
  definition text;
  targets regprocedure[] := ARRAY[
    'public.accept_service_request(uuid)'::regprocedure,
    'public.add_gallery_photo(uuid,text)'::regprocedure,
    'public.add_gallery_photo(uuid,text,text)'::regprocedure,
    'public.add_provider_service(uuid,text,integer,text)'::regprocedure,
    'public.add_provider_service(uuid,text,numeric,text)'::regprocedure,
    'public.complete_service_request(uuid)'::regprocedure,
    'public.create_provider_profile(text,text,text,text,text,boolean,numeric,text,text)'::regprocedure,
    'public.create_provider_review(uuid,integer,text)'::regprocedure,
    'public.create_service_request(uuid,text,text,text)'::regprocedure,
    'public.create_sos_request(uuid,text,text,text)'::regprocedure,
    'public.delete_gallery_photo(uuid)'::regprocedure,
    'public.delete_provider_service(uuid)'::regprocedure,
    'public.mark_request_messages_read(uuid)'::regprocedure,
    'public.request_provider_subscription(text)'::regprocedure,
    'public.send_request_message(uuid,uuid,text)'::regprocedure,
    'public.update_own_profile(text,text,text)'::regprocedure,
    'public.update_provider_profile(uuid,text,text,text,text,text,boolean,numeric,text,text)'::regprocedure
  ];
BEGIN
  FOREACH fn IN ARRAY targets LOOP
    SELECT pg_get_functiondef(fn) INTO definition;
    IF position(E'\nBEGIN' IN upper(definition)) = 0 THEN
      RAISE EXCEPTION 'Cannot safely add active-user guard to %', fn;
    END IF;
    definition := regexp_replace(
      definition,
      E'\nBEGIN[[:space:]]*',
      E'\nBEGIN\n  PERFORM private.require_active_user();\n',
      'i'
    );
    EXECUTE definition;
  END LOOP;
END;
$migration$;

-- Do not allow an administrator to accidentally suspend their own administrative account.
DO $migration$
DECLARE
  definition text;
BEGIN
  SELECT pg_get_functiondef('public.admin_update_user(uuid,boolean,jsonb,boolean)'::regprocedure)
  INTO definition;
  definition := regexp_replace(
    definition,
    E'\nBEGIN[[:space:]]*',
    E'\nBEGIN\n  IF target_user_id = (SELECT auth.uid()) AND new_suspended IS TRUE THEN\n    RAISE EXCEPTION ''Impossible de suspendre son propre compte administrateur'';\n  END IF;\n',
    'i'
  );
  EXECUTE definition;
END;
$migration$;

CREATE OR REPLACE FUNCTION public.admin_set_provider_verified(
  target_provider_id uuid,
  new_verified boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NOT public.is_admin((SELECT auth.uid()))
     AND NOT private.has_staff_permission('validate_provider')
  THEN
    RAISE EXCEPTION 'Accès refusé : permission de validation requise';
  END IF;

  UPDATE public.providers
  SET verified = new_verified,
      updated_at = now()
  WHERE id = target_provider_id;

  RETURN FOUND;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_staff(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT CASE
    WHEN uid IS NULL OR uid IS DISTINCT FROM (SELECT auth.uid()) THEN false
    WHEN NOT EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = (SELECT auth.uid())
        AND COALESCE(u.suspended, false) IS FALSE
    ) THEN false
    ELSE (
      private.is_admin()
      OR EXISTS (
        SELECT 1
        FROM public.admin_staff s
        JOIN public.users u ON u.phone = s.phone
        WHERE u.id = (SELECT auth.uid())
          AND COALESCE(u.suspended, false) IS FALSE
      )
      OR private.has_staff_permission('view_requests')
    )
  END;
$function$;

CREATE OR REPLACE FUNCTION public.staff_suspend_user(
  target_user_id uuid,
  new_suspended boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  caller_is_admin boolean := false;
  caller_is_moderator boolean := false;
  caller_can_suspend boolean := false;
  target_is_admin boolean := false;
BEGIN
  PERFORM private.require_active_user();

  IF target_user_id IS NULL OR new_suspended IS NULL THEN
    RAISE EXCEPTION 'Paramètres de suspension invalides';
  END IF;

  SELECT
    COALESCE(u.is_admin, false),
    COALESCE(u.is_moderator, false),
    COALESCE(u.permissions ->> 'suspend_user', 'false') = 'true'
  INTO caller_is_admin, caller_is_moderator, caller_can_suspend
  FROM public.users u
  WHERE u.id = (SELECT auth.uid())
    AND COALESCE(u.suspended, false) IS FALSE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profil utilisateur introuvable ou suspendu';
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

-- Trigger function: fully qualify objects and recalculate both sides if provider_id changes.
CREATE OR REPLACE FUNCTION public.update_provider_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  old_provider_id uuid;
  new_provider_id uuid;
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    old_provider_id := OLD.provider_id;
  END IF;

  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    new_provider_id := NEW.provider_id;
  END IF;

  IF old_provider_id IS NOT NULL THEN
    UPDATE public.providers p
    SET rating = (
      SELECT round(avg(r.rating)::numeric, 1)
      FROM public.reviews r
      WHERE r.provider_id = old_provider_id
    )
    WHERE p.id = old_provider_id;
  END IF;

  IF new_provider_id IS NOT NULL AND new_provider_id IS DISTINCT FROM old_provider_id THEN
    UPDATE public.providers p
    SET rating = (
      SELECT round(avg(r.rating)::numeric, 1)
      FROM public.reviews r
      WHERE r.provider_id = new_provider_id
    )
    WHERE p.id = new_provider_id;
  END IF;

  RETURN NULL;
END;
$function$;
