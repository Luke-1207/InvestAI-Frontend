export interface UsuarioResponseDTO {
  id: string;
  nome: string;
  email: string;
  role: 'USUARIO' | 'GESTOR';
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}
