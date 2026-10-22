import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../shared/services/auth.service';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['login']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
    fixture.detectChanges();
  });

  function enviarCom(erro: HttpErrorResponse): HTMLElement {
    authService.login.and.returnValue(throwError(() => erro));
    fixture.componentInstance['formulario'].setValue({ email: 'lucas@teste.com', senha: 'senha1234' });
    fixture.componentInstance.enviar();
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('[role="alert"]');
  }

  it('login certo deve ir para o dashboard', () => {
    authService.login.and.returnValue(of({ accessToken: 'a', refreshToken: 'r', expiresIn: 900 }));
    fixture.componentInstance['formulario'].setValue({ email: 'lucas@teste.com', senha: 'senha1234' });

    fixture.componentInstance.enviar();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('credenciais erradas devem mostrar a mensagem genérica em um alerta', () => {
    const alerta = enviarCom(new HttpErrorResponse({ status: 422, error: { erro: 'Credenciais inválidas' } }));

    expect(alerta.textContent).toContain('E-mail ou senha inválidos.');
  });

  it('bloqueio por muitas tentativas deve mostrar quanto tempo esperar', () => {
    const alerta = enviarCom(
      new HttpErrorResponse({ status: 429, error: { erro: 'Muitas tentativas seguidas. Aguarde 15 minutos e tente de novo.' } }),
    );

    expect(alerta.textContent).toContain('Aguarde 15 minutos');
    expect(alerta.textContent).not.toContain('E-mail ou senha inválidos.');
  });

  it('sem conexão deve avisar da conexão em vez de culpar a senha', () => {
    const alerta = enviarCom(new HttpErrorResponse({ status: 0 }));

    expect(alerta.textContent).toContain('Sem conexão');
  });
});
