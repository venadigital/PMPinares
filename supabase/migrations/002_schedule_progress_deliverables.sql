create table if not exists public.task_deliverables (
  task_id uuid not null references public.tasks(id) on delete cascade,
  deliverable_id uuid not null references public.deliverables(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (task_id, deliverable_id)
);

alter table public.task_deliverables enable row level security;

drop policy if exists "task deliverables access" on public.task_deliverables;
drop policy if exists "task deliverables write" on public.task_deliverables;

create policy "task deliverables access" on public.task_deliverables
for select using (public.has_module_access('cronograma') or public.has_module_access('entregables'));

create policy "task deliverables write" on public.task_deliverables
for all using (public.has_module_access('cronograma')) with check (public.has_module_access('cronograma'));

with task_seed(title, description, phase_code, status, priority, item_type, start_date, due_date) as (
  values
    ('Kick-off del proyecto', 'Sesion inicial para confirmar alcance, metodologia, roles y reglas de trabajo.', 'fase-0', 'Completado', 'Alta', 'Hito', date '2026-05-07', date '2026-05-07'),
    ('Contrato y confidencialidad', 'Formalizacion de condiciones de trabajo y manejo de informacion sensible.', 'fase-0', 'Completado', 'Alta', 'Entregable', date '2026-05-06', date '2026-05-06'),
    ('Confirmar stakeholders y permisos', 'Validar usuarios clave, administradores y permisos iniciales por modulo.', 'fase-0', 'Completado', 'Media', 'Tarea', date '2026-05-08', date '2026-05-10'),
    ('Levantar inventario de herramientas activas', 'Registrar herramientas, proveedores, usuarios, costos, areas usuarias e integraciones.', 'fase-1', 'No iniciado', 'Alta', 'Tarea', null, null),
    ('Evaluar aprovechamiento por herramienta', 'Asignar semaforo manual y nivel de satisfaccion por grupo usuario.', 'fase-1', 'No iniciado', 'Alta', 'Tarea', null, null),
    ('Documentar riesgos del stack tecnologico', 'Relacionar riesgos asociados a herramientas criticas y brechas de uso.', 'fase-1', 'No iniciado', 'Media', 'Tarea', null, null),
    ('Consolidar matriz de inventario tecnologico', 'Preparar entregable final del inventario tecnologico con alertas por herramienta.', 'fase-1', 'No iniciado', 'Alta', 'Entregable', null, null),
    ('Recolectar documentos de procesos por area', 'Centralizar documentos base y evidencias de procesos actuales.', 'fase-2', 'No iniciado', 'Alta', 'Tarea', null, null),
    ('Registrar entrevistas de procesos', 'Documentar notas, audios, participantes y actas de entrevistas por proceso.', 'fase-2', 'No iniciado', 'Alta', 'Tarea', null, null),
    ('Mapear procesos principales e impactados', 'Crear registros de procesos con area principal y areas impactadas.', 'fase-2', 'No iniciado', 'Alta', 'Tarea', null, null),
    ('Consolidar repositorio digital de procesos', 'Organizar entregable de procesos documentados por area.', 'fase-2', 'No iniciado', 'Media', 'Entregable', null, null),
    ('Clasificar hallazgos iniciales', 'Registrar hallazgos operativos, tecnologicos, seguridad, cumplimiento y costos.', 'fase-2', 'No iniciado', 'Alta', 'Entregable', null, null),
    ('Analizar escenario tecnologico actual', 'Consolidar lectura del estado actual de herramientas, procesos y riesgos.', 'fase-3', 'No iniciado', 'Alta', 'Tarea', null, null),
    ('Construir diagnostico consolidado', 'Preparar documento de diagnostico con hallazgos y oportunidades.', 'fase-3', 'No iniciado', 'Alta', 'Entregable', null, null),
    ('Representar ecosistema tecnologico actual', 'Crear mapa visual del ecosistema actual y sus dependencias principales.', 'fase-3', 'No iniciado', 'Media', 'Entregable', null, null),
    ('Definir escenario tecnologico ideal', 'Diseñar lineamientos del escenario ideal segun necesidades levantadas.', 'fase-4', 'No iniciado', 'Alta', 'Tarea', null, null),
    ('Construir mapa del ecosistema ideal', 'Preparar entregable visual del ecosistema tecnologico objetivo.', 'fase-4', 'No iniciado', 'Alta', 'Entregable', null, null),
    ('Comparar escenario actual vs ideal', 'Documentar brechas, prioridades y recomendaciones principales.', 'fase-4', 'No iniciado', 'Alta', 'Entregable', null, null),
    ('Priorizar iniciativas del roadmap', 'Ordenar iniciativas por impacto, complejidad y horizonte de implementacion.', 'fase-5', 'No iniciado', 'Alta', 'Tarea', null, null),
    ('Construir roadmap visual de tres horizontes', 'Preparar roadmap ejecutivo con iniciativas por horizonte.', 'fase-5', 'No iniciado', 'Alta', 'Entregable', null, null),
    ('Preparar presentacion ejecutiva', 'Armar narrativa final, metricas, hallazgos y recomendaciones.', 'fase-6', 'No iniciado', 'Alta', 'Tarea', null, null),
    ('Presentar resultados a stakeholders', 'Sesion de presentacion ejecutiva de resultados y siguientes pasos.', 'fase-6', 'No iniciado', 'Alta', 'Hito', null, null),
    ('Entregar presentacion ejecutiva final', 'Publicar presentacion ejecutiva de resultados en la plataforma.', 'fase-6', 'No iniciado', 'Alta', 'Entregable', null, null)
)
insert into public.tasks (title, description, phase_id, status, priority, item_type, start_date, due_date)
select task_seed.title, task_seed.description, phases.id, task_seed.status::task_status, task_seed.priority::priority_level, task_seed.item_type, task_seed.start_date, task_seed.due_date
from task_seed
join public.phases on phases.code = task_seed.phase_code
where not exists (
  select 1
  from public.tasks existing
  where existing.title = task_seed.title
    and existing.phase_id = phases.id
);

insert into public.task_deliverables (task_id, deliverable_id)
select tasks.id, deliverables.id
from public.tasks
join public.deliverables on (
  (tasks.title = 'Contrato y confidencialidad' and deliverables.title ilike 'Documento de kickoff%')
  or (tasks.title = 'Consolidar matriz de inventario tecnologico' and deliverables.title ilike 'Matriz de inventario tecnologico%')
  or (tasks.title = 'Consolidar repositorio digital de procesos' and deliverables.title ilike 'Repositorio digital de procesos%')
  or (tasks.title = 'Clasificar hallazgos iniciales' and deliverables.title ilike 'Tabla de hallazgos%')
  or (tasks.title = 'Construir diagnostico consolidado' and deliverables.title ilike 'Documento de diagnostico%')
  or (tasks.title = 'Representar ecosistema tecnologico actual' and deliverables.title ilike 'Mapa visual del ecosistema tecnologico actual%')
  or (tasks.title = 'Construir mapa del ecosistema ideal' and deliverables.title ilike 'Mapa del ecosistema tecnologico ideal%')
  or (tasks.title = 'Comparar escenario actual vs ideal' and deliverables.title ilike 'Analisis comparativo%')
  or (tasks.title = 'Construir roadmap visual de tres horizontes' and deliverables.title ilike 'Roadmap visual%')
  or (tasks.title = 'Entregar presentacion ejecutiva final' and deliverables.title ilike 'Presentacion ejecutiva%')
)
on conflict do nothing;
