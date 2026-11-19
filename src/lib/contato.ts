import { emailValido, formatarTelefone, montarLinkWhatsApp, telefoneValido } from './voluntariado';

export const WHATSAPP_CONTATO = '5511999999999';
export const EMAIL_CONTATO = 'contato@igrejadosvales.com';
export const TELEFONE_EXIBICAO = '(11) 99999-9999';
export const ENDERECO_CONTATO = 'Rua Santa Clara, 192 - Gravataí';

export type AssuntoContato =
  | 'primeira-visita'
  | 'pedido-oracao'
  | 'igrupos'
  | 'batismo-membresia'
  | 'atendimento-pastoral'
  | 'outro';

export const ASSUNTOS_CONTATO: ReadonlyArray<{ valor: AssuntoContato; rotulo: string }> = [
  { valor: 'primeira-visita', rotulo: 'Quero visitar a igreja / Primeira visita' },
  { valor: 'pedido-oracao', rotulo: 'Pedido de oração' },
  { valor: 'igrupos', rotulo: 'Quero participar de um iGrupo' },
  { valor: 'batismo-membresia', rotulo: 'Batismo e Membresia' },
  { valor: 'atendimento-pastoral', rotulo: 'Aconselhamento / Atendimento pastoral' },
  { valor: 'outro', rotulo: 'Outros assuntos' },
];

export interface DadosContato {
  nome: string;
  email: string;
  telefone: string;
  assunto: AssuntoContato;
  mensagem: string;
}

export const DADOS_CONTATO_INICIAIS: DadosContato = {
  nome: '',
  email: '',
  telefone: '',
  assunto: 'primeira-visita',
  mensagem: '',
};

export type CampoContato = keyof DadosContato;
export type ErrosContato = Partial<Record<CampoContato, string>>;

const ASSUNTOS_VALIDOS = new Set<string>(ASSUNTOS_CONTATO.map((a) => a.valor));

export function rotuloAssunto(valor: AssuntoContato): string {
  return ASSUNTOS_CONTATO.find((a) => a.valor === valor)?.rotulo ?? valor;
}

export function validarContato(dados: DadosContato): ErrosContato {
  const erros: ErrosContato = {};

  if (dados.nome.trim().length < 2) {
    erros.nome = 'Informe seu nome completo.';
  }

  if (!dados.email.trim()) {
    erros.email = 'Informe seu e-mail.';
  } else if (!emailValido(dados.email)) {
    erros.email = 'Informe um e-mail válido.';
  }

  if (!dados.telefone.trim()) {
    erros.telefone = 'Informe seu WhatsApp com DDD.';
  } else if (!telefoneValido(dados.telefone)) {
    erros.telefone = 'Informe um WhatsApp válido, com DDD.';
  }

  if (!ASSUNTOS_VALIDOS.has(dados.assunto)) {
    erros.assunto = 'Selecione o assunto da mensagem.';
  }

  if (dados.mensagem.trim().length < 10) {
    erros.mensagem = 'Escreva sua mensagem (mínimo de 10 caracteres).';
  }

  return erros;
}

export function montarResumoContato(dados: DadosContato): string {
  return [
    '*Contato pelo site — Igreja dos Vales*',
    '',
    `*Nome:* ${dados.nome.trim()}`,
    `*E-mail:* ${dados.email.trim()}`,
    `*WhatsApp:* ${dados.telefone.trim()}`,
    `*Assunto:* ${rotuloAssunto(dados.assunto)}`,
    '',
    '*Mensagem:*',
    dados.mensagem.trim(),
  ].join('\n');
}

export { formatarTelefone, montarLinkWhatsApp };
