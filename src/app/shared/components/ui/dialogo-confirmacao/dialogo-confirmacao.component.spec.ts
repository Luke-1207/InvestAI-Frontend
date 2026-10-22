import { Component, ViewChild, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DialogoConfirmacaoComponent } from './dialogo-confirmacao.component';

@Component({
  standalone: true,
  imports: [DialogoConfirmacaoComponent],
  template: `
    <button type="button" id="gatilho" (click)="dialogo.abrir()">Abrir</button>
    <app-dialogo-confirmacao
      #dialogo
      titulo="Desativar PETR4?"
      textoConfirmar="Desativar"
      [perigoso]="true"
      [processando]="processando()"
      (confirmado)="confirmacoes = confirmacoes + 1"
    >
      <p>O ativo some das listagens.</p>
    </app-dialogo-confirmacao>
  `,
})
class HospedeiroComponent {
  @ViewChild('dialogo') dialogo!: DialogoConfirmacaoComponent;
  readonly processando = signal(false);
  confirmacoes = 0;
}

describe('DialogoConfirmacaoComponent', () => {
  let fixture: ComponentFixture<HospedeiroComponent>;
  let host: HospedeiroComponent;
  const dialogo = (): HTMLDialogElement => fixture.nativeElement.querySelector('dialog');
  const botao = (classe: string): HTMLButtonElement => fixture.nativeElement.querySelector(classe);

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HospedeiroComponent] }).compileComponents();
    fixture = TestBed.createComponent(HospedeiroComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    if (dialogo()?.open) dialogo().close();
  });

  it('deve abrir como modal com título e texto ligados para leitores de tela', () => {
    botao('#gatilho').click();

    expect(dialogo().open).toBeTrue();
    const titulo = fixture.nativeElement.querySelector('#' + dialogo().getAttribute('aria-labelledby'));
    const texto = fixture.nativeElement.querySelector('#' + dialogo().getAttribute('aria-describedby'));
    expect(titulo.textContent).toContain('Desativar PETR4?');
    expect(texto.textContent).toContain('O ativo some das listagens.');
  });

  it('deve começar com o foco em Cancelar, para evitar uma confirmação sem querer', () => {
    botao('#gatilho').click();

    expect(document.activeElement).toBe(botao('.dialogo__cancelar'));
  });

  it('confirmar deve avisar o componente de fora, sem fechar sozinho', () => {
    host.dialogo.abrir();

    botao('.dialogo__confirmar').click();

    expect(host.confirmacoes).toBe(1);
    expect(dialogo().open).toBeTrue();
  });

  it('cancelar deve fechar e devolver o foco para quem abriu', () => {
    const gatilho = botao('#gatilho');
    gatilho.focus();
    gatilho.click();

    botao('.dialogo__cancelar').click();

    expect(dialogo().open).toBeFalse();
    expect(document.activeElement).toBe(gatilho);
  });

  it('enquanto processa deve travar os botões e ignorar o Esc', () => {
    host.dialogo.abrir();
    host.processando.set(true);
    fixture.detectChanges();

    expect(botao('.dialogo__confirmar').disabled).toBeTrue();
    expect(botao('.dialogo__confirmar').textContent).toContain('Aguarde...');
    const cancelamento = new Event('cancel', { cancelable: true });
    dialogo().dispatchEvent(cancelamento);
    expect(cancelamento.defaultPrevented).toBeTrue();
  });

  it('botão de confirmação perigoso deve usar o estilo de alerta', () => {
    expect(botao('.dialogo__confirmar').classList).toContain('dialogo__confirmar--perigo');
  });
});
