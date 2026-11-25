// Dados e regras do fluxo de voluntariado. Sem React: a página Astro e a ilha usam as mesmas listas.
// O número abaixo é o que aparece hoje no site antigo e ainda precisa ser confirmado com a liderança.
export const WHATSAPP_VOLUNTARIADO = '5551993943907';

export type CategoriaArea = 'louvor' | 'criancas' | 'jovens' | 'midia' | 'recepcao' | 'outros';

export const CATEGORIAS: ReadonlyArray<{ id: CategoriaArea; rotulo: string }> = [
  { id: 'louvor', rotulo: 'Louvor' },
  { id: 'criancas', rotulo: 'Crianças' },
  { id: 'jovens', rotulo: 'Jovens' },
  { id: 'midia', rotulo: 'Mídia' },
  { id: 'recepcao', rotulo: 'Recepção' },
  { id: 'outros', rotulo: 'Outros' },
];

export type IconeArea = 'musica' | 'sorriso' | 'controle' | 'video' | 'mao' | 'coracao' | 'globo' | 'aperto';

export interface AreaVoluntariado {
  id: string;
  nome: string;
  descricao: string;
  categoria: CategoriaArea;
  icone: IconeArea;
  habilidades: readonly string[];
  compromisso: string;
}

export const AREAS: readonly AreaVoluntariado[] = [
  {
    id: 'next',
    nome: 'Next (Crianças)',
    descricao: 'Ministério infantil que cuida e ensina as crianças durante os cultos.',
    categoria: 'criancas',
    icone: 'sorriso',
    habilidades: ['Paciência', 'Amor por crianças', 'Criatividade'],
    compromisso: 'Domingos pela manhã, em escalas rotativas.',
  },
  {
    id: 'hangout',
    nome: 'Hangout (Jovens)',
    descricao: 'Ministério de jovens que conecta e discipula a próxima geração.',
    categoria: 'jovens',
    icone: 'controle',
    habilidades: ['Comunicação', 'Liderança', 'Empatia'],
    compromisso: 'Sextas à noite e domingos.',
  },
  {
    id: 'outside',
    nome: 'Outside (Evangelismo)',
    descricao: 'Ministério que alcança pessoas fora da igreja com o amor de Jesus.',
    categoria: 'outros',
    icone: 'globo',
    habilidades: ['Comunicação', 'Coragem', 'Amor pelas pessoas'],
    compromisso: 'Sábados pela manhã.',
  },
  {
    id: 'diaconos',
    nome: 'Diáconos',
    descricao: 'Serviço prático de apoio à igreja e às pessoas que precisam.',
    categoria: 'outros',
    icone: 'aperto',
    habilidades: ['Disponibilidade', 'Coração servo', 'Organização'],
    compromisso: 'Domingos e eventos especiais.',
  },
  {
    id: 'louvor',
    nome: 'Louvor e Adoração',
    descricao: 'Ministério de música que conduz a congregação em adoração.',
    categoria: 'louvor',
    icone: 'musica',
    habilidades: ['Musicalidade', 'Dedicação', 'Compromisso com ensaios'],
    compromisso: 'Ensaios semanais e cultos de domingo.',
  },
  {
    id: 'midia',
    nome: 'Mídia e Comunicação',
    descricao: 'Transmissão online, áudio, vídeo e redes sociais.',
    categoria: 'midia',
    icone: 'video',
    habilidades: ['Conhecimento técnico', 'Atenção aos detalhes', 'Criatividade'],
    compromisso: 'Domingos e produção de conteúdo.',
  },
  {
    id: 'recepcao',
    nome: 'Recepção',
    descricao: 'Acolhimento de visitantes e membros nos cultos.',
    categoria: 'recepcao',
    icone: 'mao',
    habilidades: ['Simpatia', 'Comunicação', 'Organização'],
    compromisso: 'Domingos, em escalas rotativas.',
  },
  {
    id: 'intercessao',
    nome: 'Intercessão',
    descricao: 'Ministério de oração pela igreja e pelas necessidades de cada pessoa.',
    categoria: 'outros',
    icone: 'coracao',
    habilidades: ['Vida de oração', 'Compromisso', 'Discrição'],
    compromisso: 'Encontros semanais de oração.',
  },
];

export interface DadosVoluntario {
  nome: string;
  email: string;
  telefone: string;
  nascimento: string;
}

export const DADOS_INICIAIS: DadosVoluntario = {
  nome: '',
  email: '',
  telefone: '',
  nascimento: '',
};

export type CampoDados = keyof DadosVoluntario;
export type ErrosDados = Partial<Record<CampoDados, string>>;

export interface ErrosRevisao {
  areas?: string;
  consentimento?: string;
}

export function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}

// Formata enquanto a pessoa digita, sem deixar passar de 11 dígitos. Aceita fixo (10) e celular (11).
export function formatarTelefone(valor: string): string {
  const digitos = somenteDigitos(valor).slice(0, 11);
  if (digitos.length === 0) return '';
  if (digitos.length <= 2) return `(${digitos}`;

  const ddd = digitos.slice(0, 2);
  const resto = digitos.slice(2);
  // Celular começa com 9 e tem 5 dígitos antes do hífen; fixo tem 4. Usar o primeiro dígito
  // deixa a máscara estável enquanto a pessoa digita, sem o hífen pular no último dígito.
  const corte = resto.startsWith('9') ? 5 : 4;
  if (resto.length <= corte) return `(${ddd}) ${resto}`;

  return `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`;
}

export function telefoneValido(valor: string): boolean {
  const digitos = somenteDigitos(valor);
  if (digitos.length !== 10 && digitos.length !== 11) return false;
  const ddd = Number(digitos.slice(0, 2));
  return ddd >= 11 && ddd <= 99;
}

export function emailValido(valor: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim());
}

export function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split('-');
  if (!ano || !mes || !dia) return iso;
  return `${dia}/${mes}/${ano}`;
}

export function hojeISO(): string {
  const hoje = new Date();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${hoje.getFullYear()}-${mes}-${dia}`;
}

function nascimentoValido(iso: string): string | undefined {
  if (!iso) return 'Informe sua data de nascimento.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return 'Informe uma data de nascimento válida.';

  const [ano, mes, dia] = iso.split('-').map(Number);
  const data = new Date(ano ?? 0, (mes ?? 1) - 1, dia ?? 1);
  const dataReal =
    data.getFullYear() === ano && data.getMonth() === (mes ?? 1) - 1 && data.getDate() === dia;

  if (!dataReal || (ano ?? 0) < 1900) return 'Informe uma data de nascimento válida.';
  if (iso > hojeISO()) return 'A data de nascimento não pode estar no futuro.';
  return undefined;
}

// Valida os dados da primeira etapa. Devolve um objeto vazio quando está tudo certo.
export function validarDados(dados: DadosVoluntario): ErrosDados {
  const erros: ErrosDados = {};

  if (dados.nome.trim().length < 2) erros.nome = 'Informe seu nome completo.';
  if (!dados.email.trim()) erros.email = 'Informe seu e-mail.';
  else if (!emailValido(dados.email)) erros.email = 'Informe um e-mail válido.';

  if (!dados.telefone.trim()) erros.telefone = 'Informe seu WhatsApp com DDD.';
  else if (!telefoneValido(dados.telefone)) erros.telefone = 'Informe um WhatsApp válido, com DDD.';

  const erroNascimento = nascimentoValido(dados.nascimento);
  if (erroNascimento) erros.nascimento = erroNascimento;

  return erros;
}

export function validarAreas(areas: readonly string[], querOrientacao: boolean): ErrosRevisao {
  if (areas.length === 0 && !querOrientacao) {
    return { areas: 'Escolha pelo menos uma área ou peça orientação à liderança.' };
  }
  return {};
}

export function validarConsentimento(consentimento: boolean): ErrosRevisao {
  return consentimento ? {} : { consentimento: 'Autorize o contato para enviar seu cadastro.' };
}

// Resumo enviado pelo WhatsApp. É texto simples, com a formatação de negrito do próprio WhatsApp.
export function montarResumo(
  dados: DadosVoluntario,
  areas: readonly string[],
  querOrientacao: boolean,
): string {
  const nomes = AREAS.filter((area) => areas.includes(area.id)).map((area) => area.nome);

  const linhas = [
    '*Cadastro de voluntário — Igreja dos Vales*',
    '',
    `*Nome:* ${dados.nome.trim()}`,
    `*E-mail:* ${dados.email.trim()}`,
    `*WhatsApp:* ${dados.telefone.trim()}`,
    `*Nascimento:* ${formatarData(dados.nascimento)}`,
  ];

  if (nomes.length > 0) linhas.push(`*Áreas de interesse:* ${nomes.join(', ')}`);
  if (querOrientacao) linhas.push('*Orientação:* Quero ajuda da liderança para encontrar minha área.');

  linhas.push('', 'Mensagem gerada pelo site da Igreja dos Vales.');
  return linhas.join('\n');
}

// O base chega pronto da página Astro (a URL externa não é montada dentro do JS da ilha).
export function montarLinkWhatsApp(base: string, texto: string): string {
  const separador = base.includes('?') ? '&' : '?';
  return `${base}${separador}text=${encodeURIComponent(texto)}`;
}
