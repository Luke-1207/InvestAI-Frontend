import { AbstractControl, ValidationErrors } from '@angular/forms';

export function apenasDigitos(valor: string | null | undefined): string {
  return (valor ?? '').replace(/\D/g, '');
}

export function formatarTelefone(digitos: string | null | undefined): string {
  const d = apenasDigitos(digitos);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return d;
}

export function telefoneValidator(controle: AbstractControl): ValidationErrors | null {
  const digitos = apenasDigitos(controle.value);
  if (digitos.length === 0 || digitos.length === 10 || digitos.length === 11) return null;
  return { telefoneInvalido: true };
}
