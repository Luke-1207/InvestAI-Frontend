import { MARGEM_TELA, calcularPosicaoBalao } from './posicao-balao';

describe('calcularPosicaoBalao', () => {
  const tela = { width: 375, height: 740 };
  const balao = { width: 280, height: 100 };

  function ancora(left: number, top: number) {
    return { left, top, bottom: top + 24, width: 24 };
  }

  it('deve centralizar o balão abaixo do ícone quando há espaço', () => {
    const posicao = calcularPosicaoBalao(ancora(170, 200), balao, tela);

    expect(posicao.lado).toBe('baixo');
    expect(posicao.top).toBe(232);
    expect(posicao.left).toBe(42);
    expect(posicao.seta).toBe(140);
  });

  it('não deve deixar o balão sair pela direita da tela', () => {
    const posicao = calcularPosicaoBalao(ancora(340, 200), balao, tela);

    expect(posicao.left + balao.width).toBe(tela.width - MARGEM_TELA);
    expect(posicao.seta).toBeGreaterThan(balao.width / 2);
  });

  it('não deve deixar o balão sair pela esquerda da tela', () => {
    const posicao = calcularPosicaoBalao(ancora(4, 200), balao, tela);

    expect(posicao.left).toBe(MARGEM_TELA);
    expect(posicao.seta).toBe(14);
  });

  it('deve abrir para cima quando não cabe abaixo do ícone', () => {
    const posicao = calcularPosicaoBalao(ancora(170, 680), balao, tela);

    expect(posicao.lado).toBe('cima');
    expect(posicao.top).toBe(680 - 8 - balao.height);
  });

  it('deve continuar abaixo quando também não cabe acima', () => {
    const posicao = calcularPosicaoBalao(ancora(170, 60), { width: 280, height: 700 }, tela);

    expect(posicao.lado).toBe('baixo');
  });
});
