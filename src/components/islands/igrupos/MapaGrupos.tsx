import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import { localDoGrupo, quandoReune, type Igrupo } from '../../../lib/igrupos';
import './igrupos.css';
import { corDoPerfil, lerTokens, prefereMovimentoReduzido } from './tokens';

interface Props {
  grupos: Igrupo[];
  selecionadoId: string | null;
  onSelecionar: (id: string) => void;
  ativo: boolean;
}

const CENTRO_PADRAO: L.LatLngTuple = [-30.0, -51.12];
const CASA_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2 12h3v8h5v-5h4v5h5v-8h3z"/></svg>';

const escapar = (t: string) =>
  t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);

export default function MapaGrupos({ grupos, selecionadoId, onSelecionar, ativo }: Props) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<L.Map | null>(null);
  const camadaRef = useRef<L.LayerGroup | null>(null);
  const onSelecionarRef = useRef(onSelecionar);
  onSelecionarRef.current = onSelecionar;

  const noMapa = grupos.filter((g) => !g.online);
  const chave = noMapa.map((g) => g.id).join('|');

  // Cria o mapa uma vez.
  useEffect(() => {
    if (!elRef.current) return;
    const mapa = L.map(elRef.current, { center: CENTRO_PADRAO, zoom: 11, zoomControl: true, attributionControl: true });
    mapa.attributionControl.setPrefix(false);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    }).addTo(mapa);
    camadaRef.current = L.layerGroup().addTo(mapa);
    mapaRef.current = mapa;
    return () => {
      mapa.remove();
      mapaRef.current = null;
      camadaRef.current = null;
    };
  }, []);

  // Pins: recria quando o filtro ou a seleção mudam (no máximo 14).
  useEffect(() => {
    const camada = camadaRef.current;
    if (!camada) return;
    camada.clearLayers();
    const t = lerTokens();
    for (const g of noMapa) {
      const icone = L.divIcon({
        className: `igrupo-pin${g.id === selecionadoId ? ' igrupo-pin--ativo' : ''}`,
        html: `<span class="igrupo-pin__corpo" style="--pin:${corDoPerfil(g.perfil, t)}">${CASA_SVG}</span>`,
        iconSize: [36, 44],
        iconAnchor: [18, 44],
        popupAnchor: [0, -40],
      });
      const marcador = L.marker([g.lat, g.lng], { icon: icone, title: g.nome, alt: `iGrupo ${g.nome}`, keyboard: true });
      marcador.bindTooltip(
        `<strong>${escapar(g.nome)}</strong><span>${escapar(localDoGrupo(g))} · ${escapar(quandoReune(g))}</span>`,
        { direction: 'top', offset: [0, -38], className: 'igrupo-dica' },
      );
      marcador.on('click', () => onSelecionarRef.current(g.id));
      marcador.addTo(camada);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, selecionadoId]);

  // Enquadra os resultados do filtro quando não há seleção; voa até o pin quando há.
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa || !ativo) return;
    mapa.invalidateSize();
    const animar = !prefereMovimentoReduzido();
    const selecionado = noMapa.find((g) => g.id === selecionadoId);
    if (selecionado) {
      mapa.setView([selecionado.lat, selecionado.lng], Math.max(mapa.getZoom(), 15), { animate: animar });
    } else if (noMapa.length > 0) {
      mapa.fitBounds(L.latLngBounds(noMapa.map((g) => [g.lat, g.lng] as L.LatLngTuple)), {
        padding: [48, 48],
        maxZoom: 14,
        animate: animar,
      });
    } else {
      mapa.setView(CENTRO_PADRAO, 11, { animate: animar });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, selecionadoId, ativo]);

  return (
    <div
      ref={elRef}
      className="igrupos-mapa h-full min-h-72 w-full"
      role="application"
      aria-label="Mapa dos iGrupos. A lista ao lado tem os mesmos grupos e funciona pelo teclado."
    />
  );
}
