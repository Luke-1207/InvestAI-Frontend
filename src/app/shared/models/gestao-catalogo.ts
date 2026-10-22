import { TipoAtivo } from './acao';

export type TipoTituloPrivado = 'CDB' | 'LCI' | 'LCA';
export type IndexadorTitulo = 'CDI' | 'IPCA' | 'PREFIXADO' | 'SELIC';
export type LiquidezTitulo = 'DIARIA' | 'NO_VENCIMENTO';
export type FiltroStatus = 'TODOS' | 'ATIVOS' | 'INATIVOS';

export interface AtivoGestao {
  id: string;
  codigo: string;
  nome: string;
  tipo: TipoAtivo;
  setor: string | null;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CadastroAtivo {
  codigo: string;
  nome: string;
  tipo: TipoAtivo;
  setor: string | null;
}

export interface AtualizacaoAtivo {
  nome: string;
  tipo: TipoAtivo;
  setor: string | null;
  ativo: boolean;
}

export interface TituloGestao {
  id: string;
  tipo: TipoTituloPrivado;
  emissor: string;
  indexador: IndexadorTitulo;
  taxaPercentual: number;
  vencimento: string;
  investimentoMinimo: number;
  liquidez: LiquidezTitulo;
  garantidoFgc: boolean;
  isentoIr: boolean;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface DadosTitulo {
  tipo: TipoTituloPrivado;
  emissor: string;
  indexador: IndexadorTitulo;
  taxaPercentual: number;
  vencimento: string;
  investimentoMinimo: number;
  liquidez: LiquidezTitulo;
  garantidoFgc: boolean;
  isentoIr: boolean;
}

export const OPCOES_FILTRO_STATUS: { valor: FiltroStatus; rotulo: string }[] = [
  { valor: 'TODOS', rotulo: 'Todos' },
  { valor: 'ATIVOS', rotulo: 'Ativos' },
  { valor: 'INATIVOS', rotulo: 'Inativos' },
];

export function passaNoFiltroStatus(ativo: boolean, filtro: FiltroStatus): boolean {
  if (filtro === 'ATIVOS') return ativo;
  if (filtro === 'INATIVOS') return !ativo;
  return true;
}

export function textoPesquisavel(...partes: (string | null | undefined)[]): string {
  return partes
    .filter(Boolean)
    .join(' ')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
}
