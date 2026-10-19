export const TIPOS_FOTO_ACEITOS = ['image/jpeg', 'image/png', 'image/webp'];
export const TAMANHO_MAXIMO_FOTO_BYTES = 2 * 1024 * 1024;
export const ACEITE_FOTO = TIPOS_FOTO_ACEITOS.join(',');

export function validarFotoPerfil(arquivo: File): string | null {
  if (!TIPOS_FOTO_ACEITOS.includes(arquivo.type)) return 'Formato não suportado. Use JPG, PNG ou WEBP.';
  if (arquivo.size > TAMANHO_MAXIMO_FOTO_BYTES) return 'A foto deve ter no máximo 2 MB.';
  return null;
}
