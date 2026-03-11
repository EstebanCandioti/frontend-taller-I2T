import { Component, Injectable, signal } from '@angular/core';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  readonly visible = signal(false);
  readonly data = signal<ConfirmDialogData>({ title: '', message: '' });

  private resolveRef?: (value: boolean) => void;

  confirm(data: ConfirmDialogData): Promise<boolean> {
    this.data.set(data);
    this.visible.set(true);
    return new Promise<boolean>(resolve => {
      this.resolveRef = resolve;
    });
  }

  accept(): void {
    this.visible.set(false);
    this.resolveRef?.(true);
  }

  cancel(): void {
    this.visible.set(false);
    this.resolveRef?.(false);
  }
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss'
})
export class ConfirmDialogComponent {
  constructor(readonly dialog: ConfirmDialogService) {}
}
