do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'entity_links'
      and policyname = 'finding links write'
  ) then
    create policy "finding links write"
    on public.entity_links
    for insert
    with check (source_type = 'finding' and public.has_module_access('hallazgos'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'entity_links'
      and policyname = 'finding links delete'
  ) then
    create policy "finding links delete"
    on public.entity_links
    for delete
    using (source_type = 'finding' and public.is_admin());
  end if;
end $$;

insert into public.technology_tools (
  name,
  provider,
  cost,
  currency,
  license_type,
  user_count,
  internal_owner,
  area_names,
  usage_light
)
select tool_name, tool_name, 0, 'COP', 'Por definir', 0, 'Por definir', '{}', 'Amarillo'::traffic_light
from (
  values
    ('Microsoft'),
    ('LuxFlow'),
    ('Siigo Contai'),
    ('Siigo Nominai'),
    ('Siigo Facturación'),
    ('Intranet'),
    ('Universidad Pinares'),
    ('SharePoint - Microsoft'),
    ('Fudo'),
    ('Zebra'),
    ('IVMS 4600'),
    ('IVMS 4200'),
    ('Canva'),
    ('SIIS'),
    ('Coco'),
    ('Kommo'),
    ('Google'),
    ('Whatsapp'),
    ('WonderShare'),
    ('App Ingeniería Clínica'),
    ('Sitrad'),
    ('Equipos Biomédicos')
) as seed(tool_name)
where not exists (
  select 1
  from public.technology_tools existing_tool
  where lower(existing_tool.name) = lower(seed.tool_name)
);
