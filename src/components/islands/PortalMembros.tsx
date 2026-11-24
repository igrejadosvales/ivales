import { type KeyboardEvent, type SyntheticEvent, useState } from 'react';
import Providers from './Providers';
import { getSupabaseClient } from '../../lib/supabase';
import { formatarTelefone, somenteDigitos } from '../../lib/voluntariado';
import {
  CURSOS_IDEALL,
  ESCALAS_INICIAIS,
  GRUPOS_DISPONIVEIS,
  MINISTERIOS_VOLUNTARIADO,
  PERFIL_DEMONSTRACAO,
  type CursoIdeAll,
  type EscalaVoluntario,
  type MinisterioVoluntario,
  type PerfilMembro,
  progressoCurso,
} from '../../lib/membros-data';

type AbaPortal = 'inicio' | 'ideall' | 'igrupo' | 'escalas' | 'dados';
type ModoAcesso = 'login' | 'cadastro';

const ABAS: { id: AbaPortal; rotulo: string; indisponivel?: boolean }[] = [
  { id: 'inicio', rotulo: 'Visão Geral' },
  { id: 'ideall', rotulo: 'Jornada IdeAll', indisponivel: true },
  { id: 'igrupo', rotulo: 'Meu iGrupo', indisponivel: true },
  { id: 'escalas', rotulo: 'Minhas Escalas', indisponivel: true },
  { id: 'dados', rotulo: 'Meus dados' },
];

interface Props {
  /** /membros/demo route: opens the dashboard with fake data, no sign-in. */
  demo?: boolean;
}

export default function PortalMembros({ demo = false }: Props) {
  const [autenticado, setAutenticado] = useState(demo);
  const [modoAcesso, setModoAcesso] = useState<ModoAcesso>('login');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [lembrarDeMim, setLembrarDeMim] = useState(true);
  const [msgEsqueciSenha, setMsgEsqueciSenha] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<AbaPortal>('inicio');

  // Estado do formulário de login / cadastro inicial
  const [emailAcesso, setEmailAcesso] = useState('');
  const [senhaAcesso, setSenhaAcesso] = useState('');
  const [nomeCadastro, setNomeCadastro] = useState('');
  const [telefoneCadastro, setTelefoneCadastro] = useState('');
  const [erroAcesso, setErroAcesso] = useState('');
  const [infoAcesso, setInfoAcesso] = useState('');
  const [enviandoAcesso, setEnviandoAcesso] = useState(false);
  // Per-field errors: shown under each field; focus moves to the first invalid one.
  const [fieldErrors, setFieldErrors] = useState<{ nome?: string; email?: string; senha?: string }>({});

  // Estado do membro logado
  const [perfil, setPerfil] = useState<PerfilMembro>(PERFIL_DEMONSTRACAO);
  const [cursos, setCursos] = useState<CursoIdeAll[]>(CURSOS_IDEALL);
  const [grupoAtualId, setGrupoAtualId] = useState<string>('ig-centro');
  const [filtroPerfilGrupo, setFiltroPerfilGrupo] = useState<string>('Todos');
  const [presencaConfirmadaGrupo, setPresencaConfirmadaGrupo] = useState(false);

  // Escalas e equipes
  const [escalas, setEscalas] = useState<EscalaVoluntario[]>(ESCALAS_INICIAIS);
  const [ministerios, setMinisterios] = useState<MinisterioVoluntario[]>(MINISTERIOS_VOLUNTARIADO);

  // Meus dados: dados cadastrais
  const [perfilSalvoMsg, setPerfilSalvoMsg] = useState(false);

  const grupoAtual = GRUPOS_DISPONIVEIS.find((g) => g.id === grupoAtualId) ?? GRUPOS_DISPONIVEIS[0]!;
  const proximaEscala = escalas[0];
  // The demo unlocks everything; outside it, sections still being built show as "em breve".
  const isLocked = (aba: { indisponivel?: boolean }) => Boolean(aba.indisponivel) && !demo;
  const enrolledCourses = cursos.filter((c) => c.inscrito);
  const overallProgress = (() => {
    const t = enrolledCourses.reduce((acc, c) => {
      const p = progressoCurso(c);
      return { feitas: acc.feitas + p.concluidas, total: acc.total + p.total };
    }, { feitas: 0, total: 0 });
    return t.total === 0 ? 0 : Math.round((t.feitas / t.total) * 100);
  })();

  // WAI-ARIA tabs pattern: arrows move between tabs (skipping locked ones), Home/End jump to the ends.
  function handleTabKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const unlockedTabs = ABAS.filter((aba) => !isLocked(aba));
    const atual = unlockedTabs.findIndex((aba) => aba.id === abaAtiva);
    const target =
      e.key === 'ArrowRight' ? unlockedTabs[(atual + 1) % unlockedTabs.length]
      : e.key === 'ArrowLeft' ? unlockedTabs[(atual - 1 + unlockedTabs.length) % unlockedTabs.length]
      : e.key === 'Home' ? unlockedTabs[0]
      : e.key === 'End' ? unlockedTabs[unlockedTabs.length - 1]
      : undefined;
    if (!target) return;
    e.preventDefault();
    setAbaAtiva(target.id);
    document.getElementById(`tab-${target.id}`)?.focus();
  }

  async function submeterAcesso(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setErroAcesso('');
    setInfoAcesso('');

    const email = emailAcesso.trim();
    const nome = nomeCadastro.trim();

    // Validate everything on submit (the button is never disabled for empty fields).
    const erros: { nome?: string; email?: string; senha?: string } = {};
    if (modoAcesso === 'cadastro' && !nome) erros.nome = 'Informe seu nome completo.';
    if (!email) erros.email = 'Informe seu e-mail.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) erros.email = 'Confira o e-mail: falta o @ ou o domínio.';
    if (!senhaAcesso) erros.senha = modoAcesso === 'login' ? 'Informe sua senha.' : 'Crie uma senha.';
    else if (modoAcesso === 'cadastro' && senhaAcesso.length < 8) erros.senha = 'Use pelo menos 8 caracteres.';
    setFieldErrors(erros);
    const firstInvalid = (['nome', 'email', 'senha'] as const).find((c) => erros[c]);
    if (firstInvalid) {
      const ids = { nome: 'membro-nome-cadastro', email: 'membro-email-acesso', senha: 'membro-senha-acesso' };
      document.getElementById(ids[firstInvalid])?.focus();
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setErroAcesso('O acesso está temporariamente indisponível. Tente novamente em instantes.');
      return;
    }

    setEnviandoAcesso(true);
    try {
      if (modoAcesso === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: senhaAcesso });
        if (error || !data.user) {
          setErroAcesso('E-mail ou senha incorretos.');
          return;
        }
        await entrarComoMembro(supabase, data.user.id, email);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password: senhaAcesso,
        options: {
          data: { full_name: nome, phone: telefoneCadastro.trim() },
          emailRedirectTo: `${window.location.origin}/membros`,
        },
      });
      if (error) {
        setErroAcesso(
          /already|registered/i.test(error.message)
            ? 'Este e-mail já está cadastrado. Entre com sua senha.'
            : 'Não foi possível concluir o cadastro. Tente novamente.',
        );
        return;
      }
      if (data.session && data.user) {
        await entrarComoMembro(supabase, data.user.id, email);
      } else {
        setModoAcesso('login');
        setSenhaAcesso('');
        setInfoAcesso('Cadastro realizado! Enviamos um link de confirmação para o seu e-mail. Confirme e depois entre.');
      }
    } catch {
      setErroAcesso('Falha de conexão. Tente novamente.');
    } finally {
      setEnviandoAcesso(false);
    }
  }

  async function entrarComoMembro(supabase: NonNullable<ReturnType<typeof getSupabaseClient>>, id: string, email: string) {
    const { data } = await supabase.from('member_profiles').select('*').eq('id', id).maybeSingle();
    setPerfil((atual) => ({
      ...atual,
      nome: data?.full_name ?? atual.nome,
      email: data?.email ?? email,
      telefone: data?.phone ?? '',
      bairro: data?.neighborhood ?? '',
      campus: data?.campus ?? '',
      dataNascimento: data?.birth_date ?? '',
      membroDesde: data?.member_since
        ? new Date(`${data.member_since}T00:00:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
        : atual.membroDesde,
      batizadoAguas: data?.water_baptized ?? false,
      dataBatismo: data?.baptism_date ?? '',
      interesses: data?.interests ?? [],
    }));
    setAutenticado(true);
    setAbaAtiva('inicio');
  }

  function alternarInscricaoCurso(id: string) {
    setCursos((atuais) => atuais.map((c) => (c.id === id ? { ...c, inscrito: !c.inscrito } : c)));
  }

  function alternarAula(cursoId: string, aulaId: string) {
    setCursos((atuais) =>
      atuais.map((c) =>
        c.id === cursoId
          ? { ...c, aulas: c.aulas.map((a) => (a.id === aulaId ? { ...a, concluida: !a.concluida } : a)) }
          : c,
      ),
    );
  }

  function atualizarStatusEscala(id: string, novoStatus: EscalaVoluntario['status']) {
    setEscalas((atuais) => atuais.map((esc) => (esc.id === id ? { ...esc, status: novoStatus } : esc)));
  }

  function alternarInscricaoMinisterio(id: string) {
    setMinisterios((atuais) => atuais.map((m) => (m.id === id ? { ...m, inscrito: !m.inscrito } : m)));
  }

  function salvarPerfil(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setPerfilSalvoMsg(true);
    setTimeout(() => setPerfilSalvoMsg(false), 4000);
  }

  const gruposFiltrados =
    filtroPerfilGrupo === 'Todos'
      ? GRUPOS_DISPONIVEIS
      : GRUPOS_DISPONIVEIS.filter((g) => g.perfil === filtroPerfilGrupo);

  return (
    <Providers>
      {!autenticado ? (
        <div className="mx-auto my-auto w-full max-w-[400px]">
          <div className="rounded-2xl border border-border/70 bg-canvas p-6 shadow-[0_1px_2px_rgb(46_44_36/0.05),0_12px_32px_-12px_rgb(46_44_36/0.18)] sm:p-8">
            {/* The dove is the only brand mark on the screen: no colored panel, no generic icon. */}
            <span aria-hidden="true" className="logo-pomba-icone mx-auto block h-10 w-[3.4783rem]" />

            <h2 className="mt-5 text-center text-2xl font-bold tracking-tight text-ink">
              {modoAcesso === 'login' ? 'Entrar' : 'Criar conta'}
            </h2>
            <p className="mt-1 text-center text-sm text-ink-muted">
              {modoAcesso === 'login' ? 'Bem-vindo de volta. Use seu e-mail e senha.' : 'Leva menos de um minuto.'}
            </p>

            {erroAcesso && (
              <p role="alert" className="mt-6 rounded-lg bg-surface px-4 py-3 text-sm font-medium text-ink">
                {erroAcesso}
              </p>
            )}

            {infoAcesso && (
              <p role="status" className="mt-6 rounded-lg bg-surface px-4 py-3 text-sm text-ink">
                {infoAcesso}
              </p>
            )}

            {msgEsqueciSenha && (
              <div role="status" className="mt-6 rounded-lg bg-surface px-4 py-3 text-sm text-ink">
                <p className="font-medium">Para redefinir a senha, fale com a secretaria.</p>
                <p className="mt-1 text-ink-muted">
                  Pelo WhatsApp ou pelo e-mail da igreja, na página de{' '}
                  <a href="/contato" className="font-semibold text-accent-text underline underline-offset-2">
                    contato
                  </a>
                  .
                </p>
              </div>
            )}

            <form onSubmit={submeterAcesso} className="mt-6 space-y-5" noValidate>
              {modoAcesso === 'cadastro' && (
                <AuthField
                  id="membro-nome-cadastro"
                  label="Nome completo"
                  error={fieldErrors.nome}
                  input={{
                    type: 'text',
                    value: nomeCadastro,
                    onChange: (e) => setNomeCadastro(e.target.value),
                    autoComplete: 'name',
                  }}
                />
              )}

              <AuthField
                id="membro-email-acesso"
                label="E-mail"
                error={fieldErrors.email}
                input={{
                  type: 'email',
                  value: emailAcesso,
                  onChange: (e) => setEmailAcesso(e.target.value),
                  autoComplete: 'email',
                  inputMode: 'email',
                  placeholder: 'voce@exemplo.com',
                }}
              />

              {modoAcesso === 'cadastro' && (
                <AuthField
                  id="membro-telefone-cadastro"
                  label="WhatsApp"
                  input={{
                    type: 'tel',
                    value: telefoneCadastro,
                    onChange: (e) => setTelefoneCadastro(formatarTelefone(e.target.value)),
                    required: true,
                    autoComplete: 'tel',
                    inputMode: 'tel',
                    placeholder: '(51) 99999-0000',
                  }}
                />
              )}

              <AuthField
                id="membro-senha-acesso"
                label="Senha"
                error={fieldErrors.senha}
                hint={modoAcesso === 'cadastro' ? 'mínimo de 8 caracteres' : undefined}
                labelAction={
                  modoAcesso === 'login' ? (
                    <button
                      type="button"
                      onClick={() => setMsgEsqueciSenha((v) => !v)}
                      aria-expanded={msgEsqueciSenha}
                      className="text-sm font-medium text-accent-text underline-offset-2 hover:underline"
                    >
                      Esqueceu a senha?
                    </button>
                  ) : undefined
                }
                input={{
                  type: mostrarSenha ? 'text' : 'password',
                  value: senhaAcesso,
                  onChange: (e) => setSenhaAcesso(e.target.value),
                  autoComplete: modoAcesso === 'login' ? 'current-password' : 'new-password',
                }}
                suffix={
                  <button
                    type="button"
                    onClick={() => setMostrarSenha((v) => !v)}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-ink-muted hover:text-ink"
                    aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                    aria-pressed={mostrarSenha}
                  >
                    <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      {mostrarSenha ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.1A9.8 9.8 0 0112 5c4.5 0 8.3 2.9 9.5 7a10 10 0 01-2.2 3.6M6.1 6.1A10 10 0 002.5 12c1.3 4.1 5 7 9.5 7a9.7 9.7 0 005.9-2" />
                      ) : (
                        <>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12C3.7 7.9 7.5 5 12 5s8.3 2.9 9.5 7c-1.2 4.1-5 7-9.5 7s-8.3-2.9-9.5-7z" />
                          <circle cx="12" cy="12" r="3" />
                        </>
                      )}
                    </svg>
                  </button>
                }
              />

              {modoAcesso === 'login' && (
                <label htmlFor="membro-lembrar-de-mim" className="flex w-fit cursor-pointer items-center gap-2.5 text-sm text-ink">
                  <input
                    id="membro-lembrar-de-mim"
                    type="checkbox"
                    checked={lembrarDeMim}
                    onChange={(e) => setLembrarDeMim(e.target.checked)}
                    className="size-4 rounded accent-[var(--color-accent)]"
                  />
                  Manter conectado neste aparelho
                </label>
              )}

              <button
                type="submit"
                aria-busy={enviandoAcesso || undefined}
                className="button button--lg button--primary btn-primario h-auto min-h-12 w-full rounded-full border-2 border-accent text-base font-semibold"
              >
                {enviandoAcesso
                  ? modoAcesso === 'login'
                    ? 'Entrando…'
                    : 'Criando conta…'
                  : modoAcesso === 'login'
                    ? 'Entrar'
                    : 'Criar conta'}
              </button>

              {modoAcesso === 'cadastro' && (
                <p className="text-center text-xs text-ink-muted">Vamos enviar um link de confirmação para o seu e-mail.</p>
              )}
            </form>

            {/* Sibling flow + help: one line each, after the submit button. */}
            <div className="mt-6 space-y-2 border-t border-border/70 pt-5 text-center text-sm text-ink-muted">
              <p>
                {modoAcesso === 'login' ? 'Ainda não tem conta?' : 'Já tem conta?'}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setModoAcesso(modoAcesso === 'login' ? 'cadastro' : 'login');
                    setErroAcesso('');
                    setInfoAcesso('');
                    setFieldErrors({});
                    setMsgEsqueciSenha(false);
                  }}
                  className="font-semibold text-accent-text underline-offset-2 hover:underline"
                >
                  {modoAcesso === 'login' ? 'Criar conta' : 'Entrar'}
                </button>
              </p>
              <p className="text-xs">
                Problemas para entrar?{' '}
                <a href="/contato" className="underline underline-offset-2 hover:text-ink">
                  Fale com a secretaria
                </a>
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {demo && (
            <p role="note" className="flex items-center gap-2 text-sm text-ink-muted">
              <span aria-hidden="true" className="size-2 rounded-full bg-border-strong" />
              <span>
                <strong className="font-semibold text-ink">Modo demonstração.</strong> Nomes e dados fictícios; nada é salvo.
              </span>
            </p>
          )}

          {/* Member header: a plain row, no card around it */}
          <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div
                aria-hidden="true"
                className="flex size-14 shrink-0 items-center justify-center rounded-full bg-ink text-lg font-semibold text-canvas"
              >
                {perfil.nome
                  .split(' ')
                  .slice(0, 2)
                  .map((p) => p[0])
                  .join('')
                  .toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Olá, {perfil.nome.split(' ')[0]}</h2>
                <p className="mt-0.5 text-sm text-ink-muted">
                  Membro desde {perfil.membroDesde}
                  {perfil.campus && <> · {perfil.campus}</>}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {demo && (
                <button
                  type="button"
                  onClick={() => setAbaAtiva('ideall')}
                  className="button button--lg button--primary btn-primario h-auto min-h-11 rounded-full border-2 border-accent px-5 py-2.5 text-sm font-semibold"
                >
                  Continuar Jornada IdeAll
                </button>
              )}
              {demo ? (
                <a
                  href="/membros"
                  className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold text-ink underline-offset-4 hover:bg-canvas hover:underline"
                >
                  Sair da demonstração
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => setAutenticado(false)}
                  className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold text-ink underline-offset-4 hover:bg-canvas hover:underline"
                >
                  Sair da conta
                </button>
              )}
            </div>
          </header>

          {/* Tabs: hairline with a blue indicator under the active one; arrows, Home and End navigate */}
          <div
            role="tablist"
            aria-label="Seções da Área de Membros"
            onKeyDown={handleTabKeyDown}
            className="-mx-1 flex gap-1 overflow-x-auto overflow-y-hidden border-b border-border px-1"
          >
            {ABAS.map((aba) => {
              const selecionada = abaAtiva === aba.id;
              const locked = isLocked(aba);
              return (
                <button
                  key={aba.id}
                  id={`tab-${aba.id}`}
                  role="tab"
                  type="button"
                  aria-selected={selecionada}
                  aria-controls={`painel-${aba.id}`}
                  tabIndex={selecionada ? 0 : -1}
                  disabled={locked}
                  aria-disabled={locked || undefined}
                  onClick={locked ? undefined : () => setAbaAtiva(aba.id)}
                  className={`relative min-h-11 shrink-0 px-4 text-sm whitespace-nowrap transition-colors duration-150 ${
                    locked
                      ? 'cursor-not-allowed text-ink-muted/60'
                      : selecionada
                        ? 'font-semibold text-ink'
                        : 'font-medium text-ink-muted hover:text-ink'
                  }`}
                >
                  {selecionada && <span aria-hidden="true" className="absolute inset-x-3 bottom-0 h-[3px] rounded-full bg-accent" />}
                  {aba.rotulo}
                  {locked && <span className="ml-1 font-normal">· em breve</span>}
                </button>
              );
            })}
          </div>

          {/* ABA 1: VISÃO GERAL */}
          {abaAtiva === 'inicio' && (
            <div id="painel-inicio" role="tabpanel" aria-labelledby="tab-inicio" tabIndex={0} className="outline-none">
              {demo ? (
                // One focal point (course progress) + a list of what's next. No grid of identical cards.
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                  <section aria-labelledby="resumo-jornada" className="rounded-2xl bg-canvas p-6 sm:p-8">
                    <p id="resumo-jornada" className="text-sm font-medium text-ink-muted">
                      Jornada IdeAll
                    </p>
                    <p className="mt-2 flex items-baseline gap-3">
                      <span className="text-5xl font-bold tracking-tight text-ink tabular-nums">{overallProgress}%</span>
                      <span className="text-sm text-ink-muted">
                        {enrolledCourses.length === 0
                          ? 'nenhum curso iniciado'
                          : `${enrolledCourses.length} ${enrolledCourses.length === 1 ? 'curso em andamento' : 'cursos em andamento'}`}
                      </span>
                    </p>
                    <div
                      className="mt-5 h-1.5 overflow-hidden rounded-full bg-surface"
                      role="progressbar"
                      aria-label="Progresso na Jornada IdeAll"
                      aria-valuenow={overallProgress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div className="h-full rounded-full bg-accent" style={{ width: `${overallProgress}%` }} />
                    </div>
                    <ul className="mt-6 divide-y divide-border/70">
                      {enrolledCourses.slice(0, 3).map((c) => {
                        const p = progressoCurso(c);
                        return (
                          <li key={c.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                            <span className="font-medium text-ink">{c.titulo}</span>
                            <span className="text-ink-muted tabular-nums">
                              {p.concluidas} de {p.total} aulas
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                    <button
                      type="button"
                      onClick={() => setAbaAtiva('ideall')}
                      className="mt-4 text-sm font-semibold text-accent-text underline-offset-4 hover:underline"
                    >
                      Ver todos os cursos
                    </button>
                  </section>

                  <section aria-label="Próximos compromissos" className="divide-y divide-border">
                    <div className="pb-6">
                      <p className="text-sm font-medium text-ink-muted">Meu iGrupo</p>
                      <p className="mt-1 text-lg font-semibold text-ink">{grupoAtual.nome}</p>
                      <p className="mt-0.5 text-sm text-ink-muted">
                        {grupoAtual.diaHorario} · {grupoAtual.bairro}
                      </p>
                      <button
                        type="button"
                        onClick={() => setAbaAtiva('igrupo')}
                        className="mt-2 text-sm font-semibold text-ink underline underline-offset-4 hover:text-accent-text"
                      >
                        Ver meu iGrupo
                      </button>
                    </div>
                    {proximaEscala && (
                      <div className="pt-6">
                        <p className="text-sm font-medium text-ink-muted">Próxima escala</p>
                        <p className="mt-1 text-lg font-semibold text-ink">{proximaEscala.data}</p>
                        <p className="mt-0.5 text-sm text-ink-muted">
                          {proximaEscala.culto} · {proximaEscala.funcao}
                        </p>
                        <button
                          type="button"
                          onClick={() => setAbaAtiva('escalas')}
                          className="mt-2 text-sm font-semibold text-ink underline underline-offset-4 hover:text-accent-text"
                        >
                          Ver minhas escalas
                        </button>
                      </div>
                    )}
                  </section>
                </div>
              ) : (
                // Honest empty state: what's coming and what can be done right now.
                <section aria-labelledby="em-preparo" className="grid gap-8 rounded-2xl bg-canvas p-6 sm:p-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                  <div>
                    <h3 id="em-preparo" className="text-xl font-bold tracking-tight text-ink">
                      Sua área está sendo preparada
                    </h3>
                    <p className="mt-2 max-w-prose text-ink-muted">
                      Cursos da Jornada IdeAll, seu iGrupo e suas escalas vão aparecer aqui assim que estiverem prontos.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => setAbaAtiva('dados')}
                        className="button button--lg button--primary btn-primario h-auto min-h-11 rounded-full border-2 border-accent px-5 py-2.5 text-sm font-semibold"
                      >
                        Conferir meus dados
                      </button>
                      <a
                        href="/igrupos"
                        className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold text-ink underline underline-offset-4 hover:text-accent-text"
                      >
                        Encontrar um iGrupo
                      </a>
                    </div>
                  </div>
                  <ul className="divide-y divide-border/70 text-sm">
                    {[
                      ['Jornada IdeAll', 'Cursos curtos para crescer na fé, no seu ritmo.'],
                      ['Meu iGrupo', 'Encontros, líderes e presença do seu grupo.'],
                      ['Minhas escalas', 'Datas e funções nas equipes de voluntários.'],
                    ].map(([titulo, texto]) => (
                      <li key={titulo} className="py-3 first:pt-0 last:pb-0">
                        <p className="font-semibold text-ink">{titulo}</p>
                        <p className="text-ink-muted">{texto}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}

          {/* ABA 2: JORNADA IDEALL (REDE DE CURSOS) */}
          {abaAtiva === 'ideall' && (
            <div id="painel-ideall" role="tabpanel" aria-labelledby="tab-ideall" className="space-y-6">
              <div className="rounded-cartao bg-canvas p-6 sm:p-8">
                <p className="text-sm font-medium text-ink-muted">Rede de cursos</p>
                <h3 className="mt-1 text-2xl font-bold text-ink">Jornada IdeAll</h3>
                <p className="mt-2 max-w-prose text-ink-muted">
                  Cursos curtos para crescer na fé, no seu ritmo. Inscreva-se e marque cada aula conforme concluir.
                </p>

                <div className="mt-8 space-y-6">
                  {cursos.map((curso) => {
                    const progresso = progressoCurso(curso);
                    return (
                      <article
                        key={curso.id}
                        className={`rounded-cartao p-6 transition-colors ${
                          curso.inscrito ? 'bg-surface' : 'bg-canvas'
                        }`}
                      >
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <h4 className="text-xl font-bold text-ink">{curso.titulo}</h4>
                              <span className="chip chip--lg chip--secondary chip--default bg-canvas font-semibold text-ink">
                                <span className="chip__label">{curso.categoria}</span>
                              </span>
                              <span className="chip chip--lg chip--secondary chip--default bg-canvas font-semibold text-ink">
                                <span className="chip__label">{curso.nivel}</span>
                              </span>
                              {curso.inscrito && progresso.percentual === 100 && (
                                <span className="chip chip--lg chip--primary chip--accent bg-accent font-semibold text-on-accent">
                                  <span className="chip__label">Concluído</span>
                                </span>
                              )}
                            </div>
                            <p className="mt-3 text-ink-muted">{curso.resumo}</p>
                          </div>

                          <div className="shrink-0">
                            <button
                              type="button"
                              onClick={() => alternarInscricaoCurso(curso.id)}
                              className={`button button--lg h-auto min-h-11 rounded-full px-5 py-2.5 text-sm font-semibold ${
                                curso.inscrito
                                  ? 'button--outline btn-secundario border-2 border-ink text-ink'
                                  : 'button--primary btn-primario border-2 border-accent'
                              }`}
                            >
                              {curso.inscrito ? 'Sair do curso' : 'Inscrever-me'}
                            </button>
                          </div>
                        </div>

                        {curso.inscrito && (
                          <div className="mt-6 border-t border-border pt-6">
                            <div className="flex items-center justify-between gap-4">
                              <p className="text-sm font-semibold text-ink">
                                {progresso.concluidas} de {progresso.total} aulas concluídas
                              </p>
                              <span className="text-sm font-bold text-accent-text">{progresso.percentual}%</span>
                            </div>
                            <div
                              className="mt-2 h-2 w-full overflow-hidden rounded-full bg-canvas"
                              role="progressbar"
                              aria-label={`Progresso no curso ${curso.titulo}`}
                              aria-valuenow={progresso.percentual}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            >
                              <div
                                className="h-full rounded-full bg-accent transition-all duration-300"
                                style={{ width: `${progresso.percentual}%` }}
                              />
                            </div>

                            <ul className="mt-4 space-y-2">
                              {curso.aulas.map((aula, indice) => (
                                <li key={aula.id}>
                                  <button
                                    type="button"
                                    onClick={() => alternarAula(curso.id, aula.id)}
                                    aria-pressed={aula.concluida}
                                    className="flex w-full items-center gap-3 rounded-xl bg-canvas px-4 py-3 text-left hover:bg-surface"
                                  >
                                    <span
                                      aria-hidden="true"
                                      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                        aula.concluida ? 'bg-accent text-on-accent' : 'border border-border-strong text-ink-muted'
                                      }`}
                                    >
                                      {aula.concluida ? '✓' : indice + 1}
                                    </span>
                                    <span className={`flex-1 text-sm font-semibold ${aula.concluida ? 'text-ink-muted line-through' : 'text-ink'}`}>
                                      {aula.titulo}
                                    </span>
                                    <span className="text-xs text-ink-muted">{aula.duracao}</span>
                                    <span className="sr-only">
                                      {aula.concluida ? 'Concluída. Clique para desmarcar.' : 'Clique para marcar como concluída.'}
                                    </span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ABA 3: MEU IGRUPO */}
          {abaAtiva === 'igrupo' && (
            <div id="painel-igrupo" role="tabpanel" aria-labelledby="tab-igrupo" className="space-y-8">
              {/* Grupo Atual */}
              <div className="rounded-cartao bg-canvas p-6 sm:p-8">
                <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                  <div>
                    <span className="chip chip--lg chip--primary chip--accent bg-accent font-semibold text-on-accent">
                      <span className="chip__label">Seu grupo ativo</span>
                    </span>
                    <h3 className="mt-3 text-2xl font-bold text-ink">{grupoAtual.nome}</h3>
                    <p className="mt-2 text-ink-muted">
                      Reuniões: <strong>{grupoAtual.diaHorario}</strong> • Bairro <strong>{grupoAtual.bairro}</strong>
                    </p>
                    <p className="mt-1 text-ink-muted">
                      Líderes do grupo: <strong>{grupoAtual.lideres}</strong> • Perfil: <strong>{grupoAtual.perfil}</strong>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setPresencaConfirmadaGrupo((v) => !v)}
                      className={`button button--lg h-auto min-h-11 rounded-full px-6 py-3 text-sm font-semibold ${
                        presencaConfirmadaGrupo
                          ? 'button--outline btn-secundario border-2 border-ink text-ink'
                          : 'button--primary btn-primario border-2 border-accent'
                      }`}
                    >
                      {presencaConfirmadaGrupo
                        ? 'Presença confirmada nesta semana ✓'
                        : 'Confirmar presença no próximo encontro'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Explorar outros iGrupos */}
              <div className="rounded-cartao bg-canvas p-6 sm:p-8">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-xl font-bold text-ink">Conhecer outros iGrupos</h3>
                    <p className="mt-1 text-sm text-ink-muted">
                      Precisa mudar de dia ou bairro? Veja os grupos com vagas abertas e solicite a transferência.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar iGrupos por perfil">
                    {['Todos', 'Misto', 'Casais', 'Jovens', 'Famílias'].map((filtro) => (
                      <button
                        key={filtro}
                        type="button"
                        onClick={() => setFiltroPerfilGrupo(filtro)}
                        aria-pressed={filtroPerfilGrupo === filtro}
                        className={`min-h-10 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                          filtroPerfilGrupo === filtro
                            ? 'bg-accent text-on-accent'
                            : 'border border-border bg-surface text-ink hover:border-border-strong'
                        }`}
                      >
                        {filtro}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {gruposFiltrados.map((grupo) => {
                    const ehAtual = grupo.id === grupoAtual.id;
                    return (
                      <article
                        key={grupo.id}
                        className={`flex flex-col justify-between rounded-xl p-5 ${
                          ehAtual ? 'bg-surface' : 'bg-canvas'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-ink-muted">
                              {grupo.perfil} • {grupo.bairro}
                            </span>
                            <span className="text-xs font-semibold text-ink-muted">{grupo.vagas} vagas</span>
                          </div>
                          <h4 className="mt-2 text-lg font-bold text-ink">{grupo.nome}</h4>
                          <p className="mt-1 text-sm text-ink-muted">{grupo.diaHorario}</p>
                          <p className="mt-0.5 text-sm text-ink-muted">Líderes: {grupo.lideres}</p>
                        </div>

                        <div className="mt-4 border-t border-border pt-3">
                          {ehAtual ? (
                            <span className="text-xs font-bold text-accent-text">Você faz parte deste iGrupo ✓</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setGrupoAtualId(grupo.id);
                                setPresencaConfirmadaGrupo(false);
                              }}
                              className="text-sm font-bold text-accent-text underline-offset-4 hover:underline"
                            >
                              Participar deste iGrupo →
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ABA 4: MINHAS ESCALAS */}
          {abaAtiva === 'escalas' && (
            <div id="painel-escalas" role="tabpanel" aria-labelledby="tab-escalas" className="space-y-8">
              {/* Escalas do Membro */}
              <div className="rounded-cartao bg-canvas p-6 sm:p-8">
                <p className="text-sm font-medium text-ink-muted">Servir na Casa</p>
                <h3 className="mt-1 text-2xl font-bold text-ink">Minhas Próximas Escalas</h3>
                <p className="mt-2 text-ink-muted">
                  Confirme sua disponibilidade com antecedência para ajudar o líder do seu ministério na organização do culto.
                </p>

                <div className="mt-6 space-y-4">
                  {escalas.map((escala) => (
                    <article
                      key={escala.id}
                      className="flex flex-col justify-between gap-4 rounded-xl bg-surface p-5 sm:flex-row sm:items-center"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-ink">{escala.data}</span>
                          <span className="text-sm text-ink-muted">• {escala.culto}</span>
                          <span
                            className={`chip chip--lg font-semibold ${
                              escala.status === 'confirmado'
                                ? 'chip--primary chip--accent bg-accent text-on-accent'
                                : 'chip--secondary chip--default bg-canvas text-ink'
                            }`}
                          >
                            <span className="chip__label">
                              {escala.status === 'confirmado'
                                ? 'Confirmado'
                                : escala.status === 'pendente'
                                  ? 'Aguardando confirmação'
                                  : 'Indisponível'}
                            </span>
                          </span>
                        </div>
                        <p className="mt-2 text-base font-semibold text-ink">{escala.equipe}</p>
                        <p className="text-sm text-ink-muted">Função: {escala.funcao}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => atualizarStatusEscala(escala.id, 'confirmado')}
                          aria-pressed={escala.status === 'confirmado'}
                          className={`min-h-10 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                            escala.status === 'confirmado'
                              ? 'bg-accent text-on-accent'
                              : 'border border-ink bg-canvas text-ink hover:bg-surface'
                          }`}
                        >
                          Confirmar presença
                        </button>
                        <button
                          type="button"
                          onClick={() => atualizarStatusEscala(escala.id, 'indisponivel')}
                          aria-pressed={escala.status === 'indisponivel'}
                          className={`min-h-10 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                            escala.status === 'indisponivel'
                              ? 'border-2 border-ink bg-canvas font-bold text-ink'
                              : 'border border-border bg-canvas text-ink-muted hover:text-ink'
                          }`}
                        >
                          Solicitar substituição
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              {/* Equipes e Ministérios */}
              <div className="rounded-cartao bg-canvas p-6 sm:p-8">
                <h3 className="text-xl font-bold text-ink">Equipes de Voluntariado</h3>
                <p className="mt-1 text-sm text-ink-muted">
                  Escolha onde você deseja servir ou manifeste interesse para participar do próximo treinamento.
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {ministerios.map((min) => (
                    <article
                      key={min.id}
                      className={`flex flex-col justify-between rounded-xl p-5 ${
                        min.inscrito ? 'bg-surface' : 'bg-canvas'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-lg font-bold text-ink">{min.nome}</h4>
                          {min.inscrito && (
                            <span className="chip chip--lg chip--primary chip--accent bg-accent font-semibold text-on-accent">
                              <span className="chip__label">Ativo</span>
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-ink-muted">{min.resumo}</p>
                        <p className="mt-2 text-xs font-semibold text-ink-muted">Escala média: {min.frequencia}</p>
                      </div>

                      <div className="mt-4 border-t border-border pt-3">
                        <button
                          type="button"
                          onClick={() => alternarInscricaoMinisterio(min.id)}
                          className="text-sm font-bold text-accent-text underline-offset-4 hover:underline"
                        >
                          {min.inscrito ? 'Deixar equipe' : 'Quero servir nesta equipe →'}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ABA 5: MEUS DADOS */}
          {abaAtiva === 'dados' && (
            <div id="painel-dados" role="tabpanel" aria-labelledby="tab-dados" className="space-y-8">
              <div className="grid gap-8 lg:grid-cols-12">
                {/* Dados Cadastrais */}
                <div className="rounded-cartao bg-canvas p-6 sm:p-8 lg:col-span-8">
                  <h3 className="text-2xl font-bold text-ink">Meus Dados de Membro</h3>
                  <p className="mt-1 text-sm text-ink-muted">
                    Mantenha seu contato e endereço atualizados para o cuidado pastoral e comunicação do seu iGrupo.
                  </p>

                  {perfilSalvoMsg && (
                    <div role="status" className="mt-4 rounded-xl bg-surface p-4 text-sm font-semibold text-ink">
                      Seus dados cadastrais foram atualizados com sucesso.
                    </div>
                  )}

                  <form onSubmit={salvarPerfil} className="mt-6 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="perfil-nome" className="block text-sm font-semibold text-ink">
                          Nome completo
                        </label>
                        <input
                          id="perfil-nome"
                          type="text"
                          value={perfil.nome}
                          onChange={(e) => setPerfil({ ...perfil, nome: e.target.value })}
                          className="mt-1.5 min-h-11 w-full rounded-xl border border-border-strong bg-canvas px-4 py-2 text-base text-ink"
                        />
                      </div>
                      <div>
                        <label htmlFor="perfil-email" className="block text-sm font-semibold text-ink">
                          E-mail
                        </label>
                        <input
                          id="perfil-email"
                          type="email"
                          value={perfil.email}
                          onChange={(e) => setPerfil({ ...perfil, email: e.target.value })}
                          className="mt-1.5 min-h-11 w-full rounded-xl border border-border-strong bg-canvas px-4 py-2 text-base text-ink"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="perfil-telefone" className="block text-sm font-semibold text-ink">
                          WhatsApp / Telefone
                        </label>
                        <input
                          id="perfil-telefone"
                          type="tel"
                          value={perfil.telefone}
                          onChange={(e) => setPerfil({ ...perfil, telefone: e.target.value })}
                          className="mt-1.5 min-h-11 w-full rounded-xl border border-border-strong bg-canvas px-4 py-2 text-base text-ink"
                        />
                      </div>
                      <div>
                        <label htmlFor="perfil-bairro" className="block text-sm font-semibold text-ink">
                          Bairro
                        </label>
                        <input
                          id="perfil-bairro"
                          type="text"
                          value={perfil.bairro}
                          onChange={(e) => setPerfil({ ...perfil, bairro: e.target.value })}
                          className="mt-1.5 min-h-11 w-full rounded-xl border border-border-strong bg-canvas px-4 py-2 text-base text-ink"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="button button--lg button--primary btn-primario h-auto min-h-11 rounded-full border-2 border-accent px-6 py-3 text-sm font-semibold"
                      >
                        Salvar alterações
                      </button>
                    </div>
                  </form>
                </div>
              </div>

            </div>
          )}
        </div>
      )}
    </Providers>
  );
}

// Sign-in/sign-up field: label above (with an optional right-aligned action, e.g. "Esqueceu a senha?"),
// error below wired through aria-describedby. 16px text on mobile so iOS doesn't zoom on focus.
function AuthField({
  id,
  label,
  hint,
  error,
  labelAction,
  suffix,
  input,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  labelAction?: React.ReactNode;
  suffix?: React.ReactNode;
  input: React.InputHTMLAttributes<HTMLInputElement>;
}) {
  const errorId = `${id}-error`;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
          {hint && <span className="ml-1 font-normal text-ink-muted">{hint}</span>}
        </label>
        {labelAction}
      </div>
      <div className="relative mt-1.5">
        <input
          id={id}
          {...input}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`min-h-12 w-full rounded-lg border bg-canvas px-3.5 text-base text-ink transition-[border-color,box-shadow] duration-150 placeholder:text-ink-muted/70 focus:border-accent focus:ring-3 focus:ring-accent/20 focus:outline-none sm:text-sm ${
            suffix ? 'pr-11' : ''
          } ${error ? 'border-ink' : 'border-border-strong/50'}`}
        />
        {suffix}
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 flex items-center gap-1.5 text-sm text-ink">
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="size-4 shrink-0">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-11.5a.75.75 0 011.5 0v4a.75.75 0 01-1.5 0v-4zM10 14.5a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
