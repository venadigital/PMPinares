alter table public.risks
add column if not exists created_by uuid references public.profiles(id) on delete set null,
add column if not exists updated_at timestamptz not null default now();

create table if not exists public.risk_attachments (
  id uuid primary key default gen_random_uuid(),
  risk_id uuid not null references public.risks(id) on delete cascade,
  uploaded_by uuid references public.profiles(id) on delete set null,
  name text not null,
  mime_type text,
  storage_path text not null,
  size_bytes bigint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists risks_created_at_idx on public.risks(created_at desc);
create index if not exists risks_level_idx on public.risks(level);
create index if not exists risks_status_idx on public.risks(status);
create index if not exists risk_attachments_risk_id_idx on public.risk_attachments(risk_id);
create index if not exists entity_links_source_idx on public.entity_links(source_type, source_id);
create index if not exists entity_links_target_idx on public.entity_links(target_type, target_id);

alter table public.risk_attachments enable row level security;

drop policy if exists "risks write" on public.risks;
drop policy if exists "risks insert" on public.risks;
drop policy if exists "risks update" on public.risks;
drop policy if exists "risks delete admin" on public.risks;
drop policy if exists "risk attachments access" on public.risk_attachments;
drop policy if exists "risk attachments write" on public.risk_attachments;
drop policy if exists "risk attachments delete admin" on public.risk_attachments;
drop policy if exists "links authenticated" on public.entity_links;
drop policy if exists "links access" on public.entity_links;
drop policy if exists "risk links write" on public.entity_links;
drop policy if exists "risk links delete" on public.entity_links;

create policy "risks insert" on public.risks
for insert with check (public.has_module_access('riesgos'));

create policy "risks update" on public.risks
for update using (public.has_module_access('riesgos')) with check (public.has_module_access('riesgos'));

create policy "risks delete admin" on public.risks
for delete using (public.is_admin());

create policy "risk attachments access" on public.risk_attachments
for select using (public.has_module_access('riesgos'));

create policy "risk attachments write" on public.risk_attachments
for insert with check (public.has_module_access('riesgos'));

create policy "risk attachments delete admin" on public.risk_attachments
for delete using (public.is_admin());

create policy "links access" on public.entity_links
for select using (auth.role() = 'authenticated');

create policy "risk links write" on public.entity_links
for insert with check (source_type = 'risk' and public.has_module_access('riesgos'));

create policy "risk links delete" on public.entity_links
for delete using (source_type = 'risk' and public.is_admin());

grant select, insert, update, delete on public.risks to authenticated;
grant select, insert, update, delete on public.risk_attachments to authenticated;
grant select, insert, update, delete on public.entity_links to authenticated;
