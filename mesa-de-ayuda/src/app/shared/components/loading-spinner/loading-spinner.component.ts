import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    <div class="spinner-wrapper" [class.overlay]="overlay()">
      <div class="spinner" [style.width.px]="size()" [style.height.px]="size()"></div>
      @if (message()) {
        <span class="spinner-message">{{ message() }}</span>
      }
    </div>
  `,
  styles: [`
    .spinner-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 2rem;

      &.overlay {
        position: absolute;
        inset: 0;
        background: rgba(255, 255, 255, 0.8);
        z-index: 10;
      }
    }

    .spinner {
      border: 3px solid var(--gray-200);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    .spinner-message {
      font-size: 0.875rem;
      color: var(--gray-500);
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class LoadingSpinnerComponent {
  size = input(32);
  message = input('');
  overlay = input(false);
}
