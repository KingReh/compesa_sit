import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  X,
  MapPin,
  Users,
  Building2,
  Filter,
  Briefcase,
  FileText,
  Search,
  UserCircle2,
  TrendingUp,
} from 'lucide-react';
import { Unidade, Employee } from '../types';
import { parseDMS } from '../utils';

interface LotacoesMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  unidades: Unidade[];
  employees: Employee[];
}

function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 });
    }
  }, [coords, map]);
  return null;
}

function buildPhotoIcon(emp: Employee, extraCount: number) {
  const initials = (emp.nome || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('');

  const inner = emp.foto
    ? `<img src="${emp.foto}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:9999px;" onerror="this.style.display='none';this.parentElement.dataset.fallback='1';" />`
    : '';

  const badge =
    extraCount > 0
      ? `<div style="position:absolute;bottom:-4px;right:-4px;background:#38bdf8;color:#0b1220;font-size:10px;font-weight:800;min-width:18px;height:18px;border-radius:9999px;display:flex;align-items:center;justify-content:center;border:2px solid #0b1220;padding:0 4px;">+${extraCount}</div>`
      : '';

  return L.divIcon({
    html: `
      <div class="lot-photo-marker" style="position:relative;width:44px;height:44px;">
        <div style="position:absolute;inset:-6px;border-radius:9999px;background:rgba(56,189,248,0.25);animation:lotPing 2.4s ease-out infinite;"></div>
        <div style="position:relative;width:44px;height:44px;border-radius:9999px;overflow:hidden;background:linear-gradient(135deg,#1e3a8a,#0ea5e9);border:2px solid #38bdf8;box-shadow:0 6px 16px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:12px;letter-spacing:0.5px;">
          ${inner}<span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;">${!emp.foto ? initials : ''}</span>
        </div>
        ${badge}
      </div>
    `,
    className: 'lot-photo-marker-wrap',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -24],
  });
}

export function LotacoesMapModal({ isOpen, onClose, unidades, employees }: LotacoesMapModalProps) {
  const [search, setSearch] = useState('');
  const [fLotacao, setFLotacao] = useState('');
  const [fCoordenacao, setFCoordenacao] = useState('');
  const [fEmpresa, setFEmpresa] = useState('');
  const [fContrato, setFContrato] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onEsc);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', onEsc);
    };
  }, [isOpen, onClose]);

  const uniq = (arr: (string | undefined)[]) =>
    Array.from(new Set(arr.map((v) => (v || '').trim()).filter(Boolean))).sort();

  const opts = useMemo(
    () => ({
      lotacao: uniq(employees.map((e) => e.lotacao)),
      coordenacao: uniq(employees.map((e) => e.coordenacao)),
      empresa: uniq(employees.map((e) => e.empresa)),
      contrato: uniq(employees.map((e) => e.contrato)),
    }),
    [employees],
  );

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((e) => {
      if (fLotacao && (e.lotacao || '').trim() !== fLotacao) return false;
      if (fCoordenacao && (e.coordenacao || '').trim() !== fCoordenacao) return false;
      if (fEmpresa && (e.empresa || '').trim() !== fEmpresa) return false;
      if (fContrato && (e.contrato || '').trim() !== fContrato) return false;
      if (q) {
        const hay = `${e.nome} ${e.matricula} ${e.especialidade} ${e.lotacao}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [employees, search, fLotacao, fCoordenacao, fEmpresa, fContrato]);

  const mapData = useMemo(() => {
    return unidades
      .map((u) => {
        const lat = parseDMS(u.latitude);
        const lng = parseDMS(u.longitude);
        if (lat === null || lng === null) return null;
        const emps = filteredEmployees.filter((e) => (e.lotacao || '').trim() === u.nome.trim());
        if (emps.length === 0) return null;
        return { unidade: u, coords: [lat, lng] as [number, number], emps };
      })
      .filter(Boolean) as { unidade: Unidade; coords: [number, number]; emps: Employee[] }[];
  }, [unidades, filteredEmployees]);

  const metrics = useMemo(() => {
    const total = filteredEmployees.length;
    const unidadesAtivas = mapData.length;
    const topLot = [...mapData]
      .sort((a, b) => b.emps.length - a.emps.length)
      .slice(0, 5);
    return { total, unidadesAtivas, topLot };
  }, [filteredEmployees, mapData]);

  const center: [number, number] = mapData.length
    ? [
        mapData.reduce((a, d) => a + d.coords[0], 0) / mapData.length,
        mapData.reduce((a, d) => a + d.coords[1], 0) / mapData.length,
      ]
    : [-8.05428, -34.8813];

  const resetFilters = () => {
    setSearch('');
    setFLotacao('');
    setFCoordenacao('');
    setFEmpresa('');
    setFContrato('');
  };

  const hasFilter = search || fLotacao || fCoordenacao || fEmpresa || fContrato;

  if (!isOpen) return null;

  return createPortal(
    <>
      <style>{`
        @keyframes lotPing { 0%{transform:scale(1);opacity:.7} 80%,100%{transform:scale(2.2);opacity:0} }
        .lot-modal-select { appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 10px center; padding-right:28px; }
        .lot-popup .leaflet-popup-content-wrapper { background: #0b1220; color:#fff; border:1px solid rgba(56,189,248,.35); border-radius:12px; box-shadow:0 20px 40px rgba(0,0,0,.6); }
        .lot-popup .leaflet-popup-tip { background:#0b1220; border:1px solid rgba(56,189,248,.35); }
        .lot-popup .leaflet-popup-content { margin: 10px 12px; }
      `}</style>
      <div
        className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full h-[92vh] sm:h-[85vh] max-w-[1500px] bg-gradient-to-br from-[#0b1220] via-[#0f1a2e] to-[#0b1220] border border-white/10 rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.6)] overflow-hidden animate-scale-in flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 bg-black/40">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-brand-accent/15 border border-brand-accent/30 text-brand-accent shadow-inner">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-white font-bold text-sm sm:text-base tracking-wide truncate">
                  Painel Geográfico de Lotações
                </h2>
                <p className="text-[11px] text-white/50 truncate">
                  Visualização interativa das unidades e distribuição do efetivo
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-lg transition-colors border border-transparent hover:border-white/20 active:scale-95"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter bar */}
          <div className="px-4 sm:px-6 py-3 border-b border-white/10 bg-white/[0.02] flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-white/50 font-semibold pr-2">
              <Filter className="w-3.5 h-3.5" /> Filtros
            </div>
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-white/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar colaborador..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs placeholder-white/30 focus:outline-none focus:border-brand-accent/50 transition"
              />
            </div>
            {[
              { v: fLotacao, s: setFLotacao, opts: opts.lotacao, label: 'Lotação' },
              { v: fCoordenacao, s: setFCoordenacao, opts: opts.coordenacao, label: 'Coordenação' },
              { v: fEmpresa, s: setFEmpresa, opts: opts.empresa, label: 'Empresa' },
              { v: fContrato, s: setFContrato, opts: opts.contrato, label: 'Contrato' },
            ].map((f) => (
              <select
                key={f.label}
                value={f.v}
                onChange={(e) => f.s(e.target.value)}
                className="lot-modal-select bg-black/40 border border-white/10 text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-brand-accent/50 transition min-w-[130px]"
              >
                <option value="">{f.label}: Todos</option>
                {f.opts.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ))}
            {hasFilter && (
              <button
                onClick={resetFilters}
                className="text-[11px] text-brand-accent hover:text-white px-2 py-1 rounded transition"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 flex flex-col lg:flex-row min-h-0">
            {/* Map */}
            <div className="flex-1 relative bg-black/60 min-h-[300px]">
              <MapContainer
                center={center}
                zoom={10}
                scrollWheelZoom
                className="h-full w-full z-0"
                attributionControl={false}
                key={`${mapData.length}-${center[0].toFixed(3)}`}
              >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                <FitBounds coords={mapData.map((d) => d.coords)} />
                {mapData.map((d) =>
                  d.emps.slice(0, 1).map((emp) => (
                    <Marker
                      key={`${d.unidade.id}-${emp.id}`}
                      position={d.coords}
                      icon={buildPhotoIcon(emp, d.emps.length - 1)}
                    >
                      <Popup className="lot-popup" minWidth={240}>
                        <div>
                          <div className="flex items-center gap-2 pb-2 mb-2 border-b border-white/10">
                            <div className="w-2 h-2 rounded-full bg-brand-accent" />
                            <span className="text-[11px] font-bold uppercase tracking-wider text-white">
                              {d.unidade.nome}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mb-2 text-[11px]">
                            <span className="text-white/60 uppercase tracking-widest">Efetivo local</span>
                            <span className="font-black text-brand-accent">{d.emps.length}</span>
                          </div>
                          <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                            {d.emps.map((e) => (
                              <div key={e.id} className="flex items-center gap-2 text-[11px]">
                                {e.foto ? (
                                  <img
                                    src={e.foto}
                                    alt=""
                                    className="w-6 h-6 rounded-full object-cover border border-white/20"
                                  />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center">
                                    <UserCircle2 className="w-4 h-4 text-slate-400" />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-white font-semibold leading-tight">{e.nome}</p>
                                  <p className="truncate text-white/50 text-[10px] leading-tight">
                                    {e.especialidade || '—'}
                                    {e.coordenacao ? ` · ${e.coordenacao}` : ''}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  )),
                )}
              </MapContainer>
              <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/10" />
            </div>

            {/* Side metrics */}
            <aside className="lg:w-[320px] border-t lg:border-t-0 lg:border-l border-white/10 bg-black/30 flex flex-col overflow-hidden">
              <div className="p-4 grid grid-cols-2 gap-2 border-b border-white/10">
                <MetricCard
                  icon={<Users className="w-4 h-4" />}
                  label="Efetivo Filtrado"
                  value={metrics.total}
                  color="text-emerald-400"
                />
                <MetricCard
                  icon={<Building2 className="w-4 h-4" />}
                  label="Unidades Ativas"
                  value={metrics.unidadesAtivas}
                  color="text-sky-400"
                />
                <MetricCard
                  icon={<Briefcase className="w-4 h-4" />}
                  label="Empresas"
                  value={new Set(filteredEmployees.map((e) => e.empresa).filter(Boolean)).size}
                  color="text-amber-400"
                />
                <MetricCard
                  icon={<FileText className="w-4 h-4" />}
                  label="Contratos"
                  value={new Set(filteredEmployees.map((e) => e.contrato).filter(Boolean)).size}
                  color="text-fuchsia-400"
                />
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-3.5 h-3.5 text-brand-accent" />
                  <h4 className="text-[10px] uppercase tracking-widest text-white/60 font-bold">
                    Unidades com Maior Lotação
                  </h4>
                </div>
                {metrics.topLot.length === 0 && (
                  <p className="text-xs text-white/40 italic py-4 text-center">
                    Nenhuma unidade corresponde aos filtros
                  </p>
                )}
                <ul className="space-y-2">
                  {metrics.topLot.map((d, i) => {
                    const max = metrics.topLot[0]?.emps.length || 1;
                    const pct = Math.max(6, (d.emps.length / max) * 100);
                    return (
                      <li
                        key={d.unidade.id}
                        className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 hover:border-brand-accent/30 transition"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] text-white font-semibold truncate flex items-center gap-1.5">
                            <span className="text-[10px] text-white/40 font-mono">#{i + 1}</span>
                            {d.unidade.nome}
                          </span>
                          <span className="text-[11px] font-black text-brand-accent shrink-0 ml-2">
                            {d.emps.length}
                          </span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-brand-accent to-sky-400 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}

function MetricCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 hover:border-white/15 transition">
      <div className={`flex items-center gap-1.5 ${color} mb-1`}>{icon}</div>
      <p className="text-[9px] uppercase tracking-widest text-white/50 font-semibold leading-tight">{label}</p>
      <p className="text-lg font-black text-white leading-tight mt-0.5">{value}</p>
    </div>
  );
}
