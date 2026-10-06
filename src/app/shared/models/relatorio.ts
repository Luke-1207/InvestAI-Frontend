export type TipoRelatorio = 'ATIVO_INDIVIDUAL' | 'LISTAGEM' | 'PERFIL';
export type ModuloRelatorio = 'VARIAVEL' | 'FIXA' | 'AMBOS';
export type TipoRelatorioAtivo = 'VARIAVEL' | 'FIXA';

export const LIMITE_ATIVOS_RELATORIO = 50;

export interface HistoricoRelatorio {
  id: string;
  tipo: TipoRelatorio;
  referencia: string;
  geradoEm: string;
}

export interface RelatorioListagemRequest {
  modulo: ModuloRelatorio;
  filtros?: Record<string, string>;
  ativos?: string[];
}
