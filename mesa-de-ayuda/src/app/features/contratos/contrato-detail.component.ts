import { Component, inject, signal, OnInit, OnDestroy, DestroyRef } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ContratoService } from '../../core/services/contrato.service';
import { ToastService } from '../../core/services/toast.service';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { ConfirmDialogService } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { ContratoResponse } from '../../core/models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { RenovarDialogComponent } from './renovar-dialog.component';

@Component({
  selector: 'app-contrato-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, CurrencyPipe, LoadingSpinnerComponent, RenovarDialogComponent],
  templateUrl: './contrato-detail.component.html',
  styleUrl: './contrato-detail.component.scss'
})
export class ContratoDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  private readonly contratoService = inject(ContratoService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly destroyRef = inject(DestroyRef);

  readonly contrato = signal<ContratoResponse | null>(null);
  readonly loading = signal(true);
  readonly showRenovar = signal(false);

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.cargarContrato(id);
  }

  cargarContrato(id: number): void {
    this.loading.set(true);
    this.contratoService.obtenerPorId(id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: data => {
        this.contrato.set(data);
        this.breadcrumbService.setLabel(data.nombre);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar el contrato.');
        this.router.navigate(['/contratos']);
      }
    });
  }

  ngOnDestroy(): void {
    this.breadcrumbService.reset();
  }

  estadoContrato(c: ContratoResponse): string {
    if (c.vencido) return 'Vencido';
    if (c.proximoAVencer) return 'Proximo a vencer';
    return 'Activo';
  }

  estadoClass(c: ContratoResponse): string {
    if (c.vencido) return 'vencido';
    if (c.proximoAVencer) return 'proximo';
    return 'activo';
  }

  diasRestantes(c: ContratoResponse): number {
    const hoy = new Date();
    const fin = new Date(c.fechaFin);
    return Math.ceil((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  }

  abrirRenovar(): void {
    this.showRenovar.set(true);
  }

  onRenovado(): void {
    this.showRenovar.set(false);
    const id = this.contrato()?.id;
    if (id) this.cargarContrato(id);
  }

  onRenovarCerrado(): void {
    this.showRenovar.set(false);
  }

  async onEliminar(): Promise<void> {
    const c = this.contrato();
    if (!c) return;

    const confirmed = await this.confirmDialog.confirm({
      title: 'Eliminar Contrato',
      message: `¿Eliminar "${c.nombre}"? Se desvinculara el hardware y software asociado.`,
      confirmText: 'Eliminar',
      type: 'danger'
    });

    if (!confirmed) return;

    this.contratoService.eliminar(c.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.toast.success('Contrato eliminado.');
        this.router.navigate(['/contratos']);
      },
      error: (err) => {
        this.toast.error(err?.error?.message || err?.message || 'No se pudo eliminar el registro');
      }
    });
  }
}
