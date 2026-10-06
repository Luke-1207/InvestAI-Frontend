import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const TAMANHO_MINIMO_SENHA = 8;

export function trocaSenhaOpcionalValidator(): ValidatorFn {
  return (grupo: AbstractControl): ValidationErrors | null => {
    const senhaAtual = (grupo.get('senhaAtual')?.value ?? '') as string;
    const novaSenha = (grupo.get('novaSenha')?.value ?? '') as string;
    const confirmacao = (grupo.get('confirmarNovaSenha')?.value ?? '') as string;

    if (!senhaAtual && !novaSenha && !confirmacao) return null;

    const erros: ValidationErrors = {};
    if (!senhaAtual) erros['senhaAtualObrigatoria'] = true;
    if (!novaSenha) erros['novaSenhaObrigatoria'] = true;
    else if (novaSenha.length < TAMANHO_MINIMO_SENHA) erros['novaSenhaCurta'] = true;
    if (novaSenha && confirmacao !== novaSenha) erros['senhasDiferentes'] = true;

    return Object.keys(erros).length ? erros : null;
  };
}
