drop policy if exists "tools write" on public.technology_tools;
drop policy if exists "tools insert" on public.technology_tools;
drop policy if exists "tools update" on public.technology_tools;
drop policy if exists "tools delete admin" on public.technology_tools;

create policy "tools insert" on public.technology_tools
for insert with check (public.has_module_access('inventario'));

create policy "tools update" on public.technology_tools
for update using (public.has_module_access('inventario')) with check (public.has_module_access('inventario'));

create policy "tools delete admin" on public.technology_tools
for delete using (public.is_admin());
