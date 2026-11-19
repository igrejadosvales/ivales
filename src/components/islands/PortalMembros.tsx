import { type SyntheticEvent, useState } from 'react';
import Providers from './Providers';
import {
  CURSOS_IDEALL,
  ESCALAS_INICIAIS,
  GRUPOS_DISPONIVEIS,
  MINISTERIOS_VOLUNTARIADO,
  PERFIL_DEMONSTRACAO,
  type CursoIdeAll,
  type EscalaVoluntario,
  type MembroFamilia,
  type MinisterioVoluntario,
  type PerfilMembro,
  progressoCurso,
} from '../../lib/membros-data';

type AbaPortal = 'inicio' | 'ideall' | 'igrupo' | 'escalas' | 'familia';
type ModoAcesso = 'login' | 'cadastro';

const ABAS: { id: AbaPortal; rotulo: string; indisponivel?: boolean }[] = [
  { id: 'inicio', rotulo: 'Visão Geral' },
  { id: 'ideall', rotulo: 'Jornada IdeAll', indisponivel: true },
  { id: 'igrupo', rotulo: 'Meu iGrupo', indisponivel: true },
  { id: 'escalas', rotulo: 'Minhas Escalas', indisponivel: true },
  { id: 'familia', rotulo: 'Família' },
];

export default function PortalMembros() {
  const [autenticado, setAutenticado] = useState(false);
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

  // Estado do membro logado
  const [perfil, setPerfil] = useState<PerfilMembro>(PERFIL_DEMONSTRACAO);
  const [cursos, setCursos] = useState<CursoIdeAll[]>(CURSOS_IDEALL);
  const [grupoAtualId, setGrupoAtualId] = useState<string>('ig-centro');
  const [filtroPerfilGrupo, setFiltroPerfilGrupo] = useState<string>('Todos');
  const [presencaConfirmadaGrupo, setPresencaConfirmadaGrupo] = useState(false);

  // Escalas e equipes
  const [escalas, setEscalas] = useState<EscalaVoluntario[]>(ESCALAS_INICIAIS);
  const [ministerios, setMinisterios] = useState<MinisterioVoluntario[]>(MINISTERIOS_VOLUNTARIADO);

  // Família: dados cadastrais e familiares
  const [perfilSalvoMsg, setPerfilSalvoMsg] = useState(false);
  const [novoFamiliarNome, setNovoFamiliarNome] = useState('');
  const [novoFamiliarParentesco, setNovoFamiliarParentesco] = useState<MembroFamilia['parentesco']>('Filho(a)');
  const [novoFamiliarFaixa, setNovoFamiliarFaixa] = useState('Vales Kids (6–8 anos)');

  const grupoAtual = GRUPOS_DISPONIVEIS.find((g) => g.id === grupoAtualId) ?? GRUPOS_DISPONIVEIS[0]!;
  const proximaEscala = escalas[0];

  function entrarDemonstracao() {
    setErroAcesso('');
    setPerfil(PERFIL_DEMONSTRACAO);
    setAutenticado(true);
    setAbaAtiva('inicio');
  }

  function submeterAcesso(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setErroAcesso('');

    if (modoAcesso === 'login') {
      if (!emailAcesso.trim() || !senhaAcesso.trim()) {
        setErroAcesso('Preencha seu e-mail e sua senha para entrar, ou use o acesso rápido de demonstração.');
        return;
      }

      const nomeDerivado = emailAcesso.includes('@')
        ? emailAcesso
            .split('@')[0]!
            .replace(/[._-]+/g, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase())
        : PERFIL_DEMONSTRACAO.nome;

      setPerfil((atual) => ({
        ...atual,
        nome: nomeDerivado || atual.nome,
        email: emailAcesso.trim() || atual.email,
      }));
      setAutenticado(true);
      setAbaAtiva('inicio');
      return;
    }

    if (!nomeCadastro.trim() || !emailAcesso.trim() || !senhaAcesso.trim()) {
      setErroAcesso('Preencha nome completo, e-mail e crie uma senha para iniciar sua jornada.');
      return;
    }

    setPerfil((atual) => ({
      ...atual,
      nome: nomeCadastro.trim(),
      email: emailAcesso.trim(),
      telefone: telefoneCadastro.trim() || atual.telefone,
      membroDesde: 'Novembro de 2026',
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

  function adicionarFamiliar(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!novoFamiliarNome.trim()) return;
    const novo: MembroFamilia = {
      id: `fam-${Date.now()}`,
      nome: novoFamiliarNome.trim(),
      parentesco: novoFamiliarParentesco,
      faixaEtaria: novoFamiliarFaixa,
    };
    setPerfil((atual) => ({
      ...atual,
      familia: [...atual.familia, novo],
    }));
    setNovoFamiliarNome('');
  }

  function removerFamiliar(id: string) {
    setPerfil((atual) => ({
      ...atual,
      familia: atual.familia.filter((f) => f.id !== id),
    }));
  }

  const gruposFiltrados =
    filtroPerfilGrupo === 'Todos'
      ? GRUPOS_DISPONIVEIS
      : GRUPOS_DISPONIVEIS.filter((g) => g.perfil === filtroPerfilGrupo);

  return (
    <Providers>
      {!autenticado ? (
        <div className="mx-auto w-full max-w-md">
          {/* Cartão de Login */}
          <div className="rounded-2xl border border-border bg-canvas p-6 shadow-lg sm:p-8">
            {/* Cabeçalho do acesso */}
            <div className="flex flex-wrap items-center justify-end gap-4 border-b border-border/60 pb-6">
              <div>
                {modoAcesso === 'login' ? (
                  <p className="text-xs text-ink-muted sm:text-sm">
                    Não tem uma conta?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setModoAcesso('cadastro');
                        setErroAcesso('');
                      }}
                      className="font-bold text-ink underline underline-offset-4 hover:text-accent-text"
                    >
                      Cadastre-se ↗
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-ink-muted sm:text-sm">
                    Já tem uma conta?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setModoAcesso('login');
                        setErroAcesso('');
                      }}
                      className="font-bold text-ink underline underline-offset-4 hover:text-accent-text"
                    >
                      Entrar ↗
                    </button>
                  </p>
                )}
              </div>
            </div>

            {/* Conteúdo Central do Formulário */}
            <div className="py-6 sm:py-8">
              {/* Ícone Redondo com Seta */}
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-border/80 bg-surface text-ink shadow-xs" aria-hidden="true">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>

              {/* Título de Boas-Vindas */}
              <h2 className="mt-3 text-center text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                {modoAcesso === 'login' ? 'Entrar na Área de Membros' : 'Começar minha jornada'}
              </h2>
              <p className="mt-1.5 text-center text-sm text-ink-muted">
                {modoAcesso === 'login'
                  ? 'Por favor, insira seus dados para continuar.'
                  : 'Preencha suas informações para criar sua conta no portal.'}
              </p>

              {erroAcesso && (
                <div
                  role="alert"
                  className="mt-5 rounded-xl border-2 border-ink bg-surface p-3.5 text-sm font-semibold text-ink"
                >
                  {erroAcesso}
                </div>
              )}

              {msgEsqueciSenha && (
                <div
                  role="status"
                  className="mt-5 rounded-xl border border-accent/40 bg-accent/5 p-3.5 text-sm text-ink"
                >
                  <p className="font-semibold text-ink">Recuperação de Acesso</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    Para redefinir sua senha, solicite um link de acesso pelo WhatsApp da secretaria ou pelo e-mail oficial da igreja.
                  </p>
                  <button
                    type="button"
                    onClick={() => setMsgEsqueciSenha(false)}
                    className="mt-2 text-xs font-bold text-accent-text underline"
                  >
                    Fechar aviso
                  </button>
                </div>
              )}

              {/* Formulário de Acesso */}
              <form onSubmit={submeterAcesso} className="mt-6 space-y-4" noValidate>
                {modoAcesso === 'cadastro' && (
                  <div>
                    <label htmlFor="membro-nome-cadastro" className="block text-xs font-semibold tracking-wide text-ink uppercase">
                      Nome completo
                    </label>
                    <div className="relative mt-1.5">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink-muted" aria-hidden="true">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </span>
                      <input
                        id="membro-nome-cadastro"
                        type="text"
                        value={nomeCadastro}
                        onChange={(e) => setNomeCadastro(e.target.value)}
                        placeholder="Ex.: Mateus Oliveira"
                        autoComplete="name"
                        className="min-h-12 w-full rounded-xl border border-border bg-canvas pr-4 pl-10 text-sm text-ink placeholder:text-ink-muted/60 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="membro-email-acesso" className="block text-xs font-semibold tracking-wide text-ink uppercase">
                    Endereço de e-mail
                  </label>
                  <div className="relative mt-1.5">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink-muted" aria-hidden="true">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </span>
                    <input
                      id="membro-email-acesso"
                      type="email"
                      value={emailAcesso}
                      onChange={(e) => setEmailAcesso(e.target.value)}
                      placeholder="seuemail@exemplo.com.br"
                      autoComplete="email"
                      className="min-h-12 w-full rounded-xl border border-border bg-canvas pr-4 pl-10 text-sm text-ink placeholder:text-ink-muted/60 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
                    />
                  </div>
                </div>

                {modoAcesso === 'cadastro' && (
                  <div>
                    <label
                      htmlFor={modoAcesso === 'cadastro' ? 'membro-telefone-cadastro' : 'membro-telefone-acesso'}
                      className="block text-xs font-semibold tracking-wide text-ink uppercase"
                    >
                      WhatsApp / Telefone {modoAcesso === 'cadastro' ? '(opcional)' : ''}
                    </label>
                    <div className="relative mt-1.5">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink-muted" aria-hidden="true">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </span>
                      <input
                        id="membro-telefone-cadastro"
                        type="tel"
                        value={telefoneCadastro}
                        onChange={(e) => setTelefoneCadastro(e.target.value)}
                        placeholder="(51) 99999-0000"
                        autoComplete="tel"
                        className="min-h-12 w-full rounded-xl border border-border bg-canvas pr-4 pl-10 text-sm text-ink placeholder:text-ink-muted/60 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="membro-senha-acesso" className="block text-xs font-semibold tracking-wide text-ink uppercase">
                    Senha
                  </label>
                  <div className="relative mt-1.5">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink-muted" aria-hidden="true">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </span>
                    <input
                      id="membro-senha-acesso"
                      type={mostrarSenha ? 'text' : 'password'}
                      value={senhaAcesso}
                      onChange={(e) => setSenhaAcesso(e.target.value)}
                      placeholder="••••••••"
                      autoComplete={modoAcesso === 'login' ? 'current-password' : 'new-password'}
                      className="min-h-12 w-full rounded-xl border border-border bg-canvas pr-11 pl-10 text-sm text-ink placeholder:text-ink-muted/60 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha((v) => !v)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-ink-muted hover:text-ink"
                      aria-label={mostrarSenha ? 'Ocultar senha' : 'Exibir senha'}
                    >
                      {mostrarSenha ? (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Linha "Lembrar de mim" e "Esqueceu a senha?" */}
                <div className="flex items-center justify-between pt-1 text-xs sm:text-sm">
                  <label htmlFor="membro-lembrar-de-mim" className="flex cursor-pointer items-center gap-2 select-none">
                    <input
                      id="membro-lembrar-de-mim"
                      type="checkbox"
                      checked={lembrarDeMim}
                      onChange={(e) => setLembrarDeMim(e.target.checked)}
                      className="sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${
                        lembrarDeMim ? 'bg-ink' : 'bg-border'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 rounded-full bg-canvas shadow-xs transition duration-200 ease-in-out ${
                          lembrarDeMim ? 'translate-x-4.5' : 'translate-x-1'
                        }`}
                      />
                    </span>
                    <span className="font-medium text-ink">Lembrar de mim</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setMsgEsqueciSenha((v) => !v)}
                    className="font-semibold text-ink underline underline-offset-2 hover:text-accent-text"
                  >
                    Esqueceu a senha?
                  </button>
                </div>

                {/* Botão Primário */}
                <button
                  type="submit"
                  className="button button--lg button--primary mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink font-bold text-white transition-all hover:bg-ink/90 active:scale-[0.99]"
                >
                  <span>
                    {modoAcesso === 'login'
                      ? 'Entrar com E-mail'
                      : 'Criar conta e acessar'}
                  </span>
                  <span aria-hidden="true">↗</span>
                </button>

                {/* Divisor "Ou" */}
                <div className="relative my-4 flex items-center justify-center" aria-hidden="true">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <span className="relative bg-canvas px-3 text-xs font-semibold text-ink-muted uppercase">
                    Ou
                  </span>
                </div>

                {/* Botão Modo Demonstração */}
                <button
                  type="button"
                  onClick={entrarDemonstracao}
                  className="button button--lg button--outline flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface font-semibold text-ink transition-all hover:border-ink hover:bg-canvas"
                >
                  <span className="text-accent-text" aria-hidden="true">✦</span>
                  <span>Explorar painel (Modo Demonstração)</span>
                </button>
              </form>
            </div>

          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Cabeçalho do Membro Logado */}
          <div className="flex flex-col justify-between gap-6 rounded-cartao border border-border bg-canvas p-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div
                aria-hidden="true"
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent text-xl font-bold text-on-accent"
              >
                {perfil.nome
                  .split(' ')
                  .slice(0, 2)
                  .map((p) => p[0])
                  .join('')
                  .toUpperCase()}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-bold text-ink">Olá, {perfil.nome.split(' ')[0]}</h2>
                  <span className="chip chip--lg chip--secondary chip--default bg-surface font-semibold text-ink">
                    <span className="chip__label">Membro desde {perfil.membroDesde}</span>
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink-muted">{perfil.campus}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled
                className="button button--lg button--primary btn-primario h-auto min-h-11 cursor-not-allowed rounded-full border-2 border-border bg-surface px-5 py-2.5 text-sm font-semibold text-ink-muted"
              >
                Jornada IdeAll em breve
              </button>
              <button
                type="button"
                onClick={() => setAutenticado(false)}
                className="button button--lg button--outline btn-secundario h-auto min-h-11 rounded-full border-2 border-ink px-5 py-2.5 text-sm font-semibold text-ink"
              >
                Sair da conta
              </button>
            </div>
          </div>

          {/* Navegação por Abas do Portal */}
          <div
            role="tablist"
            aria-label="Seções da Área de Membros"
            className="flex flex-wrap gap-2 rounded-cartao border border-border bg-canvas p-2"
          >
            {ABAS.map((aba) => {
              const selecionada = abaAtiva === aba.id;
              return (
                <button
                  key={aba.id}
                  id={`tab-${aba.id}`}
                  role="tab"
                  type="button"
                  aria-selected={selecionada}
                  aria-controls={`painel-${aba.id}`}
                  disabled={aba.indisponivel}
                  aria-disabled={aba.indisponivel || undefined}
                  onClick={aba.indisponivel ? undefined : () => setAbaAtiva(aba.id)}
                  className={`min-h-11 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                    aba.indisponivel
                      ? 'cursor-not-allowed bg-surface text-ink-muted/70'
                      : selecionada
                      ? 'bg-accent text-on-accent'
                      : 'bg-transparent text-ink hover:bg-surface'
                  }`}
                >
                  {aba.rotulo}
                  {aba.indisponivel && <span className="ml-1 text-[10px] font-bold uppercase">(em breve)</span>}
                </button>
              );
            })}
          </div>

          {/* ABA 1: VISÃO GERAL */}
          {abaAtiva === 'inicio' && (
            <div id="painel-inicio" role="tabpanel" aria-labelledby="tab-inicio" className="space-y-8">
              {/* Resumo da Jornada IdeAll */}
              <div className="rounded-cartao border border-border bg-canvas p-6 sm:p-8">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-sm font-semibold tracking-wide text-accent-text uppercase">Jornada IdeAll</p>
                    <h3 className="mt-1 text-xl font-bold text-ink">Esta área estará disponível em breve.</h3>
                  </div>
                  <span className="chip chip--lg chip--secondary chip--default self-start bg-surface font-semibold text-ink-muted sm:self-center">
                    <span className="chip__label">Em breve</span>
                  </span>
                </div>
                <p className="mt-4 max-w-2xl text-ink-muted">
                  Estamos preparando cursos e conteúdos para acompanhar sua jornada de fé.
                </p>
              </div>

              {/* Cartões de Resumo Rápido */}
              <div className="grid gap-6 md:grid-cols-3">
                {/* Meu iGrupo */}
                <article className="flex flex-col justify-between rounded-cartao border border-border bg-canvas p-6">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold tracking-wide text-accent-text uppercase">Meu iGrupo</p>
                      <span className="chip chip--lg chip--secondary chip--default bg-surface font-semibold text-ink-muted">
                        <span className="chip__label">Em breve</span>
                      </span>
                    </div>
                    <h3 className="mt-3 text-xl font-bold text-ink">Seu iGrupo estará aqui em breve.</h3>
                    <p className="mt-2 text-sm text-ink-muted">Estamos preparando essa área para você acompanhar seu grupo.</p>
                  </div>
                  <div className="mt-6 border-t border-border pt-4">
                    <span className="text-sm font-bold text-ink-muted">Indisponível no momento</span>
                  </div>
                </article>

                {/* Próxima Escala */}
                {proximaEscala && (
                  <article className="flex flex-col justify-between rounded-cartao border border-border bg-canvas p-6">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold tracking-wide text-accent-text uppercase">Próxima Escala</p>
                        <span className="chip chip--lg chip--secondary chip--default bg-surface font-semibold text-ink-muted">
                          <span className="chip__label">Em breve</span>
                        </span>
                      </div>
                      <h3 className="mt-3 text-xl font-bold text-ink">Suas escalas estarão aqui em breve.</h3>
                      <p className="mt-2 text-sm text-ink-muted">Em breve você poderá consultar seus horários e funções.</p>
                    </div>
                    <div className="mt-6 border-t border-border pt-4">
                      <span className="text-sm font-bold text-ink-muted">Indisponível no momento</span>
                    </div>
                  </article>
                )}

                {/* Família e Cuidado */}
                <article className="flex flex-col justify-between rounded-cartao border border-border bg-canvas p-6">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold tracking-wide text-accent-text uppercase">Minha Família</p>
                      <span className="chip chip--lg chip--secondary chip--default bg-surface font-semibold text-ink">
                        <span className="chip__label">{perfil.familia.length + 1} pessoas</span>
                      </span>
                    </div>
                    <h3 className="mt-3 text-xl font-bold text-ink">Cadastro Familiar</h3>
                    <ul className="mt-2 space-y-1 text-sm text-ink-muted">
                      <li>• {perfil.nome} (Titular)</li>
                      {perfil.familia.map((f) => (
                        <li key={f.id}>
                          • {f.nome} ({f.parentesco})
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-6 border-t border-border pt-4">
                    <button
                      type="button"
                      onClick={() => setAbaAtiva('familia')}
                      className="text-sm font-bold text-accent-text underline-offset-4 hover:underline"
                    >
                      Atualizar dados e família →
                    </button>
                  </div>
                </article>
              </div>
            </div>
          )}

          {/* ABA 2: JORNADA IDEALL (REDE DE CURSOS) */}
          {abaAtiva === 'ideall' && (
            <div id="painel-ideall" role="tabpanel" aria-labelledby="tab-ideall" className="space-y-6">
              <div className="rounded-cartao border border-border bg-canvas p-6 sm:p-8">
                <p className="text-sm font-semibold tracking-wide text-accent-text uppercase">Rede de cursos</p>
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
                        className={`rounded-cartao border p-6 transition-colors ${
                          curso.inscrito ? 'border-accent bg-surface' : 'border-border bg-canvas'
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
                                    className="flex w-full items-center gap-3 rounded-xl border border-border bg-canvas px-4 py-3 text-left hover:border-border-strong"
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
              <div className="rounded-cartao border border-border bg-canvas p-6 sm:p-8">
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
              <div className="rounded-cartao border border-border bg-canvas p-6 sm:p-8">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-xl font-bold text-ink">Explorar outros iGrupos nos Vales</h3>
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
                        className={`flex flex-col justify-between rounded-xl border p-5 ${
                          ehAtual ? 'border-accent bg-surface' : 'border-border bg-canvas'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold tracking-wide text-accent-text uppercase">
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
              <div className="rounded-cartao border border-border bg-canvas p-6 sm:p-8">
                <p className="text-sm font-semibold tracking-wide text-accent-text uppercase">Servir na Casa</p>
                <h3 className="mt-1 text-2xl font-bold text-ink">Minhas Próximas Escalas</h3>
                <p className="mt-2 text-ink-muted">
                  Confirme sua disponibilidade com antecedência para ajudar o líder do seu ministério na organização do culto.
                </p>

                <div className="mt-6 space-y-4">
                  {escalas.map((escala) => (
                    <article
                      key={escala.id}
                      className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-surface p-5 sm:flex-row sm:items-center"
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
              <div className="rounded-cartao border border-border bg-canvas p-6 sm:p-8">
                <h3 className="text-xl font-bold text-ink">Equipes de Voluntariado</h3>
                <p className="mt-1 text-sm text-ink-muted">
                  Escolha onde você deseja servir ou manifeste interesse para participar do próximo treinamento.
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {ministerios.map((min) => (
                    <article
                      key={min.id}
                      className={`flex flex-col justify-between rounded-xl border p-5 ${
                        min.inscrito ? 'border-accent bg-surface' : 'border-border bg-canvas'
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

          {/* ABA 5: FAMÍLIA */}
          {abaAtiva === 'familia' && (
            <div id="painel-familia" role="tabpanel" aria-labelledby="tab-familia" className="space-y-8">
              <div className="grid gap-8 lg:grid-cols-12">
                {/* Dados Cadastrais */}
                <div className="rounded-cartao border border-border bg-canvas p-6 sm:p-8 lg:col-span-7">
                  <h3 className="text-2xl font-bold text-ink">Meus Dados de Membro</h3>
                  <p className="mt-1 text-sm text-ink-muted">
                    Mantenha seu contato e endereço atualizados para o cuidado pastoral e comunicação do seu iGrupo.
                  </p>

                  {perfilSalvoMsg && (
                    <div role="status" className="mt-4 rounded-xl border border-accent bg-surface p-4 text-sm font-semibold text-ink">
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

                {/* Núcleo Familiar (Cônjuge e Filhos para o Vales Kids) */}
                <div className="rounded-cartao border border-border bg-canvas p-6 sm:p-8 lg:col-span-5">
                  <h3 className="text-2xl font-bold text-ink">Minha Família</h3>
                  <p className="mt-1 text-sm text-ink-muted">
                    Cadastre seu cônjuge e filhos para agilizar o check-in no ministério infantil (Vales Kids).
                  </p>

                  <ul className="mt-6 divide-y divide-border rounded-xl border border-border bg-surface">
                    {perfil.familia.map((familiar) => (
                      <li key={familiar.id} className="flex items-center justify-between gap-3 p-4">
                        <div>
                          <p className="font-bold text-ink">{familiar.nome}</p>
                          <p className="text-xs text-ink-muted">
                            {familiar.parentesco} • {familiar.faixaEtaria}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removerFamiliar(familiar.id)}
                          className="text-xs font-bold text-ink underline-offset-4 hover:text-accent-text hover:underline"
                          aria-label={`Remover ${familiar.nome} da família`}
                        >
                          Remover
                        </button>
                      </li>
                    ))}
                    {perfil.familia.length === 0 && (
                      <li className="p-4 text-sm text-ink-muted">Nenhum familiar adicionado ainda.</li>
                    )}
                  </ul>

                  <form onSubmit={adicionarFamiliar} className="mt-6 space-y-4 border-t border-border pt-6">
                    <h4 className="text-base font-bold text-ink">Adicionar familiar</h4>
                    <div>
                      <label htmlFor="familiar-nome" className="block text-sm font-semibold text-ink">
                        Nome do familiar
                      </label>
                      <input
                        id="familiar-nome"
                        type="text"
                        value={novoFamiliarNome}
                        onChange={(e) => setNovoFamiliarNome(e.target.value)}
                        placeholder="Ex.: Lucas Oliveira"
                        className="mt-1.5 min-h-11 w-full rounded-xl border border-border-strong bg-canvas px-4 py-2 text-sm text-ink placeholder:text-ink-muted"
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label htmlFor="familiar-parentesco" className="block text-sm font-semibold text-ink">
                          Parentesco
                        </label>
                        <select
                          id="familiar-parentesco"
                          value={novoFamiliarParentesco}
                          onChange={(e) => setNovoFamiliarParentesco(e.target.value as MembroFamilia['parentesco'])}
                          className="mt-1.5 min-h-11 w-full rounded-xl border border-border-strong bg-canvas px-3 py-2 text-sm text-ink"
                        >
                          <option value="Cônjuge">Cônjuge</option>
                          <option value="Filho(a)">Filho(a)</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="familiar-faixa" className="block text-sm font-semibold text-ink">
                          Faixa etária / Turma
                        </label>
                        <select
                          id="familiar-faixa"
                          value={novoFamiliarFaixa}
                          onChange={(e) => setNovoFamiliarFaixa(e.target.value)}
                          className="mt-1.5 min-h-11 w-full rounded-xl border border-border-strong bg-canvas px-3 py-2 text-sm text-ink"
                        >
                          <option value="Vales Kids (1–5 anos)">Vales Kids (1–5 anos)</option>
                          <option value="Vales Kids (6–8 anos)">Vales Kids (6–8 anos)</option>
                          <option value="Vales Kids (9–11 anos)">Vales Kids (9–11 anos)</option>
                          <option value="Adolescente / Jovem">Adolescente / Jovem</option>
                          <option value="Adulto">Adulto</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="button button--lg button--outline btn-secundario h-auto min-h-11 w-full rounded-full border-2 border-ink px-5 py-2.5 text-sm font-semibold text-ink"
                    >
                      + Adicionar à família
                    </button>
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
