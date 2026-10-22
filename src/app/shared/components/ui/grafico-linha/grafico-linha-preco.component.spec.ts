import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GraficoLinhaPrecoComponent, formatarDataCompleta, formatarDataEixo, valoresDoEixo } from './grafico-linha-preco.component';
import { PontoHistorico } from '../../../models/acao';

const PONTOS: PontoHistorico[] = [
  { data: '2026-01-01', abertura: 10, fechamento: 12, maxima: 13, minima: 9, volume: 100 },
  { data: '2026-01-02', abertura: 12, fechamento: 8, maxima: 12, minima: 7, volume: 200 },
  { data: '2026-01-03', abertura: 8, fechamento: 15.5, maxima: 16, minima: 8, volume: 150 },
];

describe('valoresDoEixo', () => {
  it('deve gerar valores redondos, com passo igual, que cobrem o mínimo e o máximo', () => {
    const valores = valoresDoEixo(33.1, 38.9);
    const passos = valores.slice(1).map((v, i) => +(v - valores[i]).toFixed(6));

    expect(valores[0]).toBeLessThanOrEqual(33.1);
    expect(valores[valores.length - 1]).toBeGreaterThanOrEqual(38.9);
    expect(new Set(passos).size).toBe(1);
    expect(valores.length).toBeGreaterThanOrEqual(3);
    expect(valores.length).toBeLessThanOrEqual(6);
    expect(valores).toEqual([32, 34, 36, 38, 40]);
  });

  it('com preço parado no período, deve criar uma faixa em volta do valor', () => {
    const valores = valoresDoEixo(10, 10);

    expect(valores.length).toBeGreaterThanOrEqual(2);
    expect(valores[0]).toBeLessThanOrEqual(10);
    expect(valores[valores.length - 1]).toBeGreaterThan(valores[0]);
  });
});

describe('formatação de datas do gráfico', () => {
  it('deve mostrar dia e mês em períodos curtos e mês e ano em períodos longos', () => {
    expect(formatarDataEixo('2026-09-05', 30)).toBe('05/09');
    expect(formatarDataEixo('2026-09-05', 365)).toBe('set/26');
  });

  it('deve mostrar a data completa sem depender do fuso horário', () => {
    expect(formatarDataCompleta('2026-01-01')).toBe('01/01/2026');
  });
});

describe('GraficoLinhaPrecoComponent', () => {
  let fixture: ComponentFixture<GraficoLinhaPrecoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraficoLinhaPrecoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GraficoLinhaPrecoComponent);
  });

  function montar(pontos = PONTOS): void {
    fixture.componentRef.setInput('pontos', pontos);
    fixture.detectChanges();
  }

  function el(): HTMLElement {
    return fixture.nativeElement;
  }

  function area(): HTMLElement {
    return el().querySelector('.grafico-linha__area')!;
  }

  function svg(): SVGSVGElement {
    return el().querySelector('svg')!;
  }

  function moverPonteiro(fracao: number, tipo = 'mouse', evento = 'pointermove'): void {
    const caixa = svg().getBoundingClientRect();
    svg().dispatchEvent(new PointerEvent(evento, { clientX: caixa.left + caixa.width * fracao, clientY: caixa.top + 50, pointerType: tipo, bubbles: true }));
    fixture.detectChanges();
  }

  function tecla(key: string): KeyboardEvent {
    const evento = new KeyboardEvent('keydown', { key, cancelable: true });
    area().dispatchEvent(evento);
    fixture.detectChanges();
    return evento;
  }

  function balao(): string {
    const b = el().querySelector('.grafico-linha__balao');
    return b ? Array.from(b.children).map((c) => c.textContent!.trim()).join(' | ') : '';
  }

  it('deve calcular mínimo e máximo a partir dos pontos recebidos', () => {
    montar();

    expect(el().querySelector('.grafico-linha__faixa')!.textContent).toContain('16');
    expect(el().querySelector('.grafico-linha__faixa')!.textContent).toContain('7');
  });

  it('deve mostrar mensagem de vazio quando não há pontos', () => {
    montar([]);

    expect(el().querySelector('.grafico-linha__vazio')).toBeTruthy();
    expect(svg()).toBeNull();
  });

  it('deve gerar um caminho SVG começando com M quando há pontos', () => {
    montar();

    expect(el().querySelector('.grafico-linha__linha')!.getAttribute('d')).toMatch(/^M /);
  });

  it('deve mostrar os valores no eixo Y e as datas no eixo X', () => {
    montar();

    const valores = Array.from(el().querySelectorAll('.grafico-linha__rotulo--y')).map((t) => t.textContent!.trim());
    const datas = Array.from(el().querySelectorAll('.grafico-linha__rotulo--x')).map((t) => t.textContent!.trim());
    expect(valores.length).toBeGreaterThanOrEqual(3);
    expect(valores.every((v) => v.startsWith('R$ '))).toBeTrue();
    expect(datas).toEqual(['01/01', '02/01', '03/01']);
  });

  it('as datas das pontas devem ficar alinhadas para dentro do gráfico', () => {
    montar();

    const ancoras = Array.from(el().querySelectorAll('.grafico-linha__rotulo--x')).map((t) => t.getAttribute('text-anchor'));
    expect(ancoras).toEqual(['start', 'middle', 'end']);
  });

  it('sem interação, não deve mostrar ponto, guias nem balão', () => {
    montar();

    expect(el().querySelector('.grafico-linha__ponto')).toBeNull();
    expect(el().querySelectorAll('.grafico-linha__guia').length).toBe(0);
    expect(el().querySelector('.grafico-linha__balao')).toBeNull();
  });

  it('ao passar o mouse, deve marcar o ponto mais próximo com guias até os eixos e o balão com preço e data', () => {
    montar();

    moverPonteiro(0.99);

    const ponto = el().querySelector('.grafico-linha__ponto')!;
    const guias = Array.from(el().querySelectorAll('.grafico-linha__guia'));
    const largura = Number(svg().getAttribute('width'));
    expect(Number(ponto.getAttribute('cx'))).toBeCloseTo(largura - 16, 3);
    expect(guias.length).toBe(2);
    expect(guias[0].getAttribute('y2')).toBe(String(260 - 32));
    expect(guias[1].getAttribute('x1')).toBe(el().querySelector('.grafico-linha__grade')!.getAttribute('x1'));
    expect(balao()).toBe('R$ 15,50 | 03/01/2026');
  });

  it('o balão não deve sair do gráfico nas pontas', () => {
    montar();

    moverPonteiro(0.01);
    expect(balao()).toContain('01/01/2026');
    expect(el().querySelector('.grafico-linha__balao')!.classList).toContain('grafico-linha__balao--inicio');

    moverPonteiro(0.99);
    expect(el().querySelector('.grafico-linha__balao')!.classList).toContain('grafico-linha__balao--fim');
  });

  it('ao tirar o mouse, deve esconder o ponto', () => {
    montar();
    moverPonteiro(0.5);

    svg().dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }));
    fixture.detectChanges();

    expect(el().querySelector('.grafico-linha__balao')).toBeNull();
  });

  it('no toque, deve seguir o dedo e manter o ponto visível depois de soltar', () => {
    montar();

    moverPonteiro(0.5, 'touch', 'pointerdown');
    expect(balao()).toContain('02/01/2026');
    moverPonteiro(0.99, 'touch');
    expect(balao()).toContain('03/01/2026');

    svg().dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'touch' }));
    fixture.detectChanges();

    expect(balao()).toContain('03/01/2026');
  });

  it('pelo teclado: o foco começa no último dia, as setas percorrem e Home e End vão às pontas', () => {
    montar();

    area().dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    expect(balao()).toContain('03/01/2026');

    expect(tecla('ArrowLeft').defaultPrevented).toBeTrue();
    expect(balao()).toContain('02/01/2026');

    tecla('Home');
    expect(balao()).toContain('01/01/2026');
    tecla('ArrowLeft');
    expect(balao()).toContain('01/01/2026');

    tecla('End');
    tecla('ArrowRight');
    expect(balao()).toContain('03/01/2026');
  });

  it('pelo teclado: Esc e a saída do foco escondem o ponto, e outras teclas não são capturadas', () => {
    montar();
    area().dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();

    expect(tecla('Tab').defaultPrevented).toBeFalse();
    tecla('Escape');
    expect(balao()).toBe('');

    tecla('ArrowLeft');
    area().dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    expect(balao()).toBe('');
  });

  it('deve ser focável, explicar o uso das setas e anunciar o ponto escolhido', () => {
    montar();

    expect(area().tabIndex).toBe(0);
    expect(area().getAttribute('aria-label')).toBe(
      'Gráfico do preço de fechamento de 01/01/2026 a 03/01/2026. Use as setas para percorrer os dias.',
    );

    area().dispatchEvent(new FocusEvent('focus'));
    tecla('Home');

    expect(el().querySelector('[aria-live="polite"]')!.textContent!.trim()).toBe('01/01/2026, fechamento de R$ 12,00');
  });

  it('ao trocar o período para um com menos dias, não deve apontar para um ponto que não existe', () => {
    montar();
    moverPonteiro(0.99);

    montar(PONTOS.slice(0, 1));

    expect(el().querySelector('.grafico-linha__balao')).toBeNull();
    expect(Array.from(el().querySelectorAll('.grafico-linha__rotulo--x')).map((t) => t.textContent!.trim())).toEqual(['01/01']);
  });

  it('deve resumir o período em texto: começo, fim, variação, menor e maior fechamento', () => {
    montar();

    const area = el().querySelector('.grafico-linha__area')!;
    const resumo = el().querySelector(`#${area.getAttribute('aria-describedby')}`)!;
    expect(resumo.textContent!.trim()).toBe(
      'O fechamento foi de R$ 12,00 em 01/01/2026 para R$ 15,50 em 03/01/2026, alta de 29,17%. ' +
        'O menor fechamento foi R$ 8,00, em 02/01/2026, e o maior foi R$ 15,50, em 03/01/2026.',
    );
  });
});
