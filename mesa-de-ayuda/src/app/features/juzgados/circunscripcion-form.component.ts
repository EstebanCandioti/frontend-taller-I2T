import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { CircunscripcionService } from '../../core/services/circunscripcion.service';
import { ToastService } from '../../core/services/toast.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-circunscripcion-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LoadingSpinnerComponent],
  template: `
    <div class="page-header">
      <h1 class="page-title">{{ isEditing ? 'Editar Circunscripcion' : 'Nueva Circunscripcion' }}</h1>
    </div>

    @if (loading()) {
      <app-loading-spinner message="Cargando..." />
    } @else {
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-card">
        <div class="form-row">
          <div class="form-group">
            <label for="nombre" class="form-label">Nombre <span class="required">*</span></label>
            <input id="nombre" formControlName="nombre" class="form-control"
              [class.invalid]="isInvalid('nombre')" maxlength="100"
              placeholder="Ej: Primera Circunscripcion">
            @if (isInvalid('nombre')) {
              <span class="form-error">El nombre es obligatorio.</span>
            }
          </div>
          <div class="form-group">
            <label for="distritoJudicial" class="form-label">Distrito Judicial <span class="required">*</span></label>
            <input id="distritoJudicial" formControlName="distritoJudicial" class="form-control"
              [class.invalid]="isInvalid('distritoJudicial')" maxlength="100"
              placeholder="Ej: Santa Fe">
            @if (isInvalid('distritoJudicial')) {
              <span class="form-error">El distrito judicial es obligatorio.</span>
            }
          </div>
        </div>
        <div class="form-actions">
          <a routerLink="/juzgados" class="btn btn-secondary">Cancelar</a>
          <button type="submit" class="btn btn-primary" [disabled]="form.invalid || form.pristine || submitting()">
            @if (submitting()) { <span class="spinner-btn"></span> }
            {{ isEditing ? 'Guardar Cambios' : 'Registrar' }}
          </button>
        </div>
      </form>
    }
  `,
  styleUrl: './juzgado-form.component.scss'
})
export class CircunscripcionFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly circunscripcionService = inject(CircunscripcionService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly submitting = signal(false);

  isEditing = false;
  circunscripcionId?: number;

  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    distritoJudicial: ['', [Validators.required, Validators.maxLength(100)]]
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditing = true;
      this.circunscripcionId = +idParam;
      this.loading.set(true);
      this.circunscripcionService.obtenerPorId(this.circunscripcionId).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: c => {
          this.form.patchValue({ nombre: c.nombre, distritoJudicial: c.distritoJudicial });
          this.loading.set(false);
        },
        error: () => {
          this.toast.error('No se pudo cargar la circunscripcion.');
          this.router.navigate(['/juzgados']);
        }
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.submitting.set(true);
    const val = this.form.getRawValue();
    const dto = { nombre: val.nombre!.trim(), distritoJudicial: val.distritoJudicial!.trim() };

    const request$ = this.isEditing
      ? this.circunscripcionService.editar(this.circunscripcionId!, dto)
      : this.circunscripcionService.crear(dto);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.toast.success(this.isEditing ? 'Circunscripcion actualizada.' : 'Circunscripcion registrada.');
        this.router.navigate(['/juzgados']);
      },
      error: () => this.submitting.set(false)
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }
}
