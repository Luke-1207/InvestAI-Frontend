import { ValorDescrito } from './quiz';
import { TipoAtivo } from './acao';

export type PreferenciaSetor = 'PREFERIR' | 'EVITAR';

export interface SetorPreferido {
  setor: string;
  preferencia: PreferenciaSetor;
}

export interface EditarPerfilRequest {
  perfilRisco: string;
  objetivoFinanceiro: string;
  horizonteInvestimento: string;
  valorDisponivel: number;
  tiposAceitos: TipoAtivo[];
  setoresPreferidos: SetorPreferido[];
}

export interface PerfilResponse {
  perfilRisco: ValorDescrito;
  objetivoFinanceiro: ValorDescrito;
  horizonteInvestimento: ValorDescrito;
  valorDisponivel: number;
  tiposAceitos: TipoAtivo[];
  setoresPreferidos: SetorPreferido[];
  perfilPreenchido: boolean;
  resumoIA: string;
  atualizadoEm: string;
}
