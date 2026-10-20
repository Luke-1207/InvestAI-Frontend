import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CriteriosScoreComponent } from './criterios-score.component';
import { CriterioScore } from '../../models/compatibilidade';

@Component({
  standalone: true,
  imports: [CriteriosScoreComponent],
  template: `<app-criterios-score [criterios]="criterios()" [score]="score()" />`,
})
class HostTesteComponent {
  readonly criterios = signal<CriterioScore[] | undefined>([
    { chave: 'setor_evitado', descricao: 'Setor está entre os que você prefere evitar', pontos: -20 },
    { chave: 'dy_renda_passiva', descricao: 'Paga bons dividendos', pontos: 25 },
    { chave: 'volatilidade_alta_demais', descricao: 'Oscila mais do que o seu perfil tolera', pontos: -10 },
    { chave: 'horizonte_longo', descricao: 'Combina com o longo prazo', pontos: 15 },
  ]);
  readonly score = signal(10);
}

describe('CriteriosScoreComponent', () => {
  let fixture: ComponentFixture<HostTesteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostTesteComponent], providers: [provideRouter([])] }).compileComponents();
    fixture = TestBed.createComponent(HostTesteComponent);
    fixture.detectChanges();
  });

  function grupos(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.criterios-score__grupo'));
  }

  function linhas(grupo: HTMLElement): string[] {
    return Array.from(grupo.querySelectorAll('li')).map((li) =>
      Array.from(li.querySelectorAll('span')).map((span) => span.textContent!.trim()).join(' '),
    );
  }

  it('deve mostrar o score no título', () => {
    expect(fixture.nativeElement.querySelector('h2').textContent).toContain('Como chegamos a 10 pontos');
  });

  it('deve separar o que somou do que tirou pontos, do maior para o menor impacto', () => {
    expect(grupos().map((grupo) => grupo.querySelector('h3')!.textContent!.trim())).toEqual([
      'O que somou pontos',
      'O que tirou pontos',
    ]);
    expect(linhas(grupos()[0])).toEqual(['+25 Paga bons dividendos', '+15 Combina com o longo prazo']);
    expect(linhas(grupos()[1])).toEqual([
      '−20 Setor está entre os que você prefere evitar',
      '−10 Oscila mais do que o seu perfil tolera',
    ]);
  });

  it('deve explicar quando a soma passa dos limites de 0 a 100', () => {
    fixture.componentInstance.criterios.set([{ chave: 'a', descricao: 'Ruim', pontos: -30 }]);
    fixture.componentInstance.score.set(0);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('A soma ficou em -30, e o score não fica abaixo de 0.');
  });

  it('não deve mostrar um grupo vazio', () => {
    fixture.componentInstance.criterios.set([{ chave: 'a', descricao: 'Bom', pontos: 35 }]);
    fixture.detectChanges();

    expect(grupos().length).toBe(1);
  });

  it('sem critérios, deve avisar que os detalhes não estão disponíveis', () => {
    fixture.componentInstance.criterios.set(undefined);
    fixture.detectChanges();

    expect(grupos().length).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('Os detalhes deste score não estão disponíveis no momento.');
  });

  it('deve explicar a escala e levar para a página de conformidade', () => {
    expect(fixture.nativeElement.textContent).toContain('Alta a partir de 80, Média a partir de 50');
    expect(fixture.nativeElement.querySelector('a').getAttribute('href')).toBe('/conformidade');
  });
});
