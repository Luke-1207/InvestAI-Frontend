import { FormControl, FormGroup } from '@angular/forms';
import {
  aplicarErrosDoServidor,
  dataFutura,
  hojeIso,
  numeroPositivo,
  semRepeticao,
  tamanhoDoTexto,
  textoObrigatorio,
} from './validacoes-gestao';

describe('validacoes-gestao', () => {
  it('textoObrigatorio deve recusar texto vazio ou só com espaços, como o @NotBlank da API', () => {
    expect(textoObrigatorio(new FormControl(''))).toEqual({ required: true });
    expect(textoObrigatorio(new FormControl('   '))).toEqual({ required: true });
    expect(textoObrigatorio(new FormControl('Vale'))).toBeNull();
  });

  it('tamanhoDoTexto deve medir o texto sem os espaços das pontas', () => {
    const validador = tamanhoDoTexto(2, 5);
    expect(validador(new FormControl(' a '))).toEqual({ minlength: { requiredLength: 2 } });
    expect(validador(new FormControl('abcdef'))).toEqual({ maxlength: { requiredLength: 5 } });
    expect(validador(new FormControl('  abcde  '))).toBeNull();
    expect(validador(new FormControl(''))).toBeNull();
  });

  it('numeroPositivo deve pedir um número maior que zero, como o @Positive da API', () => {
    expect(numeroPositivo(new FormControl(null))).toEqual({ required: true });
    expect(numeroPositivo(new FormControl(0))).toEqual({ positivo: true });
    expect(numeroPositivo(new FormControl(-1))).toEqual({ positivo: true });
    expect(numeroPositivo(new FormControl(0.01))).toBeNull();
  });

  it('dataFutura deve aceitar só datas depois de hoje, como o @Future da API', () => {
    expect(dataFutura(new FormControl(''))).toEqual({ required: true });
    expect(dataFutura(new FormControl(hojeIso()))).toEqual({ futura: true });
    expect(dataFutura(new FormControl('2020-01-01'))).toEqual({ futura: true });
    expect(dataFutura(new FormControl('2999-12-31'))).toBeNull();
  });

  it('semRepeticao deve comparar já normalizado', () => {
    const validador = semRepeticao(() => ['PETR4', 'VALE3'], (v) => v.trim().toUpperCase());
    expect(validador(new FormControl(' petr4 '))).toEqual({ repetido: true });
    expect(validador(new FormControl('ITUB4'))).toBeNull();
  });

  it('aplicarErrosDoServidor deve marcar os campos que a API recusou', () => {
    const formulario = new FormGroup({ nome: new FormControl('x'), setor: new FormControl('') });

    const aplicou = aplicarErrosDoServidor(formulario, { nome: 'Nome deve ter entre 2 e 150 caracteres', outro: 'x' });

    expect(aplicou).toBeTrue();
    expect(formulario.controls.nome.errors).toEqual({ servidor: 'Nome deve ter entre 2 e 150 caracteres' });
    expect(formulario.controls.nome.touched).toBeTrue();
    expect(formulario.controls.setor.errors).toBeNull();
    expect(aplicarErrosDoServidor(formulario, { inexistente: 'x' })).toBeFalse();
  });
});
