import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GraficoBarrasComponent } from './grafico-barras.component';

describe('GraficoBarrasComponent', () => {
  let fixture: ComponentFixture<GraficoBarrasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraficoBarrasComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GraficoBarrasComponent);
  });

  it('deve renderizar uma coluna por barra recebida, com o rótulo certo', () => {
    fixture.componentRef.setInput('barras', [
      { rotulo: 'Valor Inicial', valor: 100, cor: '#fff' },
      { rotulo: 'Retorno Bruto', valor: 150, cor: '#000' },
    ]);
    fixture.detectChanges();

    const colunas = fixture.nativeElement.querySelectorAll('.grafico-barras__coluna');
    expect(colunas.length).toBe(2);
    expect(colunas[1].textContent).toContain('Retorno Bruto');
  });

  it('a barra de maior valor deve ter a altura máxima (180px)', () => {
    fixture.componentRef.setInput('barras', [
      { rotulo: 'A', valor: 50, cor: '#fff' },
      { rotulo: 'B', valor: 100, cor: '#000' },
    ]);
    fixture.detectChanges();

    const barras = fixture.nativeElement.querySelectorAll('.grafico-barras__barra');
    expect(barras[1].style.height).toBe('180px');
    expect(parseFloat(barras[0].style.height)).toBeLessThan(180);
  });
});
