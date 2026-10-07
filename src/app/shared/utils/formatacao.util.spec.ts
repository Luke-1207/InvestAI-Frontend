import { formatarData, formatarMoeda, formatarNumero, formatarPercentual } from './formatacao.util';

describe('formatacao.util', () => {
  it('formatarNumero deve usar ponto no milhar e vírgula nos decimais', () => {
    expect(formatarNumero(1038.42)).toBe('1.038,42');
    expect(formatarNumero(38)).toBe('38,00');
    expect(formatarNumero(1234567.891)).toBe('1.234.567,89');
  });

  it('formatarNumero deve respeitar a quantidade de casas decimais', () => {
    expect(formatarNumero(134820.5, 0)).toBe('134.821');
    expect(formatarNumero(1.2345, 3)).toBe('1,235');
  });

  it('formatarMoeda deve prefixar R$ no padrão brasileiro', () => {
    expect(formatarMoeda(1038.42)).toBe('R$ 1.038,42');
    expect(formatarMoeda(0)).toBe('R$ 0,00');
  });

  it('formatarPercentual deve formatar com vírgula e, se pedido, com sinal', () => {
    expect(formatarPercentual(13.75)).toBe('13,75%');
    expect(formatarPercentual(1.5, true)).toBe('+1,50%');
    expect(formatarPercentual(0, true)).toBe('+0,00%');
    expect(formatarPercentual(-0.42, true)).toBe('-0,42%');
  });

  it('formatarData deve manter o dia de uma data sem horário, sem recuar por fuso', () => {
    expect(formatarData('2027-05-31')).toBe('31/05/2027');
    expect(formatarData('2029-01-01')).toBe('01/01/2029');
  });

  it('formatarData deve aceitar data com horário', () => {
    expect(formatarData('2026-10-06T15:30:00')).toBe('06/10/2026');
  });

  it('deve devolver um traço quando o valor não existe', () => {
    expect(formatarNumero(null)).toBe('—');
    expect(formatarMoeda(undefined)).toBe('—');
    expect(formatarPercentual(Number.NaN)).toBe('—');
    expect(formatarData(null)).toBe('—');
    expect(formatarData('data-invalida')).toBe('—');
  });
});
