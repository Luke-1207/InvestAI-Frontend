import { ACEITE_FOTO, TAMANHO_MAXIMO_FOTO_BYTES, validarFotoPerfil } from './foto-perfil.util';

function arquivo(tipo: string, tamanho: number): File {
  return new File([new Uint8Array(tamanho)], 'foto', { type: tipo });
}

describe('validarFotoPerfil', () => {
  it('deve aceitar JPG, PNG e WEBP de até 2 MB', () => {
    expect(validarFotoPerfil(arquivo('image/jpeg', 10))).toBeNull();
    expect(validarFotoPerfil(arquivo('image/png', TAMANHO_MAXIMO_FOTO_BYTES))).toBeNull();
    expect(validarFotoPerfil(arquivo('image/webp', 10))).toBeNull();
    expect(ACEITE_FOTO).toBe('image/jpeg,image/png,image/webp');
  });

  it('deve recusar outros formatos e arquivos acima de 2 MB', () => {
    expect(validarFotoPerfil(arquivo('image/gif', 10))).toBe('Formato não suportado. Use JPG, PNG ou WEBP.');
    expect(validarFotoPerfil(arquivo('image/png', TAMANHO_MAXIMO_FOTO_BYTES + 1))).toBe('A foto deve ter no máximo 2 MB.');
  });
});
