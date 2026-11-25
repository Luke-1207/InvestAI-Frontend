import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CartaoSugestaoAtivoComponent } from './cartao-sugestao-ativo.component';
import { SugestaoAtivoItem } from '../../models/dashboard';

const ITEM_MOCK: SugestaoAtivoItem = {
  codigo: 'PETR4',
  nome: 'Petrobras',
  tipo: 'ACAO',
  setor: 'Energia',
  preco: 38.5,
  variacaoDia: -1.2,
  dy: 8,
  score: 72,
  compatibilidade: 'ALTA',
  justificativa: 'Boa opção pro seu perfil.',
};

function regrasDeHoverDoLink(): CSSStyleRule[] {
  return Array.from(document.styleSheets)
    .flatMap((folha) => Array.from(folha.cssRules))
    .filter((regra): regra is CSSStyleRule => regra instanceof CSSStyleRule)
    .filter((regra) => /\.cartao-sugestao-ativo__link(\[[^\]]+\])?:hover/.test(regra.selectorText));
}

describe('CartaoSugestaoAtivoComponent', () => {
  let fixture: ComponentFixture<CartaoSugestaoAtivoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartaoSugestaoAtivoComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CartaoSugestaoAtivoComponent);
    fixture.componentRef.setInput('item', ITEM_MOCK);
    fixture.detectChanges();
  });

  it('deve renderizar código, nome, score e justificativa', () => {
    const el = fixture.nativeElement;
    expect(el.textContent).toContain('PETR4');
    expect(el.textContent).toContain('Petrobras');
    expect(el.querySelector('.cartao-sugestao-ativo__score').textContent.trim()).toBe('72');
    expect(el.textContent).toContain('Boa opção pro seu perfil.');
  });

  it('variação negativa deve aplicar a classe correta', () => {
    const variacao = fixture.nativeElement.querySelector('.cartao-sugestao-ativo__variacao');
    expect(variacao.classList).toContain('cartao-sugestao-ativo__variacao--negativa');
    expect(variacao.classList).not.toContain('cartao-sugestao-ativo__variacao--positiva');
  });

  it('o código do ativo deve ser um link para o detalhe, alcançável pelo Tab e acionado com Enter', () => {
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('h3 a.cartao-sugestao-ativo__link');

    expect(link.getAttribute('href')).toBe('/renda-variavel/PETR4');
    expect(link.tabIndex).toBe(0);
    expect(fixture.nativeElement.querySelector('[role="link"]')).toBeNull();
  });

  it('o nível do título deve acompanhar a página onde o card aparece', () => {
    fixture.componentRef.setInput('nivelTitulo', 2);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h2 a').textContent.trim()).toBe('PETR4');
    expect(fixture.nativeElement.querySelector('h3')).toBeNull();
  });

  it('o score deve ser lido com contexto, e não só como um número solto', () => {
    const score = fixture.nativeElement.querySelector('.cartao-sugestao-ativo__score');

    expect(score.getAttribute('role')).toBe('img');
    expect(score.getAttribute('aria-label')).toBe('Score de compatibilidade 72 de 100');
  });

  it('clicar em qualquer parte do card deve acionar o link do detalhe', () => {
    const justificativa: HTMLElement = fixture.nativeElement.querySelector('.cartao-sugestao-ativo__justificativa');
    const area = justificativa.getBoundingClientRect();

    const alvo = document.elementFromPoint(area.left + area.width / 2, area.top + area.height / 2);

    expect(alvo).toBe(fixture.nativeElement.querySelector('a.cartao-sugestao-ativo__link'));
  });

  it('o hover do link não deve aplicar filter, senão a área clicável encolhe e o clique falha', () => {
    const regras = regrasDeHoverDoLink();

    expect(regras.length).toBeGreaterThan(0);
    regras.forEach((regra) => expect(regra.style.filter).toBe('none'));
  });
});
