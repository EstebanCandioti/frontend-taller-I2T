# Mesa de Ayuda IT - Poder Judicial Provincial

## Proyecto

Sistema de gestión IT (Mesa de Ayuda) para el Poder Judicial Provincial. SPA Angular que consume API REST Spring Boot con JWT. Fase 3 de un taller de certificación en desarrollo asistido por IA (Campus 2026).

**Fases anteriores completadas:**
- Fase 1: Base de datos MySQL normalizada (DDL)
- Fase 2: Backend Spring Boot 3.x / Java 17 con 10 controllers REST, seguridad JWT (3 roles), auditoría AOP, jobs de alertas, email, 141 casos Postman

## Stack Técnico

- **Angular 21.x** (standalone components, sin módulos NgModule)
- **TypeScript 5.9+**
- **SCSS** para estilos
- **RxJS 7.8+** para reactividad
- **Vitest** para testing (no Karma/Jasmine)
- **SockJS + STOMP.js** para WebSocket
- **jsPDF + jspdf-autotable** para exportación PDF
- **SheetJS (xlsx)** para exportación Excel
- Sin Angular Material — estilos custom del POC con SCSS

## Comandos

```bash
npm start          # ng serve (dev server en localhost:4200)
npm run build      # ng build (producción)
npm test           # ng test (vitest)
```

## Arquitectura

### Estructura de carpetas objetivo

```
src/app/
├── core/           # Eager: AuthService, JwtInterceptor, Guards, WebSocketService,
│                   #   NotificationService, ExportService, GlobalErrorHandler, modelos
├── shared/         # Importado: ConfirmDialog, DataTable, StatusBadge, LoadingSpinner,
│                   #   Toast, EmptyState, ExportButton
├── layout/         # Eager: Sidebar, Header, MainLayout, Breadcrumb, NotificationBell
└── features/       # Lazy loaded por ruta
    ├── auth/       # LoginComponent
    ├── dashboard/  # DashboardComponent, DashboardTecnicoComponent
    ├── tickets/    # List, Form, Detail + diálogos (Asignar, Reasignar, Cerrar, Eliminar)
    ├── hardware/   # List, Form, Detail
    ├── software/   # List, Form
    ├── contratos/  # List, Form, Detail, RenovarDialog
    ├── juzgados/   # JuzgadoList, JuzgadoForm, CircunscripcionList, CircunscripcionForm
    ├── usuarios/   # List, Form
    └── auditoria/  # List, Detail
```

### Patrones clave

- **Standalone components** en todo el proyecto (sin NgModule)
- **Lazy loading** en todos los feature modules vía `loadComponent`/`loadChildren`
- **Reactive Forms** siempre (no template-driven)
- **Servicios con BehaviorSubject** para estado (AuthService expone isAuthenticated$, currentUser$, currentRole$)
- **Token JWT en sessionStorage** (no localStorage — equipos compartidos en entorno judicial)
- **ApiResponse\<T\>** como wrapper estándar: `{ success, message, data: T, errors?, timestamp }`
- **Guards funcionales**: authGuard, roleGuard(roles[]), unsavedChangesGuard
- **JwtInterceptor**: agrega Bearer token, maneja 401 (logout), 403 (toast), status 0 (sin conexión)

## Backend API

- **Base URL**: `https://localhost:8443/api` (configurar en environment.ts)
- **WebSocket**: `wss://localhost:8443/ws` (SockJS + STOMP)
- **Autenticación**: POST `/api/auth/login` → devuelve JWT
- **Endpoints principales**: /tickets, /hardware, /software, /contratos, /juzgados, /circunscripciones, /usuarios, /audit, /roles

## Roles y Permisos (3 roles)

| Módulo | Admin | Operario | Técnico |
|--------|-------|----------|---------|
| Dashboard | Global interactivo | Global interactivo | Personal (sus tickets) |
| Tickets | CRUD + Asignar/Cerrar | CRUD + Asignar/Cerrar | Solo lectura sus asignados |
| Hardware/Software | CRUD + Export | CRUD + Export | Sin acceso |
| Contratos | CRUD + Renovar + Export | CRUD + Renovar + Export | Sin acceso |
| Juzgados | CRUD | CRUD | Sin acceso |
| Usuarios | CRUD completo | Solo lectura | Sin acceso |
| Auditoría | Lectura + Export | Sin acceso | Sin acceso |

**Tres niveles de restricción**: Guards de ruta → Sidebar dinámico por rol → @if/hasRole en componentes.

## Flujo de Tickets (máquina de estados)

SOLICITADO → (Asignar) → ASIGNADO → (En Curso) → EN_CURSO → (Cerrar) → CERRADO

- Asignación MANUAL por Admin/Operario (nunca automática)
- Técnicos trabajan FUERA del sistema, avisan por teléfono/WhatsApp
- Admin/Operario cierra el ticket en el sistema
- Solo se puede editar/eliminar en estado SOLICITADO

## Reglas de Negocio Importantes

- Software SIEMPRE requiere contrato (obligatorio). Hardware → contrato opcional.
- Contratos es módulo INDEPENDIENTE (separado de inventario).
- Hardware y Software son módulos separados en rutas (diferencia con POC que los tenía en tabs).
- Exportación PDF/Excel 100% en frontend con datos ya cargados (jsPDF + SheetJS).
- WebSocket: reconexión con backoff exponencial (1s, 2s, 4s... max 30s).
- Filtros persistentes en URL (queryParams) en todos los listados.
- Validaciones inline post-touched, borde rojo, asterisco en requeridos.
- Badges de color: CRITICA=rojo, ALTA=naranja, MEDIA=azul, BAJA=gris. Estados: SOLICITADO=gris, ASIGNADO=azul, EN_CURSO=amarillo, CERRADO=verde.

## Convenciones de Código

- Responder siempre en español
- Generar código completo y funcional, no pseudocódigo
- Usar signals de Angular donde sea apropiado (Angular 21)
- Nombres de archivos: kebab-case (ej: `ticket-list.component.ts`)
- Prefijo de componentes: `app-`
- SCSS con variables CSS custom del POC
- Responsivo desde 1024px, sidebar colapsable

## Orden de Desarrollo (Etapas)

1. **Cimientos**: environment.ts, interfaces TypeScript, AuthService, JwtInterceptor, Guards, GlobalErrorHandler, LoginComponent
2. **Layout + Shared**: MainLayout, Sidebar dinámico, Header, Breadcrumbs, Toast, ConfirmDialog, LoadingSpinner, StatusBadge, EmptyState
3. **Tickets**: Service + List + Form + Detail + Timeline + Diálogos
4. **Hardware**: Service + List + Form + Detail
5. **Software**: Service + List + Form
6. **Contratos**: Service + List + Form + Detail + RenovarDialog
7. **Juzgados + Usuarios + Auditoría**
8. **Exportación**: ExportService + ExportButton en todos los listados
9. **WebSocket**: WebSocketService + NotificationService + NotificationBell
10. **Dashboard + Pulido final**


## Interfaces TypeScript (mapeo 1:1 de DTOs Java)

### Core

```typescript
// api-response.model.ts
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: { [campo: string]: string };
  timestamp: string;
}

// login.models.ts
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  tipo: string;        // "Bearer"
  usuarioId: number;
  nombreCompleto: string;
  email: string;
  rol: string;         // "Admin" | "Operario" | "Técnico"
}

interface CurrentUser {
  id: number;
  nombreCompleto: string;
  email: string;
  rol: 'Admin' | 'Operario' | 'Técnico';
  token: string;
}

// ws-notification.model.ts
interface WsNotification {
  tipo: string;
  entidad: string;
  registroId: number;
  mensaje: string;
  fecha: string;
}
```

### Tickets

```typescript
// ticket.models.ts
interface TicketRequest {
  titulo: string;               // requerido, max 200
  descripcion: string;          // requerido
  prioridad?: string;           // BAJA | MEDIA | ALTA | CRITICA, default MEDIA
  tipoRequerimiento?: string;   // max 100
  juzgadoId: number;            // requerido
  hardwareId?: number;          // opcional
  referenteNombre?: string;     // max 150
  referenteTelefono?: string;   // max 30
}

interface TicketResponse {
  id: number;
  titulo: string;
  descripcion: string;
  prioridad: string;
  estado: string;
  tipoRequerimiento: string;
  juzgadoId: number;
  juzgadoNombre: string;
  tecnicoId?: number;
  tecnicoNombreCompleto?: string;
  hardwareId?: number;
  hardwareNroInventario?: string;
  hardwareDescripcion?: string;
  referenteNombre?: string;
  referenteTelefono?: string;
  creadoPorId: number;
  creadoPorNombreCompleto: string;
  resolucion?: string;
  fechaCreacion: string;
  fechaAsignacion?: string;
  fechaCierre?: string;
}

interface TicketAsignarRequest {
  tecnicoId: number;            // requerido
}

interface TicketCerrarRequest {
  resolucion: string;           // requerido
}
```

### Hardware

```typescript
// hardware.models.ts
interface HardwareRequest {
  nroInventario: string;        // requerido, max 50, único
  clase: string;                // requerido, max 100 (PC Desktop/Impresora/Scanner/Monitor)
  marca: string;                // requerido, max 100
  modelo: string;               // requerido, max 150
  nroSerie?: string;            // max 100
  ubicacionFisica: string;      // requerido, max 200
  juzgadoId: number;            // requerido
  contratoId?: number;          // opcional
  observaciones?: string;
}

interface HardwareResponse {
  id: number;
  nroInventario: string;
  clase: string;
  marca: string;
  modelo: string;
  nroSerie: string;
  ubicacionFisica: string;
  fechaAlta: string;
  observaciones: string;
  juzgadoId: number;
  juzgadoNombre: string;
  contratoId?: number;
  contratoNombre?: string;
  contratoFechaFin?: string;
  contratoVencido: boolean;
}
```

### Software

```typescript
// software.models.ts
interface SoftwareRequest {
  nombre: string;               // requerido, max 150
  proveedor: string;            // requerido, max 150
  cantidadLicencias: number;    // requerido, min 1
  fechaVencimiento?: string;
  contratoId: number;           // REQUERIDO (software siempre requiere contrato)
  juzgadoId?: number;
  hardwareId?: number;
  observaciones?: string;
}

interface SoftwareResponse {
  id: number;
  nombre: string;
  proveedor: string;
  cantidadLicencias: number;
  licenciasEnUso: number;
  licenciasDisponibles: number;
  fechaVencimiento?: string;
  observaciones: string;
  contratoId: number;
  contratoNombre: string;
  juzgadoId?: number;
  juzgadoNombre?: string;
  hardwareId?: number;
  hardwareNroInventario?: string;
}
```

### Contratos

```typescript
// contrato.models.ts
interface ContratoRequest {
  nombre: string;               // requerido, max 150
  proveedor: string;            // requerido, max 150
  fechaInicio: string;          // requerido
  fechaFin: string;             // requerido
  cobertura?: string;           // max 255
  monto?: number;
  diasAlertaVencimiento?: number; // default 30
  observaciones?: string;
  hardwareIds?: number[];       // multi-select
  softwareIds?: number[];       // multi-select
}

interface ContratoRenovarRequest {
  fechaInicio: string;          // requerido
  fechaFin: string;             // requerido
  monto?: number;
  observaciones?: string;       // max 1000
}

interface ContratoResponse {
  id: number;
  nombre: string;
  proveedor: string;
  fechaInicio: string;
  fechaFin: string;
  cobertura: string;
  monto: number;
  diasAlertaVencimiento: number;
  observaciones: string;
  vencido: boolean;
  proximoAVencer: boolean;
  hardware: HardwareSimple[];
  software: SoftwareSimple[];
}

interface HardwareSimple {
  id: number;
  nroInventario: string;
  clase: string;
  marca: string;
  modelo: string;
}

interface SoftwareSimple {
  id: number;
  nombre: string;
  proveedor: string;
  cantidadLicencias: number;
}
```

### Juzgados y Circunscripciones

```typescript
// juzgado.models.ts
interface JuzgadoRequest {
  nombre: string;               // requerido, max 150
  fuero: string;                // requerido, max 100 (Civil/Penal/Familia/Laboral)
  ciudad: string;               // requerido, max 100
  edificio?: string;            // max 150
  circunscripcionId: number;    // requerido
}

interface JuzgadoResponse {
  id: number;
  nombre: string;
  fuero: string;
  ciudad: string;
  edificio: string;
  circunscripcionId: number;
  circunscripcionNombre: string;
}

// circunscripcion.models.ts
interface CircunscripcionRequest {
  nombre: string;               // requerido, max 100
  distritoJudicial: string;     // requerido, max 100
}

interface CircunscripcionResponse {
  id: number;
  nombre: string;
  distritoJudicial: string;
}
```

### Usuarios y Roles

```typescript
// usuario.models.ts
interface UsuarioRequest {
  nombre: string;               // requerido, max 100
  apellido: string;             // requerido, max 100
  email: string;                // requerido, formato email, max 150
  password?: string;            // requerido al crear, opcional al editar, min 6, max 100
  telefono?: string;            // max 30
  rolId: number;                // requerido
}

interface UsuarioResponse {
  id: number;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  email: string;
  telefono: string;
  activo: boolean;
  fechaAlta: string;
  rolId: number;
  rolNombre: string;
}

// rol.models.ts
interface RolResponse {
  id: number;
  nombre: string;
  descripcion: string;
}
```

### Auditoría

```typescript
// audit-log.models.ts
interface AuditLogResponse {
  id: number;
  entidad: string;
  accion: string;               // CREATE | UPDATE | DELETE | ASSIGN | CLOSE
  registroId: number;
  valorAnterior?: string;       // JSON string
  valorNuevo?: string;          // JSON string
  fecha: string;
  usuarioId?: number;
  usuarioNombreCompleto?: string;
}
```

---

## Mapeo de Endpoints por Servicio

Base URL: `https://localhost:8443/api` (configurable en environment.ts). Todas las respuestas usan `ApiResponse<T>`.

### AuthService
| Método          | HTTP | Endpoint         | Body           | Response        |
|-----------------|------|------------------|----------------|-----------------|
| login(dto)      | POST | /auth/login      | LoginRequest   | LoginResponse   |

### TicketService
| Método              | HTTP   | Endpoint                | Body/Params                                          | Response          |
|---------------------|--------|-------------------------|------------------------------------------------------|-------------------|
| listar(filtros)     | GET    | /tickets                | ?estado=&prioridad=&juzgadoId=&tecnicoId=&q=         | TicketResponse[]  |
| obtenerPorId(id)    | GET    | /tickets/:id            | —                                                    | TicketResponse    |
| crear(dto)          | POST   | /tickets                | TicketRequest                                        | TicketResponse    |
| editar(id, dto)     | PUT    | /tickets/:id            | TicketRequest                                        | TicketResponse    |
| asignar(id, dto)    | PUT    | /tickets/:id/asignar    | TicketAsignarRequest                                 | TicketResponse    |
| reasignar(id, dto)  | PUT    | /tickets/:id/reasignar  | TicketAsignarRequest                                 | TicketResponse    |
| pasarAEnCurso(id)   | PUT    | /tickets/:id/estado     | —                                                    | TicketResponse    |
| cerrar(id, dto)     | PUT    | /tickets/:id/cerrar     | TicketCerrarRequest                                  | TicketResponse    |
| eliminar(id)        | DELETE | /tickets/:id            | —                                                    | void              |

### HardwareService
| Método           | HTTP   | Endpoint         | Body/Params                          | Response           |
|------------------|--------|------------------|--------------------------------------|--------------------|
| listar(filtros)  | GET    | /hardware        | ?juzgadoId=&clase=&q=                | HardwareResponse[] |
| obtenerPorId(id) | GET    | /hardware/:id    | —                                    | HardwareResponse   |
| crear(dto)       | POST   | /hardware        | HardwareRequest                      | HardwareResponse   |
| editar(id, dto)  | PUT    | /hardware/:id    | HardwareRequest                      | HardwareResponse   |
| eliminar(id)     | DELETE | /hardware/:id    | —                                    | void               |

### SoftwareService
| Método           | HTTP   | Endpoint         | Body/Params    | Response           |
|------------------|--------|------------------|----------------|--------------------|
| listar(filtros)  | GET    | /software        | ?q=            | SoftwareResponse[] |
| obtenerPorId(id) | GET    | /software/:id    | —              | SoftwareResponse   |
| crear(dto)       | POST   | /software        | SoftwareRequest| SoftwareResponse   |
| editar(id, dto)  | PUT    | /software/:id    | SoftwareRequest| SoftwareResponse   |
| eliminar(id)     | DELETE | /software/:id    | —              | void               |

### ContratoService
| Método               | HTTP   | Endpoint                      | Body/Params           | Response           |
|----------------------|--------|-------------------------------|-----------------------|--------------------|
| listar()             | GET    | /contratos                    | —                     | ContratoResponse[] |
| obtenerPorId(id)     | GET    | /contratos/:id                | —                     | ContratoResponse   |
| crear(dto)           | POST   | /contratos                    | ContratoRequest       | ContratoResponse   |
| editar(id, dto)      | PUT    | /contratos/:id                | ContratoRequest       | ContratoResponse   |
| eliminar(id)         | DELETE | /contratos/:id                | —                     | void               |
| proximosAVencer()    | GET    | /contratos/proximos-vencer    | —                     | ContratoResponse[] |
| vencidos()           | GET    | /contratos/vencidos           | —                     | ContratoResponse[] |
| renovar(id, dto)     | POST   | /contratos/:id/renovar        | ContratoRenovarRequest| ContratoResponse   |

### JuzgadoService
| Método           | HTTP   | Endpoint         | Body/Params    | Response          |
|------------------|--------|------------------|----------------|-------------------|
| listar()         | GET    | /juzgados        | —              | JuzgadoResponse[] |
| obtenerPorId(id) | GET    | /juzgados/:id    | —              | JuzgadoResponse   |
| crear(dto)       | POST   | /juzgados        | JuzgadoRequest | JuzgadoResponse   |
| editar(id, dto)  | PUT    | /juzgados/:id    | JuzgadoRequest | JuzgadoResponse   |
| eliminar(id)     | DELETE | /juzgados/:id    | —              | void              |

### CircunscripcionService
| Método           | HTTP   | Endpoint              | Body/Params             | Response                 |
|------------------|--------|-----------------------|-------------------------|--------------------------|
| listar()         | GET    | /circunscripciones    | —                       | CircunscripcionResponse[]|
| obtenerPorId(id) | GET    | /circunscripciones/:id| —                       | CircunscripcionResponse  |
| crear(dto)       | POST   | /circunscripciones    | CircunscripcionRequest  | CircunscripcionResponse  |
| editar(id, dto)  | PUT    | /circunscripciones/:id| CircunscripcionRequest  | CircunscripcionResponse  |
| eliminar(id)     | DELETE | /circunscripciones/:id| —                       | void                     |

### UsuarioService
| Método              | HTTP   | Endpoint                    | Body/Params     | Response           |
|---------------------|--------|-----------------------------|-----------------|--------------------|
| listar()            | GET    | /usuarios                   | —               | UsuarioResponse[]  |
| obtenerPorId(id)    | GET    | /usuarios/:id               | —               | UsuarioResponse    |
| crear(dto)          | POST   | /usuarios                   | UsuarioRequest  | UsuarioResponse    |
| editar(id, dto)     | PUT    | /usuarios/:id               | UsuarioRequest  | UsuarioResponse    |
| eliminar(id)        | DELETE | /usuarios/:id               | —               | void               |
| tecnicosActivos()   | GET    | /usuarios/tecnicos-activos  | —               | UsuarioResponse[]  |
| buscar(q)           | GET    | /usuarios/buscar            | ?q=             | UsuarioResponse[]  |
| activar(id)         | PUT    | /usuarios/:id/activar       | —               | UsuarioResponse    |
| desactivar(id)      | PUT    | /usuarios/:id/desactivar    | —               | UsuarioResponse    |

### RolService
| Método   | HTTP | Endpoint | Response       |
|----------|------|----------|----------------|
| listar() | GET  | /roles   | RolResponse[]  |

### AuditLogService (solo lectura, solo Admin)
| Método                              | HTTP | Endpoint   | Params                                    | Response            |
|-------------------------------------|------|------------|-------------------------------------------|---------------------|
| porEntidad(entidad, registroId)     | GET  | /audit     | ?entidad=&registroId=                     | AuditLogResponse[]  |
| porUsuario(usuarioId)               | GET  | /audit     | ?usuarioId=                               | AuditLogResponse[]  |
| porFechas(desde, hasta)             | GET  | /audit     | ?desde=&hasta=                            | AuditLogResponse[]  |
| filtroCompleto(entidad,accion,...)  | GET  | /audit     | ?entidad=&accion=&desde=&hasta=           | AuditLogResponse[]  |

---

## Detalle de Servicios Core

### AuthService
- POST `/api/auth/login` por HTTPS
- Almacena token y datos de usuario en `BehaviorSubject`
- Persiste token en **sessionStorage** (no localStorage) — crítico en entorno judicial con equipos compartidos
- Expone observables: `isAuthenticated$`, `currentUser$`, `currentRole$`
- Métodos: `login()`, `logout()` (limpia sesión + desconecta WebSocket), `hasRole()`, `isTokenExpired()`
- Decodifica payload JWT localmente con `atob()` para extraer rol y expiración

### JwtInterceptor
- Agrega `Authorization: Bearer <token>` a cada request (excepto `/api/auth/login`)
- Respuesta **401**: logout automático + redirige a login con mensaje "Sesión expirada"
- Respuesta **403**: toast de acceso denegado sin cerrar sesión
- **Status 0** (sin conexión): toast "No se puede conectar con el servidor"

### Guards de Ruta
- **authGuard**: verifica autenticación + token no expirado. Redirige a `/login` con `returnUrl`
- **roleGuard(roles[])**: verifica rol del usuario. Redirige a `/dashboard` con toast si no tiene permiso
- **unsavedChangesGuard**: en formularios, si hay cambios dirty → confirm "Tiene cambios sin guardar"

### GlobalErrorHandler
- **400 con errors**: mapea a campos del formulario con `setErrors()`
- **400/409 con message**: toast con el mensaje del backend
- **404**: toast + redirige al listado
- **500**: toast genérico
- **Status 0**: toast de conexión

---

## Especificaciones de Componentes

### LoginComponent (/login)
- Ruta pública, sin layout
- Formulario reactivo: email (requerido + formato), password (requerido + min 6)
- Errores inline post-touched. Botón deshabilitado si inválido o cargando
- Error 401: mensaje visible encima del formulario (no toast)
- Login exitoso: almacenar datos, conectar WebSocket, redirigir a returnUrl o /dashboard
- Si ya autenticado, redirige a /dashboard. Toggle mostrar/ocultar password

### Dashboard Admin/Operario (/dashboard)
- Filtros: rango de fechas (default últimos 30 días), juzgado/circunscripción
- Tarjetas clickeables que navegan a listados filtrados:
  - Tickets Activos → /tickets?estado=SOLICITADO,ASIGNADO,EN_CURSO
  - Tickets Críticos → /tickets?prioridad=CRITICA
  - Solicitados sin asignar → /tickets?estado=SOLICITADO
  - Contratos próximos a vencer → /contratos tab Próximos
  - Contratos vencidos → /contratos tab Vencidos
  - Hardware total → /hardware
  - Licencias disponibles vs total → /software
- Tabla carga de técnicos: Técnico, Tickets asignados, En curso, Total activos. Click → /tickets?tecnicoId=X
- Últimos 5-10 tickets con estado, prioridad y link

### Dashboard Técnico
- Tarjetas: Mis asignados, En curso, Completados hoy
- Recordatorio: "Cuando termines un ticket, avisá a Mesa de Ayuda para que cierren el caso"
- Tabla de sus tickets con badges, datos del referente y link al detalle
- Sin botones de acción. Botón Exportar disponible

### TicketListComponent (/tickets)
- Filtros: Estado, Prioridad, Juzgado, Técnico, Búsqueda libre (debounce 400ms). Persistentes en URL
- Tabla: N°, Título, Estado (badge), Prioridad (badge), Juzgado, Técnico, Fecha, Acciones
- Botón "+ Nuevo Ticket" solo Admin/Operario. Botón Exportar para todos
- Técnico: solo sus tickets, solo Ver detalle

### TicketFormComponent (/tickets/nuevo, /tickets/:id/editar)
- Campos: título (requerido, max 200, contador), descripción (requerido, textarea), prioridad (select, default MEDIA), tipoRequerimiento (select: Hardware/Software/Red/Otro), juzgadoId (requerido, select), hardwareId (opcional, select filtrado por juzgado → muestra nroInventario + marca modelo), referenteNombre (max 150), referenteTelefono (max 30)
- Edición: solo si SOLICITADO. Si cambió estado → mensaje + redirigir
- Validación al blur. Botón deshabilitado si inválido/pristine. Error 409: toast de negocio

### TicketDetailComponent (/tickets/:id)
- Cabecera con título, badges, fecha. Datos completos con links a juzgado y hardware
- Sección técnico, sección resolución (solo si CERRADO)
- Timeline visual cronológico: Creado → Asignado → En Curso → Cerrado
- Botones contextuales por estado (Admin/Operario). Botón "Ver historial" (Admin)

### Ticket Diálogos
- **Asignar**: select técnicos activos con carga. PUT /:id/asignar
- **Reasignar**: excluye técnico actual. PUT /:id/reasignar
- **Cerrar**: textarea resolución obligatoria. PUT /:id/cerrar
- **Eliminar**: confirm soft-delete. Solo SOLICITADO sin técnico. DELETE /:id

### Hardware List/Form
- Filtros: Juzgado, Clase (PC/Impresora/Scanner/Monitor), modelo, ubicación
- Tabla: Nro. Inventario, Clase, Marca/Modelo, Serie, Juzgado, Ubicación, Contrato (badge vigente/vencido/sin). Exportar
- Form: nroInventario (único), clase, marca, modelo, nroSerie, ubicacionFisica, juzgadoId, contratoId (select con nombre+proveedor+fecha), observaciones

### Software List/Form
- Tabla: Nombre, Proveedor, Licencias (uso/total), Disponibles, Vencimiento, Contrato, Juzgado. Barra progreso licencias. Exportar
- Form: nombre, proveedor, cantidadLicencias (min 1), fechaVencimiento, contratoId (requerido, activo), juzgadoId, hardwareId, observaciones

### Contratos List/Form/Detail
- Tabs: Todos, Activos, Próximos a vencer, Vencidos. Exportar
- Tabla: Nombre, Proveedor, Fechas, Cobertura, Monto, Estado (badge)
- Form: validación cruzada fechas + multi-select hardware/software
- Detalle: datos + listas hardware/software asociados
- RenovarDialog: nuevas fechas (precarga sugeridas), monto opcional, observaciones. Solo para vencidos/próximos

### Juzgados y Circunscripciones
- Estructura jerárquica: Circunscripción > Juzgados. Vista expandible o tabs
- JuzgadoForm: nombre, fuero (Civil/Penal/Familia/Laboral), ciudad, edificio, circunscripcionId. Botón rápido crear circunscripción
- CircunscripcionForm: nombre, distritoJudicial

### Usuarios List/Form
- Tabla: Nombre, Email, Teléfono, Rol (badge), Estado (badge), Fecha alta. Búsqueda debounce. Filtro rol/estado. Exportar
- Form: nombre, apellido, email, password (requerido crear, opcional editar: "Dejar en blanco para no cambiar"), telefono, rolId
- Activar (confirm simple), Desactivar (warn si tickets activos → 409), Eliminar (soft-delete, confirm doble)
- Admin: CRUD completo. Operario: solo lectura

### Auditoría List/Detail (Solo Admin)
- Filtros: rango fechas, entidad, acción (CREATE/UPDATE/DELETE/CLOSE). Exportar
- Tabla: Fecha, Usuario, Entidad, Acción, ID Registro (link a entidad), Ver Detalle
- Detalle: modal con valorAnterior y valorNuevo en JSON pretty-printed, resaltando diferencias

---

## Patrones UX Transversales

### Toasts
- Esquina superior derecha, apilables
- Tipos: Éxito (verde), Error (rojo), Advertencia (amarillo), Info (azul)
- Auto-cierre: 4s (éxito/info), 8s (error/warn). Botón X. Mensajes del ApiResponse.message

### Confirmaciones
- Toda eliminación/cambio irreversible: dialog con título, impacto, Cancelar + Confirmar (rojo/amarillo)
- Delay 1s o loading en Confirmar para prevenir doble-click

### Estados de Carga
- Skeleton/spinner en tablas. Spinner en botones submit
- Empty state con icono y mensaje. Error state con Reintentar

### Navegación
- Breadcrumb dinámico (Inicio > Módulo > Acción). routerLink siempre
- Botón Volver en forms/detalles

### Formularios
- Reactive Forms siempre. Errores inline post-touched. Borde rojo si inválido. Asterisco en requeridos
- Selects dependientes (juzgado → hardware). unsavedChangesGuard
- Submit: mark all touched + scroll al primer error

### Tablas
- Badges consistentes:
  - Prioridad: CRITICA=rojo, ALTA=naranja, MEDIA=azul, BAJA=gris
  - Estado: SOLICITADO=gris, ASIGNADO=azul, EN_CURSO=amarillo, CERRADO=verde
- Filtros persistentes en URL. Exportar en todas. Paginación frontend si necesario

### Responsividad
- Desde 1024px. Sidebar colapsable. Scroll horizontal en tablas. Grid responsivo en forms

---

## Edge Cases y Manejo de Errores

### Sesión
| Escenario | Comportamiento |
|-----------|---------------|
| Token expirado (8h) | Interceptor → 401 → logout + desconexión WS → login con "Sesión expirada" |
| Usuario desactivado/eliminado con sesión | Siguiente request → 401 → logout automático |
| Logout en una pestaña | Evento storage cierra sesión en todas las pestañas |
| URL protegida sin auth | authGuard → /login con returnUrl |
| URL sin permiso de rol | roleGuard → /dashboard con toast |

### Concurrencia
| Escenario | Comportamiento |
|-----------|---------------|
| Dos operarios asignan mismo ticket | Primero OK, segundo 409. Toast + recargar. WS avisa |
| Editar ticket ya cerrado por otro | 409 "Estado cambió". Recargar |
| Eliminar juzgado con dependencias | 409 con mensaje descriptivo. Toast |
| Desactivar técnico con tickets activos | 409 "Reasigne tickets primero". Toast |

### Red y Servidor
| Escenario | Comportamiento |
|-----------|---------------|
| Backend caído (status 0) | Toast conexión. WS reconecta con backoff |
| Error 500 | Toast genérico. Log en consola |
| Timeout 30s | Toast "Solicitud tardó demasiado" |

### Formularios
| Escenario | Comportamiento |
|-----------|---------------|
| Duplicado (email, nroInventario) | 409 del backend. Error en el campo |
| Fecha fin < inicio | Validación cruzada frontend. No envía request |
| Submit con vacíos | Mark all touched + scroll primer error |
| Navegar con cambios sin guardar | unsavedChangesGuard: "Tiene cambios sin guardar" |

### WebSocket
| Escenario | Comportamiento |
|-----------|---------------|
| Conexión WS perdida | Backoff exponencial (1s...30s). Indicador sutil |
| Navegador sin WS | SockJS fallback (long-polling). Transparente |
| Notificación con pestaña inactiva | Badge campana se actualiza. Disponible al volver |

---

## Exportación de Datos (PDF / Excel)

- Dropdown: "Descargar como PDF" / "Descargar como Excel (.xlsx)"
- Exporta solo datos con filtros activos aplicados
- Encabezado: título módulo, fecha/hora, filtros aplicados, tabla de datos
- Nombre archivo: [modulo]_[fecha].[ext] (ej: tickets_2026-03-09.pdf)
- **PDF**: encabezado institucional, título, filtros como subtítulo, tabla formateada, pie con fecha (jsPDF + autotable)
- **Excel**: hoja nombrada, encabezados en negrita, columnas auto-ajustadas, formatos de fecha (SheetJS)

### Columnas por módulo
| Módulo | Roles | Columnas |
|--------|-------|----------|
| Tickets | Admin, Operario, Técnico | N°, Título, Estado, Prioridad, Juzgado, Técnico, Fechas |
| Hardware | Admin, Operario | Inventario, Clase, Marca, Modelo, Serie, Juzgado, Ubicación, Contrato |
| Software | Admin, Operario | Nombre, Proveedor, Licencias, Vencimiento, Contrato, Juzgado |
| Contratos | Admin, Operario | Nombre, Proveedor, Fechas, Cobertura, Monto, Estado |
| Juzgados | Admin, Operario | Nombre, Fuero, Ciudad, Edificio, Circunscripción |
| Usuarios | Admin, Operario | Nombre, Email, Teléfono, Rol, Estado, Fecha alta |
| Auditoría | Admin | Fecha, Usuario, Entidad, Acción, ID Registro |

---

## WebSocket — Eventos

| Evento | Destinatario | Canal | Mensaje ejemplo |
|--------|-------------|-------|-----------------|
| Ticket asignado | Técnico asignado | /queue | "Se te asignó ticket #N: [título]" |
| Ticket reasignado | Nuevo + anterior técnico | /queue | "Se te asignó/retiró ticket #N" |
| Ticket en curso | Admin/Operarios | /topic | "Ticket #N pasó a EN_CURSO" |
| Ticket cerrado | Admin/Op + Técnico | /topic + /queue | "Ticket #N cerrado" |
| Contrato vencido | Admin/Operarios | /topic | "Contrato [nombre] ha vencido" |
| Contrato próximo | Admin/Operarios | /topic | "Contrato [nombre] vence en X días" |
| Modificación concurrente | Usuarios viendo entidad | /topic | "Ticket #N modificado por otro usuario" |

### WebSocketService
- Conecta a `wss://localhost:8443/ws` post-login con JWT en handshake
- Suscribe a `/topic/notificaciones` y `/user/queue/notificaciones`
- Observable `notifications$`. Reconexión con backoff exponencial (1s, 2s, 4s... max 30s)
- Desconexión limpia al logout

### NotificationBellComponent (Header)
- Campana con badge rojo (no leídas). Dropdown con últimas 10-15 notificaciones
- Cada una con link a la entidad. Botón "Marcar todas como leídas"

---

## Máquina de Estados de Tickets (referencia rápida)

| Estado Actual | Acción | Siguiente | Endpoint |
|---------------|--------|-----------|----------|
| SOLICITADO | Asignar | ASIGNADO | PUT /:id/asignar |
| SOLICITADO | Editar | SOLICITADO | PUT /:id |
| SOLICITADO | Eliminar | (soft-delete) | DELETE /:id |
| ASIGNADO | Reasignar | ASIGNADO | PUT /:id/reasignar |
| ASIGNADO | En Curso | EN_CURSO | PUT /:id/estado |
| ASIGNADO | Cerrar | CERRADO | PUT /:id/cerrar |
| EN_CURSO | Reasignar | EN_CURSO | PUT /:id/reasignar |
| EN_CURSO | Cerrar | CERRADO | PUT /:id/cerrar |
| CERRADO | Ninguna | — | — |
