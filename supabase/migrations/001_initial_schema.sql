create extension if not exists "pgcrypto";

create type app_role as enum ('Administrador Vena Digital', 'Administrador Pinares', 'Stakeholder Pinares');
create type organization_type as enum ('Vena Digital', 'Pinares');
create type task_status as enum ('No iniciado', 'En progreso', 'En revision', 'Bloqueado', 'Completado');
create type priority_level as enum ('Alta', 'Media', 'Baja');
create type traffic_light as enum ('Verde', 'Amarillo', 'Rojo');
create type risk_level as enum ('Alto', 'Medio', 'Bajo');
create type criticality_level as enum ('Alta', 'Media', 'Baja');

create table public.modules (
  key text primary key,
  label text not null,
  description text not null
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role app_role not null default 'Stakeholder Pinares',
  organization organization_type not null default 'Pinares',
  position text,
  area text,
  status text not null default 'Activo',
  temporary_password_changed boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.module_permissions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  module_key text not null references public.modules(key) on delete cascade,
  can_view boolean not null default true,
  can_create boolean not null default false,
  can_edit boolean not null default false,
  can_delete boolean not null default false,
  unique(profile_id, module_key)
);

create table public.phases (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  week_range text,
  progress integer not null default 0 check (progress between 0 and 100)
);

create table public.areas (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table public.folders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phase_id uuid references public.phases(id) on delete set null,
  parent_id uuid references public.folders(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.files (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid references public.folders(id) on delete cascade,
  phase_id uuid references public.phases(id) on delete set null,
  uploaded_by uuid references public.profiles(id) on delete set null,
  name text not null,
  mime_type text,
  storage_path text not null,
  size_bytes bigint not null check (size_bytes <= 262144000),
  created_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  phase_id uuid references public.phases(id) on delete set null,
  owner_id uuid references public.profiles(id) on delete set null,
  status task_status not null default 'No iniciado',
  priority priority_level not null default 'Media',
  item_type text not null default 'Tarea',
  start_date date,
  due_date date,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.deliverables (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  phase_id uuid references public.phases(id) on delete set null,
  status text not null default 'Pendiente',
  file_id uuid references public.files(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.wall_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.wall_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.wall_posts(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table public.wall_post_tags (
  post_id uuid references public.wall_posts(id) on delete cascade,
  tag_id uuid references public.tags(id) on delete cascade,
  primary key (post_id, tag_id)
);

create table public.technology_tools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  provider text not null,
  cost numeric not null default 0,
  currency text not null check (currency in ('COP', 'USD')),
  license_type text not null,
  user_count integer not null default 0,
  internal_owner text not null,
  contracted_features text,
  used_features text,
  integrations text,
  api_available boolean not null default false,
  usage_light traffic_light not null default 'Amarillo',
  user_satisfaction integer check (user_satisfaction between 1 and 5),
  created_at timestamptz not null default now()
);

create table public.interviews (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  interview_type text not null check (interview_type in ('Stack tecnologico', 'Procesos')),
  interview_date date,
  notes text,
  audio_file_id uuid references public.files(id) on delete set null,
  minutes_file_id uuid references public.files(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.processes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  area_id uuid references public.areas(id) on delete set null,
  document_file_id uuid references public.files(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.findings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  classification text not null,
  criticality criticality_level not null default 'Media',
  status text not null default 'Identificado',
  area_id uuid references public.areas(id) on delete set null,
  identified_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.risks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  level risk_level not null default 'Medio',
  regulation text,
  status text not null default 'Abierto',
  created_at timestamptz not null default now()
);

create table public.decisions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  decision_date date,
  participants text,
  context text,
  alternatives text,
  decision_taken text,
  owner_id uuid references public.profiles(id) on delete set null,
  status text not null default 'Pendiente',
  created_at timestamptz not null default now()
);

create table public.entity_links (
  id uuid primary key default gen_random_uuid(),
  source_type text not null,
  source_id uuid not null,
  target_type text not null,
  target_id uuid not null,
  created_at timestamptz not null default now()
);

alter table public.modules enable row level security;
alter table public.profiles enable row level security;
alter table public.module_permissions enable row level security;
alter table public.phases enable row level security;
alter table public.areas enable row level security;
alter table public.folders enable row level security;
alter table public.files enable row level security;
alter table public.tasks enable row level security;
alter table public.deliverables enable row level security;
alter table public.wall_posts enable row level security;
alter table public.wall_comments enable row level security;
alter table public.tags enable row level security;
alter table public.wall_post_tags enable row level security;
alter table public.technology_tools enable row level security;
alter table public.interviews enable row level security;
alter table public.processes enable row level security;
alter table public.findings enable row level security;
alter table public.risks enable row level security;
alter table public.decisions enable row level security;
alter table public.entity_links enable row level security;

create or replace function public.has_module_access(module text)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.module_permissions mp
    where mp.profile_id = auth.uid()
      and mp.module_key = module
      and mp.can_view = true
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('Administrador Vena Digital', 'Administrador Pinares')
  );
$$;

create policy "read modules" on public.modules for select using (auth.role() = 'authenticated');
create policy "read own profile or admin" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "admin manage profiles" on public.profiles for all using (public.is_admin()) with check (public.is_admin());
create policy "read permissions" on public.module_permissions for select using (profile_id = auth.uid() or public.is_admin());
create policy "admin manage permissions" on public.module_permissions for all using (public.is_admin()) with check (public.is_admin());

create policy "read phases" on public.phases for select using (auth.role() = 'authenticated');
create policy "read areas" on public.areas for select using (auth.role() = 'authenticated');
create policy "admin manage phases" on public.phases for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manage areas" on public.areas for all using (public.is_admin()) with check (public.is_admin());

create policy "docs access" on public.folders for select using (public.has_module_access('documentos'));
create policy "docs admin write" on public.folders for all using (public.is_admin()) with check (public.is_admin());
create policy "files access" on public.files for select using (public.has_module_access('documentos'));
create policy "files admin write" on public.files for all using (public.is_admin()) with check (public.is_admin());

create policy "tasks access" on public.tasks for select using (public.has_module_access('cronograma'));
create policy "tasks write" on public.tasks for insert with check (public.has_module_access('cronograma'));
create policy "tasks edit" on public.tasks for update using (public.has_module_access('cronograma'));
create policy "tasks delete admin" on public.tasks for delete using (public.is_admin());

create policy "deliverables access" on public.deliverables for select using (public.has_module_access('entregables') or public.has_module_access('cronograma'));
create policy "deliverables write" on public.deliverables for all using (public.is_admin()) with check (public.is_admin());

create policy "wall access" on public.wall_posts for select using (public.has_module_access('comunicacion'));
create policy "wall write" on public.wall_posts for insert with check (public.has_module_access('comunicacion'));
create policy "comments access" on public.wall_comments for select using (public.has_module_access('comunicacion'));
create policy "comments write" on public.wall_comments for insert with check (public.has_module_access('comunicacion'));
create policy "tags access" on public.tags for select using (public.has_module_access('comunicacion'));

create policy "tools access" on public.technology_tools for select using (public.has_module_access('inventario'));
create policy "tools write" on public.technology_tools for all using (public.has_module_access('inventario')) with check (public.has_module_access('inventario'));
create policy "interviews access" on public.interviews for select using (public.has_module_access('entrevistas'));
create policy "interviews write" on public.interviews for all using (public.has_module_access('entrevistas')) with check (public.has_module_access('entrevistas'));
create policy "processes access" on public.processes for select using (public.has_module_access('procesos'));
create policy "processes write" on public.processes for all using (public.has_module_access('procesos')) with check (public.has_module_access('procesos'));
create policy "findings access" on public.findings for select using (public.has_module_access('hallazgos'));
create policy "findings write" on public.findings for all using (public.has_module_access('hallazgos')) with check (public.has_module_access('hallazgos'));
create policy "risks access" on public.risks for select using (public.has_module_access('riesgos'));
create policy "risks write" on public.risks for all using (public.has_module_access('riesgos')) with check (public.has_module_access('riesgos'));
create policy "decisions access" on public.decisions for select using (public.has_module_access('decisiones'));
create policy "decisions write" on public.decisions for all using (public.is_admin()) with check (public.is_admin());
create policy "links authenticated" on public.entity_links for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
