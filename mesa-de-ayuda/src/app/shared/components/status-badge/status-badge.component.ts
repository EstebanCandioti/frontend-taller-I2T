import { Component, input, computed } from '@angular/core';

type BadgeType = 'estado' | 'prioridad' | 'rol' | 'activo';

const BADGE_CONFIG: Record<string, { label: string; cssClass: string }> = {
  // Estados de ticket
  SOLICITADO: { label: 'Solicitado', cssClass: 'badge--estado-solicitado' },
  ASIGNADO: { label: 'Asignado', cssClass: 'badge--estado-asignado' },
  EN_CURSO: { label: 'En Curso', cssClass: 'badge--estado-en-curso' },
  CERRADO: { label: 'Cerrado', cssClass: 'badge--estado-cerrado' },

  // Prioridades
  CRITICA: { label: 'Cr\u00edtica', cssClass: 'badge--prioridad-critica' },
  ALTA: { label: 'Alta', cssClass: 'badge--prioridad-alta' },
  MEDIA: { label: 'Media', cssClass: 'badge--prioridad-media' },
  BAJA: { label: 'Baja', cssClass: 'badge--prioridad-baja' },

  // Roles
  Admin: { label: 'Admin', cssClass: 'badge--rol-admin' },
  Operario: { label: 'Operario', cssClass: 'badge--rol-operario' },
  'T\u00e9cnico': { label: 'T\u00e9cnico', cssClass: 'badge--rol-tecnico' },

  // Activo/Inactivo
  true: { label: 'Activo', cssClass: 'badge--activo' },
  false: { label: 'Inactivo', cssClass: 'badge--inactivo' },
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `<span class="badge" [class]="cssClass()">{{ label() }}</span>`,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
      white-space: nowrap;
      line-height: 1.5;
    }

    .badge--estado-solicitado { background: var(--estado-solicitado-bg); color: var(--estado-solicitado); }
    .badge--estado-asignado   { background: var(--estado-asignado-bg); color: var(--estado-asignado); }
    .badge--estado-en-curso   { background: var(--estado-en-curso-bg); color: var(--estado-en-curso); }
    .badge--estado-cerrado    { background: var(--estado-cerrado-bg); color: var(--estado-cerrado); }

    .badge--prioridad-critica { background: var(--priority-critica-bg); color: var(--priority-critica); }
    .badge--prioridad-alta    { background: var(--priority-alta-bg); color: var(--priority-alta); }
    .badge--prioridad-media   { background: var(--priority-media-bg); color: var(--priority-media); }
    .badge--prioridad-baja    { background: var(--priority-baja-bg); color: var(--priority-baja); }

    .badge--rol-admin    { background: #ede9fe; color: #7c3aed; }
    .badge--rol-operario { background: #dbeafe; color: #2563eb; }
    .badge--rol-tecnico  { background: #d1fae5; color: #059669; }

    .badge--activo   { background: var(--success-light); color: var(--success); }
    .badge--inactivo { background: var(--gray-100); color: var(--gray-500); }
  `]
})
export class StatusBadgeComponent {
  value = input.required<string | boolean>();
  type = input<BadgeType>('estado');

  protected readonly config = computed(() => {
    const key = String(this.value());
    return BADGE_CONFIG[key] ?? { label: key, cssClass: '' };
  });

  protected readonly label = computed(() => this.config().label);
  protected readonly cssClass = computed(() => 'badge ' + this.config().cssClass);
}
