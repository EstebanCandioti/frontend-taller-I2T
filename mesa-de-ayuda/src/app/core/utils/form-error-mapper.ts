import { FormGroup } from '@angular/forms';

/**
 * Mapea errores de validacion del backend (ApiResponse.errors)
 * a los controles del formulario Angular.
 * Los errores se limpian automaticamente cuando el usuario modifica el campo.
 */
export function mapBackendErrors(
  form: FormGroup,
  errors: { [campo: string]: string }
): void {
  Object.keys(errors).forEach(campo => {
    const control = form.get(campo);
    if (control) {
      control.setErrors({ serverError: errors[campo] });
      control.markAsTouched();
    }
  });
}

/**
 * Hace scroll al primer campo con error visible en el formulario y le da foco.
 */
export function scrollToFirstError(delay = 100): void {
  setTimeout(() => {
    const firstInvalid = document.querySelector(
      'input.ng-invalid, select.ng-invalid, textarea.ng-invalid'
    );
    if (firstInvalid) {
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (firstInvalid as HTMLElement).focus();
    }
  }, delay);
}
