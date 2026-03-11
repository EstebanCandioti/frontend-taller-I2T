import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { HardwareService } from '../../core/services/hardware.service';
import { JuzgadoService } from '../../core/services/juzgado.service';
import { ContratoService } from '../../core/services/contrato.service';
import { ToastService } from '../../core/services/toast.service';
import { JuzgadoResponse, ContratoResponse } from '../../core/models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-hardware-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LoadingSpinnerComponent],
  templateUrl: './hardware-form.component.html',
  styleUrl: './hardware-form.component.scss'
})
export class HardwareFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly hardwareService = inject(HardwareService);
  private readonly juzgadoService = inject(JuzgadoService);
  private readonly contratoService = inject(ContratoService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly juzgados = signal<JuzgadoResponse[]>([]);
  readonly contratos = signal<ContratoResponse[]>([]);
  readonly loading = signal(false);
  readonly loadingData = signal(true);
  readonly submitting = signal(false);

  readonly clases = ['PC Desktop', 'Impresora', 'Scanner', 'Monitor'];

  isEditing = false;
  hardwareId?: number;

  form = this.fb.group({
    nroInventario: ['', [Validators.required, Validators.maxLength(50)]],
    clase: ['', Validators.required],
    marca: ['', [Validators.required, Validators.maxLength(100)]],
    modelo: ['', [Validators.required, Validators.maxLength(150)]],
    nroSerie: ['', Validators.maxLength(100)],
    ubicacionFisica: ['', [Validators.required, Validators.maxLength(200)]],
    juzgadoId: ['', Validators.required],
    contratoId: [''],
    observaciones: ['']
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditing = true;
      this.hardwareId = +idParam;
    }

    // Cargar datos de selects
    this.juzgadoService.listar().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: data => this.juzgados.set(data),
      error: () => this.toast.error('Error al cargar juzgados.')
    });

    this.contratoService.listar().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: data => this.contratos.set(data),
      error: () => {}
    });

    if (this.isEditing) {
      this.loading.set(true);
      this.hardwareService.obtenerPorId(this.hardwareId!).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: hw => {
          this.form.patchValue({
            nroInventario: hw.nroInventario,
            clase: hw.clase,
            marca: hw.marca,
            modelo: hw.modelo,
            nroSerie: hw.nroSerie || '',
            ubicacionFisica: hw.ubicacionFisica,
            juzgadoId: hw.juzgadoId.toString(),
            contratoId: hw.contratoId?.toString() || '',
            observaciones: hw.observaciones || ''
          });
          this.loading.set(false);
          this.loadingData.set(false);
        },
        error: () => {
          this.toast.error('No se pudo cargar el hardware.');
          this.router.navigate(['/hardware']);
        }
      });
    } else {
      this.loadingData.set(false);
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
      nroInventario: val.nroInventario!.trim(),
      clase: val.clase!,
      marca: val.marca!.trim(),
      modelo: val.modelo!.trim(),
      nroSerie: val.nroSerie?.trim() || undefined,
      ubicacionFisica: val.ubicacionFisica!.trim(),
      juzgadoId: +val.juzgadoId!,
      contratoId: val.contratoId ? +val.contratoId : undefined,
      observaciones: val.observaciones?.trim() || undefined
    };

    const request$ = this.isEditing
      ? this.hardwareService.editar(this.hardwareId!, dto)
      : this.hardwareService.crear(dto);

    request$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (result) => {
        this.toast.success(this.isEditing ? 'Hardware actualizado correctamente.' : 'Hardware registrado correctamente.');
        this.router.navigate(['/hardware', result.id]);
      },
      error: () => {
        this.submitting.set(false);
      }
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }
}
