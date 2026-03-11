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
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-hardware-list',
  standalone: true,
  imports: [FormsModule, RouterLink, LoadingSpinnerComponent, EmptyStateComponent],
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

  // Filtros
  filtroClase = '';
  filtroJuzgadoId = '';
  filtroBusqueda = '';

  readonly clases = ['PC Desktop', 'Impresora', 'Scanner', 'Monitor'];

  private readonly searchSubject = new Subject<string>();

  ngOnInit(): void {
    // Cargar juzgados para el select de filtro
    this.juzgadoService.listar().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: data => this.juzgados.set(data),
      error: () => {}
    });

    // Leer filtros de URL
    const params = this.route.snapshot.queryParams;
    if (params['clase']) this.filtroClase = params['clase'];
    if (params['juzgadoId']) this.filtroJuzgadoId = params['juzgadoId'];
    if (params['q']) this.filtroBusqueda = params['q'];

    // Debounce búsqueda
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.cargarDatos());

    this.cargarDatos();
  }

  onSearchInput(): void {
    this.searchSubject.next(this.filtroBusqueda);
  }

  onFiltroChange(): void {
    this.cargarDatos();
  }

  limpiarFiltros(): void {
    this.filtroClase = '';
    this.filtroJuzgadoId = '';
    this.filtroBusqueda = '';
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading.set(true);

    const filtros: HardwareFiltros = {};
    if (this.filtroClase) filtros.clase = this.filtroClase;
    if (this.filtroJuzgadoId) filtros.juzgadoId = +this.filtroJuzgadoId;
    if (this.filtroBusqueda.trim()) filtros.q = this.filtroBusqueda.trim();

    // Persistir filtros en URL
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

    this.hardwareService.listar(filtros).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: data => {
        this.hardware.set(data);
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
      message: `¿Eliminar "${item.nroInventario} - ${item.marca} ${item.modelo}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      type: 'danger'
    });

    if (!confirmed) return;

    this.hardwareService.eliminar(item.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.toast.success('Hardware eliminado correctamente.');
        this.cargarDatos();
      }
    });
  }

  get hayFiltrosActivos(): boolean {
    return !!(this.filtroClase || this.filtroJuzgadoId || this.filtroBusqueda.trim());
  }
}
