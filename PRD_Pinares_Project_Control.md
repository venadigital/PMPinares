# PRD - Pinares Project Control

**Producto:** Pinares Project Control  
**Cliente:** Clinica Pinares  
**Consultora:** Vena Digital  
**Fecha:** 11 de mayo de 2026  
**Version:** 1.0  
**Idioma de la plataforma:** Espanol  

---

## 1. Resumen Ejecutivo

Pinares Project Control es una aplicacion web privada para gestionar el control, seguimiento, documentacion y trazabilidad del proyecto de consultoria de Vena Digital para Clinica Pinares.

La plataforma tendra como objetivo principal facilitar el control interno del equipo consultor, manteniendo al mismo tiempo visibilidad estructurada para los usuarios autorizados de Pinares. El producto estara orientado inicialmente solo al proyecto Pinares, aunque su arquitectura visual y tecnica debe permitir que en el futuro pueda adaptarse a otros proyectos de consultoria de Vena Digital mediante cambios de marca, estilo y configuracion.

La aplicacion debera estar alineada al sistema de diseno existente en la carpeta `Recursos`, usando una identidad visual que mezcla Vena Digital y Pinares. La experiencia debe sentirse profesional, ejecutiva, clara y confiable, con una interfaz moderna para gestion de proyectos, documentos, hallazgos, riesgos, entrevistas e inventario tecnologico.

---

## 2. Objetivos Del Producto

### 2.1 Objetivo Principal

Centralizar la gestion operativa, documental y comunicacional del proyecto de consultoria Pinares, permitiendo al equipo de Vena Digital y a los usuarios autorizados de Pinares consultar avances, cargar evidencias, registrar hallazgos, documentar procesos, gestionar riesgos y hacer seguimiento a tareas y entregables.

### 2.2 Objetivos Especificos

- Controlar el avance del proyecto por fases, tareas, hitos y entregables.
- Centralizar documentos finales y evidencias relevantes por fase del proyecto.
- Registrar y gestionar stakeholders, roles y permisos por modulo.
- Documentar el kickoff, alcance, gobernanza y reglas de trabajo.
- Registrar el inventario tecnologico de Pinares con costos, licencias, integraciones, riesgos y nivel de aprovechamiento.
- Documentar entrevistas de trabajo de campo, incluyendo audios, notas, actas y archivos adjuntos.
- Registrar procesos por area mediante documentos adjuntos y relaciones con herramientas, riesgos, hallazgos y entrevistas.
- Registrar hallazgos operativos, tecnologicos, normativos, de seguridad, costos, experiencia, integracion y automatizacion.
- Gestionar riesgos y cumplimiento mediante una matriz simple.
- Registrar decisiones tomadas durante el proyecto.
- Controlar entregables definidos en la propuesta comercial.
- Facilitar comunicacion general tipo muro con menciones, etiquetas y adjuntos.
- Ofrecer un panel ejecutivo con indicadores clave del proyecto.

---

## 3. Alcance Del MVP

El MVP incluye los siguientes modulos:

1. Autenticacion y administracion de usuarios.
2. Panel ejecutivo.
3. Stakeholders y permisos.
4. Kickoff y gobernanza.
5. Gestion documental.
6. Cronograma.
7. Comunicacion general tipo muro.
8. Inventario tecnologico.
9. Entrevistas y trabajo de campo.
10. Procesos por area.
11. Hallazgos.
12. Riesgos y cumplimiento.
13. Decisiones.
14. Entregables.

### 3.1 Fuera Del Alcance Inicial

Los siguientes modulos o funcionalidades no hacen parte del MVP:

- Modulo de ecosistema tecnologico visual.
- Modulo independiente de costos y licencias, ya que los costos se gestionaran dentro del inventario tecnologico.
- Modulo de roadmap e iniciativas.
- Modulo de solicitudes y bloqueos.
- Programacion de entrevistas dentro de la plataforma, ya que se gestionara en Microsoft Teams.
- Transcripcion automatica de audios.
- Autenticacion de dos factores.
- Bitacora/auditoria avanzada de acciones.
- Aprobaciones formales dentro de la plataforma.

---

## 4. Usuarios Y Roles

### 4.1 Roles Iniciales

#### Administrador Vena Digital

Rol principal de administracion de la plataforma. Puede gestionar usuarios, permisos, modulos, documentos, tareas, hallazgos, riesgos, entrevistas, procesos, decisiones y entregables.

Permisos esperados:

- Acceso completo a todos los modulos.
- Crear, editar y eliminar usuarios.
- Asignar permisos por modulo a usuarios de Pinares.
- Crear, editar y eliminar carpetas.
- Subir, visualizar y eliminar archivos.
- Crear, editar y eliminar tareas, hitos y entregables.
- Crear, editar y eliminar herramientas del inventario tecnologico.
- Crear, editar y eliminar entrevistas.
- Crear, editar y eliminar procesos.
- Crear, editar y eliminar hallazgos.
- Crear, editar y eliminar riesgos.
- Crear, editar y eliminar decisiones.

#### Administrador Pinares

Usuario administrador del lado de Pinares. Debe tener visibilidad total del contenido de la aplicacion y capacidad operativa en los modulos habilitados.

Permisos esperados:

- Acceso completo a todos los modulos del proyecto.
- Crear carpetas.
- Subir archivos.
- Visualizar audios de entrevistas.
- Crear hallazgos.
- Crear riesgos.
- Consultar dashboard, cronograma, entregables, decisiones y documentos.
- Eliminar archivos, tareas, hallazgos o registros.

#### Stakeholder Pinares

Usuario de Pinares con permisos limitados segun configuracion asignada por Administrador Vena Digital.

Permisos esperados:

- Acceder solo a los modulos autorizados.
- Visualizar informacion segun permisos asignados.
- Participar en el muro de comunicacion.
- Recibir menciones y notificaciones.
- Crear hallazgos si tiene permiso sobre el modulo correspondiente.

### 4.2 Permisos Por Modulo

Al crear o editar un usuario, el Administrador Vena Digital debe poder seleccionar los modulos a los cuales el usuario tendra acceso.

La configuracion minima de permisos debe permitir:

- Acceso al modulo: si/no.
- Permiso de visualizacion.
- Permiso de creacion.
- Permiso de edicion.
- Permiso de eliminacion, restringido a Administrador Vena Digital y Administrador Pinares.

---

## 5. Autenticacion

### 5.1 Login

La plataforma debe tener una pantalla de login personalizada usando los recursos visuales de Pinares/Vena Digital disponibles en la carpeta `Recursos`.

Debe incluir:

- Logo o identidad visual del proyecto.
- Mascota o elemento visual disponible si encaja con la composicion.
- Estilo alineado al sistema de diseno existente.
- Campos de correo electronico y contrasena.
- Mensajes de error claros en espanol.

### 5.2 Creacion De Usuarios

Los usuarios seran creados manualmente desde la aplicacion por el Administrador Vena Digital.

Flujo requerido:

1. Administrador Vena Digital crea usuario.
2. Define nombre, correo, rol y modulos permitidos.
3. Asigna una contrasena temporal.
4. El sistema envia correo de invitacion al usuario.
5. El usuario ingresa con correo y contrasena temporal.
6. El usuario puede cambiar su contrasena si lo desea, pero no es obligatorio.

### 5.3 Notificaciones Por Correo

La plataforma debe enviar notificaciones por correo en estos casos:

- Cuando un usuario es mencionado con `@usuario` en el muro de comunicacion.
- Cuando una nueva tarea es asignada a un usuario.

No se requieren notificaciones por nuevos documentos ni por comentarios generales sin mencion.

---

## 6. Sistema De Diseno Y Experiencia Visual

### 6.1 Direccion Visual

La plataforma debe usar el sistema de diseno disponible en `Recursos/sistema-diseno-vena-digital.html`, combinandolo con una direccion visual moderna, limpia y premium inspirada en interfaces tipo Apple.

La experiencia visual debe sentirse:

- Limpia y sofisticada.
- Moderna y de alto nivel ejecutivo.
- Minimalista, pero no fria.
- Ligera, fluida y ordenada.
- Cercana al lenguaje visual Apple-like: espacios generosos, jerarquia clara, componentes suaves, detalles finos y sensacion de producto premium.
- Integrada con el sistema visual Pinares/Vena Digital, no como una copia literal de Apple ni como una interfaz generica.

Elementos base identificados del sistema de diseno:

- Tipografia de display: Syne.
- Tipografia de cuerpo/UI: DM Sans.
- Fondo oscuro primario: `#0B0F1A`.
- Fondo oscuro secundario: `#141827`.
- Fondo claro: `#F4F6FB`.
- Acento amarillo: `#F5C518`.
- Acento azul: `#4F8EF7`.
- Rojo alerta: `#FF5C5C`.
- Radios amplios y tarjetas visuales.
- Estilo ejecutivo, tecnologico y moderno.

### 6.2 Lenguaje Glass Y Componentes Premium

La interfaz debe incorporar elementos tipo glassmorphism o glass UI de forma controlada y funcional. El efecto glass debe mejorar la percepcion de profundidad y modernidad sin afectar legibilidad ni rendimiento.

Criterios visuales:

- Uso de paneles glass con transparencias sutiles, blur de fondo y bordes finos semitransparentes.
- Tarjetas con radios amplios, sombras suaves y capas visuales discretas.
- Fondos con degradados, halos suaves o formas abstractas inspiradas en el sistema de diseno, evitando fondos planos sin intencion.
- Uso de acentos amarillo y azul para estados, llamados de atencion, indicadores y microinteracciones.
- Jerarquia tipografica clara usando Syne para encabezados y DM Sans para navegacion, tablas, formularios y contenido.
- Estados visuales elegantes para riesgo, prioridad, avance, semaforos y criticidad.
- Animaciones sutiles y utiles: entrada de paneles, transiciones de tarjetas, hover states y cambios de estado.
- Contraste suficiente en todos los textos, especialmente cuando se usen superficies glass.

Restricciones:

- El glassmorphism no debe sacrificar accesibilidad ni lectura.
- No se deben usar transparencias excesivas en tablas densas o formularios largos.
- La interfaz debe evitar verse como plantilla generica de dashboard.
- La identidad visual debe seguir sintiendose Pinares/Vena Digital.

### 6.3 Requerimientos De Interfaz

- La aplicacion debe funcionar bien en escritorio y movil.
- Debe tener navegacion clara por modulos.
- Debe tener componentes visuales consistentes: tarjetas, tablas, badges, estados, modales, formularios y paneles.
- Debe priorizar claridad y velocidad de consulta.
- Debe sentirse como una herramienta ejecutiva de control de consultoria, no como un gestor generico.
- Debe transmitir una experiencia premium, moderna y limpia, con una composicion visual tipo Apple/glass combinada con los colores y tipografias del sistema de diseno del proyecto.

---

## 7. Modulos Funcionales

## 7.1 Panel Ejecutivo

### Objetivo

Mostrar una vista consolidada del estado del proyecto para todos los usuarios con acceso a la plataforma.

### Reglas

- El panel sera igual para todos los roles en el MVP.
- La informacion visible dependera indirectamente de los permisos del usuario si aplica en consultas internas.

### Indicadores Requeridos

- Avance general.
- Avance por fase.
- Entregables pendientes.
- Hallazgos criticos.
- Riesgos altos.
- Documentos recientes.
- Proximas actividades.
- Decisiones pendientes.

---

## 7.2 Stakeholders Y Permisos

### Objetivo

Gestionar usuarios, roles, stakeholders y permisos por modulo.

### Funcionalidades

- Crear usuario.
- Editar usuario.
- Eliminar usuario.
- Asignar rol.
- Asignar modulos permitidos.
- Ver listado de stakeholders.
- Consultar detalle de cada stakeholder.
- Registrar area, cargo, correo y organizacion.

### Campos Sugeridos

- Nombre completo.
- Correo electronico.
- Rol.
- Organizacion: Vena Digital o Pinares.
- Cargo.
- Area.
- Estado: activo/inactivo.
- Modulos habilitados.
- Fecha de creacion.

---

## 7.3 Kickoff Y Gobernanza

### Objetivo

Documentar el marco inicial del proyecto, alcance, reglas de trabajo, stakeholders y acuerdos de gobernanza.

### Funcionalidades

- Registrar informacion del kickoff.
- Adjuntar documento de kickoff.
- Registrar alcance confirmado.
- Registrar cronograma base.
- Registrar stakeholders del proyecto.
- Registrar protocolo de trabajo con empleados.
- Registrar esquema de reportes y comunicacion.
- Adjuntar acuerdos de confidencialidad si aplica.

### Campos Sugeridos

- Fecha de kickoff.
- Objetivo de la sesion.
- Alcance confirmado.
- Areas incluidas.
- Prioridades iniciales.
- Protocolo de entrevistas.
- Esquema de comunicacion.
- Documentos adjuntos.

---

## 7.4 Gestion Documental

### Objetivo

Centralizar documentos finales, evidencias y archivos relevantes del proyecto.

### Estructura Inicial

El sistema debe crear automaticamente carpetas por fase:

- Fase 0 - Alineacion Estrategica.
- Fase 1 - Inventario Tecnologico.
- Fase 2 - Mapeo de Procesos por Area.
- Fase 3 - Construccion del Escenario Actual.
- Fase 4 - Diseno del Escenario Ideal.
- Fase 5 - Roadmap de Implementacion.
- Fase 6 - Presentacion de Resultados.

### Funcionalidades

- Crear carpetas adicionales.
- Subir archivos.
- Descargar archivos.
- Visualizar vista previa cuando el formato lo permita.
- Eliminar archivos de forma definitiva.
- Consultar documentos recientes.

### Permisos

Pueden crear carpetas:

- Administrador Vena Digital.
- Administrador Pinares.

Pueden subir archivos:

- Administrador Vena Digital.
- Administrador Pinares.
- Otros usuarios solo si el administrador les otorga permiso especifico.

Pueden eliminar archivos:

- Administrador Vena Digital.
- Administrador Pinares.

### Tipos De Archivo Permitidos

- PDF.
- DOC/DOCX.
- Markdown.
- PPT/PPTX.
- XLS/XLSX.
- Imagenes.
- Audios.
- Otros archivos relevantes del proyecto.

### Limite De Archivo

- Tamano maximo por archivo: 250 MB.

---

## 7.5 Cronograma

### Objetivo

Controlar el avance del proyecto mediante fases, tareas, hitos y entregables.

### Vista Principal

- Tablero Kanban.

### Entidades

- Fases.
- Tareas.
- Hitos.
- Entregables.

### Campos De Tarea

- Titulo.
- Descripcion.
- Fase asociada.
- Responsable.
- Fecha de inicio, opcional.
- Fecha fin, opcional.
- Estado.
- Prioridad.
- Comentarios.

### Estados

- No iniciado.
- En progreso.
- En revision.
- Bloqueado.
- Completado.

### Prioridades

- Alta.
- Media.
- Baja.

### Notificaciones

Cuando una tarea sea asignada a un usuario, el sistema debe enviar notificacion por correo electronico.

---

## 7.6 Comunicacion General Tipo Muro

### Objetivo

Permitir comunicacion general entre stakeholders del proyecto, con trazabilidad formal.

### Reglas

- Sera un muro general, no asociado directamente a tareas, documentos, hallazgos o procesos.
- Debe permitir menciones con `@usuario`.
- Debe permitir adjuntar archivos.
- Debe permitir usar etiquetas.
- Debe conservar trazabilidad de las comunicaciones del proyecto.

### Etiquetas Iniciales

- Urgente.
- Pregunta.
- Pendiente Pinares.
- Decision.
- Riesgo.

### Funcionalidades

- Crear publicacion.
- Comentar publicacion.
- Mencionar usuarios.
- Adjuntar archivos.
- Asignar etiquetas.
- Crear nuevas etiquetas.
- Filtrar por etiqueta.
- Buscar publicaciones.

### Notificaciones

Se enviara correo electronico cuando un usuario sea mencionado.

---

## 7.7 Inventario Tecnologico

### Objetivo

Registrar y analizar las herramientas tecnologicas utilizadas por Pinares, incluyendo costos, licencias, uso, integraciones, APIs, riesgos y nivel de aprovechamiento.

### Campos Obligatorios

- Nombre.
- Proveedor.
- Costo.
- Moneda: COP o USD.
- Tipo de licencia.
- Numero de usuarios.
- Responsable interno.
- Areas usuarias.
- Funcionalidades contratadas.
- Funcionalidades usadas.
- Integraciones.
- API disponible.
- Semaforo de aprovechamiento.
- Satisfaccion del grupo de usuarios.
- Riesgos asociados.
- Documentos adjuntos.

### Semaforo De Aprovechamiento

Asignacion manual por el consultor.

Valores:

- Verde.
- Amarillo.
- Rojo.

### Exportacion

El inventario tecnologico debe poder exportarse a Excel.

---

## 7.8 Entrevistas Y Trabajo De Campo

### Objetivo

Documentar entrevistas realizadas durante el levantamiento de informacion del proyecto.

### Reglas

- La programacion de entrevistas no se hara en la plataforma, ya que se gestiona en Microsoft Teams.
- No se requiere campo para enlace de Teams.
- No se requiere transcripcion automatica de audios en el MVP.
- El Administrador Pinares puede escuchar los audios.

### Tipos De Entrevista

1. Evaluacion del stack tecnologico.
2. Evaluacion de procesos.

### Funcionalidades

- Crear registro de entrevista.
- Adjuntar audio.
- Registrar notas.
- Adjuntar archivos.
- Registrar participantes.
- Adjuntar registro de reunion.
- Adjuntar acta de reunion.
- Relacionar entrevista con herramientas.
- Relacionar entrevista con procesos.

### Campos Sugeridos

- Titulo.
- Tipo de entrevista.
- Fecha de realizacion.
- Participantes.
- Areas participantes.
- Herramientas relacionadas.
- Procesos relacionados.
- Notas.
- Audio adjunto.
- Acta adjunta.
- Archivos adjuntos.

---

## 7.9 Procesos Por Area

### Objetivo

Centralizar la documentacion de procesos por area mediante documentos adjuntos y relacionarlos con otras entidades del proyecto.

### Areas Iniciales De Pinares

- Admision y recepcion de pacientes.
- Agendamiento de citas.
- Historia clinica / Atencion medica.
- Hospitalizacion / Internacion.
- Gestion de medicamentos / Farmacia.
- Laboratorio y diagnostico.
- Nutricion y alimentacion.
- Facturacion y cartera.
- Contabilidad y finanzas.
- Nomina y gestion de RRHH.
- Compras y logistica.
- Calidad, acreditacion y auditoria.
- Reportes normativos / entes de control.
- Comunicaciones internas.
- Comunicaciones externas / Marketing.
- Seguridad e infraestructura fisica.
- Gestion de TI / Sistemas.
- Gerencia y toma de decisiones.

### Reglas

- Inicialmente no se requiere diagramacion visual de procesos.
- No se requiere estado de validacion por Pinares.
- Cada proceso se registra como documentacion adjunta con campos estructurados.

### Campos Obligatorios

- Nombre del proceso.
- Area a la que pertenece el proceso.
- Areas impactadas por el proceso.
- Documento adjunto.

### Relaciones Permitidas

Al anexar un nuevo proceso debe poder relacionarse con:

- Herramientas.
- Riesgos.
- Hallazgos.
- Entrevistas.

---

## 7.10 Hallazgos

### Objetivo

Registrar problemas, oportunidades, riesgos, observaciones y puntos relevantes identificados durante la consultoria.

### Creacion

Los hallazgos pueden ser creados por:

- Usuarios de Vena Digital.
- Usuarios de Pinares con permisos sobre el modulo.

### Clasificacion

- Operativo.
- Tecnologico.
- Seguridad.
- Cumplimiento.
- Costos.
- Experiencia del paciente.
- Integracion.
- Automatizacion.

### Criticidad

- Alta.
- Media.
- Baja.

### Campos Sugeridos

- Titulo.
- Descripcion.
- Clasificacion.
- Criticidad.
- Area relacionada.
- Herramienta relacionada.
- Proceso relacionado.
- Riesgo relacionado.
- Evidencia adjunta.
- Identificado por.
- Fecha de identificacion.
- Estado.

### Estados Sugeridos

- Identificado.
- En analisis.
- Validado.
- Descartado.
- Convertido en recomendacion/iniciativa.

### Regla Futura

Un hallazgo debe poder convertirse posteriormente en recomendacion o iniciativa, aunque el modulo de roadmap no haga parte del MVP.

---

## 7.11 Riesgos Y Cumplimiento

### Objetivo

Registrar riesgos simples asociados a herramientas, procesos, areas y hallazgos, con foco en seguridad, cumplimiento y operacion.

### Tipo De Matriz

- Matriz simple de riesgos.

### Normativas Iniciales

- Ley 1581/2012 sobre proteccion de datos personales.
- Resolucion 1995/1999 sobre historias clinicas.
- Requisitos DIAN / facturacion electronica.
- Seguridad de datos de pacientes.

### Campos Sugeridos

- Titulo.
- Descripcion.
- Categoria.
- Nivel de riesgo.
- Normativa relacionada.
- Area relacionada.
- Herramientas relacionadas.
- Procesos relacionados.
- Hallazgos relacionados.
- Evidencias adjuntas.
- Estado.

### Nivel De Riesgo

- Alto.
- Medio.
- Bajo.

### Relaciones

Cada riesgo debe estar vinculado a una o varias de estas entidades:

- Herramienta.
- Proceso.
- Area.
- Hallazgo.

Un riesgo puede tener multiples vinculaciones simultaneas.

### Fuera Del MVP

- Acciones de mitigacion sugeridas.

---

## 7.12 Decisiones

### Objetivo

Registrar decisiones importantes tomadas durante el proyecto para mantener trazabilidad.

### Reglas

- No se requieren aprobaciones formales en el MVP.
- No se requiere firma digital.

### Campos Sugeridos

- Titulo.
- Descripcion.
- Fecha de decision.
- Participantes.
- Contexto.
- Alternativas evaluadas.
- Decision tomada.
- Responsable.
- Documentos relacionados.
- Estado.

### Estados Sugeridos

- Pendiente.
- Tomada.
- En seguimiento.
- Cerrada.

---

## 7.13 Entregables

### Objetivo

Controlar los entregables definidos en la propuesta comercial.

### Entregables Iniciales Segun Propuesta

#### Fase 0 - Alineacion Estrategica

- Documento de kickoff con alcance confirmado, cronograma detallado y stakeholders del proyecto.

#### Fase 1 - Inventario Tecnologico

- Matriz de inventario tecnologico con semaforo de aprovechamiento y alertas por herramienta.

#### Fase 2 - Mapeo de Procesos por Area

- Repositorio digital de procesos.
- Diagrama de flujo por proceso, aunque la diagramacion visual no se implementa inicialmente en la plataforma.
- Tabla de hallazgos con clasificacion de criticidad.

#### Fase 3 - Construccion del Escenario Actual

- Documento de diagnostico consolidado.
- Mapa visual del ecosistema tecnologico actual.
- Tabla de riesgos priorizados por nivel de impacto.

#### Fase 4 - Diseno del Escenario Ideal

- Mapa del ecosistema tecnologico ideal.
- Analisis comparativo: escenario actual vs. escenario ideal.
- Justificacion estrategica de cada decision de diseno.

#### Fase 5 - Roadmap de Implementacion

- Roadmap visual con tres horizontes.
- Ficha por iniciativa: que se hace, por que, responsable, recursos requeridos, costo estimado e impacto esperado.

#### Fase 6 - Presentacion de Resultados

- Repositorio digital completo de la consultoria.
- Presentacion ejecutiva de resultados.
- Acta de cierre y proximos pasos acordados.

### Estados De Entregable

- Pendiente.
- En elaboracion.
- En revision interna.
- Enviado a Pinares.
- Aprobado.
- Requiere ajustes.

### Nota

No se requiere aprobacion formal dentro de la plataforma para los entregables en el MVP.

---

## 8. Reglas De Eliminacion

Las eliminaciones seran definitivas.

Pueden eliminar archivos, tareas, hallazgos o registros:

- Administrador Vena Digital.
- Administrador Pinares.

No se implementara archivado ni papelera en el MVP.

Recomendacion tecnica: aunque el comportamiento visible sea eliminacion definitiva, se recomienda evaluar una estrategia interna de respaldo automatico a nivel de base de datos y storage para reducir riesgo operativo.

---

## 9. Requerimientos No Funcionales

### 9.1 Responsive

La aplicacion debe funcionar correctamente en:

- Navegador web de escritorio.
- Navegador web movil.

### 9.2 Seguridad

- Acceso solo mediante usuario y contrasena.
- Rutas privadas protegidas.
- Permisos por rol y por modulo.
- Politicas de acceso a archivos.
- Las credenciales sensibles no deben exponerse en el frontend.
- Los usuarios solo deben acceder a los modulos asignados.

### 9.3 Rendimiento

- La navegacion entre modulos debe ser fluida.
- Las tablas deben soportar busqueda, filtros y paginacion.
- La carga de archivos de hasta 250 MB debe manejar progreso de subida.
- Las consultas del dashboard deben estar optimizadas.

### 9.4 Idioma

- Toda la interfaz debe estar en espanol.
- Mensajes de error, estados, botones y correos deben estar en espanol.

### 9.5 Almacenamiento

- Los archivos deben almacenarse dentro de la misma aplicacion mediante el servicio de almacenamiento elegido.
- No se usaran Google Drive, SharePoint, OneDrive ni servicios externos de documentos para el MVP.

---

## 10. Modelo De Datos Conceptual

Entidades principales:

- Usuario.
- Rol.
- PermisoModulo.
- Modulo.
- Fase.
- Carpeta.
- Archivo.
- Tarea.
- Hito.
- Entregable.
- PublicacionMuro.
- ComentarioMuro.
- Etiqueta.
- HerramientaTecnologica.
- Entrevista.
- Proceso.
- Hallazgo.
- Riesgo.
- Decision.
- Area.

Relaciones clave:

- Usuario tiene un rol.
- Usuario tiene permisos por modulo.
- Archivo pertenece a carpeta y fase.
- Tarea pertenece a fase y puede tener responsable.
- Entregable pertenece a fase.
- Herramienta puede relacionarse con areas, riesgos, hallazgos, procesos y entrevistas.
- Entrevista puede relacionarse con herramientas y procesos.
- Proceso puede relacionarse con areas, herramientas, riesgos, hallazgos y entrevistas.
- Riesgo puede relacionarse con herramientas, procesos, areas y hallazgos.
- Hallazgo puede relacionarse con herramientas, procesos, riesgos y areas.

---

## 11. Stack Tecnologico Recomendado

### 11.1 Recomendacion Principal

Se recomienda construir la aplicacion con:

- Next.js.
- React.
- TypeScript.
- Supabase.
- PostgreSQL.
- Supabase Auth.
- Supabase Storage.
- Tailwind CSS.
- shadcn/ui personalizado.
- Resend.
- TanStack Table.
- React Hook Form.
- Zod.
- dnd-kit.
- ExcelJS o SheetJS.

### 11.2 Justificacion

#### Next.js

Next.js permite construir una aplicacion full-stack con React, rutas protegidas, layouts, server components, server actions y endpoints internos. Es mas adecuado que una SPA pura para este caso porque la plataforma requiere autenticacion, autorizacion, envio de correos, carga de archivos, permisos y logica administrativa del lado servidor.

#### Supabase

Supabase cubre varias necesidades centrales del MVP:

- Base de datos PostgreSQL.
- Autenticacion con email y contrasena.
- Storage para documentos, imagenes, audios y archivos de hasta 250 MB.
- Row Level Security para permisos granulares.
- SDK JavaScript para integracion con frontend y backend.

#### Tailwind CSS + shadcn/ui

Tailwind permite implementar rapidamente el sistema de diseno existente mediante tokens visuales. shadcn/ui ofrece componentes accesibles y reutilizables, pero deben personalizarse para evitar una apariencia generica y alinear toda la interfaz con Pinares/Vena Digital.

#### Resend

Resend se recomienda para correos transaccionales de invitacion, menciones y asignacion de tareas.

### 11.3 Opcion Alternativa

Una alternativa posible seria React + Vite + Supabase. Sin embargo, para este alcance se recomienda Next.js porque facilita mejor:

- Lógica segura de servidor.
- Envio de correos.
- Rutas privadas.
- Estructura modular.
- Acciones administrativas.
- Escalabilidad del producto si luego se reutiliza para otros proyectos.

---

## 12. Criterios De Aceptacion Generales

El MVP se considera funcionalmente aceptable cuando:

- Un Administrador Vena Digital puede crear usuarios, asignar roles y permisos por modulo.
- Un usuario puede ingresar con correo y contrasena temporal.
- La pantalla de login usa identidad visual personalizada de Pinares/Vena Digital, con estetica moderna tipo Apple/glass y uso adecuado de logo, mascota o recursos visuales disponibles.
- El dashboard muestra los indicadores definidos.
- Existen carpetas iniciales por fase en gestion documental.
- Se pueden crear carpetas adicionales segun permisos.
- Se pueden subir, previsualizar, descargar y eliminar archivos.
- El cronograma permite gestionar fases, tareas, hitos y entregables en vista Kanban.
- Se envia correo cuando una tarea es asignada a un usuario.
- El muro permite publicaciones, comentarios, menciones, etiquetas y adjuntos.
- Se envia correo cuando un usuario es mencionado.
- El inventario tecnologico permite registrar todos los campos obligatorios y exportar a Excel.
- El modulo de entrevistas permite subir audio, notas, participantes, acta y adjuntos.
- Los procesos pueden registrarse con nombre, area, areas impactadas y documento adjunto.
- Los procesos pueden relacionarse con herramientas, riesgos, hallazgos y entrevistas.
- Los hallazgos pueden ser creados por usuarios autorizados de Vena Digital y Pinares.
- Los riesgos pueden vincularse a herramientas, procesos, areas y hallazgos.
- Las decisiones pueden registrarse sin flujo de aprobacion formal.
- Los entregables de la propuesta estan precargados o disponibles para seguimiento.
- La aplicacion funciona correctamente en escritorio y movil.
- La interfaz implementa una direccion visual premium, limpia y tipo Apple/glass, manteniendo contraste, legibilidad y alineacion con el sistema de diseno del proyecto.

---

## 13. Riesgos Del Producto

- El uso de eliminacion definitiva puede generar perdida accidental de informacion.
- El manejo de archivos de hasta 250 MB requiere una configuracion cuidadosa de storage y limites de subida.
- Los permisos por modulo deben estar bien definidos desde el inicio para evitar exposicion de informacion sensible.
- La carga de audios puede aumentar rapidamente el consumo de almacenamiento.
- Si el sistema crece para otros clientes, sera necesario convertirlo en una arquitectura multi-proyecto o multi-tenant.

---

## 14. Roadmap Sugerido De Desarrollo

### Etapa 1 - Fundacion

- Configuracion del proyecto Next.js.
- Implementacion del sistema visual base.
- Autenticacion.
- Roles y permisos.
- Layout privado.
- Dashboard inicial.

### Etapa 2 - Gestion Operativa

- Cronograma Kanban.
- Gestion documental.
- Muro de comunicacion.
- Notificaciones por correo.

### Etapa 3 - Modulos De Consultoria

- Inventario tecnologico.
- Entrevistas.
- Procesos por area.
- Hallazgos.
- Riesgos.

### Etapa 4 - Cierre Y Control

- Decisiones.
- Entregables.
- Exportacion a Excel.
- Ajustes responsive.
- Pruebas funcionales.

---

## 15. Referencias Tecnicas

- Next.js App Router: https://nextjs.org/docs/app
- Supabase Auth: https://supabase.com/docs/guides/auth
- Supabase Storage: https://supabase.com/docs/guides/storage
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Resend Node.js: https://resend.com/docs/send-with-nodejs
- TanStack Table: https://tanstack.com/table/latest/docs/overview
- TanStack Query: https://tanstack.com/query/docs/docs

