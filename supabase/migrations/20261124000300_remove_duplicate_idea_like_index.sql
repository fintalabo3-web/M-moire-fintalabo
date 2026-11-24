-- The existing composite primary key (post_id, user_id) already guarantees uniqueness.
-- Remove the redundant duplicate unique index created during the first upgrade migration.
drop index if exists public.idea_likes_post_user_uidx;
