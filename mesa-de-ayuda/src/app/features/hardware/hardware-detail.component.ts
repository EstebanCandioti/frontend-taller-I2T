import { Component, inject, signal, OnInit, OnDestroy, DestroyRef } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';

import { HardwareService } from '../../core/services/hardware.service';
import { SoftwareService } from '../../core/services/software.service';
import { ToastService } from '../../core/services/toast.service';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { ConfirmDialogService } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { HardwareResponse, SoftwareResponse } from '../../core/models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-hardware-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, LoadingSpinnerComponent],
  templateUrl: './hardware-detail.component.html',
  styleUrl: './hardware-detail.component.scss'
})
export class HardwareDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly hardwareService = inject(HardwareService);
  private readonly softwareService = inject(SoftwareService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly destroyRef = inject(DestroyRef);

  readonly hardware = signal<HardwareResponse | null>(null);
  readonly softwareVinculado = signal<SoftwareResponse[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.hardwareService.obtenerPorId(id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: data => {
        this.hardware.set(data);
        this.breadcrumbService.setLabel(`${data.nroInventario} — ${data.marca} ${data.modelo}`);
        this.cargarSoftwareVinculado(data.id);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar el hardware.');
        this.router.navigate(['/hardware']);
      }
    });
  }

  ngOnDestroy(): void {
    this.breadcrumbService.reset();
  }

  async onEliminar(): Promise<void> {
    const hw = this.hardware();
    if (!hw) return;

    const confirmed = await this.confirmDialog.confirm({
      title: 'Eliminar Hardware',
      message: `¿Eliminar "${hw.nroInventario} - ${hw.marca} ${hw.modelo}"? Esta accion no se puede deshacer.`,
      confirmText: 'Eliminar',
      type: 'danger'
    });

    if (!confirmed) return;

    this.hardwareService.eliminar(hw.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.toast.success('Hardware eliminado correctamente.');
        this.router.navigate(['/hardware']);
      },
      error: (err) => {
        this.toast.error(err?.error?.message || err?.message || 'No se pudo eliminar el registro');
      }
    });
  }

  private cargarSoftwareVinculado(hardwareId: number): void {
    this.softwareService.listarTodos().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: software => {
        const vinculados = (software ?? []).filter(sw =>
          (sw.hardware ?? []).some(hw => hw.id === hardwareId)
        );
        this.softwareVinculado.set(vinculados);
      },
      error: () => {
        this.softwareVinculado.set([]);
      }
    });
  }
}
