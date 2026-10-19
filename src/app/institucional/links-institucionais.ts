export interface LinkInstitucional {
  rota: string;
  rotulo: string;
}

export const LINKS_INSTITUCIONAIS: LinkInstitucional[] = [
  { rota: '/termos-de-uso', rotulo: 'Termos de Uso' },
  { rota: '/privacidade', rotulo: 'Privacidade' },
  { rota: '/conformidade', rotulo: 'Conformidade' },
  { rota: '/regras-cvm', rotulo: 'Regras da CVM' },
];
