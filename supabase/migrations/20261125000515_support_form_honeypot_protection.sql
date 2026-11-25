-- Add a lightweight honeypot to the public contact form while keeping anonymous support available.
-- The previous three-argument RPC is disabled so callers must use the guarded signature.
REVOKE EXECUTE ON FUNCTION public.submit_support_message(text, text, text) FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.submit_support_message(
  new_name text,
  new_phone text,
  new_message text,
  new_website text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  normalized_phone text;
  recent_count integer;
  created_id uuid;
BEGIN
  -- Automated form fillers commonly populate every text input. Silently discard these.
  IF COALESCE(trim(new_website), '') <> '' THEN
    RETURN pg_catalog.gen_random_uuid();
  END IF;

  normalized_phone := regexp_replace(COALESCE(new_phone, ''), '[^0-9]', '', 'g');

  IF new_name IS NULL OR length(trim(new_name)) < 2 OR length(trim(new_name)) > 100 THEN
    RAISE EXCEPTION 'Veuillez indiquer un nom valide';
  END IF;
  IF length(normalized_phone) < 6 OR length(normalized_phone) > 15 THEN
    RAISE EXCEPTION 'Veuillez indiquer un numéro de téléphone valide';
  END IF;
  IF new_message IS NULL OR length(trim(new_message)) < 10 OR length(trim(new_message)) > 3000 THEN
    RAISE EXCEPTION 'Le message doit contenir entre 10 et 3000 caractères';
  END IF;

  SELECT count(*) INTO recent_count
  FROM public.support_messages sm
  WHERE regexp_replace(sm.phone, '[^0-9]', '', 'g') = normalized_phone
    AND sm.created_at > now() - interval '1 hour';

  IF recent_count >= 3 THEN
    RAISE EXCEPTION 'Limite atteinte : réessayez dans une heure';
  END IF;

  INSERT INTO public.support_messages(user_id, name, phone, message)
  VALUES ((SELECT auth.uid()), trim(new_name), trim(new_phone), trim(new_message))
  RETURNING id INTO created_id;

  RETURN created_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.submit_support_message(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_support_message(text, text, text, text) TO anon, authenticated, service_role;
