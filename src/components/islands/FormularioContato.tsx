import { type SyntheticEvent, useId, useRef, useState } from 'react';
import Providers from './Providers';
import {
  ASSUNTOS_CONTATO,
  type AssuntoContato,
  type CampoContato,
  DADOS_CONTATO_INICIAIS,
  type DadosContato,
  type ErrosContato,
  formatarTelefone,
  montarLinkWhatsApp,
  montarResumoContato,
  rotuloAssunto,
  validarContato,
} from '../../lib/contato';

export default function FormularioContato({ whatsappBase }: { whatsappBase: string }) {
  const baseId = useId().replace(/:/g, '');
  const idNome = `${baseId}-nome`;
  const idEmail = `${baseId}-email`;
  const idTelefone = `${baseId}-telefone`;
  const idAssunto = `${baseId}-assunto`;
  const idMensagem = `${baseId}-mensagem`;

  const [dados, setDados] = useState<DadosContato>({ ...DADOS_CONTATO_INICIAIS });
  const [erros, setErros] = useState<ErrosContato>({});
  const [alerta, setAlerta] = useState('');
  const [enviado, setEnviado] = useState(false);

  const nomeRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const telefoneRef = useRef<HTMLInputElement>(null);
  const mensagemRef = useRef<HTMLTextAreaElement>(null);

  const linkWhatsApp = montarLinkWhatsApp(whatsappBase, montarResumoContato(dados));

  function atualizarCampo(campo: CampoContato, valor: string) {
    setDados((atual) => ({ ...atual, [campo]: valor }) as DadosContato);
    setErros((atuais) => {
      if (!atuais[campo]) return atuais;
      const copia = { ...atuais };
      delete copia[campo];
      return copia;
    });
    setAlerta('');
  }

  function focarPrimeiroErro(validacao: ErrosContato) {
    if (validacao.nome) nomeRef.current?.focus();
    else if (validacao.email) emailRef.current?.focus();
    else if (validacao.telefone) telefoneRef.current?.focus();
    else if (validacao.mensagem) mensagemRef.current?.focus();
  }

  function submeter(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const validacao = validarContato(dados);
    if (Object.keys(validacao).length > 0) {
      setErros(validacao);
      setAlerta('Confira os campos destacados para enviar sua mensagem.');
      focarPrimeiroErro(validacao);
      return;
    }

    setErros({});
    setAlerta('');
    window.open(linkWhatsApp, '_blank', 'noopener,noreferrer');
    setEnviado(true);
  }

  function novaMensagem() {
    setDados({ ...DADOS_CONTATO_INICIAIS });
    setErros({});
    setAlerta('');
    setEnviado(false);
  }

  return (
    <Providers>
      <div className="rounded-cartao border border-border bg-canvas p-6 sm:p-8">
        {enviado ? (
          <div>
            <span className="chip chip--lg chip--primary chip--accent bg-accent font-semibold text-on-accent">
              <span className="chip__label">Mensagem preparada</span>
            </span>
            <h3 className="mt-4 text-2xl font-bold text-ink">Sua mensagem está pronta para envio!</h3>
            <p className="mt-2 max-w-prose text-ink-muted">
              Abrimos o WhatsApp com os dados preenchidos para nossa equipe atender você rapidamente. Caso a janela não tenha aberto, clique no botão abaixo.
            </p>

            <dl className="mt-6 space-y-3 rounded-xl border border-border bg-surface p-5 text-sm">
              <div>
                <dt className="font-semibold text-ink-muted">Nome</dt>
                <dd className="font-bold text-ink">{dados.nome}</dd>
              </div>
              <div>
                <dt className="font-semibold text-ink-muted">Contato</dt>
                <dd className="text-ink">
                  {dados.email} • {dados.telefone}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-ink-muted">Assunto</dt>
                <dd className="text-ink">{rotuloAssunto(dados.assunto)}</dd>
              </div>
              <div>
                <dt className="font-semibold text-ink-muted">Mensagem</dt>
                <dd className="whitespace-pre-line text-ink">{dados.mensagem}</dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href={linkWhatsApp}
                target="_blank"
                rel="noopener noreferrer"
                className="button button--lg button--primary btn-primario h-auto min-h-11 rounded-full border-2 border-accent px-6 py-3 text-base font-semibold no-underline"
              >
                Abrir WhatsApp novamente
              </a>
              <button
                type="button"
                onClick={novaMensagem}
                className="button button--lg button--outline btn-secundario h-auto min-h-11 rounded-full border-2 border-ink px-6 py-3 text-base font-semibold text-ink"
              >
                Enviar outra mensagem
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submeter} noValidate className="space-y-5">
            <div>
              <h3 className="text-2xl font-bold text-ink">Envie uma mensagem</h3>
              <p className="mt-1 text-sm text-ink-muted">
                Preencha o formulário abaixo e encaminharemos seu atendimento direto à equipe responsável.
              </p>
            </div>

            {alerta && (
              <div
                role="alert"
                className="rounded-xl border-2 border-ink bg-surface p-4 text-sm font-semibold text-ink"
              >
                {alerta}
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor={idNome} className="block text-sm font-semibold text-ink">
                  Nome completo <span className="text-accent-text" aria-hidden="true">*</span>
                </label>
                <input
                  ref={nomeRef}
                  id={idNome}
                  type="text"
                  autoComplete="name"
                  required
                  value={dados.nome}
                  onChange={(e) => atualizarCampo('nome', e.target.value)}
                  aria-invalid={erros.nome ? true : undefined}
                  aria-describedby={erros.nome ? `${idNome}-erro` : undefined}
                  placeholder="Como podemos chamar você?"
                  className="mt-2 min-h-11 w-full rounded-xl border border-border-strong bg-canvas px-4 py-2.5 text-base text-ink placeholder:text-ink-muted"
                />
                {erros.nome && (
                  <p id={`${idNome}-erro`} className="mt-1.5 text-sm font-semibold text-accent-text">
                    {erros.nome}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor={idEmail} className="block text-sm font-semibold text-ink">
                  E-mail <span className="text-accent-text" aria-hidden="true">*</span>
                </label>
                <input
                  ref={emailRef}
                  id={idEmail}
                  type="email"
                  autoComplete="email"
                  required
                  value={dados.email}
                  onChange={(e) => atualizarCampo('email', e.target.value)}
                  aria-invalid={erros.email ? true : undefined}
                  aria-describedby={erros.email ? `${idEmail}-erro` : undefined}
                  placeholder="seu@email.com"
                  className="mt-2 min-h-11 w-full rounded-xl border border-border-strong bg-canvas px-4 py-2.5 text-base text-ink placeholder:text-ink-muted"
                />
                {erros.email && (
                  <p id={`${idEmail}-erro`} className="mt-1.5 text-sm font-semibold text-accent-text">
                    {erros.email}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor={idTelefone} className="block text-sm font-semibold text-ink">
                  WhatsApp <span className="text-accent-text" aria-hidden="true">*</span>
                </label>
                <input
                  ref={telefoneRef}
                  id={idTelefone}
                  type="tel"
                  autoComplete="tel"
                  required
                  maxLength={15}
                  value={dados.telefone}
                  onChange={(e) => atualizarCampo('telefone', formatarTelefone(e.target.value))}
                  aria-invalid={erros.telefone ? true : undefined}
                  aria-describedby={erros.telefone ? `${idTelefone}-erro` : undefined}
                  placeholder="(11) 99999-9999"
                  className="mt-2 min-h-11 w-full rounded-xl border border-border-strong bg-canvas px-4 py-2.5 text-base text-ink placeholder:text-ink-muted"
                />
                {erros.telefone && (
                  <p id={`${idTelefone}-erro`} className="mt-1.5 text-sm font-semibold text-accent-text">
                    {erros.telefone}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor={idAssunto} className="block text-sm font-semibold text-ink">
                  Assunto <span className="text-accent-text" aria-hidden="true">*</span>
                </label>
                <select
                  id={idAssunto}
                  value={dados.assunto}
                  onChange={(e) => atualizarCampo('assunto', e.target.value as AssuntoContato)}
                  className="mt-2 min-h-11 w-full rounded-xl border border-border-strong bg-canvas px-4 py-2.5 text-base text-ink"
                >
                  {ASSUNTOS_CONTATO.map((assunto) => (
                    <option key={assunto.valor} value={assunto.valor}>
                      {assunto.rotulo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor={idMensagem} className="block text-sm font-semibold text-ink">
                  Mensagem <span className="text-accent-text" aria-hidden="true">*</span>
                </label>
                <textarea
                  ref={mensagemRef}
                  id={idMensagem}
                  rows={4}
                  required
                  value={dados.mensagem}
                  onChange={(e) => atualizarCampo('mensagem', e.target.value)}
                  aria-invalid={erros.mensagem ? true : undefined}
                  aria-describedby={erros.mensagem ? `${idMensagem}-erro` : undefined}
                  placeholder="Conte como podemos ajudar, sua dúvida ou seu pedido de oração..."
                  className="mt-2 w-full rounded-xl border border-border-strong bg-canvas p-4 text-base text-ink placeholder:text-ink-muted"
                />
                {erros.mensagem && (
                  <p id={`${idMensagem}-erro`} className="mt-1.5 text-sm font-semibold text-accent-text">
                    {erros.mensagem}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="button button--lg button--primary btn-primario h-auto min-h-11 rounded-full border-2 border-accent px-6 py-3 text-base font-semibold"
              >
                Enviar mensagem
              </button>
            </div>
          </form>
        )}
      </div>
    </Providers>
  );
}
