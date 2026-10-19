import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { CadastroComponent, MENSAGEM_FALHA_FOTO } from './cadastro.component';
import { AuthService, LoginResponse } from '../../shared/services/auth.service';
import { FotoPerfilService } from '../../shared/services/foto-perfil.service';
import { ToastService } from '../../shared/services/toast.service';

const DADOS = { nome: 'Lucas Silva', email: 'lucas@teste.com', senha: 'senha1234', confirmarSenha: 'senha1234' };
const LOGIN: LoginResponse = { accessToken: 'a', refreshToken: 'r', expiresIn: 900 };

function foto(tipo = 'image/png', tamanho = 100): File {
  return new File([new Uint8Array(tamanho)], 'foto.png', { type: tipo });
}

describe('CadastroComponent', () => {
  let fixture: ComponentFixture<CadastroComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let fotoService: jasmine.SpyObj<FotoPerfilService>;
  let toast: ToastService;
  let router: Router;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['cadastrar']);
    authService.cadastrar.and.returnValue(of(LOGIN));
    fotoService = jasmine.createSpyObj<FotoPerfilService>('FotoPerfilService', ['enviar']);
    fotoService.enviar.and.returnValue(of(undefined));
    spyOn(URL, 'createObjectURL').and.returnValue('blob:previa');
    spyOn(URL, 'revokeObjectURL');

    await TestBed.configureTestingModule({
      imports: [CadastroComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
        { provide: FotoPerfilService, useValue: fotoService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CadastroComponent);
    toast = TestBed.inject(ToastService);
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
    fixture.detectChanges();
  });

  function el(): HTMLElement {
    return fixture.nativeElement;
  }

  function preencher(): void {
    fixture.componentInstance['formulario'].setValue(DADOS);
  }

  function escolher(arquivo: File): void {
    const input = el().querySelector<HTMLInputElement>('.cadastro-foto__input')!;
    Object.defineProperty(input, 'files', { value: [arquivo], configurable: true });
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function enviar(): void {
    el().querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  function textoBotao(): string {
    return el().querySelector('app-button button')!.textContent!.trim();
  }

  it('a foto deve ser opcional e explicar formatos e tamanho', () => {
    expect(el().querySelector('.cadastro-foto__titulo')!.textContent).toContain('(OPCIONAL)');
    expect(el().querySelector('.cadastro-foto__dica')!.textContent).toContain('JPG, PNG ou WEBP, até 2 MB.');
    expect(el().querySelector('.cadastro-foto__input')!.getAttribute('accept')).toBe('image/jpeg,image/png,image/webp');
    expect(el().querySelector('img.cadastro-foto__previa')).toBeNull();
  });

  it('sem foto, deve cadastrar e ir para o quiz sem tentar enviar foto', () => {
    preencher();
    enviar();

    expect(authService.cadastrar).toHaveBeenCalledOnceWith(DADOS);
    expect(fotoService.enviar).not.toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/onboarding');
  });

  it('ao escolher uma foto válida, deve mostrar a prévia e o botão de trocar', () => {
    escolher(foto());

    expect(el().querySelector<HTMLImageElement>('img.cadastro-foto__previa')!.getAttribute('src')).toBe('blob:previa');
    expect(el().querySelector('.cadastro-foto__botao')!.textContent).toContain('Trocar foto');
    expect(el().querySelector('.cadastro-foto__remover')).not.toBeNull();
  });

  it('com foto, deve enviar a foto só depois do cadastro e do login automático', () => {
    const cadastro = new Subject<LoginResponse>();
    authService.cadastrar.and.returnValue(cadastro);
    const arquivo = foto();
    escolher(arquivo);
    preencher();
    enviar();

    expect(textoBotao()).toBe('Criando conta...');
    expect(fotoService.enviar).not.toHaveBeenCalled();

    cadastro.next(LOGIN);
    fixture.detectChanges();

    expect(fotoService.enviar).toHaveBeenCalledOnceWith(arquivo);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/onboarding');
    expect(toast.toasts().length).toBe(0);
  });

  it('enquanto a foto sobe, o botão deve avisar que está enviando a foto', () => {
    fotoService.enviar.and.returnValue(new Subject<void>());
    escolher(foto());
    preencher();
    enviar();

    expect(textoBotao()).toBe('Enviando sua foto...');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('falha no envio da foto não deve impedir o cadastro: segue para o quiz e avisa', () => {
    fotoService.enviar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    escolher(foto());
    preencher();
    enviar();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/onboarding');
    expect(toast.toasts().map((t) => [t.tipo, t.mensagem])).toEqual([['aviso', MENSAGEM_FALHA_FOTO]]);
    expect(el().querySelector('.auth-form__alerta--erro')).toBeNull();
  });

  it('foto em formato ou tamanho inválido deve ser recusada na hora, sem prévia', () => {
    escolher(foto('image/gif'));
    expect(el().querySelector('.cadastro-foto__erro')!.textContent!.trim()).toBe('Formato não suportado. Use JPG, PNG ou WEBP.');
    expect(el().querySelector('img.cadastro-foto__previa')).toBeNull();

    escolher(foto('image/png', 2 * 1024 * 1024 + 1));
    expect(el().querySelector('.cadastro-foto__erro')!.textContent!.trim()).toBe('A foto deve ter no máximo 2 MB.');

    preencher();
    enviar();
    expect(fotoService.enviar).not.toHaveBeenCalled();
  });

  it('remover a foto deve limpar a prévia e cadastrar sem foto', () => {
    escolher(foto());
    el().querySelector<HTMLButtonElement>('.cadastro-foto__remover')!.click();
    fixture.detectChanges();

    expect(el().querySelector('img.cadastro-foto__previa')).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:previa');

    preencher();
    enviar();
    expect(fotoService.enviar).not.toHaveBeenCalled();
  });

  it('se o cadastro falhar, não deve enviar a foto e deve mostrar o motivo', () => {
    authService.cadastrar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    escolher(foto());
    preencher();
    enviar();

    expect(fotoService.enviar).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(el().querySelector('.auth-form__alerta--erro')!.textContent).toContain('Já existe uma conta cadastrada com esse e-mail.');
    expect(textoBotao()).toBe('Criar conta e responder o quiz');
  });

  it('formulário inválido não deve chamar o cadastro', () => {
    escolher(foto());
    enviar();

    expect(authService.cadastrar).not.toHaveBeenCalled();
  });

  it('ao sair da tela, deve liberar a prévia da memória', () => {
    escolher(foto());
    fixture.destroy();

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:previa');
  });
});
