import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { UsuarioService } from '../../core/services/usuario.service';
import { ToastService } from '../../core/services/toast.service';
import { RolResponse } from '../../core/models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LoadingSpinnerComponent],
  templateUrl: './usuario-form.component.html',
  styleUrl: './usuario-form.component.scss'
})
export class UsuarioFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly usuarioService = inject(UsuarioService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly roles = signal<RolResponse[]>([]);
  readonly loading = signal(false);
  readonly loadingData = signal(true);
  readonly submitting = signal(false);
  readonly showPassword = signal(false);

  isEditing = false;
  usuarioId?: number;

  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    apellido: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
    telefono: ['', Validators.maxLength(30)],
    rolId: ['', Validators.required]
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditing = true;
      this.usuarioId = +idParam;
      // En edicion, password es opcional
      this.form.get('password')!.clearValidators();
      this.form.get('password')!.setValidators([Validators.minLength(6), Validators.maxLength(100)]);
      this.form.get('password')!.updateValueAndValidity();
    }

    this.usuarioService.listarRoles().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: data => this.roles.set(data),
      error: () => this.toast.error('Error al cargar roles.')
    });

    if (this.isEditing) {
      this.loading.set(true);
      this.usuarioService.obtenerPorId(this.usuarioId!).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: u => {
          this.form.patchValue({
            nombre: u.nombre,
            apellido: u.apellido,
            email: u.email,
            password: '',
            telefono: u.telefono || '',
            rolId: u.rolId.toString()
          });
          this.loading.set(false);
          this.loadingData.set(false);
        },
        error: () => {
          this.toast.error('No se pudo cargar el usuario.');
          this.router.navigate(['/usuarios']);
        }
      });
    } else {
      this.loadingData.set(false);
    }
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const val = this.form.getRawValue();

    const dto: any = {
      nombre: val.nombre!.trim(),
      apellido: val.apellido!.trim(),
      email: val.email!.trim(),
      telefono: val.telefono?.trim() || undefined,
      rolId: +val.rolId!
    };

    // Solo incluir password si se proporciono
    if (val.password?.trim()) {
      dto.password = val.password.trim();
    }

    const request$ = this.isEditing
      ? this.usuarioService.editar(this.usuarioId!, dto)
      : this.usuarioService.crear(dto);

    request$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.toast.success(this.isEditing ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.');
        this.router.navigate(['/usuarios']);
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

  getError(field: string): string {
    const ctrl = this.form.get(field);
    if (!ctrl || !ctrl.errors) return '';

    if (ctrl.errors['required']) {
      const labels: Record<string, string> = {
        nombre: 'El nombre es obligatorio.',
        apellido: 'El apellido es obligatorio.',
        email: 'El email es obligatorio.',
        password: 'La contrasena es obligatoria.',
        rolId: 'Debe seleccionar un rol.'
      };
      return labels[field] || 'Campo obligatorio.';
    }
    if (ctrl.errors['email']) return 'Formato de email invalido.';
    if (ctrl.errors['minlength']) return `Minimo ${ctrl.errors['minlength'].requiredLength} caracteres.`;
    if (ctrl.errors['maxlength']) return `Maximo ${ctrl.errors['maxlength'].requiredLength} caracteres.`;
    return 'Campo invalido.';
  }
}
