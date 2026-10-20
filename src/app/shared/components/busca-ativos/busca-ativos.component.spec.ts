import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ATRASO_BUSCA_MS, BuscaAtivosComponent } from './busca-ativos.component';
import { BuscaService } from '../../services/busca.service';
import { ResultadoBusca } from '../../models/busca';

const RESULTADOS: ResultadoBusca[] = [
  { grupo: 'RENDA_VARIAVEL', categoria: 'ACAO', identificador: 'PETR4', codigo: 'PETR4', nome: 'Petrobras PN', detalhe: 'Petróleo e Gás' },
  { grupo: 'RENDA_VARIAVEL', categoria: 'FII', identificador: 'HGLG11', codigo: 'HGLG11', nome: 'CSHG Logística', detalhe: null },
  {
    grupo: 'RENDA_FIXA', categoria: 'TESOURO', identificador: 'tesouro-ipca-2035', codigo: null,
    nome: 'Tesouro IPCA+ 2035', detalhe: 'IPCA + 6,20% a.a. · vence em 05/2035',
  },
];

describe('BuscaAtivosComponent', () => {
  let fixture: ComponentFixture<BuscaAtivosComponent>;
  let buscaService: jasmine.SpyObj<BuscaService>;
  let router: Router;

  beforeEach(async () => {
    buscaService = jasmine.createSpyObj<BuscaService>('BuscaService', ['buscar']);
    buscaService.buscar.and.returnValue(of(RESULTADOS));

    await TestBed.configureTestingModule({
      imports: [BuscaAtivosComponent],
      providers: [provideRouter([]), { provide: BuscaService, useValue: buscaService }],
    }).compileComponents();

    fixture = TestBed.createComponent(BuscaAtivosComponent);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  const campo = (): HTMLInputElement => fixture.nativeElement.querySelector('input[role="combobox"]');
  const painel = (): HTMLElement => fixture.nativeElement.querySelector('.busca__painel');
  const opcoes = (): HTMLElement[] => Array.from(fixture.nativeElement.querySelectorAll('[role="option"]'));
  const mensagem = (): string => fixture.nativeElement.querySelector('.busca__mensagem')?.textContent.trim() ?? '';
  const anuncio = (): string => fixture.nativeElement.querySelector('[role="status"]').textContent.trim();

  function digitar(valor: string): void {
    campo().focus();
    campo().value = valor;
    campo().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function teclar(tecla: string): KeyboardEvent {
    const evento = new KeyboardEvent('keydown', { key: tecla, cancelable: true, bubbles: true });
    campo().dispatchEvent(evento);
    fixture.detectChanges();
    return evento;
  }

  it('deve buscar só depois de uma pausa na digitação e mostrar os resultados', fakeAsync(() => {
    digitar('pe');
    digitar('petr');
    tick(ATRASO_BUSCA_MS - 1);
    expect(buscaService.buscar).not.toHaveBeenCalled();

    tick(1);
    fixture.detectChanges();

    expect(buscaService.buscar).toHaveBeenCalledOnceWith('petr');
    expect(painel().hidden).toBeFalse();
    expect(opcoes().length).toBe(3);
    expect(opcoes()[0].textContent).toContain('PETR4');
    expect(opcoes()[0].textContent).toContain('Petrobras PN');
    expect(opcoes()[0].textContent).toContain('Ação');
    expect(opcoes()[2].textContent).toContain('Tesouro Direto');
    expect(opcoes()[2].textContent).toContain('vence em 05/2035');
    expect(anuncio()).toBe('3 resultados encontrados');
  }));

  it('com menos de 2 letras não deve buscar nem abrir a lista', fakeAsync(() => {
    digitar('p');
    tick(ATRASO_BUSCA_MS);
    fixture.detectChanges();

    expect(buscaService.buscar).not.toHaveBeenCalled();
    expect(painel().hidden).toBeTrue();
  }));

  it('deve mostrar "Buscando..." enquanto espera a primeira resposta', fakeAsync(() => {
    digitar('vale');

    expect(mensagem()).toBe('Buscando...');
    expect(anuncio()).toBe('Buscando ativos');

    tick(ATRASO_BUSCA_MS);
  }));

  it('sem resultados deve avisar que não encontrou nada para o termo', fakeAsync(() => {
    buscaService.buscar.and.returnValue(of([]));
    digitar('xyz');
    tick(ATRASO_BUSCA_MS);
    fixture.detectChanges();

    expect(mensagem()).toBe('Nenhum ativo encontrado para "xyz".');
    expect(anuncio()).toBe('Nenhum ativo encontrado');
    expect(campo().getAttribute('aria-expanded')).toBe('false');
  }));

  it('se a busca falhar deve mostrar uma mensagem amigável e continuar funcionando', fakeAsync(() => {
    buscaService.buscar.and.returnValue(throwError(() => new Error('falhou')));
    digitar('petr');
    tick(ATRASO_BUSCA_MS);
    fixture.detectChanges();

    expect(mensagem()).toContain('Não conseguimos buscar agora');

    buscaService.buscar.and.returnValue(of(RESULTADOS));
    digitar('vale');
    tick(ATRASO_BUSCA_MS);
    fixture.detectChanges();

    expect(opcoes().length).toBe(3);
  }));

  it('setas devem mover a opção ativa, informando ao leitor de tela qual é', fakeAsync(() => {
    digitar('petr');
    tick(ATRASO_BUSCA_MS);
    fixture.detectChanges();

    expect(campo().getAttribute('aria-expanded')).toBe('true');
    expect(campo().getAttribute('aria-activedescendant')).toBe(opcoes()[0].id);
    expect(opcoes()[0].getAttribute('aria-selected')).toBe('true');

    teclar('ArrowDown');
    expect(campo().getAttribute('aria-activedescendant')).toBe(opcoes()[1].id);

    teclar('ArrowUp');
    teclar('ArrowUp');
    expect(campo().getAttribute('aria-activedescendant')).toBe(opcoes()[2].id);
    expect(opcoes()[2].classList).toContain('busca__opcao--ativa');
  }));

  it('Enter deve levar ao detalhe da opção ativa e limpar a busca', fakeAsync(() => {
    const navegar = spyOn(router, 'navigate').and.resolveTo(true);
    digitar('tesouro');
    tick(ATRASO_BUSCA_MS);
    fixture.detectChanges();

    teclar('ArrowDown');
    teclar('ArrowDown');
    const evento = teclar('Enter');

    expect(evento.defaultPrevented).toBeTrue();
    expect(navegar).toHaveBeenCalledWith(['/renda-fixa', 'tesouro-ipca-2035']);
    expect(campo().value).toBe('');
    expect(painel().hidden).toBeTrue();
  }));

  it('clicar numa opção deve levar ao detalhe de renda variável pelo código', fakeAsync(() => {
    const navegar = spyOn(router, 'navigate').and.resolveTo(true);
    digitar('hglg');
    tick(ATRASO_BUSCA_MS);
    fixture.detectChanges();

    const opcao = opcoes()[1];
    const mousedown = new MouseEvent('mousedown', { cancelable: true, bubbles: true });
    opcao.dispatchEvent(mousedown);
    opcao.click();

    expect(mousedown.defaultPrevented).toBeTrue();
    expect(navegar).toHaveBeenCalledWith(['/renda-variavel', 'HGLG11']);
  }));

  it('Esc deve fechar a lista e, apertado de novo, limpar o campo', fakeAsync(() => {
    digitar('petr');
    tick(ATRASO_BUSCA_MS);
    fixture.detectChanges();

    teclar('Escape');
    expect(painel().hidden).toBeTrue();
    expect(campo().value).toBe('petr');

    teclar('Escape');
    expect(campo().value).toBe('');
  }));

  it('setas com a lista fechada devem reabri-la sem perder os resultados', fakeAsync(() => {
    digitar('petr');
    tick(ATRASO_BUSCA_MS);
    fixture.detectChanges();
    teclar('Escape');

    teclar('ArrowDown');

    expect(painel().hidden).toBeFalse();
    expect(opcoes().length).toBe(3);
  }));

  it('ao sair do campo para fora da busca deve fechar a lista', fakeAsync(() => {
    digitar('petr');
    tick(ATRASO_BUSCA_MS);
    fixture.detectChanges();

    campo().dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }));
    fixture.detectChanges();

    expect(painel().hidden).toBeTrue();
  }));

  it('focar() deve colocar o foco no campo, para o atalho da tecla barra', () => {
    fixture.componentInstance.focar();

    expect(document.activeElement).toBe(campo());
  });

  describe('no celular', () => {
    it('o botão de lupa deve abrir a barra de busca já com o foco no campo', fakeAsync(() => {
      const botao: HTMLButtonElement = fixture.nativeElement.querySelector('.busca__abrir');
      expect(botao.getAttribute('aria-label')).toBe('Buscar ativos');
      expect(botao.getAttribute('aria-expanded')).toBe('false');

      botao.click();
      fixture.detectChanges();
      tick();

      expect(botao.getAttribute('aria-expanded')).toBe('true');
      expect(fixture.nativeElement.querySelector('.busca').classList).toContain('busca--expandida');
      expect(fixture.nativeElement.querySelector('.busca__fundo')).not.toBeNull();
    }));

    it('"Fechar busca" e o fundo escuro devem fechar a barra e limpar o termo', fakeAsync(() => {
      fixture.nativeElement.querySelector('.busca__abrir').click();
      fixture.detectChanges();
      digitar('petr');
      tick(ATRASO_BUSCA_MS);
      fixture.detectChanges();

      fixture.nativeElement.querySelector('.busca__fechar').click();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.busca').classList).not.toContain('busca--expandida');
      expect(campo().value).toBe('');

      fixture.nativeElement.querySelector('.busca__abrir').click();
      fixture.detectChanges();
      fixture.nativeElement.querySelector('.busca__fundo').click();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.busca__fundo')).toBeNull();
    }));

    it('Esc com a barra aberta e sem lista deve fechar a barra', () => {
      fixture.nativeElement.querySelector('.busca__abrir').click();
      fixture.detectChanges();

      teclar('Escape');

      expect(fixture.nativeElement.querySelector('.busca').classList).not.toContain('busca--expandida');
    });

    it('escolher um resultado deve fechar a barra', fakeAsync(() => {
      spyOn(router, 'navigate').and.resolveTo(true);
      fixture.nativeElement.querySelector('.busca__abrir').click();
      fixture.detectChanges();
      digitar('petr');
      tick(ATRASO_BUSCA_MS);
      fixture.detectChanges();

      teclar('Enter');

      expect(fixture.nativeElement.querySelector('.busca').classList).not.toContain('busca--expandida');
    }));
  });
});
