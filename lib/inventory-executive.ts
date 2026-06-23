export type ExecutiveAction = "keep" | "change" | "stop";
export type ExecutiveAdoption = "alta" | "media" | "baja" | "muy baja";
export type ExecutiveCriticality = "critica" | "alta" | "media" | "baja";
export type ExecutiveRisk = "alto" | "medio" | "bajo";

export interface ExecutiveTool {
  id: string;
  name: string;
  cat: string;
  action: ExecutiveAction;
  icon: string;
  adop: ExecutiveAdoption;
  crit: ExecutiveCriticality;
  risk: ExecutiveRisk;
  mx: { x: number; y: number; r: number };
  purpose: string;
  cost: string;
  costPer: string;
  costYear: string;
  use: string;
  useWarn: boolean;
  useLbl: string;
  reco: string;
  recoMicro: string;
  good: string[];
  bad: string[];
  pend: string[];
  mid: string;
  costValue: number;
  wasteValue: number;
  sheetSlug: string;
}

export const executiveTools: ExecutiveTool[] = [
  {
    "id": "siis",
    "name": "SIIS",
    "cat": "HIS · núcleo asistencial",
    "action": "keep",
    "icon": "ti-heartbeat",
    "adop": "alta",
    "crit": "critica",
    "risk": "alto",
    "mx": {
      "x": 76,
      "y": 14,
      "r": 30
    },
    "purpose": "Columna vertebral clínica y administrativa: historia clínica, facturación CUPS, farmacia, inventarios e interoperabilidad.",
    "cost": "$1.674.440",
    "costPer": "/mes",
    "costYear": "$20,1M/año",
    "use": "6 / 14",
    "useWarn": true,
    "useLbl": "módulos en uso",
    "reco": "Optimizar ahora · evaluar reemplazo a mediano plazo",
    "recoMicro": "Exprimir lo ya contratado y cerrar brechas de gobernanza antes de pensar en migrar.",
    "good": [
      "HIS robusto: HC, facturación CUPS, farmacia, inventarios e interoperabilidad en un solo sistema",
      "Integrado de fábrica con DIAN, MinSalud (RIPS) e interoperabilidad nacional",
      "Mucha capacidad nativa disponible que resolvería reprocesos sin comprar nada"
    ],
    "bad": [
      "Interfaz antigua que mina la confianza del personal y empuja a duplicar en Excel",
      "Fuerte dependencia del proveedor: cada cambio se cotiza y la clínica tiene poca autonomía",
      "Bug de tarifas y proyecto de control especial con firmas no certificadas"
    ],
    "pend": [
      "Capacidades de API del módulo de agendamiento (prerequisito para integrar CoCo)",
      "Disponibilidad real del módulo de telemedicina"
    ],
    "mid": "A mediano plazo, evaluar formalmente la modernización o reemplazo del HIS con criterios y TCO — pero solo después de corregir la causa raíz (falta de doliente, parametrización abandonada). Reemplazar sin eso reproduce el Excel sombra en un sistema más caro.",
    "costValue": 1674440,
    "wasteValue": 57,
    "sheetSlug": "siis"
  },
  {
    "id": "siigo",
    "name": "SIIGO",
    "cat": "ERP contable · administrativo",
    "action": "change",
    "icon": "ti-calculator",
    "adop": "media",
    "crit": "critica",
    "risk": "alto",
    "mx": {
      "x": 89,
      "y": 26,
      "r": 22
    },
    "purpose": "Consolidador contable, tributario y de nómina — solo del lado administrativo. Tres módulos vendidos por separado que no se integran entre sí.",
    "cost": "$487.414",
    "costPer": "/mes",
    "costYear": "~$5,8M/año",
    "use": "5 / 9",
    "useWarn": true,
    "useLbl": "funciones en uso pleno",
    "reco": "Migrar a SIIGO Nube ahora · integrar con SIIS a mediano plazo",
    "recoMicro": "La licencia local vence en junio 2026: hay que decidir ya.",
    "good": [
      "Cubre el cumplimiento crítico: factura DIAN, nómina electrónica, exógena y Circular 016",
      "La versión nube integra los 3 módulos de fábrica, sin comprar herramienta nueva"
    ],
    "bad": [
      "Nómina-i funciona como transcriptor, no como motor de cálculo: la verdad vive en un Excel frágil",
      "On-premise: la contadora remota (Canadá) accede por VPN inestable",
      "Retención en fuente incorrecta para 5-8 empleados de salario variable"
    ],
    "pend": [
      "Cerrar la cotización comparativa local vs. nube",
      "Definir la estrategia del histórico contable 2024–2025"
    ],
    "mid": "Tras migrar a nube, integrar Siigo con SIIS para cerrar el silo entre facturación asistencial y contabilidad, hoy unido a mano por archivo plano.",
    "costValue": 487414,
    "wasteValue": 44,
    "sheetSlug": "siigo"
  },
  {
    "id": "coco",
    "name": "CoCo",
    "cat": "Agenda + Teleconsulta",
    "action": "keep",
    "icon": "ti-calendar-event",
    "adop": "media",
    "crit": "alta",
    "risk": "alto",
    "mx": {
      "x": 67,
      "y": 40,
      "r": 23
    },
    "purpose": "Puerta de entrada del paciente de consulta externa: agenda, confirma y atiende por teleconsulta con consentimiento digital.",
    "cost": "$852.120",
    "costPer": "/mes",
    "costYear": "a reconciliar vs. $550.000 contrato",
    "use": "4 / 7",
    "useWarn": true,
    "useLbl": "funcionalidades en uso",
    "reco": "Mantener y optimizar · integrar con SIIS",
    "recoMicro": "Plataforma correcta, mal aprovechada y sin integrar.",
    "good": [
      "Especializada en salud: cifrado E2E, HIPAA, ISO 27001 y consentimiento digital",
      "Usuarios y consultorios ilimitados, exento de IVA, con precio preferencial",
      "Contrato flexible (aviso de 30 días) y API pública para integrar con SIIS"
    ],
    "bad": [
      "No integrado con SIIS → doble digitación en el 100% de las consultas externas",
      "38% de las consultas se prestan por WhatsApp/Teams, fuera de norma (Res. 2654/2019)",
      "Recordatorios llegan como 'Coco Inc' y generan desconfianza; sin doliente interno"
    ],
    "pend": [
      "Reconciliar el costo real ($852.120 vs. $550.000 del Anexo 2)",
      "Confirmar si soporta teleconsulta con varios participantes (terapias familiares)"
    ],
    "mid": "La fuga del 38% hacia WhatsApp no es problema de la herramienta sino de adopción y norma: cambiar de plataforma sin corregir eso reproduce el incumplimiento.",
    "costValue": 852120,
    "wasteValue": 43,
    "sheetSlug": "coco"
  },
  {
    "id": "m365",
    "name": "Microsoft 365",
    "cat": "Suite de productividad",
    "action": "keep",
    "icon": "ti-brand-windows",
    "adop": "media",
    "crit": "alta",
    "risk": "alto",
    "mx": {
      "x": 71,
      "y": 47,
      "r": 34
    },
    "purpose": "Columna vertebral de productividad, colaboración y seguridad informática: correo, Teams, SharePoint, OneDrive, Office y Power Platform.",
    "cost": "$2.794.064",
    "costPer": "/mes",
    "costYear": "$33,5M/año",
    "use": "6 / 15",
    "useWarn": true,
    "useLbl": "capacidades core con uso real",
    "reco": "Gobernar y exprimir lo ya pagado",
    "recoMicro": "Es el gasto #1 y el más subutilizado.",
    "good": [
      "Capa de seguridad robusta y bien gestionada por Octus (Defender, Intune, Entra ID, backups)",
      "Ecosistema completo ya pagado: capacidad ociosa que resolvería reprocesos sin comprar nada",
      "SharePoint Gestión Documental es el repositorio mejor gobernado de la clínica"
    ],
    "bad": [
      "Gobernanza interna casi inexistente: no hay dueño del producto",
      "Personal asistencial sin capacitar: tiene Teams pero no lo usa",
      "Buzones compartidos por área → sin trazabilidad individual; sin política de IA"
    ],
    "pend": [
      "Definir y aprobar la política de gobierno de datos e IA",
      "Resolver el modelo de identidad individual"
    ],
    "mid": "Automatizar con Power Automate los procesos manuales y nombrar un dueño interno; mucho de lo que se hace en Luxflow o en Excel cabe en lo ya pagado.",
    "costValue": 2794064,
    "wasteValue": 60,
    "sheetSlug": "microsoft-365"
  },
  {
    "id": "luxflow",
    "name": "Luxflow",
    "cat": "BPM · procesos e indicadores",
    "action": "change",
    "icon": "ti-sitemap",
    "adop": "media",
    "crit": "alta",
    "risk": "alto",
    "mx": {
      "x": 60,
      "y": 53,
      "r": 24
    },
    "purpose": "Columna vertebral de procesos administrativos e indicadores de gestión (BPM): compras, requisiciones, vacaciones, comités y mejora.",
    "cost": "$925.407",
    "costPer": "/mes + IVA",
    "costYear": "inversión histórica ≈ $10,2M",
    "use": "7 / 13",
    "useWarn": true,
    "useLbl": "módulos en uso real",
    "reco": "Validar integración a Microsoft y depurar · evaluar reemplazo",
    "recoMicro": "Cara para lo que ofrece y desalineada del ecosistema.",
    "good": [
      "Funciona y reunió en un lugar necesidades antes dispersas (indicadores, compras, vacaciones)",
      "Lo que sí usan los empleados aporta: solicitud de compras, vacaciones y comités",
      "Base técnica sólida: nube con SLA, backups, API y operación móvil"
    ],
    "bad": [
      "Plataforma 'de retazos', sin diseño integral y con UI/UX pobre",
      "Se construyó en Google y al migrar a Microsoft no se realineó → doble diligenciamiento",
      "Nadie domina la herramienta; indicadores automáticos que las áreas no usan"
    ],
    "pend": [
      "Validar con el proveedor la integración real a Microsoft",
      "Auditar y depurar los módulos desarrollados que no se usan"
    ],
    "mid": "Si la migración a Microsoft no amerita el costo (~$1M/mes), evaluar reemplazo: parte de sus funciones podrían absorberse en la Intranet/M365 ya pagados.",
    "costValue": 925407,
    "wasteValue": 46,
    "sheetSlug": "luxflow"
  },
  {
    "id": "ivms",
    "name": "iVMS-4200",
    "cat": "Seguridad física · biométrico",
    "action": "keep",
    "icon": "ti-device-cctv",
    "adop": "media",
    "crit": "alta",
    "risk": "alto",
    "mx": {
      "x": 90,
      "y": 38,
      "r": 14
    },
    "purpose": "Sistema único de seguridad física: cámaras de vigilancia, control de acceso a puertas y control de asistencia biométrico (Hikvision, gestionado por Osmedo).",
    "cost": "$0",
    "costPer": "licencia",
    "costYear": "hardware propio · costo real por confirmar",
    "use": "4 / 7",
    "useWarn": false,
    "useLbl": "funciones aprovechadas",
    "reco": "Conservar y optimizar · no reemplazar el software",
    "recoMicro": "El software es gratis y robusto; el problema es el hardware viejo.",
    "good": [
      "Software robusto y gratuito; centraliza cámaras, acceso y asistencia en una herramienta",
      "Opera local en red interna → menor superficie de ataque externo",
      "Exporta reportes XLS, insumo directo para nómina; doble biométrico (huella + rostro)"
    ],
    "bad": [
      "Biométrico de hospitalización (iVMS-4600) obsoleto y con licencia caducada → sin registrar huellas",
      "Sin respaldo en nube: grabaciones solo en disco, retención ~20–30 días",
      "Reportería de asistencia subutilizada; cobertura jurídica del dato biométrico sin blindar"
    ],
    "pend": [
      "Definir retención de video y cerrar confidencialidad de imágenes",
      "Blindar jurídicamente el uso del dato biométrico"
    ],
    "mid": "Reemplazar solo el biométrico viejo de hospitalización y consolidar todo bajo Osmedo; el software iVMS-4200 se conserva.",
    "costValue": 0,
    "wasteValue": 43,
    "sheetSlug": "ivms-4200"
  },
  {
    "id": "mundo",
    "name": "Mundo Médicos",
    "cat": "Mantenimiento biomédico",
    "action": "keep",
    "icon": "ti-stethoscope",
    "adop": "media",
    "crit": "alta",
    "risk": "alto",
    "mx": {
      "x": 73,
      "y": 58,
      "r": 15
    },
    "purpose": "Custodia el historial de mantenimiento de equipos biomédicos exigido para habilitación y acreditación (servicio tercerizado: preventivo + correctivo + calibraciones).",
    "cost": "~$207.834",
    "costPer": "/mes",
    "costYear": "$2,49M/año",
    "use": "—",
    "useWarn": false,
    "useLbl": "servicio tercerizado",
    "reco": "Mantener el servicio · blindar la información ya",
    "recoMicro": "Costo bajo frente a la criticidad normativa que cubre.",
    "good": [
      "Proveedor formal y especializado, con servicio integral (preventivo, correctivo, calibraciones)",
      "Tiempos y garantías pactados por contrato con multas: palancas reales de exigibilidad",
      "Costo bajo y acotado frente a la criticidad normativa"
    ],
    "bad": [
      "Sin respaldo local del historial: dependencia total del tercero",
      "Cronograma de mantenimiento duplicado a mano en un Excel de Farmacia"
    ],
    "pend": [
      "Regularizar / confirmar vigencia del contrato",
      "Implementar respaldo local periódico del historial técnico"
    ],
    "mid": "Mantener el servicio; el riesgo no es el proveedor sino no tener copia propia de un historial exigido en auditoría.",
    "costValue": 207834,
    "wasteValue": 0,
    "sheetSlug": "mundo-medicos"
  },
  {
    "id": "fudo",
    "name": "FUDO",
    "cat": "Servicio de alimentación · POS",
    "action": "stop",
    "icon": "ti-tools-kitchen-2",
    "adop": "baja",
    "crit": "media",
    "risk": "alto",
    "mx": {
      "x": 80,
      "y": 72,
      "r": 13
    },
    "purpose": "Gestiona la operación de cocina (POS en la nube), adquirido para reemplazar el módulo de dietas de SIIS. Aún en implementación.",
    "cost": "$125.000",
    "costPer": "/mes",
    "costYear": "~$1,5M/año",
    "use": "2×",
    "useWarn": true,
    "useLbl": "herramientas misma función",
    "reco": "Detener la salida a producción · decidir SIIS vs. FUDO con criterios",
    "recoMicro": "Se paga FUDO mientras SIIS tiene el módulo de dietas apagado.",
    "good": [
      "Herramienta moderna, SaaS, multiplataforma y de bajo costo mensual",
      "Incluye facturación electrónica de la alimentación"
    ],
    "bad": [
      "No controla vencimientos (sin PEPS) ni alergias — el módulo de SIIS sí lo hacía",
      "Inventario solo en unidades, no en valor: no genera el informe valorizado que contabilidad necesita",
      "Opera como isla (sin SIIS, Siigo ni M365) e implementado sin un líder con perfil de cocina"
    ],
    "pend": [
      "Comparar funcionalmente contra el módulo de dietas de SIIS antes de producción",
      "Resolver vencimientos, alergias e informe valorizado"
    ],
    "mid": "Decisión de fondo: o FUDO cubre lo que SIIS hacía y se apaga el módulo nativo, o se reactiva SIIS y se descarta el doble gasto. Hoy se paga por ambos.",
    "costValue": 125000,
    "wasteValue": 80,
    "sheetSlug": "fudo"
  },
  {
    "id": "intranet",
    "name": "Intranet & Universidad",
    "cat": "Portal interno · LMS",
    "action": "keep",
    "icon": "ti-school",
    "adop": "muy baja",
    "crit": "media",
    "risk": "alto",
    "mx": {
      "x": 65,
      "y": 74,
      "r": 12
    },
    "purpose": "Portal interno corporativo y módulo de formación (LMS) sobre SharePoint; centraliza comunicación, accesos, inducción y formularios. Entregado pero sin lanzar.",
    "cost": "$0",
    "costPer": "incremental (M365)",
    "costYear": "desarrollo $4,5M (única vez)",
    "use": "2 / 7",
    "useWarn": true,
    "useLbl": "capacidades en uso",
    "reco": "Conservar · asignar owner y concebirlo como proyecto",
    "recoMicro": "Activo correcto, abandonado por falta de dueño.",
    "good": [
      "Decisión estratégica correcta: sobre M365 ya pagado, costo incremental nulo",
      "La plataforma funciona; la Fase 1 está entregada y es 100% personalizable",
      "La Universidad resuelve un dolor real: la inducción manual sin trazabilidad"
    ],
    "bad": [
      "Sin dueño de producto: nadie responde por la hoja de ruta",
      "Gestión de usuarios 100% manual (Excel → carga del proveedor)",
      "UI/UX poco desarrollada y formación en PDF+examen, poco atractiva → cero adopción"
    ],
    "pend": [
      "Definir el owner interno del producto",
      "Identificar qué de Luxflow podría vivir dentro de la Intranet"
    ],
    "mid": "Concebirlo como proyecto con dueño y hoja de ruta; tiene potencial de absorber funciones de Luxflow y escalar a dashboards y clima.",
    "costValue": 0,
    "wasteValue": 71,
    "sheetSlug": "intranet-universidad"
  },
  {
    "id": "kommo",
    "name": "Kommo",
    "cat": "CRM de canales sociales",
    "action": "stop",
    "icon": "ti-message-circle",
    "adop": "baja",
    "crit": "media",
    "risk": "medio",
    "mx": {
      "x": 30,
      "y": 66,
      "r": 13
    },
    "purpose": "Unificador de bandejas de WhatsApp e Instagram para el primer contacto comercial. Hoy se usa solo como bandeja, no como CRM.",
    "cost": "45 USD",
    "costPer": "/usuario/mes",
    "costYear": "facturación semestral",
    "use": "1 / 10",
    "useWarn": true,
    "useLbl": "capacidades clave en uso",
    "reco": "Replantear el CRM · Kommo no es la herramienta adecuada",
    "recoMicro": "Se paga un CRM y se usa como simple bandeja de entrada.",
    "good": [
      "Pensado para marketing y ventas, con integraciones preconstruidas (Meta, Google, email)",
      "Tiene pipeline para seguimiento de posibles pacientes y permite crear agentes de IA"
    ],
    "bad": [
      "No es un CRM transversal: sin hoja de vida del cliente ni integración con SIIS",
      "Orientado a pequeñas tiendas que venden por WhatsApp/Instagram",
      "Según comercial, sus métricas no son fiables"
    ],
    "pend": [
      "Probar Meta Business Suite para la unificación de canales",
      "Definir qué necesita realmente el área comercial de un CRM"
    ],
    "mid": "No escalar la inversión: replantear si el área comercial necesita un CRM de gestión de pacientes en lugar de un unificador de chats.",
    "costValue": 541355,
    "wasteValue": 90,
    "sheetSlug": "kommo"
  },
  {
    "id": "zebra",
    "name": "Zebra",
    "cat": "Identificación · periférico",
    "action": "keep",
    "icon": "ti-printer",
    "adop": "media",
    "crit": "media",
    "risk": "medio",
    "mx": {
      "x": 40,
      "y": 78,
      "r": 12
    },
    "purpose": "Impresora de manillas y etiquetas de identificación de pacientes, gestionada por Enfermería (hardware + software local).",
    "cost": "$0",
    "costPer": "recurrente",
    "costYear": "hardware comprado",
    "use": "1 / 2",
    "useWarn": true,
    "useLbl": "capacidades en uso",
    "reco": "Mantener · activar la integración con SIIS",
    "recoMicro": "Funciona, pero las manillas se digitan a mano.",
    "good": [
      "Operativa y cumpliendo su función; sin costo recurrente (hardware comprado)",
      "Etiquetas personalizables (unidosis, químicos, pertenencias); responsabilidad clara en Enfermería"
    ],
    "bad": [
      "Impresión directa desde SIIS desconfigurada → manillas digitadas a mano",
      "Se desconfigura ~4 veces/año y cada arreglo depende de OCTUS: cero autonomía"
    ],
    "pend": [
      "Reactivar la impresión directa SIIS → Zebra"
    ],
    "mid": "Activar la integración nativa con SIIS elimina la digitación manual y la dependencia de OCTUS para cada reconfiguración.",
    "costValue": 0,
    "wasteValue": 50,
    "sheetSlug": "zebra"
  },
  {
    "id": "wondershare",
    "name": "Wondershare",
    "cat": "Utilidad PDF · periférico",
    "action": "stop",
    "icon": "ti-shield-lock",
    "adop": "baja",
    "crit": "media",
    "risk": "medio",
    "mx": {
      "x": 22,
      "y": 80,
      "r": 12
    },
    "purpose": "Cifra con contraseña los PDF de historia clínica antes de enviarlos. Una sola usuaria, una sola función, licencia perpetua.",
    "cost": "$0",
    "costPer": "recurrente",
    "costYear": "licencia perpetua",
    "use": "1",
    "useWarn": false,
    "useLbl": "única función",
    "reco": "Migrar el cifrado a Microsoft · eliminar Wondershare",
    "recoMicro": "Función puntual que M365 ya cubre.",
    "good": [
      "Licencia perpetua: sin costo mensual recurrente",
      "Cumple su función puntual de cifrar la HC antes de enviarla",
      "Bajo impacto: eliminarla no afecta la operación clínica"
    ],
    "bad": [
      "La clínica no tiene las claves de activación (las guarda OCTUS) y el software se desactiva ~4 veces/año, interrumpiendo el envío seguro de la HC"
    ],
    "pend": [
      "Validar si el PC de coordinación tiene Microsoft Word instalado",
      "Recuperar de OCTUS las claves de activación"
    ],
    "mid": "Migrar la protección del PDF a las herramientas de Microsoft ya pagadas y dar de baja Wondershare: elimina una dependencia de OCTUS sin costo.",
    "costValue": 0,
    "wasteValue": 0,
    "sheetSlug": "wondershare"
  }
];

export const executiveThreads = [
  {
    "title": "Nadie es dueño del software",
    "body": "Casi ninguna herramienta tiene un doliente interno. Sin owner, la parametrización se abandona, los accesos no se gobiernan y todo depende del proveedor.",
    "icon": "owner"
  },
  {
    "title": "Nada se integra",
    "body": "SIIS, CoCo y los 3 módulos de Siigo operan como islas. El resultado es doble digitación y una verdad que solo existe en Excels sombra.",
    "icon": "integration"
  },
  {
    "title": "Se paga capacidad que no se usa",
    "body": "7 de 12 herramientas tienen módulos contratados y apagados. Hay funciones que resolverían reprocesos sin comprar nada nuevo.",
    "icon": "waste"
  },
  {
    "title": "Llaves en manos de terceros",
    "body": "OCTUS guarda credenciales (Wondershare, Zebra) y los servidores remotos cambian claves sin avisar: bloqueos y tickets recurrentes.",
    "icon": "keys"
  },
  {
    "title": "Usuarios que nunca se dan de baja",
    "body": "Sin protocolo de egreso, hay ex-empleados activos en SIIS y CoCo —uno con acceso a todos los módulos—. Riesgo de seguridad sobre datos sensibles.",
    "icon": "users"
  },
  {
    "title": "Excel como sistema operativo real",
    "body": "El FO-389, el estado de cuenta del paciente y el cronograma de mantenimiento viven en hojas manuales de una sola persona.",
    "icon": "excel"
  }
] as const;

export const criticalityLabels: Record<ExecutiveCriticality, string> = { critica: "Crítica", alta: "Alta", media: "Media", baja: "Baja" };
export const riskLabels: Record<ExecutiveRisk, string> = { alto: "Alto", medio: "Medio", bajo: "Bajo" };
export const adoptionLabels: Record<ExecutiveAdoption, string> = { alta: "Alta", media: "Media", baja: "Baja", "muy baja": "Muy baja" };
export const actionLabels: Record<ExecutiveAction, string> = { keep: "Mantener / optimizar", change: "Migrar / integrar", stop: "Detener / replantear" };
