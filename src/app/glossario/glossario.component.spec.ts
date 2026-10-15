import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GlossarioComponent } from './glossario.component';
import { TERMOS_GLOSSARIO } from '../shared/glossario/glossario';

describe('GlossarioComponent', () => {
  let fixture: ComponentFixture<GlossarioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [GlossarioComponent] }).compileComponents();
    fixture = TestBed.createComponent(GlossarioComponent);
    fixture.detectChanges();
  });

  function buscar(texto: string): void {
    const campo: HTMLInputElement = fixture.nativeElement.querySelector('.glossario__busca input');
    campo.value = texto;
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function termosVisiveis(): string[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.glossario__termo h3')).map(
      (titulo) => (titulo as HTMLElement).textContent!.trim(),
    );
  }

  it('deve listar todos os termos agrupados por categoria', () => {
    const secoes = Array.from(fixture.nativeElement.querySelectorAll('.glossario__secao h2')).map(
      (titulo) => (titulo as HTMLElement).textContent!.trim(),
    );

    expect(secoes).toEqual(['Renda variável', 'Renda fixa', 'Indexadores', 'Indicadores de ações', 'Indicadores de mercado']);
    expect(termosVisiveis().length).toBe(TERMOS_GLOSSARIO.length);
  });

  it('cada termo deve ter definição, motivo de importar e uma âncora própria', () => {
    const cdi: HTMLElement = fixture.nativeElement.querySelector('#termo-CDI');

    expect(cdi.querySelector('h3')!.textContent).toContain('CDI');
    expect(cdi.querySelector('.glossario__importancia')!.textContent).toContain('Por que importa:');
  });

  it('a busca deve filtrar sem diferenciar acentos e maiúsculas', () => {
    buscar('prefixado');
    expect(termosVisiveis()).toEqual(['Prefixado']);

    buscar('IMOVEIS');
    expect(termosVisiveis()).toContain('FII (Fundo Imobiliário)');
    expect(fixture.nativeElement.querySelectorAll('.glossario__secao').length).toBeLessThan(5);
  });

  it('a busca também deve olhar a definição', () => {
    buscar('dividendos');

    expect(termosVisiveis()).toContain('DY (Dividend Yield)');
  });

  it('sem resultados, deve mostrar o aviso e permitir voltar a ver tudo', () => {
    buscar('criptomoeda');

    expect(fixture.nativeElement.querySelector('.glossario__vazio').textContent).toContain('criptomoeda');

    fixture.nativeElement.querySelector('.glossario__vazio button').click();
    fixture.detectChanges();

    expect(termosVisiveis().length).toBe(TERMOS_GLOSSARIO.length);
  });
});
