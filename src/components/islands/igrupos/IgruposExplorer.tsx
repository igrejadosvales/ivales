import { Component, Suspense, lazy, useEffect, useMemo, useState, type ReactNode } from 'react';
import { FILTROS_VAZIOS, IGRUPOS, PERFIS, filtrarIgrupos, type FiltrosIgrupos } from '../../../lib/igrupos';
import Providers from '../Providers';
import Sidebar from './Sidebar';
import { corDoPerfil, lerTokens, TOKENS_PADRAO } from './tokens';

// O mapa (Leaflet) é pesado e só baixa depois do resto da página.
const MapaGrupos = lazy(() => import('./MapaGrupos'));

class LimiteDeErro extends Component<{ children: ReactNode; mensagem: string }, { erro: boolean }> {
  state = { erro: false };
  static getDerivedStateFromError() {
    return { erro: true };
  }
  render() {
    if (this.state.erro) {
      return (
        <p className="grid h-full place-items-center p-8 text-center text-sm text-ink-muted">{this.props.mensagem}</p>
      );
    }
    return this.props.children;
  }
}

const Carregando = ({ texto }: { texto: string }) => (
  <p role="status" className="grid h-full place-items-center p-8 text-sm text-ink-muted">
    {texto}
  </p>
);

export default function IgruposExplorer() {
  const [filtros, setFiltros] = useState<FiltrosIgrupos>(FILTROS_VAZIOS);
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [tokens, setTokens] = useState(TOKENS_PADRAO);
  useEffect(() => setTokens(lerTokens()), []);

  const resultados = useMemo(() => filtrarIgrupos(IGRUPOS, filtros), [filtros]);
  const visiveis = useMemo(() => new Set(resultados.map((g) => g.id)), [resultados]);
  const onlineEscondidos = resultados.filter((g) => g.online).length;

  // Se o filtro esconder o grupo selecionado, solta a seleção.
  useEffect(() => {
    if (selecionadoId && !visiveis.has(selecionadoId)) setSelecionadoId(null);
  }, [selecionadoId, visiveis]);

  return (
    <Providers>
      <div className="grid gap-4 lg:h-[min(780px,calc(100dvh-7rem))] lg:grid-cols-[22rem_1fr]">
        <div className="order-2 flex min-h-0 flex-col lg:order-1 [&>aside]:flex-1">
          <Sidebar
            filtros={filtros}
            onFiltros={setFiltros}
            resultados={resultados}
            total={IGRUPOS.length}
            selecionadoId={selecionadoId}
            onSelecionar={setSelecionadoId}
          />
        </div>

        <section aria-label="Mapa dos iGrupos" className="order-1 flex min-h-0 flex-col lg:order-2">
          <div className="relative h-[60dvh] min-h-0 flex-1 overflow-hidden rounded-cartao border border-border bg-canvas lg:h-auto">
            <div className="absolute inset-0">
              <LimiteDeErro mensagem="Não foi possível carregar o mapa. Use a lista ao lado para ver os grupos.">
                <Suspense fallback={<Carregando texto="Carregando o mapa…" />}>
                  <MapaGrupos grupos={resultados} selecionadoId={selecionadoId} onSelecionar={setSelecionadoId} ativo />
                </Suspense>
              </LimiteDeErro>
            </div>

            <div className="pointer-events-none absolute bottom-3 left-3 z-[500] max-w-[calc(100%-1.5rem)] space-y-1.5">
              {onlineEscondidos > 0 && (
                <p className="w-fit rounded-full bg-canvas px-3 py-1 text-xs font-semibold text-ink shadow">
                  {onlineEscondidos === 1 ? '1 grupo online não aparece no mapa' : `${onlineEscondidos} grupos online não aparecem no mapa`}
                </p>
              )}
              <ul aria-label="Legenda de perfis" className="flex flex-wrap gap-x-3 gap-y-1 rounded-xl bg-canvas px-3 py-2 text-xs font-semibold text-ink shadow">
                {PERFIS.map((p) => (
                  <li key={p} className="flex items-center gap-1.5">
                    <span aria-hidden="true" className="size-3 rounded-full" style={{ background: corDoPerfil(p, tokens) }} />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </Providers>
  );
}
