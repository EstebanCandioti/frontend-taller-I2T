import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';

import { JuzgadoService } from '../../core/services/juzgado.service';
import { CircunscripcionService } from '../../core/services/circunscripcion.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmDialogService } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { JuzgadoResponse, CircunscripcionResponse } from '../../core/models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ExportButtonComponent } from '../../shared/components/export-button/export-button.component';
import { ExportColumn } from '../../core/services/export.service';

interface CircunscripcionGroup {
  circunscripcion: CircunscripcionResponse;
  juzgados: JuzgadoResponse[];
  expanded: boolean;
}

@Component({
  selector: 'app-juzgado-list',
  standalone: true,
  imports: [RouterLink, LoadingSpinnerComponent, EmptyStateComponent, ExportButtonComponent],
  templateUrl: './juzgado-list.component.html',
  styleUrl: './juzgado-list.component.scss'
})
export class JuzgadoListComponent implements OnInit {
  readonly router = inject(Router);
  private readonly juzgadoService = inject(JuzgadoService);
  private readonly circunscripcionService = inject(CircunscripcionService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly destroyRef = inject(DestroyRef);

  readonly exportColumns: ExportColumn[] = [
    { header: 'Nombre', field: 'nombre' },
    { header: 'Fuero', field: 'fuero' },
    { header: 'Ciudad', field: 'ciudad' },
    { header: 'Edificio', field: 'edificio', format: (v) => v || '—' },
    { header: 'Circunscripcion', field: 'circunscripcionNombre' },
  ];

  readonly groups = signal<CircunscripcionGroup[]>([]);
  readonly allJuzgados = signal<JuzgadoResponse[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading.set(true);
    forkJoin({
      juzgados: this.juzgadoService.listar(),
      circunscripciones: this.circunscripcionService.listar()
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: ({ juzgados, circunscripciones }) => {
        this.allJuzgados.set(juzgados);
        const grouped: CircunscripcionGroup[] = circunscripciones.map(c => ({
          circunscripcion: c,
          juzgados: juzgados.filter(j => j.circunscripcionId === c.id),
          expanded: true
        }));
        // Agregar juzgados sin circunscripcion (si existieran)
        const sinCirc = juzgados.filter(j => !circunscripciones.some(c => c.id === j.circunscripcionId));
        if (sinCirc.length) {
          grouped.push({
            circunscripcion: { id: 0, nombre: 'Sin Circunscripcion', distritoJudicial: '' },
            juzgados: sinCirc,
            expanded: true
          });
        }
        this.groups.set(grouped);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  toggleGroup(group: CircunscripcionGroup): void {
    group.expanded = !group.expanded;
  }

  async onEliminarJuzgado(j: JuzgadoResponse): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Eliminar Juzgado',
      message: `¿Eliminar "${j.nombre}"? Si tiene hardware, software o tickets asociados, no se podra eliminar.`,
      confirmText: 'Eliminar',
      type: 'danger'
    });

    if (!confirmed) return;

    this.juzgadoService.eliminar(j.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.toast.success('Juzgado eliminado.');
        this.cargarDatos();
      },
      error: (err) => {
        this.toast.error(err?.error?.message || err?.message || 'No se pudo eliminar el registro');
      }
    });
  }

  async onEliminarCircunscripcion(c: CircunscripcionResponse): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Eliminar Circunscripcion',
      message: `¿Eliminar "${c.nombre}"? Debe estar sin juzgados asociados.`,
      confirmText: 'Eliminar',
      type: 'danger'
    });

    if (!confirmed) return;

    this.circunscripcionService.eliminar(c.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.toast.success('Circunscripcion eliminada.');
        this.cargarDatos();
      },
      error: (err) => {
        this.toast.error(err?.error?.message || err?.message || 'No se pudo eliminar el registro');
      }
    });
  }

  get totalJuzgados(): number {
    return this.groups().reduce((sum, g) => sum + g.juzgados.length, 0);
  }
}
