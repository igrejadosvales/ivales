// Fonte única dos iGrupos (pequenos grupos) exibidos em /igrupos.
// Os telefones dos líderes vêm da planilha da igreja; a página só expõe o botão de WhatsApp.
// ATENÇÃO: lat/lng são APROXIMADAS (centro do bairro, não o ponto exato da casa) e de propósito:
// assim o mapa não revela a casa de ninguém e não precisamos enviar endereços a serviços de geocodificação.

export type PerfilIgrupo = 'Casais' | 'Misto' | 'Misto Next' | 'Misto Jovens';
export type DiaIgrupo = 'Segunda' | 'Quinta' | 'Sexta';
export type CidadeIgrupo = 'Porto Alegre' | 'Canoas' | 'Alvorada' | 'Glorinha';

export interface LiderIgrupo {
  nome: string;
  /** Somente dígitos, com DDD (ex.: 51980377546). Ausente quando a planilha não tem o número. */
  whatsapp?: string;
}

export interface Igrupo {
  id: string;
  nome: string;
  lideres: LiderIgrupo[];
  cidade: CidadeIgrupo;
  /** Vazio para grupos online. */
  bairro: string;
  endereco: string;
  perfil: PerfilIgrupo;
  dia: DiaIgrupo;
  hora: string;
  quinzenal: boolean;
  online: boolean;
  /** Posição aproximada. Para grupos online é a do centro da região, e o grupo não aparece no mapa. */
  lat: number;
  lng: number;
}

export const IGRUPOS: Igrupo[] = [
  {
    id: 'cleber-estefani',
    nome: 'Cléber e Estéfani',
    lideres: [
      { nome: 'Cléber', whatsapp: '51980377546' },
      { nome: 'Estéfani', whatsapp: '51980488729' },
    ],
    cidade: 'Porto Alegre',
    bairro: 'Costa e Silva',
    endereco: 'Av. Baltazar de Oliveira Garcia, 2478',
    perfil: 'Casais',
    dia: 'Segunda',
    hora: '20h',
    quinzenal: false,
    online: false,
    lat: -30.0165,
    lng: -51.1635,
  },
  {
    id: 'andrew-nath',
    nome: 'Andrew e Nath',
    lideres: [
      { nome: 'Andrew', whatsapp: '51985964833' },
      { nome: 'Nath', whatsapp: '51992368135' },
    ],
    cidade: 'Porto Alegre',
    bairro: 'Costa e Silva',
    endereco: 'Rua Heleno Nobre, 976',
    perfil: 'Misto',
    dia: 'Quinta',
    hora: '20h',
    quinzenal: false,
    online: false,
    lat: -30.0215,
    lng: -51.1675,
  },
  {
    id: 'keven-ana',
    nome: 'Keven e Ana',
    lideres: [
      { nome: 'Keven', whatsapp: '51995001910' },
      { nome: 'Ana', whatsapp: '51996586697' },
    ],
    cidade: 'Porto Alegre',
    bairro: 'Passo das Pedras',
    endereco: 'Rua Edimundo Figueira da Silva, 21',
    perfil: 'Misto',
    dia: 'Quinta',
    hora: '20h',
    quinzenal: false,
    online: false,
    lat: -30.0045,
    lng: -51.1385,
  },
  {
    id: 'gustavo-victoria',
    nome: 'Pr. Gustavo e Victoria',
    lideres: [{ nome: 'Pr. Gustavo' }, { nome: 'Victoria' }],
    cidade: 'Porto Alegre',
    bairro: 'São Sebastião',
    endereco: 'R. Jerônymo Zelmanovitz, 100',
    perfil: 'Misto',
    dia: 'Segunda',
    hora: '20h',
    quinzenal: false,
    online: false,
    lat: -30.0105,
    lng: -51.1495,
  },
  {
    id: 'douglas-thay',
    nome: 'Douglas e Thay',
    lideres: [
      { nome: 'Douglas', whatsapp: '51992628349' },
      { nome: 'Thay', whatsapp: '51992937162' },
    ],
    cidade: 'Porto Alegre',
    bairro: 'Sarandi',
    endereco: 'Rua Vidal Barbosa, 961',
    perfil: 'Misto',
    dia: 'Segunda',
    hora: '20h',
    quinzenal: false,
    online: false,
    lat: -30.0,
    lng: -51.1185,
  },
  {
    id: 'bred-mari',
    nome: 'Bred e Mari',
    lideres: [
      { nome: 'Bred', whatsapp: '51996097156' },
      { nome: 'Mari', whatsapp: '51997673574' },
    ],
    cidade: 'Porto Alegre',
    bairro: '',
    endereco: 'Online',
    perfil: 'Misto',
    dia: 'Segunda',
    hora: '20h30',
    quinzenal: false,
    online: true,
    lat: -30.0346,
    lng: -51.2177,
  },
  {
    id: 'criciano-barbara',
    nome: 'Criciano e Bárbara',
    lideres: [{ nome: 'Nito', whatsapp: '51985711390' }, { nome: 'Bárbara' }],
    cidade: 'Alvorada',
    bairro: 'Maringá',
    endereco: 'Rua 10, 208',
    perfil: 'Misto',
    dia: 'Segunda',
    hora: '20h',
    quinzenal: false,
    online: false,
    lat: -29.9895,
    lng: -51.0765,
  },
  {
    id: 'elio',
    nome: 'Élio',
    lideres: [{ nome: 'Élio', whatsapp: '98984608865' }],
    cidade: 'Porto Alegre',
    bairro: 'São Sebastião',
    endereco: 'R. Jerônymo Zelmanovitz, 100',
    perfil: 'Misto Next',
    dia: 'Quinta',
    hora: '20h',
    quinzenal: false,
    online: false,
    lat: -30.0115,
    lng: -51.1478,
  },
  {
    id: 'isaque-julya',
    nome: 'Isaque e Julya',
    lideres: [
      { nome: 'Isaque', whatsapp: '51993171615' },
      { nome: 'Julya', whatsapp: '51999597872' },
    ],
    cidade: 'Porto Alegre',
    bairro: 'São João',
    endereco: 'Av. Ceará, 1664',
    perfil: 'Misto Jovens',
    dia: 'Quinta',
    hora: '20h',
    quinzenal: false,
    online: false,
    lat: -30.0115,
    lng: -51.1925,
  },
  {
    id: 'fabio-gabi',
    nome: 'Fábio e Gabi',
    lideres: [
      { nome: 'Fábio', whatsapp: '34996946306' },
      { nome: 'Gabi', whatsapp: '51980158726' },
    ],
    cidade: 'Porto Alegre',
    bairro: 'São Sebastião',
    endereco: 'R. Jerônymo Zelmanovitz, 100',
    perfil: 'Misto',
    dia: 'Quinta',
    hora: '20h',
    quinzenal: false,
    online: false,
    lat: -30.0097,
    lng: -51.1511,
  },
  {
    id: 'eliezer-fernanda',
    nome: 'Eliézer e Fernanda',
    lideres: [
      { nome: 'Eliézer', whatsapp: '51998725711' },
      { nome: 'Fernanda', whatsapp: '51981048636' },
    ],
    cidade: 'Canoas',
    bairro: 'Niterói',
    endereco: 'Rua Garibaldi, 97',
    perfil: 'Misto',
    dia: 'Quinta',
    hora: '20h',
    quinzenal: false,
    online: false,
    lat: -29.9055,
    lng: -51.1765,
  },
  {
    id: 'diego-dani',
    nome: 'Diego e Dani',
    lideres: [
      { nome: 'Diego', whatsapp: '51993842223' },
      { nome: 'Dani', whatsapp: '51989481346' },
    ],
    cidade: 'Canoas',
    bairro: 'Olaria',
    endereco: 'Rua Irmã Maria Hiltgardis, 376',
    perfil: 'Misto',
    dia: 'Quinta',
    hora: '20h',
    quinzenal: false,
    online: false,
    lat: -29.9385,
    lng: -51.1625,
  },
  {
    id: 'wellington-ester',
    nome: 'Wellington e Ester',
    lideres: [
      { nome: 'Wellington', whatsapp: '51980116907' },
      { nome: 'Ester', whatsapp: '51985143465' },
    ],
    cidade: 'Canoas',
    bairro: 'Nossa Senhora das Graças',
    endereco: 'Rua Tupinambás, 182',
    perfil: 'Misto',
    dia: 'Sexta',
    hora: '20h',
    quinzenal: true,
    online: false,
    lat: -29.9205,
    lng: -51.1895,
  },
  {
    id: 'escobar-fran',
    nome: 'Escobar e Fran',
    lideres: [{ nome: 'Escobar' }, { nome: 'Fran', whatsapp: '51999669481' }],
    cidade: 'Glorinha',
    bairro: 'Centro',
    endereco: 'Sindlojas Glorinha',
    perfil: 'Misto',
    dia: 'Quinta',
    hora: '20h',
    quinzenal: true,
    online: false,
    lat: -29.8785,
    lng: -50.7825,
  },
];

export const PERFIS: PerfilIgrupo[] = ['Casais', 'Misto', 'Misto Next', 'Misto Jovens'];
export const DIAS: DiaIgrupo[] = ['Segunda', 'Quinta', 'Sexta'];
export const CIDADES: CidadeIgrupo[] = ['Porto Alegre', 'Canoas', 'Alvorada', 'Glorinha'];

export function linkWhatsapp(numero: string, igrupo: string): string {
  const texto = `Olá! Quero conhecer o iGrupo ${igrupo} da Igreja dos Vales.`;
  return `https://wa.me/55${numero}?text=${encodeURIComponent(texto)}`;
}

export function quandoReune(g: Igrupo): string {
  return `${g.dia} às ${g.hora}${g.quinzenal ? ' · quinzenal' : ''}`;
}

export function localDoGrupo(g: Igrupo): string {
  return g.online ? 'Online' : `${g.bairro} · ${g.cidade}`;
}

const semAcento = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export interface FiltrosIgrupos {
  busca: string;
  cidade: CidadeIgrupo | null;
  perfil: PerfilIgrupo | null;
  dia: DiaIgrupo | null;
  online: boolean;
}

export const FILTROS_VAZIOS: FiltrosIgrupos = { busca: '', cidade: null, perfil: null, dia: null, online: false };

export function filtrarIgrupos(lista: Igrupo[], f: FiltrosIgrupos): Igrupo[] {
  const termo = semAcento(f.busca.trim());
  return lista.filter((g) => {
    if (f.cidade && g.cidade !== f.cidade) return false;
    if (f.perfil && g.perfil !== f.perfil) return false;
    if (f.dia && g.dia !== f.dia) return false;
    if (f.online && !g.online) return false;
    if (!termo) return true;
    const palheiro = semAcento(
      [g.nome, g.bairro, g.endereco, g.cidade, g.perfil, ...g.lideres.map((l) => l.nome)].join(' '),
    );
    return termo.split(/\s+/).every((p) => palheiro.includes(p));
  });
}
