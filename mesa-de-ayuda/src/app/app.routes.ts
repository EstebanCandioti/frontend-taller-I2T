import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { unsavedChangesGuard } from './core/guards/unsaved-changes.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard-router.component').then(m => m.DashboardRouterComponent)
      },
      // Tickets
      {
        path: 'tickets',
        loadComponent: () => import('./features/tickets/ticket-list.component').then(m => m.TicketListComponent)
      },
      {
        path: 'tickets/nuevo',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('./features/tickets/ticket-form.component').then(m => m.TicketFormComponent)
      },
      {
        path: 'tickets/:id',
        loadComponent: () => import('./features/tickets/ticket-detail.component').then(m => m.TicketDetailComponent)
      },
      {
        path: 'tickets/:id/editar',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('./features/tickets/ticket-form.component').then(m => m.TicketFormComponent)
      },
      // Hardware (Admin + Operario)
      {
        path: 'hardware',
        canActivate: [roleGuard('Admin', 'Operario')],
        loadComponent: () => import('./features/hardware/hardware-list.component').then(m => m.HardwareListComponent)
      },
      {
        path: 'hardware/nuevo',
        canActivate: [roleGuard('Admin', 'Operario')],
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('./features/hardware/hardware-form.component').then(m => m.HardwareFormComponent)
      },
      {
        path: 'hardware/:id',
        canActivate: [roleGuard('Admin', 'Operario')],
        loadComponent: () => import('./features/hardware/hardware-detail.component').then(m => m.HardwareDetailComponent)
      },
      {
        path: 'hardware/:id/editar',
        canActivate: [roleGuard('Admin', 'Operario')],
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('./features/hardware/hardware-form.component').then(m => m.HardwareFormComponent)
      },
// Software (Admin + Operario)
      {
        path: 'software',
        canActivate: [roleGuard('Admin', 'Operario')],
        loadComponent: () => import('./features/software/software-list.component').then(m => m.SoftwareListComponent)
      },
      {
        path: 'software/nuevo',
        canActivate: [roleGuard('Admin', 'Operario')],
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('./features/software/software-form.component').then(m => m.SoftwareFormComponent)
      },
      {
        path: 'software/:id',
        canActivate: [roleGuard('Admin', 'Operario')],
        loadComponent: () => import('./features/software/software-detail.component').then(m => m.SoftwareDetailComponent)
      },
      {
        path: 'software/:id/editar',
        canActivate: [roleGuard('Admin', 'Operario')],
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('./features/software/software-form.component').then(m => m.SoftwareFormComponent)
      },
// Contratos (Admin + Operario)
      {
        path: 'contratos',
        canActivate: [roleGuard('Admin', 'Operario')],
        loadComponent: () => import('./features/contratos/contrato-list.component').then(m => m.ContratoListComponent)
      },
      {
        path: 'contratos/nuevo',
        canActivate: [roleGuard('Admin', 'Operario')],
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('./features/contratos/contrato-form.component').then(m => m.ContratoFormComponent)
      },
      {
        path: 'contratos/:id',
        canActivate: [roleGuard('Admin', 'Operario')],
        loadComponent: () => import('./features/contratos/contrato-detail.component').then(m => m.ContratoDetailComponent)
      },
      {
        path: 'contratos/:id/editar',
        canActivate: [roleGuard('Admin', 'Operario')],
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('./features/contratos/contrato-form.component').then(m => m.ContratoFormComponent)
      },
// Juzgados (Admin + Operario)
      {
        path: 'juzgados',
        canActivate: [roleGuard('Admin', 'Operario')],
        loadComponent: () => import('./features/juzgados/juzgado-list.component').then(m => m.JuzgadoListComponent)
      },
      {
        path: 'juzgados/nuevo',
        canActivate: [roleGuard('Admin', 'Operario')],
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('./features/juzgados/juzgado-form.component').then(m => m.JuzgadoFormComponent)
      },
      {
        path: 'juzgados/:id/editar',
        canActivate: [roleGuard('Admin', 'Operario')],
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('./features/juzgados/juzgado-form.component').then(m => m.JuzgadoFormComponent)
      },
      {
        path: 'juzgados/circunscripciones/nueva',
        canActivate: [roleGuard('Admin', 'Operario')],
        loadComponent: () => import('./features/juzgados/circunscripcion-form.component').then(m => m.CircunscripcionFormComponent)
      },
      {
        path: 'juzgados/circunscripciones/:id/editar',
        canActivate: [roleGuard('Admin', 'Operario')],
        loadComponent: () => import('./features/juzgados/circunscripcion-form.component').then(m => m.CircunscripcionFormComponent)
      },
// Usuarios (Solo Admin)
      {
        path: 'usuarios',
        canActivate: [roleGuard('Admin')],
        loadComponent: () => import('./features/usuarios/usuario-list.component').then(m => m.UsuarioListComponent)
      },
      {
        path: 'usuarios/nuevo',
        canActivate: [roleGuard('Admin')],
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('./features/usuarios/usuario-form.component').then(m => m.UsuarioFormComponent)
      },
      {
        path: 'usuarios/:id/editar',
        canActivate: [roleGuard('Admin')],
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('./features/usuarios/usuario-form.component').then(m => m.UsuarioFormComponent)
      },
// Auditoria (Solo Admin)
      {
        path: 'auditoria',
        canActivate: [roleGuard('Admin')],
        loadComponent: () => import('./features/auditoria/auditoria-list.component').then(m => m.AuditoriaListComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
