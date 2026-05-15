import { CalendarDays, Download, Eye, FileText, Link2, MessageSquare, Paperclip, Plus, Send, SlidersHorizontal, Trash2, Users } from "lucide-react";
import { createProjectTaskAction, createProjectTaskCommentAction, deleteProjectTaskAction, updateProjectTaskAction } from "@/app/(dashboard)/tareas/actions";
import { PageHeader } from "@/components/modules/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { getCurrentProfile, hasPermission } from "@/lib/auth";
import { formatOptionalDate, getProjectTasksData, projectTaskPriorities, projectTaskStatuses, type ProjectTaskAttachment, type ProjectTaskRecord, type ProjectTaskStatus } from "@/lib/project-tasks";
import type { Phase, Priority, UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TasksPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

type FilterKey = "all" | ProjectTaskStatus;

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const params = searchParams ? await searchParams : {};
  const [{ tasks, phases, users, findings, risks }, profile] = await Promise.all([getProjectTasksData(), getCurrentProfile()]);
  const canView = hasPermission(profile, "tareas", "view");
  const canCreate = hasPermission(profile, "tareas", "create");
  const canEdit = hasPermission(profile, "tareas", "edit");
  const canDelete = hasPermission(profile, "tareas", "delete");
  const activeStatus = normalizeFilter(params.status);
  const activePriority = typeof params.priority === "string" ? params.priority : "all";
  const activePhase = typeof params.phase === "string" ? params.phase : "all";
  const activeUser = typeof params.user === "string" ? params.user : "all";
  const activeFinding = typeof params.finding === "string" ? params.finding : "all";
  const activeRisk = typeof params.risk === "string" ? params.risk : "all";

  if (!canView) {
    return (
      <>
        <PageHeader eyebrow="Gestion operativa" title="Tareas" description="Tu usuario no tiene acceso al modulo de tareas." />
        <Card>
          <p className="font-medium text-slate-600">Solicita acceso al Administrador Vena Digital si necesitas gestionar tareas operativas.</p>
        </Card>
      </>
    );
  }

  const filteredTasks = tasks.filter((task) => {
    if (activeStatus !== "all" && task.status !== activeStatus) return false;
    if (activePriority !== "all" && task.priority !== activePriority) return false;
    if (activePhase !== "all" && task.phaseId !== activePhase) return false;
    if (activeUser !== "all" && !task.assignees.some((assignee) => assignee.id === activeUser)) return false;
    if (activeFinding !== "all" && !task.links.some((link) => link.type === "finding" && link.targetId === activeFinding)) return false;
    if (activeRisk !== "all" && !task.links.some((link) => link.type === "risk" && link.targetId === activeRisk)) return false;
    return true;
  });

  return (
    <>
      <PageHeader
        eyebrow="Gestion operativa"
        title="Tareas"
        description="Crea, asigna y da seguimiento a tareas operativas con comentarios, adjuntos y trazabilidad hacia hallazgos o riesgos."
      />

      <StatusMessages params={params} />

      <div className="grid gap-5">
        <TaskMatrix
          tasks={filteredTasks}
          allTasks={tasks}
          phases={phases}
          users={users}
          findings={findings}
          risks={risks}
          activeStatus={activeStatus}
          activePriority={activePriority}
          activePhase={activePhase}
          activeUser={activeUser}
          activeFinding={activeFinding}
          activeRisk={activeRisk}
          canEdit={canEdit}
          canDelete={canDelete}
        />
        <TaskCreatePanel canCreate={canCreate} phases={phases} users={users} findings={findings} risks={risks} />
      </div>
    </>
  );
}

function TaskCreatePanel({ canCreate, phases, users, findings, risks }: { canCreate: boolean; phases: Phase[]; users: UserProfile[]; findings: { id: string; label: string }[]; risks: { id: string; label: string }[] }) {
  return (
    <Card className="overflow-hidden border-white/80 bg-white/70 p-0">
      <div className="grid gap-3 border-b border-white/70 bg-white/50 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div>
          <p className="text-[0.64rem] font-semibold uppercase tracking-[0.14em] text-blueprint">Nueva tarea</p>
          <h2 className="mt-1 font-display text-xl font-bold tracking-tight text-ink">Crear tarea operativa</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">Registra la actividad, asigna responsables y agrega trazabilidad solo si aplica.</p>
        </div>
        <Badge tone="blue" className="w-fit">Notifica por correo</Badge>
      </div>

      <form action={createProjectTaskAction} className="p-4">
        <fieldset disabled={!canCreate} className="grid gap-4 disabled:opacity-55">
          <section className="rounded-[1.25rem] border border-white/80 bg-white/68 p-4 shadow-sm shadow-ink/5">
            <SectionTitle title="Informacion base" eyebrow="Datos principales" compact />
            <div className="mt-4 grid gap-3 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <Field label="Titulo">
                  <Input name="title" placeholder="Ej. Validar responsable de inventario" required className="h-10" />
                </Field>
              </div>
              <div className="lg:col-span-2">
                <Field label="Prioridad">
                  <Select name="priority" defaultValue="Media" className="h-10">
                    {projectTaskPriorities.map((priority) => <option key={priority}>{priority}</option>)}
                  </Select>
                </Field>
              </div>
              <div className="lg:col-span-3">
                <Field label="Fase ligada">
                  <Select name="phaseId" defaultValue="" className="h-10">
                    <option value="">Sin fase</option>
                    {phases.map((phase) => <option key={phase.id} value={phase.id}>{phase.name}</option>)}
                  </Select>
                </Field>
              </div>
              <div className="lg:col-span-3">
                <Field label="Estado">
                  <Select name="status" defaultValue="Pendiente" className="h-10">
                    {projectTaskStatuses.map((status) => <option key={status}>{status}</option>)}
                  </Select>
                </Field>
              </div>
              <div className="lg:col-span-6">
                <Field label="Descripcion">
                  <Textarea name="description" placeholder="Contexto, alcance o instrucciones para resolver la tarea." className="min-h-20" />
                </Field>
              </div>
              <div className="lg:col-span-3">
                <Field label="Fecha inicio">
                  <Input name="startDate" type="date" className="h-10" />
                </Field>
              </div>
              <div className="lg:col-span-3">
                <Field label="Fecha finalizacion">
                  <Input name="dueDate" type="date" className="h-10" />
                </Field>
              </div>
            </div>
          </section>

          <section className="grid gap-3 lg:grid-cols-3">
            <CollapsibleOptionPanel title="Asignar usuarios" icon={<Users className="h-4 w-4" />} empty="No hay usuarios disponibles." count={users.length}>
              {users.map((user) => <CheckboxPill key={user.id} name="assigneeIds" value={user.id} title={user.name} description={user.area || user.role} />)}
            </CollapsibleOptionPanel>
            <CollapsibleOptionPanel title="Vincular hallazgos" icon={<Link2 className="h-4 w-4" />} empty="No hay hallazgos registrados." count={findings.length}>
              {findings.map((finding) => <CheckboxPill key={finding.id} name="findingIds" value={finding.id} title={finding.label} />)}
            </CollapsibleOptionPanel>
            <CollapsibleOptionPanel title="Vincular riesgos" icon={<Link2 className="h-4 w-4" />} empty="No hay riesgos registrados." count={risks.length}>
              {risks.map((risk) => <CheckboxPill key={risk.id} name="riskIds" value={risk.id} title={risk.label} />)}
            </CollapsibleOptionPanel>
          </section>

          <section className="grid gap-3 rounded-[1.25rem] border border-dashed border-blueprint/25 bg-blueprint/7 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.9fr)_auto] lg:items-center">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-blueprint/10 text-blueprint"><Paperclip className="h-4 w-4" /></span>
              <div>
                <p className="text-sm font-semibold text-ink">Adjuntos de soporte</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">PDF, Word, Excel, imagenes u otros archivos. Maximo 250 MB por archivo.</p>
              </div>
            </div>
            <Input name="attachments" type="file" multiple className="h-10 bg-white/85" />
            <Button type="submit" variant="accent" className="h-10 gap-2 whitespace-nowrap px-5">
              <Plus className="h-4 w-4" />
              Crear tarea
            </Button>
          </section>
        </fieldset>
        {!canCreate ? <p className="mt-4 rounded-xl bg-blueprint/10 p-3 text-sm font-medium text-slate-600">Tu usuario puede consultar tareas, pero no tiene permiso para crearlas.</p> : null}
      </form>
    </Card>
  );
}

function TaskMatrix(props: {
  tasks: ProjectTaskRecord[];
  allTasks: ProjectTaskRecord[];
  phases: Phase[];
  users: UserProfile[];
  findings: { id: string; label: string }[];
  risks: { id: string; label: string }[];
  activeStatus: FilterKey;
  activePriority: string;
  activePhase: string;
  activeUser: string;
  activeFinding: string;
  activeRisk: string;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const { tasks, allTasks, phases, users, findings, risks, activeStatus, activePriority, activePhase, activeUser, activeFinding, activeRisk, canEdit, canDelete } = props;
  const statusCounts = Object.fromEntries(projectTaskStatuses.map((status) => [status, allTasks.filter((task) => task.status === status).length])) as Record<ProjectTaskStatus, number>;

  return (
    <Card className="overflow-hidden p-0">
      <div className="grid gap-3 border-b border-white/70 bg-white/45 p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-blueprint">Matriz</p>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">Tareas registradas</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Revisa estado, responsables, vencimientos y trazabilidad asociada sin mezclarlo con el avance del cronograma.</p>
        </div>
        <Badge tone="yellow" className="w-fit">{tasks.length} tareas</Badge>
      </div>

      <div className="grid gap-5 p-5">
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
          <FilterCard href="/tareas" active={activeStatus === "all"} count={allTasks.length} label="Todas" />
          {projectTaskStatuses.map((status) => (
            <FilterCard key={status} href={`/tareas?status=${encodeURIComponent(status)}`} active={activeStatus === status} count={statusCounts[status]} label={status} />
          ))}
        </div>

        <form className="rounded-[1.25rem] border border-white/80 bg-white/58 p-4 shadow-inner shadow-white/60">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            <SlidersHorizontal className="h-4 w-4 text-blueprint" />
            Filtros avanzados
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <Select name="priority" defaultValue={activePriority} aria-label="Filtrar por prioridad">
              <option value="all">Todas las prioridades</option>
              {projectTaskPriorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
            </Select>
            <Select name="phase" defaultValue={activePhase} aria-label="Filtrar por fase">
              <option value="all">Todas las fases</option>
              {phases.map((phase) => <option key={phase.id} value={phase.id}>{phase.name}</option>)}
            </Select>
            <Select name="user" defaultValue={activeUser} aria-label="Filtrar por usuario">
              <option value="all">Todos los usuarios</option>
              {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
            </Select>
            <Select name="finding" defaultValue={activeFinding} aria-label="Filtrar por hallazgo">
              <option value="all">Todos los hallazgos</option>
              {findings.map((finding) => <option key={finding.id} value={finding.id}>{finding.label}</option>)}
            </Select>
            <Select name="risk" defaultValue={activeRisk} aria-label="Filtrar por riesgo">
              <option value="all">Todos los riesgos</option>
              {risks.map((risk) => <option key={risk.id} value={risk.id}>{risk.label}</option>)}
            </Select>
          </div>
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            <Button href="/tareas" variant="ghost" className="px-3.5 py-1.5 text-xs">Limpiar</Button>
            <Button type="submit" variant="primary" className="px-4 py-1.5 text-xs">Aplicar filtros</Button>
          </div>
        </form>

        {tasks.length === 0 ? <EmptyTasks /> : <div className="grid gap-3">{tasks.map((task) => <TaskRow key={task.id} task={task} phases={phases} users={users} findings={findings} risks={risks} canEdit={canEdit} canDelete={canDelete} />)}</div>}
      </div>
    </Card>
  );
}

function TaskRow({ task, phases, users, findings, risks, canEdit, canDelete }: { task: ProjectTaskRecord; phases: Phase[]; users: UserProfile[]; findings: { id: string; label: string }[]; risks: { id: string; label: string }[]; canEdit: boolean; canDelete: boolean }) {
  const linkedFindingIds = task.links.filter((link) => link.type === "finding").map((link) => link.targetId);
  const linkedRiskIds = task.links.filter((link) => link.type === "risk").map((link) => link.targetId);
  const assignedIds = new Set(task.assignees.map((assignee) => assignee.id));

  return (
    <details id={`task-${task.id}`} className="group scroll-mt-8 rounded-[1.35rem] border border-white/80 bg-white/68 p-4 shadow-sm shadow-ink/5 open:bg-white/82">
      <summary className="grid cursor-pointer list-none gap-3 lg:grid-cols-[minmax(0,1.4fr)_12rem_14rem_8rem] lg:items-center">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge tone={priorityTone(task.priority)}>{task.priority}</Badge>
            <Badge tone={statusTone(task.status)}>{task.status}</Badge>
            {task.links.length > 0 ? <Badge tone="blue">{task.links.length} vinculos</Badge> : null}
          </div>
          <p className="font-display text-lg font-semibold text-ink">{task.title}</p>
          <p className="mt-1 text-xs font-medium text-slate-500">{task.phaseName}</p>
        </div>
        <div className="text-sm text-slate-600">
          <p className="font-semibold text-ink">Asignados</p>
          <p className="mt-1 truncate">{task.assignees.length > 0 ? task.assignees.map((assignee) => assignee.name).join(", ") : "Sin asignar"}</p>
        </div>
        <div className="text-sm text-slate-600">
          <p className="font-semibold text-ink">Fechas</p>
          <p className="mt-1">Inicio: {formatOptionalDate(task.startDate)}</p>
          <p>Fin: {formatOptionalDate(task.dueDate)}</p>
        </div>
        <span className="rounded-full bg-blueprint/10 px-3 py-1.5 text-center text-xs font-semibold uppercase tracking-[0.12em] text-blueprint ring-1 ring-blueprint/15">Detalle</span>
      </summary>

      <div className="mt-5 grid gap-5 border-t border-white/80 pt-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid gap-4">
          <div className="rounded-2xl bg-white/65 p-4 ring-1 ring-white/80">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-blueprint">Descripcion</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{task.description || "Sin descripcion registrada."}</p>
          </div>

          <form action={updateProjectTaskAction} className="rounded-2xl bg-white/65 p-4 ring-1 ring-white/80">
            <input type="hidden" name="taskId" value={task.id} />
            <SectionTitle title="Editar tarea" eyebrow="Gestion" compact />
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <Field label="Titulo"><Input name="title" defaultValue={task.title} required /></Field>
              <Field label="Estado"><Select name="status" defaultValue={task.status}>{projectTaskStatuses.map((status) => <option key={status}>{status}</option>)}</Select></Field>
              <Field label="Prioridad"><Select name="priority" defaultValue={task.priority}>{projectTaskPriorities.map((priority) => <option key={priority}>{priority}</option>)}</Select></Field>
              <Field label="Fase"><Select name="phaseId" defaultValue={task.phaseId ?? ""}><option value="">Sin fase</option>{phases.map((phase) => <option key={phase.id} value={phase.id}>{phase.name}</option>)}</Select></Field>
              <Field label="Fecha inicio"><Input name="startDate" type="date" defaultValue={task.startDate ?? ""} /></Field>
              <Field label="Fecha finalizacion"><Input name="dueDate" type="date" defaultValue={task.dueDate ?? ""} /></Field>
            </div>
            <Field label="Descripcion"><Textarea name="description" defaultValue={task.description} /></Field>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <CompactChecks title="Asignados">{users.map((user) => <CheckboxPill key={user.id} name="assigneeIds" value={user.id} title={user.name} defaultChecked={assignedIds.has(user.id)} />)}</CompactChecks>
              <CompactChecks title="Hallazgos">{findings.map((finding) => <CheckboxPill key={finding.id} name="findingIds" value={finding.id} title={finding.label} defaultChecked={linkedFindingIds.includes(finding.id)} />)}</CompactChecks>
              <CompactChecks title="Riesgos">{risks.map((risk) => <CheckboxPill key={risk.id} name="riskIds" value={risk.id} title={risk.label} defaultChecked={linkedRiskIds.includes(risk.id)} />)}</CompactChecks>
            </div>

            <div className="mt-4 rounded-2xl border border-dashed border-blueprint/20 bg-blueprint/5 p-3">
              <p className="mb-2 text-xs font-semibold text-ink">Agregar adjuntos</p>
              <Input name="attachments" type="file" multiple />
            </div>

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              {canEdit ? <Button type="submit" variant="primary">Guardar cambios</Button> : null}
            </div>
          </form>

          <CommentBox task={task} canEdit={canEdit} />
        </div>

        <aside className="grid content-start gap-4">
          <InfoPanel title="Trazabilidad" icon={<Link2 className="h-4 w-4" />}>
            {task.links.length === 0 ? <p className="text-sm text-slate-500">Sin hallazgos o riesgos vinculados.</p> : task.links.map((link) => <Badge key={link.id} tone={link.type === "risk" ? "red" : "blue"}>{link.type === "risk" ? "Riesgo" : "Hallazgo"}: {link.label}</Badge>)}
          </InfoPanel>
          <InfoPanel title="Adjuntos" icon={<Paperclip className="h-4 w-4" />}>
            <AttachmentList attachments={task.attachments} />
          </InfoPanel>
          <InfoPanel title="Actividad" icon={<CalendarDays className="h-4 w-4" />}>
            <p className="text-sm text-slate-600">Creada por {task.createdBy}</p>
            <p className="text-sm text-slate-500">Creado: {task.createdAt}</p>
            <p className="text-sm text-slate-500">Actualizado: {task.updatedAt}</p>
          </InfoPanel>
          {canDelete ? (
            <form action={deleteProjectTaskAction}>
              <input type="hidden" name="taskId" value={task.id} />
              <button className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-full bg-coral/10 px-4 py-2 text-sm font-semibold text-coral ring-1 ring-coral/20 transition hover:bg-coral hover:text-white">
                <Trash2 className="h-4 w-4" />
                Eliminar tarea
              </button>
            </form>
          ) : null}
        </aside>
      </div>
    </details>
  );
}

function CommentBox({ task, canEdit }: { task: ProjectTaskRecord; canEdit: boolean }) {
  return (
    <div className="rounded-2xl bg-ink/5 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-ink"><MessageSquare className="h-4 w-4 text-blueprint" />Comentarios</p>
        <Badge tone="neutral">{task.comments.length}</Badge>
      </div>
      {task.comments.length === 0 ? <p className="mb-3 rounded-xl bg-white/70 p-3 text-sm text-slate-500">Aun no hay comentarios para esta tarea.</p> : null}
      <div className="mb-3 grid gap-2">
        {task.comments.map((comment) => (
          <div key={comment.id} className="rounded-xl bg-white/75 p-3 ring-1 ring-white/80">
            <p className="text-sm font-semibold text-ink">{comment.authorName}</p>
            <p className="text-xs text-slate-500">{comment.createdAt}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{comment.body}</p>
          </div>
        ))}
      </div>
      <form action={createProjectTaskCommentAction} className="grid gap-3">
        <fieldset disabled={!canEdit} className="grid gap-3 disabled:opacity-55">
          <input type="hidden" name="taskId" value={task.id} />
          <Textarea name="body" placeholder="Comenta avance, solicita informacion o registra resolucion..." required />
          <div className="flex justify-end"><Button type="submit" variant="primary" className="gap-2"><Send className="h-4 w-4" />Comentar</Button></div>
        </fieldset>
      </form>
    </div>
  );
}

function StatusMessages({ params }: { params: Record<string, string | string[] | undefined> }) {
  const error = typeof params.error === "string" ? params.error : null;
  return (
    <>
      {error ? <p className="mb-5 rounded-2xl bg-coral/10 p-4 text-sm font-bold text-coral">{error}</p> : null}
      {params.created === "1" ? <p className="mb-5 rounded-2xl bg-emerald-500/10 p-4 text-sm font-bold text-emerald-700">Tarea creada correctamente.</p> : null}
      {params.updated === "1" ? <p className="mb-5 rounded-2xl bg-blueprint/10 p-4 text-sm font-bold text-blueprint">Tarea actualizada correctamente.</p> : null}
      {params.commented === "1" ? <p className="mb-5 rounded-2xl bg-blueprint/10 p-4 text-sm font-bold text-blueprint">Comentario agregado correctamente.</p> : null}
      {params.deleted === "1" ? <p className="mb-5 rounded-2xl bg-blueprint/10 p-4 text-sm font-bold text-blueprint">Tarea eliminada correctamente.</p> : null}
    </>
  );
}

function SectionTitle({ title, eyebrow, compact = false }: { title: string; eyebrow: string; compact?: boolean }) {
  return (
    <div>
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-blueprint">{eyebrow}</p>
      <h3 className={cn("font-display font-bold tracking-tight text-ink", compact ? "text-lg" : "text-xl")}>{title}</h3>
    </div>
  );
}

function OptionPanel({ title, icon, empty, count, children }: { title: string; icon: React.ReactNode; empty: string; count: number; children: React.ReactNode }) {
  return (
    <section className="rounded-[1.25rem] border border-white/80 bg-white/62 p-4 shadow-sm shadow-ink/5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">{icon}{title}</div>
        <Badge tone="neutral">{count}</Badge>
      </div>
      {count > 0 ? <div className="max-h-44 space-y-2 overflow-y-auto pr-1">{children}</div> : <p className="text-sm text-slate-500">{empty}</p>}
    </section>
  );
}

function CollapsibleOptionPanel({ title, icon, empty, count, children }: { title: string; icon: React.ReactNode; empty: string; count: number; children: React.ReactNode }) {
  return (
    <details className="group rounded-[1.15rem] border border-white/80 bg-white/62 p-3 shadow-sm shadow-ink/5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-ink">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-blueprint/10 text-blueprint">{icon}</span>
          <span className="truncate">{title}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <Badge tone="neutral">{count}</Badge>
          <span className="text-xs font-semibold text-blueprint transition group-open:rotate-180">v</span>
        </span>
      </summary>
      <div className="mt-3 border-t border-white/70 pt-3">
        {count > 0 ? <div className="max-h-44 space-y-2 overflow-y-auto pr-1">{children}</div> : <p className="text-sm text-slate-500">{empty}</p>}
      </div>
    </details>
  );
}

function CompactChecks({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/55 p-3 ring-1 ring-white/80">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-blueprint">{title}</p>
      <div className="max-h-44 space-y-2 overflow-y-auto pr-1">{children}</div>
    </div>
  );
}

function CheckboxPill({ name, value, title, description, defaultChecked = false }: { name: string; value: string; title: string; description?: string; defaultChecked?: boolean }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-white/72 p-2.5 text-sm ring-1 ring-white/80 transition hover:bg-white hover:ring-blueprint/20">
      <input name={name} value={value} type="checkbox" defaultChecked={defaultChecked} className="mt-1 h-4 w-4 rounded border-slate-300 accent-blueprint" />
      <span className="min-w-0">
        <span className="block truncate font-semibold text-ink">{title}</span>
        {description ? <span className="mt-0.5 block truncate text-xs text-slate-500">{description}</span> : null}
      </span>
    </label>
  );
}

function InfoPanel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white/62 p-4 ring-1 ring-white/80">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">{icon}{title}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
  );
}

function AttachmentList({ attachments }: { attachments: ProjectTaskAttachment[] }) {
  if (attachments.length === 0) return <p className="text-sm text-slate-500">Sin adjuntos.</p>;
  return (
    <div className="grid w-full gap-2">
      {attachments.map((attachment) => (
        <div key={attachment.id} className="flex items-center justify-between gap-3 rounded-xl bg-blueprint/10 p-3 ring-1 ring-blueprint/10">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{attachment.name}</p>
            <p className="text-xs text-slate-500">{attachment.type} · {attachment.size}</p>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <a href={attachment.previewUrl} target="_blank" className="focus-ring grid h-8 w-8 place-items-center rounded-full bg-white/70 text-blueprint ring-1 ring-blueprint/10" aria-label={`Ver ${attachment.name}`}><Eye className="h-3.5 w-3.5" /></a>
            <a href={attachment.downloadUrl} className="focus-ring grid h-8 w-8 place-items-center rounded-full bg-white/70 text-ink ring-1 ring-ink/10" aria-label={`Descargar ${attachment.name}`}><Download className="h-3.5 w-3.5" /></a>
          </div>
        </div>
      ))}
    </div>
  );
}

function FilterCard({ href, active, count, label }: { href: string; active: boolean; count: number; label: string }) {
  return (
    <a href={href} className={cn("focus-ring flex min-h-20 flex-col justify-between rounded-[1.05rem] p-3 ring-1 transition", active ? "bg-blueprint text-white ring-blueprint shadow-lg shadow-blueprint/20" : "bg-white/62 text-ink ring-white/80 hover:bg-white")}>
      <p className="font-display text-xl font-semibold leading-none">{count}</p>
      <p className={cn("text-[0.62rem] font-semibold uppercase tracking-[0.13em]", active ? "text-white/80" : "text-slate-500")}>{label}</p>
    </a>
  );
}

function EmptyTasks() {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-blueprint/25 bg-white/62 p-8 text-center">
      <FileText className="mx-auto h-9 w-9 text-blueprint" />
      <p className="mt-4 font-display text-xl font-bold text-ink">No hay tareas para este filtro</p>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">Cambia los filtros o crea una nueva tarea operativa para iniciar seguimiento.</p>
    </div>
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn("focus-ring w-full rounded-xl border border-white/75 bg-white/75 px-3.5 py-2.5 text-sm text-ink shadow-inner shadow-ink/5", props.className)} />;
}

function normalizeFilter(value: string | string[] | undefined): FilterKey {
  if (typeof value !== "string") return "all";
  return projectTaskStatuses.includes(value as ProjectTaskStatus) ? (value as ProjectTaskStatus) : "all";
}

function priorityTone(priority: Priority): "red" | "yellow" | "green" {
  if (priority === "Alta") return "red";
  if (priority === "Media") return "yellow";
  return "green";
}

function statusTone(status: ProjectTaskStatus): "neutral" | "blue" | "yellow" | "red" | "green" {
  if (status === "Resuelta" || status === "Cerrada") return "green";
  if (status === "Requiere informacion") return "yellow";
  if (status === "En progreso") return "blue";
  return "neutral";
}
