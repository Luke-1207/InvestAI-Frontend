export interface DicaEducativa {
  titulo: string;
  texto: string;
}

export const DICAS_EDUCATIVAS: DicaEducativa[] = [
  {
    titulo: 'Reserva de emergência vem primeiro',
    texto: 'Antes de investir em algo que oscila, guarde de 3 a 6 meses do seu custo de vida em um investimento com liquidez diária, como o Tesouro Selic ou um CDB com resgate diário.',
  },
  {
    titulo: 'Diversificar reduz o risco',
    texto: 'Dividir o dinheiro entre tipos diferentes de investimento evita que um único resultado ruim pese demais no seu patrimônio.',
  },
  {
    titulo: 'Juros compostos precisam de tempo',
    texto: 'Quando os rendimentos são reinvestidos, eles também passam a render. Por isso começar cedo, mesmo com pouco, faz tanta diferença.',
  },
  {
    titulo: 'Liquidez é quando você pode resgatar',
    texto: 'Liquidez diária quer dizer que dá para sacar em qualquer dia útil. Liquidez no vencimento quer dizer que o dinheiro fica preso até a data final do título.',
  },
  {
    titulo: 'O FGC protege até um limite',
    texto: 'CDB, LCI e LCA contam com o Fundo Garantidor de Créditos, que cobre até R$ 250 mil por CPF em cada instituição se o banco quebrar.',
  },
  {
    titulo: 'LCI e LCA não pagam Imposto de Renda',
    texto: 'Para pessoa física, LCI e LCA são isentas de IR. Para comparar com um CDB, olhe a rentabilidade do CDB já descontado o imposto.',
  },
  {
    titulo: 'O IR da renda fixa cai com o tempo',
    texto: 'Na tabela regressiva, o imposto sobre o rendimento começa em 22,5% para resgates em até 6 meses e cai até 15% depois de 2 anos.',
  },
  {
    titulo: 'Passado não garante futuro',
    texto: 'Um ativo que subiu muito no último ano pode não repetir o resultado. Olhe também os fundamentos e se ele combina com o seu objetivo.',
  },
  {
    titulo: 'Dividend yield alto nem sempre é bom sinal',
    texto: 'O DY compara os proventos dos últimos 12 meses com o preço atual. Se o preço caiu muito, o DY sobe, mesmo sem a empresa pagar mais.',
  },
  {
    titulo: 'Oscilar faz parte da renda variável',
    texto: 'Quedas no curto prazo são normais em ações e fundos imobiliários. O que importa é o investimento combinar com o prazo em que você vai precisar do dinheiro.',
  },
  {
    titulo: 'Aportes regulares criam disciplina',
    texto: 'Investir um valor todo mês, mesmo que pequeno, cria o hábito e evita a tentação de tentar acertar o melhor momento de comprar.',
  },
  {
    titulo: 'Taxas diminuem o rendimento',
    texto: 'Antes de investir, confira as taxas cobradas, como administração e custódia. Uma diferença pequena ao ano pesa bastante no longo prazo.',
  },
  {
    titulo: 'Fundos imobiliários com pouco dinheiro',
    texto: 'Com uma cota de FII você passa a ser dono de uma pequena parte de imóveis como shoppings e galpões, e costuma receber rendimentos todo mês.',
  },
  {
    titulo: 'Tesouro IPCA+ acompanha a inflação',
    texto: 'Ele paga a inflação do período mais uma taxa fixa. Se você vender antes do vencimento, o preço pode estar acima ou abaixo do que pagou.',
  },
  {
    titulo: 'Prefixado: você sabe a taxa desde o início',
    texto: 'No título prefixado a rentabilidade é combinada na compra. Levando até o vencimento você recebe o combinado. Vendendo antes, pode ganhar ou perder.',
  },
  {
    titulo: 'Seu perfil muda com a vida',
    texto: 'Mudou de emprego, teve filhos ou definiu um novo objetivo? Vale refazer o quiz para as sugestões continuarem fazendo sentido para você.',
  },
  {
    titulo: 'Dinheiro com data marcada pede segurança',
    texto: 'Se você vai precisar do dinheiro em menos de um ano, prefira investimentos de baixo risco e com boa liquidez, mesmo rendendo um pouco menos.',
  },
  {
    titulo: 'Desconfie de ganho fácil',
    texto: 'Retorno alto e garantido é sinal de alerta. Antes de investir, confira se a instituição é autorizada pela CVM ou pelo Banco Central.',
  },
  {
    titulo: 'O que o P/L conta sobre uma ação',
    texto: 'O P/L divide o preço da ação pelo lucro por ação. Ele só faz sentido comparado com empresas do mesmo setor, nunca sozinho.',
  },
  {
    titulo: 'Entenda o CDI',
    texto: 'A maioria dos CDBs rende um percentual do CDI, taxa que anda bem perto da Selic. Um CDB de 110% do CDI rende mais do que um de 100%.',
  },
  {
    titulo: 'Render menos que a inflação é perder',
    texto: 'Se o investimento rende menos que a inflação, seu saldo cresce mas compra menos coisas. Compare sempre a rentabilidade com o IPCA.',
  },
];

const UM_DIA_EM_MS = 24 * 60 * 60 * 1000;

export function dicaEducativaDoDia(data: Date): DicaEducativa {
  const dia = Math.floor(Date.UTC(data.getFullYear(), data.getMonth(), data.getDate()) / UM_DIA_EM_MS);
  return DICAS_EDUCATIVAS[dia % DICAS_EDUCATIVAS.length];
}
