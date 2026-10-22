import { RotuloPipe } from './rotulo.pipe';

describe('RotuloPipe', () => {
  const pipe = new RotuloPipe();

  it('deve trocar o código da API pelo texto legível', () => {
    expect(pipe.transform('ACAO')).toBe('Ação');
    expect(pipe.transform('TESOURO')).toBe('Tesouro Direto');
    expect(pipe.transform('NO_VENCIMENTO')).toBe('No vencimento');
  });

  it('deve devolver vazio para valor ausente', () => {
    expect(pipe.transform(null)).toBe('');
  });
});
