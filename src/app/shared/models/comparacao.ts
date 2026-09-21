import { Compatibilidade } from './compatibilidade';

export type TipoItemComparacao = 'ACAO' | 'FII' | 'ETF' | 'TESOURO' | 'CDB' | 'LCI' | 'LCA';

export interface ItemSelecionavel {
  tipo: TipoItemComparacao;
  identificador: string;
  rotulo: string;
  subRotulo: string;
}

export interface MetricaComparacao {
  rotulo: string;
  valor: string;
}

export interface ItemComparacao {
  tipo: TipoItemComparacao;
  identificador: string;
  rotulo: string;
  categoria: string;
  metricas: MetricaComparacao[];
  score: number | null;
  compatibilidade: Compatibilidade | null;
}

export interface VereditoComparacao {
  veredito: string;
}
