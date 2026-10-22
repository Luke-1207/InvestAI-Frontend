import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RecuperarSenhaComponent } from './recuperar-senha.component';
import { AuthService } from '../../shared/services/auth.service';

describe('RecuperarSenhaComponent', () => {
  let fixture: ComponentFixture<RecuperarSenhaComponent>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['esqueciSenha']);

    await TestBed.configureTestingModule({
      imports: [RecuperarSenhaComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }],
    }).compileComponents();

    fixture = TestBed.createComponent(RecuperarSenhaComponent);
    fixture.detectChanges();
  });

  function enviar(): HTMLElement {
    fixture.componentInstance['formulario'].setValue({ email: 'lucas@teste.com' });
    fixture.componentInstance.enviar();
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  it('pedido aceito deve mostrar a confirmação', () => {
    authService.esqueciSenha.and.returnValue(of({ mensagem: 'ok' }));

    enviar();

    expect(fixture.componentInstance['enviado']()).toBeTrue();
  });

  it('bloqueio por muitos pedidos deve mostrar quanto tempo esperar', () => {
    authService.esqueciSenha.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 429, error: { erro: 'Muitas tentativas seguidas. Aguarde 3 minutos e tente de novo.' } })),
    );

    const el = enviar();

    expect(el.querySelector('[role="alert"]')!.textContent).toContain('Aguarde 3 minutos');
  });

  it('falha do servidor deve manter a mensagem padrão', () => {
    authService.esqueciSenha.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500, error: { erro: 'Erro interno' } })));

    const el = enviar();

    expect(el.querySelector('[role="alert"]')!.textContent).toContain('Não foi possível enviar o link');
  });
});
