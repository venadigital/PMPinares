-- Permite vincular tareas operativas con areas del catalogo.
-- Mantiene los vinculos existentes con hallazgos y riesgos.

do $$
declare
  constraint_name text;
begin
  select conname into constraint_name
  from pg_constraint
  where conrelid = 'public.project_task_links'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%target_type%';

  if constraint_name is not null then
    execute format('alter table public.project_task_links drop constraint %I', constraint_name);
  end if;
end $$;

alter table public.project_task_links
add constraint project_task_links_target_type_check
check (target_type in ('finding', 'risk', 'area'));
