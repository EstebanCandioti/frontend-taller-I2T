import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="empty-state">
      <span class="material-icon empty-icon">{{ icon() }}</span>
      <h3 class="empty-title">{{ title() }}</h3>
      @if (message()) {
        <p class="empty-message">{{ message() }}</p>
      }
      @if (actionLabel()) {
        <button class="empty-action" (click)="action.emit()">
          {{ actionLabel() }}
        </button>
      }
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1.5rem;
      text-align: center;
    }

    .empty-icon {
      font-family: 'Material Symbols Outlined', 'Material Icons';
      font-size: 48px;
      color: var(--gray-300);
      margin-bottom: 1rem;
    }

    .empty-title {
      font-size: 1rem;
      font-weight: 500;
      color: var(--gray-700);
      margin: 0 0 0.25rem;
    }

    .empty-message {
      font-size: 0.875rem;
      color: var(--gray-500);
      margin: 0 0 1.25rem;
      max-width: 320px;
    }

    .empty-action {
      padding: 0.5rem 1rem;
      background: var(--primary);
      color: #fff;
      border: none;
      border-radius: var(--border-radius);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: background var(--transition-fast);

      &:hover {
        background: var(--primary-dark);
      }
    }
  `]
})
export class EmptyStateComponent {
  icon = input('inbox');
  title = input('Sin resultados');
  message = input('');
  actionLabel = input('');
  action = output<void>();
}
