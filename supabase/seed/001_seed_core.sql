insert into public.modules (key, label, description) values
('dashboard', 'Panel ejecutivo', 'Indicadores clave del proyecto'),
('stakeholders', 'Stakeholders', 'Usuarios, roles y permisos'),
('documentos', 'Documentos', 'Repositorio por fases'),
('cronograma', 'Cronograma', 'Kanban de tareas e hitos'),
('comunicacion', 'Comunicacion', 'Muro general con menciones'),
('inventario', 'Inventario TI', 'Herramientas, costos y uso'),
('procesos', 'Procesos', 'Documentacion por area'),
('hallazgos', 'Hallazgos', 'Observaciones y criticidad'),
('riesgos', 'Riesgos', 'Cumplimiento y seguridad'),
('decisiones', 'Decisiones', 'Trazabilidad ejecutiva'),
('entregables', 'Entregables', 'Control contractual')
on conflict (key) do nothing;

insert into public.phases (code, name, week_range, progress) values
('fase-0', 'Fase 0 - Alineacion Estrategica', 'Semana 1', 100),
('fase-1', 'Fase 1 - Inventario Tecnologico', 'Semanas 2-3', 0),
('fase-2', 'Fase 2 - Mapeo de Procesos por Area', 'Semanas 4-6', 0),
('fase-3', 'Fase 3 - Construccion del Escenario Actual', 'Semanas 7-8', 0),
('fase-4', 'Fase 4 - Diseno del Escenario Ideal', 'Semanas 9-10', 0),
('fase-5', 'Fase 5 - Roadmap de Implementacion', 'Semana 11', 0),
('fase-6', 'Fase 6 - Presentacion de Resultados', 'Semana 12', 0)
on conflict (code) do nothing;

insert into public.areas (name) values
('Admision y recepcion de pacientes'),
('Agendamiento de citas'),
('Historia clinica / Atencion medica'),
('Hospitalizacion / Internacion'),
('Gestion de medicamentos / Farmacia'),
('Laboratorio y diagnostico'),
('Nutricion y alimentacion'),
('Facturacion y cartera'),
('Contabilidad y finanzas'),
('Nomina y gestion de RRHH'),
('Compras y logistica'),
('Calidad, acreditacion y auditoria'),
('Reportes normativos / entes de control'),
('Comunicaciones internas'),
('Comunicaciones externas / Marketing'),
('Seguridad e infraestructura fisica'),
('Gestion de TI / Sistemas'),
('Gerencia y toma de decisiones')
on conflict (name) do nothing;

insert into public.tags (name) values
('Urgente'), ('Pregunta'), ('Pendiente Pinares'), ('Decision'), ('Riesgo')
on conflict (name) do nothing;

insert into public.folders (name, phase_id)
select replace(name, ' - ', ' / '), id from public.phases
on conflict do nothing;

insert into public.deliverables (title, phase_id, status)
select 'Documento de kickoff con alcance confirmado, cronograma detallado y stakeholders del proyecto', id, 'Pendiente' from public.phases where code = 'fase-0'
union all select 'Matriz de inventario tecnologico con semaforo de aprovechamiento y alertas por herramienta', id, 'Pendiente' from public.phases where code = 'fase-1'
union all select 'Repositorio digital de procesos', id, 'Pendiente' from public.phases where code = 'fase-2'
union all select 'Tabla de hallazgos con clasificacion de criticidad', id, 'Pendiente' from public.phases where code = 'fase-2'
union all select 'Documento de diagnostico consolidado', id, 'Pendiente' from public.phases where code = 'fase-3'
union all select 'Mapa visual del ecosistema tecnologico actual', id, 'Pendiente' from public.phases where code = 'fase-3'
union all select 'Mapa del ecosistema tecnologico ideal', id, 'Pendiente' from public.phases where code = 'fase-4'
union all select 'Analisis comparativo: escenario actual vs. escenario ideal', id, 'Pendiente' from public.phases where code = 'fase-4'
union all select 'Roadmap visual con tres horizontes', id, 'Pendiente' from public.phases where code = 'fase-5'
union all select 'Presentacion ejecutiva de resultados', id, 'Pendiente' from public.phases where code = 'fase-6';
