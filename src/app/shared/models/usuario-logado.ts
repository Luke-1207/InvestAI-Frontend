export interface UsuarioLogado {
  nome: string;
  email: string;
  role: 'USUARIO' | 'GESTOR';
}
