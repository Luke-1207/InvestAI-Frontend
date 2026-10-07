const LOCALE = 'pt-BR';
const VALOR_AUSENTE = '—';

type Numero = number | null | undefined;

function ausente(valor: Numero): valor is null | undefined {
  return valor === null || valor === undefined || Number.isNaN(valor);
}

export function formatarNumero(valor: Numero, casasDecimais = 2): string {
  if (ausente(valor)) return VALOR_AUSENTE;
  return valor.toLocaleString(LOCALE, {
    minimumFractionDigits: casasDecimais,
    maximumFractionDigits: casasDecimais,
  });
}

export function formatarMoeda(valor: Numero): string {
  if (ausente(valor)) return VALOR_AUSENTE;
  return `R$ ${formatarNumero(valor)}`;
}

export function formatarPercentual(valor: Numero, comSinal = false): string {
  if (ausente(valor)) return VALOR_AUSENTE;
  const sinal = comSinal && valor >= 0 ? '+' : '';
  return `${sinal}${formatarNumero(valor)}%`;
}

export function formatarData(valor: string | null | undefined): string {
  if (!valor) return VALOR_AUSENTE;
  const somenteData = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  const data = somenteData
    ? new Date(Number(somenteData[1]), Number(somenteData[2]) - 1, Number(somenteData[3]))
    : new Date(valor);
  return Number.isNaN(data.getTime()) ? VALOR_AUSENTE : data.toLocaleDateString(LOCALE);
}
