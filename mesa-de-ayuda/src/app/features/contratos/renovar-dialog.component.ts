import { Component, inject, input, output, signal, OnInit, DestroyRef } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ContratoService } from '../../core/services/contrato.service';
import { ToastService } from '../../core/services/toast.service';
import { ContratoResponse } from '../../core/models';

@Component({
  selector: 'app-renovar-dialog',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="dialog-backdrop" (click)="onCancel()">
      <div class="dialog" (click)="$event.stopPropagation()">
        <div class="dialog-header">
          <h3>Renovar Contrato</h3>
          <button class="dialog-close" (click)="onCancel()">
            <span class="material-icon">close</span>
          </button>
        </div>
        <div class="dialog-body">
          <p class="dialog-subtitle">{{ contrato().nombre }} — {{ contrato().proveedor }}</p>

          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="form-row">
              <div class="form-group">
                <label for="fechaInicio" class="form-label">Nueva Fecha Inicio <span class="required">*</span></label>
                <input id="fechaInicio" type="date" formControlName="fechaInicio" class="form-control"
                  [class.invalid]="isInvalid('fechaInicio')">
                @if (isInvalid('fechaInicio')) {
                  <span class="form-error">La fecha de inicio es obligatoria.</span>
                }
              </div>
              <div class="form-group">
                <label for="fechaFin" class="form-label">Nueva Fecha Fin <span class="required">*</span></label>
                <input id="fechaFin" type="date" formControlName="fechaFin" class="form-control"
                  [class.invalid]="isInvalid('fechaFin')">
                @if (isInvalid('fechaFin')) {
                  <span class="form-error">La fecha de fin es obligatoria.</span>
                }
                @if (form.hasError('fechaFinAnterior') && form.get('fechaFin')!.touched) {
                  <span class="form-error">La fecha fin debe ser posterior a la fecha inicio.</span>
                }
              </div>
            </div>

            <div class="form-group">
              <label for="monto" class="form-label">Nuevo Monto ($)</label>
              <input id="monto" type="number" formControlName="monto" class="form-control"
                min="0" step="0.01" placeholder="Opcional"
                (keydown)="['e', 'E', '+', '-'].includes($event.key) ? $event.preventDefault() : null">
            </div>

            <div class="form-group">
              <label for="observaciones" class="form-label">Observaciones</label>
              <textarea id="observaciones" formControlName="observaciones" class="form-control textarea"
                rows="3" maxlength="1000" placeholder="Notas sobre la renovacion..."></textarea>
            </div>
          </form>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-secondary" (click)="onCancel()">Cancelar</button>
          <button class="btn btn-success" (click)="onSubmit()" [disabled]="form.invalid || submitting()">
            @if (submitting()) {
              <span class="spinner-btn"></span>
            }
            Renovar Contrato
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './renovar-dialog.component.scss'
})
export class RenovarDialogComponent implements OnInit {
  readonly contrato = input.required<ContratoResponse>();
  readonly renovado = output<void>();
  readonly cerrado = output<void>();

  private readonly fb = inject(FormBuilder);
  private readonly contratoService = inject(ContratoService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly submitting = signal(false);

  form = this.fb.group({
    fechaInicio: ['', Validators.required],
    fechaFin: ['', Validators.required],
    monto: [null as number | null],
    observaciones: ['', Validators.maxLength(1000)]
  }, {
    validators: [this.fechasValidator]
  });

  ngOnInit(): void {
    // Sugerir fechas: inicio = dia siguiente al vencimiento, fin = +1 ano
    const c = this.contrato();
    const oldFin = new Date(c.fechaFin);
    const nuevoInicio = new Date(oldFin);
    nuevoInicio.setDate(nuevoInicio.getDate() + 1);
    const nuevoFin = new Date(nuevoInicio);
    nuevoFin.setFullYear(nuevoFin.getFullYear() + 1);

    this.form.patchValue({
      fechaInicio: this.toDateStr(nuevoInicio),
      fechaFin: this.toDateStr(nuevoFin),
      monto: c.monto || null
    });
  }

  fechasValidator(control: AbstractControl): ValidationErrors | null {
    const inicio = control.get('fechaInicio')?.value;
    const fin = control.get('fechaFin')?.value;
    if (inicio && fin && fin <= inicio) {
      return { fechaFinAnterior: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const val = this.form.getRawValue();

    const dto = {
      fechaInicio: val.fechaInicio!,
      fechaFin: val.fechaFin!,
      monto: val.monto || undefined,
      observaciones: val.observaciones?.trim() || undefined
    };

    this.contratoService.renovar(this.contrato().id, dto).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.toast.success('Contrato renovado correctamente.');
        this.renovado.emit();
      },
      error: () => this.submitting.set(false)
    });
  }

  onCancel(): void {
    this.cerrado.emit();
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }

  private toDateStr(d: Date): string {
    return d.toISOString().split('T')[0];
  }
}
