**PODER JUDICIAL PROVINCIAL**

Sistema de Mesa de Ayuda IT

**PLAN DE DESARROLLO FRONTEND**

**FASE 3**

Entregable: Documento de Planificación y Análisis Frontend

Fecha: 09/03/2026 \| Versión: 2.0

*Taller de Certificación en Desarrollo Asistido por IA - Campus 2026*

Sumario

1\. Introducción y Contexto

Este documento define la planificación técnica y funcional para la Fase
3 del proyecto Mesa de Ayuda IT: el desarrollo completo del Frontend en
Angular, conectado al backend Spring Boot de la Fase 2.

1.1 Estado del Proyecto

**Fase 1 (Completada):** Base de datos MySQL normalizada con script DDL.

**Fase 2 (Completada):** Backend Spring Boot 3.x / Java 17 con 10
controllers REST, seguridad JWT (3 roles), auditoría AOP, jobs de
alertas, email y 141 casos de prueba Postman.

**POC:** Prototipo HTML estático como guía de diseño. La implementación
final se ajusta al Documento de Alcance (Software separado de Contratos,
entre otras diferencias).

1.2 Objetivo de la Fase 3

Desarrollar una SPA en Angular que consuma la API REST por HTTPS con
JWT, aplique control de acceso por rol, incorpore notificaciones en
tiempo real (WebSocket), exportación de datos en todos los listados, y
ofrezca una experiencia de usuario profesional y responsiva.

1.3 Premisas Técnicas

Comunicación por HTTPS

Toda la comunicación frontend-backend es exclusivamente por HTTPS. El
environment.ts de Angular apuntará a https://localhost:8443/api (o el
puerto configurado). La configuración SSL del backend (keystore en
application.properties) se realiza por separado. El CORS se actualizará
para permitir https://localhost:4200. En producción, certificados
provistos por la infraestructura del Poder Judicial o proxy reverso.

Stack Tecnológico

|                         |                      |                         |
|-------------------------|----------------------|-------------------------|
| **Tecnología**          | **Versión**          | **Propósito**           |
| Angular                 | 19.x (latest stable) | Framework SPA           |
| TypeScript              | 5.6+                 | Lenguaje tipado         |
| RxJS                    | 7.8+                 | Reactividad y WebSocket |
| SockJS + STOMP.js       | Latest               | Cliente WebSocket       |
| jsPDF + jspdf-autotable | Latest               | Exportación PDF         |
| SheetJS (xlsx)          | Latest               | Exportación Excel       |
| SCSS                    | Nativo               | Estilos custom del POC  |

2\. Arquitectura Frontend

2.1 Estructura de Módulos

|                     |                                                                                                                                    |           |
|---------------------|------------------------------------------------------------------------------------------------------------------------------------|-----------|
| **Módulo**          | **Contenido**                                                                                                                      | **Carga** |
| core/               | AuthService, JwtInterceptor, Guards, WebSocketService, NotificationService, ExportService, GlobalErrorHandler, modelos ApiResponse | Eager     |
| shared/             | ConfirmDialog, DataTable, StatusBadge, LoadingSpinner, Toast, EmptyState, ExportButton                                             | Importado |
| layout/             | SidebarComponent, HeaderComponent, MainLayoutComponent, BreadcrumbComponent, NotificationBellComponent                             | Eager     |
| features/auth/      | LoginComponent                                                                                                                     | Lazy      |
| features/dashboard/ | DashboardComponent, DashboardTecnicoComponent                                                                                      | Lazy      |
| features/tickets/   | List, Form, Detail + diálogos (Asignar, Reasignar, Cerrar, Eliminar)                                                               | Lazy      |
| features/hardware/  | List, Form, Detail                                                                                                                 | Lazy      |
| features/software/  | List, Form                                                                                                                         | Lazy      |
| features/contratos/ | List, Form, Detail, RenovarDialog                                                                                                  | Lazy      |
| features/juzgados/  | JuzgadoList, JuzgadoForm, CircunscripcionList, CircunscripcionForm                                                                 | Lazy      |
| features/usuarios/  | List, Form                                                                                                                         | Lazy      |
| features/auditoria/ | List, Detail                                                                                                                       | Lazy      |

2.2 Servicios Core

2.2.1 AuthService

- POST /api/auth/login por HTTPS. Almacena token y datos de usuario en
  BehaviorSubject.

- Persiste token en sessionStorage (no localStorage) — crítico en
  entorno judicial con equipos compartidos.

- Expone observables: isAuthenticated\$, currentUser\$, currentRole\$.

- Métodos: login(), logout() (limpia sesión + desconecta WebSocket),
  hasRole(), isTokenExpired().

- Decodifica payload JWT localmente con atob() para extraer rol y
  expiración.

2.2.2 JwtInterceptor

- Agrega Authorization: Bearer \<token\> a cada request (excepto
  /api/auth/login).

- Respuesta 401: logout automático + redirige a login con mensaje de
  sesión expirada.

- Respuesta 403: toast de acceso denegado sin cerrar sesión.

- Status 0 (sin conexión): toast 'No se puede conectar con el servidor'.

2.2.3 Guards de Ruta

- **authGuard:** Verifica autenticación + token no expirado. Redirige a
  /login con returnUrl.

- **roleGuard(roles\[\]):** Verifica rol del usuario. Redirige a
  /dashboard con toast si no tiene permiso.

- **unsavedChangesGuard:** En formularios: si hay cambios dirty, confirm
  'Tiene cambios sin guardar'.

2.2.4 GlobalErrorHandler

- 400 con errors: mapea a campos del formulario con setErrors().

- 400/409 con message: toast con el mensaje del backend.

- 404: toast + redirige al listado. 500: toast genérico. Status 0: toast
  de conexión.

3\. Matriz de Roles y Permisos

El frontend replica la matriz del backend. Aunque el backend siempre
valida, el frontend oculta opciones no permitidas para mejor UX.

3.1 Acceso por Rol

|                              |                            |                            |                           |
|------------------------------|----------------------------|----------------------------|---------------------------|
| **Módulo**                   | **Admin**                  | **Operario**               | **Técnico**               |
| Dashboard                    | ✅ Global interactivo      | ✅ Global interactivo      | ✅ Personal (sus tickets) |
| Tickets — Ver                | ✅ Todos                   | ✅ Todos                   | ✅ Solo sus asignados     |
| Tickets — CUD/Asignar/Cerrar | ✅                         | ✅                         | ❌                        |
| Tickets — Exportar           | ✅                         | ✅                         | ✅ (sus tickets)          |
| Hardware                     | ✅ CRUD + Export           | ✅ CRUD + Export           | ❌                        |
| Software                     | ✅ CRUD + Export           | ✅ CRUD + Export           | ❌                        |
| Contratos                    | ✅ CRUD + Renovar + Export | ✅ CRUD + Renovar + Export | ❌                        |
| Juzgados / Circunscripciones | ✅ CRUD                    | ✅ CRUD                    | ❌                        |
| Usuarios — Ver + Export      | ✅                         | ✅ Solo lectura            | ❌                        |
| Usuarios — CUD               | ✅                         | ❌                         | ❌                        |
| Auditoría                    | ✅ + Export                | ❌                         | ❌                        |
| Notificaciones WS            | ✅ Todas                   | ✅ Todas                   | ✅ Sus asignaciones       |

3.2 Tres Niveles de Restricción

1.  **Rutas (Guards):** canActivate con roleGuard define acceso por
    módulo.

2.  **Sidebar (Navegación dinámica):** Menú generado según rol. Técnico:
    solo Dashboard + Tickets.

3.  **Componentes (@if / hasRole):** Botones y acciones visibles/ocultos
    según rol.

4\. Análisis Detallado por Módulo

4.1 Autenticación (Login)

**Ruta:** /login (pública, sin layout)

- Formulario reactivo: email (requerido + formato), password
  (requerido + min 6).

- Errores inline post-touched. Botón deshabilitado si inválido o
  cargando.

- Error 401: mensaje visible encima del formulario (no toast).

- Login exitoso: almacenar datos, conectar WebSocket, redirigir a
  returnUrl o /dashboard.

- Si ya autenticado, redirige a /dashboard. Toggle mostrar/ocultar
  password.

4.2 Dashboard

4.2.1 Dashboard Admin/Operario — Interactivo sin gráficos

**Ruta:** /dashboard

Métricas numéricas interactivas con filtros. Sin gráficos
(pie/barras/líneas).

**Filtros:**

- Rango de fechas (date range picker). Default: últimos 30 días.

- Juzgado / Circunscripción (select). Default: Todos.

**Tarjetas clickeables (navegan a listados filtrados):**

- Tickets Activos (total sin cerrar) →
  /tickets?estado=SOLICITADO,ASIGNADO,EN_CURSO

- Tickets Críticos/Alta (rojo/naranja) → /tickets?prioridad=CRITICA

- Tickets Solicitados sin asignar → /tickets?estado=SOLICITADO

- Contratos próximos a vencer (amarillo) → /contratos tab Próximos

- Contratos vencidos (rojo) → /contratos tab Vencidos

- Hardware total → /hardware

- Licencias disponibles vs total → /software

**Tabla de carga de técnicos:**

- Columnas: Técnico, Tickets asignados, En curso, Total activos.

- Click en nombre → /tickets?tecnicoId=X. Útil para balancear
  asignaciones.

**Sección alertas y últimos tickets:**

- Contratos vencidos/próximos con link al detalle.

- Últimos 5-10 tickets con estado, prioridad y link.

4.2.2 Dashboard Técnico

Vista personal. El técnico es un usuario de solo consulta: ve sus
tickets, usa los datos del referente (nombre y teléfono) para
comunicarse fuera de la plataforma.

- Tarjetas: Mis asignados, En curso, Completados hoy.

- Recordatorio: 'Cuando termines un ticket, avisá a Mesa de Ayuda para
  que cierren el caso.'

- Tabla de sus tickets con badges, datos del referente y link al
  detalle.

- Sin botones de acción. Botón Exportar disponible.

4.3 Tickets de Soporte

Módulo más complejo. Flujo de estados, asignación manual, vistas
diferenciadas por rol.

4.3.1 TicketListComponent (/tickets)

- Filtros: Estado, Prioridad, Juzgado, Técnico, Búsqueda libre (debounce
  400ms). Persistentes en URL.

- Tabla: N°, Título, Estado (badge), Prioridad (badge), Juzgado,
  Técnico, Fecha, Acciones.

- Botón '+ Nuevo Ticket' solo Admin/Operario. Botón Exportar para todos.

- Técnico: solo sus tickets, solo Ver detalle.

4.3.2 TicketFormComponent (/tickets/nuevo, /tickets/:id/editar)

Campos: título (requerido, max 200, contador), descripción (requerido,
textarea), prioridad (select, default MEDIA), tipoRequerimiento (select:
Hardware/Software/Red/Otro), juzgadoId (requerido, select), hardwareId
(opcional, select filtrado por juzgado, muestra nroInventario + marca
modelo), referenteNombre (max 150), referenteTelefono (max 30).

- Edición: solo si SOLICITADO. Si cambió estado, mensaje + redirigir.

- Validación al blur. Botón deshabilitado si inválido/pristine. Error
  409: toast de negocio.

4.3.3 TicketDetailComponent (/tickets/:id)

- Cabecera con título, badges, fecha. Datos completos con links a
  juzgado y hardware.

- Sección técnico, sección resolución (solo si CERRADO).

- Timeline visual cronológico: Creado → Asignado → En Curso → Cerrado.

- Botones contextuales por estado (Admin/Operario). Botón 'Ver
  historial' (Admin).

4.3.4 Diálogos

- **Asignar:** Select técnicos activos con carga. PUT /:id/asignar.

- **Reasignar:** Excluye técnico actual. PUT /:id/reasignar.

- **Cerrar:** Textarea resolución obligatoria. PUT /:id/cerrar.

- **Eliminar:** Confirm soft-delete. Solo SOLICITADO sin técnico. DELETE
  /:id.

4.3.5 Máquina de Estados

|                   |            |               |                    |
|-------------------|------------|---------------|--------------------|
| **Estado Actual** | **Acción** | **Siguiente** | **Endpoint**       |
| SOLICITADO        | Asignar    | ASIGNADO      | PUT /:id/asignar   |
| SOLICITADO        | Editar     | SOLICITADO    | PUT /:id           |
| SOLICITADO        | Eliminar   | (soft-delete) | DELETE /:id        |
| ASIGNADO          | Reasignar  | ASIGNADO      | PUT /:id/reasignar |
| ASIGNADO          | En Curso   | EN_CURSO      | PUT /:id/estado    |
| ASIGNADO          | Cerrar     | CERRADO       | PUT /:id/cerrar    |
| EN_CURSO          | Reasignar  | EN_CURSO      | PUT /:id/reasignar |
| EN_CURSO          | Cerrar     | CERRADO       | PUT /:id/cerrar    |
| CERRADO           | Ninguna    | —             | —                  |

4.4 Hardware

- Filtros: Juzgado, Clase (PC/Impresora/Scanner/Monitor), modelo,
  ubicación.

- Tabla: Nro. Inventario, Clase, Marca/Modelo, Serie, Juzgado,
  Ubicación, Contrato (badge vigente/vencido/sin). Exportar.

- Form: nroInventario (único), clase, marca, modelo, nroSerie,
  ubicacionFisica, juzgadoId, contratoId (select con
  nombre+proveedor+fecha), observaciones. Error 409 por duplicado en
  campo.

4.5 Software

*Módulo independiente de Contratos (diferencia con POC).*

- Tabla: Nombre, Proveedor, Licencias (uso/total), Disponibles,
  Vencimiento, Contrato, Juzgado. Barra progreso licencias. Exportar.

- Form: nombre, proveedor, cantidadLicencias (min 1), fechaVencimiento,
  contratoId (requerido, activo), juzgadoId, hardwareId, observaciones.

4.6 Contratos

- Tabs: Todos, Activos, Próximos a vencer, Vencidos. Exportar.

- Tabla: Nombre, Proveedor, Fechas, Cobertura, Monto, Estado (badge).
  Form con validación cruzada fechas y multi-select hardware/software.

- Detalle: datos + listas hardware/software asociados.

- RenovarDialog: nuevas fechas (precarga sugeridas), monto opcional,
  observaciones. Solo para vencidos/próximos.

4.7 Juzgados y Circunscripciones

- Estructura jerárquica: Circunscripción \> Juzgados. Vista expandible o
  tabs.

- JuzgadoForm: nombre, fuero (Civil/Penal/Familia/Laboral), ciudad,
  edificio, circunscripcionId. Botón rápido crear circunscripción.

- CircunscripcionForm: nombre, distritoJudicial.

4.8 Usuarios

- Tabla: Nombre, Email, Teléfono, Rol (badge), Estado (badge), Fecha
  alta. Búsqueda con debounce. Filtro rol/estado. Exportar.

- Form: nombre, apellido, email, password (requerido crear, opcional
  editar: 'Dejar en blanco para no cambiar'), telefono, rolId.

- Activar (confirm simple), Desactivar (warn si tickets activos, 409),
  Eliminar (soft-delete, confirm doble).

- Admin: CRUD completo. Operario: solo lectura.

4.9 Auditoría (Solo Admin)

- Filtros: Rango fechas, Entidad, Acción (CREATE/UPDATE/DELETE/CLOSE).
  Exportar.

- Tabla: Fecha, Usuario, Entidad, Acción, ID Registro (link a entidad),
  Ver Detalle.

- Detalle: modal con valorAnterior y valorNuevo en JSON pretty-printed,
  resaltando diferencias.

- Accesible también desde detalle de cualquier entidad con 'Ver
  historial de cambios'.

5\. Patrones UX Transversales

5.1 Toasts

- Esquina superior derecha, apilables. Tipos: Éxito (verde), Error
  (rojo), Advertencia (amarillo), Info (azul).

- Auto-cierre 4s (éxito/info), 8s (error/warn). Botón X. Mensajes del
  ApiResponse.message.

5.2 Confirmaciones

- Toda eliminación/cambio irreversible: dialog con título, impacto,
  Cancelar + Confirmar (rojo/amarillo).

- Delay 1s o loading en Confirmar para prevenir doble-click.

5.3 Estados de Carga

- Skeleton/spinner en tablas. Spinner en botones submit. Empty state con
  icono y mensaje. Error state con Reintentar.

5.4 Navegación

- Breadcrumb dinámico (Inicio \> Módulo \> Acción). routerLink siempre.
  Botón Volver en forms/detalles.

5.5 Formularios

- Reactive Forms siempre. Errores inline post-touched. Borde rojo si
  inválido. Asterisco en requeridos.

- Selects dependientes (juzgado → hardware). unsavedChangesGuard.
  Submit: mark all touched + scroll al primer error.

5.6 Tablas

- Badges consistentes: CRITICA=rojo, ALTA=naranja, MEDIA=azul,
  BAJA=gris. SOLICITADO=gris, ASIGNADO=azul, EN_CURSO=amarillo,
  CERRADO=verde.

- Filtros persistentes en URL. Exportar en todas. Paginación frontend si
  necesario.

5.7 Responsividad

- Desde 1024px. Sidebar colapsable. Scroll horizontal en tablas. Grid
  responsivo en forms.

5.8 Accesibilidad

- Contraste WCAG AA. Labels asociados. Focus visible. aria-label en
  botones con íconos.

6\. Notificaciones en Tiempo Real (WebSocket)

6.1 Descripción

Comunicación bidireccional vía WebSocket con STOMP sobre SockJS. El
servidor envía notificaciones instantáneas sin polling.

6.2 Requisitos Backend (a implementar)

- Dependencia spring-boot-starter-websocket.

- WebSocketConfig (@EnableWebSocketMessageBroker): endpoint /ws con
  SockJS, broker /topic y /queue, prefijo /app.

- Disparar mensajes desde Services con SimpMessagingTemplate al
  completar operaciones CUD.

- /topic/notificaciones para broadcast, /queue/notificaciones para
  mensajes personales.

- Seguridad: validar token JWT en el handshake WebSocket.

6.3 Eventos

|                          |                          |                 |                                        |
|--------------------------|--------------------------|-----------------|----------------------------------------|
| **Evento**               | **Destinatario**         | **Canal**       | **Mensaje ejemplo**                    |
| Ticket asignado          | Técnico asignado         | /queue          | Se te asignó ticket \#N: \[título\]    |
| Ticket reasignado        | Nuevo + anterior técnico | /queue          | Se te asignó/retiró ticket \#N         |
| Ticket en curso          | Admin/Operarios          | /topic          | Ticket \#N pasó a EN_CURSO             |
| Ticket cerrado           | Admin/Op + Técnico       | /topic + /queue | Ticket \#N cerrado                     |
| Contrato vencido         | Admin/Operarios          | /topic          | Contrato \[nombre\] ha vencido         |
| Contrato próximo         | Admin/Operarios          | /topic          | Contrato \[nombre\] vence en X días    |
| Modificación concurrente | Usuarios viendo entidad  | /topic          | Ticket \#N modificado por otro usuario |

6.4 Frontend

WebSocketService

- Conecta a wss://localhost:8443/ws post-login con JWT en handshake.

- Suscribe a /topic/notificaciones y /user/queue/notificaciones.

- Observable notifications\$. Reconexión con backoff exponencial (1s,
  2s, 4s... max 30s).

- Desconexión limpia al logout.

NotificationService

- Toast automático por notificación. Sonido sutil opcional para alta
  prioridad.

- Contador de no leídas.

NotificationBellComponent (Header)

- Campana con badge rojo (no leídas). Dropdown con últimas 10-15
  notificaciones.

- Cada una con link a la entidad. Botón 'Marcar todas como leídas'.

Actualización de Vistas

- En listado: banner 'Datos actualizados' + Recargar, o auto-recargar
  tabla.

- En detalle: advertencia 'Registro modificado por otro usuario' +
  Recargar.

- En form editando: NO auto-recargar (perdería cambios), solo
  advertencia visible.

7\. Exportación de Datos (PDF / Excel)

7.1 Descripción

Todos los listados incluyen botón Exportar (PDF y Excel). Se realiza
100% en frontend con los datos ya cargados, sin endpoints adicionales.

7.2 Comportamiento

- Dropdown: 'Descargar como PDF' / 'Descargar como Excel (.xlsx)'.

- Exporta solo datos con filtros activos aplicados.

- Encabezado: título módulo, fecha/hora, filtros aplicados, tabla de
  datos.

- Nombre archivo: \[modulo\]\_\[fecha\].\[ext\] (ej:
  tickets_2026-03-09.pdf).

7.3 Implementación

- **ExportService (core):** Recibe datos, config columnas y metadatos.
  Genera PDF con jsPDF+autotable o Excel con SheetJS.

- **ExportButton (shared):** Componente reutilizable que recibe datos,
  columnas, título y filtros. Se agrega a cada listado.

- **PDF:** Encabezado institucional, título, filtros como subtítulo,
  tabla formateada, pie con fecha.

- **Excel:** Hoja nombrada, encabezados en negrita, columnas
  auto-ajustadas, formatos de fecha.

7.4 Disponibilidad

|            |                          |                                                                       |
|------------|--------------------------|-----------------------------------------------------------------------|
| **Módulo** | **Roles**                | **Columnas**                                                          |
| Tickets    | Admin, Operario, Técnico | N°, Título, Estado, Prioridad, Juzgado, Técnico, Fechas               |
| Hardware   | Admin, Operario          | Inventario, Clase, Marca, Modelo, Serie, Juzgado, Ubicación, Contrato |
| Software   | Admin, Operario          | Nombre, Proveedor, Licencias, Vencimiento, Contrato, Juzgado          |
| Contratos  | Admin, Operario          | Nombre, Proveedor, Fechas, Cobertura, Monto, Estado                   |
| Juzgados   | Admin, Operario          | Nombre, Fuero, Ciudad, Edificio, Circunscripción                      |
| Usuarios   | Admin, Operario          | Nombre, Email, Teléfono, Rol, Estado, Fecha alta                      |
| Auditoría  | Admin                    | Fecha, Usuario, Entidad, Acción, ID Registro                          |

8\. Edge Cases y Manejo de Errores

8.1 Sesión

|                                          |                                                                           |
|------------------------------------------|---------------------------------------------------------------------------|
| **Escenario**                            | **Comportamiento**                                                        |
| Token expirado (8h)                      | Interceptor → 401 → logout + desconexión WS → login con 'Sesión expirada' |
| Usuario desactivado/eliminado con sesión | Siguiente request → 401 → logout automático                               |
| Logout en una pestaña                    | Evento storage cierra sesión en todas las pestañas                        |
| URL protegida sin auth                   | authGuard → /login con returnUrl                                          |
| URL sin permiso de rol                   | roleGuard → /dashboard con toast                                          |

8.2 Concurrencia

|                                        |                                                      |
|----------------------------------------|------------------------------------------------------|
| **Escenario**                          | **Comportamiento**                                   |
| Dos operarios asignan mismo ticket     | Primero OK, segundo 409. Toast + recargar. WS avisa. |
| Editar ticket ya cerrado por otro      | 409 'Estado cambió'. Recargar.                       |
| Eliminar juzgado con dependencias      | 409 con mensaje descriptivo. Toast.                  |
| Desactivar técnico con tickets activos | 409 'Reasigne tickets primero'. Toast.               |

8.3 Red y Servidor

|                          |                                                      |
|--------------------------|------------------------------------------------------|
| **Escenario**            | **Comportamiento**                                   |
| Backend caído (status 0) | Toast conexión. WS reconecta con backoff.            |
| Error 500                | Toast genérico. Log en consola.                      |
| Timeout 30s              | Toast 'Solicitud tardó demasiado'.                   |
| SSL inválido             | Navegador bloquea. En dev: aceptar cert autofirmado. |

8.4 Formularios

|                                  |                                                   |
|----------------------------------|---------------------------------------------------|
| **Escenario**                    | **Comportamiento**                                |
| Duplicado (email, nroInventario) | 409 del backend. Error en el campo.               |
| Fecha fin \< inicio              | Validación cruzada frontend. No envía request.    |
| Submit con vacíos                | Mark all touched + scroll primer error.           |
| Navegar con cambios sin guardar  | unsavedChangesGuard: 'Tiene cambios sin guardar'. |

8.5 WebSocket

|                                   |                                                   |
|-----------------------------------|---------------------------------------------------|
| **Escenario**                     | **Comportamiento**                                |
| Conexión WS perdida               | Backoff exponencial (1s...30s). Indicador sutil.  |
| Navegador sin WS                  | SockJS fallback (long-polling). Transparente.     |
| Notificación con pestaña inactiva | Badge campana se actualiza. Disponible al volver. |

9\. Mapeo de Servicios HTTP

Base URL: https://localhost:8443/api (configurable en environment.ts).
Todos tipan ApiResponse\<T\>.

9.1 TicketService

|                    |          |                        |                                              |                    |
|--------------------|----------|------------------------|----------------------------------------------|--------------------|
| **Método**         | **HTTP** | **Endpoint**           | **Request/Params**                           | **Response**       |
| listar(filtros)    | GET      | /tickets               | ?estado=&prioridad=&juzgadoId=&tecnicoId=&q= | TicketResponse\[\] |
| obtenerPorId(id)   | GET      | /tickets/:id           | —                                            | TicketResponse     |
| crear(dto)         | POST     | /tickets               | TicketRequest                                | TicketResponse     |
| editar(id, dto)    | PUT      | /tickets/:id           | TicketRequest                                | TicketResponse     |
| asignar(id, tid)   | PUT      | /tickets/:id/asignar   | { tecnicoId }                                | TicketResponse     |
| reasignar(id, tid) | PUT      | /tickets/:id/reasignar | { tecnicoId }                                | TicketResponse     |
| pasarAEnCurso(id)  | PUT      | /tickets/:id/estado    | —                                            | TicketResponse     |
| cerrar(id, res)    | PUT      | /tickets/:id/cerrar    | { resolucion }                               | TicketResponse     |
| eliminar(id)       | DELETE   | /tickets/:id           | —                                            | void               |

9.2 HardwareService / SoftwareService

Ambos siguen el patrón CRUD estándar: listar(), obtenerPorId(), crear(),
editar(), eliminar() sobre sus respectivos endpoints /hardware y
/software.

9.3 ContratoService

CRUD estándar más: proximosAVencer() (GET /contratos/proximos-vencer),
vencidos() (GET /contratos/vencidos), renovar() (POST
/contratos/:id/renovar).

9.4 JuzgadoService / CircunscripcionService

CRUD estándar sobre /juzgados y /circunscripciones respectivamente.

9.5 UsuarioService

CRUD estándar más: tecnicosActivos() (GET /usuarios/tecnicos-activos),
buscar(q) (GET /usuarios/buscar?q=), activar() (PUT /:id/activar),
desactivar() (PUT /:id/desactivar).

9.6 AuditLogService

Solo lectura: porEntidad(entidad, id), porUsuario(usuarioId),
porFechas(desde, hasta), filtroCompleto(entidad, accion, desde, hasta).

9.7 RolService

Solo listar() (GET /roles) para popular selects.

10\. Interfaces TypeScript

Contrato frontend-backend derivado de los DTOs.

Core

ApiResponse\<T\>: { success, message, data: T, errors?: {\[campo\]:
string}, timestamp }

LoginRequest: { email, password }

LoginResponse: { token, tipo, usuarioId, nombreCompleto, email, rol }

CurrentUser: { id, nombreCompleto, email, rol:
'Admin'\|'Operario'\|'Técnico', token }

WsNotification: { tipo, entidad, registroId, mensaje, fecha }

Tickets

TicketRequest: { titulo, descripcion, prioridad?, tipoRequerimiento?,
juzgadoId, hardwareId?, referenteNombre?, referenteTelefono? }

TicketResponse: { id, titulo, descripcion, prioridad, estado,
tipoRequerimiento, juzgadoId, juzgadoNombre, tecnicoId?,
tecnicoNombreCompleto?, hardwareId?, hardwareNroInventario?,
hardwareDescripcion?, referenteNombre?, referenteTelefono?, creadoPorId,
creadoPorNombreCompleto, resolucion?, fechaCreacion, fechaAsignacion?,
fechaCierre? }

Hardware / Software / Contratos / Juzgados / Usuarios / Auditoría

Las interfaces de cada entidad siguen exactamente la estructura de sus
RequestDTO y ResponseDTO del backend, documentados en el código fuente
de la Fase 2. Los campos, tipos y opcionalidad se mapean 1:1 respetando
las validaciones definidas en las anotaciones @Valid del backend.

11\. Orden de Desarrollo

Secuencia que minimiza dependencias. WebSocket y exportación se integran
transversalmente una vez que los módulos base funcionan.

Etapa 1: Cimientos

1.  Crear proyecto Angular 19 (standalone, SCSS, routing).

2.  Estructura carpetas. environment.ts: apiUrl
    https://localhost:8443/api, wsUrl wss://localhost:8443/ws.

3.  Interfaces TypeScript para ApiResponse y todos los DTOs.

4.  AuthService + JwtInterceptor + Guards + GlobalErrorHandler.

5.  LoginComponent. Probar contra backend HTTPS.

*Resultado: Login funcional con HTTPS.*

Etapa 2: Layout y Shared

1.  MainLayout, Sidebar dinámico, Header con breadcrumbs.

2.  Estilos globales (variables CSS del POC).

3.  Toast, ConfirmDialog, LoadingSpinner, StatusBadge, EmptyState.

*Resultado: App navegable con layout y 3 roles.*

Etapa 3: Tickets

1.  TicketService + List (filtros, URL, acciones por rol) + Form +
    Detail + Timeline.

2.  Diálogos Asignar/Reasignar/Cerrar/Eliminar. Probar flujo estados +
    vista Técnico.

Etapa 4: Inventario

1.  Hardware: Service + List + Form.

2.  Software: Service + List + Form.

Etapa 5: Contratos

1.  Service + List (tabs estado) + Form (multi-select) + Detail +
    RenovarDialog.

Etapa 6: Juzgados + Usuarios + Auditoría

1.  Vista jerárquica Circunscripciones \> Juzgados + forms.

2.  Usuarios: List + Form + activar/desactivar/eliminar.

3.  Auditoría: List + Detail con diff JSON.

Etapa 7: Exportación

1.  ExportService (jsPDF + SheetJS) + ExportButton.

2.  Integrar en todos los listados. Verificar con filtros.

Etapa 8: WebSocket

1.  Backend: WebSocketConfig, STOMP, SimpMessagingTemplate, JWT en
    handshake.

2.  Frontend: WebSocketService + NotificationService + NotificationBell.

3.  Integración: actualización automática de vistas.

Etapa 9: Dashboard y Pulido

1.  Dashboard Admin/Operario interactivo + Dashboard Técnico.

2.  Filtros en URL en todos los listados. Responsividad. Pruebas
    integrales.

12\. Mejoras Futuras (Fuera de Fase 3)

- **Perfil de usuario:** Cambio de contraseña propia. Requiere endpoint
  PUT /api/auth/cambiar-password.

- **Gráficos en Dashboard:** Torta, barras, línea temporal con Chart.js
  o ngx-charts.

- **Paginación backend:** Spring Data Pageable para grandes volúmenes.

- **Búsqueda avanzada:** Filtros guardados, favoritos, combinados
  complejos.

- **Integración sistemas externos:** Según Documento de Alcance, a
  definir en futuras fases.

13\. Checklist Pre-entrega

Funcional

- Login funciona con 3 roles. CRUD completo por permisos.

- Flujo tickets: crear → asignar → en curso → cerrar. Reasignación OK.

- Dashboard con métricas, filtros y clicks navegables.

- Técnico: solo consulta + exportar sus tickets.

- Exportación PDF/Excel en todos los listados respetando filtros.

- Auditoría con historial correcto y diff antes/después.

Seguridad

- Sin acceso sin auth. Roles respetados en rutas, sidebar y componentes.

- Token en sessionStorage. HTTPS en todas las requests. JWT en handshake
  WS.

WebSocket

- Notificaciones en tiempo real llegan al usuario correcto.

- Técnico recibe alerta al ser asignado. Reconexión automática funciona.

- Campana con contador. Advertencia de modificación concurrente OK.

UX

- Validaciones inline. Errores amigables. Confirmaciones en acciones
  destructivas.

- Spinners. Empty states. Filtros en URL. unsavedChangesGuard.

Técnico

- Lazy loading funcional. Sin errores en consola. CORS HTTPS OK. Build
  producción limpio.

*Fin del documento*
