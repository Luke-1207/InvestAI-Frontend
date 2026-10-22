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

export type ChaveIntegracao = 'MICROSSERVICO_IA' | 'RABBITMQ' | 'LLM' | 'HG_BRASIL' | 'TESOURO_DIRETO' | 'BANCO_CENTRAL';
export type SituacaoIntegracao = 'OPERACIONAL' | 'DESATUALIZADA' | 'FORA_DO_AR' | 'SEM_DADOS' | 'DESCONHECIDA';

export interface StatusIntegracao {
  chave: ChaveIntegracao;
  nome: string;
  situacao: SituacaoIntegracao;
  simulado: boolean;
  detalhe: string | null;
  ultimoSucessoEm: string | null;
  ultimaFalhaEm: string | null;
  ultimoErro: string | null;
}

export interface SaudeIntegracoes {
  integracoes: StatusIntegracao[];
  verificadoEm: string;
}

export const ROTULOS_SITUACAO_INTEGRACAO: Record<SituacaoIntegracao, string> = {
  OPERACIONAL: 'Operacional',
  DESATUALIZADA: 'Desatualizada',
  FORA_DO_AR: 'Fora do ar',
  SEM_DADOS: 'Sem dados ainda',
  DESCONHECIDA: 'Sem como verificar',
};

export function integracaoComProblema(integracao: StatusIntegracao): boolean {
  return integracao.situacao === 'FORA_DO_AR' || integracao.situacao === 'DESATUALIZADA';
}
