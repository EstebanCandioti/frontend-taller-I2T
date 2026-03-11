import { ErrorHandler, Injectable, inject, NgZone } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from '../services/toast.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly toast = inject(ToastService);
  private readonly zone = inject(NgZone);

  handleError(error: unknown): void {
    // Los HttpErrorResponse se manejan en el interceptor, no duplicar
    if (error instanceof HttpErrorResponse) {
      return;
    }

    // Extraer HttpErrorResponse de errores wrapeados por Angular
    const httpError = this.extractHttpError(error);
    if (httpError) {
      return;
    }

    console.error('Error no manejado:', error);
    this.zone.run(() => {
      this.toast.error('Ocurrió un error inesperado.');
    });
  }

  private extractHttpError(error: unknown): HttpErrorResponse | null {
    if (error && typeof error === 'object' && 'rejection' in error) {
      const rejection = (error as { rejection: unknown }).rejection;
      if (rejection instanceof HttpErrorResponse) {
        return rejection;
      }
    }
    return null;
  }
}
