import { Component, inject, signal, computed, OnInit, OnDestroy, DestroyRef } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ContratoService } from '../../core/services/contrato.service';
import { HardwareService } from '../../core/services/hardware.service';
import { SoftwareService } from '../../core/services/software.service';
import { JuzgadoService } from '../../core/services/juzgado.service';
import { ToastService } from '../../core/services/toast.service';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { HardwareResponse, SoftwareResponse, JuzgadoResponse } from '../../core/models';
import { HasUnsavedChanges } from '../../core/guards/unsaved-changes.guard';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { mapBackendErrors, scrollToFirstError } from '../../core/utils/form-error-mapper';

@Component({
  selector: 'app-contrato-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LoadingSpinnerComponent],
  templateUrl: './contrato-form.component.html',
  styleUrl: './contrato-form.component.scss'
})
export class ContratoFormComponent implements OnInit, OnDestroy, HasUnsavedChanges {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly contratoService = inject(ContratoService);
  private readonly hardwareService = inject(HardwareService);
  private readonly softwareService = inject(SoftwareService);
  private readonly juzgadoService = inject(JuzgadoService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly breadcrumbService = inject(BreadcrumbService);

  readonly allHardware = signal<HardwareResponse[]>([]);
  readonly softwareList = signal<SoftwareResponse[]>([]);
  readonly juzgados = signal<JuzgadoResponse[]>([]);
  readonly hwFilterJuzgadoId = signal<string>('');
  readonly loading = signal(false);
  readonly submitting = signal(false);

  readonly filteredHardware = computed(() => {
    const all = this.allHardware();
    const juzgadoId = this.hwFilterJuzgadoId();
    if (!juzgadoId) return all;
    return all.filter(h => h.juzgadoId === +juzgadoId);
  });

  isEditing = false;
  contratoId?: number;
  submitted = false;

  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(150)]],
    proveedor: ['', [Validators.required, Validators.maxLength(150)]],
    fechaInicio: ['', Validators.required],
    fechaFin: ['', Validators.required],
    cobertura: ['', Validators.maxLength(255)],
    monto: [null as number | null],
    diasAlertaVencimiento: [30, [Validators.min(1)]],
    observaciones: [''],
    hardwareIds: [[] as number[]],
    softwareIds: [[] as number[]]
  }, {
    validators: [this.fechasValidator]
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditing = true;
      this.contratoId = +idParam;
    }

    // Cargar listas para multi-select y filtro
    this.juzgadoService.listar().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: data => this.juzgados.set(data),
      error: () => {}
    });

    this.hardwareService.listarTodos().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: data => this.allHardware.set(data),
      error: () => {}
    });

    this.softwareService.listarTodos().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: data => this.softwareList.set(data),
      error: () => {}
    });

    if (this.isEditing) {
      this.loading.set(true);
      this.contratoService.obtenerPorId(this.contratoId!).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: c => {
          this.form.patchValue({
            nombre: c.nombre,
            proveedor: c.proveedor,
            fechaInicio: c.fechaInicio,
            fechaFin: c.fechaFin,
            cobertura: c.cobertura || '',
            monto: c.monto || null,
            diasAlertaVencimiento: c.diasAlertaVencimiento,
            observaciones: c.observaciones || '',
            hardwareIds: c.hardware.map(h => h.id),
            softwareIds: c.software.map(s => s.id)
          });
          this.breadcrumbService.setLabel(c.nombre);
          this.form.markAsPristine();
          this.loading.set(false);
        },
        error: () => {
          this.toast.error('No se pudo cargar el contrato.');
          this.router.navigate(['/contratos']);
        }
      });
    }
  }

  fechasValidator(control: AbstractControl): ValidationErrors | null {
    const inicio = control.get('fechaInicio')?.value;
    const fin = control.get('fechaFin')?.value;
    if (inicio && fin && fin <= inicio) {
      return { fechaFinAnterior: true };
    }
    return null;
  }

  onHardwareToggle(id: number): void {
    const current = this.form.value.hardwareIds || [];
    const idx = current.indexOf(id);
    if (idx >= 0) {
      this.form.patchValue({ hardwareIds: current.filter(i => i !== id) });
    } else {
      this.form.patchValue({ hardwareIds: [...current, id] });
    }
    this.form.markAsDirty();
  }

  onSoftwareToggle(id: number): void {
    const current = this.form.value.softwareIds || [];
    const idx = current.indexOf(id);
    if (idx >= 0) {
      this.form.patchValue({ softwareIds: current.filter(i => i !== id) });
    } else {
      this.form.patchValue({ softwareIds: [...current, id] });
    }
    this.form.markAsDirty();
  }

  isHardwareSelected(id: number): boolean {
    return (this.form.value.hardwareIds || []).includes(id);
  }

  isSoftwareSelected(id: number): boolean {
    return (this.form.value.softwareIds || []).includes(id);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      scrollToFirstError();
      return;
    }

    this.submitting.set(true);
    this.submitted = true;
    const val = this.form.getRawValue();

    const dto = {
      nombre: val.nombre!.trim(),
      proveedor: val.proveedor!.trim(),
      fechaInicio: val.fechaInicio!,
      fechaFin: val.fechaFin!,
      cobertura: val.cobertura?.trim() || undefined,
      monto: val.monto || undefined,
      diasAlertaVencimiento: val.diasAlertaVencimiento || 30,
      observaciones: val.observaciones?.trim() || undefined,
      hardwareIds: val.hardwareIds?.length ? val.hardwareIds : undefined,
      softwareIds: val.softwareIds?.length ? val.softwareIds : undefined
    };

    const request$ = this.isEditing
      ? this.contratoService.editar(this.contratoId!, dto)
      : this.contratoService.crear(dto);

    request$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.toast.success(this.isEditing ? 'Contrato actualizado correctamente.' : 'Contrato registrado correctamente.');
        this.form.markAsPristine();
        this.router.navigate(['/contratos']);
      },
      error: (err) => {
        this.submitted = false;
        this.submitting.set(false);
        if (err.errors) {
          mapBackendErrors(this.form, err.errors);
          scrollToFirstError();
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.breadcrumbService.reset();
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }

  hasUnsavedChanges(): boolean {
    return this.form.dirty && !this.submitted;
  }
}
