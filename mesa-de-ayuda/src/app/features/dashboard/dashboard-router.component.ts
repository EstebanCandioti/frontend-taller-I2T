import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { DashboardComponent } from './dashboard.component';
import { DashboardTecnicoComponent } from './dashboard-tecnico.component';

@Component({
  selector: 'app-dashboard-router',
  standalone: true,
  imports: [DashboardComponent, DashboardTecnicoComponent],
  template: `
    @if (isTecnico) {
      <app-dashboard-tecnico />
    } @else {
      <app-dashboard />
    }
  `
})
export class DashboardRouterComponent {
  private readonly auth = inject(AuthService);
  readonly isTecnico = this.auth.currentUser?.rol === 'Tecnico';
}
