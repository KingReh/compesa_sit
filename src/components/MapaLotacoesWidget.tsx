import React, { useMemo, useState, useEffect } from 'react';
import { MapPin, Users, Building2, ChevronDown, AlertTriangle, Map as MapIcon } from 'lucide-react';
import { LotacoesMapModal } from './LotacoesMapModal';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Unidade, Employee } from '../types';
import { parseDMS } from '../utils';

interface MapaLotacoesWidgetProps {
  unidades: Unidade[];
  employees: Employee[];
}

const createCustomIcon = (count: number) => {
  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center w-8 h-8 group hover:-translate-y-1 transition-transform cursor-pointer">
        <div class="absolute inset-0 bg-brand-accent/40 rounded-full animate-ping" style="animation-duration: 3s"></div>
        <div class="relative flex items-center justify-center w-full h-full bg-brand-accent rounded-full border-2 border-[rgba(30,41,59,1)] shadow-lg text-[11px] font-bold text-white z-10 transition-transform group-hover:scale-110">
          ${count}
        </div>
      </div>
    `,
    className: 'custom-leaflet-icon bg-transparent border-0',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

// Sub-component to programmatically auto-center and auto-zoom the map view to fit all markers
function MapController({ coordsList }: { coordsList: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (coordsList.length > 0) {
      const bounds = L.latLngBounds(coordsList);
      map.fitBounds(bounds, {
        padding: [30, 30],
        maxZoom: 12
      });
    }
  }, [coordsList, map]);

  return null;
}

export function MapaLotacoesWidget({ unidades, employees }: MapaLotacoesWidgetProps) {
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  const { mapData, invalidUnits } = useMemo(() => {
    const data: { 
      unidade: Unidade; 
      coords: [number, number]; 
      empList: Employee[]; 
    }[] = [];
    const invalid: Unidade[] = [];

    unidades.forEach(unidade => {
      const lat = parseDMS(unidade.latitude);
      const lng = parseDMS(unidade.longitude);

      if (lat !== null && lng !== null) {
        const empList = employees.filter(e => e.lotacao === unidade.nome);
        // Exibir somente unidades com ao menos 1 funcionário alocado
        if (empList.length > 0) {
          data.push({
            unidade,
            coords: [lat, lng],
            empList
          });
        }
      } else {
        invalid.push(unidade);
      }
    });

    return { mapData: data, invalidUnits: invalid };
  }, [unidades, employees]);

  // Audit/diagnostic logging for units with invalid coordinates
  useEffect(() => {
    invalidUnits.forEach(unidade => {
      console.warn(
        `[Mapa de Lotações - Auditoria] Unidade "${unidade.nome}" (ID: ${unidade.id}) omitida do mapa devido a coordenadas inválidas. Latitude cadastrada: "${unidade.latitude || ''}", Longitude cadastrada: "${unidade.longitude || ''}"`
      );
    });
  }, [invalidUnits]);

  // Center roughly in Pernambuco based on average or fixed point.
  const centerPosition: [number, number] = useMemo(() => {
    if (mapData.length > 0) {
      const sumLat = mapData.reduce((acc, d) => acc + d.coords[0], 0);
      const sumLng = mapData.reduce((acc, d) => acc + d.coords[1], 0);
      return [sumLat / mapData.length, sumLng / mapData.length];
    }
    return [-8.05428, -34.8813]; // Recife default
  }, [mapData]);

  if (unidades.length === 0) return null;

  return (
    <div className="sit-panel overflow-hidden flex flex-col mt-6 shadow-xl animate-fade-in group">
      {/* Header */}
      <div 
        className="p-4 border-b border-white/5 bg-black/20 flex items-center justify-between cursor-pointer lg:cursor-default"
        onClick={() => setIsMobileExpanded(!isMobileExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-brand-accent/10 border border-brand-accent/20 text-brand-accent shadow-inner">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="typ-card-title text-white tracking-wide">Mapa de Lotações</h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {invalidUnits.length > 0 && (
            <div 
              className="flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-amber-300 cursor-help"
              title={`Existem ${invalidUnits.length} unidades com coordenadas inválidas ou não cadastradas (omitidas do mapa). Verifique os logs de diagnóstico no console.`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="text-[9px] font-bold uppercase tracking-wider font-mono">{invalidUnits.length} OMITIDA(S)</span>
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setIsMapModalOpen(true); }}
            className="group/btn flex items-center gap-1.5 bg-brand-accent/10 hover:bg-brand-accent/20 px-2.5 py-1 rounded-md border border-brand-accent/30 hover:border-brand-accent/60 text-brand-accent transition-all active:scale-95 shadow-sm hover:shadow-md hover:shadow-brand-accent/10"
            title="Abrir painel geográfico completo"
          >
            <MapIcon className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Exibir Mapa</span>
          </button>
          {/* Mobile indicator */}
          <div className="lg:hidden text-white/50">
            <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isMobileExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </div>

      {/* Content wrapper with collapse logic */}
      <div className={`transition-all duration-300 overflow-hidden ${isMobileExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 lg:max-h-[1000px] lg:opacity-100'}`}>
        {/* Metrics Row */}
        <div className="grid grid-cols-2 divide-x divide-white/5 border-b border-white/5 bg-white/[0.01]">
           <div className="px-3 py-2 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
             <p className="text-[10px] text-brand-muted uppercase tracking-wider font-semibold flex items-center gap-1.5">
               <Building2 className="w-3.5 h-3.5 text-blue-400/80" />
               Unidades
             </p>
             <p className="text-sm text-white font-black shadow-black drop-shadow">{unidades.length}</p>
           </div>
           <div className="px-3 py-2 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
             <p className="text-[10px] text-brand-muted uppercase tracking-wider font-semibold flex items-center gap-1.5">
               <Users className="w-3.5 h-3.5 text-emerald-400/80" />
               Efetivo Map.
             </p>
             <p className="text-sm text-white font-black shadow-black drop-shadow">{employees.length}</p>
           </div>
        </div>

        {/* Map Area */}
        <div className="relative h-64 sm:h-[340px] w-full bg-black/60 isolate">
         <MapContainer 
           center={centerPosition} 
           zoom={10} 
           scrollWheelZoom={false} 
           className="h-full w-full z-0"
           attributionControl={false}
         >
           {/* Dark matter base map from Carto */}
           <TileLayer
             url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
           />
           {/* Fit boundaries of all markers dynamically */}
           <MapController coordsList={mapData.map(d => d.coords)} />
           {mapData.map((data) => {
             // Generate a unique key based on the employees in this unit to force re-render on changes
             const markerKey = `${data.unidade.id}-${data.empList.map(e => `${e.id}-${e.nome}`).join('|')}`;
             return (
               <Marker 
                 key={markerKey} 
                 position={data.coords}
                 icon={createCustomIcon(data.empList.length)}
               >
               <Popup 
                 className="custom-popup"
                 // Adding some inline styling hints through minWidth if classes are stripped
                 minWidth={220}
               >
                 <div className="p-2 -m-2 bg-slate-900 rounded-lg shadow-xl border border-slate-700/50">
                   <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700/50">
                     <div className="w-2 h-2 rounded-full bg-brand-accent"></div>
                     <h4 className="font-bold text-slate-100 text-[11px] uppercase tracking-wider">{data.unidade.nome}</h4>
                   </div>
                   
                   <div className="flex justify-between items-center bg-slate-800/50 rounded-md px-2.5 py-1.5 mb-3 border border-slate-700/30">
                     <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Funcionários Locais</span>
                     <span className="text-xs font-black text-brand-accent">{data.empList.length}</span>
                   </div>
                   
                   {data.empList.length > 0 && (
                     <div className="max-h-32 overflow-y-auto pr-1 space-y-1 styled-scrollbars-light">
                       {data.empList.map(emp => (
                         <div key={emp.id} className="flex items-center gap-2 text-[10px] text-slate-300 py-1 hover:text-white transition-colors group/item">
                           <UserRoundIcon emp={emp} />
                           <span className="truncate flex-1">{emp.nome}</span>
                         </div>
                       ))}
                     </div>
                   )}
                   {data.empList.length === 0 && (
                     <div className="py-2 text-center">
                       <span className="text-[10px] text-slate-500 italic">Nenhuma alocação</span>
                     </div>
                   )}
                 </div>
               </Popup>
             </Marker>
           );
           })}
         </MapContainer>
         {/* Inner subtle borders to integrate with the frame */}
         <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/10 z-[1]" />
         <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-black/20 to-transparent pointer-events-none z-[1]" />
         <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-black/20 to-transparent pointer-events-none z-[1]" />
       </div>
      </div>
      <LotacoesMapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        unidades={unidades}
        employees={employees}
      />
    </div>
  );
}

// Helper small icon
function UserRoundIcon({ emp }: { emp: Employee }) {
  return (
    <div className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
      <svg className="w-2.5 h-2.5 text-slate-400 group-hover/item:text-brand-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    </div>
  );
}
