-- Reemplaza el catálogo maestro de áreas de Pinares.
-- Conserva respaldo privado de relaciones anteriores y deja registros existentes sin área.
-- La guarda area_replacement_runs evita que una segunda ejecución vuelva a limpiar reasignaciones futuras.

create schema if not exists app_backups;

create table if not exists app_backups.area_replacement_runs (
  run_key text primary key,
  executed_at timestamptz not null default now()
);

create table if not exists app_backups.area_replacement_20260521 (
  id uuid primary key default gen_random_uuid(),
  backed_up_at timestamptz not null default now(),
  source_table text not null,
  source_id text not null,
  payload jsonb not null
);

do $$
begin
  if not exists (
    select 1
    from app_backups.area_replacement_runs
    where run_key = '20260521_replace_company_areas'
  ) then
    insert into app_backups.area_replacement_20260521 (source_table, source_id, payload)
    select
      'profiles',
      p.id::text,
      jsonb_build_object(
        'id', p.id,
        'full_name', p.full_name,
        'email', p.email,
        'area', p.area
      )
    from public.profiles p
    where p.area is not null and p.area <> '';

    insert into app_backups.area_replacement_20260521 (source_table, source_id, payload)
    select
      'findings',
      f.id::text,
      jsonb_build_object(
        'id', f.id,
        'title', f.title,
        'area_id', f.area_id,
        'area_name', a.name
      )
    from public.findings f
    left join public.areas a on a.id = f.area_id
    where f.area_id is not null;

    insert into app_backups.area_replacement_20260521 (source_table, source_id, payload)
    select
      'processes',
      p.id::text,
      jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'area_id', p.area_id,
        'area_name', a.name
      )
    from public.processes p
    left join public.areas a on a.id = p.area_id
    where p.area_id is not null;

    insert into app_backups.area_replacement_20260521 (source_table, source_id, payload)
    select
      'technology_tools',
      t.id::text,
      jsonb_build_object(
        'id', t.id,
        'name', t.name,
        'area_names', t.area_names
      )
    from public.technology_tools t
    where cardinality(t.area_names) > 0;

    insert into app_backups.area_replacement_20260521 (source_table, source_id, payload)
    select
      'entity_links',
      e.id::text,
      jsonb_build_object(
        'id', e.id,
        'source_type', e.source_type,
        'source_id', e.source_id,
        'target_type', e.target_type,
        'target_id', e.target_id,
        'area_name', a.name
      )
    from public.entity_links e
    left join public.areas a on a.id = e.target_id
    where e.target_type = 'area';

    update public.profiles
    set area = null
    where area is not null and area <> '';

    update public.findings
    set area_id = null
    where area_id is not null;

    update public.processes
    set area_id = null
    where area_id is not null;

    update public.technology_tools
    set area_names = '{}'::text[]
    where cardinality(area_names) > 0;

    delete from public.entity_links
    where target_type = 'area';

    delete from public.areas;

    insert into public.areas (name) values
    ('Gerencia General'),
    ('SubGerencia Administrativa'),
    ('SubGerencia Asistencial'),
    ('Comercial'),
    ('Comercial - Comunicaciones'),
    ('Contabilidad'),
    ('SGSST'),
    ('Gestión Documental'),
    ('Talento Humano'),
    ('Servicio Farmaceutico'),
    ('Coordinación Administrativa'),
    ('Todas')
    on conflict (name) do nothing;

    insert into app_backups.area_replacement_runs (run_key)
    values ('20260521_replace_company_areas');
  end if;
end $$;
