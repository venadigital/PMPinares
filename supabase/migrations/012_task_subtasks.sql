create table if not exists public.task_subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  title text not null,
  is_completed boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists task_subtasks_task_id_idx on public.task_subtasks(task_id);
create index if not exists task_subtasks_created_at_idx on public.task_subtasks(created_at);

alter table public.task_subtasks enable row level security;

drop policy if exists "task subtasks access" on public.task_subtasks;
drop policy if exists "task subtasks write" on public.task_subtasks;
drop policy if exists "task subtasks edit" on public.task_subtasks;
drop policy if exists "task subtasks delete admin" on public.task_subtasks;

create policy "task subtasks access" on public.task_subtasks
for select using (public.has_module_access('cronograma'));

create policy "task subtasks write" on public.task_subtasks
for insert with check (public.has_module_access('cronograma'));

create policy "task subtasks edit" on public.task_subtasks
for update using (public.has_module_access('cronograma'))
with check (public.has_module_access('cronograma'));

create policy "task subtasks delete admin" on public.task_subtasks
for delete using (public.is_admin());

grant select, insert, update, delete on public.task_subtasks to authenticated;
