import { HttpErrorResponse } from '@angular/common/http';
import { errosDosCampos, mensagemDeAcesso, mensagemDoErro } from './erro-api.util';

function erroHttp(status: number, error: unknown): HttpErrorResponse {
  return new HttpErrorResponse({ status, error });
}

describe('erro-api.util', () => {
  it('errosDosCampos deve devolver os detalhes de validação só em erro 400', () => {
    expect(errosDosCampos(erroHttp(400, { erro: 'Erro de validação', detalhes: { nome: 'Nome é obrigatório' } }))).toEqual({
      nome: 'Nome é obrigatório',
    });
    expect(errosDosCampos(erroHttp(422, { detalhes: { nome: 'x' } }))).toEqual({});
    expect(errosDosCampos(erroHttp(400, { erro: 'x' }))).toEqual({});
    expect(errosDosCampos(new Error('qualquer'))).toEqual({});
  });

  it('mensagemDoErro deve usar a mensagem da API em erros de negócio e o padrão em falhas do servidor', () => {
    expect(mensagemDoErro(erroHttp(409, { erro: 'Já existe um ativo cadastrado com esse código' }), 'padrão')).toBe(
      'Já existe um ativo cadastrado com esse código',
    );
    expect(mensagemDoErro(erroHttp(500, { erro: 'NullPointerException' }), 'padrão')).toBe('padrão');
    expect(mensagemDoErro(erroHttp(404, null), 'padrão')).toBe('padrão');
    expect(mensagemDoErro(erroHttp(0, null), 'padrão')).toContain('Sem conexão');
    expect(mensagemDoErro('texto', 'padrão')).toBe('padrão');
  });

  it('mensagemDeAcesso deve mostrar o bloqueio por tentativas e a falta de conexão, e o padrão no resto', () => {
    const bloqueio = 'Muitas tentativas seguidas. Aguarde 15 minutos e tente de novo.';
    expect(mensagemDeAcesso(erroHttp(429, { erro: bloqueio }), 'padrão')).toBe(bloqueio);
    expect(mensagemDeAcesso(erroHttp(429, null), 'padrão')).toBe('padrão');
    expect(mensagemDeAcesso(erroHttp(0, null), 'padrão')).toContain('Sem conexão');
    expect(mensagemDeAcesso(erroHttp(422, { erro: 'Credenciais inválidas' }), 'padrão')).toBe('padrão');
    expect(mensagemDeAcesso(erroHttp(500, { erro: 'NullPointerException' }), 'padrão')).toBe('padrão');
  });
});
