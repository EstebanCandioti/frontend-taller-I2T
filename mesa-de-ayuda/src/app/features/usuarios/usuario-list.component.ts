import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

import { UsuarioService } from '../../core/services/usuario.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmDialogService } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { UsuarioResponse } from '../../core/models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ExportButtonComponent } from '../../shared/components/export-button/export-button.component';
import { ExportColumn } from '../../core/services/export.service';

@Component({
  selector: 'app-usuario-list',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, LoadingSpinnerComponent, EmptyStateComponent, ExportButtonComponent],
  templateUrl: './usuario-list.component.html',
  styleUrl: './usuario-list.component.scss'
})
export class UsuarioListComponent implements OnInit {
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly usuarioService = inject(UsuarioService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly destroyRef = inject(DestroyRef);

  readonly usuarios = signal<UsuarioResponse[]>([]);
  readonly filteredUsuarios = signal<UsuarioResponse[]>([]);
  readonly loading = signal(true);

  filtroRol = '';
  filtroEstado = '';
  filtroBusqueda = '';

  readonly exportColumns: ExportColumn[] = [
    { header: 'Nombre', field: 'nombreCompleto' },
    { header: 'Email', field: 'email' },
    { header: 'Telefono', field: 'telefono', format: (v) => v || '—' },
    { header: 'Rol', field: 'rolNombre' },
    { header: 'Estado', field: 'activo', format: (v) => v ? 'Activo' : 'Inactivo' },
    { header: 'Fecha Alta', field: 'fechaAlta', format: (v) => v ? new Date(v).toLocaleDateString('es-AR') : '—' },
  ];

  readonly roles = ['Admin', 'Operario', 'Tecnico'];
  readonly estados = [
    { value: 'activo', label: 'Activo' },
    { value: 'inactivo', label: 'Inactivo' }
  ];

  private readonly searchSubject = new Subject<string>();

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;
    if (params['rol']) this.filtroRol = params['rol'];
    if (params['estado']) this.filtroEstado = params['estado'];
    if (params['q']) this.filtroBusqueda = params['q'];

    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.aplicarFiltros());

    this.cargarDatos();
  }

  onSearchInput(): void {
    this.searchSubject.next(this.filtroBusqueda);
  }

  onFiltroChange(): void {
    this.aplicarFiltros();
  }

  limpiarFiltros(): void {
    this.filtroRol = '';
    this.filtroEstado = '';
    this.filtroBusqueda = '';
    this.aplicarFiltros();
  }

  cargarDatos(): void {
    this.loading.set(true);

    this.usuarioService.listar().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: data => {
        this.usuarios.set(data);
        this.aplicarFiltros();
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  private aplicarFiltros(): void {
    let resultado = this.usuarios();

    if (this.filtroRol) {
      resultado = resultado.filter(u => u.rolNombre === this.filtroRol);
    }

    if (this.filtroEstado) {
      const esActivo = this.filtroEstado === 'activo';
      resultado = resultado.filter(u => u.activo === esActivo);
    }

    if (this.filtroBusqueda.trim()) {
      const q = this.filtroBusqueda.trim().toLowerCase();
      resultado = resultado.filter(u =>
        u.nombreCompleto.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.telefono && u.telefono.toLowerCase().includes(q))
      );
    }

    this.filteredUsuarios.set(resultado);

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        rol: this.filtroRol || null,
        estado: this.filtroEstado || null,
        q: this.filtroBusqueda.trim() || null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  async onActivar(usuario: UsuarioResponse): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Activar Usuario',
      message: `¿Activar al usuario "${usuario.nombreCompleto}"?`,
      confirmText: 'Activar',
      type: 'warning'
    });

    if (!confirmed) return;

    this.usuarioService.activar(usuario.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.toast.success('Usuario activado correctamente.');
        this.cargarDatos();
      }
    });
  }

  async onDesactivar(usuario: UsuarioResponse): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Desactivar Usuario',
      message: `¿Desactivar al usuario "${usuario.nombreCompleto}"? Si tiene tickets activos asignados, debera reasignarlos primero.`,
      confirmText: 'Desactivar',
      type: 'warning'
    });

    if (!confirmed) return;

    this.usuarioService.desactivar(usuario.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.toast.success('Usuario desactivado correctamente.');
        this.cargarDatos();
      }
    });
  }

  async onEliminar(usuario: UsuarioResponse): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Eliminar Usuario',
      message: `¿Eliminar al usuario "${usuario.nombreCompleto}"? Esta accion no se puede deshacer.`,
      confirmText: 'Eliminar',
      type: 'danger'
    });

    if (!confirmed) return;

    this.usuarioService.eliminar(usuario.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.toast.success('Usuario eliminado correctamente.');
        this.cargarDatos();
      }
    });
  }

  getRolClass(rol: string): string {
    switch (rol) {
      case 'Admin': return 'rol-admin';
      case 'Operario': return 'rol-operario';
      case 'Tecnico': return 'rol-tecnico';
      default: return '';
    }
  }

  get hayFiltrosActivos(): boolean {
    return !!(this.filtroRol || this.filtroEstado || this.filtroBusqueda.trim());
  }
}
