import { FormControl } from '@angular/forms';
import { apenasDigitos, formatarTelefone, telefoneValidator } from './telefone.util';

describe('telefone.util', () => {
  it('apenasDigitos deve remover tudo que não é número', () => {
    expect(apenasDigitos('(19) 99999-8888')).toBe('19999998888');
    expect(apenasDigitos(null)).toBe('');
  });

  it('formatarTelefone deve formatar celular (11) e fixo (10)', () => {
    expect(formatarTelefone('19999998888')).toBe('(19) 99999-8888');
    expect(formatarTelefone('1933334444')).toBe('(19) 3333-4444');
  });

  it('formatarTelefone com valor nulo deve devolver vazio', () => {
    expect(formatarTelefone(null)).toBe('');
  });

  it('telefoneValidator deve aceitar vazio, 10 e 11 dígitos em qualquer formatação', () => {
    expect(telefoneValidator(new FormControl(''))).toBeNull();
    expect(telefoneValidator(new FormControl('(19) 3333-4444'))).toBeNull();
    expect(telefoneValidator(new FormControl('19 99999 8888'))).toBeNull();
  });

  it('telefoneValidator deve rejeitar quantidade errada de dígitos', () => {
    expect(telefoneValidator(new FormControl('99999-8888'))).toEqual({ telefoneInvalido: true });
    expect(telefoneValidator(new FormControl('119999988887'))).toEqual({ telefoneInvalido: true });
  });
});
