-- FasoService: query indexes and stricter visitor ownership checks
create index if not exists favorites_provider_id_idx on public.favorites(provider_id);
create index if not exists idea_comments_author_id_idx on public.idea_comments(author_id);
create index if not exists idea_likes_user_id_idx on public.idea_likes(user_id);
create index if not exists idea_posts_author_id_idx on public.idea_posts(author_id);
create index if not exists providers_user_id_idx on public.providers(user_id);
create index if not exists requests_client_id_idx on public.requests(client_id);
create index if not exists requests_provider_id_idx on public.requests(provider_id);
create index if not exists reviews_client_id_idx on public.reviews(client_id);
create index if not exists reviews_provider_id_idx on public.reviews(provider_id);
create index if not exists site_visits_user_id_idx on public.site_visits(user_id);
create index if not exists support_messages_user_id_idx on public.support_messages(user_id);

drop policy if exists site_visits_insert on public.site_visits;
create policy site_visits_insert
on public.site_visits for insert to anon, authenticated
with check (
  (user_id is null or user_id = (select auth.uid()))
  and (visitor_key is null or length(visitor_key) between 16 and 128)
  and (path is null or length(path) <= 120)
);
