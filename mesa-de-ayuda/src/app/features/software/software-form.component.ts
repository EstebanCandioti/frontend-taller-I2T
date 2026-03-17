import { Component, inject, signal, computed, OnInit, OnDestroy, DestroyRef, HostListener } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, Subject, debounceTime, distinctUntilChanged, switchMap, of, tap } from 'rxjs';

import { SoftwareService } from '../../core/services/software.service';
import { ContratoService } from '../../core/services/contrato.service';
import { JuzgadoService } from '../../core/services/juzgado.service';
import { HardwareService } from '../../core/services/hardware.service';
import { ToastService } from '../../core/services/toast.service';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { ContratoResponse, JuzgadoResponse, HardwareResponse, SoftwareResponse } from '../../core/models';
import { HasUnsavedChanges } from '../../core/guards/unsaved-changes.guard';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { mapBackendErrors, scrollToFirstError } from '../../core/utils/form-error-mapper';

@Component({
  selector: 'app-software-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LoadingSpinnerComponent],
  templateUrl: './software-form.component.html',
  styleUrl: './software-form.component.scss'
})
export class SoftwareFormComponent implements OnInit, OnDestroy, HasUnsavedChanges {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly softwareService = inject(SoftwareService);
  private readonly contratoService = inject(ContratoService);
  private readonly juzgadoService = inject(JuzgadoService);
  private readonly hardwareService = inject(HardwareService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly breadcrumbService = inject(BreadcrumbService);

  readonly contratos = signal<ContratoResponse[]>([]);
  readonly juzgados = signal<JuzgadoResponse[]>([]);
  readonly loading = signal(false);
  readonly submitting = signal(false);

  // Multi-select: juzgados seleccionados
  readonly selectedJuzgadoIds = signal<number[]>([]);

  // Hardware: lista de objetos seleccionados
  readonly selectedHardwareList = signal<HardwareResponse[]>([]);
  readonly selectedHardwareIds = computed(() => this.selectedHardwareList().map(h => h.id));

  // Busqueda de hardware
  readonly hwSearchQuery = signal('');
  readonly hwSearchResults = signal<HardwareResponse[]>([]);
  readonly hwSearching = signal(false);
  readonly hwSearchOpen = signal(false);
  private readonly hwSearch$ = new Subject<string>();

  // Juzgados disponibles (no seleccionados aun)
  readonly availableJuzgados = computed(() => {
    const selected = this.selectedJuzgadoIds();
    return this.juzgados().filter(j => !selected.includes(j.id));
  });

  // Objetos completos de juzgados seleccionados para mostrar tags
  readonly selectedJuzgadoObjects = computed(() => {
    const ids = this.selectedJuzgadoIds();
    return this.juzgados().filter(j => ids.includes(j.id));
  });

  // Licencias: cantidadLicencias actual del form
  readonly cantidadLicencias = signal(1);
  readonly licenciasEnUso = signal(0);

  isEditing = false;
  softwareId?: number;
  private editingSoftware?: SoftwareResponse;
  submitted = false;
  private initialFormValue: any = null;
  private initialJuzgadoIds: number[] = [];
  private initialHardwareIds: number[] = [];

  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(150)]],
    proveedor: ['', [Validators.required, Validators.maxLength(150)]],
    cantidadLicencias: [1, [Validators.required, Validators.min(1)]],
    fechaVencimiento: [''],
    contratoId: ['', Validators.required],
    observaciones: ['']
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.hw-search-wrapper')) {
      this.hwSearchOpen.set(false);
    }
  }

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

    // Stream de busqueda de hardware con debounce
    this.hwSearch$.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      tap(() => this.hwSearching.set(true)),
      switchMap(term => {
        if (term.trim().length < 2) {
          return of([]);
        }
        return this.hardwareService.listarTodos({ q: term }, 'nroInventario,asc', 20);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(results => {
      const selectedIds = this.selectedHardwareIds();
      this.hwSearchResults.set(results.filter(h => !selectedIds.includes(h.id)));
      this.hwSearching.set(false);
      this.hwSearchOpen.set(true);
    });

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

    if (this.isEditing) {
      this.loading.set(true);
      this.softwareService.obtenerPorId(this.softwareId!).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: sw => {
          this.editingSoftware = sw;
          this.licenciasEnUso.set(sw.licenciasEnUso);
          this.cantidadLicencias.set(sw.cantidadLicencias);

          // Cargar objetos seleccionados desde la respuesta
          this.selectedJuzgadoIds.set(sw.juzgados?.map(j => j.id) || []);
          this.selectedHardwareList.set(sw.hardware || []);

          this.form.patchValue({
            nombre: sw.nombre,
            proveedor: sw.proveedor,
            cantidadLicencias: sw.cantidadLicencias,
            fechaVencimiento: sw.fechaVencimiento || '',
            contratoId: sw.contratoId.toString(),
            observaciones: sw.observaciones || ''
          });
          this.breadcrumbService.setLabel(sw.nombre);
          this.form.markAsPristine();
          this.initialFormValue = this.form.getRawValue();
          this.initialJuzgadoIds = [...this.selectedJuzgadoIds()];
          this.initialHardwareIds = [...this.selectedHardwareIds()];
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

  // --- Hardware search + select ---
  onHwSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.hwSearchQuery.set(value);
    if (value.trim().length < 2) {
      this.hwSearchResults.set([]);
      this.hwSearchOpen.set(false);
      return;
    }
    this.hwSearch$.next(value.trim());
  }

  onHwSearchFocus(): void {
    if (this.hwSearchResults().length > 0) {
      this.hwSearchOpen.set(true);
    }
  }

  addHardwareFromSearch(hw: HardwareResponse): void {
    // Verificar licencias disponibles
    const currentSelected = this.selectedHardwareIds().length;
    const maxLicencias = this.cantidadLicencias();
    if (currentSelected >= maxLicencias) {
      this.toast.error(`No hay licencias disponibles. Maximo: ${maxLicencias}.`);
      return;
    }

    this.selectedHardwareList.update(list => [...list, hw]);

    // Auto-agregar juzgado si no esta en la lista
    if (hw.juzgadoId && !this.selectedJuzgadoIds().includes(hw.juzgadoId)) {
      this.selectedJuzgadoIds.update(ids => [...ids, hw.juzgadoId]);
      // Asegurar que el juzgado existe en la lista maestra
      const juzgadoExiste = this.juzgados().some(j => j.id === hw.juzgadoId);
      if (!juzgadoExiste) {
        this.juzgados.update(list => [...list, {
          id: hw.juzgadoId,
          nombre: hw.juzgadoNombre,
          fuero: '',
          ciudad: '',
          edificio: '',
          circunscripcionId: 0,
          circunscripcionNombre: ''
        }]);
      }
      this.toast.info(`Juzgado "${hw.juzgadoNombre}" agregado automaticamente.`);
    }

    // Limpiar busqueda
    this.hwSearchQuery.set('');
    this.hwSearchResults.set([]);
    this.hwSearchOpen.set(false);
    this.markFormDirty();
  }

  removeHardware(id: number): void {
    this.selectedHardwareList.update(list => list.filter(h => h.id !== id));
    this.markFormDirty();
  }

  private markFormDirty(): void {
    this.form.markAsDirty();
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
              this.form.markAsPristine();
              this.router.navigate(['/software']);
            },
            error: () => {
              this.toast.error('Error al actualizar relaciones.');
              this.submitted = false;
              this.submitting.set(false);
            }
          });
        } else {
          if (this.selectedHardwareIds().length > 0 || this.selectedJuzgadoIds().length > 0) {
            forkJoin([
              this.softwareService.actualizarHardware(sw.id, this.selectedHardwareIds()),
              this.softwareService.actualizarJuzgados(sw.id, this.selectedJuzgadoIds())
            ]).pipe(
              takeUntilDestroyed(this.destroyRef)
            ).subscribe({
              next: () => {
                this.toast.success('Software registrado correctamente.');
                this.form.markAsPristine();
                this.router.navigate(['/software']);
              },
              error: () => {
                this.toast.success('Software registrado. Algunas relaciones no se pudieron guardar.');
                this.form.markAsPristine();
                this.router.navigate(['/software']);
              }
            });
          } else {
            this.toast.success('Software registrado correctamente.');
            this.form.markAsPristine();
            this.router.navigate(['/software']);
          }
        }
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

  get hasRealChanges(): boolean {
    if (!this.initialFormValue) return !this.form.pristine;
    const formChanged = JSON.stringify(this.form.getRawValue()) !== JSON.stringify(this.initialFormValue);
    const juzgadosChanged = JSON.stringify([...this.selectedJuzgadoIds()].sort()) !== JSON.stringify([...this.initialJuzgadoIds].sort());
    const hardwareChanged = JSON.stringify([...this.selectedHardwareIds()].sort()) !== JSON.stringify([...this.initialHardwareIds].sort());
    return formChanged || juzgadosChanged || hardwareChanged;
  }

  hasUnsavedChanges(): boolean {
    return this.hasRealChanges && !this.submitted;
  }
}
