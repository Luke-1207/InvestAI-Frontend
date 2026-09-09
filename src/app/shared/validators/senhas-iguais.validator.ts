import { AbstractControl, ValidationErrors } from '@angular/forms';

export function senhasIguaisValidator(grupo: AbstractControl): ValidationErrors | null {
  const senha = grupo.get('senha')?.value;
  const confirmarSenha = grupo.get('confirmarSenha')?.value;

  if (!senha || !confirmarSenha) {
    return null;
  }

  return senha === confirmarSenha ? null : { senhasDiferentes: true };
}
