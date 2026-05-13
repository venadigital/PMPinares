alter table public.findings
add column if not exists updated_at timestamptz not null default now();

create table if not exists public.finding_attachments (
  id uuid primary key default gen_random_uuid(),
  finding_id uuid not null references public.findings(id) on delete cascade,
  uploaded_by uuid references public.profiles(id) on delete set null,
  name text not null,
  mime_type text,
  storage_path text not null,
  size_bytes bigint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists findings_created_at_idx on public.findings(created_at desc);
create index if not exists findings_area_id_idx on public.findings(area_id);
create index if not exists findings_criticality_idx on public.findings(criticality);
create index if not exists finding_attachments_finding_id_idx on public.finding_attachments(finding_id);

alter table public.finding_attachments enable row level security;

drop policy if exists "findings write" on public.findings;
drop policy if exists "findings insert" on public.findings;
drop policy if exists "findings update" on public.findings;
drop policy if exists "findings delete admin" on public.findings;
drop policy if exists "finding attachments access" on public.finding_attachments;
drop policy if exists "finding attachments write" on public.finding_attachments;
drop policy if exists "finding attachments delete admin" on public.finding_attachments;

create policy "findings insert" on public.findings
for insert with check (public.has_module_access('hallazgos'));

create policy "findings update" on public.findings
for update using (public.has_module_access('hallazgos')) with check (public.has_module_access('hallazgos'));

create policy "findings delete admin" on public.findings
for delete using (public.is_admin());

create policy "finding attachments access" on public.finding_attachments
for select using (public.has_module_access('hallazgos'));

create policy "finding attachments write" on public.finding_attachments
for insert with check (public.has_module_access('hallazgos'));

create policy "finding attachments delete admin" on public.finding_attachments
for delete using (public.is_admin());
