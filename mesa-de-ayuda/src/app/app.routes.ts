import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
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
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      // Tickets
      {
        path: 'tickets',
        loadComponent: () => import('./features/tickets/ticket-list.component').then(m => m.TicketListComponent)
      },
      {
        path: 'tickets/nuevo',
        loadComponent: () => import('./features/tickets/ticket-form.component').then(m => m.TicketFormComponent)
      },
      {
        path: 'tickets/:id',
        loadComponent: () => import('./features/tickets/ticket-detail.component').then(m => m.TicketDetailComponent)
      },
      {
        path: 'tickets/:id/editar',
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
        loadComponent: () => import('./features/software/software-form.component').then(m => m.SoftwareFormComponent)
      },
      {
        path: 'software/:id/editar',
        canActivate: [roleGuard('Admin', 'Operario')],
        loadComponent: () => import('./features/software/software-form.component').then(m => m.SoftwareFormComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
