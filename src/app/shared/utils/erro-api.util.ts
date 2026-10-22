import { HttpErrorResponse } from '@angular/common/http';

export function errosDosCampos(erro: unknown): Record<string, string> {
  if (!(erro instanceof HttpErrorResponse) || erro.status !== 400) return {};
  const detalhes = erro.error?.detalhes;
  return detalhes && typeof detalhes === 'object' ? (detalhes as Record<string, string>) : {};
}

export function mensagemDeAcesso(erro: unknown, padrao: string): string {
  if (erro instanceof HttpErrorResponse && (erro.status === 0 || erro.status === 429)) return mensagemDoErro(erro, padrao);
  return padrao;
}

export function mensagemDoErro(erro: unknown, padrao: string): string {
  if (!(erro instanceof HttpErrorResponse)) return padrao;
  if (erro.status === 0) return 'Sem conexão com o servidor. Confira sua internet e tente de novo.';
  if (erro.status >= 500) return padrao;
  const mensagem = erro.error?.erro;
  return typeof mensagem === 'string' && mensagem ? mensagem : padrao;
}
