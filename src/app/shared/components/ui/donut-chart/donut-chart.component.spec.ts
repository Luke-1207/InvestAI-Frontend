import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DonutChartComponent } from './donut-chart.component';

describe('DonutChartComponent', () => {
  let fixture: ComponentFixture<DonutChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonutChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DonutChartComponent);
  });

  function montarDoisSegmentos(): void {
    fixture.componentRef.setInput('segmentos', [
      { rotulo: 'Renda Variável', valor: 70, cor: 'rgb(1, 2, 3)' },
      { rotulo: 'Renda Fixa', valor: 30, cor: 'rgb(4, 5, 6)' },
    ]);
    fixture.detectChanges();
  }

  function arcos(): SVGCircleElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.donut-chart__arco'));
  }

  function itensLegenda(): HTMLButtonElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.donut-chart__item'));
  }

  function centro(): string {
    return Array.from(fixture.nativeElement.querySelectorAll('.donut-chart__centro span'))
      .map((span) => (span as HTMLElement).textContent!.trim())
      .join(' ');
  }

  it('deve calcular os percentuais corretamente a partir dos valores brutos', () => {
    montarDoisSegmentos();

    const legendas = fixture.nativeElement.querySelectorAll('.donut-chart__percentual');
    expect(legendas[0].textContent.trim()).toBe('70%');
    expect(legendas[1].textContent.trim()).toBe('30%');
  });

  it('não deve renderizar nenhum arco quando a soma dos valores é zero', () => {
    fixture.componentRef.setInput('segmentos', [{ rotulo: 'A', valor: 0, cor: '#fff' }]);
    fixture.detectChanges();

    expect(itensLegenda().length).toBe(0);
    expect(arcos().length).toBe(0);
  });

  it('deve renderizar um círculo SVG por segmento, além do círculo de fundo', () => {
    montarDoisSegmentos();

    expect(fixture.nativeElement.querySelectorAll('circle').length).toBe(3);
  });

  it('deve descrever a distribuição para leitores de tela', () => {
    montarDoisSegmentos();

    expect(fixture.nativeElement.querySelector('svg').getAttribute('aria-label')).toBe('Renda Variável: 70%, Renda Fixa: 30%');
  });

  it('cada arco deve ocupar a fração certa da circunferência e animar a partir do zero', () => {
    montarDoisSegmentos();
    const circunferencia = 2 * Math.PI * 70;

    const [primeiro, segundo] = arcos();
    expect(primeiro.style.strokeDasharray.split(/[ ,]+/).map(Number)[0]).toBeCloseTo(circunferencia * 0.7, 3);
    expect(Number(segundo.getAttribute('stroke-dashoffset'))).toBeCloseTo(-circunferencia * 0.7, 3);
    expect(Number(primeiro.style.getPropertyValue('--circunferencia'))).toBeCloseTo(circunferencia, 3);
    expect(getComputedStyle(primeiro).animationName).toContain('donut-chart-entrada');
  });

  it('sem nada destacado, o centro fica vazio e nenhum arco é apagado', () => {
    montarDoisSegmentos();

    expect(centro()).toBe('');
    expect(fixture.nativeElement.querySelectorAll('.donut-chart__arco--apagado').length).toBe(0);
  });

  it('ao passar o mouse em um arco, deve engrossar o arco, apagar os outros e mostrar rótulo e percentual no centro', () => {
    montarDoisSegmentos();

    arcos()[1].dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();

    expect(centro()).toBe('30% Renda Fixa');
    expect(arcos()[1].style.strokeWidth).toBe('26px');
    expect(arcos()[0].style.strokeWidth).toBe('20px');
    expect(arcos()[0].classList).toContain('donut-chart__arco--apagado');
    expect(arcos()[1].classList).not.toContain('donut-chart__arco--apagado');
    expect(itensLegenda()[1].getAttribute('aria-pressed')).toBe('true');
  });

  it('ao tocar em um arco, deve destacar o segmento tocado', () => {
    montarDoisSegmentos();

    arcos()[0].dispatchEvent(new MouseEvent('click'));
    fixture.detectChanges();

    expect(centro()).toBe('70% Renda Variável');
  });

  it('ao tirar o mouse do gráfico, deve voltar ao estado normal', () => {
    montarDoisSegmentos();
    arcos()[0].dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.donut-chart').dispatchEvent(new MouseEvent('mouseleave'));
    fixture.detectChanges();

    expect(centro()).toBe('');
    expect(fixture.nativeElement.querySelectorAll('.donut-chart__arco--apagado').length).toBe(0);
  });

  it('pelo teclado, focar um item da legenda destaca o segmento e sair dele limpa o destaque', () => {
    montarDoisSegmentos();

    itensLegenda()[0].dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    expect(centro()).toBe('70% Renda Variável');
    expect(itensLegenda()[0].classList).toContain('donut-chart__item--ativo');

    itensLegenda()[0].dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    expect(centro()).toBe('');
  });

  it('o percentual no centro deve usar a cor do segmento', () => {
    montarDoisSegmentos();

    itensLegenda()[1].click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.donut-chart__centro-percentual').style.color).toBe('rgb(4, 5, 6)');
  });
});
