import { Component, inject, OnInit, OnDestroy, signal, DestroyRef } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LowerCasePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { TicketService } from '../../core/services/ticket.service';
import { JuzgadoService } from '../../core/services/juzgado.service';
import { HardwareService } from '../../core/services/hardware.service';
import { ToastService } from '../../core/services/toast.service';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { TicketResponse, JuzgadoResponse, HardwareResponse } from '../../core/models';
import { HasUnsavedChanges } from '../../core/guards/unsaved-changes.guard';

import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { mapBackendErrors, scrollToFirstError } from '../../core/utils/form-error-mapper';

@Component({
  selector: 'app-ticket-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LowerCasePipe, LoadingSpinnerComponent],
  templateUrl: './ticket-form.component.html',
  styleUrl: './ticket-form.component.scss'
})
export class TicketFormComponent implements OnInit, OnDestroy, HasUnsavedChanges {
  private readonly fb = inject(FormBuilder);
  private readonly ticketService = inject(TicketService);
  private readonly juzgadoService = inject(JuzgadoService);
  private readonly hardwareService = inject(HardwareService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly breadcrumbService = inject(BreadcrumbService);

  // Estado
  readonly loading = signal(false);
  readonly loadingData = signal(true);
  readonly submitting = signal(false);
  readonly juzgados = signal<JuzgadoResponse[]>([]);
  readonly hardwareList = signal<HardwareResponse[]>([]);

  // Modo edicion
  readonly isEdit = signal(false);
  readonly ticketId = signal<number | null>(null);
  private ticketOriginal: TicketResponse | null = null;

  readonly prioridades = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'];
  readonly tiposRequerimiento = ['Hardware', 'Software', 'Red', 'Otro'];

  form!: FormGroup;
  submitted = false;

  ngOnInit(): void {
    this.buildForm();
    this.cargarJuzgados();

    const idParam = this.route.snapshot.params['id'];
    if (idParam) {
      this.isEdit.set(true);
      this.ticketId.set(+idParam);
      this.cargarTicket(+idParam);
    } else {
      this.loadingData.set(false);
    }

    // Cuando cambia juzgado, recargar hardware filtrado
    this.form.get('juzgadoId')!.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(juzgadoId => {
      this.form.get('hardwareId')!.setValue(null);
      if (juzgadoId) {
        this.cargarHardware(+juzgadoId);
      } else {
        this.hardwareList.set([]);
      }
    });
  }

  get tituloLength(): number {
    return this.form.get('titulo')?.value?.length || 0;
  }

  get pageTitle(): string {
    return this.isEdit() ? 'Editar Ticket' : 'Nuevo Ticket';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      scrollToFirstError();
      return;
    }

    this.submitting.set(true);
    this.submitted = true;
    const dto = this.buildDto();

    const request$ = this.isEdit()
      ? this.ticketService.editar(this.ticketId()!, dto)
      : this.ticketService.crear(dto);

    request$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: ticket => {
        this.toast.success(this.isEdit() ? 'Ticket actualizado correctamente.' : 'Ticket creado correctamente.');
        this.form.markAsPristine();
        this.router.navigate(['/tickets', ticket.id]);
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

  hasError(field: string, error: string): boolean {
    const control = this.form.get(field);
    return !!control && control.hasError(error) && control.touched;
  }

  ngOnDestroy(): void {
    this.breadcrumbService.reset();
  }

  hasUnsavedChanges(): boolean {
    return this.form.dirty && !this.submitted;
  }

  private buildForm(): void {
    this.form = this.fb.group({
      titulo: ['', [Validators.required, Validators.maxLength(200)]],
      descripcion: ['', [Validators.required]],
      prioridad: ['MEDIA'],
      tipoRequerimiento: [''],
      juzgadoId: [null, [Validators.required]],
      hardwareId: [null],
      referenteNombre: ['', [Validators.maxLength(150)]],
      referenteTelefono: ['', [Validators.maxLength(30)]]
    });
  }

  private buildDto() {
    const v = this.form.value;
    return {
      titulo: v.titulo.trim(),
      descripcion: v.descripcion.trim(),
      prioridad: v.prioridad || undefined,
      tipoRequerimiento: v.tipoRequerimiento || undefined,
      juzgadoId: +v.juzgadoId,
      hardwareId: v.hardwareId ? +v.hardwareId : undefined,
      referenteNombre: v.referenteNombre?.trim() || undefined,
      referenteTelefono: v.referenteTelefono?.trim() || undefined
    };
  }

  private cargarJuzgados(): void {
    this.juzgadoService.listar().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(data => this.juzgados.set(data));
  }

  private cargarHardware(juzgadoId: number): void {
    this.hardwareService.listarTodos({ juzgadoId }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(data => this.hardwareList.set(data));
  }

  private cargarTicket(id: number): void {
    this.ticketService.obtenerPorId(id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: ticket => {
        if (ticket.estado !== 'SOLICITADO') {
          this.toast.warning('Solo se pueden editar tickets en estado Solicitado.');
          this.router.navigate(['/tickets', id]);
          return;
        }

        this.ticketOriginal = ticket;
        this.breadcrumbService.setLabel(ticket.titulo);

        // Cargar hardware del juzgado antes de setear el form
        if (ticket.juzgadoId) {
          this.cargarHardware(ticket.juzgadoId);
        }

        this.form.patchValue({
          titulo: ticket.titulo,
          descripcion: ticket.descripcion,
          prioridad: ticket.prioridad,
          tipoRequerimiento: ticket.tipoRequerimiento || '',
          juzgadoId: ticket.juzgadoId,
          hardwareId: ticket.hardwareId || null,
          referenteNombre: ticket.referenteNombre || '',
          referenteTelefono: ticket.referenteTelefono || ''
        });

        this.form.markAsPristine();
        this.loadingData.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar el ticket.');
        this.router.navigate(['/tickets']);
      }
    });
  }
}
