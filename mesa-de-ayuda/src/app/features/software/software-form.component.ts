import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';

import { SoftwareService } from '../../core/services/software.service';
import { ContratoService } from '../../core/services/contrato.service';
import { JuzgadoService } from '../../core/services/juzgado.service';
import { HardwareService } from '../../core/services/hardware.service';
import { ToastService } from '../../core/services/toast.service';
import { ContratoResponse, JuzgadoResponse, HardwareResponse, SoftwareResponse } from '../../core/models';
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
  readonly allHardware = signal<HardwareResponse[]>([]);
  readonly loading = signal(false);
  readonly submitting = signal(false);

  // Multi-select: juzgados seleccionados
  readonly selectedJuzgadoIds = signal<number[]>([]);
  // Multi-select: hardware seleccionado
  readonly selectedHardwareIds = signal<number[]>([]);

  // Juzgados disponibles (no seleccionados aun)
  readonly availableJuzgados = computed(() => {
    const selected = this.selectedJuzgadoIds();
    return this.juzgados().filter(j => !selected.includes(j.id));
  });

  // Hardware disponible (no seleccionado aun)
  readonly availableHardware = computed(() => {
    const selected = this.selectedHardwareIds();
    return this.allHardware().filter(h => !selected.includes(h.id));
  });

  // Objetos completos de juzgados seleccionados para mostrar tags
  readonly selectedJuzgadoObjects = computed(() => {
    const ids = this.selectedJuzgadoIds();
    return this.juzgados().filter(j => ids.includes(j.id));
  });

  // Objetos completos de hardware seleccionado para mostrar tags
  readonly selectedHardwareObjects = computed(() => {
    const ids = this.selectedHardwareIds();
    return this.allHardware().filter(h => ids.includes(h.id));
  });

  // Licencias: cantidadLicencias actual del form
  readonly cantidadLicencias = signal(1);
  readonly licenciasEnUso = signal(0);

  isEditing = false;
  softwareId?: number;
  private editingSoftware?: SoftwareResponse;

  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(150)]],
    proveedor: ['', [Validators.required, Validators.maxLength(150)]],
    cantidadLicencias: [1, [Validators.required, Validators.min(1)]],
    fechaVencimiento: [''],
    contratoId: ['', Validators.required],
    observaciones: ['']
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditing = true;
      this.softwareId = +idParam;
    }

    // Rastrear cambios en cantidadLicencias
    this.form.get('cantidadLicencias')!.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(val => this.cantidadLicencias.set(+(val || 1)));

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

    this.hardwareService.listarTodos().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: data => this.allHardware.set(data),
      error: () => {}
    });

    if (this.isEditing) {
      this.loading.set(true);
      this.softwareService.obtenerPorId(this.softwareId!).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: sw => {
          this.editingSoftware = sw;
          this.licenciasEnUso.set(sw.licenciasEnUso);
          this.cantidadLicencias.set(sw.cantidadLicencias);

          // Cargar ids seleccionados desde la respuesta
          this.selectedJuzgadoIds.set(sw.juzgados?.map(j => j.id) || []);
          this.selectedHardwareIds.set(sw.hardware?.map(h => h.id) || []);

          this.form.patchValue({
            nombre: sw.nombre,
            proveedor: sw.proveedor,
            cantidadLicencias: sw.cantidadLicencias,
            fechaVencimiento: sw.fechaVencimiento || '',
            contratoId: sw.contratoId.toString(),
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

  // --- Juzgados multi-select ---
  addJuzgado(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const id = +select.value;
    if (!id) return;
    this.selectedJuzgadoIds.update(ids => [...ids, id]);
    select.value = '';
    this.markFormDirty();
  }

  removeJuzgado(id: number): void {
    this.selectedJuzgadoIds.update(ids => ids.filter(i => i !== id));
    this.markFormDirty();
  }

  // --- Hardware multi-select ---
  addHardware(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const id = +select.value;
    if (!id) return;

    // Verificar licencias disponibles
    const currentSelected = this.selectedHardwareIds().length;
    const maxLicencias = this.cantidadLicencias();
    if (currentSelected >= maxLicencias) {
      this.toast.error(`No hay licencias disponibles. Maximo: ${maxLicencias}.`);
      select.value = '';
      return;
    }

    this.selectedHardwareIds.update(ids => [...ids, id]);
    select.value = '';
    this.markFormDirty();
  }

  removeHardware(id: number): void {
    this.selectedHardwareIds.update(ids => ids.filter(i => i !== id));
    this.markFormDirty();
  }

  private markFormDirty(): void {
    this.form.markAsDirty();
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
      juzgadoIds: this.selectedJuzgadoIds().length > 0 ? this.selectedJuzgadoIds() : undefined,
      hardwareIds: this.selectedHardwareIds().length > 0 ? this.selectedHardwareIds() : undefined,
      observaciones: val.observaciones?.trim() || undefined
    };

    const request$ = this.isEditing
      ? this.softwareService.editar(this.softwareId!, dto)
      : this.softwareService.crear(dto);

    request$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (sw) => {
        // Si estamos editando, tambien actualizar las relaciones via endpoints dedicados
        if (this.isEditing) {
          const updates: ReturnType<typeof forkJoin>[] = [];
          const hwIds = this.selectedHardwareIds();
          const jzIds = this.selectedJuzgadoIds();

          forkJoin([
            this.softwareService.actualizarHardware(this.softwareId!, hwIds),
            this.softwareService.actualizarJuzgados(this.softwareId!, jzIds)
          ]).pipe(
            takeUntilDestroyed(this.destroyRef)
          ).subscribe({
            next: () => {
              this.toast.success('Software actualizado correctamente.');
              this.router.navigate(['/software']);
            },
            error: () => {
              this.toast.error('Error al actualizar relaciones.');
              this.submitting.set(false);
            }
          });
        } else {
          // Al crear, si el backend ya procesa hardwareIds/juzgadoIds en el DTO, listo
          // Si no, llamar endpoints dedicados con el id del nuevo software
          if (this.selectedHardwareIds().length > 0 || this.selectedJuzgadoIds().length > 0) {
            forkJoin([
              this.softwareService.actualizarHardware(sw.id, this.selectedHardwareIds()),
              this.softwareService.actualizarJuzgados(sw.id, this.selectedJuzgadoIds())
            ]).pipe(
              takeUntilDestroyed(this.destroyRef)
            ).subscribe({
              next: () => {
                this.toast.success('Software registrado correctamente.');
                this.router.navigate(['/software']);
              },
              error: () => {
                this.toast.success('Software registrado. Algunas relaciones no se pudieron guardar.');
                this.router.navigate(['/software']);
              }
            });
          } else {
            this.toast.success('Software registrado correctamente.');
            this.router.navigate(['/software']);
          }
        }
      },
      error: () => this.submitting.set(false)
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }
}
