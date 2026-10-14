import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AjudaContextualComponent } from './ajuda-contextual.component';

@Component({
  standalone: true,
  imports: [AjudaContextualComponent],
  template: `
    <p>Liquidez <app-ajuda termo="Liquidez" texto="Facilidade de resgatar o dinheiro." /></p>
    <button type="button" class="fora">Fora</button>
  `,
})
class HostTesteComponent {}

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
    return fixture.nativeElement.querySelector('.ajuda__balao');
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

  it('o balão deve ficar dentro de uma região de status para leitores de tela', () => {
    clicarComPonteiro();

    expect(balao()!.parentElement!.getAttribute('role')).toBe('status');
  });
});
