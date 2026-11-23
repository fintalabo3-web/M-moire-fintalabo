-- FasoService : annonces multimédias
-- À exécuter une seule fois dans Supabase > SQL Editor.

alter table public.announcements
  add column if not exists title text,
  add column if not exists media jsonb not null default '[]'::jsonb,
  add column if not exists link_url text,
  add column if not exists link_label text;

create or replace function public.admin_create_rich_announcement(
  new_title text default null,
  new_text text default null,
  new_media jsonb default '[]'::jsonb,
  new_link_url text default null,
  new_link_label text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  created_id uuid;
begin
  if not exists (
    select 1
    from public.users
    where id = auth.uid()
      and is_admin is true
  ) then
    raise exception 'Accès réservé au propriétaire';
  end if;

  if coalesce(trim(new_title), '') = ''
     and coalesce(trim(new_text), '') = ''
     and coalesce(jsonb_array_length(coalesce(new_media, '[]'::jsonb)), 0) = 0
     and coalesce(trim(new_link_url), '') = '' then
    raise exception 'Une annonce doit contenir du texte ou un média';
  end if;

  insert into public.announcements (title, text, media, link_url, link_label)
  values (
    nullif(trim(new_title), ''),
    coalesce(trim(new_text), ''),
    coalesce(new_media, '[]'::jsonb),
    nullif(trim(new_link_url), ''),
    nullif(trim(new_link_label), '')
  )
  returning id into created_id;

  return created_id;
end;
$$;

revoke all on function public.admin_create_rich_announcement(text, text, jsonb, text, text) from public;
grant execute on function public.admin_create_rich_announcement(text, text, jsonb, text, text) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'announcements-media',
  'announcements-media',
  true,
  104857600,
  array[
    'image/jpeg','image/png','image/webp','image/gif',
    'audio/mpeg','audio/mp4','audio/aac','audio/ogg','audio/wav','audio/webm',
    'video/mp4','video/webm','video/quicktime'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Announcement media public read" on storage.objects;
create policy "Announcement media public read"
on storage.objects for select
using (bucket_id = 'announcements-media');

drop policy if exists "Announcement media admin upload" on storage.objects;
create policy "Announcement media admin upload"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'announcements-media'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1 from public.users
    where id = auth.uid() and is_admin is true
  )
);

drop policy if exists "Announcement media admin delete" on storage.objects;
create policy "Announcement media admin delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'announcements-media'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1 from public.users
    where id = auth.uid() and is_admin is true
  )
);
