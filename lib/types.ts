export type Role = "Administrador Vena Digital" | "Administrador Pinares" | "Stakeholder Pinares";
export type PermissionKey = "view" | "create" | "edit" | "delete";
export type ModuleKey =
  | "dashboard"
  | "stakeholders"
  | "documentos"
  | "cronograma"
  | "tareas"
  | "comunicacion"
  | "inventario"
  | "procesos"
  | "hallazgos"
  | "riesgos"
  | "decisiones"
  | "entregables";

export type Status = "No iniciado" | "En progreso" | "En revision" | "Bloqueado" | "Completado";
export type Priority = "Alta" | "Media" | "Baja";
export type RiskLevel = "Alto" | "Medio" | "Bajo";
export type Criticality = "Alta" | "Media" | "Baja";
export type Currency = "COP" | "USD";
export type TrafficLight = "Verde" | "Amarillo" | "Rojo";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  organization: "Vena Digital" | "Pinares";
  position: string;
  area: string;
  status: "Activo" | "Inactivo";
  moduleAccess: ModuleKey[];
}

export interface Phase {
  id: string;
  code?: string;
  name: string;
  weekRange: string;
  progress: number;
}

export interface Task {
  id: string;
  title: string;
  phaseId: string;
  status: Status;
  priority: Priority;
  ownerId: string;
  dueDate?: string;
  type: "Tarea" | "Hito" | "Entregable";
}

export interface TaskSubtask {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  createdAt?: string;
}

export interface Deliverable {
  id: string;
  title: string;
  phaseId: string;
  status: "Pendiente" | "En elaboracion" | "En revision interna" | "Enviado a Pinares" | "Aprobado" | "Requiere ajustes";
}

export interface DocumentItem {
  id: string;
  name: string;
  folder: string;
  phaseId: string;
  type: string;
  sizeMb: number;
  uploadedAt: string;
  uploadedBy: string;
}

export interface ToolItem {
  id: string;
  name: string;
  provider: string;
  cost: number;
  currency: Currency;
  licenseType: string;
  users: number;
  owner: string;
  areas: string[];
  apiAvailable: boolean;
  trafficLight: TrafficLight;
  satisfaction: number;
}

export interface ProcessItem {
  id: string;
  name: string;
  area: string;
  impactedAreas: string[];
  documentName: string;
}

export interface Finding {
  id: string;
  title: string;
  classification: string;
  criticality: Criticality;
  status: "Identificado" | "En analisis" | "Validado" | "Descartado" | "Convertido en recomendacion/iniciativa";
  area: string;
}

export interface Risk {
  id: string;
  title: string;
  level: RiskLevel;
  regulation: string;
  links: string[];
  status: "Abierto" | "En revision" | "Cerrado";
}

export interface Decision {
  id: string;
  title: string;
  date: string;
  owner: string;
  status: "Pendiente" | "Tomada" | "En seguimiento" | "Cerrada";
}
