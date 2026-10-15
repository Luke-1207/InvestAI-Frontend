export type CategoriaGlossario =
  | 'Renda variável'
  | 'Renda fixa'
  | 'Indexadores'
  | 'Indicadores de ações'
  | 'Indicadores de mercado';

export interface TermoGlossario {
  chave: string;
  termo: string;
  categoria: CategoriaGlossario;
  definicao: string;
  importancia: string;
}

export const CATEGORIAS_GLOSSARIO: CategoriaGlossario[] = [
  'Renda variável',
  'Renda fixa',
  'Indexadores',
  'Indicadores de ações',
  'Indicadores de mercado',
];

export const TERMOS_GLOSSARIO: TermoGlossario[] = [
  {
    chave: 'ACAO',
    termo: 'Ação',
    categoria: 'Renda variável',
    definicao:
      'Um pedacinho de uma empresa negociado na bolsa de valores, a B3. Quem compra ações vira sócio e participa dos lucros e também das perdas.',
    importancia:
      'Ações podem render bem no longo prazo, mas o preço sobe e desce bastante no dia a dia. Combinam com quem pode deixar o dinheiro aplicado por anos.',
  },
  {
    chave: 'FII',
    termo: 'FII (Fundo Imobiliário)',
    categoria: 'Renda variável',
    definicao:
      'Fundo que junta o dinheiro de muitas pessoas para investir em imóveis, como shoppings, galpões e escritórios, ou em títulos ligados ao setor imobiliário.',
    importancia:
      'Os aluguéis viram rendimentos, em geral pagos todo mês e isentos de Imposto de Renda para pessoa física. Por isso são populares entre quem busca uma renda extra.',
  },
  {
    chave: 'ETF',
    termo: 'ETF (Fundo de Índice)',
    categoria: 'Renda variável',
    definicao:
      'Fundo negociado na bolsa que copia a carteira de um índice, como o Ibovespa. Com uma única cota você investe em várias empresas ao mesmo tempo.',
    importancia:
      'É um jeito simples e barato de diversificar, sem precisar escolher empresa por empresa.',
  },
  {
    chave: 'TESOURO',
    termo: 'Tesouro Direto',
    categoria: 'Renda fixa',
    definicao:
      'Programa do governo federal para vender títulos públicos pela internet. Ao comprar um título, você empresta dinheiro ao governo e recebe juros por isso.',
    importancia:
      'É considerado o investimento mais seguro do país e dá para começar com pouco dinheiro.',
  },
  {
    chave: 'CDB',
    termo: 'CDB (Certificado de Depósito Bancário)',
    categoria: 'Renda fixa',
    definicao:
      'Título em que você empresta dinheiro a um banco e recebe juros em troca.',
    importancia:
      'Tem garantia do FGC até R$ 250 mil por CPF em cada instituição e costuma render mais que a poupança. O rendimento paga Imposto de Renda.',
  },
  {
    chave: 'LCI',
    termo: 'LCI (Letra de Crédito Imobiliário)',
    categoria: 'Renda fixa',
    definicao:
      'Funciona como um CDB, mas o banco usa o dinheiro para financiar o setor imobiliário.',
    importancia:
      'É isenta de Imposto de Renda para pessoa física e tem garantia do FGC. Em troca, costuma exigir um prazo mínimo antes de você poder resgatar.',
  },
  {
    chave: 'LCA',
    termo: 'LCA (Letra de Crédito do Agronegócio)',
    categoria: 'Renda fixa',
    definicao:
      'Funciona como um CDB, mas o banco usa o dinheiro para financiar o agronegócio.',
    importancia:
      'Assim como a LCI, é isenta de Imposto de Renda para pessoa física, tem garantia do FGC e costuma ter prazo mínimo para resgate.',
  },
  {
    chave: 'SELIC',
    termo: 'Selic',
    categoria: 'Indexadores',
    definicao:
      'Taxa básica de juros da economia brasileira, definida pelo Banco Central a cada 45 dias. No topo da tela aparece o valor atual, ao ano.',
    importancia:
      'Serve de referência para quase todos os juros do país. Quando a Selic sobe, a renda fixa passa a render mais. Quando cai, rende menos.',
  },
  {
    chave: 'CDI',
    termo: 'CDI',
    categoria: 'Indexadores',
    definicao:
      'Taxa que os bancos usam para emprestar dinheiro entre si. Ela anda quase colada na Selic.',
    importancia:
      'A maioria dos CDBs, LCIs e LCAs rende um percentual do CDI. Um CDB de 110% do CDI, por exemplo, rende 10% a mais que o próprio CDI.',
  },
  {
    chave: 'IPCA',
    termo: 'IPCA',
    categoria: 'Indexadores',
    definicao:
      'Índice oficial de inflação do Brasil, calculado pelo IBGE. Mostra quanto os preços subiram. No topo da tela aparece o acumulado dos últimos 12 meses.',
    importancia:
      'Se o seu dinheiro rende menos que o IPCA, você perde poder de compra. Títulos atrelados ao IPCA pagam a inflação mais uma taxa fixa, o que protege o seu dinheiro no longo prazo.',
  },
  {
    chave: 'PREFIXADO',
    termo: 'Prefixado',
    categoria: 'Indexadores',
    definicao:
      'Investimento em que a taxa de juros é definida no momento da compra, por exemplo 12% ao ano.',
    importancia:
      'Você sabe exatamente quanto vai receber se ficar até o vencimento. Em compensação, se os juros do mercado subirem depois, o título passa a render menos que as opções novas.',
  },
  {
    chave: 'DY',
    termo: 'DY (Dividend Yield)',
    categoria: 'Indicadores de ações',
    definicao:
      'Quanto a empresa pagou em dividendos nos últimos 12 meses em relação ao preço da ação. Um DY de 7% quer dizer que, a cada R$ 100 investidos, você recebeu R$ 7 no último ano.',
    importancia:
      'Ajuda a comparar quanto cada ação devolve em renda. Um DY muito alto merece atenção, porque às vezes é resultado de uma queda forte no preço.',
  },
  {
    chave: 'PL',
    termo: 'P/L (Preço sobre Lucro)',
    categoria: 'Indicadores de ações',
    definicao:
      'Preço da ação dividido pelo lucro por ação. Indica em quantos anos o lucro atual da empresa pagaria o preço da ação.',
    importancia:
      'Um P/L baixo pode indicar uma ação barata, e um alto pode indicar que o mercado espera crescimento. Compare sempre com empresas do mesmo setor.',
  },
  {
    chave: 'PVP',
    termo: 'P/VP (Preço sobre Valor Patrimonial)',
    categoria: 'Indicadores de ações',
    definicao:
      'Preço da ação dividido pelo valor patrimonial por ação, que é quanto a empresa vale no balanço.',
    importancia:
      'Abaixo de 1, a ação está sendo negociada por menos do que a empresa vale no papel. Nos FIIs é um dos indicadores mais usados.',
  },
  {
    chave: 'FAIXA_52_SEMANAS',
    termo: 'Mínima e máxima de 52 semanas',
    categoria: 'Indicadores de ações',
    definicao:
      'O menor e o maior preço da ação nos últimos 12 meses.',
    importancia:
      'Mostra a faixa em que o preço andou no último ano e ajuda a ver se o preço de hoje está perto do topo ou do fundo.',
  },
  {
    chave: 'VOLUME',
    termo: 'Volume',
    categoria: 'Indicadores de ações',
    definicao:
      'Quanto a ação foi negociada no dia.',
    importancia:
      'Volume alto indica liquidez, ou seja, é fácil comprar e vender sem mexer muito no preço. Com volume baixo, pode ser difícil vender na hora em que você precisar.',
  },
  {
    chave: 'IBOVESPA',
    termo: 'Ibovespa',
    categoria: 'Indicadores de mercado',
    definicao:
      'Principal índice da bolsa brasileira. Acompanha as ações mais negociadas da B3, e o valor no topo da tela está em pontos.',
    importancia:
      'É o termômetro do mercado de ações. Quando ele sobe, a maior parte das grandes empresas da bolsa se valorizou no dia.',
  },
  {
    chave: 'DOLAR',
    termo: 'Dólar',
    categoria: 'Indicadores de mercado',
    definicao:
      'Quanto custa um dólar americano em reais.',
    importancia:
      'Influencia o preço de produtos importados, combustíveis e viagens, além dos resultados de empresas que exportam ou têm dívidas em dólar.',
  },
  {
    chave: 'EURO',
    termo: 'Euro',
    categoria: 'Indicadores de mercado',
    definicao:
      'Quanto custa um euro em reais.',
    importancia:
      'Influencia o preço de produtos europeus e viagens, e os resultados de empresas que fazem negócios com a Europa.',
  },
];

const TERMOS_POR_CHAVE = new Map(TERMOS_GLOSSARIO.map((termo) => [termo.chave, termo]));

export function termoGlossario(chave: string | null | undefined): TermoGlossario | undefined {
  return chave ? TERMOS_POR_CHAVE.get(chave) : undefined;
}
