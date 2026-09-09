import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function senhasIguaisValidator(campoSenha: string, campoConfirmacao: string): ValidatorFn {
  return (grupo: AbstractControl): ValidationErrors | null => {
    const senha = grupo.get(campoSenha)?.value;
    const confirmacao = grupo.get(campoConfirmacao)?.value;

    if (!senha || !confirmacao) {
      return null;
    }

    return senha === confirmacao ? null : { senhasDiferentes: true };
  };
}
