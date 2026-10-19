import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DicaDoDiaComponent } from './dica-do-dia.component';
import { dicaEducativaDoDia } from './dicas-educativas';
import { SugestaoAtivoItem } from '../../shared/models/dashboard';

const ATIVO: SugestaoAtivoItem = {
  codigo: 'TAEE11',
  nome: 'Taesa',
  tipo: 'ACAO',
  setor: 'Energia',
  preco: 38.42,
  variacaoDia: -1.5,
  dy: 8,
  score: 91,
  compatibilidade: 'ALTA',
  justificativa: 'Combina com o seu perfil.',
};

describe('DicaDoDiaComponent', () => {
  let fixture: ComponentFixture<DicaDoDiaComponent>;

  beforeEach(async () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2026, 9, 16, 10, 0));

    await TestBed.configureTestingModule({ imports: [DicaDoDiaComponent], providers: [provideRouter([])] }).compileComponents();
    fixture = TestBed.createComponent(DicaDoDiaComponent);
  });

  afterEach(() => jasmine.clock().uninstall());

  it('deve mostrar a dica educativa de hoje', () => {
    fixture.detectChanges();
    const dica = dicaEducativaDoDia(new Date(2026, 9, 16));

    expect(fixture.nativeElement.querySelector('h2').textContent.trim()).toBe(dica.titulo);
    expect(fixture.nativeElement.querySelector('.dica-do-dia__texto').textContent.trim()).toBe(dica.texto);
  });

  it('deve mostrar abaixo da dica o ativo em destaque, levando ao detalhe dele', () => {
    fixture.componentRef.setInput('destaque', ATIVO);
    fixture.detectChanges();

    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('.dica-do-dia__destaque');
    expect(link.getAttribute('href')).toBe('/renda-variavel/TAEE11');
    expect(link.textContent).toContain('TAEE11');
    expect(link.textContent).toContain('Combina com o seu perfil.');
    expect(link.textContent).toContain('Score 91');
    expect(link.querySelector('.dica-do-dia__variacao')!.classList).toContain('dica-do-dia__variacao--negativa');
  });

  it('sem ativo em destaque, deve mostrar só a dica', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.dica-do-dia__texto')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.dica-do-dia__destaque')).toBeNull();
  });
});
