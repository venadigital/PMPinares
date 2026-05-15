-- Modulo independiente de tareas operativas.
-- No afecta la tabla public.tasks usada por cronograma.

create table if not exists public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  phase_id uuid references public.phases(id) on delete set null,
  priority priority_level not null default 'Media',
  status text not null default 'Pendiente' check (status in ('Pendiente', 'En progreso', 'Requiere informacion', 'Resuelta', 'Cerrada')),
  start_date date,
  due_date date,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_task_assignees (
  task_id uuid not null references public.project_tasks(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (task_id, profile_id)
);

create table if not exists public.project_task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.project_tasks(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.project_task_attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.project_tasks(id) on delete cascade,
  uploaded_by uuid references public.profiles(id) on delete set null,
  name text not null,
  mime_type text,
  storage_path text not null,
  size_bytes bigint not null default 0 check (size_bytes <= 262144000),
  created_at timestamptz not null default now()
);

create table if not exists public.project_task_links (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.project_tasks(id) on delete cascade,
  target_type text not null check (target_type in ('finding', 'risk')),
  target_id uuid not null,
  created_at timestamptz not null default now(),
  unique(task_id, target_type, target_id)
);

create index if not exists project_tasks_phase_id_idx on public.project_tasks(phase_id);
create index if not exists project_tasks_status_idx on public.project_tasks(status);
create index if not exists project_tasks_priority_idx on public.project_tasks(priority);
create index if not exists project_task_assignees_profile_id_idx on public.project_task_assignees(profile_id);
create index if not exists project_task_comments_task_id_idx on public.project_task_comments(task_id);
create index if not exists project_task_attachments_task_id_idx on public.project_task_attachments(task_id);
create index if not exists project_task_links_task_id_idx on public.project_task_links(task_id);
create index if not exists project_task_links_target_idx on public.project_task_links(target_type, target_id);

alter table public.project_tasks enable row level security;
alter table public.project_task_assignees enable row level security;
alter table public.project_task_comments enable row level security;
alter table public.project_task_attachments enable row level security;
alter table public.project_task_links enable row level security;

drop policy if exists "project tasks access" on public.project_tasks;
drop policy if exists "project tasks create" on public.project_tasks;
drop policy if exists "project tasks edit" on public.project_tasks;
drop policy if exists "project tasks delete admin" on public.project_tasks;
drop policy if exists "project task assignees access" on public.project_task_assignees;
drop policy if exists "project task assignees write" on public.project_task_assignees;
drop policy if exists "project task comments access" on public.project_task_comments;
drop policy if exists "project task comments write" on public.project_task_comments;
drop policy if exists "project task comments delete admin" on public.project_task_comments;
drop policy if exists "project task attachments access" on public.project_task_attachments;
drop policy if exists "project task attachments write" on public.project_task_attachments;
drop policy if exists "project task attachments delete admin" on public.project_task_attachments;
drop policy if exists "project task links access" on public.project_task_links;
drop policy if exists "project task links write" on public.project_task_links;

create policy "project tasks access" on public.project_tasks
for select using (public.has_module_access('tareas'));

create policy "project tasks create" on public.project_tasks
for insert with check (public.has_module_access('tareas'));

create policy "project tasks edit" on public.project_tasks
for update using (public.has_module_access('tareas'))
with check (public.has_module_access('tareas'));

create policy "project tasks delete admin" on public.project_tasks
for delete using (public.is_admin());

create policy "project task assignees access" on public.project_task_assignees
for select using (public.has_module_access('tareas'));

create policy "project task assignees write" on public.project_task_assignees
for all using (public.has_module_access('tareas'))
with check (public.has_module_access('tareas'));

create policy "project task comments access" on public.project_task_comments
for select using (public.has_module_access('tareas'));

create policy "project task comments write" on public.project_task_comments
for insert with check (public.has_module_access('tareas'));

create policy "project task comments delete admin" on public.project_task_comments
for delete using (public.is_admin());

create policy "project task attachments access" on public.project_task_attachments
for select using (public.has_module_access('tareas'));

create policy "project task attachments write" on public.project_task_attachments
for insert with check (public.has_module_access('tareas'));

create policy "project task attachments delete admin" on public.project_task_attachments
for delete using (public.is_admin());

create policy "project task links access" on public.project_task_links
for select using (public.has_module_access('tareas'));

create policy "project task links write" on public.project_task_links
for all using (public.has_module_access('tareas'))
with check (public.has_module_access('tareas'));

insert into public.modules (key, label, description)
values ('tareas', 'Tareas', 'Gestion operativa y asignaciones')
on conflict (key) do update set label = excluded.label, description = excluded.description;

insert into public.module_permissions (profile_id, module_key, can_view, can_create, can_edit, can_delete)
select id, 'tareas', true, true, true, true
from public.profiles
where role in ('Administrador Vena Digital', 'Administrador Pinares')
on conflict (profile_id, module_key) do update set
  can_view = true,
  can_create = true,
  can_edit = true,
  can_delete = true;
