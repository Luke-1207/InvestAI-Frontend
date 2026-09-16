import { Compatibilidade } from './compatibilidade';

export type CategoriaRendaFixa = 'TESOURO' | 'CDB' | 'LCI' | 'LCA';

export interface RendaFixaListagem {
  id: string;
  codigo: string | null;
  categoria: CategoriaRendaFixa;
  nome: string;
  indexador: string;
  taxa: number;
  vencimento: string;
  valorMinimo: number;
  liquidez: string;
  isentoIr: boolean;
  garantidoFgc: boolean;
  score: number | null;
  compatibilidade: Compatibilidade | null;
  justificativa: string | null;
}

export interface RentabilidadeEstimada {
  taxaBrutaAnual: number;
  aliquotaIR: number;
  taxaLiquidaAnual: number;
}

export interface TituloPrivadoDetalhe {
  id: string;
  tipo: 'CDB' | 'LCI' | 'LCA';
  emissor: string;
  indexador: string;
  taxaPercentual: number;
  vencimento: string;
  investimentoMinimo: number;
  liquidez: string;
  garantidoFgc: boolean;
  isentoIr: boolean;
  rentabilidadeEstimada: RentabilidadeEstimada;
  resumoIA: string;
}

export interface TituloTesouroDetalhe {
  codigo: string;
  nome: string;
  tipo: { valor: string; descricao: string };
  taxaAnual: number;
  precoMinimo: number;
  vencimento: string;
  pagaJurosSemestrais: boolean;
  liquidez: string;
  resumoIA: string;
}

export interface DetalheRendaFixaNormalizado {
  identificador: string;
  categoria: CategoriaRendaFixa;
  nomeOuEmissor: string;
  indexadorOuTipo: string;
  taxaBrutaAnual: number;
  aliquotaIR: number;
  taxaLiquidaAnual: number;
  vencimento: string;
  investimentoMinimo: number;
  liquidez: string;
  isentoIr: boolean;
  garantiaLabel: string | null;
  resumoIA: string;
}
