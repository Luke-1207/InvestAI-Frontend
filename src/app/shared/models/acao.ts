export type TipoAtivo = 'ACAO' | 'FII' | 'ETF';

export interface AcaoListagem {
  id: string;
  codigo: string;
  nome: string;
  tipo: TipoAtivo;
  setor: string;
  preco: number;
  variacaoPercentual: number;
  dividendYield: number;
  precoValorPatrimonial: number;
  volume: number;
  cotacaoDisponivel: boolean;
}

export interface AcaoListagemFiltro {
  tipo?: TipoAtivo[];
  setor?: string;
  dyMinimo?: number;
  precoMaximo?: number;
  ordenarPor?: 'DY' | 'PRECO' | 'VARIACAO_DIA' | 'NOME';
  ordem?: 'ASC' | 'DESC';
  pagina?: number;
  tamanho?: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface PontoHistorico {
  data: string;
  abertura: number;
  fechamento: number;
  maxima: number;
  minima: number;
  volume: number;
}

export interface AcaoDetalhe {
  id: string;
  codigo: string;
  nome: string;
  tipo: TipoAtivo;
  setor: string;
  ativo: boolean;
  cotacaoDisponivel: boolean;
  preco: number;
  variacaoPercentual: number;
  variacaoPreco: number;
  dividendYield: number;
  precoValorPatrimonial: number;
  precoLucro: number | null;
  volume: number;
  cotacaoAtualizadaEm: string;
  fonteCotacao: string;
  minimo52Semanas: number;
  maximo52Semanas: number;
  periodoGrafico: string;
  pontosGrafico: PontoHistorico[];
  glossario: Record<string, string>;
}
