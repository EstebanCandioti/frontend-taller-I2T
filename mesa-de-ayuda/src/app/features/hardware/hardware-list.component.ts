import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

import { HardwareService, HardwareFiltros } from '../../core/services/hardware.service';
import { JuzgadoService } from '../../core/services/juzgado.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmDialogService } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { HardwareResponse, JuzgadoResponse } from '../../core/models';
import { HARDWARE_CLASSES } from '../../core/models/hardware.model';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ExportButtonComponent } from '../../shared/components/export-button/export-button.component';
import { ExportColumn } from '../../core/services/export.service';

@Component({
  selector: 'app-hardware-list',
  standalone: true,
  imports: [FormsModule, RouterLink, LoadingSpinnerComponent, EmptyStateComponent, ExportButtonComponent],
  templateUrl: './hardware-list.component.html',
  styleUrl: './hardware-list.component.scss'
})
export class HardwareListComponent implements OnInit {
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly hardwareService = inject(HardwareService);
  private readonly juzgadoService = inject(JuzgadoService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly destroyRef = inject(DestroyRef);

  readonly hardware = signal<HardwareResponse[]>([]);
  readonly juzgados = signal<JuzgadoResponse[]>([]);
  readonly loading = signal(true);

  // Paginacion
  currentPage = 0;
  pageSize = 20;
  totalElements = 0;
  totalPages = 0;

  // Filtros
  filtroClase = '';
  filtroJuzgadoId = '';
  filtroBusqueda = '';

  readonly exportColumns: ExportColumn[] = [
    { header: 'Nro. Inventario', field: 'nroInventario' },
    { header: 'Clase', field: 'clase' },
    { header: 'Marca', field: 'marca' },
    { header: 'Modelo', field: 'modelo' },
    { header: 'Nro. Serie', field: 'nroSerie', format: (v) => v || '—' },
    { header: 'Juzgado', field: 'juzgadoNombre' },
    { header: 'Ubicacion', field: 'ubicacionFisica' },
    { header: 'Contrato', field: 'contratoNombre', format: (v) => v || 'Sin contrato' },
  ];

  readonly clases = [...HARDWARE_CLASSES];
  readonly Math = Math;

  private readonly searchSubject = new Subject<string>();

  ngOnInit(): void {
    this.juzgadoService.listar().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: data => this.juzgados.set(data),
      error: () => {}
    });

    const params = this.route.snapshot.queryParams;
    if (params['clase']) this.filtroClase = params['clase'];
    if (params['juzgadoId']) this.filtroJuzgadoId = params['juzgadoId'];
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
    this.filtroClase = '';
    this.filtroJuzgadoId = '';
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

    const filtros: HardwareFiltros = {};
    if (this.filtroClase) filtros.clase = this.filtroClase;
    if (this.filtroJuzgadoId) filtros.juzgadoId = +this.filtroJuzgadoId;
    if (this.filtroBusqueda.trim()) filtros.q = this.filtroBusqueda.trim();

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        clase: this.filtroClase || null,
        juzgadoId: this.filtroJuzgadoId || null,
        q: this.filtroBusqueda.trim() || null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });

    this.hardwareService.listar(filtros, page, this.pageSize).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: pagina => {
        this.hardware.set(pagina.content);
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

  async onEliminar(item: HardwareResponse): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Eliminar Hardware',
      message: `¿Eliminar "${item.nroInventario} - ${item.marca} ${item.modelo}"? Esta accion no se puede deshacer.`,
      confirmText: 'Eliminar',
      type: 'danger'
    });

    if (!confirmed) return;

    this.hardwareService.eliminar(item.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.toast.success('Hardware eliminado correctamente.');
        this.cargarDatos(this.currentPage);
      }
    });
  }

  get hayFiltrosActivos(): boolean {
    return !!(this.filtroClase || this.filtroJuzgadoId || this.filtroBusqueda.trim());
  }

  private aplicarFiltros(): void {
    this.currentPage = 0;
    this.cargarDatos(0);
  }
}
