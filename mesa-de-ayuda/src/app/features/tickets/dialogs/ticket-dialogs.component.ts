import { Component, Injectable, inject, signal, OnInit, DestroyRef, effect } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { TicketService } from '../../../core/services/ticket.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { ToastService } from '../../../core/services/toast.service';
import { UsuarioResponse, TicketResponse } from '../../../core/models';

// ═══════════════════════════════════════════
// Servicio que controla la apertura de los dialogos
// ═══════════════════════════════════════════
export type TicketDialogType = 'asignar' | 'reasignar' | 'cerrar' | 'eliminar' | null;

@Injectable({ providedIn: 'root' })
export class TicketDialogService {
  readonly dialogType = signal<TicketDialogType>(null);
  readonly ticket = signal<TicketResponse | null>(null);

  private resolveRef?: (value: boolean) => void;

  open(type: TicketDialogType, ticket: TicketResponse): Promise<boolean> {
    this.dialogType.set(type);
    this.ticket.set(ticket);
    return new Promise<boolean>(resolve => {
      this.resolveRef = resolve;
    });
  }

  close(result: boolean): void {
    this.dialogType.set(null);
    this.ticket.set(null);
    this.resolveRef?.(result);
  }
}

// ═══════════════════════════════════════════
// Dialogo Asignar / Reasignar
// ═══════════════════════════════════════════
@Component({
  selector: 'app-ticket-asignar-dialog',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    @if (dialogService.dialogType() === 'asignar' || dialogService.dialogType() === 'reasignar') {
      <div class="dialog-backdrop" (click)="onCancel()">
        <div class="dialog" (click)="$event.stopPropagation()">
          <div class="dialog-header">
            <h3>{{ dialogService.dialogType() === 'asignar' ? 'Asignar Tecnico' : 'Reasignar Tecnico' }}</h3>
            <button class="dialog-close" (click)="onCancel()">
              <span class="material-icon">close</span>
            </button>
          </div>
          <div class="dialog-body">
            <p class="dialog-subtitle">
              Ticket #{{ dialogService.ticket()?.id }} — {{ dialogService.ticket()?.titulo }}
            </p>
            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <div class="form-group">
                <label for="tecnicoId" class="form-label">
                  Tecnico <span class="required">*</span>
                </label>
                @if (loadingTecnicos()) {
                  <p class="loading-text">Cargando tecnicos...</p>
                } @else {
                  <select id="tecnicoId" formControlName="tecnicoId" class="form-control"
                    [class.invalid]="form.get('tecnicoId')!.touched && form.get('tecnicoId')!.hasError('required')">
                    <option value="">— Seleccionar tecnico —</option>
                    @for (t of tecnicos(); track t.id) {
                      <option [value]="t.id">{{ t.nombreCompleto }}</option>
                    }
                  </select>
                  @if (form.get('tecnicoId')!.touched && form.get('tecnicoId')!.hasError('required')) {
                    <span class="form-error">Debe seleccionar un tecnico.</span>
                  }
                }
              </div>
            </form>
          </div>
          <div class="dialog-footer">
            <button class="btn btn-secondary" (click)="onCancel()">Cancelar</button>
            <button class="btn btn-primary" (click)="onSubmit()" [disabled]="form.invalid || submitting()">
              @if (submitting()) {
                <span class="spinner-btn"></span>
              }
              {{ dialogService.dialogType() === 'asignar' ? 'Asignar' : 'Reasignar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './ticket-dialogs.scss'
})
export class TicketAsignarDialogComponent implements OnInit {
  readonly dialogService = inject(TicketDialogService);
  private readonly fb = inject(FormBuilder);
  private readonly ticketService = inject(TicketService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly tecnicos = signal<UsuarioResponse[]>([]);
  readonly loadingTecnicos = signal(true);
  readonly submitting = signal(false);

  form: FormGroup = this.fb.group({
    tecnicoId: ['', Validators.required]
  });

  constructor() {
    effect(() => {
      const dialogType = this.dialogService.dialogType();
      const ticket = this.dialogService.ticket();

      if (dialogType === 'asignar' || dialogType === 'reasignar') {
        this.form.reset({
          tecnicoId: ticket?.tecnicoId?.toString() ?? ''
        });
        this.form.markAsPristine();
        this.form.markAsUntouched();
        this.submitting.set(false);
      }
    });
  }

  ngOnInit(): void {
    this.usuarioService.tecnicosActivos().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: data => {
        this.tecnicos.set(data);
        this.loadingTecnicos.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar los tecnicos.');
        this.loadingTecnicos.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const ticket = this.dialogService.ticket();
    if (!ticket) return;

    this.submitting.set(true);
    const dto = { tecnicoId: +this.form.value.tecnicoId };
    const isReasignar = this.dialogService.dialogType() === 'reasignar';

    const request$ = isReasignar
      ? this.ticketService.reasignar(ticket.id, dto)
      : this.ticketService.asignar(ticket.id, dto);

    request$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.dialogService.close(true);
      },
      error: () => {
        this.submitting.set(false);
      }
    });
  }

  onCancel(): void {
    this.dialogService.close(false);
  }
}

// ═══════════════════════════════════════════
// Dialogo Cerrar Ticket
// ═══════════════════════════════════════════
@Component({
  selector: 'app-ticket-cerrar-dialog',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    @if (dialogService.dialogType() === 'cerrar') {
      <div class="dialog-backdrop" (click)="onCancel()">
        <div class="dialog" (click)="$event.stopPropagation()">
          <div class="dialog-header">
            <h3>Cerrar Ticket</h3>
            <button class="dialog-close" (click)="onCancel()">
              <span class="material-icon">close</span>
            </button>
          </div>
          <div class="dialog-body">
            <p class="dialog-subtitle">
              Ticket #{{ dialogService.ticket()?.id }} — {{ dialogService.ticket()?.titulo }}
            </p>
            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <div class="form-group">
                <label for="resolucion" class="form-label">
                  Resolucion <span class="required">*</span>
                </label>
                <textarea
                  id="resolucion"
                  formControlName="resolucion"
                  class="form-control textarea"
                  [class.invalid]="form.get('resolucion')!.touched && form.get('resolucion')!.hasError('required')"
                  rows="4"
                  placeholder="Describa como se resolvio el problema..."></textarea>
                @if (form.get('resolucion')!.touched && form.get('resolucion')!.hasError('required')) {
                  <span class="form-error">La resolucion es obligatoria para cerrar el ticket.</span>
                }
              </div>
            </form>
          </div>
          <div class="dialog-footer">
            <button class="btn btn-secondary" (click)="onCancel()">Cancelar</button>
            <button class="btn btn-success" (click)="onSubmit()" [disabled]="form.invalid || submitting()">
              @if (submitting()) {
                <span class="spinner-btn"></span>
              }
              Cerrar Ticket
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './ticket-dialogs.scss'
})
export class TicketCerrarDialogComponent {
  readonly dialogService = inject(TicketDialogService);
  private readonly fb = inject(FormBuilder);
  private readonly ticketService = inject(TicketService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly submitting = signal(false);

  form = this.fb.group({
    resolucion: ['', Validators.required]
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const ticket = this.dialogService.ticket();
    if (!ticket) return;

    this.submitting.set(true);
    const dto = { resolucion: this.form.value.resolucion!.trim() };

    this.ticketService.cerrar(ticket.id, dto).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.dialogService.close(true);
      },
      error: () => {
        this.submitting.set(false);
      }
    });
  }

  onCancel(): void {
    this.dialogService.close(false);
  }
}

// ═══════════════════════════════════════════
// Dialogo Eliminar Ticket
// ═══════════════════════════════════════════
@Component({
  selector: 'app-ticket-eliminar-dialog',
  standalone: true,
  template: `
    @if (dialogService.dialogType() === 'eliminar') {
      <div class="dialog-backdrop" (click)="onCancel()">
        <div class="dialog dialog-sm" (click)="$event.stopPropagation()">
          <div class="dialog-header dialog-header--danger">
            <h3>Eliminar Ticket</h3>
            <button class="dialog-close" (click)="onCancel()">
              <span class="material-icon">close</span>
            </button>
          </div>
          <div class="dialog-body">
            <div class="warning-banner">
              <span class="material-icon warning-icon">warning</span>
              <div>
                <strong>Esta accion no se puede deshacer.</strong>
                <p>Se eliminara el ticket #{{ dialogService.ticket()?.id }} — "{{ dialogService.ticket()?.titulo }}"</p>
              </div>
            </div>
          </div>
          <div class="dialog-footer">
            <button class="btn btn-secondary" (click)="onCancel()">Cancelar</button>
            <button class="btn btn-danger" (click)="onConfirm()" [disabled]="submitting()">
              @if (submitting()) {
                <span class="spinner-btn"></span>
              }
              Eliminar
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './ticket-dialogs.scss'
})
export class TicketEliminarDialogComponent {
  readonly dialogService = inject(TicketDialogService);
  private readonly ticketService = inject(TicketService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly submitting = signal(false);

  onConfirm(): void {
    const ticket = this.dialogService.ticket();
    if (!ticket) return;

    this.submitting.set(true);

    this.ticketService.eliminar(ticket.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.toast.success('Ticket eliminado correctamente.');
        this.dialogService.close(true);
      },
      error: () => {
        this.submitting.set(false);
      }
    });
  }

  onCancel(): void {
    this.dialogService.close(false);
  }
}
