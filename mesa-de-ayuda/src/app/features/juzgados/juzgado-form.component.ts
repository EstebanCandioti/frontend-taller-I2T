import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { JuzgadoService } from '../../core/services/juzgado.service';
import { CircunscripcionService } from '../../core/services/circunscripcion.service';
import { ToastService } from '../../core/services/toast.service';
import { CircunscripcionResponse } from '../../core/models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-juzgado-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LoadingSpinnerComponent],
  templateUrl: './juzgado-form.component.html',
  styleUrl: './juzgado-form.component.scss'
})
export class JuzgadoFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly juzgadoService = inject(JuzgadoService);
  private readonly circunscripcionService = inject(CircunscripcionService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly circunscripciones = signal<CircunscripcionResponse[]>([]);
  readonly loading = signal(false);
  readonly submitting = signal(false);

  readonly fueros = ['Civil', 'Penal', 'Familia', 'Laboral'];

  isEditing = false;
  juzgadoId?: number;

  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(150)]],
    fuero: ['', Validators.required],
    ciudad: ['', [Validators.required, Validators.maxLength(100)]],
    edificio: ['', Validators.maxLength(150)],
    circunscripcionId: ['', Validators.required]
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditing = true;
      this.juzgadoId = +idParam;
    }

    this.circunscripcionService.listar().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: data => this.circunscripciones.set(data),
      error: () => this.toast.error('Error al cargar circunscripciones.')
    });

    if (this.isEditing) {
      this.loading.set(true);
      this.juzgadoService.obtenerPorId(this.juzgadoId!).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: j => {
          this.form.patchValue({
            nombre: j.nombre,
            fuero: j.fuero,
            ciudad: j.ciudad,
            edificio: j.edificio || '',
            circunscripcionId: j.circunscripcionId.toString()
          });
          this.loading.set(false);
        },
        error: () => {
          this.toast.error('No se pudo cargar el juzgado.');
          this.router.navigate(['/juzgados']);
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
      fuero: val.fuero!,
      ciudad: val.ciudad!.trim(),
      edificio: val.edificio?.trim() || undefined,
      circunscripcionId: +val.circunscripcionId!
    };

    const request$ = this.isEditing
      ? this.juzgadoService.editar(this.juzgadoId!, dto)
      : this.juzgadoService.crear(dto);

    request$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.toast.success(this.isEditing ? 'Juzgado actualizado.' : 'Juzgado registrado.');
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
