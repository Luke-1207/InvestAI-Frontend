import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';

export function textoObrigatorio(controle: AbstractControl): ValidationErrors | null {
  const valor = controle.value;
  return typeof valor === 'string' && valor.trim().length > 0 ? null : { required: true };
}

export function tamanhoDoTexto(minimo: number, maximo: number): ValidatorFn {
  return (controle) => {
    const valor = typeof controle.value === 'string' ? controle.value.trim() : '';
    if (!valor) return null;
    if (valor.length < minimo) return { minlength: { requiredLength: minimo } };
    if (valor.length > maximo) return { maxlength: { requiredLength: maximo } };
    return null;
  };
}

export function numeroPositivo(controle: AbstractControl): ValidationErrors | null {
  const valor = controle.value;
  if (valor === null || valor === undefined || valor === '') return { required: true };
  return typeof valor === 'number' && Number.isFinite(valor) && valor > 0 ? null : { positivo: true };
}

export function numeroObrigatorio(controle: AbstractControl): ValidationErrors | null {
  const valor = controle.value;
  if (valor === null || valor === undefined || valor === '') return { required: true };
  return typeof valor === 'number' && Number.isFinite(valor) ? null : { numero: true };
}

export function hojeIso(): string {
  const hoje = new Date();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${hoje.getFullYear()}-${mes}-${dia}`;
}

export function dataFutura(controle: AbstractControl): ValidationErrors | null {
  const valor = controle.value;
  if (!valor) return { required: true };
  return valor > hojeIso() ? null : { futura: true };
}

export function semRepeticao(existentes: () => Iterable<string>, normalizar: (valor: string) => string): ValidatorFn {
  return (controle) => {
    const valor = typeof controle.value === 'string' ? normalizar(controle.value) : '';
    if (!valor) return null;
    for (const existente of existentes()) {
      if (normalizar(existente) === valor) return { repetido: true };
    }
    return null;
  };
}

export function aplicarErrosDoServidor(formulario: FormGroup, erros: Record<string, string>): boolean {
  let aplicou = false;
  for (const [campo, mensagem] of Object.entries(erros)) {
    const controle = formulario.get(campo);
    if (!controle) continue;
    controle.setErrors({ ...(controle.errors ?? {}), servidor: mensagem });
    controle.markAsTouched();
    aplicou = true;
  }
  return aplicou;
}

export function focarPrimeiroInvalido(raiz: HTMLElement): void {
  raiz.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
}
