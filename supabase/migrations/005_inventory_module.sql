alter table public.technology_tools
add column if not exists area_names text[] not null default '{}',
add column if not exists associated_risks text,
add column if not exists updated_at timestamptz not null default now();

create table if not exists public.technology_tool_attachments (
  id uuid primary key default gen_random_uuid(),
  tool_id uuid not null references public.technology_tools(id) on delete cascade,
  uploaded_by uuid references public.profiles(id) on delete set null,
  name text not null,
  mime_type text,
  storage_path text not null,
  size_bytes bigint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists technology_tools_created_at_idx on public.technology_tools(created_at desc);
create index if not exists technology_tool_attachments_tool_id_idx on public.technology_tool_attachments(tool_id);

alter table public.technology_tool_attachments enable row level security;

drop policy if exists "tool attachments access" on public.technology_tool_attachments;
drop policy if exists "tool attachments write" on public.technology_tool_attachments;
drop policy if exists "tool attachments delete admin" on public.technology_tool_attachments;

create policy "tool attachments access" on public.technology_tool_attachments
for select using (public.has_module_access('inventario'));

create policy "tool attachments write" on public.technology_tool_attachments
for insert with check (public.has_module_access('inventario'));

create policy "tool attachments delete admin" on public.technology_tool_attachments
for delete using (public.is_admin());
