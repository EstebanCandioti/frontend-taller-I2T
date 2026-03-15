import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { filter, map, combineLatest, startWith } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';

interface Breadcrumb {
  label: string;
  route?: string;
  dynamic?: boolean;
}

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  tickets: 'Tickets',
  hardware: 'Hardware',
  software: 'Software',
  contratos: 'Contratos',
  juzgados: 'Juzgados',
  usuarios: 'Usuarios',
  auditoria: 'Auditoria',
  nuevo: 'Nuevo',
  editar: 'Editar',
  circunscripciones: 'Circunscripciones',
  nueva: 'Nueva',
};

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, AsyncPipe, NotificationBellComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly breadcrumbService = inject(BreadcrumbService);

  readonly currentUser$ = this.auth.currentUser$;

  private readonly navigation$ = this.router.events.pipe(
    filter(e => e instanceof NavigationEnd),
    map((e) => this.buildBreadcrumbs((e as NavigationEnd).urlAfterRedirects))
  );

  readonly breadcrumbs$ = combineLatest([
    this.navigation$,
    this.breadcrumbService.label$.pipe(startWith(''))
  ]).pipe(
    map(([crumbs, dynamicLabel]) => {
      if (!dynamicLabel) return crumbs;
      return crumbs.map(c =>
        c.dynamic ? { ...c, label: dynamicLabel } : c
      );
    })
  );

  logout(): void {
    this.auth.logout();
  }

  private buildBreadcrumbs(url: string): Breadcrumb[] {
    const segments = url.split('?')[0].split('/').filter(Boolean);
    const crumbs: Breadcrumb[] = [{ label: 'Inicio', route: '/dashboard' }];

    let path = '';
    for (const segment of segments) {
      path += `/${segment}`;
      const isNumeric = /^\d+$/.test(segment);
      if (isNumeric) {
        crumbs.push({ label: 'Detalle', route: path, dynamic: true });
      } else {
        const label = ROUTE_LABELS[segment] || segment;
        crumbs.push({ label, route: path });
      }
    }

    // Last breadcrumb has no link
    if (crumbs.length > 1) {
      crumbs[crumbs.length - 1].route = undefined;
    }

    return crumbs;
  }
}
