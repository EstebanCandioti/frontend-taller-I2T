import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { SoftwareService } from '../../core/services/software.service';
import { ContratoService } from '../../core/services/contrato.service';
import { JuzgadoService } from '../../core/services/juzgado.service';
import { HardwareService } from '../../core/services/hardware.service';
import { ToastService } from '../../core/services/toast.service';
import { ContratoResponse, JuzgadoResponse, HardwareResponse } from '../../core/models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-software-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LoadingSpinnerComponent],
  templateUrl: './software-form.component.html',
  styleUrl: './software-form.component.scss'
})
export class SoftwareFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly softwareService = inject(SoftwareService);
  private readonly contratoService = inject(ContratoService);
  private readonly juzgadoService = inject(JuzgadoService);
  private readonly hardwareService = inject(HardwareService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly contratos = signal<ContratoResponse[]>([]);
  readonly juzgados = signal<JuzgadoResponse[]>([]);
  readonly hardwareList = signal<HardwareResponse[]>([]);
  readonly loading = signal(false);
  readonly submitting = signal(false);

  isEditing = false;
  softwareId?: number;

  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(150)]],
    proveedor: ['', [Validators.required, Validators.maxLength(150)]],
    cantidadLicencias: [1, [Validators.required, Validators.min(1)]],
    fechaVencimiento: [''],
    contratoId: ['', Validators.required],
    juzgadoId: [''],
    hardwareId: [''],
    observaciones: ['']
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditing = true;
      this.softwareId = +idParam;
    }

    // Cargar selects
    this.contratoService.listar().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: data => this.contratos.set(data.filter(c => !c.vencido)),
      error: () => this.toast.error('Error al cargar contratos.')
    });

    this.juzgadoService.listar().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: data => this.juzgados.set(data),
      error: () => {}
    });

    this.hardwareService.listar().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: data => this.hardwareList.set(data),
      error: () => {}
    });

    if (this.isEditing) {
      this.loading.set(true);
      this.softwareService.obtenerPorId(this.softwareId!).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: sw => {
          this.form.patchValue({
            nombre: sw.nombre,
            proveedor: sw.proveedor,
            cantidadLicencias: sw.cantidadLicencias,
            fechaVencimiento: sw.fechaVencimiento || '',
            contratoId: sw.contratoId.toString(),
            juzgadoId: sw.juzgadoId?.toString() || '',
            hardwareId: sw.hardwareId?.toString() || '',
            observaciones: sw.observaciones || ''
          });
          this.loading.set(false);
        },
        error: () => {
          this.toast.error('No se pudo cargar el software.');
          this.router.navigate(['/software']);
        }
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const val = this.form.getRawValue();

    const dto = {
      nombre: val.nombre!.trim(),
      proveedor: val.proveedor!.trim(),
      cantidadLicencias: +val.cantidadLicencias!,
      fechaVencimiento: val.fechaVencimiento || undefined,
      contratoId: +val.contratoId!,
      juzgadoId: val.juzgadoId ? +val.juzgadoId : undefined,
      hardwareId: val.hardwareId ? +val.hardwareId : undefined,
      observaciones: val.observaciones?.trim() || undefined
    };

    const request$ = this.isEditing
      ? this.softwareService.editar(this.softwareId!, dto)
      : this.softwareService.crear(dto);

    request$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.toast.success(this.isEditing ? 'Software actualizado correctamente.' : 'Software registrado correctamente.');
        this.router.navigate(['/software']);
      },
      error: () => this.submitting.set(false)
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }
}
