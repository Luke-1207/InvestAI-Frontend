export interface AreaAncora {
  top: number;
  left: number;
  bottom: number;
  width: number;
}

export interface Dimensoes {
  width: number;
  height: number;
}

export type LadoBalao = 'baixo' | 'cima';

export interface PosicaoBalao {
  top: number;
  left: number;
  lado: LadoBalao;
  seta: number;
}

export const MARGEM_TELA = 8;
const DISTANCIA_ANCORA = 8;
const FOLGA_SETA = 14;

export function calcularPosicaoBalao(ancora: AreaAncora, balao: Dimensoes, tela: Dimensoes): PosicaoBalao {
  const centro = ancora.left + ancora.width / 2;
  const limiteDireito = tela.width - MARGEM_TELA - balao.width;
  const left = Math.max(MARGEM_TELA, Math.min(centro - balao.width / 2, limiteDireito));

  const cabeAbaixo = ancora.bottom + DISTANCIA_ANCORA + balao.height <= tela.height - MARGEM_TELA;
  const cabeAcima = ancora.top - DISTANCIA_ANCORA - balao.height >= MARGEM_TELA;
  const lado: LadoBalao = cabeAbaixo || !cabeAcima ? 'baixo' : 'cima';

  const top = lado === 'baixo' ? ancora.bottom + DISTANCIA_ANCORA : ancora.top - DISTANCIA_ANCORA - balao.height;
  const seta = Math.max(FOLGA_SETA, Math.min(centro - left, balao.width - FOLGA_SETA));

  return { top, left, lado, seta };
}
