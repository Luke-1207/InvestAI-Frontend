import { TipoAtivoFavorito } from './favorito';

export type TipoNotificacao =
  | 'VARIACAO_ALTA'
  | 'VARIACAO_BAIXA'
  | 'DY_ALTO'
  | 'PRECO_MINIMO_52S'
  | 'TITULO_VENCENDO'
  | 'PERFIL_ALTERADO'
  | 'SISTEMA';

export interface Notificacao {
  id: string;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  tipoAtivo: TipoAtivoFavorito | null;
  ativoId: string | null;
  codigoAtivo: string | null;
  lida: boolean;
  lidaEm: string | null;
  criadoEm: string;
}

export interface ComunicadoSistema {
  titulo: string;
  mensagem: string;
}
