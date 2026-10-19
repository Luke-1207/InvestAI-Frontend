import { TipoAtivo } from '../../shared/models/acao';
import { EditarPerfilRequest, PerfilResponse } from '../../shared/models/perfil';

export interface OpcaoPerfil<T extends string = string> {
  valor: T;
  rotulo: string;
  explicacao: string;
}

export const OPCOES_RISCO: OpcaoPerfil[] = [
  { valor: 'CONSERVADOR', rotulo: 'Conservador', explicacao: 'Prioriza segurança e prefere evitar oscilações.' },
  { valor: 'MODERADO', rotulo: 'Moderado', explicacao: 'Aceita alguma oscilação em busca de crescimento.' },
  { valor: 'ARROJADO', rotulo: 'Arrojado', explicacao: 'Tolera bem as oscilações em troca de um retorno maior.' },
];

export const OPCOES_OBJETIVO: OpcaoPerfil[] = [
  { valor: 'RENDA_PASSIVA', rotulo: 'Renda passiva', explicacao: 'Receber rendimentos periódicos, como dividendos e aluguéis.' },
  { valor: 'CRESCIMENTO_PATRIMONIO', rotulo: 'Crescer o patrimônio', explicacao: 'Fazer o dinheiro render mais ao longo do tempo.' },
  { valor: 'PRESERVAR_CAPITAL', rotulo: 'Preservar o que já tenho', explicacao: 'Proteger o dinheiro e evitar perdas.' },
];

export const OPCOES_HORIZONTE: OpcaoPerfil[] = [
  { valor: 'CURTO_PRAZO', rotulo: 'Curto prazo', explicacao: 'Posso precisar do dinheiro em menos de 1 ano.' },
  { valor: 'MEDIO_PRAZO', rotulo: 'Médio prazo', explicacao: 'Pretendo usar o dinheiro entre 1 e 5 anos.' },
  { valor: 'LONGO_PRAZO', rotulo: 'Longo prazo', explicacao: 'Não tenho pressa, são mais de 5 anos pela frente.' },
];

export const OPCOES_TIPO_ATIVO: OpcaoPerfil<TipoAtivo>[] = [
  { valor: 'ACAO', rotulo: 'Ações', explicacao: 'Pedacinhos de empresas negociados na bolsa.' },
  { valor: 'FII', rotulo: 'FIIs', explicacao: 'Fundos que investem em imóveis e costumam pagar todo mês.' },
  { valor: 'ETF', rotulo: 'ETFs', explicacao: 'Fundos que acompanham um índice, como o Ibovespa.' },
];

export const SETORES_DISPONIVEIS = ['Energia Elétrica', 'Tecnologia', 'Varejo e Consumo', 'Financeiro e Bancos', 'Agronegócio'];

export function montarRequisicao(perfil: PerfilResponse, alteracao: Partial<EditarPerfilRequest>): EditarPerfilRequest {
  return {
    perfilRisco: perfil.perfilRisco.valor,
    objetivoFinanceiro: perfil.objetivoFinanceiro.valor,
    horizonteInvestimento: perfil.horizonteInvestimento.valor,
    valorDisponivel: perfil.valorDisponivel,
    tiposAceitos: [...perfil.tiposAceitos],
    setoresPreferidos: perfil.setoresPreferidos.map(({ setor, preferencia }) => ({ setor, preferencia })),
    ...alteracao,
  };
}
