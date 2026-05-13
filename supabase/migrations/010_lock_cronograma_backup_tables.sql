-- Lock temporary backup tables created during the Cronograma V1 replacement.
-- They are not used by the app, but they live in the exposed public schema.
-- RLS without public policies keeps the data available to privileged database roles only.

alter table if exists public.tasks_backup_cronograma_v1_20260511 enable row level security;
alter table if exists public.task_deliverables_backup_cronograma_v1_20260511 enable row level security;
alter table if exists public.deliverables_backup_cronograma_v1_20260511 enable row level security;
