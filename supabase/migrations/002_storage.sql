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
