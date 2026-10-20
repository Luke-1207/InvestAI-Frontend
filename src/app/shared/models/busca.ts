export type GrupoBusca = 'RENDA_VARIAVEL' | 'RENDA_FIXA';

export interface ResultadoBusca {
  grupo: GrupoBusca;
  categoria: string;
  identificador: string;
  codigo: string | null;
  nome: string;
  detalhe: string | null;
}

export const TAMANHO_MINIMO_BUSCA = 2;

export const ROTULOS_GRUPO_BUSCA: Record<GrupoBusca, string> = {
  RENDA_VARIAVEL: 'Renda variável',
  RENDA_FIXA: 'Renda fixa',
};

export function rotaDoResultado(resultado: ResultadoBusca): string[] {
  const modulo = resultado.grupo === 'RENDA_VARIAVEL' ? '/renda-variavel' : '/renda-fixa';
  return [modulo, resultado.identificador];
}
