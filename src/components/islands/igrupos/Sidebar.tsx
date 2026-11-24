import { useEffect, useRef } from 'react';
import {
  CIDADES,
  DIAS,
  FILTROS_VAZIOS,
  PERFIS,
  linkWhatsapp,
  localDoGrupo,
  quandoReune,
  type FiltrosIgrupos,
  type Igrupo,
} from '../../../lib/igrupos';

interface Props {
  filtros: FiltrosIgrupos;
  onFiltros: (f: FiltrosIgrupos) => void;
  resultados: Igrupo[];
  total: number;
  selecionadoId: string | null;
  onSelecionar: (id: string | null) => void;
}

function Chips<T extends string>({
  rotulo,
  opcoes,
  valor,
  onChange,
}: {
  rotulo: string;
  opcoes: readonly T[];
  valor: T | null;
  onChange: (v: T | null) => void;
}) {
  return (
    <div role="group" aria-label={rotulo}>
      <p className="mb-1.5 text-xs font-bold tracking-wide text-ink-muted uppercase">{rotulo}</p>
      <div className="flex flex-wrap gap-1.5">
        {opcoes.map((o) => (
          <button
            key={o}
            type="button"
            aria-pressed={valor === o}
            onClick={() => onChange(valor === o ? null : o)}
            className={`min-h-9 rounded-full px-3.5 py-1 text-xs font-semibold transition-colors ${
              valor === o
                ? 'bg-accent text-on-accent'
                : 'border border-border bg-surface text-ink hover:border-border-strong'
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Sidebar({ filtros, onFiltros, resultados, total, selecionadoId, onSelecionar }: Props) {
  const itemRef = useRef<HTMLLIElement | null>(null);
  const filtrando = JSON.stringify(filtros) !== JSON.stringify(FILTROS_VAZIOS);

  useEffect(() => {
    itemRef.current?.scrollIntoView({ block: 'nearest' });
  }, [selecionadoId]);

  return (
    <aside
      aria-label="Buscar iGrupos"
      className="flex min-h-0 flex-col overflow-hidden rounded-cartao border border-border bg-canvas"
    >
      <div className="space-y-4 border-b border-border p-4">
        <div>
          <label htmlFor="busca-igrupos" className="sr-only">
            Buscar por nome, líder, bairro ou rua
          </label>
          <input
            id="busca-igrupos"
            type="search"
            value={filtros.busca}
            onChange={(e) => onFiltros({ ...filtros, busca: e.target.value })}
            placeholder="Buscar por nome, líder, bairro ou rua"
            className="min-h-11 w-full rounded-full border border-border bg-surface px-5 text-sm text-ink placeholder:text-ink-muted"
          />
        </div>
        <Chips rotulo="Cidade" opcoes={CIDADES} valor={filtros.cidade} onChange={(cidade) => onFiltros({ ...filtros, cidade })} />
        <Chips rotulo="Perfil" opcoes={PERFIS} valor={filtros.perfil} onChange={(perfil) => onFiltros({ ...filtros, perfil })} />
        <Chips rotulo="Dia" opcoes={DIAS} valor={filtros.dia} onChange={(dia) => onFiltros({ ...filtros, dia })} />
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            aria-pressed={filtros.online}
            onClick={() => onFiltros({ ...filtros, online: !filtros.online })}
            className={`min-h-9 rounded-full px-3.5 py-1 text-xs font-semibold transition-colors ${
              filtros.online ? 'bg-accent text-on-accent' : 'border border-border bg-surface text-ink hover:border-border-strong'
            }`}
          >
            Somente online
          </button>
          {filtrando && (
            <button
              type="button"
              onClick={() => onFiltros(FILTROS_VAZIOS)}
              className="text-xs font-bold text-accent-text underline-offset-4 hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      <p aria-live="polite" className="border-b border-border px-4 py-2 text-xs font-semibold text-ink-muted">
        {resultados.length === total ? `${total} iGrupos` : `${resultados.length} de ${total} iGrupos`}
      </p>

      <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {resultados.length === 0 && (
          <li className="rounded-xl border border-dashed border-border-strong p-5 text-sm text-ink-muted">
            Nenhum iGrupo com esses filtros. Tente limpar a busca, ou fale com a gente em{' '}
            <a href="/contato" className="font-bold text-accent-text underline">
              Contato
            </a>{' '}
            e a gente indica o grupo mais próximo de você.
          </li>
        )}
        {resultados.map((g) => {
          const ativo = g.id === selecionadoId;
          return (
            <li key={g.id} ref={ativo ? itemRef : undefined}>
              <article className={`rounded-xl border p-4 ${ativo ? 'border-accent bg-surface' : 'border-border bg-canvas'}`}>
                <button
                  type="button"
                  aria-pressed={ativo}
                  onClick={() => onSelecionar(ativo ? null : g.id)}
                  className="block w-full text-left"
                >
                  <span className="text-xs font-bold tracking-wide text-accent-text uppercase">
                    {g.perfil} · {localDoGrupo(g)}
                  </span>
                  <span className="mt-1 block text-lg font-bold text-ink">{g.nome}</span>
                  <span className="mt-0.5 block text-sm text-ink-muted">{quandoReune(g)}</span>
                  <span className="mt-0.5 block text-sm text-ink-muted">{g.endereco}</span>
                </button>
                {ativo && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                    {g.lideres.filter((l) => l.whatsapp).length === 0 && (
                      <p className="text-sm text-ink-muted">
                        Ainda sem WhatsApp aqui.{' '}
                        <a href="/contato" className="font-bold text-accent-text underline">
                          Fale com a gente
                        </a>
                        .
                      </p>
                    )}
                    {g.lideres.map(
                      (l) =>
                        l.whatsapp && (
                          <a
                            key={l.nome}
                            href={linkWhatsapp(l.whatsapp, g.nome)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="button button--primary btn-primario inline-flex min-h-10 items-center rounded-full border-2 border-accent px-4 text-sm font-semibold"
                          >
                            WhatsApp {l.nome}
                          </a>
                        ),
                    )}
                  </div>
                )}
              </article>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
