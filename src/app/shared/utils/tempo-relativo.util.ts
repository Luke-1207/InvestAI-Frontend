export function tempoRelativo(dataIso: string | null | undefined, agora: Date = new Date()): string {
  if (!dataIso) return '';
  const minutos = Math.floor((agora.getTime() - new Date(dataIso).getTime()) / 60_000);
  if (minutos < 1) return 'agora há pouco';
  if (minutos < 60) return minutos === 1 ? 'há 1 minuto' : `há ${minutos} minutos`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return horas === 1 ? 'há 1 hora' : `há ${horas} horas`;
  const dias = Math.floor(horas / 24);
  return dias === 1 ? 'há 1 dia' : `há ${dias} dias`;
}
