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

  it('deve calcular os percentuais corretamente a partir dos valores brutos', () => {
    fixture.componentRef.setInput('segmentos', [
      { rotulo: 'A', valor: 70, cor: '#fff' },
      { rotulo: 'B', valor: 30, cor: '#000' },
    ]);
    fixture.detectChanges();

    const legendas = fixture.nativeElement.querySelectorAll('.donut-chart__percentual');
    expect(legendas[0].textContent.trim()).toBe('70%');
    expect(legendas[1].textContent.trim()).toBe('30%');
  });

  it('não deve renderizar nenhum arco quando a soma dos valores é zero', () => {
    fixture.componentRef.setInput('segmentos', [
      { rotulo: 'A', valor: 0, cor: '#fff' },
    ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.donut-chart__item').length).toBe(0);
  });

  it('deve renderizar um círculo SVG por segmento, além do círculo de fundo', () => {
    fixture.componentRef.setInput('segmentos', [
      { rotulo: 'A', valor: 50, cor: '#fff' },
      { rotulo: 'B', valor: 50, cor: '#000' },
    ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('circle').length).toBe(3);
  });
});
