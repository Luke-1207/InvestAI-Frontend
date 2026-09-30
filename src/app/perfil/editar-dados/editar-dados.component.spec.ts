import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { EditarDadosComponent } from './editar-dados.component';
import { UsuarioService } from '../../shared/services/usuario.service';
import { AuthService } from '../../shared/services/auth.service';
import { FotoPerfilService } from '../../shared/services/foto-perfil.service';
import { DadosPessoais } from '../../shared/models/dados-pessoais';

function dadosMock(overrides: Partial<DadosPessoais> = {}): DadosPessoais {
  return {
    id: '1', nome: 'Lucas Silva', email: 'lucas@email.com',
    telefone: '19999998888', possuiFoto: false,
    ...overrides,
  };
}

function erroHttp(status: number, corpo: object): HttpErrorResponse {
  return new HttpErrorResponse({ status, error: corpo });
}

function eventoArquivo(arquivo: File): Event {
  return { target: { files: [arquivo], value: 'C:\\fakepath\\x' } } as unknown as Event;
}

describe('EditarDadosComponent', () => {
  let fixture: ComponentFixture<EditarDadosComponent>;
  let usuarioService: jasmine.SpyObj<UsuarioService>;
  let authService: jasmine.SpyObj<AuthService>;
  let fotoPerfilService: { url: ReturnType<typeof signal<string | null>>; enviar: jasmine.Spy; remover: jasmine.Spy };

  async function montar(urlFotoInicial: string | null = null) {
    usuarioService = jasmine.createSpyObj('UsuarioService', ['obter', 'atualizarDados', 'alterarSenha']);
    usuarioService.obter.and.returnValue(of(dadosMock()));
    usuarioService.atualizarDados.and.callFake((d) => of({ ...dadosMock(), ...d }));
    usuarioService.alterarSenha.and.returnValue(of(undefined));

    authService = jasmine.createSpyObj('AuthService', ['carregarUsuarioAtual']);
    // @ts-ignore
    authService.carregarUsuarioAtual.and.returnValue(of({} as any));

    const url = signal<string | null>(urlFotoInicial);
    fotoPerfilService = {
      url,
      enviar: jasmine.createSpy('enviar').and.callFake(() => { url.set('blob:nova'); return of(undefined); }),
      remover: jasmine.createSpy('remover').and.callFake(() => { url.set(null); return of(undefined); }),
    };

    await TestBed.configureTestingModule({
      imports: [EditarDadosComponent],
      providers: [
        { provide: UsuarioService, useValue: usuarioService },
        { provide: AuthService, useValue: authService },
        { provide: FotoPerfilService, useValue: fotoPerfilService },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditarDadosComponent);
    fixture.detectChanges();
  }

  const form = () => fixture.componentInstance['formulario'];
  const texto = () => fixture.nativeElement.textContent as string;
  const abrirSenha = () => {
    fixture.componentInstance['abrirTrocaSenha']();
    fixture.detectChanges();
  };

  it('deve preencher o formulário com os dados atuais e o telefone formatado', async () => {
    await montar();
    expect(form().controls.nome.value).toBe('Lucas Silva');
    expect(form().controls.email.value).toBe('lucas@email.com');
    expect(form().controls.telefone.value).toBe('(19) 99999-8888');
  });

  // ===== Troca de senha opcional =====

  it('deve abrir com a troca de senha fechada: sem campos de senha na tela e form válido', async () => {
    await montar();
    expect(fixture.nativeElement.querySelectorAll('app-input[tipo="password"]').length).toBe(0);
    expect(form().controls.senha.disabled).toBeTrue();
    expect(form().valid).toBeTrue();
  });

  it('abrir a troca de senha deve mostrar os três campos', async () => {
    await montar();
    abrirSenha();
    expect(fixture.nativeElement.querySelectorAll('app-input[tipo="password"]').length).toBe(3);
  });

  it('salvar sem abrir a troca de senha: atualiza os dados e NÃO chama a troca de senha', async () => {
    await montar();

    fixture.componentInstance['salvar']();
    fixture.detectChanges();

    expect(usuarioService.atualizarDados).toHaveBeenCalledWith({
      nome: 'Lucas Silva', email: 'lucas@email.com', telefone: '19999998888',
    });
    expect(usuarioService.alterarSenha).not.toHaveBeenCalled();
    expect(texto()).toContain('Dados atualizados com sucesso.');
    expect(authService.carregarUsuarioAtual).toHaveBeenCalled();
  });

  it('abrir a troca de senha e deixar em branco equivale a não trocar', async () => {
    await montar();
    abrirSenha();

    fixture.componentInstance['salvar']();

    expect(usuarioService.atualizarDados).toHaveBeenCalled();
    expect(usuarioService.alterarSenha).not.toHaveBeenCalled();
  });

  it('salvar com senha preenchida: chama a troca de senha e fecha a seção', async () => {
    await montar();
    abrirSenha();
    form().controls.senha.setValue({ senhaAtual: 'atual123', novaSenha: 'novasenha1', confirmarNovaSenha: 'novasenha1' });

    fixture.componentInstance['salvar']();
    fixture.detectChanges();

    expect(usuarioService.alterarSenha).toHaveBeenCalledWith({
      senhaAtual: 'atual123', novaSenha: 'novasenha1', confirmarNovaSenha: 'novasenha1',
    });
    expect(texto()).toContain('Dados e senha atualizados com sucesso.');
    expect(fixture.componentInstance['trocandoSenha']()).toBeFalse();
    expect(form().controls.senha.disabled).toBeTrue();
  });

  it('senha preenchida pela metade: não deve enviar nada', async () => {
    await montar();
    abrirSenha();
    form().controls.senha.setValue({ senhaAtual: '', novaSenha: 'novasenha1', confirmarNovaSenha: 'novasenha1' });

    fixture.componentInstance['salvar']();

    expect(usuarioService.atualizarDados).not.toHaveBeenCalled();
  });

  it('cancelar a troca de senha deve limpar os campos e liberar o salvar', async () => {
    await montar();
    abrirSenha();
    form().controls.senha.setValue({ senhaAtual: 'atual123', novaSenha: '', confirmarNovaSenha: '' });
    expect(form().invalid).toBeTrue();

    fixture.componentInstance['cancelarTrocaSenha']();

    expect(form().valid).toBeTrue();
    expect(form().controls.senha.getRawValue()).toEqual({ senhaAtual: '', novaSenha: '', confirmarNovaSenha: '' });
  });

  // ===== Mensagens de erro (borda vermelha) =====

  it('ao salvar com um campo inválido, só esse campo deve mostrar erro', async () => {
    await montar();
    form().controls.nome.setValue('');

    fixture.componentInstance['salvar']();

    expect(fixture.componentInstance['mostrarErroCampo']('nome')).toBeTrue();
    expect(fixture.componentInstance['mostrarErroCampo']('email')).toBeFalse();
    expect(fixture.componentInstance['mostrarErroCampo']('telefone')).toBeFalse();
  });

  it('telefone apagado deve ser enviado vazio (backend remove o telefone)', async () => {
    await montar();
    form().controls.telefone.setValue('');

    fixture.componentInstance['salvar']();

    expect(usuarioService.atualizarDados.calls.mostRecent().args[0].telefone).toBe('');
  });

  it('e-mail já em uso (409): deve mostrar a mensagem do backend inline', async () => {
    await montar();
    usuarioService.atualizarDados.and.returnValue(throwError(() => erroHttp(409, { erro: 'E-mail já está em uso' })));

    fixture.componentInstance['salvar']();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.editar-dados__aviso--erro').textContent).toContain('E-mail já está em uso');
  });

  it('dados salvos mas senha atual incorreta (422): deve avisar que só a senha falhou', async () => {
    await montar();
    usuarioService.alterarSenha.and.returnValue(throwError(() => erroHttp(422, { erro: 'Senha atual incorreta' })));
    abrirSenha();
    form().controls.senha.setValue({ senhaAtual: 'errada12', novaSenha: 'novasenha1', confirmarNovaSenha: 'novasenha1' });

    fixture.componentInstance['salvar']();
    fixture.detectChanges();

    expect(texto()).toContain('Seus dados foram salvos, mas a senha não foi alterada: Senha atual incorreta');
  });

  it('a confirmação de sucesso deve sumir quando o usuário volta a editar', async () => {
    await montar();
    fixture.componentInstance['salvar']();
    expect(fixture.componentInstance['avisoFormulario']()?.tipo).toBe('sucesso');

    form().controls.nome.setValue('Lucas F. Silva');

    expect(fixture.componentInstance['avisoFormulario']()).toBeNull();
  });

  // ===== Foto =====

  it('sem foto: deve mostrar o avatar de iniciais', async () => {
    await montar(null);
    expect(fixture.nativeElement.querySelector('.editar-dados__avatar--iniciais').textContent.trim()).toBe('LS');
  });

  it('com foto no FotoPerfilService: deve mostrar a imagem', async () => {
    await montar('blob:atual');
    expect(fixture.nativeElement.querySelector('img.editar-dados__avatar').getAttribute('src')).toBe('blob:atual');
  });

  it('foto com formato não suportado: não deve enviar e deve avisar', async () => {
    await montar();
    const gif = new File([new Uint8Array([1])], 'a.gif', { type: 'image/gif' });

    fixture.componentInstance['aoSelecionarArquivo'](eventoArquivo(gif));

    expect(fotoPerfilService.enviar).not.toHaveBeenCalled();
    expect(fixture.componentInstance['avisoFoto']()?.texto).toContain('Formato não suportado');
  });

  it('foto acima de 2 MB: não deve enviar e deve avisar', async () => {
    await montar();
    const grande = new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'a.png', { type: 'image/png' });

    fixture.componentInstance['aoSelecionarArquivo'](eventoArquivo(grande));

    expect(fotoPerfilService.enviar).not.toHaveBeenCalled();
    expect(fixture.componentInstance['avisoFoto']()?.texto).toContain('2 MB');
  });

  it('foto válida: deve enviar pelo FotoPerfilService (que atualiza todos os avatares)', async () => {
    await montar();
    const png = new File([new Uint8Array([1, 2])], 'a.png', { type: 'image/png' });

    fixture.componentInstance['aoSelecionarArquivo'](eventoArquivo(png));
    fixture.detectChanges();

    expect(fotoPerfilService.enviar).toHaveBeenCalledWith(png);
    expect(fixture.nativeElement.querySelector('img.editar-dados__avatar').getAttribute('src')).toBe('blob:nova');
    expect(texto()).toContain('Foto atualizada.');
  });

  it('remover foto: deve remover pelo FotoPerfilService e voltar às iniciais', async () => {
    await montar('blob:atual');

    fixture.nativeElement.querySelector('.editar-dados__remover-foto').click();
    fixture.detectChanges();

    expect(fotoPerfilService.remover).toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.editar-dados__avatar--iniciais')).toBeTruthy();
  });

  it('erro ao enviar foto: deve mostrar a mensagem do backend', async () => {
    await montar();
    fotoPerfilService.enviar.and.returnValue(
      throwError(() => erroHttp(422, { erro: 'O conteúdo do arquivo não corresponde a uma imagem válida' })),
    );
    const png = new File([new Uint8Array([1])], 'a.png', { type: 'image/png' });

    fixture.componentInstance['aoSelecionarArquivo'](eventoArquivo(png));

    expect(fixture.componentInstance['avisoFoto']()?.texto).toContain('não corresponde a uma imagem válida');
  });
});
