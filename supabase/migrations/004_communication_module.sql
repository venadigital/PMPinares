create table if not exists public.wall_attachments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.wall_posts(id) on delete cascade,
  comment_id uuid references public.wall_comments(id) on delete cascade,
  uploaded_by uuid references public.profiles(id) on delete set null,
  name text not null,
  mime_type text,
  storage_path text not null,
  size_bytes bigint not null default 0,
  created_at timestamptz not null default now(),
  constraint wall_attachments_single_parent check (
    (case when post_id is null then 0 else 1 end) +
    (case when comment_id is null then 0 else 1 end) = 1
  )
);

create index if not exists wall_attachments_post_id_idx on public.wall_attachments(post_id);
create index if not exists wall_attachments_comment_id_idx on public.wall_attachments(comment_id);
create index if not exists wall_post_tags_post_id_idx on public.wall_post_tags(post_id);
create index if not exists wall_post_tags_tag_id_idx on public.wall_post_tags(tag_id);

alter table public.wall_attachments enable row level security;

drop policy if exists "post tags access" on public.wall_post_tags;
drop policy if exists "post tags write" on public.wall_post_tags;
drop policy if exists "post tags delete admin" on public.wall_post_tags;
drop policy if exists "wall attachments access" on public.wall_attachments;
drop policy if exists "wall attachments write" on public.wall_attachments;
drop policy if exists "wall attachments delete admin" on public.wall_attachments;
drop policy if exists "tags write" on public.tags;

create policy "post tags access" on public.wall_post_tags
for select using (public.has_module_access('comunicacion'));

create policy "post tags write" on public.wall_post_tags
for insert with check (public.has_module_access('comunicacion'));

create policy "post tags delete admin" on public.wall_post_tags
for delete using (public.is_admin());

create policy "wall attachments access" on public.wall_attachments
for select using (public.has_module_access('comunicacion'));

create policy "wall attachments write" on public.wall_attachments
for insert with check (public.has_module_access('comunicacion'));

create policy "wall attachments delete admin" on public.wall_attachments
for delete using (public.is_admin());

create policy "tags write" on public.tags
for insert with check (public.has_module_access('comunicacion'));
