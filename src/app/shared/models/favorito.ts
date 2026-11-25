export type TipoAtivoFavorito = 'ACAO_FII_ETF' | 'TITULO_TESOURO' | 'TITULO_PRIVADO';

export type TipoAlerta = 'VARIACAO_ALTA' | 'VARIACAO_BAIXA' | 'TITULO_VENCENDO';

export interface Favorito {
  id: string;
  tipoAtivo: TipoAtivoFavorito;
  ativoId: string;
  codigo: string | null;
  nome: string | null;
  alertasAtivos: boolean;
  tiposAlertaAtivos: TipoAlerta[] | null;
  tiposAlertaDisponiveis: TipoAlerta[];
  limiarVariacao: number;
  criadoEm: string;
}

export interface FavoritoStatus {
  favoritado: boolean;
  favoritoId: string | null;
}

export interface ReferenciaAtivo {
  tipoAtivo: TipoAtivoFavorito;
  codigo?: string;
  ativoId?: string;
}

export interface ConfiguracaoAlertas {
  alertasAtivos: boolean;
  tiposAlertaAtivos: TipoAlerta[] | null;
  limiarVariacao?: number;
}

export const LIMITE_FAVORITOS = 50;

export function rotaDoAtivo(tipo: TipoAtivoFavorito, codigo: string | null, ativoId: string | null): string[] | null {
  if (tipo === 'ACAO_FII_ETF') return codigo ? ['/renda-variavel', codigo] : null;
  if (tipo === 'TITULO_TESOURO') return codigo ? ['/renda-fixa', codigo] : null;
  return ativoId ? ['/renda-fixa', ativoId] : null;
}
