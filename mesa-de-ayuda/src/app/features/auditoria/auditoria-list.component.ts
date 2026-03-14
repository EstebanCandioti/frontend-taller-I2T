import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuditLogService } from '../../core/services/audit-log.service';
import { AuditLogResponse } from '../../core/models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ExportButtonComponent } from '../../shared/components/export-button/export-button.component';
import { ExportColumn } from '../../core/services/export.service';

@Component({
  selector: 'app-auditoria-list',
  standalone: true,
  imports: [FormsModule, DatePipe, LoadingSpinnerComponent, EmptyStateComponent, ExportButtonComponent],
  templateUrl: './auditoria-list.component.html',
  styleUrl: './auditoria-list.component.scss'
})
export class AuditoriaListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly auditService = inject(AuditLogService);
  private readonly destroyRef = inject(DestroyRef);

  readonly registros = signal<AuditLogResponse[]>([]);
  readonly loading = signal(true);

  // Detalle modal
  readonly detalleVisible = signal(false);
  readonly detalleItem = signal<AuditLogResponse | null>(null);

  // Paginacion
  currentPage = 0;
  pageSize = 20;
  totalElements = 0;
  totalPages = 0;

  // Filtros
  filtroEntidad = '';
  filtroAccion = '';
  filtroDesde = '';
  filtroHasta = '';

  readonly exportColumns: ExportColumn[] = [
    { header: 'Fecha', field: 'fecha', format: (v) => v ? new Date(v).toLocaleString('es-AR') : '—' },
    { header: 'Usuario', field: 'usuarioNombreCompleto', format: (v) => v || '—' },
    { header: 'Entidad', field: 'entidad' },
    { header: 'Accion', field: 'accion' },
    { header: 'ID Entidad Afectada', field: 'registroId' },
  ];

  readonly entidades = ['TICKET', 'HARDWARE', 'SOFTWARE', 'CONTRATO', 'JUZGADO', 'CIRCUNSCRIPCION', 'USUARIO'];
  readonly acciones = ['CREATE', 'UPDATE', 'DELETE', 'ASSIGN', 'CLOSE'];
  readonly Math = Math;

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;
    if (params['entidad']) this.filtroEntidad = params['entidad'];
    if (params['accion']) this.filtroAccion = params['accion'];
    if (params['desde']) this.filtroDesde = params['desde'];
    if (params['hasta']) this.filtroHasta = params['hasta'];

    this.cargarDatos();
  }

  onFiltroChange(): void {
    this.aplicarFiltros();
  }

  limpiarFiltros(): void {
    this.filtroEntidad = '';
    this.filtroAccion = '';
    this.filtroDesde = '';
    this.filtroHasta = '';
    this.aplicarFiltros();
  }

  irAPagina(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.cargarDatos(page);
    }
  }

  cargarDatos(page = 0): void {
    this.loading.set(true);

    const filtros: any = {};
    if (this.filtroEntidad) filtros.entidad = this.filtroEntidad;
    if (this.filtroAccion) filtros.accion = this.filtroAccion;
    if (this.filtroDesde) filtros.desde = this.filtroDesde;
    if (this.filtroHasta) filtros.hasta = this.filtroHasta;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        entidad: this.filtroEntidad || null,
        accion: this.filtroAccion || null,
        desde: this.filtroDesde || null,
        hasta: this.filtroHasta || null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });

    this.auditService.listar(filtros, page, this.pageSize).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: pagina => {
        this.registros.set(pagina.content);
        this.totalElements = pagina.totalElements;
        this.totalPages = pagina.totalPages;
        this.currentPage = pagina.currentPage;
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  verDetalle(item: AuditLogResponse): void {
    this.detalleItem.set(item);
    this.detalleVisible.set(true);
  }

  cerrarDetalle(): void {
    this.detalleVisible.set(false);
    this.detalleItem.set(null);
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.cerrarDetalle();
    }
  }

  getAccionClass(accion: string): string {
    switch (accion) {
      case 'CREATE': return 'accion-create';
      case 'UPDATE': return 'accion-update';
      case 'DELETE': return 'accion-delete';
      case 'ASSIGN': return 'accion-assign';
      case 'CLOSE': return 'accion-close';
      default: return '';
    }
  }

  getAccionLabel(accion: string): string {
    switch (accion) {
      case 'CREATE': return 'Creacion';
      case 'UPDATE': return 'Modificacion';
      case 'DELETE': return 'Eliminacion';
      case 'ASSIGN': return 'Asignacion';
      case 'CLOSE': return 'Cierre';
      default: return accion;
    }
  }

  getEntidadRuta(entidad: string): string {
    switch (entidad) {
      case 'TICKET': return '/tickets';
      case 'HARDWARE': return '/hardware';
      case 'SOFTWARE': return '/software';
      case 'CONTRATO': return '/contratos';
      case 'JUZGADO': return '/juzgados';
      case 'USUARIO': return '/usuarios';
      default: return '';
    }
  }

  navegarAEntidad(item: AuditLogResponse): void {
    const ruta = this.getEntidadRuta(item.entidad);
    if (ruta && item.registroId) {
      this.router.navigate([ruta, item.registroId]);
    }
  }

  parseJson(value: string | undefined): any {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  formatJson(value: any): string {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'string') return value;
    return JSON.stringify(value, null, 2);
  }

  getDiffKeys(anterior: any, nuevo: any): string[] {
    const keys = new Set<string>();
    if (anterior && typeof anterior === 'object') {
      Object.keys(anterior).forEach(k => keys.add(k));
    }
    if (nuevo && typeof nuevo === 'object') {
      Object.keys(nuevo).forEach(k => keys.add(k));
    }
    return Array.from(keys).sort();
  }

  hasChanged(key: string, anterior: any, nuevo: any): boolean {
    const valA = anterior ? JSON.stringify(anterior[key]) : undefined;
    const valN = nuevo ? JSON.stringify(nuevo[key]) : undefined;
    return valA !== valN;
  }

  get hayFiltrosActivos(): boolean {
    return !!(this.filtroEntidad || this.filtroAccion || this.filtroDesde || this.filtroHasta);
  }

  private aplicarFiltros(): void {
    this.currentPage = 0;
    this.cargarDatos(0);
  }
}
