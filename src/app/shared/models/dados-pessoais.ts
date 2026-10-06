export interface DadosPessoais {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  possuiFoto: boolean;
}

export interface AtualizarDadosPessoaisRequest {
  nome: string;
  email: string;
  telefone: string;
}

export interface AlterarSenhaRequest {
  senhaAtual: string;
  novaSenha: string;
  confirmarNovaSenha: string;
}
