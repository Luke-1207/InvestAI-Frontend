import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { RendaFixaComponent } from './renda-fixa.component';
import { RendaFixaService } from '../shared/services/renda-fixa.service';
import { RendaFixaListagem } from '../shared/models/renda-fixa';

function itemMock(overrides: Partial<RendaFixaListagem> = {}): RendaFixaListagem {
  return {
    id: '1', categoria: 'TESOURO', nome: 'Tesouro Selic 2029', indexador: 'SELIC',
    taxa: 10.5, vencimento: '2029-01-01', valorMinimo: 100, liquidez: 'DIARIA',
    isentoIr: false, garantidoFgc: false, score: null, compatibilidade: null, justificativa: null,
    ...overrides,
  };
}

describe('RendaFixaComponent', () => {
  let fixture: ComponentFixture<RendaFixaComponent>;
  let service: jasmine.SpyObj<RendaFixaService>;
  let router: Router;

  beforeEach(async () => {
    service = jasmine.createSpyObj('RendaFixaService', ['listar']);
    service.listar.and.returnValue(of([
      itemMock(),
      itemMock({ id: '2', categoria: 'CDB', nome: 'CDB Banco X', garantidoFgc: true }),
    ]));

    await TestBed.configureTestingModule({
      imports: [RendaFixaComponent],
      providers: [{ provide: RendaFixaService, useValue: service }, provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RendaFixaComponent);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('deve carregar em Modo Livre por padrão', () => {
    expect(service.listar).toHaveBeenCalledWith('livre');
    expect(fixture.nativeElement.querySelectorAll('.rf__card').length).toBe(2);
  });

  it('não deve mostrar o círculo de score no Modo Livre (score vem null)', () => {
    expect(fixture.nativeElement.querySelector('.rf__score')).toBeNull();
  });

  it('deve trocar pro Modo Inteligente e chamar o serviço de novo', () => {
    service.listar.and.returnValue(of([
      itemMock({ score: 72, compatibilidade: 'ALTA', justificativa: 'Boa opção' }),
    ]));

    const botaoInteligente: HTMLButtonElement = Array.from(
      fixture.nativeElement.querySelectorAll('.rf__modo'),
    ).find((b: any) => b.textContent.includes('Modo Inteligente')) as HTMLButtonElement;
    botaoInteligente.click();
    fixture.detectChanges();

    expect(service.listar).toHaveBeenCalledWith('inteligente');
    expect(fixture.nativeElement.querySelector('.rf__score').textContent.trim()).toBe('72');
    expect(fixture.nativeElement.querySelector('.rf__justificativa').textContent).toContain('Boa opção');
  });

  it('filtro de categoria deve ser aplicado no cliente, sem chamar o serviço de novo', () => {
    service.listar.calls.reset();

    const botaoCdb: HTMLButtonElement = Array.from(
      fixture.nativeElement.querySelectorAll('.rf__filtro'),
    ).find((b: any) => b.textContent.trim() === 'CDBs') as HTMLButtonElement;
    botaoCdb.click();
    fixture.detectChanges();

    expect(service.listar).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelectorAll('.rf__card').length).toBe(1);
    expect(fixture.nativeElement.querySelector('.rf__card h4').textContent).toContain('CDB Banco X');
  });

  it('selo de garantia deve mostrar "Tesouro Nacional" pra TESOURO e "Garantido pelo FGC" só quando garantidoFgc é true', () => {
    const selos = fixture.nativeElement.querySelectorAll('.rf__selo');
    expect(selos[0].textContent).toContain('Tesouro Nacional');
    expect(selos[1].textContent).toContain('Garantido pelo FGC');
  });

  it('não deve mostrar selo quando o título privado não tem garantia do FGC', () => {
    service.listar.and.returnValue(of([itemMock({ id: '3', categoria: 'CDB', garantidoFgc: false })]));
    fixture.componentInstance['carregar']();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.rf__selo')).toBeNull();
  });

  it('deve navegar pro detalhe ao clicar num card', () => {
    const navSpy = spyOn(router, 'navigateByUrl');

    fixture.nativeElement.querySelector('.rf__card').click();

    expect(navSpy).toHaveBeenCalledWith('/renda-fixa/1');
  });

  it('deve mostrar mensagem de vazio quando não há itens', () => {
    service.listar.and.returnValue(of([]));
    fixture.componentInstance['carregar']();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.rf__mensagem-vazia')).toBeTruthy();
  });
});
