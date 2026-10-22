import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AjudaContextualComponent } from './ajuda-contextual.component';

@Component({
  standalone: true,
  imports: [AjudaContextualComponent],
  template: `
    <p (click)="cliquesNoParagrafo = cliquesNoParagrafo + 1">
      Liquidez <app-ajuda termo="Liquidez" texto="Facilidade de resgatar o dinheiro." importancia="Mostra quando você pode sacar." />
    </p>
    <p>
      Pergunta
      <app-ajuda rotulo="Entenda esta pergunta" texto="Texto de apoio." [focavel]="false" (alternado)="eventos.push($event)" />
    </p>
    <button type="button" class="fora">Fora</button>
  `,
})
class HostTesteComponent {
  cliquesNoParagrafo = 0;
  eventos: boolean[] = [];
}

describe('AjudaContextualComponent', () => {
  let fixture: ComponentFixture<HostTesteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostTesteComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostTesteComponent);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  function botao(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.ajuda__botao');
  }

  function balao(): HTMLElement | null {
    return document.querySelector<HTMLElement>('.ajuda__balao');
  }

  function clicarComPonteiro(): void {
    botao().dispatchEvent(new Event('pointerdown'));
    botao().dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    fixture.detectChanges();
  }

  function teclar(tecla: string, alvo: HTMLElement = botao()): void {
    alvo.dispatchEvent(new KeyboardEvent('keydown', { key: tecla, bubbles: true }));
    fixture.detectChanges();
  }

  it('deve começar fechado, com rótulo acessível e aria-expanded falso', () => {
    expect(balao()).toBeNull();
    expect(botao().getAttribute('aria-label')).toBe('O que é Liquidez?');
    expect(botao().getAttribute('aria-expanded')).toBe('false');
  });

  it('clique deve abrir o balão com o termo e a explicação', () => {
    clicarComPonteiro();

    expect(balao()).not.toBeNull();
    expect(balao()!.textContent).toContain('Liquidez');
    expect(balao()!.textContent).toContain('Facilidade de resgatar o dinheiro.');
    expect(botao().getAttribute('aria-expanded')).toBe('true');
    expect(botao().getAttribute('aria-controls')).toBe(balao()!.id);
  });

  it('segundo clique deve fechar o balão', () => {
    clicarComPonteiro();
    clicarComPonteiro();

    expect(balao()).toBeNull();
  });

  it('Enter deve abrir o balão e não fechar se já estiver aberto', () => {
    botao().dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));
    fixture.detectChanges();
    expect(balao()).not.toBeNull();

    botao().dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));
    fixture.detectChanges();
    expect(balao()).not.toBeNull();
  });

  it('focar com o teclado deve abrir o balão', () => {
    botao().dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();

    expect(balao()).not.toBeNull();
  });

  it('foco causado por toque ou mouse não deve abrir sozinho, só o clique', () => {
    botao().dispatchEvent(new Event('pointerdown'));
    botao().dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    expect(balao()).toBeNull();

    botao().dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    fixture.detectChanges();
    expect(balao()).not.toBeNull();
  });

  it('Esc deve fechar o balão e devolver o foco ao ícone', () => {
    clicarComPonteiro();
    const foco = spyOn(botao(), 'focus');

    teclar('Escape');

    expect(balao()).toBeNull();
    expect(foco).toHaveBeenCalled();
  });

  it('Esc com o balão fechado não deve fazer nada', () => {
    const foco = spyOn(botao(), 'focus');

    teclar('Escape');

    expect(foco).not.toHaveBeenCalled();
  });

  it('clicar fora deve fechar o balão', () => {
    clicarComPonteiro();

    fixture.nativeElement.querySelector('.fora').click();
    fixture.detectChanges();

    expect(balao()).toBeNull();
  });

  it('clicar dentro do balão não deve fechar', () => {
    clicarComPonteiro();

    balao()!.click();
    fixture.detectChanges();

    expect(balao()).not.toBeNull();
  });

  it('levar o foco para fora deve fechar o balão', () => {
    clicarComPonteiro();

    botao().dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: fixture.nativeElement.querySelector('.fora') }),
    );
    fixture.detectChanges();

    expect(balao()).toBeNull();
  });

  it('deve posicionar o balão dentro da tela depois de abrir', async () => {
    clicarComPonteiro();
    await fixture.whenStable();
    fixture.detectChanges();

    const area = balao()!.getBoundingClientRect();
    expect(balao()!.classList).toContain('ajuda__balao--posicionado');
    expect(area.left).toBeGreaterThanOrEqual(8);
    expect(area.right).toBeLessThanOrEqual(document.documentElement.clientWidth - 8 + 0.5);
  });

  it('deve mostrar o motivo de importar quando informado', () => {
    clicarComPonteiro();

    expect(balao()!.querySelector('.ajuda__importancia')!.textContent).toContain(
      'Por que importa: Mostra quando você pode sacar.',
    );
  });

  it('não deve mostrar o bloco de importância quando não informado', () => {
    const segundo = fixture.nativeElement.querySelectorAll('.ajuda__botao')[1] as HTMLButtonElement;
    segundo.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.ajuda__importancia')).toBeNull();
  });

  it('clicar na ajuda não deve acionar o clique do elemento em volta', () => {
    clicarComPonteiro();
    balao()!.click();

    expect(fixture.componentInstance.cliquesNoParagrafo).toBe(0);
  });

  it('abrir outra ajuda deve fechar a que estava aberta', () => {
    clicarComPonteiro();
    const segundo = fixture.nativeElement.querySelectorAll('.ajuda__botao')[1] as HTMLButtonElement;

    segundo.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    fixture.detectChanges();

    const baloes = document.querySelectorAll('.ajuda__balao');
    expect(baloes.length).toBe(1);
    expect(baloes[0].textContent).toContain('Texto de apoio.');
    expect(botao().getAttribute('aria-expanded')).toBe('false');
  });

  it('por padrão o ícone deve receber foco pelo teclado, e não quando marcado como não focável', () => {
    const botoes: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('.ajuda__botao'));

    expect(botoes[0].hasAttribute('tabindex')).toBeFalse();
    expect(botoes[1].getAttribute('tabindex')).toBe('-1');
  });

  it('deve avisar quando abre e quando fecha', () => {
    const segundo = fixture.nativeElement.querySelectorAll('.ajuda__botao')[1] as HTMLButtonElement;

    segundo.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    fixture.detectChanges();
    segundo.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    fixture.detectChanges();

    expect(fixture.componentInstance.eventos).toEqual([true, false]);
  });

  it('rótulo informado deve substituir o rótulo acessível padrão', () => {
    const botoes: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('.ajuda__botao'));

    expect(botoes[1].getAttribute('aria-label')).toBe('Entenda esta pergunta');
  });

  it('deve continuar dentro da tela quando estiver dentro de um elemento com transform', async () => {
    const paragrafo: HTMLElement = fixture.nativeElement.querySelector('p');
    paragrafo.style.transform = 'translateX(-60px)';
    clicarComPonteiro();
    await fixture.whenStable();
    fixture.detectChanges();

    const area = balao()!.getBoundingClientRect();
    const ancora = botao().getBoundingClientRect();
    expect(area.left).toBeGreaterThanOrEqual(8 - 0.5);
    expect(area.top).toBeCloseTo(ancora.bottom + 8, 0);
  });

  it('a explicação deve ser anunciada numa região de status para leitores de tela', () => {
    clicarComPonteiro();

    const status: HTMLElement = fixture.nativeElement.querySelector('[role="status"]');
    expect(status.querySelector('.ajuda__leitor')!.textContent).toContain('Facilidade de resgatar o dinheiro.');
    expect(status.querySelector('.ajuda__leitor')!.textContent).toContain('Por que importa:');
    expect(balao()!.getAttribute('aria-hidden')).toBe('true');
  });

  it('o balão deve ser desenhado direto no body para não ser cortado por nenhum container', async () => {
    clicarComPonteiro();
    await fixture.whenStable();

    expect(balao()!.parentElement).toBe(document.body);
  });

  it('clicar dentro do balão já movido para o body não deve fechar', async () => {
    clicarComPonteiro();
    await fixture.whenStable();

    balao()!.click();
    fixture.detectChanges();

    expect(balao()).not.toBeNull();
  });

  it('ao destruir o componente com o balão aberto, o balão deve sair do body', async () => {
    clicarComPonteiro();
    await fixture.whenStable();

    fixture.destroy();

    expect(document.querySelector('.ajuda__balao')).toBeNull();
  });
});
