import { ValorDescrito } from './quiz';
import { Compatibilidade } from './compatibilidade';

export interface IndicadoresMercado {
  ibovespaPontos: number;
  ibovespaVariacaoDia: number;
  dolarValor: number;
  dolarVariacaoDia: number;
  euroValor: number;
  euroVariacaoDia: number;
  selicAtual: number;
  ipcaAcumulado12m: number;
  sincronizadoEm: string;
  selicIpcaSincronizadoEm: string;
}

export interface SugestaoAtivoItem {
  codigo: string;
  nome: string;
  tipo: 'ACAO' | 'FII' | 'ETF';
  setor: string;
  preco: number;
  variacaoDia: number;
  dy: number;
  score: number;
  compatibilidade: Compatibilidade;
  justificativa: string;
}

export interface SugestaoRendaFixaItem {
  id: string;
  categoria: 'TESOURO' | 'CDB' | 'LCI' | 'LCA';
  nome: string;
  taxa: number;
  vencimento: string;
  score: number;
  compatibilidade: Compatibilidade;
  justificativa: string;
}

export interface SugestoesRendaVariavel {
  itens: SugestaoAtivoItem[];
  mensagem: string | null;
}

export interface SugestoesRendaFixa {
  itens: SugestaoRendaFixaItem[];
  mensagem: string | null;
}

export interface Perfil {
  perfilRisco: ValorDescrito;
  objetivoFinanceiro: ValorDescrito;
  horizonteInvestimento: ValorDescrito;
  valorDisponivel: number;
  tiposAceitos: string[];
  setoresPreferidos: { setor: string; preferencia: 'PREFERIR' | 'EVITAR' }[];
  perfilPreenchido: boolean;
  resumoIA: string;
  atualizadoEm: string;
}

export interface DashboardResponse {
  indicadoresMercado: IndicadoresMercado;
  sugestoesRendaVariavel: SugestoesRendaVariavel;
  sugestoesRendaFixa: SugestoesRendaFixa;
  perfil: Perfil;
  geradoEm: string;
}
