-- Pinares Project Control - agrega area transversal para registros que aplican a toda la organizacion.
-- Es idempotente y no modifica relaciones existentes.

insert into public.areas (name)
values ('Todas')
on conflict (name) do nothing;
