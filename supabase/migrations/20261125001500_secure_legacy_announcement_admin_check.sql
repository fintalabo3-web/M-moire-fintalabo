-- This legacy announcement overload must use the canonical active-admin check too.
CREATE OR REPLACE FUNCTION public.admin_create_announcement(
  new_text text,
  new_title text DEFAULT NULL,
  new_type text DEFAULT 'text',
  new_media_url text DEFAULT NULL,
  new_link_url text DEFAULT NULL,
  new_audience text DEFAULT 'all',
  new_audience_value text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  new_id uuid;
BEGIN
  IF NOT private.is_admin() THEN
    RAISE EXCEPTION 'Accès réservé à un administrateur actif';
  END IF;

  IF COALESCE(trim(new_text), '') = ''
     AND COALESCE(trim(new_title), '') = ''
     AND COALESCE(trim(new_media_url), '') = ''
     AND COALESCE(trim(new_link_url), '') = ''
  THEN
    RAISE EXCEPTION 'Une annonce doit contenir du texte, un média ou un lien';
  END IF;

  INSERT INTO public.announcements (
    text, title, type, media_url, link_url, audience, audience_value, active
  ) VALUES (
    COALESCE(new_text, ''),
    new_title,
    COALESCE(new_type, 'text'),
    new_media_url,
    new_link_url,
    COALESCE(new_audience, 'all'),
    new_audience_value,
    true
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$function$;
