import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { ConfirmDialogService } from '../../shared/components/confirm-dialog/confirm-dialog.component';

export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) => {
  if (component.hasUnsavedChanges()) {
    const confirmDialog = inject(ConfirmDialogService);
    return confirmDialog.confirm({
      title: 'Cambios sin guardar',
      message: 'Tiene cambios sin guardar. ¿Esta seguro de que desea salir? Los cambios se perderan.',
      confirmText: 'Salir',
      cancelText: 'Quedarse',
      type: 'warning'
    });
  }
  return true;
};
