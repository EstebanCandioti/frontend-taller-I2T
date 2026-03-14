import { Component, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { Rol } from '../../core/models/auth.model';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles: Rol[];
  section: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AsyncPipe],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  private readonly auth = inject(AuthService);

  collapsed = input(false);
  collapsedChange = output<boolean>();

  readonly currentRole$ = this.auth.currentRole$;

  readonly navSections: NavSection[] = [
    {
      title: 'Home',
      items: [
        { label: 'Dashboard', icon: 'dashboard', route: '/dashboard', roles: ['Admin', 'Operario', 'Tecnico'], section: 'Home' },
      ]
    },
    {
      title: 'Tickets',
      items: [
        { label: 'Tickets', icon: 'confirmation_number', route: '/tickets', roles: ['Admin', 'Operario', 'Tecnico'], section: 'Tickets' },
      ]
    },
    {
      title: 'Inventario',
      items: [
        { label: 'Hardware', icon: 'computer', route: '/hardware', roles: ['Admin', 'Operario'], section: 'Inventario' },
        { label: 'Software', icon: 'apps', route: '/software', roles: ['Admin', 'Operario'], section: 'Inventario' },
      ]
    },
    {
      title: 'Administrar',
      items: [
        { label: 'Contratos', icon: 'description', route: '/contratos', roles: ['Admin', 'Operario'], section: 'Administrar' },
        { label: 'Juzgados', icon: 'account_balance', route: '/juzgados', roles: ['Admin', 'Operario'], section: 'Administrar' },
        { label: 'Usuarios', icon: 'people', route: '/usuarios', roles: ['Admin'], section: 'Administrar' },
      ]
    },
    {
      title: 'Historial',
      items: [
        { label: 'Auditoria', icon: 'history', route: '/auditoria', roles: ['Admin'], section: 'Historial' },
      ]
    },
  ];

  toggleCollapse(): void {
    this.collapsedChange.emit(!this.collapsed());
  }

  hasVisibleItems(section: NavSection, role: string | null): boolean {
    return section.items.some(item => this.isVisible(item, role));
  }

  isVisible(item: NavItem, role: string | null): boolean {
    return role !== null && item.roles.includes(role as Rol);
  }
}
