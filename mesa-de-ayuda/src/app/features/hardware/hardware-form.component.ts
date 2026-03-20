import { Component, inject, signal, computed, OnInit, OnDestroy, DestroyRef, HostListener } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, tap } from 'rxjs';

import { HardwareService } from '../../core/services/hardware.service';
import { JuzgadoService } from '../../core/services/juzgado.service';
import { ContratoService } from '../../core/services/contrato.service';
import { SoftwareService } from '../../core/services/software.service';
import { ToastService } from '../../core/services/toast.service';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { JuzgadoResponse, ContratoResponse, SoftwareResponse } from '../../core/models';
import { SoftwareSimpleResponse, HARDWARE_CLASSES } from '../../core/models/hardware.model';
import { HasUnsavedChanges } from '../../core/guards/unsaved-changes.guard';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { mapBackendErrors, scrollToFirstError } from '../../core/utils/form-error-mapper';

@Component({
  selector: 'app-hardware-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LoadingSpinnerComponent],
  templateUrl: './hardware-form.component.html',
  styleUrl: './hardware-form.component.scss'
})
export class HardwareFormComponent implements OnInit, OnDestroy, HasUnsavedChanges {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly hardwareService = inject(HardwareService);
  private readonly juzgadoService = inject(JuzgadoService);
  private readonly contratoService = inject(ContratoService);
  private readonly softwareService = inject(SoftwareService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly breadcrumbService = inject(BreadcrumbService);

  readonly juzgados = signal<JuzgadoResponse[]>([]);
  readonly contratos = signal<ContratoResponse[]>([]);
  readonly loading = signal(false);
  readonly loadingData = signal(true);
  readonly submitting = signal(false);

  readonly clases = [...HARDWARE_CLASSES];

  // Software: lista de objetos seleccionados
  readonly selectedSoftwareList = signal<SoftwareSimpleResponse[]>([]);
  readonly selectedSoftwareIds = computed(() => this.selectedSoftwareList().map(s => s.id));

  // Busqueda de software
  readonly swSearchQuery = signal('');
  readonly swSearchResults = signal<SoftwareResponse[]>([]);
  readonly swSearching = signal(false);
  readonly swSearchOpen = signal(false);
  private readonly swSearch$ = new Subject<string>();

  isEditing = false;
  hardwareId?: number;
  submitted = false;
  private initialFormValue: any = null;
  private initialSoftwareIds: number[] = [];

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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.sw-search-wrapper')) {
      this.swSearchOpen.set(false);
    }
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditing = true;
      this.hardwareId = +idParam;
    }

    // Stream de busqueda de software con debounce
    this.swSearch$.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      tap(() => this.swSearching.set(true)),
      switchMap(term => {
        if (term.trim().length < 2) {
          return of([]);
        }
        return this.softwareService.listarTodos({ q: term }, 'nombre,asc', 20);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(results => {
      const selectedIds = this.selectedSoftwareIds();
      this.swSearchResults.set(results.filter(s => !selectedIds.includes(s.id)));
      this.swSearching.set(false);
      this.swSearchOpen.set(true);
    });

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
          this.selectedSoftwareList.set(hw.software || []);
          this.breadcrumbService.setLabel(hw.nroInventario + ' — ' + hw.marca + ' ' + hw.modelo);
          this.loading.set(false);
          this.loadingData.set(false);
          this.form.markAsPristine();
          this.initialFormValue = this.form.getRawValue();
          this.initialSoftwareIds = [...this.selectedSoftwareIds()];
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

  // --- Software search + select ---
  onSwSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.swSearchQuery.set(value);
    if (value.trim().length < 2) {
      this.swSearchResults.set([]);
      this.swSearchOpen.set(false);
      return;
    }
    this.swSearch$.next(value.trim());
  }

  onSwSearchFocus(): void {
    if (this.swSearchResults().length > 0) {
      this.swSearchOpen.set(true);
    }
  }

  addSoftwareFromSearch(sw: SoftwareResponse): void {
    // Verificar licencias disponibles
    if (sw.licenciasEnUso >= sw.cantidadLicencias) {
      this.toast.error(`El software '${sw.nombre}' no tiene licencias disponibles (${sw.licenciasEnUso}/${sw.cantidadLicencias}).`);
      return;
    }

    this.selectedSoftwareList.update(list => [...list, {
      id: sw.id,
      nombre: sw.nombre,
      proveedor: sw.proveedor,
      cantidadLicencias: sw.cantidadLicencias,
      licenciasEnUso: sw.licenciasEnUso
    }]);

    // Limpiar busqueda
    this.swSearchQuery.set('');
    this.swSearchResults.set([]);
    this.swSearchOpen.set(false);
    this.markFormDirty();
  }

  removeSoftware(id: number): void {
    this.selectedSoftwareList.update(list => list.filter(s => s.id !== id));
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
        // Actualizar software asociado via endpoint dedicado
        const swIds = this.selectedSoftwareIds();
        const softwareChanged = this.isEditing
          ? JSON.stringify([...swIds].sort()) !== JSON.stringify([...this.initialSoftwareIds].sort())
          : swIds.length > 0;

        if (softwareChanged) {
          this.hardwareService.actualizarSoftware(result.id, swIds).pipe(
            takeUntilDestroyed(this.destroyRef)
          ).subscribe({
            next: () => {
              this.toast.success(this.isEditing ? 'Hardware actualizado correctamente.' : 'Hardware registrado correctamente.');
              this.form.markAsPristine();
              this.router.navigate(['/hardware', result.id]);
            },
            error: () => {
              this.toast.success(this.isEditing ? 'Hardware actualizado. Algunas relaciones de software no se pudieron guardar.' : 'Hardware registrado. Algunas relaciones de software no se pudieron guardar.');
              this.form.markAsPristine();
              this.router.navigate(['/hardware', result.id]);
            }
          });
        } else {
          this.toast.success(this.isEditing ? 'Hardware actualizado correctamente.' : 'Hardware registrado correctamente.');
          this.form.markAsPristine();
          this.router.navigate(['/hardware', result.id]);
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
    const softwareChanged = JSON.stringify([...this.selectedSoftwareIds()].sort()) !== JSON.stringify([...this.initialSoftwareIds].sort());
    return formChanged || softwareChanged;
  }

  hasUnsavedChanges(): boolean {
    return this.hasRealChanges && !this.submitted;
  }
}
