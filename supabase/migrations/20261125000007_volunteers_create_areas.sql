-- Areas a member can volunteer in. Edit rows in the Table Editor; set active = false to hide one.
-- category and icon must be values the website knows how to draw.
create table public.volunteer_areas (
  id          text primary key check (id ~ '^[a-z0-9-]+$'),
  name        text not null,
  description text not null,
  category    text not null check (category in ('louvor', 'criancas', 'jovens', 'midia', 'recepcao', 'outros')),
  icon        text not null check (icon in ('musica', 'sorriso', 'controle', 'video', 'mao', 'coracao', 'globo', 'aperto')),
  skills      text[] not null default '{}',
  commitment  text not null,
  position    integer not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger volunteer_areas_set_updated_at
  before update on public.volunteer_areas
  for each row execute function public.set_updated_at();

-- Server only: read through Astro Actions.
alter table public.volunteer_areas enable row level security;
revoke all on public.volunteer_areas from anon, authenticated;

insert into public.volunteer_areas (id, name, description, category, icon, skills, commitment, position) values
  ('kids', 'iVales Kids', 'Ministério infantil que cuida e ensina as crianças durante os cultos.', 'criancas', 'sorriso', array['Paciência', 'Amor por crianças', 'Criatividade'], 'Domingos pela manhã, em escalas rotativas.', 1),
  ('next', 'Next (Adolescentes)', 'Um espaço para adolescentes crescerem na fé, construírem amizades e descobrirem seu propósito.', 'jovens', 'controle', array['Comunicação', 'Liderança', 'Empatia'], 'Em escalas, a combinar com a liderança.', 2),
  ('outside', 'Outside (Jovens)', 'Uma comunidade de jovens para viver o evangelho, cultivar relacionamentos e impactar o mundo.', 'jovens', 'globo', array['Comunicação', 'Liderança', 'Amor pelas pessoas'], 'Em escalas, a combinar com a liderança.', 3),
  ('staff', 'Staff', 'Serviço prático de apoio à igreja e às pessoas que precisam.', 'outros', 'aperto', array['Disponibilidade', 'Coração servo', 'Organização'], 'Domingos e eventos especiais.', 4),
  ('centurioes', 'Centuriões', 'Equipe responsável pela segurança das celebrações e das pessoas.', 'outros', 'mao', array['Atenção', 'Responsabilidade', 'Discrição'], 'Cultos, em escalas rotativas.', 5),
  ('icoffee', 'iCoffee', 'A cafeteria da igreja, um ponto de encontro e acolhimento.', 'recepcao', 'coracao', array['Simpatia', 'Agilidade', 'Organização'], 'Cultos, em escalas rotativas.', 6),
  ('gestao', 'Gestão', 'Cuida da gestão da celebração, para que tudo aconteça como planejado.', 'outros', 'controle', array['Organização', 'Liderança', 'Atenção aos detalhes'], 'Cultos, em escalas rotativas.', 7),
  ('louvor', 'Louvor e Adoração', 'Ministério de música que conduz a congregação em adoração.', 'louvor', 'musica', array['Musicalidade', 'Dedicação', 'Compromisso com ensaios'], 'Ensaios semanais e cultos de domingo.', 8),
  ('midia', 'Mídia e Comunicação', 'Transmissão online, áudio, vídeo e redes sociais.', 'midia', 'video', array['Conhecimento técnico', 'Atenção aos detalhes', 'Criatividade'], 'Domingos e produção de conteúdo.', 9),
  ('recepcao', 'Recepção', 'Acolhimento de visitantes e membros nos cultos.', 'recepcao', 'mao', array['Simpatia', 'Comunicação', 'Organização'], 'Domingos, em escalas rotativas.', 10),
  ('intercessao', 'Intercessão', 'Ministério de oração pela igreja e pelas necessidades de cada pessoa.', 'outros', 'coracao', array['Vida de oração', 'Compromisso', 'Discrição'], 'Encontros semanais de oração.', 11);
