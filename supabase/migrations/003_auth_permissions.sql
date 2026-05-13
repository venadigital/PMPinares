create policy "profile can update own password flag"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create index if not exists module_permissions_profile_id_idx on public.module_permissions(profile_id);
create index if not exists profiles_role_idx on public.profiles(role);
