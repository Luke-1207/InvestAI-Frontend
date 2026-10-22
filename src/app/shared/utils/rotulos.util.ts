const ROTULOS: Record<string, string> = {
  ACAO: 'Ação',
  FII: 'FII',
  ETF: 'ETF',
  TESOURO: 'Tesouro Direto',
  CDB: 'CDB',
  LCI: 'LCI',
  LCA: 'LCA',
  SELIC: 'Selic',
  CDI: 'CDI',
  IPCA: 'IPCA',
  PREFIXADO: 'Prefixado',
  DIARIA: 'Diária',
  NO_VENCIMENTO: 'No vencimento',
  CONSERVADOR: 'Conservador',
  MODERADO: 'Moderado',
  ARROJADO: 'Arrojado',
  VARIAVEL: 'Renda Variável',
  FIXA: 'Renda Fixa',
};

export function rotulo(valor: string | null | undefined): string {
  if (!valor) return '';
  return ROTULOS[valor] ?? legivel(valor);
}

function legivel(valor: string): string {
  if (!/^[A-Z0-9_]+$/.test(valor)) return valor;
  const texto = valor.replace(/_/g, ' ').toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
