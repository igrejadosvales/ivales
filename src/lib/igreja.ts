// Fonte única dos dados institucionais da igreja: domínio, locais, horários e redes.
// Tudo que aparece no site (home, contato, rodapé) e nos dados estruturados (JSON-LD) sai daqui,
// para nome, endereço e horários ficarem sempre iguais (consistência importa para a busca local).
//
// PENDENTE: telefone/WhatsApp real, e-mail no domínio ivales.org e CEPs. Enquanto não chegam,
// ficam fora do JSON-LD (ver docs/seo.md).

export const SITE_URL = 'https://ivales.org';
export const NOME_IGREJA = 'Igreja dos Vales';

export type DiaSemana = 'Domingo' | 'Quarta';

// Dia no formato do schema.org (openingHoursSpecification.dayOfWeek).
export const DIA_SCHEMA: Record<DiaSemana, string> = {
  Domingo: 'https://schema.org/Sunday',
  Quarta: 'https://schema.org/Wednesday',
};

export interface Culto {
  dia: DiaSemana;
  /** Horários no formato HH:MM. */
  horas: string[];
}

export interface Local {
  id: 'gravatai' | 'porto-alegre';
  nome: string;
  rua: string;
  bairro?: string;
  cidade: string;
  uf: 'RS';
  cultos: Culto[];
}

export const LOCAIS: Local[] = [
  {
    id: 'gravatai',
    nome: 'Igreja dos Vales Gravataí',
    rua: 'Rua Santa Clara, 192',
    cidade: 'Gravataí',
    uf: 'RS',
    cultos: [
      { dia: 'Domingo', horas: ['10:00', '17:00', '20:00'] },
      { dia: 'Quarta', horas: ['20:00'] },
    ],
  },
  {
    id: 'porto-alegre',
    nome: 'Igreja dos Vales Porto Alegre',
    rua: 'Av. Assis Brasil, 6715',
    bairro: 'Sarandi',
    cidade: 'Porto Alegre',
    uf: 'RS',
    cultos: [
      { dia: 'Domingo', horas: ['19:00'] },
      { dia: 'Quarta', horas: ['20:00'] },
    ],
  },
];

export const REDES = {
  instagram: [
    { usuario: 'ivalesonline', url: 'https://www.instagram.com/ivalesonline/' },
    { usuario: 'ivalespoa', url: 'https://www.instagram.com/ivalespoa/' },
  ],
  youtube: 'https://www.youtube.com/@ivalesonline',
} as const;

export const localPorId = (id: Local['id']): Local => {
  const local = LOCAIS.find((l) => l.id === id);
  if (!local) throw new Error(`Local desconhecido: ${id}`);
  return local;
};

/** "10:00" → "10h"; "19:30" → "19h30". */
export function formatarHora(hora: string): string {
  const [h, m] = hora.split(':');
  return m === '00' ? `${Number(h)}h` : `${Number(h)}h${m}`;
}

/** ["10:00","17:00","20:00"] → "10h, 17h e 20h". */
export function listarHoras(horas: string[]): string {
  const f = horas.map(formatarHora);
  return f.length <= 1 ? (f[0] ?? '') : `${f.slice(0, -1).join(', ')} e ${f.at(-1)}`;
}

export function horasDoDia(local: Local, dia: DiaSemana): string {
  return listarHoras(local.cultos.find((c) => c.dia === dia)?.horas ?? []);
}

/** "Rua Santa Clara, 192 - Gravataí" / "Av. Assis Brasil, 6715 - Sarandi, Porto Alegre". */
export function enderecoCurto(local: Local): string {
  return local.bairro ? `${local.rua} - ${local.bairro}, ${local.cidade}` : `${local.rua} - ${local.cidade}`;
}

/** "Domingo às 10h, 17h e 20h • Quarta às 20h". */
export function textoHorarios(local: Local): string {
  return local.cultos.map((c) => `${c.dia} às ${listarHoras(c.horas)}`).join(' • ');
}

/** Frase para o FAQ e textos corridos, com os dois locais. */
export function resumoCultos(): string {
  return LOCAIS.map((l) => {
    const partes = l.cultos.map((c) => `${c.dia === 'Domingo' ? 'aos domingos' : 'às quartas'} às ${listarHoras(c.horas)}`);
    return `em ${l.cidade}, ${partes.join(' e ')}`;
  }).join('; ');
}

export function linkComoChegar(local: Local): string {
  const destino = `${NOME_IGREJA}, ${local.rua}, ${local.bairro ? `${local.bairro}, ` : ''}${local.cidade} - ${local.uf}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destino)}`;
}

// ---------- JSON-LD ----------

function postalAddress(local: Local) {
  return {
    '@type': 'PostalAddress',
    streetAddress: local.bairro ? `${local.rua}, ${local.bairro}` : local.rua,
    addressLocality: local.cidade,
    addressRegion: local.uf,
    addressCountry: 'BR',
  };
}

function horariosSchema(local: Local) {
  // Cada culto vira um intervalo de 2h a partir do início.
  return local.cultos.flatMap((c) =>
    c.horas.map((inicio) => {
      const [h, m] = inicio.split(':').map(Number);
      const fim = `${String(((h ?? 0) + 2) % 24).padStart(2, '0')}:${String(m ?? 0).padStart(2, '0')}`;
      return { '@type': 'OpeningHoursSpecification', dayOfWeek: DIA_SCHEMA[c.dia], opens: inicio, closes: fim };
    }),
  );
}

export function schemaOrganizacao() {
  const logo = `${SITE_URL}/brand/apple-touch-icon.png`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Church',
    '@id': `${SITE_URL}/#igreja`,
    name: NOME_IGREJA,
    alternateName: 'iVales',
    url: SITE_URL,
    logo,
    image: logo,
    address: postalAddress(localPorId('gravatai')),
    sameAs: [...REDES.instagram.map((i) => i.url), REDES.youtube],
    subOrganization: LOCAIS.map((l) => ({
      '@type': 'Church',
      '@id': `${SITE_URL}/#${l.id}`,
      name: l.nome,
      url: `${SITE_URL}/contato/`,
      image: logo,
      address: postalAddress(l),
      openingHoursSpecification: horariosSchema(l),
      parentOrganization: { '@id': `${SITE_URL}/#igreja` },
    })),
  };
}

export function schemaSite() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#site`,
    name: NOME_IGREJA,
    url: SITE_URL,
    inLanguage: 'pt-BR',
    publisher: { '@id': `${SITE_URL}/#igreja` },
  };
}

export function schemaBreadcrumb(nome: string, caminho: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: nome, item: new URL(caminho, SITE_URL).toString() },
    ],
  };
}

export function schemaFaq(perguntas: readonly { pergunta: string; resposta: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: perguntas.map((p) => ({
      '@type': 'Question',
      name: p.pergunta,
      acceptedAnswer: { '@type': 'Answer', text: p.resposta },
    })),
  };
}
