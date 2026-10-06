import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { FotoPerfilService } from './foto-perfil.service';
import { UsuarioService } from './usuario.service';
import { DadosPessoais } from '../models/dados-pessoais';

function dados(possuiFoto: boolean): DadosPessoais {
  return { id: '1', nome: 'Lucas', email: 'lucas@email.com', telefone: null, possuiFoto };
}

describe('FotoPerfilService', () => {
  let service: FotoPerfilService;
  let usuarioService: jasmine.SpyObj<UsuarioService>;
  let contadorUrl: number;

  beforeEach(() => {
    usuarioService = jasmine.createSpyObj('UsuarioService', ['obter', 'obterFoto', 'enviarFoto', 'removerFoto']);
    contadorUrl = 0;
    spyOn(URL, 'createObjectURL').and.callFake(() => `blob:foto-${++contadorUrl}`);
    spyOn(URL, 'revokeObjectURL');

    TestBed.configureTestingModule({
      providers: [FotoPerfilService, { provide: UsuarioService, useValue: usuarioService }],
    });
    service = TestBed.inject(FotoPerfilService);
  });

  it('deve começar sem foto', () => {
    expect(service.url()).toBeNull();
  });

  it('carregar: com foto, deve baixar o blob e expor a URL', () => {
    usuarioService.obter.and.returnValue(of(dados(true)));
    usuarioService.obterFoto.and.returnValue(of(new Blob(['x'])));

    service.carregar();

    expect(service.url()).toBe('blob:foto-1');
  });

  it('carregar: sem foto, não deve nem pedir o arquivo', () => {
    usuarioService.obter.and.returnValue(of(dados(false)));

    service.carregar();

    expect(usuarioService.obterFoto).not.toHaveBeenCalled();
    expect(service.url()).toBeNull();
  });

  it('carregar: se a busca falhar, deve ficar sem foto', () => {
    usuarioService.obter.and.returnValue(throwError(() => new Error('falhou')));

    service.carregar();

    expect(service.url()).toBeNull();
  });

  it('carregar: deve limpar a foto anterior (evita mostrar a foto de outra conta)', () => {
    usuarioService.obter.and.returnValue(of(dados(true)));
    usuarioService.obterFoto.and.returnValue(of(new Blob(['x'])));
    service.carregar();

    usuarioService.obter.and.returnValue(of(dados(false)));
    service.carregar();

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:foto-1');
    expect(service.url()).toBeNull();
  });

  it('enviar: deve atualizar a URL só depois do sucesso do backend', () => {
    const arquivo = new File([new Uint8Array([1])], 'a.png', { type: 'image/png' });
    usuarioService.enviarFoto.and.returnValue(of(undefined));

    service.enviar(arquivo).subscribe();

    expect(usuarioService.enviarFoto).toHaveBeenCalledWith(arquivo);
    expect(service.url()).toBe('blob:foto-1');
  });

  it('enviar: se o backend recusar, deve manter a foto como estava', () => {
    const arquivo = new File([new Uint8Array([1])], 'a.png', { type: 'image/png' });
    usuarioService.enviarFoto.and.returnValue(throwError(() => new Error('422')));

    service.enviar(arquivo).subscribe({ error: () => {} });

    expect(service.url()).toBeNull();
  });

  it('remover: deve limpar a URL e liberar a anterior', () => {
    usuarioService.enviarFoto.and.returnValue(of(undefined));
    usuarioService.removerFoto.and.returnValue(of(undefined));
    service.enviar(new File([new Uint8Array([1])], 'a.png', { type: 'image/png' })).subscribe();

    service.remover().subscribe();

    expect(service.url()).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:foto-1');
  });
});
