import { ComponentFixture, TestBed } from '@angular/core/testing';
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

describe('CartaoSugestaoAtivoComponent', () => {
  let fixture: ComponentFixture<CartaoSugestaoAtivoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartaoSugestaoAtivoComponent],
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

  it('deve emitir "clique" ao clicar no card', () => {
    let emitiu = false;
    fixture.componentInstance.clique.subscribe(() => (emitiu = true));

    fixture.nativeElement.querySelector('.cartao-sugestao-ativo').click();

    expect(emitiu).toBe(true);
  });
});
