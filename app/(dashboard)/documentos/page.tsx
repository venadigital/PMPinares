import Link from "next/link";
import { Download, Eye, FileText, FolderPlus, Upload, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { PageHeader } from "@/components/modules/page-header";
import { createFolderAction, deleteDocumentAction, uploadDocumentAction } from "@/app/(dashboard)/documentos/actions";
import { getCurrentProfile, hasPermission } from "@/lib/auth";
import { formatFileSize, getDocumentData } from "@/lib/documents";
import type { DocumentFile, DocumentFolder } from "@/lib/documents";

interface DocumentsPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DocumentsPage({ searchParams }: DocumentsPageProps) {
  const params = searchParams ? await searchParams : {};
  const [{ phases, folders, files }, profile] = await Promise.all([getDocumentData(), getCurrentProfile()]);
  const canView = hasPermission(profile, "documentos", "view");
  const canManage = profile.role === "Administrador Vena Digital" || profile.role === "Administrador Pinares";
  const error = typeof params.error === "string" ? params.error : null;
  const uploaded = params.uploaded === "1";
  const deleted = params.deleted === "1";
  const folderCreated = params.folderCreated === "1";
  const activeFolderId = normalizeFolderFilter(params.folderId, folders);
  const visibleFiles = activeFolderId ? files.filter((file) => file.folderId === activeFolderId) : files;

  if (!canView) {
    return (
      <>
        <PageHeader eyebrow="Repositorio" title="Gestion documental" description="Tu usuario no tiene acceso al modulo de documentos." />
        <Card>
          <p className="font-semibold text-slate-600">Solicita acceso al Administrador Vena Digital si necesitas consultar documentos del proyecto.</p>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Repositorio"
        title="Gestion documental"
        description="Repositorio por fases con archivos finales, vista previa, descarga y eliminacion definitiva segun permisos."
      />

      <StatusMessages error={error} uploaded={uploaded} deleted={deleted} folderCreated={folderCreated} />

      <section className="mb-5 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <UploadPanel folders={folders} canManage={canManage} />
        <FolderPanel phases={phases} folders={folders} canManage={canManage} />
      </section>

      <section className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {folders.map((folder) => {
          const label = getFolderDisplayLabel(folder);
          const isActive = activeFolderId === folder.id;
          return (
            <Link
              key={folder.id}
              href={`/documentos?folderId=${folder.id}`}
              className={`apple-card focus-ring block p-3.5 transition hover:-translate-y-0.5 hover:bg-white/85 ${
                isActive ? "ring-2 ring-blueprint/35 shadow-md shadow-blueprint/10" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-blueprint">Carpeta</p>
                  <p className="mt-1.5 font-semibold leading-tight text-ink">{label.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{label.subtitle}</p>
                </div>
                <Badge tone={folder.fileCount > 0 ? "blue" : "neutral"}>{folder.fileCount}</Badge>
              </div>
            </Link>
          );
        })}
      </section>

      <DocumentTable files={visibleFiles} totalFiles={files.length} activeFolder={folders.find((folder) => folder.id === activeFolderId) ?? null} canDelete={canManage} />
    </>
  );
}

function normalizeFolderFilter(value: string | string[] | undefined, folders: DocumentFolder[]) {
  const parsed = Array.isArray(value) ? value[0] : value;
  if (!parsed) return null;
  return folders.some((folder) => folder.id === parsed) ? parsed : null;
}

function getFolderDisplayLabel(folder: DocumentFolder) {
  const phaseNumber = folder.phaseCode?.match(/\d+/)?.[0];
  const title = phaseNumber ? `Fase ${phaseNumber}` : folder.name;
  const source = folder.phaseName ?? folder.name;
  const subtitle = cleanPhaseLabel(source, title);

  return {
    title,
    subtitle: subtitle || "Sin fase asociada"
  };
}

function cleanPhaseLabel(value: string, phaseTitle: string) {
  return value
    .replace(/\s*\/\s*/g, " - ")
    .replace(new RegExp(`^${escapeRegExp(phaseTitle)}\\s*[-/]?\\s*`, "i"), "")
    .trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function StatusMessages({ error, uploaded, deleted, folderCreated }: { error: string | null; uploaded: boolean; deleted: boolean; folderCreated: boolean }) {
  return (
    <>
      {error ? <p className="mb-5 rounded-2xl bg-coral/10 p-4 text-sm font-bold text-coral">{error}</p> : null}
      {uploaded ? <p className="mb-5 rounded-2xl bg-emerald-500/10 p-4 text-sm font-bold text-emerald-700">Archivo subido correctamente.</p> : null}
      {deleted ? <p className="mb-5 rounded-2xl bg-blueprint/10 p-4 text-sm font-bold text-blueprint">Archivo eliminado definitivamente.</p> : null}
      {folderCreated ? <p className="mb-5 rounded-2xl bg-blueprint/10 p-4 text-sm font-bold text-blueprint">Carpeta creada correctamente.</p> : null}
    </>
  );
}

function UploadPanel({ folders, canManage }: { folders: DocumentFolder[]; canManage: boolean }) {
  return (
    <Card className="overflow-hidden border-white/80 bg-white/75 p-0">
      <div className="border-b border-white/70 p-5">
        <CardHeader eyebrow="Carga de archivos" title="Subir documento final" action={<Badge tone="yellow">Max. 250 MB</Badge>} />
        <p className="text-sm leading-6 text-slate-600">
          Sube PDF, Word, Excel, PowerPoint, Markdown, imagenes, audios u otros archivos del proyecto.
        </p>
      </div>
      <form action={uploadDocumentAction} className="grid gap-4 p-5 sm:p-6">
        <fieldset disabled={!canManage} className="grid gap-4 disabled:opacity-55">
          <Field label="Nombre">
            <Input name="documentName" placeholder="Ej. Acta final fase 1" required />
          </Field>
          <Field label="Archivo">
            <Input name="file" type="file" required />
          </Field>
          <label className="block space-y-2 text-sm font-semibold text-ink">
            <span>Carpeta destino</span>
            <select name="folderId" required className="focus-ring w-full rounded-xl border border-white/70 bg-white/75 px-3.5 py-2.5 text-sm text-ink shadow-inner shadow-ink/5">
              <option value="">Selecciona una carpeta</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" variant="accent" className="w-full gap-2 py-2.5">
            <Upload className="h-4 w-4" />
            Subir archivo
          </Button>
        </fieldset>
        {!canManage ? <p className="rounded-xl bg-blueprint/10 p-3.5 text-sm font-medium leading-6 text-slate-600">Tu usuario puede consultar documentos, pero solo los administradores pueden subir archivos.</p> : null}
      </form>
    </Card>
  );
}

function FolderPanel({ phases, folders, canManage }: { phases: { id: string; name: string }[]; folders: DocumentFolder[]; canManage: boolean }) {
  return (
    <Card className="overflow-hidden border-white/80 bg-white/75 p-0">
      <div className="border-b border-white/70 p-5">
        <CardHeader eyebrow="Estructura" title="Carpetas del proyecto" action={<Badge tone="blue">{folders.length} carpetas</Badge>} />
        <p className="text-sm leading-6 text-slate-600">
          Las carpetas base por fase ya estan creadas. Los administradores pueden crear carpetas adicionales.
        </p>
      </div>
      <form action={createFolderAction} className="grid gap-4 p-5 sm:p-6">
        <fieldset disabled={!canManage} className="grid gap-4 disabled:opacity-55">
          <Field label="Nueva carpeta">
            <Input name="name" placeholder="Ej. Actas finales" required />
          </Field>
          <label className="block space-y-2 text-sm font-semibold text-ink">
            <span>Fase asociada</span>
            <select name="phaseId" className="focus-ring w-full rounded-xl border border-white/70 bg-white/75 px-3.5 py-2.5 text-sm text-ink shadow-inner shadow-ink/5">
              <option value="">Sin fase</option>
              {phases.map((phase) => (
                <option key={phase.id} value={phase.id}>
                  {phase.name}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" variant="ghost" className="w-full gap-2 py-2.5">
            <FolderPlus className="h-4 w-4" />
            Crear carpeta
          </Button>
        </fieldset>
        {!canManage ? <p className="rounded-xl bg-blueprint/10 p-3.5 text-sm font-medium leading-6 text-slate-600">La creacion de carpetas esta reservada para Administrador Vena Digital y Administrador Pinares.</p> : null}
      </form>
    </Card>
  );
}

function DocumentTable({ files, totalFiles, activeFolder, canDelete }: { files: DocumentFile[]; totalFiles: number; activeFolder: DocumentFolder | null; canDelete: boolean }) {
  return (
    <Card className="overflow-hidden border-white/80 bg-white/75 p-0">
      <div className="border-b border-white/70 p-5">
        <CardHeader
          eyebrow="Repositorio"
          title={activeFolder ? `Archivos de ${getFolderDisplayLabel(activeFolder).title}` : "Archivos cargados"}
          action={
            <Link href="/documentos" className="focus-ring rounded-full">
              <Badge tone={activeFolder ? "neutral" : "yellow"}>{activeFolder ? `${files.length} de ${totalFiles}` : `${files.length} archivos`}</Badge>
            </Link>
          }
        />
        <p className="text-sm leading-6 text-slate-600">
          {activeFolder
            ? `${getFolderDisplayLabel(activeFolder).subtitle}. Usa el indicador superior para volver a todos los archivos.`
            : "Consulta, previsualiza o descarga los documentos almacenados dentro de la plataforma."}
        </p>
      </div>

      {files.length === 0 ? (
        <div className="p-6">
          <div className="rounded-[1.5rem] border border-dashed border-blueprint/25 bg-white/62 p-8 text-center">
            <FileText className="mx-auto h-9 w-9 text-blueprint" />
            <p className="mt-4 font-display text-xl font-bold text-ink">Aun no hay archivos cargados</p>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
              Cuando subas documentos, apareceran aqui con su carpeta, fase, tamano, responsable y acciones.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto p-4 sm:p-5">
          <div className="min-w-[880px] space-y-2.5">
            <div className="grid grid-cols-[minmax(18rem,1.4fr)_minmax(12rem,0.9fr)_8rem_8rem_10rem_12rem] gap-3 rounded-xl bg-ink/5 px-4 py-2.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
              <span>Archivo</span>
              <span>Carpeta</span>
              <span>Tipo</span>
              <span>Tamano</span>
              <span>Subido por</span>
              <span>Acciones</span>
            </div>
            {files.map((file) => (
              <div key={file.id} className="grid grid-cols-[minmax(18rem,1.4fr)_minmax(12rem,0.9fr)_8rem_8rem_10rem_12rem] items-center gap-3 rounded-[1.15rem] border border-white/80 bg-white/75 px-4 py-3 shadow-sm shadow-ink/5">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{file.name}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{file.uploadedAt}</p>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-700">{file.folder}</p>
                  <p className="mt-1 truncate text-xs font-semibold text-slate-500">{file.phaseName ?? "Sin fase"}</p>
                </div>
                <Badge tone="blue">{file.type}</Badge>
                <p className="text-sm font-medium text-slate-600">{formatFileSize(file.sizeBytes)}</p>
                <p className="truncate text-sm font-medium text-slate-700">{file.uploadedBy}</p>
                <div className="flex items-center gap-2">
                  <Button href={`/documentos/files/${file.id}/preview`} variant="ghost" className="h-9 w-9 px-0" aria-label={`Ver ${file.name}`}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button href={`/documentos/files/${file.id}/download`} variant="ghost" className="h-9 w-9 px-0" aria-label={`Descargar ${file.name}`}>
                    <Download className="h-4 w-4" />
                  </Button>
                  {canDelete ? (
                    <form action={deleteDocumentAction}>
                      <input type="hidden" name="fileId" value={file.id} />
                      <button className="focus-ring grid h-9 w-9 place-items-center rounded-full bg-coral/10 text-coral ring-1 ring-coral/20 transition hover:bg-coral hover:text-white" aria-label={`Eliminar ${file.name}`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
