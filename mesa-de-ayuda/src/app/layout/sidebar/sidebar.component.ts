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

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard', roles: ['Admin', 'Operario', 'Técnico'] },
    { label: 'Tickets', icon: 'confirmation_number', route: '/tickets', roles: ['Admin', 'Operario', 'Técnico'] },
    { label: 'Hardware', icon: 'computer', route: '/hardware', roles: ['Admin', 'Operario'] },
    { label: 'Software', icon: 'apps', route: '/software', roles: ['Admin', 'Operario'] },
    { label: 'Contratos', icon: 'description', route: '/contratos', roles: ['Admin', 'Operario'] },
    { label: 'Juzgados', icon: 'account_balance', route: '/juzgados', roles: ['Admin', 'Operario'] },
    { label: 'Usuarios', icon: 'people', route: '/usuarios', roles: ['Admin'] },
    { label: 'Auditoría', icon: 'history', route: '/auditoria', roles: ['Admin'] },
  ];

  toggleCollapse(): void {
    this.collapsedChange.emit(!this.collapsed());
  }

  isVisible(item: NavItem, role: string | null): boolean {
    return role !== null && item.roles.includes(role as Rol);
  }
}
