# Mesa de Ayuda IT — Poder Judicial Provincial

Sistema web de gestión de tickets de soporte técnico (Help Desk) para el Poder Judicial Provincial. SPA desarrollada en Angular 21 como parte del Taller de Certificación en Desarrollo Asistido por IA — Campus 2026.

> **Repositorio del backend:** [SpringBoot — Mesa de Ayuda](https://github.com/EstebanCandioti/backend-taller-i2t)

---

## Descripción

El sistema permite gestionar el ciclo de vida completo de incidentes IT dentro de la estructura judicial: desde la creación de un ticket por un operario hasta su resolución y cierre. Incluye inventario de hardware y software, gestión de contratos con proveedores, organización territorial por juzgados y circunscripciones, administración de usuarios con roles diferenciados, y notificaciones en tiempo real.

---

## Stack Tecnológico

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Angular | 21.2.0 | Framework principal (standalone components) |
| TypeScript | 5.9.2 | Lenguaje |
| SCSS | — | Estilos custom (sin Angular Material) |
| RxJS | 7.8.0 | Reactividad y streams |
| SockJS + STOMP.js | 1.6.1 / 7.3.0 | Notificaciones WebSocket en tiempo real |
| jsPDF + AutoTable | 4.2.0 / 5.0.7 | Exportación a PDF |
| SheetJS (xlsx) | 0.18.5 | Exportación a Excel |
| Vitest | 4.0.8 | Testing |
| Angular CLI + Vite | 21.2.1 | Build |

---

## Funcionalidades

### Módulos
- **Tickets** — Gestión completa con máquina de estados (SOLICITADO → ASIGNADO → EN_CURSO → CERRADO)
- **Hardware** — Inventario de activos físicos con número de inventario único
- **Software** — Control de licencias con contador de uso en tiempo real
- **Contratos** — Gestión de contratos con proveedores, alertas de vencimiento y renovación
- **Juzgados y Circunscripciones** — Organización territorial judicial
- **Usuarios** — Administración con 3 roles diferenciados
- **Auditoría** — Historial inmutable de todas las acciones del sistema
- **Dashboard** — Métricas globales (Admin/Operario) o personales (Técnico)

### Características Técnicas
- **Autenticación JWT** con almacenamiento en `sessionStorage` (equipos compartidos en entorno judicial)
- **3 roles con permisos diferenciados:** Admin, Operario, Técnico
- **Guards de ruta:** `authGuard`, `roleGuard`, `unsavedChangesGuard`
- **Interceptor JWT** con manejo centralizado de errores HTTP (401, 403, 0)
- **Notificaciones WebSocket** (STOMP sobre SockJS) con reconexión automática
- **Exportación PDF/Excel** desde el frontend con filtros aplicados
- **Lazy loading** en todos los módulos de features
- **Standalone components** en todo el proyecto (sin NgModules)
- **Reactive Forms** con validaciones inline y manejo de errores del backend

---

## Arquitectura

```
src/app/
├── core/           # Servicios eager-loaded: Auth, JWT, Guards, WebSocket, Export
├── shared/         # Componentes reutilizables: Toast, ConfirmDialog, StatusBadge, etc.
├── layout/         # Estructura visual: Sidebar dinámico, Header, NotificationBell
└── features/       # Módulos lazy-loaded por ruta
    ├── auth/           # Login
    ├── dashboard/      # Global (Admin/Operario) + Personal (Técnico)
    ├── tickets/        # CRUD + diálogos de acción
    ├── hardware/       # CRUD + detalle
    ├── software/       # CRUD
    ├── contratos/      # CRUD + renovación
    ├── juzgados/       # CRUD juzgados + circunscripciones
    ├── usuarios/       # CRUD + activar/desactivar
    └── auditoria/      # Solo lectura, solo Admin
```

### Permisos por Rol

| Módulo | Admin | Operario | Técnico |
|--------|-------|----------|---------|
| Dashboard | Global interactivo | Global interactivo | Solo sus tickets |
| Tickets | CRUD + Asignar/Cerrar | CRUD + Asignar/Cerrar | Solo lectura |
| Hardware / Software | CRUD + Exportar | CRUD + Exportar | Sin acceso |
| Contratos | CRUD + Renovar | CRUD + Renovar | Sin acceso |
| Juzgados | CRUD | CRUD | Sin acceso |
| Usuarios | CRUD completo | Solo lectura | Sin acceso |
| Auditoría | Lectura + Exportar | Sin acceso | Sin acceso |

---

## Instalación y Ejecución

### Prerrequisitos
- Node.js 20+
- npm 10+
- Backend corriendo en `localhost:8080` (ver [repositorio backend](https://github.com/EstebanCandioti/backend-taller-i2t))

### Desarrollo local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo (localhost:4200)
npm start

# Ejecutar tests
npm test

# Build de producción
npm run build
```

### Con Docker (recomendado)

La forma más simple de levantar el proyecto completo (frontend + backend + base de datos) es usando Docker Compose. Ver las instrucciones en el [repositorio principal](https://github.com/EstebanCandioti/backend-taller-i2t).

---

## Usuarios de Prueba

| Rol | Email | Password |
|-----|-------|----------|
| Admin | admin@judicial.gob.ar | Admin123! |
| Operario | operario@judicial.gob.ar | Operario123! |
| Técnico | tecnico@judicial.gob.ar | Tecnico123! |

---

## Contexto del Proyecto

Este sistema fue desarrollado como proyecto integrador del **Taller de Certificación en Desarrollo Asistido por IA — Campus 2026**, abarcando 3 fases:

| Fase | Descripción |
|------|-------------|
| Fase 1 | Base de datos MySQL normalizada con soft-delete universal |
| Fase 2 | API REST con Spring Boot 3 + JWT + AOP + WebSocket + Jobs |
| Fase 3 | SPA Angular 21 (este repositorio) |

---

## Autor

**Esteban Candioti**
