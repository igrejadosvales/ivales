import { useEffect, useId, useRef, useState, type SubmitEvent, type ReactNode } from 'react';
import Providers from './Providers';
import { getSupabaseClient } from '../../lib/supabase';
import {
  AREAS,
  CATEGORIAS,
  DADOS_INICIAIS,
  formatarData,
  formatarTelefone,
  hojeISO,
  montarLinkWhatsApp,
  montarResumo,
  validarAreas,
  validarConsentimento,
  validarDados,
  type AreaVoluntariado,
  type CampoDados,
  type CategoriaArea,
  type DadosVoluntario,
  type ErrosDados,
} from '../../lib/voluntariado';

type Etapa = 1 | 2 | 3;
type Filtro = CategoriaArea | 'todas';

const ETAPAS: ReadonlyArray<{ numero: Etapa; rotulo: string }> = [
  { numero: 1, rotulo: 'Seus dados' },
  { numero: 2, rotulo: 'Áreas' },
  { numero: 3, rotulo: 'Confirmação' },
];

const ICONES = {
  seta: (
    <>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  setaVoltar: (
    <>
      <path d="M19 12H5" />
      <path d="m11 18-6-6 6-6" />
    </>
  ),
  setaBaixo: <path d="m6 9 6 6 6-6" />,
  check: <path d="m20 6-11 11-5-5" />,
  alerta: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 16h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </>
  ),
  escudo: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  relogio: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  lapis: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.5L3 21l2-5.4A8.5 8.5 0 1 1 21 11.5Z" />
      <path d="M8.5 9.5c.4 2.4 2.6 4.6 5 5l1.2-1.2 2.3.9" />
    </>
  ),
  musica: (
    <>
      <path d="M9 18V5l10-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="16" cy="16" r="3" />
    </>
  ),
  sorriso: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <path d="M9 9h.01M15 9h.01" />
    </>
  ),
  controle: (
    <>
      <rect x="2" y="7" width="20" height="10" rx="5" />
      <path d="M7 12h4M9 10v4" />
      <path d="M16 11h.01M18 13h.01" />
    </>
  ),
  video: (
    <>
      <rect x="2" y="6" width="14" height="12" rx="2" />
      <path d="m16 10 6-3v10l-6-3" />
    </>
  ),
  mao: (
    <>
      <path d="M18 11V6a2 2 0 0 0-4 0v5" />
      <path d="M14 10V4a2 2 0 0 0-4 0v6" />
      <path d="M10 10.5V6a2 2 0 0 0-4 0v8" />
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2a8 8 0 0 1-8-8v-1a2 2 0 1 1 4 0" />
    </>
  ),
  coracao: (
    <path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1L12 21l8.8-8.3a5 5 0 0 0 0-7.1Z" />
  ),
  globo: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z" />
    </>
  ),
  aperto: (
    <>
      <path d="m11 17 2 2a1 1 0 0 0 1.4 0l3.6-3.6a2 2 0 0 0 0-2.8l-4.6-4.6a2 2 0 0 0-2.8 0L7 11" />
      <path d="m8 14-4-4 4-4" />
      <path d="m16 10 4 4-4 4" />
    </>
  ),
} satisfies Record<string, ReactNode>;

type NomeIcone = keyof typeof ICONES;

function Icone({ nome, className = 'h-5 w-5' }: { nome: NomeIcone; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {ICONES[nome]}
    </svg>
  );
}

const cx = (...classes: Array<string | false | null | undefined>): string =>
  classes.filter(Boolean).join(' ');

const BTN_BASE =
  'button button--lg inline-flex h-auto min-h-11 items-center justify-center gap-2 rounded-full px-6 py-3 text-base font-semibold no-underline';
const BTN_PRIMARIO = `${BTN_BASE} button--primary btn-primario border-2 border-accent`;
const BTN_SECUNDARIO = `${BTN_BASE} button--outline btn-secundario border-2 border-ink text-ink`;
const LINK_VOLTAR =
  'inline-flex min-h-11 items-center gap-1.5 rounded-md px-1 text-sm font-semibold text-ink underline underline-offset-4 hover:text-accent-text';

const classeEntrada = (erro?: string): string =>
  cx(
    'min-h-11 w-full rounded-xl border bg-canvas px-4 py-3 text-base text-ink placeholder:text-ink-muted transition-colors',
    erro ? 'border-accent-text' : 'border-border-strong',
  );

function Campo({
  id,
  rotulo,
  erro,
  dica,
  className,
  children,
}: {
  id: string;
  rotulo: string;
  erro?: string;
  dica?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cx('space-y-2', className)}>
      <label htmlFor={id} className="block text-sm font-semibold text-ink">
        {rotulo} <span className="text-accent-text" aria-hidden="true">*</span>
      </label>
      {children}
      {dica && <p id={`${id}-dica`} className="text-sm text-ink-muted">{dica}</p>}
      {erro && (
        <p id={`${id}-erro`} className="flex items-start gap-1.5 text-sm font-medium text-accent-text">
          <Icone nome="alerta" className="mt-0.5 h-4 w-4 shrink-0" />
          {erro}
        </p>
      )}
    </div>
  );
}

function Progresso({ etapa, concluido }: { etapa: Etapa; concluido: boolean }) {
  const rotuloAtual = ETAPAS.find((item) => item.numero === etapa)?.rotulo ?? '';
  return (
    <nav aria-label="Etapas do cadastro">
      <p className="mb-3 text-sm font-semibold text-ink-muted sm:hidden">
        Etapa {etapa} de 3 · {rotuloAtual}
      </p>
      <ol className="flex items-center gap-2 sm:gap-4">
        {ETAPAS.map((item, indice) => {
          const feita = concluido || item.numero < etapa;
          const atual = !concluido && item.numero === etapa;
          return (
            <li
              key={item.numero}
              className="flex flex-1 items-center gap-2"
              aria-current={atual ? 'step' : undefined}
            >
              <span
                aria-hidden="true"
                className={cx(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold',
                  feita
                    ? 'border-accent bg-accent text-on-accent'
                    : atual
                      ? 'border-accent bg-canvas text-accent-text'
                      : 'border-border bg-canvas text-ink-muted',
                )}
              >
                {feita ? <Icone nome="check" className="h-4 w-4" /> : item.numero}
              </span>
              <span
                className={cx(
                  'sr-only text-sm font-semibold sm:not-sr-only',
                  atual || feita ? 'text-ink' : 'text-ink-muted',
                )}
              >
                {item.rotulo}
              </span>
              {indice < ETAPAS.length - 1 && <span className="hidden h-px flex-1 bg-border sm:block" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function CartaoArea({
  area,
  selecionada,
  onToggle,
}: {
  area: AreaVoluntariado;
  selecionada: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="group relative block cursor-pointer">
      <input
        type="checkbox"
        name="areas"
        value={area.id}
        checked={selecionada}
        onChange={onToggle}
        aria-label={area.nome}
        className="peer sr-only"
      />
      <span
        className={cx(
          'flex h-full flex-col rounded-cartao border-2 p-5 transition-colors',
          'peer-focus-visible:outline-2 peer-focus-visible:outline-solid peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus',
          selecionada ? 'border-accent bg-surface' : 'border-border bg-canvas hover:border-border-strong',
        )}
      >
        <span className="flex items-start justify-between gap-3">
          <span className="flex items-center gap-3">
            <span
              className={cx(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
                selecionada ? 'bg-accent text-on-accent' : 'bg-surface text-accent-text',
              )}
            >
              <Icone nome={area.icone} />
            </span>
            <span className="font-bold text-ink">{area.nome}</span>
          </span>
          <span
            aria-hidden="true"
            className={cx(
              'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
              selecionada ? 'border-accent bg-accent text-on-accent' : 'border-border text-transparent',
            )}
          >
            <Icone nome="check" className="h-4 w-4" />
          </span>
        </span>

        <span className="mt-3 block text-sm text-ink-muted">{area.descricao}</span>

        <span className="mt-4 flex flex-wrap gap-2">
          {area.habilidades.map((habilidade) => (
            <span
              key={habilidade}
              className="rounded-full border border-border bg-canvas px-2.5 py-1 text-xs font-medium text-ink-muted"
            >
              {habilidade}
            </span>
          ))}
        </span>

        <span className="mt-4 flex items-start gap-2 border-t border-border pt-3 text-xs text-ink-muted">
          <Icone nome="relogio" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-text" />
          {area.compromisso}
        </span>
      </span>
    </label>
  );
}

function Dado({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="border-t border-border py-2 first:border-0 first:pt-0 last:pb-0">
      <dt className="text-xs font-semibold tracking-wide text-ink-muted uppercase">{rotulo}</dt>
      <dd className="mt-0.5 break-words text-ink">{children}</dd>
    </div>
  );
}

function Resumo({
  titulo,
  onEditar,
  children,
}: {
  titulo: string;
  onEditar: () => void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-cartao border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-lg font-bold text-ink">{titulo}</h4>
        <button type="button" onClick={onEditar} className="inline-flex min-h-9 items-center gap-1 rounded-md text-sm font-semibold text-accent-text underline underline-offset-4 hover:text-accent-hover">
          <Icone nome="lapis" className="h-4 w-4" />
          Editar
        </button>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Fluxo({ whatsappBase }: { whatsappBase: string }) {
  const baseId = useId().replace(/:/g, '');
  const idNome = `${baseId}-nome`;
  const idEmail = `${baseId}-email`;
  const idTelefone = `${baseId}-telefone`;
  const idNascimento = `${baseId}-nascimento`;
  const idConsentimento = `${baseId}-consentimento`;
  const idErroAreas = `${baseId}-erro-areas`;

  const [etapa, setEtapa] = useState<Etapa>(1);
  const [concluido, setConcluido] = useState(false);
  const [dados, setDados] = useState<DadosVoluntario>({ ...DADOS_INICIAIS });
  const [areas, setAreas] = useState<string[]>([]);
  const [querOrientacao, setQuerOrientacao] = useState(false);
  const [consentimento, setConsentimento] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [errosDados, setErrosDados] = useState<ErrosDados>({});
  const [erroAreas, setErroAreas] = useState<string | undefined>();
  const [erroConsentimento, setErroConsentimento] = useState<string | undefined>();
  const [mensagem, setMensagem] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [maxNascimento, setMaxNascimento] = useState<string | undefined>();
  const [pronto, setPronto] = useState(false);

  const tituloRef = useRef<HTMLHeadingElement>(null);
  const cartaoRef = useRef<HTMLDivElement>(null);
  const nomeRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const telefoneRef = useRef<HTMLInputElement>(null);
  const nascimentoRef = useRef<HTMLInputElement>(null);
  const areasFieldsetRef = useRef<HTMLFieldSetElement>(null);
  const consentimentoRef = useRef<HTMLInputElement>(null);
  const primeiraRenderizacao = useRef(true);

  useEffect(() => {
    setMaxNascimento(hojeISO());
    setPronto(true);
  }, []);

  // Ao trocar de etapa, leva o foco ao título novo e volta ao topo do cartão.
  // O scroll é instantâneo de propósito: o scroll-behavior: smooth do site deixaria a troca lenta.
  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    tituloRef.current?.focus({ preventScroll: true });
    cartaoRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, [etapa, concluido]);

  const areasFiltradas = filtro === 'todas' ? AREAS : AREAS.filter((area) => area.categoria === filtro);
  const linkWhatsApp = montarLinkWhatsApp(whatsappBase, montarResumo(dados, areas, querOrientacao));

  const atualizarDado = (campo: CampoDados, valor: string) => {
    setDados((atual) => ({ ...atual, [campo]: valor }) as DadosVoluntario);
    setErrosDados((atuais) => {
      if (!atuais[campo]) return atuais;
      const proximos = { ...atuais };
      delete proximos[campo];
      return proximos;
    });
    setMensagem('');
  };

  const alternarArea = (idArea: string) => {
    setAreas((atuais) =>
      atuais.includes(idArea) ? atuais.filter((area) => area !== idArea) : [...atuais, idArea],
    );
    setErroAreas(undefined);
    setMensagem('');
  };

  const alternarOrientacao = () => {
    setQuerOrientacao((valor) => !valor);
    setErroAreas(undefined);
    setMensagem('');
  };

  const focarErroDados = (erros: ErrosDados) => {
    if (erros.nome) nomeRef.current?.focus();
    else if (erros.email) emailRef.current?.focus();
    else if (erros.telefone) telefoneRef.current?.focus();
    else if (erros.nascimento) nascimentoRef.current?.focus();
  };

  const continuarDados = (evento: SubmitEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const erros = validarDados(dados);
    if (Object.keys(erros).length > 0) {
      setErrosDados(erros);
      setMensagem('Confira os campos destacados para continuar.');
      focarErroDados(erros);
      return;
    }
    setErrosDados({});
    setMensagem('');
    setEtapa(2);
  };

  const continuarAreas = (evento: SubmitEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const erros = validarAreas(areas, querOrientacao);
    if (erros.areas) {
      setErroAreas(erros.areas);
      setMensagem('Escolha uma área ou peça orientação para continuar.');
      areasFieldsetRef.current?.focus();
      return;
    }
    setErroAreas(undefined);
    setMensagem('');
    setEtapa(3);
  };

  const enviar = async (evento: SubmitEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const erros = validarConsentimento(consentimento);
    if (erros.consentimento) {
      setErroConsentimento(erros.consentimento);
      setMensagem('Autorize o contato para enviar seu cadastro.');
      consentimentoRef.current?.focus();
      return;
    }
    setErroConsentimento(undefined);
    setMensagem('');

    const supabase = getSupabaseClient();
    if (!supabase) {
      setMensagem('O cadastro está temporariamente indisponível. Tente novamente em instantes.');
      return;
    }

    const janelaWhatsApp = window.open('', '_blank', 'noopener,noreferrer');
    setSalvando(true);

    try {
      const { error } = await supabase.rpc('create_volunteer', {
        p_full_name: dados.nome,
        p_email: dados.email,
        p_phone: dados.telefone,
        p_birth_date: dados.nascimento,
        // Mantemos o parâmetro para compatibilidade com a RPC atual; o campo não é mais exibido.
        p_education_level: null,
        p_area_ids: areas,
        p_wants_guidance: querOrientacao,
        p_contact_consent: consentimento,
      });

      if (error) throw error;

      if (janelaWhatsApp) {
        janelaWhatsApp.location.href = linkWhatsApp;
      } else {
        window.open(linkWhatsApp, '_blank', 'noopener,noreferrer');
      }
      setConcluido(true);
    } catch (erro) {
      console.error('Erro ao salvar cadastro de voluntário:', erro);
      janelaWhatsApp?.close();
      setMensagem('Não foi possível salvar seu cadastro. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const reiniciar = () => {
    setDados({ ...DADOS_INICIAIS });
    setAreas([]);
    setQuerOrientacao(false);
    setConsentimento(false);
    setErrosDados({});
    setErroAreas(undefined);
    setErroConsentimento(undefined);
    setMensagem('');
    setFiltro('todas');
    setConcluido(false);
    setEtapa(1);
  };

  const editarEtapa = (novaEtapa: Etapa) => {
    setConcluido(false);
    setMensagem('');
    setEtapa(novaEtapa);
  };

  return (
    <div
      ref={cartaoRef}
      className="scroll-mt-24 rounded-cartao border border-border bg-canvas p-5 sm:p-8"
      data-formulario-pronto={pronto ? 'true' : undefined}
    >
      <Progresso etapa={etapa} concluido={concluido} />

      <div className="mt-8">
        {concluido ? (
          <div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-on-accent">
              <Icone nome="check" className="h-7 w-7" />
            </div>
            <h3
              ref={tituloRef}
              tabIndex={-1}
              className="mt-5 text-2xl font-bold text-ink outline-none sm:text-3xl"
            >
              Cadastro enviado!
            </h3>
            <p className="mt-3 max-w-prose text-ink-muted">
              Seu cadastro foi salvo. Abrimos o WhatsApp com um resumo para você enviar à liderança.
              Se a aba não abriu, use o botão abaixo.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <section className="rounded-cartao border border-border bg-surface p-5">
                <h4 className="text-lg font-bold text-ink">Seus dados</h4>
                <dl className="mt-4">
                  <Dado rotulo="Nome">{dados.nome}</Dado>
                  <Dado rotulo="E-mail">{dados.email}</Dado>
                  <Dado rotulo="WhatsApp">{dados.telefone}</Dado>
                  <Dado rotulo="Nascimento">{formatarData(dados.nascimento)}</Dado>
                </dl>
              </section>

              <section className="rounded-cartao border border-border bg-surface p-5">
                <h4 className="text-lg font-bold text-ink">Áreas de interesse</h4>
                {areas.length > 0 ? (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {AREAS.filter((area) => areas.includes(area.id)).map((area) => (
                      <li
                        key={area.id}
                        className="rounded-full border border-border bg-canvas px-3 py-1.5 text-sm font-medium text-ink"
                      >
                        {area.nome}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-ink-muted">Nenhuma área escolhida.</p>
                )}
                {querOrientacao && (
                  <p className="mt-4 text-sm text-ink-muted">
                    Você também pediu ajuda da liderança para encontrar seu lugar.
                  </p>
                )}
              </section>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a href={linkWhatsApp} target="_blank" rel="noopener noreferrer" className={BTN_PRIMARIO}>
                <Icone nome="whatsapp" className="h-5 w-5" />
                Abrir WhatsApp novamente
              </a>
              <button type="button" onClick={reiniciar} className={BTN_SECUNDARIO}>
                Fazer novo cadastro
              </button>
            </div>
            <button type="button" onClick={() => editarEtapa(3)} className={`${LINK_VOLTAR} mt-4`}>
              <Icone nome="setaVoltar" className="h-4 w-4" />
              Voltar e editar
            </button>
          </div>
        ) : (
          <>
            {etapa === 1 && (
              <form noValidate onSubmit={continuarDados} className="space-y-6">
                <div>
                  <h3
                    ref={tituloRef}
                    tabIndex={-1}
                    className="text-2xl font-bold text-ink outline-none sm:text-3xl"
                  >
                    Seus dados
                  </h3>
                  <p className="mt-2 text-ink-muted">Preencha seus dados para continuar sua jornada.</p>
                </div>

                {mensagem && (
                  <p role="alert" className="flex items-start gap-2 rounded-xl border border-accent-text bg-surface p-3 text-sm font-semibold text-ink">
                    <Icone nome="alerta" className="mt-0.5 h-4 w-4 shrink-0 text-accent-text" />
                    {mensagem}
                  </p>
                )}

                <div className="grid gap-5 sm:grid-cols-2">
                  <Campo id={idNome} rotulo="Nome completo" erro={errosDados.nome} className="sm:col-span-2">
                    <input
                      ref={nomeRef}
                      id={idNome}
                      type="text"
                      autoComplete="name"
                      required
                      value={dados.nome}
                      onChange={(e) => atualizarDado('nome', e.target.value)}
                      aria-invalid={errosDados.nome ? true : undefined}
                      aria-describedby={errosDados.nome ? `${idNome}-erro` : undefined}
                      placeholder="Como podemos chamar você?"
                      className={classeEntrada(errosDados.nome)}
                    />
                  </Campo>

                  <Campo id={idEmail} rotulo="E-mail" erro={errosDados.email} className="sm:col-span-2">
                    <input
                      ref={emailRef}
                      id={idEmail}
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      required
                      value={dados.email}
                      onChange={(e) => atualizarDado('email', e.target.value)}
                      aria-invalid={errosDados.email ? true : undefined}
                      aria-describedby={errosDados.email ? `${idEmail}-erro` : undefined}
                      placeholder="seu@email.com"
                      className={classeEntrada(errosDados.email)}
                    />
                  </Campo>

                  <Campo
                    id={idTelefone}
                    rotulo="WhatsApp"
                    erro={errosDados.telefone}
                    dica="Com DDD. Usaremos para falar sobre o voluntariado."
                  >
                    <input
                      ref={telefoneRef}
                      id={idTelefone}
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      required
                      maxLength={15}
                      value={dados.telefone}
                      onChange={(e) => atualizarDado('telefone', formatarTelefone(e.target.value))}
                      aria-invalid={errosDados.telefone ? true : undefined}
                      aria-describedby={errosDados.telefone ? `${idTelefone}-erro` : `${idTelefone}-dica`}
                      placeholder="(00) 00000-0000"
                      className={classeEntrada(errosDados.telefone)}
                    />
                  </Campo>

                  <Campo id={idNascimento} rotulo="Data de nascimento" erro={errosDados.nascimento}>
                    <input
                      ref={nascimentoRef}
                      id={idNascimento}
                      type="date"
                      autoComplete="bday"
                      required
                      min="1900-01-01"
                      max={maxNascimento}
                      value={dados.nascimento}
                      onChange={(e) => atualizarDado('nascimento', e.target.value)}
                      aria-invalid={errosDados.nascimento ? true : undefined}
                      aria-describedby={errosDados.nascimento ? `${idNascimento}-erro` : undefined}
                      className={`${classeEntrada(errosDados.nascimento)} [color-scheme:light]`}
                    />
                  </Campo>

                </div>

                <div className="flex items-start gap-3 rounded-xl bg-surface p-4">
                  <Icone nome="escudo" className="mt-0.5 h-5 w-5 shrink-0 text-accent-text" />
                  <p className="text-sm text-ink-muted">
                    Seus dados serão salvos com segurança para que a liderança possa entrar em contato com você.
                  </p>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <a href="#caminhos" className={LINK_VOLTAR}>
                    <Icone nome="setaVoltar" className="h-4 w-4" />
                    Voltar ao início
                  </a>
                  <button type="submit" className={`${BTN_PRIMARIO} w-full sm:w-auto`}>
                    Continuar
                    <Icone nome="seta" className="h-5 w-5" />
                  </button>
                </div>
              </form>
            )}

            {etapa === 2 && (
              <form noValidate onSubmit={continuarAreas} className="space-y-7">
                <div>
                  <h3
                    ref={tituloRef}
                    tabIndex={-1}
                    className="text-2xl font-bold text-ink outline-none sm:text-3xl"
                  >
                    Encontre sua área
                  </h3>
                  <p className="mt-2 text-ink-muted">
                    Selecione os ministérios que mais combinam com você. Pode escolher mais de um.
                  </p>
                </div>

                {mensagem && (
                  <p role="alert" className="flex items-start gap-2 rounded-xl border border-accent-text bg-surface p-3 text-sm font-semibold text-ink">
                    <Icone nome="alerta" className="mt-0.5 h-4 w-4 shrink-0 text-accent-text" />
                    {mensagem}
                  </p>
                )}

                <div role="group" aria-label="Filtrar áreas" className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    aria-pressed={filtro === 'todas'}
                    onClick={() => setFiltro('todas')}
                    className={cx(
                      'min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors',
                      filtro === 'todas'
                        ? 'border-accent bg-accent text-on-accent'
                        : 'border-border bg-canvas text-ink hover:border-border-strong hover:bg-surface',
                    )}
                  >
                    Todas
                  </button>
                  {CATEGORIAS.map((categoria) => (
                    <button
                      key={categoria.id}
                      type="button"
                      aria-pressed={filtro === categoria.id}
                      onClick={() => setFiltro(categoria.id)}
                      className={cx(
                        'min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors',
                        filtro === categoria.id
                          ? 'border-accent bg-accent text-on-accent'
                          : 'border-border bg-canvas text-ink hover:border-border-strong hover:bg-surface',
                      )}
                    >
                      {categoria.rotulo}
                    </button>
                  ))}
                </div>

                <fieldset
                  ref={areasFieldsetRef}
                  tabIndex={-1}
                  aria-describedby={erroAreas ? idErroAreas : undefined}
                  className="min-w-0 border-0 p-0 outline-none"
                >
                  <legend className="sr-only">Áreas de atuação</legend>
                  <div className="grid gap-4 md:grid-cols-2">
                    {areasFiltradas.map((area) => (
                      <CartaoArea
                        key={area.id}
                        area={area}
                        selecionada={areas.includes(area.id)}
                        onToggle={() => alternarArea(area.id)}
                      />
                    ))}
                  </div>
                </fieldset>

                {erroAreas && (
                  <p id={idErroAreas} className="flex items-start gap-1.5 text-sm font-medium text-accent-text">
                    <Icone nome="alerta" className="mt-0.5 h-4 w-4 shrink-0" />
                    {erroAreas}
                  </p>
                )}

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-border-strong">
                  <input
                    type="checkbox"
                    checked={querOrientacao}
                    onChange={alternarOrientacao}
                    className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-accent)]"
                  />
                  <span className="text-sm text-ink">
                    <span className="font-semibold">Ainda não sei onde servir</span>
                    <span className="mt-1 block text-ink-muted">
                      Quero que a liderança me ajude a encontrar o lugar certo para os meus dons.
                    </span>
                  </span>
                </label>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-ink-muted" aria-live="polite">
                    {areas.length === 0
                      ? 'Nenhuma área selecionada.'
                      : `${areas.length} ${areas.length === 1 ? 'área selecionada' : 'áreas selecionadas'}.`}
                  </p>
                  {areas.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setAreas([]);
                        setMensagem('');
                      }}
                      className="min-h-9 rounded-md text-sm font-semibold text-ink underline underline-offset-4 hover:text-accent-text"
                    >
                      Limpar seleção
                    </button>
                  )}
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <button type="button" onClick={() => editarEtapa(1)} className={LINK_VOLTAR}>
                    <Icone nome="setaVoltar" className="h-4 w-4" />
                    Voltar
                  </button>
                  <button type="submit" className={`${BTN_PRIMARIO} w-full sm:w-auto`}>
                    Revisar cadastro
                    <Icone nome="seta" className="h-5 w-5" />
                  </button>
                </div>
              </form>
            )}

            {etapa === 3 && (
              <form noValidate onSubmit={enviar} className="space-y-7">
                <div>
                  <h3
                    ref={tituloRef}
                    tabIndex={-1}
                    className="text-2xl font-bold text-ink outline-none sm:text-3xl"
                  >
                    Confirme seus dados
                  </h3>
                  <p className="mt-2 text-ink-muted">
                    Revise as informações antes de enviar. Você pode editar qualquer etapa.
                  </p>
                </div>

                {mensagem && (
                  <p role="alert" className="flex items-start gap-2 rounded-xl border border-accent-text bg-surface p-3 text-sm font-semibold text-ink">
                    <Icone nome="alerta" className="mt-0.5 h-4 w-4 shrink-0 text-accent-text" />
                    {mensagem}
                  </p>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <Resumo titulo="Seus dados" onEditar={() => editarEtapa(1)}>
                    <dl>
                      <Dado rotulo="Nome">{dados.nome}</Dado>
                      <Dado rotulo="E-mail">{dados.email}</Dado>
                      <Dado rotulo="WhatsApp">{dados.telefone}</Dado>
                      <Dado rotulo="Nascimento">{formatarData(dados.nascimento)}</Dado>
                    </dl>
                  </Resumo>

                  <Resumo titulo="Áreas de interesse" onEditar={() => editarEtapa(2)}>
                    {areas.length > 0 ? (
                      <ul className="flex flex-wrap gap-2">
                        {AREAS.filter((area) => areas.includes(area.id)).map((area) => (
                          <li
                            key={area.id}
                            className="rounded-full border border-border bg-canvas px-3 py-1.5 text-sm font-medium text-ink"
                          >
                            {area.nome}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-ink-muted">Nenhuma área escolhida.</p>
                    )}
                    {querOrientacao && (
                      <p className="mt-4 text-sm text-ink-muted">
                        Você também pediu ajuda da liderança para encontrar seu lugar.
                      </p>
                    )}
                  </Resumo>
                </div>

                <div>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface p-4">
                    <input
                      ref={consentimentoRef}
                      id={idConsentimento}
                      type="checkbox"
                      checked={consentimento}
                      onChange={(e) => {
                        setConsentimento(e.target.checked);
                        setErroConsentimento(undefined);
                        setMensagem('');
                      }}
                      required
                      aria-invalid={erroConsentimento ? true : undefined}
                      aria-describedby={erroConsentimento ? `${idConsentimento}-erro` : undefined}
                      className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-accent)]"
                    />
                    <span className="text-sm text-ink">
                      Autorizo a Igreja dos Vales a entrar em contato comigo sobre o voluntariado.
                      <span className="mt-1 block text-ink-muted">
                        Você pode pedir a exclusão dos seus dados a qualquer momento.
                      </span>
                    </span>
                  </label>
                  {erroConsentimento && (
                    <p id={`${idConsentimento}-erro`} className="mt-2 flex items-start gap-1.5 text-sm font-medium text-accent-text">
                      <Icone nome="alerta" className="mt-0.5 h-4 w-4 shrink-0" />
                      {erroConsentimento}
                    </p>
                  )}
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4">
                  <Icone nome="whatsapp" className="mt-0.5 h-5 w-5 shrink-0 text-accent-text" />
                  <p className="text-sm text-ink-muted">
                    Ao continuar, abriremos o WhatsApp com um resumo do cadastro. A mensagem só é enviada
                    quando você confirmar no aplicativo.
                  </p>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <button type="button" onClick={() => editarEtapa(2)} className={LINK_VOLTAR}>
                    <Icone nome="setaVoltar" className="h-4 w-4" />
                    Voltar
                  </button>
                  <button type="submit" disabled={salvando} className={`${BTN_PRIMARIO} w-full sm:w-auto disabled:cursor-wait disabled:opacity-60`}>
                    <Icone nome="whatsapp" className="h-5 w-5" />
                    {salvando ? 'Salvando cadastro…' : 'Abrir WhatsApp com resumo'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function FormularioVoluntariado({ whatsappBase }: { whatsappBase: string }) {
  return (
    <Providers>
      <Fluxo whatsappBase={whatsappBase} />
    </Providers>
  );
}
