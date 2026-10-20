export type PapelUsuario = 'USUARIO' | 'GESTOR';

export interface UsuarioGestao {
  id: string;
  nome: string;
  email: string;
  role: PapelUsuario;
  ativo: boolean;
  perfilPreenchido: boolean;
  criadoEm: string;
  atualizadoEm: string;
  deletadoEm: string | null;
}

export interface FiltroUsuarios {
  busca: string;
  role: PapelUsuario | null;
  ativo: boolean | null;
  pagina: number;
}

export const TAMANHO_PAGINA_USUARIOS = 20;

export const ROTULO_PAPEL: Record<PapelUsuario, string> = {
  USUARIO: 'Investidor',
  GESTOR: 'Gestor',
};

export interface SelicIpca {
  selicAtual: number;
  ipcaAcumulado12m: number;
}
