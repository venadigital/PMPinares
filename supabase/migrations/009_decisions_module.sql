alter table public.decisions
add column if not exists updated_at timestamptz not null default now();

create index if not exists decisions_created_at_idx on public.decisions(created_at desc);
create index if not exists decisions_status_idx on public.decisions(status);
create index if not exists decisions_owner_id_idx on public.decisions(owner_id);
create index if not exists decisions_decision_date_idx on public.decisions(decision_date);

drop policy if exists "decisions write" on public.decisions;
drop policy if exists "decisions insert" on public.decisions;
drop policy if exists "decisions update" on public.decisions;
drop policy if exists "decisions delete admin" on public.decisions;
drop policy if exists "decision links write" on public.entity_links;
drop policy if exists "decision links delete" on public.entity_links;

create policy "decisions insert" on public.decisions
for insert with check (public.has_module_access('decisiones'));

create policy "decisions update" on public.decisions
for update using (public.has_module_access('decisiones')) with check (public.has_module_access('decisiones'));

create policy "decisions delete admin" on public.decisions
for delete using (public.is_admin());

create policy "decision links write" on public.entity_links
for insert with check (source_type = 'decision' and public.has_module_access('decisiones'));

create policy "decision links delete" on public.entity_links
for delete using (source_type = 'decision' and public.is_admin());

grant select, insert, update, delete on public.decisions to authenticated;
