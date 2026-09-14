export type TipoPergunta = 'UNICA_ESCOLHA' | 'MULTIPLA_ESCOLHA';

export interface QuizOpcao {
  id: string;
  texto: string;
  emoji: string;
}

export interface QuizPergunta {
  id: string;
  texto: string;
  tipo: TipoPergunta;
  obrigatoria: boolean;
  opcoes: QuizOpcao[];
}

export interface QuizResponse {
  perguntas: QuizPergunta[];
}

export interface RespostaQuiz {
  perguntaId: string;
  opcaoIds: string[];
}

export interface ValorDescrito {
  valor: string;
  descricao: string;
}

export interface QuizSubmissaoResponse {
  perfilRisco: ValorDescrito;
  objetivoFinanceiro: ValorDescrito;
  horizonteInvestimento: ValorDescrito;
  resumoIA: string;
}
