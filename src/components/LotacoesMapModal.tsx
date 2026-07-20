import React, { useEffect, useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
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
  RefreshCw,
  Maximize2,
  Minimize2,
  LocateFixed,
  Navigation,
  Plus,
  Minus,
  Phone,
  Map as MapIcon,
  Compass,
  Copy,
  Edit,
  User,
  ExternalLink,
  Network,
  ChevronDown,
  ChevronUp,
  Trash2,
  Ruler,
  Info,
  Check
} from 'lucide-react';
import { Unidade, Employee, VacationPlan } from '../types';
import { parseDMS } from '../utils';
import { motion } from 'motion/react';

interface LotacoesMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  unidades: Unidade[];
  employees: Employee[];
  vacationPlans?: VacationPlan[];
  onViewEmployee?: (emp: Employee) => void;
  onEditEmployee?: (emp: Employee) => void;
}

const MAP_STYLES = [
  { id: 'dark', name: 'Modo Escuro', url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' },
  { id: 'osm', name: 'OpenStreetMap', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' },
  { id: 'light', name: 'Modo Claro', url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png' },
  { id: 'satellite', name: 'Satélite (Esri)', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' },
  { id: 'hybrid', name: 'Híbrido (Google)', url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}' },
  { id: 'terrain', name: 'Terreno (Google)', url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}' },
];

// Helper to calculate distance in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Controller component to center & handle map actions programmatically
function MapController({
  coords,
  focusCoords,
  userLocation,
  shouldFitBounds
}: {
  coords: [number, number][];
  focusCoords: [number, number] | null;
  userLocation: [number, number] | null;
  shouldFitBounds: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (focusCoords) {
      map.setView(focusCoords, 14, { animate: true, duration: 1 });
    }
  }, [focusCoords, map]);

  useEffect(() => {
    if (userLocation) {
      map.setView(userLocation, 13, { animate: true });
    }
  }, [userLocation, map]);

  useEffect(() => {
    if (shouldFitBounds && coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [coords, shouldFitBounds, map]);

  return null;
}

// Custom select dropdown component supporting search and multi-select
function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
  icon: Icon
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (val: string[]) => void;
  icon: React.ComponentType<any>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    const cleanSearch = search.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return options.filter(opt =>
      opt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(cleanSearch)
    );
  }, [options, search]);

  const toggleOption = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter(item => item !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  return (
    <div className="relative shrink-0 flex-1 min-w-[calc(50%-0.3125rem)] sm:flex-none sm:min-w-0" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-1.5 bg-black/40 hover:bg-black/60 text-white text-[11px] rounded-lg px-2.5 min-h-[36px] py-1.5 border border-white/10 hover:border-brand-accent/50 transition duration-150 active:scale-95 cursor-pointer sm:max-w-[200px]"
      >
        <Icon className="w-3.5 h-3.5 text-brand-muted shrink-0" />
        <span className="truncate flex-1 text-left">
          {selected.length > 0 ? `${label} (${selected.length})` : label}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-white/40 shrink-0 ml-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 sm:right-auto mt-1 sm:w-64 bg-[#0a1120] border border-brand-border/40 rounded-xl shadow-2xl z-[1100] flex flex-col max-h-72 overflow-hidden animate-scale-in">
          <div className="p-2 border-b border-white/5 bg-black/20">
            <div className="relative">
              <Search className="w-3 h-3 text-white/40 absolute left-2 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Buscar ${label.toLowerCase()}...`}
                className="w-full bg-black/40 border border-white/10 text-[11px] text-white rounded-md pl-7 pr-2.5 py-1.5 focus:outline-none focus:border-brand-accent/50 placeholder:text-white/30"
                autoFocus
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-1 space-y-0.5 styled-scrollbars-light overscroll-contain">
            {filteredOptions.length === 0 ? (
              <p className="text-[10px] text-white/40 italic p-3 text-center">Nenhum resultado</p>
            ) : (
              filteredOptions.map((opt) => {
                const isChecked = selected.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleOption(opt)}
                    className="w-full flex items-center justify-between text-left text-[11px] text-slate-300 hover:text-white hover:bg-white/[0.04] px-2.5 py-2 rounded-md transition-colors cursor-pointer"
                  >
                    <span className="truncate pr-2">{opt}</span>
                    <div className={`w-4 h-4 rounded border border-white/20 flex items-center justify-center transition-colors shrink-0 ${isChecked ? 'bg-brand-accent border-brand-accent' : 'bg-black/30'}`}>
                      {isChecked && <Check className="w-2.5 h-2.5 text-brand-bg stroke-[3]" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Custom Marker design with user avatar initials fallback
function buildEmployeeMarkerIcon(emp: Employee, count: number, isSelected: boolean) {
  const initials = (emp.nome || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('');

  const innerPhoto = emp.foto
    ? `<img src="${emp.foto}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:9999px;" onerror="this.style.display='none';this.parentElement.dataset.fallback='1';" />`
    : '';

  const badgeHtml = count > 1
    ? `<div style="position:absolute;bottom:-3px;right:-3px;background:#38bdf8;color:#034289;font-size:9px;font-weight:900;min-width:16px;height:16px;border-radius:9999px;display:flex;align-items:center;justify-content:center;border:1.5px solid #0b1220;padding:0 3px;box-shadow:0 2px 4px rgba(0,0,0,0.4);">+${count - 1}</div>`
    : '';

  const borderClass = isSelected ? 'border-amber-400 scale-110 shadow-amber-500/30' : 'border-brand-accent/80 hover:border-white hover:scale-105';
  const pulseHtml = isSelected 
    ? `<div style="position:absolute;inset:-8px;border-radius:9999px;background:rgba(251,191,36,0.25);animation:lotPing 1.8s ease-out infinite;"></div>`
    : `<div style="position:absolute;inset:-6px;border-radius:9999px;background:rgba(56,189,248,0.15);animation:lotPing 2.5s ease-out infinite;"></div>`;

  return L.divIcon({
    html: `
      <div style="position:relative;width:40px;height:40px;transition:all 0.2s ease;">
        ${pulseHtml}
        <div class="w-[40px] h-[40px] rounded-full border-2 ${borderClass} shadow-xl flex items-center justify-center text-white font-extrabold text-[11px] overflow-hidden bg-gradient-to-br from-[#165AAB] to-[#034289] relative select-none">
          ${innerPhoto}
          <span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;">${!emp.foto ? initials : ''}</span>
        </div>
        ${badgeHtml}
      </div>
    `,
    className: 'custom-leaflet-marker-avatar bg-transparent border-0',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
}

export function LotacoesMapModal({
  isOpen,
  onClose,
  unidades,
  employees,
  vacationPlans = [],
  onViewEmployee,
  onEditEmployee
}: LotacoesMapModalProps) {
  // Filters local state to keep rendering high-performance and decoupled
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedLotacao, setSelectedLotacao] = useState<string[]>([]);
  const [selectedCoordenacao, setSelectedCoordenacao] = useState<string[]>([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState<string[]>([]);
  const [selectedContrato, setSelectedContrato] = useState<string[]>([]);
  const [selectedUnidade, setSelectedUnidade] = useState<string[]>([]);
  
  // Map and sidebar interactive states
  const MAP_STYLE_STORAGE_KEY = '@sit:lotacoesMap:style';
  const [mapStyle, setMapStyle] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(MAP_STYLE_STORAGE_KEY);
      if (saved && MAP_STYLES.some(s => s.id === saved)) return saved;
    } catch { /* noop */ }
    return 'dark';
  });
  useEffect(() => {
    try { localStorage.setItem(MAP_STYLE_STORAGE_KEY, mapStyle); } catch { /* noop */ }
  }, [mapStyle]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'metrics' | 'list'>('metrics');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [focusCoords, setFocusCoords] = useState<[number, number] | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [shouldFitBounds, setShouldFitBounds] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Distance ruler tool state
  const [isRulerActive, setIsRulerActive] = useState(false);
  const [rulerPoints, setRulerPoints] = useState<[number, number][]>([]);
  const [isStyleMenuOpen, setIsStyleMenuOpen] = useState(false);

  // Synced List scroll limit
  const [visibleCount, setVisibleCount] = useState(50);
  const listContainerRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isRulerActive) {
          setIsRulerActive(false);
          setRulerPoints([]);
        } else {
          onClose();
        }
      }
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, isRulerActive]);

  // Unique filter option helpers
  const uniq = (arr: (string | undefined)[]) =>
    Array.from(new Set(arr.map((v) => (v || '').trim()).filter(Boolean))).sort();

  const filterOptions = useMemo(() => ({
    lotacao: uniq(employees.map(e => e.lotacao)),
    coordenacao: uniq(employees.map(e => e.coordenacao)),
    empresa: uniq(employees.map(e => e.empresa)),
    contrato: uniq(employees.map(e => e.contrato)),
    unidade: uniq(unidades.map(u => u.nome))
  }), [employees, unidades]);

  // Fuzzy Search implementation
  const fuzzySearchMatch = (employee: Employee, query: string): boolean => {
    if (!query) return true;
    const q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // Normalizing employee properties
    const nome = employee.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const matricula = (employee.matricula || '').toLowerCase();
    const especialidade = (employee.especialidade || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const empresa = (employee.empresa || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const coord = (employee.coordenacao || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const lot = (employee.lotacao || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const contrato = (employee.contrato || '').toLowerCase();
    
    // Direct matches
    if (
      nome.includes(q) ||
      matricula.includes(q) ||
      especialidade.includes(q) ||
      empresa.includes(q) ||
      coord.includes(q) ||
      lot.includes(q) ||
      contrato.includes(q)
    ) {
      return true;
    }

    // Characters subsequence tolerance (fuzzy)
    let qIdx = 0;
    const haystack = nome + ' ' + matricula + ' ' + especialidade + ' ' + empresa;
    for (let i = 0; i < haystack.length && qIdx < q.length; i++) {
      if (haystack[i] === q[qIdx]) {
        qIdx++;
      }
    }
    return qIdx === q.length;
  };

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      if (selectedLotacao.length > 0 && !selectedLotacao.includes(emp.lotacao)) return false;
      if (selectedCoordenacao.length > 0 && !selectedCoordenacao.includes(emp.coordenacao)) return false;
      if (selectedEmpresa.length > 0 && !selectedEmpresa.includes(emp.empresa)) return false;
      if (selectedContrato.length > 0 && !selectedContrato.includes(emp.contrato)) return false;
      if (selectedUnidade.length > 0 && !selectedUnidade.includes(emp.lotacao)) return false; // lotacao is typically the unit name
      if (debouncedSearch && !fuzzySearchMatch(emp, debouncedSearch)) return false;
      return true;
    });
  }, [employees, selectedLotacao, selectedCoordenacao, selectedEmpresa, selectedContrato, selectedUnidade, debouncedSearch]);

  // Group coordinates and employees to place on map
  const mapLocations = useMemo(() => {
    const coordsMap: { [key: string]: { unidade: Unidade; coords: [number, number]; emps: Employee[] } } = {};
    const invalidList: Unidade[] = [];

    unidades.forEach(u => {
      const lat = parseDMS(u.latitude);
      const lng = parseDMS(u.longitude);

      if (lat !== null && lng !== null) {
        // Filter employees of this specific unit
        const emps = filteredEmployees.filter(e => (e.lotacao || '').trim() === u.nome.trim());
        if (emps.length > 0) {
          const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
          if (coordsMap[key]) {
            coordsMap[key].emps.push(...emps);
          } else {
            coordsMap[key] = {
              unidade: u,
              coords: [lat, lng],
              emps
            };
          }
        }
      } else {
        invalidList.push(u);
      }
    });

    return Object.values(coordsMap);
  }, [unidades, filteredEmployees]);

  // Current year & month for vacation computation
  const currentMonthBR = useMemo(() => {
    const months = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return months[new Date().getMonth()];
  }, []);

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  // Stats computation
  const stats = useMemo(() => {
    const total = filteredEmployees.length;
    
    // In vacation (checks if employee has a vacation plan in current month)
    const inVacation = filteredEmployees.filter(emp =>
      vacationPlans.some(p => p.employeeId === emp.id && p.year === currentYear && p.month === currentMonthBR)
    ).length;

    // Afastados (derived if they have no active lotacao or have custom SPT marker)
    const afastados = filteredEmployees.filter(emp => !emp.lotacao || String(emp.spt).toUpperCase().includes('AFASTADO')).length;
    
    const ativos = Math.max(0, total - inVacation - afastados);

    // Distribution by coordination
    const coordCounts: { [key: string]: number } = {};
    filteredEmployees.forEach(e => {
      if (e.coordenacao) coordCounts[e.coordenacao] = (coordCounts[e.coordenacao] || 0) + 1;
    });
    const coordDistribution = Object.entries(coordCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Distribution by company
    const empCounts: { [key: string]: number } = {};
    filteredEmployees.forEach(e => {
      if (e.empresa) empCounts[e.empresa] = (empCounts[e.empresa] || 0) + 1;
    });
    const empDistribution = Object.entries(empCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Top units
    const unitCounts: { [key: string]: { id: string; nome: string; count: number } } = {};
    mapLocations.forEach(loc => {
      unitCounts[loc.unidade.nome] = {
        id: loc.unidade.id,
        nome: loc.unidade.nome,
        count: loc.emps.length
      };
    });
    const unitDistribution = Object.values(unitCounts)
      .sort((a, b) => b.count - a.count);

    // Top Contracts
    const contractCounts: { [key: string]: number } = {};
    filteredEmployees.forEach(e => {
      if (e.contrato) contractCounts[e.contrato] = (contractCounts[e.contrato] || 0) + 1;
    });
    const contractDistribution = Object.entries(contractCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      ativos,
      afastados,
      inVacation,
      total,
      coordDistribution,
      empDistribution,
      unitDistribution,
      contractDistribution
    };
  }, [filteredEmployees, vacationPlans, currentYear, currentMonthBR, mapLocations]);

  // Clean all filters
  const handleClearAll = () => {
    setSearch('');
    setSelectedLotacao([]);
    setSelectedCoordenacao([]);
    setSelectedEmpresa([]);
    setSelectedContrato([]);
    setSelectedUnidade([]);
    setShouldFitBounds(true);
  };

  const hasActiveFilters = search ||
    selectedLotacao.length > 0 ||
    selectedCoordenacao.length > 0 ||
    selectedEmpresa.length > 0 ||
    selectedContrato.length > 0 ||
    selectedUnidade.length > 0;

  // Locate user coords
  const handleLocateUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation([pos.coords.latitude, pos.coords.longitude]);
          setShouldFitBounds(false);
        },
        (err) => {
          console.warn("Permissão de geolocalização negada", err);
          alert("Não foi possível obter sua localização. Verifique as permissões do navegador.");
        }
      );
    }
  };

  // Fit view bounds to all markers
  const handleFitAll = () => {
    setFocusCoords(null);
    setShouldFitBounds(true);
    // Reset key triggers force react-leaflet to fit bounds again
    setTimeout(() => {
      setShouldFitBounds(false);
    }, 100);
  };

  // Refresh data handler simulated
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  // Synced List lazy scrolling handler
  const handleScrollList = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 100) {
      setVisibleCount(prev => Math.min(prev + 50, filteredEmployees.length));
    }
  };

  // Center on list item click
  const handleListItemClick = (emp: Employee) => {
    setSelectedEmployeeId(emp.id);
    const unit = unidades.find(u => u.nome.trim() === (emp.lotacao || '').trim());
    if (unit) {
      const lat = parseDMS(unit.latitude);
      const lng = parseDMS(unit.longitude);
      if (lat !== null && lng !== null) {
        setFocusCoords([lat, lng]);
      }
    }
  };

  // Handle map click for ruler measurement
  const MapEventsHandler = () => {
    const map = useMap();
    useEffect(() => {
      if (!isRulerActive) return;
      const onMapClick = (e: L.LeafletMouseEvent) => {
        const newPoint: [number, number] = [e.latlng.lat, e.latlng.lng];
        setRulerPoints(prev => {
          if (prev.length >= 2) {
            return [newPoint]; // Reset to point 1 on third click
          }
          return [...prev, newPoint];
        });
      };
      map.on('click', onMapClick);
      return () => {
        map.off('click', onMapClick);
      };
    }, [isRulerActive, map]);

    return null;
  };

  // Measured distance text helper
  const measuredDistance = useMemo(() => {
    if (rulerPoints.length === 2) {
      const km = calculateDistance(
        rulerPoints[0][0], rulerPoints[0][1],
        rulerPoints[1][0], rulerPoints[1][1]
      );
      if (km < 1) {
        return `${(km * 1000).toFixed(0)} metros`;
      }
      return `${km.toFixed(2)} km`;
    }
    return null;
  }, [rulerPoints]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md transition-all duration-300">
      {/* Backdrop click close */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`relative w-full bg-gradient-to-br from-[#0c1322] via-[#0f1b32] to-[#0c1322] border border-brand-border/30 shadow-[0_30px_70px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col z-10 transition-all duration-300 ${
          isFullscreen 
            ? 'w-screen h-screen rounded-none border-0' 
            : 'h-[92vh] sm:h-[88vh] max-w-[1550px] rounded-2xl'
        }`}
      >
        {/* Header Dashboard */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-white/10 bg-black/35 select-none shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-accent/15 border border-brand-accent/25 text-brand-accent shadow-inner animate-pulse">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-white font-black text-sm sm:text-base tracking-wide uppercase">
                  Painel Geográfico de Lotações
                </h2>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-brand-accent/15 border border-brand-accent/30 text-brand-accent font-mono animate-fade-in">
                  Live Map
                </span>
              </div>
              <p className="text-[11px] text-brand-muted/80">
                Monitoramento georreferenciado em tempo real da força de trabalho
              </p>
            </div>
          </div>

          {/* Quick Metrics in Header */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
            <div className="hidden md:flex items-center gap-3 border-r border-white/10 pr-4">
              <div className="text-right">
                <p className="text-[9px] text-brand-muted/60 uppercase font-bold tracking-widest leading-none">Colaboradores</p>
                <p className="text-xs text-white font-black leading-none mt-1">{stats.total}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-brand-muted/60 uppercase font-bold tracking-widest leading-none">Unidades Ativas</p>
                <p className="text-xs text-brand-accent font-black leading-none mt-1">{mapLocations.length}</p>
              </div>
            </div>

            {/* Actions button list */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleRefresh}
                className="p-1.5 rounded-lg text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 border-white/10 active:scale-95 transition-all duration-150 cursor-pointer"
                title="Atualizar dados do mapa"
                aria-label="Atualizar mapa"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-brand-accent' : ''}`} />
              </button>

              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 border-white/10 active:scale-95 transition-all duration-150 cursor-pointer"
                title={isFullscreen ? 'Sair do modo tela cheia' : 'Modo tela cheia'}
                aria-label="Alternar tela cheia"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <div className="w-px h-5 bg-white/10 mx-1"></div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/15 active:scale-95 transition-all duration-150 cursor-pointer"
                title="Fechar Painel (ESC)"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="px-4 sm:px-6 py-3 border-b border-white/10 bg-white/[0.01] flex flex-wrap gap-2.5 items-center select-none shrink-0">
          <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-brand-muted/70 font-black pr-2">
            <Filter className="w-3.5 h-3.5" /> Filtros Ativos
          </div>

          {/* Global Fuzzy search */}
          <div className="relative flex-1 min-w-[150px] sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-white/30 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShouldFitBounds(true);
              }}
              placeholder="Fuzzy search (Nome, Matrícula, Especialidade...)"
              className="w-full pl-8 pr-8 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-brand-accent/50 transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-0.5"
                title="Limpar pesquisa"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Dynamic Select Filters */}
          <MultiSelectDropdown
            label="Lotação"
            options={filterOptions.lotacao}
            selected={selectedLotacao}
            onChange={(val) => {
              setSelectedLotacao(val);
              setShouldFitBounds(true);
            }}
            icon={Building2}
          />
          <MultiSelectDropdown
            label="Coordenação"
            options={filterOptions.coordenacao}
            selected={selectedCoordenacao}
            onChange={(val) => {
              setSelectedCoordenacao(val);
              setShouldFitBounds(true);
            }}
            icon={Network}
          />
          <MultiSelectDropdown
            label="Empresa"
            options={filterOptions.empresa}
            selected={selectedEmpresa}
            onChange={(val) => {
              setSelectedEmpresa(val);
              setShouldFitBounds(true);
            }}
            icon={Briefcase}
          />
          <MultiSelectDropdown
            label="Contrato"
            options={filterOptions.contrato}
            selected={selectedContrato}
            onChange={(val) => {
              setSelectedContrato(val);
              setShouldFitBounds(true);
            }}
            icon={FileText}
          />
          <MultiSelectDropdown
            label="Unidade"
            options={filterOptions.unidade}
            selected={selectedUnidade}
            onChange={(val) => {
              setSelectedUnidade(val);
              setShouldFitBounds(true);
            }}
            icon={MapPin}
          />

          {/* Clear Filters options */}
          {hasActiveFilters && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-400 hover:text-rose-300 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1.5 rounded-lg transition active:scale-95 cursor-pointer ml-auto"
              title="Limpar todos os filtros selecionados"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar Todos</span>
            </button>
          )}
        </div>

        {/* Selected Chips row */}
        {hasActiveFilters && (
          <div className="px-4 sm:px-6 py-2 bg-white/[0.005] border-b border-white/5 flex flex-wrap gap-1.5 select-none shrink-0 overflow-x-auto max-h-[85px] styled-scrollbars-light">
            <span className="text-[8px] font-bold text-white/40 uppercase self-center tracking-widest mr-1">Filtros:</span>
            {search && (
              <span className="flex items-center gap-1 bg-brand-accent/15 border border-brand-accent/25 rounded-md px-2 py-0.5 text-[9px] font-bold text-brand-accent">
                Busca: "{search}"
                <button onClick={() => setSearch('')} className="hover:text-white cursor-pointer"><X className="w-2.5 h-2.5" /></button>
              </span>
            )}
            {selectedLotacao.map(item => (
              <span key={item} className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-md px-2 py-0.5 text-[9px] font-semibold text-white/80">
                Lot: {item}
                <button onClick={() => setSelectedLotacao(prev => prev.filter(x => x !== item))} className="hover:text-rose-400 cursor-pointer"><X className="w-2.5 h-2.5" /></button>
              </span>
            ))}
            {selectedCoordenacao.map(item => (
              <span key={item} className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-md px-2 py-0.5 text-[9px] font-semibold text-white/80">
                Coord: {item}
                <button onClick={() => setSelectedCoordenacao(prev => prev.filter(x => x !== item))} className="hover:text-rose-400 cursor-pointer"><X className="w-2.5 h-2.5" /></button>
              </span>
            ))}
            {selectedEmpresa.map(item => (
              <span key={item} className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-md px-2 py-0.5 text-[9px] font-semibold text-white/80">
                Empresa: {item}
                <button onClick={() => setSelectedEmpresa(prev => prev.filter(x => x !== item))} className="hover:text-rose-400 cursor-pointer"><X className="w-2.5 h-2.5" /></button>
              </span>
            ))}
            {selectedContrato.map(item => (
              <span key={item} className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-md px-2 py-0.5 text-[9px] font-semibold text-white/80">
                Contrato: {item}
                <button onClick={() => setSelectedContrato(prev => prev.filter(x => x !== item))} className="hover:text-rose-400 cursor-pointer"><X className="w-2.5 h-2.5" /></button>
              </span>
            ))}
            {selectedUnidade.map(item => (
              <span key={item} className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-md px-2 py-0.5 text-[9px] font-semibold text-white/80">
                Unidade: {item}
                <button onClick={() => setSelectedUnidade(prev => prev.filter(x => x !== item))} className="hover:text-rose-400 cursor-pointer"><X className="w-2.5 h-2.5" /></button>
              </span>
            ))}
          </div>
        )}

        {/* Dashboard Main Workspace */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
          
          {/* Lado Esquerdo - Mapa Interativo (70%) */}
          <div className="flex-1 relative bg-black/80 flex flex-col overflow-hidden min-h-[350px]">
            <MapContainer
              center={[-8.05428, -34.8813]}
              zoom={9}
              zoomControl={false}
              className="w-full h-full z-0 outline-none"
              attributionControl={false}
            >
              <TileLayer 
                url={MAP_STYLES.find(s => s.id === mapStyle)?.url || MAP_STYLES[0].url} 
                key={mapStyle}
              />
              <MapController 
                coords={mapLocations.map(loc => loc.coords)}
                focusCoords={focusCoords}
                userLocation={userLocation}
                shouldFitBounds={shouldFitBounds}
              />
              <MapEventsHandler />

              {/* Cluster and Unit markers rendering */}
              {mapLocations.map((d) => {
                const markerKey = `${d.unidade.id}-${d.emps.map(e => e.id).join('-')}`;
                const isUnitSelected = d.emps.some(e => e.id === selectedEmployeeId);
                const firstEmp = d.emps[0];

                return (
                  <Marker
                    key={markerKey}
                    position={d.coords}
                    icon={buildEmployeeMarkerIcon(firstEmp, d.emps.length, isUnitSelected)}
                    eventHandlers={{
                      click: () => {
                        setSelectedEmployeeId(firstEmp.id);
                        setFocusCoords(d.coords);
                      }
                    }}
                  >
                    <Popup className="geo-popup" minWidth={310} maxWidth={330}>
                      <div className="p-3 bg-gradient-to-br from-[#0b1220] via-[#0e1726] to-[#0b1220] rounded-xl border border-brand-border/30">
                        {/* Popup Header */}
                        <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-white/5 select-none">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-brand-accent shadow shadow-brand-accent animate-ping" />
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 truncate pr-1">
                              {d.unidade.nome}
                            </span>
                          </div>
                          <span className="text-[9px] font-black text-brand-accent bg-brand-accent/15 px-2 py-0.5 rounded border border-brand-accent/25 shrink-0">
                            EFETIVO: {d.emps.length}
                          </span>
                        </div>

                        {/* List of collaborators at this location */}
                        <div className="max-h-52 overflow-y-auto space-y-3 pr-1 styled-scrollbars-light">
                          {d.emps.map((e) => {
                            const initials = (e.nome || '?')
                              .split(' ')
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((n) => n[0]?.toUpperCase())
                              .join('');

                            const mapUrl = `https://www.google.com/maps/search/?api=1&query=${d.coords[0]},${d.coords[1]}`;
                            const routeUrl = `https://www.google.com/maps/dir/?api=1&destination=${d.coords[0]},${d.coords[1]}`;

                            return (
                              <div 
                                key={e.id} 
                                className={`p-2 rounded-lg transition border text-slate-100 ${
                                  selectedEmployeeId === e.id 
                                    ? 'bg-brand-accent/10 border-brand-accent/40 shadow-inner' 
                                    : 'bg-black/25 border-white/5 hover:border-brand-border/30'
                                }`}
                              >
                                <div className="flex gap-2.5">
                                  {e.foto ? (
                                    <img
                                      src={e.foto}
                                      alt={e.nome}
                                      className="w-12 h-12 rounded-full object-cover border border-white/10 shrink-0"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-panel to-brand-bg border border-white/10 flex items-center justify-center shrink-0">
                                      <span className="text-[11px] font-extrabold text-white">{initials}</span>
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <h4 className="font-bold text-[11px] text-white truncate leading-tight select-all">
                                      {e.nome}
                                    </h4>
                                    <p className="text-[9px] text-brand-muted font-bold uppercase truncate leading-none mt-0.5">
                                      {e.especialidade || 'Função não definida'}
                                    </p>
                                    <p className="text-[9px] text-slate-400 truncate leading-relaxed mt-1">
                                      Matrícula: <span className="font-mono text-white font-semibold">{e.matricula}</span>
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2.5 pt-2 border-t border-white/5 text-[9px] text-slate-400 select-none">
                                  <div className="truncate">Emp: <span className="text-white font-semibold">{e.empresa}</span></div>
                                  <div className="truncate">Contrato: <span className="text-white font-semibold">{e.contrato}</span></div>
                                  <div className="truncate col-span-2">Coord: <span className="text-white font-semibold">{e.coordenacao}</span></div>
                                  {e.telefone && (
                                    <div className="truncate col-span-2 flex items-center gap-1 mt-0.5">
                                      <Phone className="w-2.5 h-2.5 text-brand-accent shrink-0" />
                                      <span className="text-slate-300 font-mono select-all font-semibold">{e.telefone}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Quick actions inside Card */}
                                <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-white/5 select-none">
                                  {onViewEmployee && (
                                    <button
                                      onClick={() => onViewEmployee(e)}
                                      className="flex items-center gap-1 bg-brand-panel/40 border border-brand-border/40 hover:bg-brand-panel-light/60 px-2 py-1 rounded text-[9px] font-bold text-white transition cursor-pointer"
                                    >
                                      <User className="w-2.5 h-2.5 text-brand-accent" />
                                      <span>Ver Perfil</span>
                                    </button>
                                  )}

                                  {onEditEmployee && (
                                    <button
                                      onClick={() => onEditEmployee(e)}
                                      className="flex items-center gap-1 bg-brand-panel/40 border border-brand-border/40 hover:bg-brand-panel-light/60 px-2 py-1 rounded text-[9px] font-bold text-white transition cursor-pointer"
                                    >
                                      <Edit className="w-2.5 h-2.5 text-brand-accent" />
                                      <span>Editar</span>
                                    </button>
                                  )}

                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(`Lat: ${d.coords[0]}, Lng: ${d.coords[1]}`);
                                      alert('Coordenadas copiadas para a área de transferência!');
                                    }}
                                    className="flex items-center justify-center p-1 bg-brand-panel/40 border border-brand-border/40 hover:bg-brand-panel-light/60 rounded text-[9px] text-white hover:text-brand-accent transition cursor-pointer"
                                    title="Copiar coordenadas"
                                  >
                                    <Copy className="w-2.5 h-2.5" />
                                  </button>

                                  <a
                                    href={routeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/20 px-2 py-1 rounded text-[9px] font-bold text-amber-300 transition cursor-pointer"
                                  >
                                    <Navigation className="w-2.5 h-2.5" />
                                    <span>Traçar Rota</span>
                                  </a>

                                  <a
                                    href={mapUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center p-1 bg-brand-panel/40 border border-brand-border/40 hover:bg-brand-panel-light/60 rounded text-[9px] text-white hover:text-brand-accent transition cursor-pointer ml-auto"
                                    title="Abrir no Google Maps"
                                  >
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Live coordinates / Geolocation marker */}
              {userLocation && (
                <Marker
                  position={userLocation}
                  icon={L.divIcon({
                    html: `
                      <div class="relative w-7 h-7 flex items-center justify-center">
                        <div class="absolute inset-[-4px] rounded-full bg-emerald-400/35 animate-ping"></div>
                        <div class="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-lg"></div>
                      </div>
                    `,
                    className: 'user-geo-marker bg-transparent border-0',
                    iconSize: [28, 28],
                    iconAnchor: [14, 14]
                  })}
                >
                  <Popup>
                    <div className="p-2 text-xs font-bold text-[#0c1322] select-none">Você está aqui</div>
                  </Popup>
                </Marker>
              )}

              {/* Ruler line rendering */}
              {isRulerActive && rulerPoints.length > 0 && (
                <>
                  <Polyline positions={rulerPoints} color="#38bdf8" dashArray="6, 6" weight={3} />
                  {rulerPoints.map((pt, i) => (
                    <Marker
                      key={i}
                      position={pt}
                      icon={L.divIcon({
                        html: `<div class="w-3.5 h-3.5 rounded-full bg-brand-accent border border-white shadow"></div>`,
                        className: 'ruler-marker bg-transparent border-0',
                        iconSize: [14, 14],
                        iconAnchor: [7, 7]
                      })}
                    />
                  ))}
                </>
              )}
            </MapContainer>

            {/* Custom Interactive Floating Map Controls */}
            <div className="absolute top-4 left-4 z-[999] flex flex-col gap-2 select-none">
              
              {/* Tile Styles Card Selector (click-toggle for touch support) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsStyleMenuOpen(v => !v)}
                  className={`flex items-center justify-center w-10 h-10 rounded-xl backdrop-blur border shadow-lg transition active:scale-95 cursor-pointer ${
                    isStyleMenuOpen
                      ? 'bg-brand-accent/20 border-brand-accent text-brand-accent'
                      : 'bg-[#0c1322]/90 border-white/10 text-white hover:text-brand-accent hover:border-brand-accent/50'
                  }`}
                  title="Estilos de visualização do mapa"
                  aria-label="Escolher estilo do mapa"
                  aria-expanded={isStyleMenuOpen}
                >
                  <MapIcon className="w-4 h-4" />
                </button>
                {isStyleMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-[1150]" onClick={() => setIsStyleMenuOpen(false)} />
                    <div className="absolute left-0 mt-1.5 w-48 bg-[#0a1120] border border-brand-border/40 rounded-xl shadow-2xl z-[1200] py-1.5 animate-scale-in">
                      <p className="px-3 py-1 text-[8px] font-bold text-white/40 uppercase tracking-wider border-b border-white/5 mb-1 select-none">Selecione o Estilo</p>
                      {MAP_STYLES.map(style => (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => { setMapStyle(style.id); setIsStyleMenuOpen(false); }}
                          className={`w-full text-left text-[11px] px-3.5 py-2 transition-colors cursor-pointer flex items-center justify-between ${
                            mapStyle === style.id ? 'text-brand-accent font-bold bg-white/[0.04]' : 'text-slate-300 hover:text-white hover:bg-white/[0.02]'
                          }`}
                        >
                          <span>{style.name}</span>
                          {mapStyle === style.id && <Check className="w-3 h-3 text-brand-accent" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Locate Controls */}
              <button
                onClick={handleLocateUser}
                className={`flex items-center justify-center w-10 h-10 rounded-xl border backdrop-blur shadow-lg transition active:scale-95 cursor-pointer ${
                  userLocation 
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' 
                    : 'bg-[#0c1322]/90 border-white/10 text-white hover:text-brand-accent hover:border-brand-accent/50'
                }`}
                title="Mostrar minha localização atual"
                aria-label="Mostrar minha localização"
              >
                <Navigation className="w-4 h-4" />
              </button>

              <button
                onClick={handleFitAll}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#0c1322]/90 backdrop-blur border border-white/10 text-white hover:text-brand-accent hover:border-brand-accent/50 shadow-lg transition active:scale-95 cursor-pointer"
                title="Centralizar e focar todos os marcadores"
                aria-label="Centralizar todos os marcadores"
              >
                <LocateFixed className="w-4 h-4" />
              </button>
            </div>

            {/* Top-Right Ruler Measure Toolbar */}
            <div className="absolute top-4 right-4 z-[999] flex flex-col-reverse sm:flex-row items-end sm:items-center gap-1.5 select-none max-w-[calc(100%-1rem)]">
              {isRulerActive && (
                <div className="flex items-center gap-2 bg-[#0c1322]/95 backdrop-blur px-3 py-1.5 rounded-xl border border-brand-accent/30 text-white text-[10px] shadow-lg animate-scale-in max-w-[80vw] sm:max-w-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-ping shrink-0" />
                  <span className="truncate">
                    {rulerPoints.length === 0 && 'Toque no mapa para marcar o ponto inicial'}
                    {rulerPoints.length === 1 && 'Toque em outro ponto para medir'}
                    {rulerPoints.length === 2 && `Distância: ${measuredDistance}`}
                  </span>
                  {rulerPoints.length > 0 && (
                    <button
                      onClick={() => setRulerPoints([])}
                      className="ml-2 text-rose-400 hover:text-rose-300 font-bold uppercase text-[8px] cursor-pointer shrink-0"
                    >
                      Reiniciar
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={() => {
                  setIsRulerActive(!isRulerActive);
                  setRulerPoints([]);
                }}
                className={`flex items-center justify-center w-10 h-10 rounded-xl border backdrop-blur shadow-lg transition active:scale-95 cursor-pointer ${
                  isRulerActive 
                    ? 'bg-brand-accent/20 border-brand-accent text-brand-accent' 
                    : 'bg-[#0c1322]/90 border-white/10 text-white hover:text-brand-accent hover:border-brand-accent/50'
                }`}
                title="Medição de distância (Régua)"
                aria-label="Alternar régua de medição"
              >
                <Ruler className="w-4 h-4" />
              </button>
            </div>

            {/* Bottom Inset Compass Coordinates overlay */}
            <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-[999] bg-[#0c1322]/80 backdrop-blur px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-white/5 text-[9px] text-white/50 font-mono shadow-md pointer-events-none select-none flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-brand-accent animate-spin" style={{ animationDuration: '8s' }} />
              <span className="hidden sm:inline">COMPESA SIT REGION | Lat: Recife Default</span>
              <span className="sm:hidden">COMPESA SIT</span>
            </div>
          </div>

          {/* Lado Direito - Painel Analítico / Lista Sincronizada (30%) */}
          <aside className="w-full lg:w-[360px] border-t lg:border-t-0 lg:border-l border-white/10 bg-black/20 flex flex-col overflow-hidden shrink-0 select-none">
            
            {/* Sidebar View Tabs selector */}
            <div className="flex border-b border-white/10 bg-black/45 p-1">
              <button
                onClick={() => setActiveTab('metrics')}
                className={`flex-1 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition cursor-pointer ${
                  activeTab === 'metrics' 
                    ? 'bg-[#165AAB] text-white shadow-inner border border-brand-border/20' 
                    : 'text-brand-muted hover:text-white hover:bg-white/5'
                }`}
              >
                Estatísticas
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className={`flex-1 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition cursor-pointer ${
                  activeTab === 'list' 
                    ? 'bg-[#165AAB] text-white shadow-inner border border-brand-border/20' 
                    : 'text-brand-muted hover:text-white hover:bg-white/5'
                }`}
              >
                Lista ({filteredEmployees.length})
              </button>
            </div>

            {/* Tab 1 - Metrics Panel */}
            {activeTab === 'metrics' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-5 styled-scrollbars-light animate-fade-in">
                
                {/* Metric Summary Cards Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition duration-150">
                    <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
                      <Users className="w-4 h-4" />
                      <span className="text-[8px] font-bold uppercase tracking-widest text-emerald-400/80">Ativos Estim.</span>
                    </div>
                    <p className="text-xl font-black text-white">{stats.ativos}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition duration-150">
                    <div className="flex items-center gap-1.5 text-sky-400 mb-1">
                      <MapPin className="w-4 h-4" />
                      <span className="text-[8px] font-bold uppercase tracking-widest text-sky-400/80">Férias Mês</span>
                    </div>
                    <p className="text-xl font-black text-white">{stats.inVacation}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition duration-150">
                    <div className="flex items-center gap-1.5 text-amber-400 mb-1">
                      <Info className="w-4 h-4" />
                      <span className="text-[8px] font-bold uppercase tracking-widest text-amber-400/80">Afastados</span>
                    </div>
                    <p className="text-xl font-black text-white">{stats.afastados}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition duration-150">
                    <div className="flex items-center gap-1.5 text-fuchsia-400 mb-1">
                      <Filter className="w-4 h-4" />
                      <span className="text-[8px] font-bold uppercase tracking-widest text-fuchsia-400/80">Filtrados</span>
                    </div>
                    <p className="text-xl font-black text-white">{stats.total}</p>
                  </div>
                </div>

                {/* Coordination distribution list */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <Network className="w-3.5 h-3.5 text-brand-accent" />
                    <h4 className="text-[9px] uppercase tracking-wider text-white/70 font-black">Distribuição por Coordenação</h4>
                  </div>
                  {stats.coordDistribution.length === 0 ? (
                    <p className="text-[10px] text-white/30 italic">Nenhum registro correspondente</p>
                  ) : (
                    <div className="space-y-2">
                      {stats.coordDistribution.slice(0, 4).map((c) => {
                        const total = stats.total || 1;
                        const pct = Math.round((c.count / total) * 100);
                        return (
                          <div key={c.name} className="p-2 rounded-lg bg-white/[0.01] border border-white/5">
                            <div className="flex justify-between items-center text-[10px] mb-1">
                              <span className="text-white font-medium truncate max-w-[200px]">{c.name}</span>
                              <span className="text-brand-accent font-bold">{c.count} ({pct}%)</span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-[#165AAB] to-brand-accent rounded-full" style={{ width: `${pct}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Company distribution list */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <Briefcase className="w-3.5 h-3.5 text-brand-accent" />
                    <h4 className="text-[9px] uppercase tracking-wider text-white/70 font-black">Distribuição por Empresa</h4>
                  </div>
                  {stats.empDistribution.length === 0 ? (
                    <p className="text-[10px] text-white/30 italic">Nenhum registro correspondente</p>
                  ) : (
                    <div className="space-y-2">
                      {stats.empDistribution.slice(0, 4).map((e) => {
                        const total = stats.total || 1;
                        const pct = Math.round((e.count / total) * 100);
                        return (
                          <div key={e.name} className="p-2 rounded-lg bg-white/[0.01] border border-white/5">
                            <div className="flex justify-between items-center text-[10px] mb-1">
                              <span className="text-white font-medium truncate max-w-[200px]">{e.name}</span>
                              <span className="text-brand-accent font-bold">{e.count} ({pct}%)</span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-sky-500 to-indigo-400 rounded-full" style={{ width: `${pct}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Units rank lists */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <TrendingUp className="w-3.5 h-3.5 text-brand-accent" />
                    <h4 className="text-[9px] uppercase tracking-wider text-white/70 font-black">Efetivo de Unidades (Top 4)</h4>
                  </div>
                  {stats.unitDistribution.length === 0 ? (
                    <p className="text-[10px] text-white/30 italic">Nenhum registro correspondente</p>
                  ) : (
                    <div className="space-y-2">
                      {stats.unitDistribution.slice(0, 4).map((u, idx) => {
                        const maxCount = stats.unitDistribution[0]?.count || 1;
                        const pct = Math.max(10, Math.round((u.count / maxCount) * 100));
                        return (
                          <div key={u.nome} className="p-2 rounded-lg bg-white/[0.01] border border-white/5">
                            <div className="flex justify-between items-center text-[10px] mb-1">
                              <span className="text-white font-medium truncate max-w-[200px]">
                                <span className="text-white/30 font-mono text-[9px] mr-1.5">#{idx + 1}</span>
                                {u.nome}
                              </span>
                              <span className="text-brand-accent font-bold">{u.count}</span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-brand-border to-brand-accent rounded-full" style={{ width: `${pct}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Contracts distribution lists */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <FileText className="w-3.5 h-3.5 text-brand-accent" />
                    <h4 className="text-[9px] uppercase tracking-wider text-white/70 font-black">Efetivo por Contrato (Top 3)</h4>
                  </div>
                  {stats.contractDistribution.length === 0 ? (
                    <p className="text-[10px] text-white/30 italic">Nenhum registro correspondente</p>
                  ) : (
                    <div className="space-y-2">
                      {stats.contractDistribution.slice(0, 3).map((c) => {
                        const total = stats.total || 1;
                        const pct = Math.round((c.count / total) * 100);
                        return (
                          <div key={c.name} className="p-2 rounded-lg bg-white/[0.01] border border-white/5">
                            <div className="flex justify-between items-center text-[10px] mb-1">
                              <span className="text-white font-medium truncate">Contrato: {c.name}</span>
                              <span className="text-brand-accent font-bold">{c.count} ({pct}%)</span>
                            </div>
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-[#165AAB] rounded-full" style={{ width: `${pct}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* Tab 2 - Synced List Panel with virtualized scroll */}
            {activeTab === 'list' && (
              <div 
                ref={listContainerRef}
                onScroll={handleScrollList}
                className="flex-1 overflow-y-auto p-3 space-y-1.5 styled-scrollbars-light animate-fade-in"
              >
                {filteredEmployees.length === 0 ? (
                  <p className="text-xs text-white/40 italic p-6 text-center select-none">Nenhum colaborador encontrado</p>
                ) : (
                  filteredEmployees.slice(0, visibleCount).map((emp) => {
                    const isEmpSelected = selectedEmployeeId === emp.id;
                    const initials = (emp.nome || '?')
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((n) => n[0]?.toUpperCase())
                      .join('');

                    return (
                      <div
                        key={emp.id}
                        onClick={() => handleListItemClick(emp)}
                        className={`p-2.5 rounded-lg border transition-all duration-150 cursor-pointer flex gap-3 text-slate-100 items-center ${
                          isEmpSelected 
                            ? 'bg-[#165AAB]/35 border-brand-accent shadow-lg shadow-black/25' 
                            : 'bg-[#0f1b32]/40 border-white/5 hover:border-white/15'
                        }`}
                      >
                        {emp.foto ? (
                          <img
                            src={emp.foto}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0 select-none pointer-events-none"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center shrink-0 select-none">
                            <span className="text-[10px] font-extrabold text-brand-accent">{initials}</span>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between items-start gap-1.5">
                            <h4 className="font-bold text-[11px] truncate leading-tight text-white select-all">
                              {emp.nome}
                            </h4>
                            <span className="text-[8px] font-mono text-slate-400 shrink-0 font-bold">
                              {emp.matricula}
                            </span>
                          </div>
                          <p className="text-[9px] text-brand-muted/95 uppercase truncate mt-0.5 leading-none">
                            {emp.especialidade || 'Função não definida'}
                          </p>
                          <div className="flex gap-2 text-[8px] text-slate-400 mt-1 leading-none select-none">
                            <span className="truncate max-w-[100px] text-white/70">Unid: {emp.lotacao}</span>
                            <span className="w-px bg-white/15"></span>
                            <span className="truncate max-w-[120px] text-white/70">{emp.empresa}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </aside>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
