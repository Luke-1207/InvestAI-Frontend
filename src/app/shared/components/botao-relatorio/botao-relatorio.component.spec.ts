import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, Subject } from 'rxjs';
import { BotaoRelatorioComponent } from './botao-relatorio.component';
import { ToastService } from '../../services/toast.service';
import { MENSAGEM_ERRO_RELATORIO } from '../../services/relatorio.service';

@Component({
  standalone: true,
  imports: [BotaoRelatorioComponent],
  template: `
    <app-botao-relatorio
      rotulo="Baixar relatório"
      [icone]="icone"
      [desabilitado]="desabilitado"
      [requisicao]="requisicao"
      (concluido)="concluidos = concluidos + 1"
    />
  `,
})
class HostComponent {
  icone = 'download';
  desabilitado = false;
  concluidos = 0;
  chamadas = 0;
  resposta = new Subject<string>();
  requisicao = (): Observable<string> => {
    this.chamadas++;
    return this.resposta;
  };
}

describe('BotaoRelatorioComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let toastService: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    toastService = jasmine.createSpyObj<ToastService>('ToastService', ['sucesso', 'erro']);

    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [{ provide: ToastService, useValue: toastService }],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  function botao(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.botao-relatorio');
  }

  function clicar(): void {
    botao().click();
    fixture.detectChanges();
  }

  function chamarBaixarDireto(): void {
    (fixture.debugElement.children[0].componentInstance as unknown as { baixar: () => void }).baixar();
  }

  it('deve mostrar o rótulo e o ícone, habilitado', () => {
    expect(botao().textContent).toContain('Baixar relatório');
    expect(botao().querySelector('.material-symbols-outlined')?.textContent?.trim()).toBe('download');
    expect(botao().disabled).toBeFalse();
    expect(fixture.nativeElement.querySelector('app-spinner')).toBeNull();
  });

  it('ao clicar deve chamar a requisição, desabilitar o botão e mostrar carregamento', () => {
    clicar();

    expect(host.chamadas).toBe(1);
    expect(botao().disabled).toBeTrue();
    expect(botao().getAttribute('aria-busy')).toBe('true');
    expect(botao().textContent).toContain('Gerando PDF...');
    expect(fixture.nativeElement.querySelector('app-spinner')).toBeTruthy();
  });

  it('não deve disparar uma segunda requisição enquanto a primeira está em andamento', () => {
    clicar();
    botao().click();
    chamarBaixarDireto();

    expect(host.chamadas).toBe(1);
  });

  it('ao concluir deve reabilitar o botão, mostrar toast de sucesso e emitir concluido', () => {
    clicar();

    host.resposta.next('analise-TAEE11.pdf');
    fixture.detectChanges();

    expect(botao().disabled).toBeFalse();
    expect(botao().textContent).toContain('Baixar relatório');
    expect(toastService.sucesso).toHaveBeenCalledWith('Relatório baixado.');
    expect(toastService.erro).not.toHaveBeenCalled();
    expect(host.concluidos).toBe(1);
  });

  it('em caso de falha deve reabilitar o botão e mostrar a mensagem do erro em um toast', () => {
    clicar();

    host.resposta.error(new Error('Complete seu perfil de investidor'));
    fixture.detectChanges();

    expect(botao().disabled).toBeFalse();
    expect(botao().textContent).toContain('Baixar relatório');
    expect(toastService.erro).toHaveBeenCalledWith('Complete seu perfil de investidor');
    expect(toastService.sucesso).not.toHaveBeenCalled();
    expect(host.concluidos).toBe(0);
  });

  it('falha sem mensagem deve mostrar o texto padrão', () => {
    clicar();

    host.resposta.error({ status: 0 });
    fixture.detectChanges();

    expect(toastService.erro).toHaveBeenCalledWith(MENSAGEM_ERRO_RELATORIO);
  });

  it('depois de uma falha deve permitir tentar de novo', () => {
    clicar();
    host.resposta.error(new Error('falhou'));
    host.resposta = new Subject<string>();
    fixture.detectChanges();

    clicar();

    expect(host.chamadas).toBe(2);
    expect(botao().disabled).toBeTrue();
  });

  it('desabilitado não deve chamar a requisição', () => {
    host.desabilitado = true;
    fixture.detectChanges();

    expect(botao().disabled).toBeTrue();
    chamarBaixarDireto();

    expect(host.chamadas).toBe(0);
  });

  it('deve aceitar um ícone diferente', () => {
    host.icone = 'picture_as_pdf';
    fixture.detectChanges();

    expect(botao().querySelector('.material-symbols-outlined')?.textContent?.trim()).toBe('picture_as_pdf');
  });
});
