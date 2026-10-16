import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConformidadeComponent } from './conformidade.component';

describe('ConformidadeComponent', () => {
  let fixture: ComponentFixture<ConformidadeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ConformidadeComponent] }).compileComponents();
    fixture = TestBed.createComponent(ConformidadeComponent);
    fixture.detectChanges();
  });

  it('deve explicar o caráter educativo, o score, o uso de IA e os dados de mercado', () => {
    const titulos = Array.from(fixture.nativeElement.querySelectorAll('h2')).map((h) => (h as HTMLElement).textContent!.trim());

    expect(titulos).toEqual([
      'Conteúdo educativo, não recomendação',
      'Como o score é calculado',
      'Uso de inteligência artificial',
      'Dados de mercado',
    ]);
  });

  it('deve mostrar os critérios do score de renda variável e de renda fixa com os limites de Alta e Média', () => {
    const tabelas: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.conformidade__pesos'));

    expect(tabelas[0].querySelectorAll('dt').length).toBe(5);
    expect(tabelas[1].querySelectorAll('dt').length).toBe(6);
    expect(fixture.nativeElement.textContent).toContain('a partir de 80');
  });
});
