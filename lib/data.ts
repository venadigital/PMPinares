import type { Decision, Deliverable, DocumentItem, Finding, ModuleKey, Phase, ProcessItem, Risk, Task, ToolItem, UserProfile } from "@/lib/types";

export const modules: { key: ModuleKey; label: string; description: string }[] = [
  { key: "dashboard", label: "Panel ejecutivo", description: "Indicadores clave del proyecto" },
  { key: "stakeholders", label: "Stakeholders", description: "Usuarios, roles y permisos" },
  { key: "documentos", label: "Documentos", description: "Repositorio por fases" },
  { key: "cronograma", label: "Cronograma", description: "Kanban de tareas e hitos" },
  { key: "comunicacion", label: "Comunicacion", description: "Muro general con menciones" },
  { key: "inventario", label: "Inventario TI", description: "Herramientas, costos y uso" },
  { key: "procesos", label: "Procesos", description: "Documentacion por area" },
  { key: "hallazgos", label: "Hallazgos", description: "Observaciones y criticidad" },
  { key: "riesgos", label: "Riesgos", description: "Cumplimiento y seguridad" },
  { key: "decisiones", label: "Decisiones", description: "Trazabilidad ejecutiva" },
  { key: "entregables", label: "Entregables", description: "Control contractual" }
];

export const phases: Phase[] = [
  { id: "fase-0", code: "fase-0", name: "Fase 0 - Alineacion Estrategica", weekRange: "Semana 1", progress: 100 },
  { id: "fase-1", code: "fase-1", name: "Fase 1 - Inventario Tecnologico", weekRange: "Semanas 2-3", progress: 62 },
  { id: "fase-2", code: "fase-2", name: "Fase 2 - Mapeo de Procesos", weekRange: "Semanas 4-6", progress: 28 },
  { id: "fase-3", code: "fase-3", name: "Fase 3 - Escenario Actual", weekRange: "Semanas 7-8", progress: 0 },
  { id: "fase-4", code: "fase-4", name: "Fase 4 - Escenario Ideal", weekRange: "Semanas 9-10", progress: 0 },
  { id: "fase-5", code: "fase-5", name: "Fase 5 - Roadmap", weekRange: "Semana 11", progress: 0 },
  { id: "fase-6", code: "fase-6", name: "Fase 6 - Resultados", weekRange: "Semana 12", progress: 0 }
];

export const areas = [
  "Admision y recepcion de pacientes",
  "Agendamiento de citas",
  "Historia clinica / Atencion medica",
  "Hospitalizacion / Internacion",
  "Gestion de medicamentos / Farmacia",
  "Laboratorio y diagnostico",
  "Nutricion y alimentacion",
  "Facturacion y cartera",
  "Contabilidad y finanzas",
  "Nomina y gestion de RRHH",
  "Compras y logistica",
  "Calidad, acreditacion y auditoria",
  "Reportes normativos / entes de control",
  "Comunicaciones internas",
  "Comunicaciones externas / Marketing",
  "Seguridad e infraestructura fisica",
  "Gestion de TI / Sistemas",
  "Gerencia y toma de decisiones"
];

export const users: UserProfile[] = [
  { id: "u-1", name: "Laura Salazar", email: "laura@venadigital.co", role: "Administrador Vena Digital", organization: "Vena Digital", position: "Consultora lider", area: "Consultoria", status: "Activo", moduleAccess: modules.map((module) => module.key) },
  { id: "u-2", name: "Monica Pinares", email: "monica@pinares.co", role: "Administrador Pinares", organization: "Pinares", position: "Punto de contacto", area: "Gerencia y toma de decisiones", status: "Activo", moduleAccess: modules.map((module) => module.key) },
  { id: "u-3", name: "Equipo Facturacion", email: "facturacion@pinares.co", role: "Stakeholder Pinares", organization: "Pinares", position: "Lider de area", area: "Facturacion y cartera", status: "Activo", moduleAccess: ["dashboard", "documentos", "comunicacion", "inventario", "procesos", "hallazgos", "riesgos"] }
];

export const tasks: Task[] = [
  { id: "t-1", title: "Cerrar documento de kickoff", phaseId: "fase-0", status: "Completado", priority: "Alta", ownerId: "u-1", dueDate: "2026-05-14", type: "Entregable" },
  { id: "t-2", title: "Levantar herramientas activas", phaseId: "fase-1", status: "En progreso", priority: "Alta", ownerId: "u-1", dueDate: "2026-05-22", type: "Tarea" },
  { id: "t-3", title: "Validar costos y licencias", phaseId: "fase-1", status: "Bloqueado", priority: "Media", ownerId: "u-2", dueDate: "2026-05-25", type: "Hito" },
  { id: "t-4", title: "Documentar procesos de admision", phaseId: "fase-2", status: "No iniciado", priority: "Alta", ownerId: "u-3", type: "Tarea" },
  { id: "t-5", title: "Revisar hallazgos criticos", phaseId: "fase-2", status: "En revision", priority: "Alta", ownerId: "u-1", type: "Tarea" }
];

export const deliverables: Deliverable[] = [];

export const documents: DocumentItem[] = [
  { id: "doc-1", name: "Kickoff_Pinares.pdf", folder: "Fase 0", phaseId: "fase-0", type: "PDF", sizeMb: 3.8, uploadedAt: "2026-05-11", uploadedBy: "Laura Salazar" },
  { id: "doc-2", name: "Inventario_preliminar.xlsx", folder: "Fase 1", phaseId: "fase-1", type: "Excel", sizeMb: 1.2, uploadedAt: "2026-05-13", uploadedBy: "Laura Salazar" },
  { id: "doc-3", name: "Acta_entrevista_facturacion.docx", folder: "Fase 2", phaseId: "fase-2", type: "Word", sizeMb: 0.8, uploadedAt: "2026-05-15", uploadedBy: "Monica Pinares" }
];

export const tools: ToolItem[] = [
  { id: "tool-1", name: "Kommo", provider: "Kommo", cost: 280, currency: "USD", licenseType: "CRM SaaS", users: 8, owner: "Comercial", areas: ["Comunicaciones externas / Marketing", "Agendamiento de citas"], apiAvailable: true, trafficLight: "Amarillo", satisfaction: 3 },
  { id: "tool-2", name: "Sistema contable", provider: "Proveedor local", cost: 1800000, currency: "COP", licenseType: "Anual", users: 5, owner: "Contabilidad", areas: ["Facturacion y cartera", "Contabilidad y finanzas"], apiAvailable: false, trafficLight: "Rojo", satisfaction: 2 },
  { id: "tool-3", name: "Microsoft Teams", provider: "Microsoft", cost: 0, currency: "COP", licenseType: "Incluida", users: 32, owner: "Gestion de TI / Sistemas", areas: ["Comunicaciones internas"], apiAvailable: true, trafficLight: "Verde", satisfaction: 4 }
];

export const processes: ProcessItem[] = [
  { id: "p-1", name: "Revision de facturas e ICA", area: "Facturacion y cartera", impactedAreas: ["Contabilidad y finanzas", "Reportes normativos / entes de control"], documentName: "Proceso_facturacion_ICA.pdf" },
  { id: "p-2", name: "Agendamiento de pacientes", area: "Agendamiento de citas", impactedAreas: ["Admision y recepcion de pacientes", "Historia clinica / Atencion medica"], documentName: "Proceso_agendamiento.md" }
];

export const findings: Finding[] = [
  { id: "f-1", title: "Credenciales compartidas en plataformas sensibles", classification: "Seguridad", criticality: "Alta", status: "Identificado", area: "Gestion de TI / Sistemas" },
  { id: "f-2", title: "Duplicidad manual entre facturacion y contabilidad", classification: "Operativo", criticality: "Alta", status: "En analisis", area: "Facturacion y cartera" },
  { id: "f-3", title: "Subutilizacion de funcionalidades del CRM", classification: "Tecnologico", criticality: "Media", status: "Validado", area: "Comunicaciones externas / Marketing" }
];

export const risks: Risk[] = [
  { id: "r-1", title: "Acceso no autorizado a informacion clinica", level: "Alto", regulation: "Ley 1581/2012", links: ["Gestion de TI / Sistemas", "Historias clinicas"], status: "Abierto" },
  { id: "r-2", title: "Errores tributarios por calculo manual", level: "Alto", regulation: "Requisitos DIAN / facturacion electronica", links: ["Facturacion y cartera", "Sistema contable"], status: "En revision" },
  { id: "r-3", title: "Perdida de trazabilidad en agendamiento", level: "Medio", regulation: "Seguridad de datos de pacientes", links: ["Agendamiento de citas", "Kommo"], status: "Abierto" }
];

export const decisions: Decision[] = [
  { id: "dec-1", title: "Usar Teams como herramienta oficial de entrevistas", date: "2026-05-11", owner: "Monica Pinares", status: "Tomada" },
  { id: "dec-2", title: "Conservar audios dentro de la plataforma", date: "2026-05-11", owner: "Laura Salazar", status: "En seguimiento" },
  { id: "dec-3", title: "No incluir aprobaciones formales en MVP", date: "2026-05-11", owner: "Laura Salazar", status: "Tomada" }
];

export const wallPosts = [
  { id: "post-1", author: "Laura Salazar", label: "Pregunta", message: "@Monica Pinares necesitamos confirmar el responsable interno del sistema contable.", time: "Hace 2 horas", attachments: 1 },
  { id: "post-2", author: "Monica Pinares", label: "Decision", message: "Teams queda como canal oficial para la programacion de entrevistas.", time: "Ayer", attachments: 0 },
  { id: "post-3", author: "Equipo Facturacion", label: "Riesgo", message: "Detectamos dependencia de hojas de calculo para calculos tributarios.", time: "Hace 2 dias", attachments: 2 }
];

export const dashboardMetrics = {
  overallProgress: Math.round(phases.reduce((sum, phase) => sum + phase.progress, 0) / phases.length),
  pendingDeliverables: deliverables.filter((item) => item.status !== "Aprobado").length,
  criticalFindings: findings.filter((item) => item.criticality === "Alta").length,
  highRisks: risks.filter((item) => item.level === "Alto").length,
  pendingDecisions: decisions.filter((item) => item.status === "Pendiente" || item.status === "En seguimiento").length
};
