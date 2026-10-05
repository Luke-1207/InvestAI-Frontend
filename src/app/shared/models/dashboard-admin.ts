export type PerfilRiscoChave = 'CONSERVADOR' | 'MODERADO' | 'ARROJADO';
export type CategoriaAtivoAdmin = 'ACAO' | 'FII' | 'ETF' | 'CDB' | 'LCI' | 'LCA' | 'TESOURO';
export type NivelUrgencia = 'ALTA' | 'MEDIA' | 'BAIXA';

export interface TituloVencendo {
  id: string;
  tipo: 'CDB' | 'LCI' | 'LCA';
  emissor: string;
  vencimento: string;
  diasParaVencimento: number;
  urgencia: NivelUrgencia;
}

export interface DashboardAdminResponse {
  totalUsuarios: number;
  novosUsuariosUltimos30Dias: number;
  usuariosComPerfilPreenchido: number;
  distribuicaoRisco: Record<PerfilRiscoChave, number>;
  distribuicaoAtivosPorCategoria: Record<CategoriaAtivoAdmin, number>;
  titulosVencendoEm30Dias: number;
  titulosVencendo: TituloVencendo[];
  ultimaSincronizacaoTesouro: string | null;
  iaDisponivel: boolean;
  iaRabbitmqConectado: boolean | null;
  geradoEm: string;
}

export interface StatusIa {
  disponivel: boolean;
  rabbitmqConectado: boolean | null;
  verificadoEm: string;
}
