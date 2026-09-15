import { Compatibilidade } from './compatibilidade';

export type CategoriaRendaFixa = 'TESOURO' | 'CDB' | 'LCI' | 'LCA';

export interface RendaFixaListagem {
  id: string;
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
