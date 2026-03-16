import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

import { SoftwareService, SoftwareFiltros } from '../../core/services/software.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmDialogService } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { SoftwareResponse } from '../../core/models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ExportButtonComponent } from '../../shared/components/export-button/export-button.component';
import { ExportColumn } from '../../core/services/export.service';

@Component({
  selector: 'app-software-list',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, LoadingSpinnerComponent, EmptyStateComponent, ExportButtonComponent],
  templateUrl: './software-list.component.html',
  styleUrl: './software-list.component.scss'
})
export class SoftwareListComponent implements OnInit {
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly softwareService = inject(SoftwareService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly destroyRef = inject(DestroyRef);

  readonly software = signal<SoftwareResponse[]>([]);
  readonly loading = signal(true);

  // Paginacion
  currentPage = 0;
  pageSize = 20;
  totalElements = 0;
  totalPages = 0;

  readonly exportColumns: ExportColumn[] = [
    { header: 'Nombre', field: 'nombre' },
    { header: 'Proveedor', field: 'proveedor' },
    { header: 'Licencias', field: 'cantidadLicencias', format: (v, row) => `${row.licenciasEnUso}/${v}` },
    { header: 'Disponibles', field: 'licenciasDisponibles' },
    { header: 'Vencimiento', field: 'fechaVencimiento', format: (v) => v ? new Date(v).toLocaleDateString('es-AR') : '—' },
    { header: 'Contrato', field: 'contratoNombre' },
    { header: 'Juzgado', field: 'juzgados', format: (_v, row) => row.juzgados?.length ? row.juzgados.map((j: any) => j.nombre).join(', ') : '—' },
    { header: 'Hardware', field: 'hardware', format: (_v, row) => row.hardware?.length ? row.hardware.map((h: any) => h.nroInventario).join(', ') : '—' },
  ];

  filtroBusqueda = '';
  private readonly searchSubject = new Subject<string>();
  readonly Math = Math;

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;
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

  limpiarFiltros(): void {
    this.filtroBusqueda = '';
    this.aplicarFiltros();
  }

  irAPagina(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.cargarDatos(page);
    }
  }

  cargarDatos(page = 0): void {
    this.loading.set(true);

    const filtros: SoftwareFiltros = {};
    if (this.filtroBusqueda.trim()) filtros.q = this.filtroBusqueda.trim();

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: this.filtroBusqueda.trim() || null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });

    this.softwareService.listar(filtros, page, this.pageSize).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: pagina => {
        this.software.set(pagina.content);
        this.totalElements = pagina.totalElements;
        this.totalPages = pagina.totalPages;
        this.currentPage = pagina.currentPage;
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  async onEliminar(item: SoftwareResponse): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Eliminar Software',
      message: `¿Eliminar "${item.nombre}"? Esta accion no se puede deshacer.`,
      confirmText: 'Eliminar',
      type: 'danger'
    });

    if (!confirmed) return;

    this.softwareService.eliminar(item.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.toast.success('Software eliminado correctamente.');
        this.cargarDatos(this.currentPage);
      },
      error: (err) => {
        this.toast.error(err?.error?.message || err?.message || 'No se pudo eliminar el registro');
      }
    });
  }

  licenciaPct(sw: SoftwareResponse): number {
    if (sw.cantidadLicencias === 0) return 0;
    return Math.round((sw.licenciasEnUso / sw.cantidadLicencias) * 100);
  }

  licenciaClass(sw: SoftwareResponse): string {
    const pct = this.licenciaPct(sw);
    if (pct >= 90) return 'critico';
    if (pct >= 70) return 'alto';
    return 'normal';
  }

  juzgadosTooltip(sw: SoftwareResponse): string {
    return sw.juzgados?.map(j => `${j.nombre} — ${j.fuero}`).join('\n') || '';
  }

  hardwareTooltip(sw: SoftwareResponse): string {
    return sw.hardware?.map(h => `${h.nroInventario} — ${h.marca} ${h.modelo}`).join('\n') || '';
  }

  get hayFiltrosActivos(): boolean {
    return !!this.filtroBusqueda.trim();
  }

  private aplicarFiltros(): void {
    this.currentPage = 0;
    this.cargarDatos(0);
  }
}
