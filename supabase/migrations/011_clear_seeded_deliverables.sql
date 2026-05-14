-- Limpia entregables de plantilla para que el modulo de entregables inicie sin contenido demo.
-- Solo elimina titulos cargados por seeds/migraciones iniciales; no afecta entregables futuros creados por usuarios.

with seeded_deliverables(title) as (
  values
    ('Matriz de inventario tecnológico con semáforo de aprovechamiento'),
    ('Documento Kick-off'),
    ('Flujo por cada uno de los procesos'),
    ('Diagnóstico tecnológico actual'),
    ('Ecosistema tecnológico ideal'),
    ('Mapa visual diagnóstico tecnológico'),
    ('Planillas de aprovechamiento por software'),
    ('Actas entrevistas Software'),
    ('Actas entrevistas'),
    ('Documento de riesgos escenario actual'),
    ('Acta de cierre y próximos pasos acordados'),
    ('Análisis comparativo escenario ideal vs escenario actual'),
    ('Repositorio digital completo de la consultoría (accesible para el equipo de Pinares)'),
    ('Contrato'),
    ('Roadmap de implementación Mejoras estructurales'),
    ('Tabla de hallazgos de criticidad en procesos'),
    ('Roadmap de implementación Quick Wins'),
    ('Roadmap de implementación Transformación tecnológica'),
    ('Listado_Software_Pinares_0426'),
    ('Justificación de diseño tecnológico'),
    ('Links de procesos actualizados en Sharepoint'),
    ('Contrato y confidencialidad'),
    ('Repositorio digital de procesos'),
    ('Tabla de hallazgos con clasificacion de criticidad'),
    ('Documento de diagnostico consolidado'),
    ('Mapa visual del ecosistema tecnologico actual'),
    ('Mapa del ecosistema tecnologico ideal'),
    ('Analisis comparativo: escenario actual vs. escenario ideal'),
    ('Roadmap visual con tres horizontes'),
    ('Presentacion ejecutiva de resultados'),
    ('Matriz de inventario tecnologico con semaforo de aprovechamiento y alertas por herramienta'),
    ('Documento de kickoff con alcance confirmado, cronograma detallado y stakeholders del proyecto')
),
target_deliverables as (
  select deliverables.id
  from public.deliverables
  join seeded_deliverables on seeded_deliverables.title = deliverables.title
)
delete from public.task_deliverables
where deliverable_id in (select id from target_deliverables);

with seeded_deliverables(title) as (
  values
    ('Matriz de inventario tecnológico con semáforo de aprovechamiento'),
    ('Documento Kick-off'),
    ('Flujo por cada uno de los procesos'),
    ('Diagnóstico tecnológico actual'),
    ('Ecosistema tecnológico ideal'),
    ('Mapa visual diagnóstico tecnológico'),
    ('Planillas de aprovechamiento por software'),
    ('Actas entrevistas Software'),
    ('Actas entrevistas'),
    ('Documento de riesgos escenario actual'),
    ('Acta de cierre y próximos pasos acordados'),
    ('Análisis comparativo escenario ideal vs escenario actual'),
    ('Repositorio digital completo de la consultoría (accesible para el equipo de Pinares)'),
    ('Contrato'),
    ('Roadmap de implementación Mejoras estructurales'),
    ('Tabla de hallazgos de criticidad en procesos'),
    ('Roadmap de implementación Quick Wins'),
    ('Roadmap de implementación Transformación tecnológica'),
    ('Listado_Software_Pinares_0426'),
    ('Justificación de diseño tecnológico'),
    ('Links de procesos actualizados en Sharepoint'),
    ('Contrato y confidencialidad'),
    ('Repositorio digital de procesos'),
    ('Tabla de hallazgos con clasificacion de criticidad'),
    ('Documento de diagnostico consolidado'),
    ('Mapa visual del ecosistema tecnologico actual'),
    ('Mapa del ecosistema tecnologico ideal'),
    ('Analisis comparativo: escenario actual vs. escenario ideal'),
    ('Roadmap visual con tres horizontes'),
    ('Presentacion ejecutiva de resultados'),
    ('Matriz de inventario tecnologico con semaforo de aprovechamiento y alertas por herramienta'),
    ('Documento de kickoff con alcance confirmado, cronograma detallado y stakeholders del proyecto')
)
delete from public.deliverables
using seeded_deliverables
where seeded_deliverables.title = deliverables.title;
