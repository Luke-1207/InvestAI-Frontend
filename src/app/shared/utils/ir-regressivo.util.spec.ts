import { calcularAliquotaIR, calcularTaxaLiquida } from './ir-regressivo.util';

function dataDaquiA(dias: number): string {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  return data.toISOString();
}

describe('calcularAliquotaIR', () => {
  it('deve retornar 22.5% pra vencimento em até 180 dias', () => {
    expect(calcularAliquotaIR(dataDaquiA(100))).toBe(22.5);
  });

  it('deve retornar 20% pra vencimento entre 181 e 360 dias', () => {
    expect(calcularAliquotaIR(dataDaquiA(300))).toBe(20.0);
  });

  it('deve retornar 17.5% pra vencimento entre 361 e 720 dias', () => {
    expect(calcularAliquotaIR(dataDaquiA(700))).toBe(17.5);
  });

  it('deve retornar 15% pra vencimento acima de 720 dias', () => {
    expect(calcularAliquotaIR(dataDaquiA(2000))).toBe(15.0);
  });
});

describe('calcularTaxaLiquida', () => {
  it('deve aplicar o desconto de IR corretamente sobre a taxa bruta', () => {
    expect(calcularTaxaLiquida(10, 20)).toBe(8);
  });

  it('sem alíquota (0%) a taxa líquida deve ser igual à bruta', () => {
    expect(calcularTaxaLiquida(10, 0)).toBe(10);
  });
});
