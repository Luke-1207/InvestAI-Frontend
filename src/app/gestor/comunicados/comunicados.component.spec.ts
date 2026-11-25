import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ComunicadosComponent } from './comunicados.component';
import { NotificacaoService } from '../../shared/services/notificacao.service';
import { ToastService } from '../../shared/services/toast.service';
import { DialogoConfirmacaoComponent } from '../../shared/components/ui/dialogo-confirmacao/dialogo-confirmacao.component';

describe('ComunicadosComponent', () => {
  let fixture: ComponentFixture<ComunicadosComponent>;
  let service: jasmine.SpyObj<NotificacaoService>;
  let toastService: ToastService;

  beforeEach(async () => {
    service = jasmine.createSpyObj<NotificacaoService>('NotificacaoService', ['enviarComunicado', 'contarNaoLidas']);
    service.contarNaoLidas.and.returnValue(of({ total: 1 }));

    await TestBed.configureTestingModule({
      imports: [ComunicadosComponent],
      providers: [{ provide: NotificacaoService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(ComunicadosComponent);
    toastService = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  function preencher(titulo: string, mensagem: string): void {
    const el: HTMLElement = fixture.nativeElement;
    const campoTitulo = el.querySelector<HTMLInputElement>('#comunicado-titulo')!;
    const campoMensagem = el.querySelector<HTMLTextAreaElement>('#comunicado-mensagem')!;
    campoTitulo.value = titulo;
    campoTitulo.dispatchEvent(new Event('input'));
    campoMensagem.value = mensagem;
    campoMensagem.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function enviarFormulario(): void {
    (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  function dialogo(): DialogoConfirmacaoComponent {
    return fixture.debugElement.query((d) => d.componentInstance instanceof DialogoConfirmacaoComponent).componentInstance;
  }

  it('não deve abrir a confirmação com campos vazios', () => {
    const abrirSpy = spyOn(dialogo(), 'abrir');

    enviarFormulario();

    expect(abrirSpy).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Informe o título.');
    expect(fixture.nativeElement.textContent).toContain('Escreva a mensagem.');
  });

  it('deve mostrar o contador de caracteres', () => {
    preencher('Manutenção', 'Sistema fora do ar');
    expect(fixture.nativeElement.textContent).toContain('10 de 150 caracteres');
  });

  it('deve enviar depois de confirmar e limpar o formulário', () => {
    service.enviarComunicado.and.returnValue(of({ destinatarios: 12 }));
    const abrirSpy = spyOn(dialogo(), 'abrir');
    preencher('  Manutenção  ', ' Sistema fora do ar às 22h ');

    enviarFormulario();
    expect(abrirSpy).toHaveBeenCalled();

    dialogo().confirmado.emit();
    fixture.detectChanges();

    expect(service.enviarComunicado).toHaveBeenCalledWith({ titulo: 'Manutenção', mensagem: 'Sistema fora do ar às 22h' });
    expect(toastService.toasts()[0].mensagem).toBe('Comunicado enviado para 12 usuários.');
    expect(fixture.nativeElement.textContent).toContain('Último comunicado entregue para 12 usuários');
    expect((fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('#comunicado-titulo')!.value).toBe('');
  });

  it('deve mostrar erro geral quando o envio falha', () => {
    service.enviarComunicado.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403, error: { erro: 'Acesso negado' } })));
    spyOn(dialogo(), 'abrir');
    preencher('Aviso', 'Texto');
    enviarFormulario();

    dialogo().confirmado.emit();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.formulario__erro-geral').textContent).toContain('Acesso negado');
  });
});
