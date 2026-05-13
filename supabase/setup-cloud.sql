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

create table public.task_deliverables (
  task_id uuid not null references public.tasks(id) on delete cascade,
  deliverable_id uuid not null references public.deliverables(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (task_id, deliverable_id)
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

create table public.wall_attachments (
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
  area_names text[] not null default '{}',
  contracted_features text,
  used_features text,
  integrations text,
  api_available boolean not null default false,
  usage_light traffic_light not null default 'Amarillo',
  user_satisfaction integer check (user_satisfaction between 1 and 5),
  associated_risks text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.technology_tool_attachments (
  id uuid primary key default gen_random_uuid(),
  tool_id uuid not null references public.technology_tools(id) on delete cascade,
  uploaded_by uuid references public.profiles(id) on delete set null,
  name text not null,
  mime_type text,
  storage_path text not null,
  size_bytes bigint not null default 0,
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
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.finding_attachments (
  id uuid primary key default gen_random_uuid(),
  finding_id uuid not null references public.findings(id) on delete cascade,
  uploaded_by uuid references public.profiles(id) on delete set null,
  name text not null,
  mime_type text,
  storage_path text not null,
  size_bytes bigint not null default 0,
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
  created_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.risk_attachments (
  id uuid primary key default gen_random_uuid(),
  risk_id uuid not null references public.risks(id) on delete cascade,
  uploaded_by uuid references public.profiles(id) on delete set null,
  name text not null,
  mime_type text,
  storage_path text not null,
  size_bytes bigint not null default 0,
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
  updated_at timestamptz not null default now(),
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
alter table public.wall_attachments enable row level security;
alter table public.tags enable row level security;
alter table public.wall_post_tags enable row level security;
alter table public.technology_tools enable row level security;
alter table public.technology_tool_attachments enable row level security;
alter table public.task_deliverables enable row level security;
alter table public.interviews enable row level security;
alter table public.processes enable row level security;
alter table public.findings enable row level security;
alter table public.finding_attachments enable row level security;
alter table public.risks enable row level security;
alter table public.risk_attachments enable row level security;
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
create policy "task deliverables access" on public.task_deliverables for select using (public.has_module_access('cronograma') or public.has_module_access('entregables'));
create policy "task deliverables write" on public.task_deliverables for all using (public.has_module_access('cronograma')) with check (public.has_module_access('cronograma'));

create policy "wall access" on public.wall_posts for select using (public.has_module_access('comunicacion'));
create policy "wall write" on public.wall_posts for insert with check (public.has_module_access('comunicacion'));
create policy "comments access" on public.wall_comments for select using (public.has_module_access('comunicacion'));
create policy "comments write" on public.wall_comments for insert with check (public.has_module_access('comunicacion'));
create policy "wall attachments access" on public.wall_attachments for select using (public.has_module_access('comunicacion'));
create policy "wall attachments write" on public.wall_attachments for insert with check (public.has_module_access('comunicacion'));
create policy "wall attachments delete admin" on public.wall_attachments for delete using (public.is_admin());
create policy "tags access" on public.tags for select using (public.has_module_access('comunicacion'));
create policy "tags write" on public.tags for insert with check (public.has_module_access('comunicacion'));
create policy "post tags access" on public.wall_post_tags for select using (public.has_module_access('comunicacion'));
create policy "post tags write" on public.wall_post_tags for insert with check (public.has_module_access('comunicacion'));
create policy "post tags delete admin" on public.wall_post_tags for delete using (public.is_admin());

create policy "tools access" on public.technology_tools for select using (public.has_module_access('inventario'));
create policy "tools insert" on public.technology_tools for insert with check (public.has_module_access('inventario'));
create policy "tools update" on public.technology_tools for update using (public.has_module_access('inventario')) with check (public.has_module_access('inventario'));
create policy "tools delete admin" on public.technology_tools for delete using (public.is_admin());
create policy "tool attachments access" on public.technology_tool_attachments for select using (public.has_module_access('inventario'));
create policy "tool attachments write" on public.technology_tool_attachments for insert with check (public.has_module_access('inventario'));
create policy "tool attachments delete admin" on public.technology_tool_attachments for delete using (public.is_admin());
create policy "processes access" on public.processes for select using (public.has_module_access('procesos'));
create policy "processes write" on public.processes for all using (public.has_module_access('procesos')) with check (public.has_module_access('procesos'));
create policy "findings access" on public.findings for select using (public.has_module_access('hallazgos'));
create policy "findings insert" on public.findings for insert with check (public.has_module_access('hallazgos'));
create policy "findings update" on public.findings for update using (public.has_module_access('hallazgos')) with check (public.has_module_access('hallazgos'));
create policy "findings delete admin" on public.findings for delete using (public.is_admin());
create policy "finding attachments access" on public.finding_attachments for select using (public.has_module_access('hallazgos'));
create policy "finding attachments write" on public.finding_attachments for insert with check (public.has_module_access('hallazgos'));
create policy "finding attachments delete admin" on public.finding_attachments for delete using (public.is_admin());
create policy "risks access" on public.risks for select using (public.has_module_access('riesgos'));
create policy "risks insert" on public.risks for insert with check (public.has_module_access('riesgos'));
create policy "risks update" on public.risks for update using (public.has_module_access('riesgos')) with check (public.has_module_access('riesgos'));
create policy "risks delete admin" on public.risks for delete using (public.is_admin());
create policy "risk attachments access" on public.risk_attachments for select using (public.has_module_access('riesgos'));
create policy "risk attachments write" on public.risk_attachments for insert with check (public.has_module_access('riesgos'));
create policy "risk attachments delete admin" on public.risk_attachments for delete using (public.is_admin());
create policy "decisions access" on public.decisions for select using (public.has_module_access('decisiones'));
create policy "decisions insert" on public.decisions for insert with check (public.has_module_access('decisiones'));
create policy "decisions update" on public.decisions for update using (public.has_module_access('decisiones')) with check (public.has_module_access('decisiones'));
create policy "decisions delete admin" on public.decisions for delete using (public.is_admin());
create policy "links access" on public.entity_links for select using (auth.role() = 'authenticated');
create policy "risk links write" on public.entity_links for insert with check (source_type = 'risk' and public.has_module_access('riesgos'));
create policy "risk links delete" on public.entity_links for delete using (source_type = 'risk' and public.is_admin());
create policy "decision links write" on public.entity_links for insert with check (source_type = 'decision' and public.has_module_access('decisiones'));
create policy "decision links delete" on public.entity_links for delete using (source_type = 'decision' and public.is_admin());
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-files',
  'project-files',
  false,
  262144000,
  null
)
on conflict (id) do update set file_size_limit = 262144000, public = false;

create policy "authenticated can read project files"
on storage.objects for select
to authenticated
using (bucket_id = 'project-files');

create policy "authenticated can upload project files"
on storage.objects for insert
to authenticated
with check (bucket_id = 'project-files');

create policy "admins can update project files"
on storage.objects for update
to authenticated
using (bucket_id = 'project-files' and public.is_admin())
with check (bucket_id = 'project-files' and public.is_admin());

create policy "admins can delete project files"
on storage.objects for delete
to authenticated
using (bucket_id = 'project-files' and public.is_admin());
create policy "profile can update own password flag"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create index if not exists module_permissions_profile_id_idx on public.module_permissions(profile_id);
create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists wall_attachments_post_id_idx on public.wall_attachments(post_id);
create index if not exists wall_attachments_comment_id_idx on public.wall_attachments(comment_id);
create index if not exists wall_post_tags_post_id_idx on public.wall_post_tags(post_id);
create index if not exists wall_post_tags_tag_id_idx on public.wall_post_tags(tag_id);
create index if not exists technology_tools_created_at_idx on public.technology_tools(created_at desc);
create index if not exists technology_tool_attachments_tool_id_idx on public.technology_tool_attachments(tool_id);
create index if not exists findings_created_at_idx on public.findings(created_at desc);
create index if not exists findings_area_id_idx on public.findings(area_id);
create index if not exists findings_criticality_idx on public.findings(criticality);
create index if not exists finding_attachments_finding_id_idx on public.finding_attachments(finding_id);
create index if not exists risks_created_at_idx on public.risks(created_at desc);
create index if not exists risks_level_idx on public.risks(level);
create index if not exists risks_status_idx on public.risks(status);
create index if not exists risk_attachments_risk_id_idx on public.risk_attachments(risk_id);
create index if not exists decisions_created_at_idx on public.decisions(created_at desc);
create index if not exists decisions_status_idx on public.decisions(status);
create index if not exists decisions_owner_id_idx on public.decisions(owner_id);
create index if not exists decisions_decision_date_idx on public.decisions(decision_date);
create index if not exists entity_links_source_idx on public.entity_links(source_type, source_id);
create index if not exists entity_links_target_idx on public.entity_links(target_type, target_id);
insert into public.modules (key, label, description) values
('dashboard', 'Panel ejecutivo', 'Indicadores clave del proyecto'),
('stakeholders', 'Stakeholders', 'Usuarios, roles y permisos'),
('documentos', 'Documentos', 'Repositorio por fases'),
('cronograma', 'Cronograma', 'Kanban de tareas e hitos'),
('comunicacion', 'Comunicacion', 'Muro general con menciones'),
('inventario', 'Inventario TI', 'Herramientas, costos y uso'),
('procesos', 'Procesos', 'Documentacion por area'),
('hallazgos', 'Hallazgos', 'Observaciones y criticidad'),
('riesgos', 'Riesgos', 'Cumplimiento y seguridad'),
('decisiones', 'Decisiones', 'Trazabilidad ejecutiva'),
('entregables', 'Entregables', 'Control contractual')
on conflict (key) do nothing;

insert into public.phases (code, name, week_range, progress) values
('fase-0', 'Fase 0 - Alineacion Estrategica', 'Semana 1', 100),
('fase-1', 'Fase 1 - Inventario Tecnologico', 'Semanas 2-3', 0),
('fase-2', 'Fase 2 - Mapeo de Procesos por Area', 'Semanas 4-6', 0),
('fase-3', 'Fase 3 - Construccion del Escenario Actual', 'Semanas 7-8', 0),
('fase-4', 'Fase 4 - Diseno del Escenario Ideal', 'Semanas 9-10', 0),
('fase-5', 'Fase 5 - Roadmap de Implementacion', 'Semana 11', 0),
('fase-6', 'Fase 6 - Presentacion de Resultados', 'Semana 12', 0)
on conflict (code) do nothing;

insert into public.areas (name) values
('Admision y recepcion de pacientes'),
('Agendamiento de citas'),
('Historia clinica / Atencion medica'),
('Hospitalizacion / Internacion'),
('Gestion de medicamentos / Farmacia'),
('Laboratorio y diagnostico'),
('Nutricion y alimentacion'),
('Facturacion y cartera'),
('Contabilidad y finanzas'),
('Nomina y gestion de RRHH'),
('Compras y logistica'),
('Calidad, acreditacion y auditoria'),
('Reportes normativos / entes de control'),
('Comunicaciones internas'),
('Comunicaciones externas / Marketing'),
('Seguridad e infraestructura fisica'),
('Gestion de TI / Sistemas'),
('Gerencia y toma de decisiones')
on conflict (name) do nothing;

insert into public.tags (name) values
('Urgente'), ('Pregunta'), ('Pendiente Pinares'), ('Decision'), ('Riesgo')
on conflict (name) do nothing;

insert into public.folders (name, phase_id)
select replace(name, ' - ', ' / '), id from public.phases
on conflict do nothing;

insert into public.deliverables (title, phase_id, status)
select 'Documento de kickoff con alcance confirmado, cronograma detallado y stakeholders del proyecto', id, 'Pendiente' from public.phases where code = 'fase-0'
union all select 'Matriz de inventario tecnologico con semaforo de aprovechamiento y alertas por herramienta', id, 'Pendiente' from public.phases where code = 'fase-1'
union all select 'Repositorio digital de procesos', id, 'Pendiente' from public.phases where code = 'fase-2'
union all select 'Tabla de hallazgos con clasificacion de criticidad', id, 'Pendiente' from public.phases where code = 'fase-2'
union all select 'Documento de diagnostico consolidado', id, 'Pendiente' from public.phases where code = 'fase-3'
union all select 'Mapa visual del ecosistema tecnologico actual', id, 'Pendiente' from public.phases where code = 'fase-3'
union all select 'Mapa del ecosistema tecnologico ideal', id, 'Pendiente' from public.phases where code = 'fase-4'
union all select 'Analisis comparativo: escenario actual vs. escenario ideal', id, 'Pendiente' from public.phases where code = 'fase-4'
union all select 'Roadmap visual con tres horizontes', id, 'Pendiente' from public.phases where code = 'fase-5'
union all select 'Presentacion ejecutiva de resultados', id, 'Pendiente' from public.phases where code = 'fase-6';
