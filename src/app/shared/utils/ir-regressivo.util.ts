export function calcularAliquotaIR(vencimentoIso: string): number {
  const hoje = new Date();
  const vencimento = new Date(vencimentoIso);
  const diasParaVencimento = Math.floor(
    (vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diasParaVencimento <= 180) return 22.5;
  if (diasParaVencimento <= 360) return 20.0;
  if (diasParaVencimento <= 720) return 17.5;
  return 15.0;
}

export function calcularTaxaLiquida(taxaBrutaAnual: number, aliquotaIR: number): number {
  const fatorLiquido = 1 - aliquotaIR / 100;
  return Math.round(taxaBrutaAnual * fatorLiquido * 100) / 100;
}
