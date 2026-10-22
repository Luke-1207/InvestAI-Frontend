import { rotulo } from './rotulos.util';

describe('rotulos.util', () => {
  it('deve traduzir os tipos de ativo', () => {
    expect(rotulo('ACAO')).toBe('Ação');
    expect(rotulo('FII')).toBe('FII');
    expect(rotulo('ETF')).toBe('ETF');
    expect(rotulo('TESOURO')).toBe('Tesouro Direto');
    expect(rotulo('CDB')).toBe('CDB');
    expect(rotulo('LCI')).toBe('LCI');
    expect(rotulo('LCA')).toBe('LCA');
  });

  it('deve traduzir indexadores e liquidez', () => {
    expect(rotulo('SELIC')).toBe('Selic');
    expect(rotulo('PREFIXADO')).toBe('Prefixado');
    expect(rotulo('CDI')).toBe('CDI');
    expect(rotulo('DIARIA')).toBe('Diária');
    expect(rotulo('NO_VENCIMENTO')).toBe('No vencimento');
  });

  it('deve deixar legível um código que ainda não tem tradução', () => {
    expect(rotulo('RENDA_PASSIVA')).toBe('Renda passiva');
  });

  it('não deve alterar um texto que já é legível', () => {
    expect(rotulo('Energia Elétrica')).toBe('Energia Elétrica');
    expect(rotulo('Tesouro Selic')).toBe('Tesouro Selic');
  });

  it('deve devolver vazio quando não há valor', () => {
    expect(rotulo(null)).toBe('');
    expect(rotulo(undefined)).toBe('');
    expect(rotulo('')).toBe('');
  });
});
