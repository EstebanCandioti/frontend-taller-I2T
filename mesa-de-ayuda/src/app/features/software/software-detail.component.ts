import { Component, inject, signal, OnInit, OnDestroy, DestroyRef } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';

import { SoftwareService } from '../../core/services/software.service';
import { ToastService } from '../../core/services/toast.service';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { ConfirmDialogService } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { SoftwareResponse, HardwareResponse } from '../../core/models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-software-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, LoadingSpinnerComponent, StatusBadgeComponent],
  templateUrl: './software-detail.component.html',
  styleUrl: './software-detail.component.scss'
})
export class SoftwareDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly softwareService = inject(SoftwareService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly destroyRef = inject(DestroyRef);

  readonly sw = signal<SoftwareResponse | null>(null);
  readonly loading = signal(true);
  readonly HARDWARE_VISIBLE_DEFAULT = 5;

  mostrarTodoHardware = false;

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.softwareService.obtenerPorId(id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: data => {
        this.sw.set(data);
        this.breadcrumbService.setLabel(data.nombre);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar el software.');
        this.router.navigate(['/software']);
      }
    });
  }

  licenciaPct(): number {
    const sw = this.sw();
    if (!sw || sw.cantidadLicencias === 0) return 0;
    return Math.round((sw.licenciasEnUso / sw.cantidadLicencias) * 100);
  }

  licenciaClass(): string {
    const pct = this.licenciaPct();
    if (pct >= 90) return 'critico';
    if (pct >= 70) return 'alto';
    return 'normal';
  }

  hardwareVisible(): HardwareResponse[] {
    const hardware = this.sw()?.hardware ?? [];
    if (this.mostrarTodoHardware) return hardware;
    return hardware.slice(0, this.HARDWARE_VISIBLE_DEFAULT);
  }

  hardwareOculto(): number {
    const hardware = this.sw()?.hardware ?? [];
    return Math.max(0, hardware.length - this.HARDWARE_VISIBLE_DEFAULT);
  }

  toggleHardware(): void {
    this.mostrarTodoHardware = !this.mostrarTodoHardware;

    if (!this.mostrarTodoHardware) {
      setTimeout(() => {
        document.querySelector('.hardware-section')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }

  ngOnDestroy(): void {
    this.breadcrumbService.reset();
  }

  async onEliminar(): Promise<void> {
    const sw = this.sw();
    if (!sw) return;

    const confirmed = await this.confirmDialog.confirm({
      title: 'Eliminar Software',
      message: `¿Eliminar "${sw.nombre}"? Esta accion no se puede deshacer.`,
      confirmText: 'Eliminar',
      type: 'danger'
    });

    if (!confirmed) return;

    this.softwareService.eliminar(sw.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.toast.success('Software eliminado correctamente.');
        this.router.navigate(['/software']);
      },
      error: (err) => {
        this.toast.error(err?.error?.message || err?.message || 'No se pudo eliminar el registro');
      }
    });
  }
}
