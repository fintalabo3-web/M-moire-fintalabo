-- FasoService platform upgrade — additive, data-preserving migration
create schema if not exists private;
revoke create on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.users u where u.id = (select auth.uid()) and u.is_admin is true); $$;
revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

create or replace function public.add_gallery_photo(new_provider_id uuid,new_photo_url text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare new_id uuid; media_kind text := 'image';
begin
  if (select auth.uid()) is null then raise exception 'Connexion requise'; end if;
  if not exists(select 1 from public.providers p where p.id=new_provider_id and p.user_id=(select auth.uid())) and not private.is_admin() then raise exception 'Accès refusé : profil prestataire non autorisé'; end if;
  if new_photo_url is null or trim(new_photo_url)='' or new_photo_url !~* '^https?://' then raise exception 'URL du média invalide'; end if;
  if new_photo_url ~* '\.(mp4|webm|mov)(\?|$)' then media_kind := 'video'; end if;
  insert into public.gallery(provider_id,photo_url,media_type) values(new_provider_id,trim(new_photo_url),media_kind) returning id into new_id;
  return new_id;
end; $$;

create or replace function public.add_gallery_photo(new_provider_id uuid,new_photo_url text,new_caption text default null)
returns boolean language plpgsql security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is null then raise exception 'Connexion requise'; end if;
  if not exists(select 1 from public.providers p where p.id=new_provider_id and p.user_id=(select auth.uid())) and not private.is_admin() then raise exception 'Accès refusé : profil prestataire non autorisé'; end if;
  if new_photo_url is null or trim(new_photo_url)='' or new_photo_url !~* '^https?://' then raise exception 'URL du média invalide'; end if;
  insert into public.gallery(provider_id,photo_url,caption) values(new_provider_id,trim(new_photo_url),nullif(trim(new_caption),''));
  return true;
end; $$;

create or replace function public.add_provider_service(new_provider_id uuid,new_name text,new_price integer default null,new_unit text default 'forfait')
returns uuid language plpgsql security definer set search_path = ''
as $$
declare new_id uuid;
begin
  if (select auth.uid()) is null then raise exception 'Connexion requise'; end if;
  if not exists(select 1 from public.providers p where p.id=new_provider_id and p.user_id=(select auth.uid())) and not private.is_admin() then raise exception 'Accès refusé : profil prestataire non autorisé'; end if;
  if new_name is null or length(trim(new_name))<2 then raise exception 'Nom du service obligatoire'; end if;
  if new_price is null or new_price<=0 then raise exception 'Prix invalide'; end if;
  insert into public.services(provider_id,name,price,unit) values(new_provider_id,trim(new_name),new_price,coalesce(nullif(trim(new_unit),''),'forfait')) returning id into new_id;
  return new_id;
end; $$;

create or replace function public.add_provider_service(new_provider_id uuid,new_name text,new_price numeric,new_unit text default 'forfait')
returns boolean language plpgsql security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is null then raise exception 'Connexion requise'; end if;
  if not exists(select 1 from public.providers p where p.id=new_provider_id and p.user_id=(select auth.uid())) and not private.is_admin() then raise exception 'Accès refusé : profil prestataire non autorisé'; end if;
  if new_name is null or length(trim(new_name))<2 then raise exception 'Nom du service obligatoire'; end if;
  if new_price is null or new_price<=0 then raise exception 'Prix invalide'; end if;
  insert into public.services(provider_id,name,price,unit) values(new_provider_id,trim(new_name),new_price,coalesce(nullif(trim(new_unit),''),'forfait'));
  return true;
end; $$;

create or replace function public.delete_gallery_photo(target_gallery_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  delete from public.gallery g where g.id=target_gallery_id and (
    exists(select 1 from public.providers p where p.id=g.provider_id and p.user_id=(select auth.uid())) or private.is_admin()
  );
  if not found then raise exception 'Photo introuvable ou accès refusé'; end if;
end; $$;

create or replace function public.delete_provider_service(target_service_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  delete from public.services s where s.id=target_service_id and (
    exists(select 1 from public.providers p where p.id=s.provider_id and p.user_id=(select auth.uid())) or private.is_admin()
  );
  if not found then raise exception 'Service introuvable ou accès refusé'; end if;
end; $$;

revoke all on function public.add_gallery_photo(uuid,text) from public,anon;
revoke all on function public.add_gallery_photo(uuid,text,text) from public,anon;
revoke all on function public.add_provider_service(uuid,text,integer,text) from public,anon;
revoke all on function public.add_provider_service(uuid,text,numeric,text) from public,anon;
revoke all on function public.delete_gallery_photo(uuid) from public,anon;
revoke all on function public.delete_provider_service(uuid) from public,anon;
grant execute on function public.add_gallery_photo(uuid,text) to authenticated;
grant execute on function public.add_gallery_photo(uuid,text,text) to authenticated;
grant execute on function public.add_provider_service(uuid,text,integer,text) to authenticated;
grant execute on function public.add_provider_service(uuid,text,numeric,text) to authenticated;
grant execute on function public.delete_gallery_photo(uuid) to authenticated;
grant execute on function public.delete_provider_service(uuid) to authenticated;

alter function public.admin_create_announcement(text) set search_path = '';
alter function public.admin_create_announcement(text,text,text,text,text,text,text) set search_path = '';
revoke all on function public.admin_create_announcement(text) from public,anon;
revoke all on function public.admin_create_announcement(text,text,text,text,text,text,text) from public,anon;
grant execute on function public.admin_create_announcement(text) to authenticated;
grant execute on function public.admin_create_announcement(text,text,text,text,text,text,text) to authenticated;

create or replace function public.set_idea_author()
returns trigger language plpgsql security invoker set search_path = ''
as $$
declare profile_name text;
begin
  if (select auth.uid()) is null then raise exception 'Connexion requise pour publier'; end if;
  select u.name into profile_name from public.users u where u.id=(select auth.uid());
  if profile_name is null then raise exception 'Profil utilisateur introuvable'; end if;
  if tg_table_name='idea_posts' then
    if new.title is null or length(trim(new.title))<4 or length(trim(new.title))>140 then raise exception 'Le titre doit contenir entre 4 et 140 caractères'; end if;
    if new.body is null or length(trim(new.body))<10 or length(trim(new.body))>3000 then raise exception 'Le texte doit contenir entre 10 et 3000 caractères'; end if;
  else
    if new.body is null or length(trim(new.body))<2 or length(trim(new.body))>1000 then raise exception 'Le commentaire doit contenir entre 2 et 1000 caractères'; end if;
  end if;
  new.author_id := (select auth.uid()); new.author_name := profile_name; return new;
end; $$;
drop trigger if exists idea_posts_set_author on public.idea_posts;
create trigger idea_posts_set_author before insert on public.idea_posts for each row execute function public.set_idea_author();
drop trigger if exists idea_comments_set_author on public.idea_comments;
create trigger idea_comments_set_author before insert on public.idea_comments for each row execute function public.set_idea_author();

drop policy if exists idea_posts_user_insert on public.idea_posts;
create policy idea_posts_user_insert on public.idea_posts for insert to authenticated with check(author_id=(select auth.uid()));
drop policy if exists idea_comments_insert on public.idea_comments;
drop policy if exists idea_comments_user_insert on public.idea_comments;
create policy idea_comments_user_insert on public.idea_comments for insert to authenticated with check(author_id=(select auth.uid()));
revoke insert on public.idea_posts,public.idea_comments from public,anon;
grant insert on public.idea_posts,public.idea_comments to authenticated;

drop policy if exists idea_likes_insert on public.idea_likes;
create policy idea_likes_insert on public.idea_likes for insert to authenticated with check(user_id=(select auth.uid()));
drop policy if exists idea_likes_delete on public.idea_likes;
create policy idea_likes_delete on public.idea_likes for delete to authenticated using(user_id=(select auth.uid()));
create unique index if not exists idea_likes_post_user_uidx on public.idea_likes(post_id,user_id);
create index if not exists idea_comments_post_created_idx on public.idea_comments(post_id,created_at desc);

create table if not exists public.support_messages(
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  name text not null check(length(btrim(name)) between 2 and 100),
  phone text not null check(length(btrim(phone)) between 6 and 24),
  message text not null check(length(btrim(message)) between 10 and 3000),
  status text not null default 'new' check(status in ('new','in_progress','resolved')),
  created_at timestamptz not null default now()
);
alter table public.support_messages enable row level security;
revoke all on public.support_messages from public,anon,authenticated;
grant select,update on public.support_messages to authenticated;
drop policy if exists support_messages_admin_select on public.support_messages;
create policy support_messages_admin_select on public.support_messages for select to authenticated using((select private.is_admin()));
drop policy if exists support_messages_admin_update on public.support_messages;
create policy support_messages_admin_update on public.support_messages for update to authenticated using((select private.is_admin())) with check((select private.is_admin()));
create index if not exists support_messages_created_idx on public.support_messages(created_at desc);

create or replace function public.submit_support_message(new_name text,new_phone text,new_message text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare normalized_phone text; recent_count integer; created_id uuid;
begin
  normalized_phone := regexp_replace(coalesce(new_phone,''),'[^0-9]','','g');
  if new_name is null or length(trim(new_name))<2 or length(trim(new_name))>100 then raise exception 'Veuillez indiquer un nom valide'; end if;
  if length(normalized_phone)<6 or length(normalized_phone)>15 then raise exception 'Veuillez indiquer un numéro de téléphone valide'; end if;
  if new_message is null or length(trim(new_message))<10 or length(trim(new_message))>3000 then raise exception 'Le message doit contenir entre 10 et 3000 caractères'; end if;
  select count(*) into recent_count from public.support_messages sm where regexp_replace(sm.phone,'[^0-9]','','g')=normalized_phone and sm.created_at>now()-interval '1 hour';
  if recent_count>=3 then raise exception 'Limite atteinte : réessayez dans une heure'; end if;
  insert into public.support_messages(user_id,name,phone,message) values((select auth.uid()),trim(new_name),trim(new_phone),trim(new_message)) returning id into created_id;
  return created_id;
end; $$;
revoke all on function public.submit_support_message(text,text,text) from public;
grant execute on function public.submit_support_message(text,text,text) to anon,authenticated;

drop policy if exists site_visits_select_auth on public.site_visits;
drop policy if exists site_visits_admin_select on public.site_visits;
create policy site_visits_admin_select on public.site_visits for select to authenticated using((select private.is_admin()));
create index if not exists site_visits_created_at_idx on public.site_visits(created_at desc);
create index if not exists site_visits_visitor_key_idx on public.site_visits(visitor_key);

create or replace function public.get_admin_visit_stats()
returns jsonb language plpgsql stable security invoker set search_path = ''
as $$
declare result jsonb;
begin
  if not private.is_admin() then raise exception 'Accès réservé au propriétaire'; end if;
  select jsonb_build_object(
    'total',count(*),
    'today',count(*) filter(where created_at>=date_trunc('day',now())),
    'last7',count(*) filter(where created_at>=now()-interval '7 days'),
    'last30',count(*) filter(where created_at>=now()-interval '30 days'),
    'unique_visitors',count(distinct visitor_key),
    'daily',(select coalesce(jsonb_agg(jsonb_build_object('day',d.day::date,'visits',coalesce(v.visits,0)) order by d.day),'[]'::jsonb)
      from generate_series(current_date-6,current_date,interval '1 day') as d(day)
      left join (select date_trunc('day',created_at)::date as day,count(*) as visits from public.site_visits where created_at>=current_date-6 group by 1) v on v.day=d.day::date),
    'top_pages',(select coalesce(jsonb_agg(jsonb_build_object('path',page_path,'visits',visits) order by visits desc),'[]'::jsonb)
      from (select coalesce(nullif(path,''),'home') as page_path,count(*) as visits from public.site_visits where created_at>=now()-interval '30 days' group by 1 order by 2 desc limit 8) pages)
  ) into result from public.site_visits;
  return result;
end; $$;
revoke all on function public.get_admin_visit_stats() from public,anon;
grant execute on function public.get_admin_visit_stats() to authenticated;

alter table public.announcements add column if not exists media jsonb not null default '[]'::jsonb,add column if not exists link_label text;
create or replace function public.admin_create_rich_announcement(new_title text default null,new_text text default null,new_media jsonb default '[]'::jsonb,new_link_url text default null,new_link_label text default null)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare created_id uuid; media_value jsonb := coalesce(new_media,'[]'::jsonb);
begin
  if not private.is_admin() then raise exception 'Accès réservé au propriétaire'; end if;
  if jsonb_typeof(media_value)<>'array' or jsonb_array_length(media_value)>12 then raise exception 'Format média invalide ou trop de fichiers'; end if;
  if coalesce(trim(new_title),'')='' and coalesce(trim(new_text),'')='' and jsonb_array_length(media_value)=0 and coalesce(trim(new_link_url),'')='' then raise exception 'Une annonce doit contenir du texte ou un média'; end if;
  if nullif(trim(new_link_url),'') is not null and trim(new_link_url)!~* '^https?://' then raise exception 'Lien invalide'; end if;
  insert into public.announcements(title,text,media,link_url,link_label) values(nullif(trim(new_title),''),coalesce(trim(new_text),''),media_value,nullif(trim(new_link_url),''),nullif(trim(new_link_label),'')) returning id into created_id;
  return created_id;
end; $$;
revoke all on function public.admin_create_rich_announcement(text,text,jsonb,text,text) from public,anon;
grant execute on function public.admin_create_rich_announcement(text,text,jsonb,text,text) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('announcements-media','announcements-media',true,104857600,array['image/jpeg','image/png','image/webp','image/gif','audio/mpeg','audio/mp4','audio/aac','audio/ogg','audio/wav','audio/webm','video/mp4','video/webm','video/quicktime'])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "Announcement media public read" on storage.objects;
create policy "Announcement media public read" on storage.objects for select using(bucket_id='announcements-media');
drop policy if exists "Announcement media admin upload" on storage.objects;
create policy "Announcement media admin upload" on storage.objects for insert to authenticated with check(bucket_id='announcements-media' and (storage.foldername(name))[1]=(select auth.uid())::text and (select private.is_admin()));
drop policy if exists "Announcement media admin delete" on storage.objects;
create policy "Announcement media admin delete" on storage.objects for delete to authenticated using(bucket_id='announcements-media' and (storage.foldername(name))[1]=(select auth.uid())::text and (select private.is_admin()));

drop policy if exists "provider_referrals public read" on public.provider_referrals;
drop policy if exists provider_referrals_admin_read on public.provider_referrals;
create policy provider_referrals_admin_read on public.provider_referrals for select to authenticated using((select private.is_admin()));
