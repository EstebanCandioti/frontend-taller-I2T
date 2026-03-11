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

@Component({
  selector: 'app-software-list',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, LoadingSpinnerComponent, EmptyStateComponent],
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

  filtroBusqueda = '';
  private readonly searchSubject = new Subject<string>();

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;
    if (params['q']) this.filtroBusqueda = params['q'];

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

  limpiarFiltros(): void {
    this.filtroBusqueda = '';
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading.set(true);

    const filtros: SoftwareFiltros = {};
    if (this.filtroBusqueda.trim()) filtros.q = this.filtroBusqueda.trim();

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: this.filtroBusqueda.trim() || null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });

    this.softwareService.listar(filtros).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: data => {
        this.software.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  async onEliminar(item: SoftwareResponse): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Eliminar Software',
      message: `¿Eliminar "${item.nombre}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      type: 'danger'
    });

    if (!confirmed) return;

    this.softwareService.eliminar(item.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.toast.success('Software eliminado correctamente.');
        this.cargarDatos();
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

  get hayFiltrosActivos(): boolean {
    return !!this.filtroBusqueda.trim();
  }
}
