export interface AulaCurso {
  id: string;
  titulo: string;
  duracao: string;
  concluida: boolean;
}

export interface CursoIdeAll {
  id: string;
  titulo: string;
  resumo: string;
  categoria: string;
  nivel: 'Iniciante' | 'Intermediário' | 'Avançado';
  aulas: AulaCurso[];
  inscrito: boolean;
}

export interface GrupoDisponivel {
  id: string;
  nome: string;
  perfil: 'Casais' | 'Jovens' | 'Misto' | 'Famílias';
  bairro: string;
  diaHorario: string;
  lideres: string;
  vagas: number;
}

export interface EscalaVoluntario {
  id: string;
  data: string;
  culto: string;
  equipe: string;
  funcao: string;
  status: 'confirmado' | 'pendente' | 'indisponivel';
}

export interface MinisterioVoluntario {
  id: string;
  nome: string;
  resumo: string;
  frequencia: string;
  inscrito: boolean;
}

export interface MembroFamilia {
  id: string;
  nome: string;
  parentesco: 'Cônjuge' | 'Filho(a)' | 'Outro';
  faixaEtaria: string;
}

export interface PerfilMembro {
  nome: string;
  email: string;
  telefone: string;
  bairro: string;
  campus: string;
  dataNascimento: string;
  membroDesde: string;
  batizadoAguas: boolean;
  dataBatismo: string;
  interesses: string[];
  familia: MembroFamilia[];
}

export const CURSOS_IDEALL: CursoIdeAll[] = [
  {
    id: 'curso-fundamentos',
    titulo: 'Fundamentos da Fé',
    resumo: 'O essencial da fé cristã: quem é Jesus, o que a Bíblia ensina e como viver isso no dia a dia.',
    categoria: 'Discipulado',
    nivel: 'Iniciante',
    inscrito: true,
    aulas: [
      { id: 'fund-1', titulo: 'Quem é Jesus', duracao: '12 min', concluida: true },
      { id: 'fund-2', titulo: 'A Bíblia, nossa base', duracao: '15 min', concluida: true },
      { id: 'fund-3', titulo: 'Salvação e nova vida', duracao: '14 min', concluida: false },
      { id: 'fund-4', titulo: 'A vida com o Espírito Santo', duracao: '16 min', concluida: false },
    ],
  },
  {
    id: 'curso-oracao',
    titulo: 'Vida de Oração',
    resumo: 'Como orar com constância, ouvir a Deus e interceder pela família e pela cidade.',
    categoria: 'Vida cristã',
    nivel: 'Iniciante',
    inscrito: false,
    aulas: [
      { id: 'ora-1', titulo: 'Por que orar', duracao: '10 min', concluida: false },
      { id: 'ora-2', titulo: 'O modelo de Jesus', duracao: '13 min', concluida: false },
      { id: 'ora-3', titulo: 'Intercessão em família', duracao: '12 min', concluida: false },
    ],
  },
  {
    id: 'curso-lideranca',
    titulo: 'Liderança de iGrupos',
    resumo: 'Para quem lidera ou quer liderar um iGrupo: cuidado, facilitação e discipulado na prática.',
    categoria: 'Liderança',
    nivel: 'Intermediário',
    inscrito: false,
    aulas: [
      { id: 'lid-1', titulo: 'O chamado para cuidar', duracao: '18 min', concluida: false },
      { id: 'lid-2', titulo: 'Como facilitar um encontro', duracao: '20 min', concluida: false },
      { id: 'lid-3', titulo: 'Discipulado no dia a dia', duracao: '17 min', concluida: false },
      { id: 'lid-4', titulo: 'Multiplicando o grupo', duracao: '15 min', concluida: false },
    ],
  },
  {
    id: 'curso-familia',
    titulo: 'Família e Fé',
    resumo: 'Fé vivida em casa: casamento, criação dos filhos e o culto familiar.',
    categoria: 'Família',
    nivel: 'Intermediário',
    inscrito: false,
    aulas: [
      { id: 'fam-1', titulo: 'Casamento como aliança', duracao: '16 min', concluida: false },
      { id: 'fam-2', titulo: 'Criando filhos na fé', duracao: '14 min', concluida: false },
      { id: 'fam-3', titulo: 'O culto familiar', duracao: '11 min', concluida: false },
    ],
  },
];

export function progressoCurso(curso: CursoIdeAll): { concluidas: number; total: number; percentual: number } {
  const total = curso.aulas.length;
  const concluidas = curso.aulas.filter((a) => a.concluida).length;
  const percentual = total === 0 ? 0 : Math.round((concluidas / total) * 100);
  return { concluidas, total, percentual };
}

export const GRUPOS_DISPONIVEIS: GrupoDisponivel[] = [
  {
    id: 'ig-centro',
    nome: 'iGrupo Vale Central',
    perfil: 'Misto',
    bairro: 'Centro',
    diaHorario: 'Quartas às 20h00',
    lideres: 'Lucas e Mariana',
    vagas: 4,
  },
  {
    id: 'ig-jardins',
    nome: 'iGrupo Família Viva',
    perfil: 'Casais',
    bairro: 'Jardim América',
    diaHorario: 'Quintas às 19h45',
    lideres: 'Rafael e Camila',
    vagas: 3,
  },
  {
    id: 'ig-jovens',
    nome: 'iGrupo Conexão Jovem',
    perfil: 'Jovens',
    bairro: 'Bela Vista',
    diaHorario: 'Terças às 20h00',
    lideres: 'Gabriel e Sofia',
    vagas: 6,
  },
  {
    id: 'ig-norte',
    nome: 'iGrupo Raízes',
    perfil: 'Famílias',
    bairro: 'Vale Norte',
    diaHorario: 'Quintas às 20h00',
    lideres: 'André e Patrícia',
    vagas: 2,
  },
];

export const ESCALAS_INICIAIS: EscalaVoluntario[] = [
  {
    id: 'esc-1',
    data: 'Domingo, 22 Nov',
    culto: 'Culto da Manhã (10h)',
    equipe: 'Recepção e Boas-vindas',
    funcao: 'Acolhimento na entrada principal',
    status: 'confirmado',
  },
  {
    id: 'esc-2',
    data: 'Domingo, 29 Nov',
    culto: 'Culto da Noite (18h30)',
    equipe: 'Recepção e Boas-vindas',
    funcao: 'Apoio aos visitantes e café',
    status: 'pendente',
  },
  {
    id: 'esc-3',
    data: 'Domingo, 06 Dez',
    culto: 'Culto da Manhã (10h)',
    equipe: 'Produção e Mídia',
    funcao: 'Projeção de letras',
    status: 'pendente',
  },
];

export const MINISTERIOS_VOLUNTARIADO: MinisterioVoluntario[] = [
  {
    id: 'min-recepcao',
    nome: 'Recepção e Boas-vindas',
    resumo: 'Acolher cada pessoa desde o estacionamento até o auditório e espaço de convivência.',
    frequencia: '1 a 2 vezes por mês',
    inscrito: true,
  },
  {
    id: 'min-kids',
    nome: 'Vales Kids (Infantil)',
    resumo: 'Ensinar a Palavra de Deus de forma criativa e segura para crianças de 1 a 11 anos.',
    frequencia: '2 vezes por mês',
    inscrito: false,
  },
  {
    id: 'min-louvor',
    nome: 'Louvor e Criatividade',
    resumo: 'Música, som, iluminação, projeção e transmissão ao vivo dos cultos.',
    frequencia: 'Conforme escala e ensaios',
    inscrito: true,
  },
  {
    id: 'min-acao-social',
    nome: 'Ação Social e Cuidado',
    resumo: 'Projetos comunitários, visitas, apoio a famílias e assistência na cidade.',
    frequencia: 'Quinzenal',
    inscrito: false,
  },
];

export const PERFIL_DEMONSTRACAO: PerfilMembro = {
  nome: 'Juliana Oliveira',
  email: 'juliana.oliveira@exemplo.com.br',
  telefone: '(51) 99812-3456',
  bairro: 'Centro',
  campus: 'Gravataí',
  dataNascimento: '1993-08-14',
  membroDesde: 'Março de 2025',
  batizadoAguas: true,
  dataBatismo: '2024-11-10',
  interesses: ['Recepção e Boas-vindas', 'iGrupos', 'Discipulado'],
  familia: [
    {
      id: 'fam-1',
      nome: 'Mateus Oliveira',
      parentesco: 'Cônjuge',
      faixaEtaria: 'Adulto',
    },
    {
      id: 'fam-2',
      nome: 'Maria Oliveira',
      parentesco: 'Filho(a)',
      faixaEtaria: 'Vales Kids (6–8 anos)',
    },
  ],
};

export function resumoCursos(cursos: readonly CursoIdeAll[]): {
  inscritos: number;
  total: number;
  aulasConcluidas: number;
  aulasTotais: number;
  percentual: number;
} {
  const inscritos = cursos.filter((c) => c.inscrito);
  const aulas = inscritos.flatMap((c) => c.aulas);
  const aulasTotais = aulas.length;
  const aulasConcluidas = aulas.filter((a) => a.concluida).length;
  const percentual = aulasTotais === 0 ? 0 : Math.round((aulasConcluidas / aulasTotais) * 100);
  return { inscritos: inscritos.length, total: cursos.length, aulasConcluidas, aulasTotais, percentual };
}
