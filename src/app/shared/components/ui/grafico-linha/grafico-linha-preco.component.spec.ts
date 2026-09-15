import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GraficoLinhaPrecoComponent } from './grafico-linha-preco.component';
import { PontoHistorico } from '../../../models/acao';

const PONTOS: PontoHistorico[] = [
  { data: '2026-01-01', abertura: 10, fechamento: 12, maxima: 13, minima: 9, volume: 100 },
  { data: '2026-01-02', abertura: 12, fechamento: 8, maxima: 12, minima: 7, volume: 200 },
  { data: '2026-01-03', abertura: 8, fechamento: 15, maxima: 16, minima: 8, volume: 150 },
];

describe('GraficoLinhaPrecoComponent', () => {
  let fixture: ComponentFixture<GraficoLinhaPrecoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraficoLinhaPrecoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GraficoLinhaPrecoComponent);
  });

  it('deve calcular mínimo e máximo a partir dos pontos recebidos', () => {
    fixture.componentRef.setInput('pontos', PONTOS);
    fixture.detectChanges();

    const el = fixture.nativeElement;
    expect(el.textContent).toContain('16');
    expect(el.textContent).toContain('7');
  });

  it('deve mostrar mensagem de vazio quando não há pontos', () => {
    fixture.componentRef.setInput('pontos', []);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.grafico-linha__vazio')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('svg')).toBeNull();
  });

  it('deve gerar um caminho SVG começando com M quando há pontos', () => {
    fixture.componentRef.setInput('pontos', PONTOS);
    fixture.detectChanges();

    const path = fixture.nativeElement.querySelector('path[stroke="var(--accent)"]');
    expect(path.getAttribute('d')).toMatch(/^M /);
  });
});
