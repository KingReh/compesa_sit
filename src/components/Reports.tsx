import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  TrendingUp, 
  Users, 
  Award, 
  Shirt, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  BarChart3, 
  PieChart, 
  Filter, 
  FilterX, 
  Clock, 
  ArrowUpRight, 
  Activity,
  Building2,
  Briefcase,
  Users2,
  X,
  Search,
  Check,
  Car,
  UserRound,
  MapPin,
  Download,
  FileText,
  FileSpreadsheet,
  ChevronDown
} from 'lucide-react';
import { Employee, Coordenacao, Contrato, Unidade, Empresa, VacationPlan } from '../types';
import { vacationPlansService } from '../services/vacationPlansService';
import { exportReportToPDF, exportReportToXLSX, exportReportToODS } from '../utils/exportReports';
import { parseLocalDate } from '../utils';
// @ts-ignore
import carBlueprintImg from '../assets/images/blue_car_blueprint_1781386584651.jpg';

interface ReportsProps {
  employees: Employee[];
  coordenacoes: Coordenacao[];
  contratos: Contrato[];
  unidades: Unidade[];
  empresas: Empresa[];
}

const meses = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function Reports({ employees, coordenacoes, contratos, unidades, empresas }: ReportsProps) {
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('@sit:reports:selectedYear');
      return saved ? Number(saved) : 2026;
    } catch {
      return 2026;
    }
  });
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>(() => {
    try {
      return localStorage.getItem('@sit:reports:selectedCompanyFilter') || '';
    } catch {
      return '';
    }
  });
  const [selectedCoordFilter, setSelectedCoordFilter] = useState<string>(() => {
    try {
      return localStorage.getItem('@sit:reports:selectedCoordFilter') || '';
    } catch {
      return '';
    }
  });
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'ferias'>('dashboard');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedSpecialtyForModal, setSelectedSpecialtyForModal] = useState<string | null>(null);
  const [specialtySearchQuery, setSpecialtySearchQuery] = useState<string>('');
  const [isDriversModalOpen, setIsDriversModalOpen] = useState<boolean>(false);
  const [driversSearchQuery, setDriversSearchQuery] = useState<string>('');
  const [isGenderModalOpen, setIsGenderModalOpen] = useState<boolean>(false);
  const [selectedGenderType, setSelectedGenderType] = useState<'all' | 'Feminino' | 'Masculino'>('all');
  const [genderSearchQuery, setGenderSearchQuery] = useState<string>('');
  const [isCoordModalOpen, setIsCoordModalOpen] = useState<boolean>(false);
  const [selectedCoordForModal, setSelectedCoordForModal] = useState<string | null>(null);
  const [coordSearchQuery, setCoordSearchQuery] = useState<string>('');
  const [isEpiModalOpen, setIsEpiModalOpen] = useState<boolean>(false);
  const [epiModalFilterType, setEpiModalFilterType] = useState<'shirt' | 'pants' | 'spt' | 'empty' | 'all'>('all');
  const [epiModalFilterValue, setEpiModalFilterValue] = useState<string>('');
  const [epiSearchQuery, setEpiSearchQuery] = useState<string>('');
  const [isMonthScaleModalOpen, setIsMonthScaleModalOpen] = useState<boolean>(false);
  const [selectedMonthForModal, setSelectedMonthForModal] = useState<string | null>(null);
  const [scaleSearchQuery, setScaleSearchQuery] = useState<string>('');
  const [statusTableFilter, setStatusTableFilter] = useState<'all' | 'confirmed' | 'pending'>(() => {
    try {
      const saved = localStorage.getItem('@sit:reports:statusTableFilter');
      return (saved === 'all' || saved === 'confirmed' || saved === 'pending') ? (saved as 'all' | 'confirmed' | 'pending') : 'all';
    } catch {
      return 'all';
    }
  });
  const [statusTableSearch, setStatusTableSearch] = useState<string>('');
  const [statusTableMonthFilter, setStatusTableMonthFilter] = useState<string>(() => {
    try {
      return localStorage.getItem('@sit:reports:statusTableMonthFilter') || 'all';
    } catch {
      return 'all';
    }
  });
  const [vacationPlans, setVacationPlans] = useState<VacationPlan[]>([]);
  const [exportMenuOpen, setExportMenuOpen] = useState<boolean>(false);

  // Close export menu on outside click
  useEffect(() => {
    if (!exportMenuOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-export-menu]')) setExportMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [exportMenuOpen]);

  // Persist filter preferences
  useEffect(() => {
    try {
      localStorage.setItem('@sit:reports:selectedYear', String(selectedYear));
    } catch {}
  }, [selectedYear]);

  useEffect(() => {
    try {
      localStorage.setItem('@sit:reports:selectedCompanyFilter', selectedCompanyFilter);
    } catch {}
  }, [selectedCompanyFilter]);

  useEffect(() => {
    try {
      localStorage.setItem('@sit:reports:selectedCoordFilter', selectedCoordFilter);
    } catch {}
  }, [selectedCoordFilter]);

  // activeSubTab and statusTableSearch are transient UI state — not persisted.
  useEffect(() => {
    try {
      localStorage.setItem('@sit:reports:statusTableFilter', statusTableFilter);
    } catch {}
  }, [statusTableFilter]);

  useEffect(() => {
    try {
      localStorage.setItem('@sit:reports:statusTableMonthFilter', statusTableMonthFilter);
    } catch {}
  }, [statusTableMonthFilter]);
  


  // Premium grab-and-drag scroll behavior for desktop mouse users
  const handleDragScroll = (e: React.MouseEvent<HTMLDivElement>) => {
    const ele = e.currentTarget;
    const startX = e.pageX - ele.offsetLeft;
    const scrollLeft = ele.scrollLeft;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const x = moveEvent.pageX - ele.offsetLeft;
      const walk = (x - startX) * 1.5; // Scroll speed multiplier
      ele.scrollLeft = scrollLeft - walk;
    };
    
    const handleMouseUp = () => {
      ele.style.cursor = 'grab';
      ele.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    ele.style.cursor = 'grabbing';
    ele.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Load vacation plans from database
  useEffect(() => {
    async function loadPlans() {
      try {
        const plans = await vacationPlansService.getVacationPlans();
        setVacationPlans(plans);
      } catch (e) {
        console.error('Error loading vacation plans for reports', e);
      }
    }
    loadPlans();
  }, []);

  // Simulate skeleton screen loading on tab/filter changes for enterprise feel
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [selectedYear, selectedCompanyFilter, selectedCoordFilter, activeSubTab]);

  // Unique companies and coordinations based on actual employees
  const availableCompanies = useMemo(() => {
    return Array.from(new Set(employees.map(e => e.empresa).filter(Boolean))).sort();
  }, [employees]);

  const availableCoords = useMemo(() => {
    return Array.from(new Set(employees.map(e => e.coordenacao).filter(Boolean))).sort();
  }, [employees]);

  // Apply filters to employees list
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchCompany = !selectedCompanyFilter || emp.empresa === selectedCompanyFilter;
      const matchCoord = !selectedCoordFilter || emp.coordenacao === selectedCoordFilter;
      return matchCompany && matchCoord;
    });
  }, [employees, selectedCompanyFilter, selectedCoordFilter]);

  // Calculations for KPI cards & metrics
  const stats = useMemo(() => {
    const total = filteredEmployees.length;
    if (total === 0) {
      return {
        total: 0,
        avgAge: 0,
        avgSeniority: 0,
        sptPercentage: 0,
        uniformReplenishNeeded: 0,
        vacationPlanningRate: 0,
        malePercentage: 0,
        femalePercentage: 0,
        uniformShirtStats: {} as Record<string, number>,
        uniformPantsStats: {} as Record<string, number>,
        uniformSptStats: {} as Record<string, number>,
        specialtyStats: {} as Record<string, number>,
        companyStats: {} as Record<string, number>,
        coordinationStats: {} as Record<string, number>,
        planningByMonth: {} as Record<string, number>,
        autorizadoDirigirCount: 0
      };
    }

    let ageSum = 0;
    let senioritySum = 0;
    let sptCount = 0;
    let uniformIncompleteCount = 0;
    let maleCount = 0;
    let femaleCount = 0;
    let autorizadoDirigirCount = 0;

    const uniformShirtStats: Record<string, number> = {};
    const uniformPantsStats: Record<string, number> = {};
    const uniformSptStats: Record<string, number> = {};
    const specialtyStats: Record<string, number> = {};
    const companyStats: Record<string, number> = {};
    const coordinationStats: Record<string, number> = {};
    const planningByMonth: Record<string, number> = {};

    // Initialize months in planning stats
    meses.forEach(m => {
      planningByMonth[m] = 0;
    });

    const currentYear = 2026;

    filteredEmployees.forEach(emp => {
      // Demographic calculations
      if (emp.dataNascimento) {
        const bYear = parseLocalDate(emp.dataNascimento)?.getFullYear() ?? currentYear - 35;
        ageSum += Math.max(18, currentYear - bYear);
      } else {
        ageSum += 35; // default avg
      }

      if (emp.dataAdmissao) {
        const aYear = parseLocalDate(emp.dataAdmissao)?.getFullYear() ?? currentYear - 2;
        senioritySum += Math.max(0, currentYear - aYear);
      } else {
        senioritySum += 2; // default avg
      }

      // SPT Calçado de Proteção
      if (emp.spt && emp.spt !== 'Não' && emp.spt !== '') {
        sptCount++;
      }

      // Uniform integrity
      if (!emp.camisa || !emp.calca) {
        uniformIncompleteCount++;
      }

      // Shirt count
      if (emp.camisa) {
        const sz = emp.camisa.toUpperCase();
        uniformShirtStats[sz] = (uniformShirtStats[sz] || 0) + 1;
      }
      
      // Pants count
      if (emp.calca) {
        const sz = emp.calca;
        uniformPantsStats[sz] = (uniformPantsStats[sz] || 0) + 1;
      }

      // SPT (Shoes) count
      if (emp.spt && emp.spt !== 'Não' && emp.spt !== '') {
        const sz = String(emp.spt);
        uniformSptStats[sz] = (uniformSptStats[sz] || 0) + 1;
      }

      // Specialties
      if (emp.especialidade) {
        specialtyStats[emp.especialidade] = (specialtyStats[emp.especialidade] || 0) + 1;
      }

      // Companies
      if (emp.empresa) {
        companyStats[emp.empresa] = (companyStats[emp.empresa] || 0) + 1;
      }

      // Coordination
      if (emp.coordenacao) {
        coordinationStats[emp.coordenacao] = (coordinationStats[emp.coordenacao] || 0) + 1;
      }

      // Gender split
      if (emp.sexo?.toLowerCase().startsWith('f')) {
        femaleCount++;
      } else {
        maleCount++;
      }

      // Check driver authorization
      if (emp.autorizadoDirigir) {
        autorizadoDirigirCount++;
      }

      // Vacation monthly load
      const plan = vacationPlans.find(p => p.employeeId === emp.id && p.year === selectedYear);
      if (plan && plan.month && meses.includes(plan.month)) {
        planningByMonth[plan.month]++;
      }
    });

    const vacationPlannedCount = vacationPlans.filter(p => 
      p.year === selectedYear && 
      p.month && 
      meses.includes(p.month) &&
      filteredEmployees.some(emp => emp.id === p.employeeId)
    ).length;

    return {
      total,
      avgAge: Math.round((ageSum / total) * 10) / 10,
      avgSeniority: Math.round((senioritySum / total) * 10) / 10,
      sptPercentage: Math.round((sptCount / total) * 100),
      uniformReplenishNeeded: uniformIncompleteCount,
      vacationPlanningRate: Math.round((vacationPlannedCount / total) * 100),
      malePercentage: Math.round((maleCount / total) * 100),
      femalePercentage: Math.round((femaleCount / total) * 100),
      uniformShirtStats,
      uniformPantsStats,
      uniformSptStats,
      specialtyStats,
      companyStats,
      coordinationStats,
      planningByMonth,
      autorizadoDirigirCount
    };
  }, [filteredEmployees, selectedYear, vacationPlans]);

  const filteredModalEmployees = useMemo(() => {
    if (!selectedSpecialtyForModal) return [];
    let list = filteredEmployees.filter(emp => emp.especialidade === selectedSpecialtyForModal);
    if (specialtySearchQuery.trim()) {
      const q = specialtySearchQuery.toLowerCase().trim();
      list = list.filter(emp => 
        emp.nome.toLowerCase().includes(q) || 
        emp.matricula.toLowerCase().includes(q) || 
        emp.lotacao.toLowerCase().includes(q) ||
        emp.empresa.toLowerCase().includes(q)
      );
    }
    return list;
  }, [filteredEmployees, selectedSpecialtyForModal, specialtySearchQuery]);

  const filteredDriversModalEmployees = useMemo(() => {
    if (!isDriversModalOpen) return [];
    let list = filteredEmployees.filter(emp => emp.autorizadoDirigir);
    if (driversSearchQuery.trim()) {
      const q = driversSearchQuery.toLowerCase().trim();
      list = list.filter(emp => 
        emp.nome.toLowerCase().includes(q) || 
        emp.matricula.toLowerCase().includes(q) || 
        emp.lotacao.toLowerCase().includes(q) ||
        emp.empresa.toLowerCase().includes(q) ||
        (emp.especialidade && emp.especialidade.toLowerCase().includes(q))
      );
    }
    return list;
  }, [filteredEmployees, isDriversModalOpen, driversSearchQuery]);

  const filteredGenderModalEmployees = useMemo(() => {
    if (!isGenderModalOpen) return [];
    let list = filteredEmployees;
    if (selectedGenderType !== 'all') {
      const isFemale = selectedGenderType === 'Feminino';
      list = list.filter(emp => {
        const firstLetter = emp.sexo?.toLowerCase().trim().slice(0, 1) || '';
        return isFemale ? firstLetter === 'f' : firstLetter !== 'f';
      });
    }
    if (genderSearchQuery.trim()) {
      const q = genderSearchQuery.toLowerCase().trim();
      list = list.filter(emp => 
        emp.nome.toLowerCase().includes(q) || 
        emp.matricula.toLowerCase().includes(q) || 
        emp.lotacao.toLowerCase().includes(q) ||
        emp.empresa.toLowerCase().includes(q) ||
        (emp.especialidade && emp.especialidade.toLowerCase().includes(q))
      );
    }
    return list;
  }, [filteredEmployees, isGenderModalOpen, selectedGenderType, genderSearchQuery]);

  const filteredCoordModalEmployees = useMemo(() => {
    if (!isCoordModalOpen || !selectedCoordForModal) return [];
    let list = filteredEmployees.filter(emp => emp.coordenacao?.toUpperCase() === selectedCoordForModal.toUpperCase());
    if (coordSearchQuery.trim()) {
      const q = coordSearchQuery.toLowerCase().trim();
      list = list.filter(emp => 
        emp.nome.toLowerCase().includes(q) || 
        emp.matricula.toLowerCase().includes(q) || 
        emp.lotacao.toLowerCase().includes(q) ||
        emp.empresa.toLowerCase().includes(q) ||
        (emp.especialidade && emp.especialidade.toLowerCase().includes(q))
      );
    }
    return list;
  }, [filteredEmployees, isCoordModalOpen, selectedCoordForModal, coordSearchQuery]);

  const filteredEpiModalEmployees = useMemo(() => {
    if (!isEpiModalOpen) return [];
    let list = filteredEmployees;
    if (epiModalFilterType === 'shirt') {
      list = list.filter(emp => emp.camisa?.toUpperCase() === epiModalFilterValue.toUpperCase());
    } else if (epiModalFilterType === 'pants') {
      list = list.filter(emp => emp.calca === epiModalFilterValue);
    } else if (epiModalFilterType === 'spt') {
      list = list.filter(emp => String(emp.spt) === epiModalFilterValue);
    } else if (epiModalFilterType === 'empty') {
      list = list.filter(emp => !emp.camisa || !emp.calca || !emp.spt || emp.spt === 'Não' || emp.spt === '');
    }
    
    if (epiSearchQuery.trim()) {
      const q = epiSearchQuery.toLowerCase().trim();
      list = list.filter(emp => 
        emp.nome.toLowerCase().includes(q) || 
        emp.matricula.toLowerCase().includes(q) || 
        emp.lotacao.toLowerCase().includes(q) ||
        emp.empresa.toLowerCase().includes(q) ||
        (emp.especialidade && emp.especialidade.toLowerCase().includes(q))
      );
    }
    return list;
  }, [filteredEmployees, isEpiModalOpen, epiModalFilterType, epiModalFilterValue, epiSearchQuery]);

  const filteredMonthScaleEmployees = useMemo(() => {
    if (!isMonthScaleModalOpen || !selectedMonthForModal) return [];
    let list = filteredEmployees.filter(emp => {
      const plan = vacationPlans.find(p => p.employeeId === emp.id && p.year === selectedYear);
      return plan && plan.month === selectedMonthForModal;
    });

    if (scaleSearchQuery.trim()) {
      const q = scaleSearchQuery.toLowerCase().trim();
      list = list.filter(emp => 
        emp.nome.toLowerCase().includes(q) || 
        emp.matricula.toLowerCase().includes(q) || 
        emp.lotacao.toLowerCase().includes(q) ||
        emp.empresa.toLowerCase().includes(q) ||
        (emp.especialidade && emp.especialidade.toLowerCase().includes(q))
      );
    }
    return list;
  }, [filteredEmployees, isMonthScaleModalOpen, selectedMonthForModal, scaleSearchQuery, vacationPlans, selectedYear]);

  const { maleCount, femaleCount } = useMemo(() => {
    let m = 0;
    let f = 0;
    filteredEmployees.forEach(emp => {
      const firstLetter = emp.sexo?.toLowerCase().trim().slice(0, 1) || '';
      if (firstLetter === 'f') {
        f++;
      } else {
        m++;
      }
    });
    return { maleCount: m, femaleCount: f };
  }, [filteredEmployees]);

  // Find peak and low vacation months
  const vacationMetrics = useMemo(() => {
    let maxMonth = 'Nenhum';
    let maxVal = -1;
    let minMonth = 'Nenhum';
    let minVal = Infinity;

    meses.forEach(m => {
      const count = stats.planningByMonth[m] || 0;
      if (count > maxVal) {
        maxVal = count;
        maxMonth = m;
      }
      if (count > 0 && count < minVal) {
        minVal = count;
        minMonth = m;
      }
    });

    if (maxVal <= 0) maxMonth = 'Nenhum';
    if (minVal === Infinity) {
      minMonth = 'Nenhum';
      minVal = 0;
    }

    return { maxMonth, maxVal, minMonth, minVal };
  }, [stats.planningByMonth]);

  // Helper arrays for sizes lists so that we can render consistent distribution stats
  const shirtSizesList = ['P', 'M', 'G', 'GG', 'XG'];
  const pantsSizesList = ['36', '38', '40', '42', '44', '46', '48'];
  const sptSizesList = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];

  return (
    <div className="space-y-6">
      
      {/* 1. Filtering & Year Select Menu */}
      <div className="sit-panel p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="typ-subtitle text-brand-muted tracking-wider uppercase text-[10px]">Portal de Inteligência</span>
          <h2 className="typ-hero mt-1 text-white">Console Geral de Relatórios</h2>
          <p className="typ-card-desc mt-0.5">Indicadores estruturados, análises de especialidades e passivos de férias.</p>
        </div>

        {/* Global report selectors */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
          {/* Year select */}
          <div className="flex flex-col gap-0.5 grow sm:grow-0">
            <span className="text-[10px] uppercase font-bold text-brand-muted font-sans">Ano</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="sit-input py-2 px-3 rounded-lg text-xs font-semibold cursor-pointer text-white bg-black/35 border-white/5 w-full sm:w-auto"
            >
              <option value="2025" className="bg-[#082142]">2025</option>
              <option value="2026" className="bg-[#082142]">2026</option>
              <option value="2027" className="bg-[#082142]">2027</option>
              <option value="2028" className="bg-[#082142]">2028</option>
              <option value="2029" className="bg-[#082142]">2029</option>
              <option value="2030" className="bg-[#082142]">2030</option>
            </select>
          </div>

          {/* Company Filter */}
          <div className="flex flex-col gap-0.5 grow sm:grow-0">
            <span className="text-[10px] uppercase font-bold text-brand-muted font-sans">Empresa</span>
            <select
              value={selectedCompanyFilter}
              onChange={(e) => setSelectedCompanyFilter(e.target.value)}
              className="sit-input py-2 px-3 rounded-lg text-xs font-semibold cursor-pointer text-white bg-black/35 border-white/5 w-full sm:min-w-[130px] sm:max-w-[170px] truncate"
            >
              <option value="" className="bg-[#082142]">Todas Empresas</option>
              {availableCompanies.map(comp => (
                <option key={comp} value={comp} className="bg-[#082142]">{comp}</option>
              ))}
            </select>
          </div>

          {/* Coordination Filter */}
          <div className="flex flex-col gap-0.5 grow sm:grow-0">
            <span className="text-[10px] uppercase font-bold text-brand-muted font-sans">Coordenação</span>
            <select
              value={selectedCoordFilter}
              onChange={(e) => setSelectedCoordFilter(e.target.value)}
              className="sit-input py-2 px-3 rounded-lg text-xs font-semibold cursor-pointer text-white bg-black/35 border-white/5 w-full sm:min-w-[130px] sm:max-w-[170px] truncate"
            >
              <option value="" className="bg-[#082142]">Todas Coords</option>
              {availableCoords.map(coord => (
                <option key={coord} value={coord} className="bg-[#082142]">{coord}</option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          {(selectedCompanyFilter || selectedCoordFilter) && (
            <button
              onClick={() => {
                setSelectedCompanyFilter('');
                setSelectedCoordFilter('');
              }}
              className="mt-1 sm:mt-4 p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-lg border border-rose-500/20 text-xs transition-colors shrink-0 flex items-center justify-center gap-2 h-9 sm:h-[34px] w-full sm:w-auto"
              title="Limpar filtros"
            >
              <X className="w-3.5 h-3.5" />
              <span className="sm:hidden font-black uppercase text-[10px] tracking-wider">Limpar Filtros</span>
            </button>
          )}

          {/* Export menu */}
          <div className="relative w-full sm:w-auto sm:mt-4" data-export-menu>
            <button
              onClick={() => setExportMenuOpen(o => !o)}
              className="p-2 bg-brand-accent/10 hover:bg-brand-accent/20 text-brand-accent rounded-lg border border-brand-accent/20 text-xs transition-colors shrink-0 flex items-center justify-center gap-2 h-9 sm:h-[34px] w-full sm:w-auto px-3 font-black uppercase tracking-wider"
              title="Exportar dados"
              aria-haspopup="menu"
              aria-expanded={exportMenuOpen}
            >
              <Download className="w-3.5 h-3.5" />
              <span className="text-[10px]">Exportar</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${exportMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {exportMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 z-30 w-56 rounded-xl border border-white/10 bg-[#0a1d3a] shadow-2xl overflow-hidden animate-fade-in"
              >
                <button
                  role="menuitem"
                  onClick={() => {
                    setExportMenuOpen(false);
                    exportReportToPDF({
                      selectedYear, selectedCompanyFilter, selectedCoordFilter,
                      filteredEmployees, vacationPlans, stats
                    });
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-white hover:bg-brand-accent/10 transition-colors text-left"
                >
                  <FileText className="w-4 h-4 text-rose-400 shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-bold">Exportar PDF</span>
                    <span className="text-[10px] text-brand-muted">Documento para impressão</span>
                  </div>
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    setExportMenuOpen(false);
                    exportReportToXLSX({
                      selectedYear, selectedCompanyFilter, selectedCoordFilter,
                      filteredEmployees, vacationPlans, stats
                    });
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-white hover:bg-brand-accent/10 transition-colors text-left border-t border-white/5"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-bold">Exportar XLSX</span>
                    <span className="text-[10px] text-brand-muted">Microsoft Excel</span>
                  </div>
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    setExportMenuOpen(false);
                    exportReportToODS({
                      selectedYear, selectedCompanyFilter, selectedCoordFilter,
                      filteredEmployees, vacationPlans, stats
                    });
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-white hover:bg-brand-accent/10 transition-colors text-left border-t border-white/5"
                >
                  <FileSpreadsheet className="w-4 h-4 text-sky-400 shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-bold">Exportar ODS</span>
                    <span className="text-[10px] text-brand-muted">LibreOffice / OpenDocument</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Primary Navigation Subtabs */}
      <div className="flex border-b border-white/10 shrink-0 overflow-x-auto whitespace-nowrap scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => setActiveSubTab('dashboard')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-6 py-2.5 sm:py-3 border-b-2 font-bold text-[10px] sm:text-xs uppercase tracking-wider sm:tracking-widest transition-all min-w-0 ${
            activeSubTab === 'dashboard' 
              ? 'border-brand-accent text-white bg-white/5' 
              : 'border-transparent text-brand-muted hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-brand-accent shrink-0" />
          <span className="truncate">Dashboard</span>
        </button>
        <button
          onClick={() => setActiveSubTab('ferias')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-6 py-2.5 sm:py-3 border-b-2 font-bold text-[10px] sm:text-xs uppercase tracking-wider sm:tracking-widest transition-all min-w-0 ${
            activeSubTab === 'ferias' 
              ? 'border-brand-accent text-white bg-white/5' 
              : 'border-transparent text-brand-muted hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4 text-brand-accent shrink-0" />
          <span className="truncate sm:hidden">Férias ({selectedYear})</span>
          <span className="truncate hidden sm:inline">Planejamento de Férias ({selectedYear})</span>
        </button>

      </div>

      {/* 3. Skeleton Loading Frame OR Content */}
      {isLoading ? (
        <div className="space-y-6 animate-pulse">
          {/* Skeleton KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-black/10 border border-white/5 rounded-xl h-24 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-3 w-2/3 bg-white/10 rounded"></div>
                  <div className="h-7 w-7 rounded-full bg-white/10"></div>
                </div>
                <div className="h-6 w-1/3 bg-white/20 rounded"></div>
              </div>
            ))}
          </div>

          {/* Skeleton Body grids */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-black/10 border border-white/5 rounded-2xl h-[350px]"></div>
            <div className="bg-black/10 border border-white/5 rounded-2xl h-[350px]"></div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Active stats display dashboard view */}
          {activeSubTab === 'dashboard' && (
            <div className="space-y-6 animate-scale-up">
              
              {/* Stat Board Indicators */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* 1. Active effective selection */}
                <div className="sit-panel p-3 sm:p-5 flex items-center justify-between hover:border-white/10 transition-colors min-w-0" id="reports-card-efetivo">
                  <div className="min-w-0 flex-1">
                    <span className="typ-subtitle text-brand-muted truncate block text-[10px] sm:text-xs">Funcionários</span>
                    <h3 className="text-base sm:text-2xl lg:text-3xl font-black text-white mt-0.5 sm:mt-1 truncate">{stats.total} <span className="text-[10px] sm:text-sm font-medium text-brand-muted">colaboradores</span></h3>
                    <p className="text-[9px] sm:text-[10px] text-brand-accent mt-1 flex items-center gap-1 truncate">
                      <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-brand-accent shrink-0" />
                      <span className="truncate">{Math.round((stats.total / (employees.length || 1)) * 100)}%</span>
                    </p>
                  </div>
                  <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full sit-panel-inner flex items-center justify-center text-brand-accent shrink-0 ml-2 hidden xs:flex">
                    <Users2 className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                </div>

                {/* 2. Vacation Cover */}
                <div className="sit-panel p-3 sm:p-5 flex items-center justify-between hover:border-white/10 transition-colors min-w-0" id="reports-card-ferias">
                  <div className="min-w-0 flex-1">
                    <span className="typ-subtitle text-brand-muted truncate block text-[10px] sm:text-xs">Agendamento de Férias</span>
                    {stats.total > 0 ? (
                      <h3 className="text-base sm:text-2xl lg:text-3xl font-black text-white mt-0.5 sm:mt-1 truncate">{stats.vacationPlanningRate}% <span className="text-[9px] sm:text-xs font-semibold text-emerald-400">prog.</span></h3>
                    ) : (
                      <h3 className="text-base sm:text-2xl lg:text-3xl font-black text-white mt-0.5 sm:mt-1 truncate">0%</h3>
                    )}
                    <div className="w-full bg-white/5 rounded-full h-1 mt-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          stats.vacationPlanningRate >= 80 ? 'bg-emerald-500' : stats.vacationPlanningRate >= 40 ? 'bg-amber-400' : 'bg-rose-500'
                        }`}
                        style={{ width: `${stats.vacationPlanningRate || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full sit-panel-inner flex items-center justify-center text-brand-accent shrink-0 ml-2 hidden xs:flex">
                    <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                </div>

                {/* 5. Condition / Driving Authorizations */}
                <div className="sit-panel p-3 sm:p-5 flex items-center justify-between hover:border-white/10 transition-colors min-w-0" id="reports-card-condutores">
                  <div className="min-w-0 flex-1">
                    <span className="typ-subtitle text-brand-muted truncate block text-[10px] sm:text-xs">Motoristas</span>
                    <h3 className="text-base sm:text-2xl lg:text-3xl font-black text-white mt-0.5 sm:mt-1 truncate">{stats.autorizadoDirigirCount} <span className="text-[10px] sm:text-[11px] font-medium text-brand-muted">Credenciados</span></h3>
                    <p className="text-[9px] sm:text-[10px] text-emerald-400 mt-1 flex items-center gap-1 truncate">
                      <Car className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-400 shrink-0" />
                      <span className="truncate">{stats.total > 0 ? Math.round((stats.autorizadoDirigirCount / stats.total) * 100) : 0}% do efetivo</span>
                    </p>
                  </div>
                  <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full sit-panel-inner flex items-center justify-center text-emerald-400 shrink-0 ml-2 hidden xs:flex">
                    <Car className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                </div>

                {/* 6. Specialty Stats */}
                <div className="sit-panel p-3 sm:p-5 flex items-center justify-between hover:border-white/10 transition-colors min-w-0" id="reports-card-especialidades">
                  <div className="min-w-0 flex-1">
                    <span className="typ-subtitle text-brand-muted truncate block text-[10px] sm:text-xs">Especialidades Distintas</span>
                    <h3 className="text-base sm:text-2xl lg:text-3xl font-black text-white mt-0.5 sm:mt-1 truncate">
                      {Object.keys(stats.specialtyStats || {}).length} <span className="text-[10px] sm:text-[11px] font-medium text-brand-muted">Atendimento</span>
                    </h3>
                    <p className="text-[9px] sm:text-[10px] text-brand-accent mt-1 flex items-center gap-1 truncate">
                      <Briefcase className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-brand-accent shrink-0" />
                      <span className="truncate">Áreas catalogadas</span>
                    </p>
                  </div>
                  <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full sit-panel-inner flex items-center justify-center text-brand-accent shrink-0 ml-2 hidden xs:flex">
                    <Briefcase className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                </div>
              </div>

              {/* Data breakdowns tables and custom charts */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
                
                {/* Horizontal progress representation of coordinations - Interactive and Premium */}
                <div className="lg:col-span-12 xl:col-span-8 sit-panel p-4 sm:p-6 flex flex-col justify-between gap-4 sm:gap-5 hover:border-white/20 transition-all duration-300 relative overflow-hidden group/coordCard">
                  {/* Premium Glowing Top Accent */}
                  <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#38BDF8]/40 to-transparent"></div>
                  
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <Activity className="w-4 h-4 text-brand-accent shrink-0" />
                        <span>Alocação Relativa por Coordenação</span>
                      </h3>
                      <p className="typ-card-desc mt-1">Todos os colaboradores terceirizados ativos, divididos por coordenações. Clique em uma para verificar.</p>
                    </div>
                    
                    {/* Active dynamic count badge */}
                    {Object.keys(stats.coordinationStats).length > 0 && (
                      <span className="bg-brand-accent/10 text-brand-accent text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-brand-accent/20 font-mono shadow-sm shrink-0">
                        {Object.keys(stats.coordinationStats).length} Coord.
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-2">
                    {Object.keys(stats.coordinationStats).length === 0 ? (
                      <div className="text-center py-10 text-brand-muted text-xs col-span-2">Sem dados correspondentes.</div>
                    ) : (
                      (Object.entries(stats.coordinationStats) as [string, number][])
                        .sort((a,b) => b[1] - a[1])
                        .map(([name, count], index) => {
                          const percentage = Math.round((count / stats.total) * 100);
                          const matchCoord = coordenacoes.find(c => c.nome.toUpperCase() === name.toUpperCase());
                          const hasCoordinator = !!matchCoord?.coordenador;
                          
                          // Dynamic stunning gradient choices based on scale/index
                          let gradientBar = 'from-[#00A3FF] to-[#38BDF8]';
                          if (index === 1) gradientBar = 'from-[#10B981] to-[#34D399]';
                          else if (index === 2) gradientBar = 'from-[#8B5CF6] to-[#A78BFA]';
                          else if (index === 3) gradientBar = 'from-[#F59E0B] to-[#FBBF24]';
                          else if (index > 3) gradientBar = 'from-[#EC4899] to-[#F472B6]';

                          return (
                            <div 
                              key={name}
                              onClick={() => {
                                setSelectedCoordForModal(name);
                                setIsCoordModalOpen(true);
                              }}
                              className="p-3.5 sm:p-4 rounded-xl border border-white/5 bg-[#081b33]/20 hover:bg-brand-accent/5 hover:border-brand-accent/25 transition-all duration-200 cursor-pointer group/row flex flex-col justify-between gap-3 relative overflow-hidden shadow-sm"
                              title={`Clique para detalhar o efetivo de: ${name}`}
                            >
                              {/* Horizontal shine layer */}
                              <div className="absolute inset-0 bg-gradient-to-r from-brand-accent/0 via-brand-accent/[0.02] to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity duration-300"></div>

                              <div className="flex items-start justify-between gap-2 relative z-10">
                                <div className="min-w-0 flex-1">
                                  <span className="font-extrabold text-white text-xs sm:text-[13px] tracking-wide block truncate group-hover/row:text-brand-accent transition-colors" title={name}>
                                    {name}
                                  </span>
                                  
                                  {hasCoordinator ? (
                                    <span className="text-[10px] text-brand-muted/70 mt-1 flex items-center gap-1 font-medium leading-none">
                                      <UserRound className="w-3 h-3 text-brand-accent/50 shrink-0" />
                                      <span className="truncate">Coord.: <strong className="text-slate-300 font-semibold">{matchCoord.coordenador}</strong></span>
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-brand-muted/40 mt-1 block italic">Coordenador não informado</span>
                                  )}
                                </div>

                                <div className="text-right shrink-0 flex items-center gap-1">
                                  <div className="flex flex-col items-end">
                                    <span className="text-[11px] sm:text-xs font-bold font-mono text-brand-accent">
                                      {count} <span className="text-brand-muted/60 font-medium text-[9px] sm:text-[10px]">colab.</span>
                                    </span>
                                    <span className="text-[9px] font-black font-mono text-brand-muted mt-0.5">
                                      {percentage}% do total
                                    </span>
                                  </div>
                                  <ArrowUpRight className="w-3.5 h-3.5 text-brand-muted opacity-0 group-hover/row:opacity-100 group-hover/row:translate-x-0.5 group-hover/row:-translate-y-0.5 transition-all duration-200 shrink-0 ml-1" />
                                </div>
                              </div>

                              <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden relative z-10 border border-white/5 p-[0.5px]">
                                <div 
                                  className={`h-full bg-gradient-to-r ${gradientBar} rounded-full transition-all duration-500 relative`}
                                  style={{ width: `${percentage}%` }}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 opacity-30"></div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>

                {/* Gender and demographic distribution card / Drivers card column */}
                <div className="lg:col-span-12 xl:col-span-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-4 sm:gap-6">
                  {/* Gender and demographic panel */}
                  <div 
                    onClick={() => {
                      setSelectedGenderType('all');
                      setIsGenderModalOpen(true);
                    }}
                    className="sit-panel p-4 sm:p-6 flex flex-col justify-between gap-3 sm:gap-5 hover:border-white/20 transition-all duration-300 relative overflow-hidden group/gender cursor-pointer"
                    title="Clique para auditar detalhamento por gênero"
                    id="reports-card-gender-distribution"
                  >
                    {/* Glowing background subtle hint */}
                    <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-brand-accent/5 rounded-full blur-xl group-hover/gender:bg-brand-accent/10 transition-colors duration-300"></div>

                    <div className="relative z-10 flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                          <Users className="w-4 h-4 text-brand-accent shrink-0 group-hover/gender:scale-110 transition-transform duration-300" />
                          <span>Equidade e Força de Trabalho</span>
                        </h4>
                        <p className="typ-card-desc mt-1">Análise da distribuição demográfica de gênero do efetivo ativo.</p>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-brand-muted group-hover/gender:text-brand-accent group-hover/gender:translate-x-0.5 group-hover/gender:-translate-y-0.5 transition-all shrink-0" />
                    </div>

                    {/* Split details layout */}
                    <div className="grid grid-cols-2 gap-3 relative z-10 my-1">
                      {/* Masculino sub-panel */}
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedGenderType('Masculino');
                          setIsGenderModalOpen(true);
                        }}
                        className="bg-brand-panel-light/30 hover:bg-brand-panel-light/60 border border-white/5 hover:border-brand-accent/30 rounded-xl p-3 text-center transition-all duration-200 group/masc"
                        title="Ver apenas colaboradores do sexo masculino"
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-accent"></span>
                          <span className="text-[10px] font-bold uppercase text-brand-muted tracking-wide block">Masculino</span>
                        </div>
                        <span className="text-xl sm:text-2xl font-black text-brand-accent block mt-1 font-mono tracking-tight">
                          {stats.malePercentage}%
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium mt-0.5 block">
                          {maleCount} {maleCount === 1 ? 'colaborador' : 'colaboradores'}
                        </span>
                      </div>

                      {/* Feminino sub-panel */}
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedGenderType('Feminino');
                          setIsGenderModalOpen(true);
                        }}
                        className="bg-brand-panel-light/30 hover:bg-brand-panel-light/60 border border-white/5 hover:border-emerald-500/30 rounded-xl p-3 text-center transition-all duration-200 group/fem"
                        title="Ver apenas colaboradoras do sexo feminino"
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span className="text-[10px] font-bold uppercase text-brand-muted tracking-wide block">Feminino</span>
                        </div>
                        <span className="text-xl sm:text-2xl font-black text-emerald-400 block mt-1 font-mono tracking-tight">
                          {stats.femalePercentage}%
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium mt-0.5 block">
                          {femaleCount} {femaleCount === 1 ? 'colaboradora' : 'colaboradoras'}
                        </span>
                      </div>
                    </div>

                    <div className="relative z-10 w-full">
                      {/* Premium visual distribution progress bar with custom hover overlays */}
                      <div className="w-full h-3 rounded-lg bg-emerald-500 overflow-hidden flex shadow-inner group/progressBar border border-white/5">
                        <div 
                          className="h-full bg-brand-accent transition-all duration-500 relative group-hover/progressBar:opacity-90 hover:!opacity-100" 
                          style={{ width: `${stats.malePercentage}%` }} 
                          title={`Masculino: ${stats.malePercentage}% (${maleCount} colaboradores)`}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10 opacity-50"></div>
                        </div>
                        <div 
                          className="h-full bg-emerald-400 transition-all duration-500 relative group-hover/progressBar:opacity-90 hover:!opacity-100 flex-1" 
                          title={`Feminino: ${stats.femalePercentage}% (${femaleCount} colaboradoras)`}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10 opacity-50"></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-[9px] text-brand-muted mt-2 uppercase font-extrabold tracking-widest px-0.5">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-accent"></span>
                          Masc. ({maleCount})
                        </span>
                        <span className="text-brand-muted/40 font-semibold text-[8px] animate-pulse">Clique para verificar</span>
                        <span className="flex items-center gap-1">
                          Fem. ({femaleCount})
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Drivers Controller Card using the car blueprint image - Premium & Highly Interactive */}
                  <div 
                    onClick={() => setIsDriversModalOpen(true)}
                    className="sit-panel p-4 sm:p-6 flex flex-col justify-between gap-3 hover:border-white/20 transition-all duration-300 relative overflow-hidden group/driverCard cursor-pointer" 
                    id="reports-drivers-card"
                    title="Clique para auditar condutores credenciados"
                  >
                    {/* Glowing background subtle hint */}
                    <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover/driverCard:bg-emerald-500/10 transition-colors duration-300"></div>

                    <div className="relative z-10 flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                          <Car className="w-4 h-4 text-emerald-400 shrink-0 group-hover/driverCard:scale-110 transition-transform duration-300" />
                          <span>Motoristas Credenciados</span>
                        </h4>
                        <p className="typ-card-desc mt-1">Colaboradores aptos e autorizados a dirigir veículos operacionais.</p>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-brand-muted group-hover/driverCard:text-emerald-400 group-hover/driverCard:translate-x-0.5 group-hover/driverCard:-translate-y-0.5 transition-all shrink-0" />
                    </div>

                    {/* Split details layout for drivers */}
                    <div className="grid grid-cols-2 gap-3 relative z-10 my-1">
                      {/* Authorized sub-panel */}
                      <div className="bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 hover:border-emerald-500/30 rounded-xl p-3 text-center transition-all duration-200">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span className="text-[10px] font-bold uppercase text-brand-muted tracking-wide block">Autorizados</span>
                        </div>
                        <span className="text-xl sm:text-2xl font-black text-emerald-400 block mt-1 font-mono tracking-tight">
                          {stats.autorizadoDirigirCount}
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium mt-0.5 block">
                          {stats.total > 0 ? Math.round((stats.autorizadoDirigirCount / stats.total) * 100) : 0}% do total
                        </span>
                      </div>

                      {/* Non-drivers sub-panel */}
                      <div className="bg-brand-panel-light/30 hover:bg-brand-panel-light/60 border border-white/5 hover:border-white/10 rounded-xl p-3 text-center transition-all duration-200">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                          <span className="text-[10px] font-bold uppercase text-brand-muted tracking-wide block">Outros</span>
                        </div>
                        <span className="text-xl sm:text-2xl font-black text-slate-300 block mt-1 font-mono tracking-tight">
                          {stats.total - stats.autorizadoDirigirCount}
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium mt-0.5 block">
                          {stats.total > 0 ? 100 - Math.round((stats.autorizadoDirigirCount / stats.total) * 100) : 0}% do total
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between relative z-10 mt-1 gap-4">
                      <div className="min-w-0">
                        <span className="inline-flex items-center gap-1 mt-2 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-[#B4E4FF] bg-brand-accent/15 border border-brand-accent/20 px-2 py-0.5 rounded-full select-none animate-pulse">
                          Clique para detalhar
                        </span>
                      </div>
                      
                      {/* Blueprint Car image layout with futuristic technical back-grid and zoom glow effect */}
                      <div className="w-24 h-16 sm:w-28 sm:h-20 shrink-0 flex items-center justify-center relative select-none rounded-xl border border-white/5 bg-black/30 p-1 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:8px_8px] overflow-hidden group/car">
                        {/* Interactive Blueprint halo */}
                        <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 opacity-50 group-hover/driverCard:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute w-12 h-12 bg-emerald-500/5 rounded-full blur-lg group-hover/driverCard:scale-150 transition-transform duration-300"></div>
                        
                        <img 
                          src={carBlueprintImg} 
                          alt="Layout de veículo Compesa" 
                          className="w-full h-full object-contain filter brightness-110 drop-shadow-[0_0_8px_rgba(52,211,153,0.25)] rounded-lg transition-all duration-300 group-hover/driverCard:scale-[1.12]"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Specialties distribution card */}
                <div className="lg:col-span-12 sit-panel p-4 sm:p-6" id="reports-specialties-distribution">
                  <div className="mb-4 sm:mb-6">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-brand-accent shrink-0" />
                      <span>Distribuição por Especialidades</span>
                    </h3>
                    <p className="typ-card-desc mt-1">Estatísticas detalhadas de alocação por cargo e funções do efetivo.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Object.keys(stats.specialtyStats || {}).length === 0 ? (
                      <div className="col-span-full text-center py-8 text-brand-muted text-xs">Sem dados correspondentes.</div>
                    ) : (
                      (Object.entries(stats.specialtyStats) as [string, number][])
                        .sort((a,b) => b[1] - a[1])
                        .map(([name, count]) => {
                          const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                          return (
                            <div 
                              key={name} 
                              onClick={() => setSelectedSpecialtyForModal(name)}
                              className="bg-black/15 border border-white/5 p-4 rounded-xl flex flex-col justify-between hover:border-brand-accent/40 hover:bg-black/25 hover:shadow-lg hover:shadow-brand-accent/5 cursor-pointer active:scale-[0.98] transition-all duration-200 group"
                              title={`Ver colaboradores de ${name}`}
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2">
                                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-300 line-clamp-2" title={name}>
                                    {name}
                                  </span>
                                  <span className="bg-brand-accent/10 text-brand-accent border border-brand-accent/25 px-2 py-0.5 rounded text-[10px] font-bold font-mono shrink-0">
                                    {count} {count === 1 ? 'colab.' : 'colabs.'}
                                  </span>
                                </div>
                              </div>
                              <div className="mt-4">
                                <div className="flex items-center justify-between text-[10px] mb-1">
                                  <span className="text-brand-muted font-medium">Representatividade</span>
                                  <span className="text-white font-bold font-mono">{percentage}%</span>
                                </div>
                                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                                  <div 
                                    className="h-full bg-brand-accent rounded-full transition-all duration-300 shadow shadow-brand-accent/30"
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>

                {/* Logistics Supply: Uniform demographics */}
                <div className="lg:col-span-12 sit-panel p-5 sm:p-6 shadow-2xl relative overflow-hidden group/epiCard">
                  {/* Embedded high-tech background pattern */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.04),transparent_45%)] pointer-events-none" />
                  
                  <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                          <Shirt className="w-4.5 h-4.5 text-brand-accent shrink-0 group-hover/epiCard:rotate-12 transition-transform duration-300" />
                          <span>Uniformes dos Funcionários</span>
                        </h3>
                      </div>
                      <p className="text-xs text-brand-muted mt-1 max-w-2xl">
                        Relatório de fardamento baseado no dimensionamento ativo da força de trabalho dos colaboradores.
                      </p>
                    </div>
                    {stats.uniformReplenishNeeded > 0 ? (
                      <div 
                        onClick={() => {
                          setEpiModalFilterType('empty');
                          setEpiModalFilterValue('');
                          setIsEpiModalOpen(true);
                        }}
                        className="flex items-center gap-2 cursor-pointer group/warning rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 hover:border-amber-500/45 hover:bg-amber-500/15 hover:shadow-lg hover:shadow-amber-500/5 transition-all text-[11px] font-bold text-amber-300 select-none"
                      >
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 group-hover/warning:scale-110 transition-transform" />
                        <span className="underline decoration-amber-500/40 underline-offset-2">
                          {stats.uniformReplenishNeeded} Cadastros Incompletos
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-[11px] font-bold text-emerald-400 select-none">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Todo o Efetivo Mapeado</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 relative z-10">
                    {/* Sizes Shirt Demands */}
                    <div className="space-y-4 bg-black/10 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black uppercase text-brand-muted tracking-wider flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-accent"></span>
                          Demanda de Camisas
                        </h4>
                      </div>
                      <div 
                        onMouseDown={handleDragScroll}
                        className="flex overflow-x-auto sm:grid sm:grid-cols-5 gap-2 pt-2.5 pb-3 sm:py-2 scrollbar-none cursor-grab active:cursor-grabbing select-none"
                      >
                        {shirtSizesList.map(size => {
                          const qty = stats.uniformShirtStats[size] || 0;
                          const maxQty = Math.max(...shirtSizesList.map(s => stats.uniformShirtStats[s] || 0), 1);
                          const barHeight = Math.max(12, Math.round((qty / maxQty) * 100));
                          const isMax = qty > 0 && qty === Math.max(...shirtSizesList.map(s => stats.uniformShirtStats[s] || 0));
                          
                          return (
                            <div 
                              key={size}
                              onClick={() => {
                                setEpiModalFilterType('shirt');
                                setEpiModalFilterValue(size);
                                setIsEpiModalOpen(true);
                              }}
                              className={`flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-lg border hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer select-none group/item ${
                                qty > 0 
                                  ? isMax 
                                    ? 'bg-brand-accent/10 border-brand-accent/40 hover:bg-brand-accent/15 hover:border-brand-accent/60'
                                    : 'bg-black/25 border-white/10 hover:bg-black/35 hover:border-white/20'
                                  : 'bg-black/10 border-white/5 opacity-50 hover:opacity-80'
                              }`}
                              title={`Filtrar colaboradores tamanho ${size}`}
                            >
                              <div className="flex items-center gap-1">
                                <span className={`text-xs font-black font-sans ${isMax ? 'text-brand-accent' : 'text-slate-300'}`}>{size}</span>
                                {isMax && <span className="text-[8px] text-brand-accent animate-pulse">★</span>}
                              </div>
                              <div className="w-full bg-white/5 h-12 sm:h-16 rounded overflow-hidden flex items-end relative">
                                <div 
                                  className={`w-full transition-all duration-500 rounded-t ${
                                    isMax ? 'bg-gradient-to-t from-brand-accent to-[#B4E4FF]' : 'bg-brand-accent'
                                  }`}
                                  style={{ height: `${barHeight}%` }}
                                ></div>
                              </div>
                              <span className="text-[10px] font-black text-white font-mono mt-1 whitespace-nowrap group-hover/item:text-brand-accent transition-colors">{qty} pçs</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Sizes Pants Demands */}
                    <div className="space-y-4 bg-black/10 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black uppercase text-brand-muted tracking-wider flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
                          Demanda de Calças
                        </h4>
                      </div>
                      <div 
                        onMouseDown={handleDragScroll}
                        className="flex overflow-x-auto sm:grid sm:grid-cols-7 gap-1.5 pt-2.5 pb-3 sm:py-2 scrollbar-none cursor-grab active:cursor-grabbing select-none"
                      >
                        {pantsSizesList.map(size => {
                          const qty = stats.uniformPantsStats[size] || 0;
                          const maxQty = Math.max(...pantsSizesList.map(s => stats.uniformPantsStats[s] || 0), 1);
                          const barHeight = Math.max(12, Math.round((qty / maxQty) * 100));
                          const isMax = qty > 0 && qty === Math.max(...pantsSizesList.map(s => stats.uniformPantsStats[s] || 0));

                          return (
                            <div 
                              key={size}
                              onClick={() => {
                                setEpiModalFilterType('pants');
                                setEpiModalFilterValue(size);
                                setIsEpiModalOpen(true);
                              }}
                              className={`flex flex-col items-center gap-1 py-3 px-1.5 rounded-lg border hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer select-none group/item ${
                                qty > 0 
                                  ? isMax 
                                    ? 'bg-emerald-500/10 border-emerald-500/40 hover:bg-emerald-500/15 hover:border-emerald-500/60'
                                    : 'bg-black/25 border-white/10 hover:bg-black/35 hover:border-white/20'
                                  : 'bg-black/10 border-white/5 opacity-50 hover:opacity-80'
                              }`}
                              title={`Filtrar colaboradores tamanho ${size}`}
                            >
                              <span className={`text-[10px] font-black font-sans ${isMax ? 'text-emerald-400' : 'text-slate-300'}`}>{size}</span>
                              <div className="w-full max-w-[16px] bg-white/5 h-12 sm:h-16 rounded overflow-hidden flex items-end relative">
                                <div 
                                  className={`w-full transition-all duration-500 rounded-t ${
                                    isMax ? 'bg-gradient-to-t from-emerald-500 to-emerald-300' : 'bg-brand-accent/80'
                                  }`}
                                  style={{ height: `${barHeight}%` }}
                                ></div>
                              </div>
                              <span className="text-[10px] font-bold text-white font-mono mt-1 group-hover/item:text-emerald-400 transition-colors">{qty}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Sizes Shoes (SPT) Demands */}
                    <div className="space-y-4 bg-black/10 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black uppercase text-brand-muted tracking-wider flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                          Demanda de Calçados (SPT)
                        </h4>
                      </div>
                      <div 
                        onMouseDown={handleDragScroll}
                        className="flex overflow-x-auto sm:grid sm:grid-cols-10 gap-1 pt-2.5 pb-3 sm:py-2 scrollbar-none cursor-grab active:cursor-grabbing select-none"
                      >
                        {sptSizesList.map(size => {
                          const qty = stats.uniformSptStats[size] || 0;
                          const maxQty = Math.max(...sptSizesList.map(s => stats.uniformSptStats[s] || 0), 1);
                          const barHeight = Math.max(12, Math.round((qty / maxQty) * 100));
                          const isMax = qty > 0 && qty === Math.max(...sptSizesList.map(s => stats.uniformSptStats[s] || 0));

                          return (
                            <div 
                              key={size}
                              onClick={() => {
                                setEpiModalFilterType('spt');
                                setEpiModalFilterValue(size);
                                setIsEpiModalOpen(true);
                              }}
                              className={`flex flex-col items-center gap-1 py-3 px-1 rounded-lg border hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer select-none group/item ${
                                qty > 0 
                                  ? isMax 
                                    ? 'bg-cyan-500/15 border-cyan-500/40 hover:bg-cyan-500/20 hover:border-cyan-500/60'
                                    : 'bg-black/25 border-white/10 hover:bg-black/35 hover:border-white/20'
                                  : 'bg-black/10 border-white/5 opacity-50 hover:opacity-80'
                              }`}
                              title={`Filtrar colaboradores calçado ${size}`}
                            >
                              <span className={`text-[9px] font-black font-sans ${isMax ? 'text-cyan-400' : 'text-slate-300'}`}>{size}</span>
                              <div className="w-full max-w-[12px] bg-white/5 h-12 sm:h-16 rounded overflow-hidden flex items-end relative">
                                <div 
                                  className={`w-full transition-all duration-500 rounded-t ${
                                    isMax ? 'bg-gradient-to-t from-cyan-500 via-cyan-400 to-cyan-300' : 'bg-emerald-500/80'
                                  }`}
                                  style={{ height: `${barHeight}%` }}
                                ></div>
                              </div>
                              <span className="text-[9px] font-black text-white font-mono mt-1 group-hover/item:text-cyan-400 transition-colors">{qty}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Aesthetic Call to Action Footer inside Card */}
                  <div className="mt-4 pt-3 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2.5 relative z-10 text-[10px] text-brand-muted font-medium">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-ping" />
                      Clique em qualquer tamanho ou elemento para abrir a auditoria nominal.
                    </span>
                    <button 
                      onClick={() => {
                        setEpiModalFilterType('all');
                        setEpiModalFilterValue('');
                        setIsEpiModalOpen(true);
                      }}
                      className="text-[10px] font-extrabold uppercase tracking-widest text-[#B4E4FF] hover:text-white bg-[#0c2e56]/40 hover:bg-[#0c2e56]/70 border border-[#B4E4FF]/20 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer"
                    >
                      Ver Painel Consolidado
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* Vacation scale panel view */}
          {activeSubTab === 'ferias' && (
            <div className="space-y-6 animate-scale-up">
              
              {/* Vacation scale score boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="sit-panel p-4 sm:p-5">
                  <span className="typ-subtitle text-brand-muted block text-[10px] sm:text-xs">Mês de Pico de Férias ({selectedYear})</span>
                  <p className="text-lg sm:text-xl font-bold text-orange-400 mt-1.5 flex items-center justify-between gap-2 min-w-0">
                    <span className="truncate uppercase font-black">{vacationMetrics.maxMonth}</span>
                    <span className="font-mono bg-orange-500/10 text-orange-300 px-2 py-0.5 rounded text-xs shrink-0">{vacationMetrics.maxVal} colab.</span>
                  </p>
                  <p className="text-[10px] text-brand-muted mt-2">Maior escolha por parte dos funcionários.</p>
                </div>
                
                <div className="sit-panel p-4 sm:p-5 border-emerald-500/10">
                  <span className="typ-subtitle text-brand-muted block text-[10px] sm:text-xs">Mês com menos ocorrências ({selectedYear})</span>
                  <p className="text-lg sm:text-xl font-bold text-emerald-400 mt-1.5 flex items-center justify-between gap-2 min-w-0">
                    <span className="truncate uppercase font-black">{vacationMetrics.minMonth}</span>
                    <span className="font-mono bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded text-xs shrink-0">{vacationMetrics.minVal} colab.</span>
                  </p>
                  <p className="text-[10px] text-brand-muted mt-2">Menor escolha por parte dos funcionários.</p>
                </div>

                <div className="sit-panel p-4 sm:p-5 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <span className="typ-subtitle text-brand-muted block text-[10px] sm:text-xs">Agendamentos Completados</span>
                    <span className="text-xl sm:text-2xl font-black mt-1.5 block text-white font-mono">{stats.vacationPlanningRate}%</span>
                    <span className="text-[10px] text-brand-muted mt-1 block">Percentual de agendamentos concluídos.</span>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full sit-panel-inner flex items-center justify-center text-brand-accent shrink-0 hidden xs:flex">
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Monthly load detailed list and chart */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Visual Vertical columns of months scale */}
                <div className="lg:col-span-12 xl:col-span-12 sit-panel p-5 sm:p-6 shadow-2xl relative overflow-hidden group/scaleCard">
                  {/* Embedded high-tech background pattern */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.04),transparent_45%)] pointer-events-none" />
                  
                  <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse"></span>
                        <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                          <BarChart3 className="w-4.5 h-4.5 text-brand-accent shrink-0 group-hover/scaleCard:translate-y-[-1px] transition-transform duration-300" />
                          <span>Distribuição por mês de férias ({selectedYear})</span>
                        </h3>
                      </div>
                      <p className="text-xs text-brand-muted mt-1 max-w-2xl">
                        Cobertura de escala de equipe baseada no planejamento de férias ativo.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-[11px] font-bold select-none">
                      <div className="flex items-center gap-1.5 rounded-xl border border-orange-500/20 bg-orange-500/5 px-2.5 py-1 text-orange-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                        <span>Pico em: {vacationMetrics.maxMonth}</span>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 text-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>Mínimo: {vacationMetrics.minMonth}</span>
                      </div>
                    </div>
                  </div>

                  <div 
                    onMouseDown={handleDragScroll}
                    className="flex overflow-x-auto lg:grid lg:grid-cols-12 gap-2 sm:gap-3 pt-2.5 pb-3 sm:py-2 scrollbar-none cursor-grab active:cursor-grabbing select-none relative z-10"
                  >
                    {meses.map(month => {
                      const qty = stats.planningByMonth[month] || 0;
                      const maxQty = Math.max(...meses.map(m => stats.planningByMonth[m] || 0), 1);
                      const barHeight = Math.max(8, Math.round((qty / maxQty) * 100));
                      const isMax = qty > 0 && month === vacationMetrics.maxMonth;
                      const isMin = qty > 0 && month === vacationMetrics.minMonth;

                      return (
                        <div 
                          key={month} 
                          onClick={() => {
                            setSelectedMonthForModal(month);
                            setIsMonthScaleModalOpen(true);
                          }}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border hover:scale-[1.04] active:scale-[0.98] transition-all cursor-pointer select-none group/item min-w-[76px] lg:min-w-0 flex-1 ${
                            qty > 0 
                              ? isMax 
                                ? 'bg-orange-500/10 border-orange-500/40 hover:bg-orange-500/15 hover:border-orange-500/60'
                                : isMin
                                  ? 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/15 hover:border-emerald-500/50'
                                  : 'bg-black/25 border-white/10 hover:bg-black/35 hover:border-brand-accent/20'
                              : 'bg-black/10 border-white/5 opacity-50 hover:opacity-80'
                          }`}
                          title={`Clique para auditar escalas de ${month}`}
                        >
                          <div className="flex items-center gap-1">
                            <span className={`text-[10px] font-black font-sans uppercase tracking-wider ${
                              isMax ? 'text-orange-400' : isMin ? 'text-emerald-400' : 'text-slate-300'
                            }`}>
                              {month.slice(0, 3)}
                            </span>
                            {isMax && <span className="text-[8px] text-orange-400 animate-pulse">▲</span>}
                            {isMin && <span className="text-[8px] text-emerald-400">▼</span>}
                          </div>
                          
                          <div className="w-full bg-white/5 h-20 sm:h-24 rounded-lg overflow-hidden flex items-end relative">
                            <div 
                              className={`w-full transition-all duration-500 rounded-t ${
                                isMax 
                                  ? 'bg-gradient-to-t from-orange-600 via-orange-500 to-amber-400' 
                                  : isMin
                                    ? 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                                    : 'bg-gradient-to-t from-brand-accent to-[#B4E4FF]'
                              }`}
                              style={{ height: `${barHeight}%` }}
                            ></div>
                          </div>
                          
                          <span className={`text-[11px] font-black font-mono mt-0.5 group-hover/item:text-brand-accent transition-colors ${
                            isMax ? 'text-orange-400' : isMin ? 'text-emerald-400' : 'text-white'
                          }`}>
                            {qty} {qty === 1 ? 'func' : 'funcs'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Aesthetic Call to Action Footer inside Card */}
                  <div className="mt-4 pt-3 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2.5 relative z-10 text-[10px] text-brand-muted font-medium">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-ping" />
                      Clique em qualquer mês para abrir a auditoria e férias nominal da equipe.
                    </span>
                  </div>
                </div>

                {/* Sub audit list: employees planned vs unplanned */}
                <div className="lg:col-span-12 sit-panel p-5 sm:p-6 shadow-2xl relative overflow-hidden group/statusCard animate-fade-in">
                  {/* Embedded background gradient */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.04),transparent_45%)] pointer-events-none" />
                  
                  <div className="mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 relative z-10">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                        <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                          <Users className="w-4.5 h-4.5 text-brand-accent shrink-0 group-hover/statusCard:rotate-6 transition-transform duration-300" />
                          <span>Status de Programação por Colaborador</span>
                        </h3>
                      </div>
                      <p className="text-xs text-brand-muted mt-1 max-w-2xl">
                        Visão nominal e monitoramento individual de férias confirmadas versus pendentes para o ano de {selectedYear}.
                      </p>
                    </div>

                    {/* Active Filters Panel inside CardHeader */}
                    <div className="flex flex-col sm:flex-row xl:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto flex-wrap">
                      {/* Quick search sub-filter */}
                      <div className="flex items-center gap-2 bg-black/45 border border-white/10 rounded-xl px-3 py-1.5 focus-within:border-brand-accent/40 focus-within:bg-black/60 transition-all text-xs">
                        <Search className="w-3.5 h-3.5 text-brand-muted shrink-0" />
                        <input 
                          type="text"
                          placeholder="Pesquisar nesta tabela..."
                          value={statusTableSearch}
                          onChange={(e) => setStatusTableSearch(e.target.value)}
                          className="bg-transparent border-none outline-none text-white text-xs placeholder:text-brand-muted/50 w-full sm:w-44"
                        />
                        {statusTableSearch && (
                          <button 
                            onClick={() => setStatusTableSearch('')} 
                            className="text-[10px] text-brand-muted hover:text-white uppercase font-mono font-bold"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Filter by Month Select */}
                      <div className="flex items-center gap-1.5 bg-black/45 border border-white/10 rounded-xl px-3 py-1.5 text-xs hover:border-brand-accent/30 transition-all">
                        <Calendar className="w-3.5 h-3.5 text-brand-muted shrink-0" />
                        <span className="text-brand-muted font-bold text-[10px] uppercase mr-0.5 sm:hidden xl:inline">Mês:</span>
                        <select
                          value={statusTableMonthFilter}
                          onChange={(e) => setStatusTableMonthFilter(e.target.value)}
                          className="bg-transparent border-none outline-none text-white text-xs cursor-pointer focus:ring-0 pr-6"
                          style={{ colorScheme: 'dark' }}
                        >
                          <option value="all" className="bg-[#0b1329] text-white">Todos os Meses</option>
                          {meses.map(m => (
                            <option key={m} value={m} className="bg-[#0b1329] text-white">{m}</option>
                          ))}
                        </select>
                      </div>

                      {/* Filter status tabs */}
                      <div className="flex items-center bg-black/45 p-1 rounded-xl border border-white/5 self-start shrink-0">
                        <button 
                          onClick={() => setStatusTableFilter('all')}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all select-none cursor-pointer ${
                            statusTableFilter === 'all' 
                              ? 'bg-brand-accent text-white font-bold' 
                              : 'text-brand-muted hover:text-slate-300'
                          }`}
                        >
                          Todos ({
                            filteredEmployees.filter(emp => {
                              const plan = vacationPlans.find(p => p.employeeId === emp.id && p.year === selectedYear);
                              return statusTableMonthFilter === 'all' || (plan && plan.month === statusTableMonthFilter);
                            }).length
                          })
                        </button>
                        <button 
                          onClick={() => setStatusTableFilter('confirmed')}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all select-none cursor-pointer ${
                            statusTableFilter === 'confirmed' 
                              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold' 
                              : 'text-brand-muted hover:text-slate-300'
                          }`}
                        >
                          Confirmado ({
                            filteredEmployees.filter(emp => {
                              const plan = vacationPlans.find(p => p.employeeId === emp.id && p.year === selectedYear);
                              const isPlanned = plan && plan.month && meses.includes(plan.month);
                              const matchesMonth = statusTableMonthFilter === 'all' || (plan && plan.month === statusTableMonthFilter);
                              return isPlanned && matchesMonth;
                            }).length
                          })
                        </button>
                        <button 
                          onClick={() => setStatusTableFilter('pending')}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all select-none cursor-pointer ${
                            statusTableFilter === 'pending' 
                              ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20 font-bold' 
                              : 'text-brand-muted hover:text-slate-300'
                          }`}
                        >
                          Pendente ({
                            filteredEmployees.filter(emp => {
                              const plan = vacationPlans.find(p => p.employeeId === emp.id && p.year === selectedYear);
                              const isPlanned = plan && plan.month && meses.includes(plan.month);
                              const matchesMonth = statusTableMonthFilter === 'all' || (plan && plan.month === statusTableMonthFilter);
                              return (!plan || !plan.month || !meses.includes(plan.month)) && matchesMonth;
                            }).length
                          })
                        </button>
                      </div>

                      {/* Quick Clear Filters Button */}
                      {(statusTableSearch || statusTableMonthFilter !== 'all' || statusTableFilter !== 'all') && (
                        <button
                          onClick={() => {
                            setStatusTableSearch('');
                            setStatusTableMonthFilter('all');
                            setStatusTableFilter('all');
                          }}
                          className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 text-rose-300 text-[10px] font-black uppercase tracking-widest transition-all select-none cursor-pointer hover:border-rose-500/50 hover:scale-[1.02] active:scale-[0.98] animate-fade-in shrink-0"
                          title="Limpar todos os filtros ativos"
                        >
                          <FilterX className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>Limpar Filtros</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Desktop and Tablet table */}
                  <div className="hidden sm:block overflow-x-auto relative z-10 bg-black/10 rounded-xl border border-white/5 max-h-[500px] overflow-y-auto custom-scrollbar">
                    <table className="w-full table-auto divide-y divide-white/5">
                      <thead>
                        <tr className="text-left text-[10px] uppercase font-black tracking-widest text-[#B4E4FF] bg-[#082B56] sticky top-0 z-20">
                          <th className="px-5 py-3">Matrícula</th>
                          <th className="px-5 py-3">Colaborador</th>
                          <th className="px-5 py-3">Empresa</th>
                          <th className="px-5 py-3">Coordenação</th>
                          <th className="px-5 py-3">Mês Planejado</th>
                          <th className="px-5 py-3">Status Escala</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 bg-black/5">
                        {(() => {
                          const listFiltered = filteredEmployees.filter(emp => {
                            const plan = vacationPlans.find(p => p.employeeId === emp.id && p.year === selectedYear);
                            const isPlanned = plan && plan.month && meses.includes(plan.month);
                            
                            if (statusTableFilter === 'confirmed' && !isPlanned) return false;
                            if (statusTableFilter === 'pending' && isPlanned) return false;

                            if (statusTableMonthFilter !== 'all') {
                              if (!plan || plan.month !== statusTableMonthFilter) return false;
                            }

                            if (statusTableSearch.trim()) {
                              const q = statusTableSearch.toLowerCase().trim();
                              return (
                                emp.nome.toLowerCase().includes(q) ||
                                emp.matricula.toLowerCase().includes(q) ||
                                emp.empresa.toLowerCase().includes(q) ||
                                emp.coordenacao.toLowerCase().includes(q)
                              );
                            }
                            return true;
                          });

                          if (listFiltered.length === 0) {
                            return (
                              <tr>
                                <td colSpan={6} className="px-5 py-8 text-center text-brand-muted text-xs">
                                  Nenhum registro correspondente encontrado para os filtros selecionados.
                                </td>
                              </tr>
                            );
                          }

                          return listFiltered.map(emp => {
                            const plan = vacationPlans.find(p => p.employeeId === emp.id && p.year === selectedYear);
                            const isPlanned = plan && plan.month && meses.includes(plan.month);
                            const isFemale = emp.sexo?.toLowerCase().trim().slice(0, 1) === 'f';
                            
                            return (
                              <tr key={emp.id} className="text-xs hover:bg-[#0c2e56]/10 active:bg-[#0c2e56]/15 transition-colors group/row">
                                <td className="px-5 py-3 font-mono font-bold text-slate-400 group-hover/row:text-brand-accent transition-colors">
                                  {emp.matricula}
                                </td>
                                <td className="px-5 py-3">
                                  <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 overflow-hidden rounded-full border border-white/10 bg-black/30 flex items-center justify-center shrink-0">
                                      {emp.foto ? (
                                        <img src={emp.foto} alt={emp.nome} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                                      ) : (
                                        <UserRound className={`h-4 w-4 ${isFemale ? 'text-emerald-400' : 'text-brand-accent'}`} />
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <span className="text-xs font-black text-white uppercase truncate block hover:text-brand-accent transition-colors" title={emp.nome}>
                                        {emp.nome}
                                      </span>
                                      {emp.especialidade && (
                                        <span className="text-[9px] text-brand-muted block truncate max-w-[180px]">
                                          {emp.especialidade}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-5 py-3 text-slate-300 font-semibold">{emp.empresa}</td>
                                <td className="px-5 py-3">
                                  <span className="bg-[#B4E4FF]/10 text-[#B4E4FF] border border-[#B4E4FF]/20 text-[9px] font-sans px-2 py-0.5 rounded font-black uppercase tracking-wider">
                                    {emp.coordenacao}
                                  </span>
                                </td>
                                <td className="px-5 py-3">
                                  {isPlanned ? (
                                    <span className="font-extrabold text-[#B4E4FF] bg-brand-accent/15 border border-brand-accent/25 px-2.5 py-1 rounded text-[10px] uppercase tracking-wide">
                                      {plan.month}
                                    </span>
                                  ) : (
                                    <span className="text-white/20 italic">Não Planejado</span>
                                  )}
                                </td>
                                <td className="px-5 py-3">
                                  <span className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest border transition-all ${
                                    isPlanned 
                                      ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-300 hover:bg-emerald-500/20' 
                                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/15 animate-pulse'
                                  }`}>
                                    {isPlanned ? 'Confirmado' : 'Pendente'}
                                  </span>
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile High Density Cards view */}
                  <div className="block sm:hidden space-y-3 relative z-10 max-h-[450px] overflow-y-auto custom-scrollbar pr-1">
                    {(() => {
                      const listFiltered = filteredEmployees.filter(emp => {
                        const plan = vacationPlans.find(p => p.employeeId === emp.id && p.year === selectedYear);
                        const isPlanned = plan && plan.month && meses.includes(plan.month);
                        
                        if (statusTableFilter === 'confirmed' && !isPlanned) return false;
                        if (statusTableFilter === 'pending' && isPlanned) return false;

                        if (statusTableMonthFilter !== 'all') {
                          if (!plan || plan.month !== statusTableMonthFilter) return false;
                        }

                        if (statusTableSearch.trim()) {
                          const q = statusTableSearch.toLowerCase().trim();
                          return (
                            emp.nome.toLowerCase().includes(q) ||
                            emp.matricula.toLowerCase().includes(q) ||
                            emp.empresa.toLowerCase().includes(q) ||
                            emp.coordenacao.toLowerCase().includes(q)
                          );
                        }
                        return true;
                      });

                      if (listFiltered.length === 0) {
                        return (
                          <div className="text-center py-8 text-brand-muted text-xs bg-black/10 border border-white/5 rounded-xl">
                            Nenhum registro correspondente encontrado.
                          </div>
                        );
                      }

                      return listFiltered.map(emp => {
                        const plan = vacationPlans.find(p => p.employeeId === emp.id && p.year === selectedYear);
                        const isPlanned = plan && plan.month && meses.includes(plan.month);
                        const isFemale = emp.sexo?.toLowerCase().trim().slice(0, 1) === 'f';

                        return (
                          <div key={emp.id} className="p-4 bg-black/20 border border-white/5 rounded-xl space-y-2.5 hover:border-white/15 transition-all">
                            <div className="flex items-center gap-3 justify-between">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="h-8 w-8 overflow-hidden rounded-full border border-white/10 bg-black/30 flex items-center justify-center shrink-0">
                                  {emp.foto ? (
                                    <img src={emp.foto} alt={emp.nome} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                                  ) : (
                                    <UserRound className={`h-4 w-4 ${isFemale ? 'text-emerald-400' : 'text-brand-accent'}`} />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <span className="text-[10px] font-mono text-slate-400 block">{emp.matricula}</span>
                                  <h4 className="text-xs font-bold text-white uppercase truncate tracking-wide">{emp.nome}</h4>
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border shrink-0 ${
                                isPlanned ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-rose-500/10 border-rose-500/20 text-rose-300 animate-pulse'
                              }`}>
                                {isPlanned ? 'Confirmado' : 'Pendente'}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-[10px] bg-black/10 p-2 rounded-lg border border-white/5">
                              <div>
                                <span className="text-[#38BDF8] block uppercase font-black text-[7.5px] tracking-widest">Empresa</span>
                                <span className="text-slate-300 truncate block font-medium">{emp.empresa}</span>
                              </div>
                              <div>
                                <span className="text-[#B4E4FF] block uppercase font-black text-[7.5px] tracking-widest">Coordenação</span>
                                <span className="text-slate-300 truncate block font-medium">{emp.coordenacao}</span>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                              <span className="text-[10px] text-brand-muted font-bold">Reserva Planejada:</span>
                              {isPlanned ? (
                                <span className="text-[10px] font-black text-brand-accent uppercase bg-brand-accent/5 px-2.5 py-0.5 rounded border border-brand-accent/15 tracking-wider">{plan.month}</span>
                              ) : (
                                <span className="text-[10px] text-rose-400/40 italic">Não Planejado</span>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* Aesthetic Call to Action Footer inside Card */}
                  <div className="mt-4 pt-3 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2.5 relative z-10 text-[10px] text-brand-muted font-medium">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
                      Use o seletor de meses, busca rápida e abas de status para auditar a lista nominal por completo.
                    </span>
                  </div>

                </div>

              </div>
              
            </div>
          )}

        </div>
      )}

      {selectedSpecialtyForModal !== null && createPortal(
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedSpecialtyForModal(null);
              setSpecialtySearchQuery('');
            }
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 sm:p-6 animate-fade-in"
        >
          <div className="bg-brand-panel-light border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-white/5 flex items-start justify-between bg-black/20 shrink-0">
              <div>
                <div className="flex items-center gap-2 text-brand-accent">
                  <Briefcase className="w-5 h-5 shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#B4E4FF]">Especialidade</span>
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider mt-1">
                  {selectedSpecialtyForModal}
                </h3>
                <p className="text-[10px] text-brand-muted mt-1 leading-relaxed">
                  Lista de colaboradores alocados nesta especialidade, filtrados de acordo com a Empresa e Coordenação ativas no topo.
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedSpecialtyForModal(null);
                  setSpecialtySearchQuery('');
                }}
                className="p-1.5 rounded-full text-brand-muted hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="px-5 py-3 border-b border-white/5 bg-black/10 flex items-center gap-2 shrink-0">
              <Search className="w-4 h-4 text-brand-muted shrink-0" />
              <input
                type="text"
                placeholder="Filtrar por nome, matrícula, lotação..."
                value={specialtySearchQuery}
                onChange={(e) => setSpecialtySearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-white text-xs placeholder:text-brand-muted/70 flex-1 py-1"
                autoFocus
              />
              {specialtySearchQuery && (
                <button
                  onClick={() => setSpecialtySearchQuery('')}
                  className="text-[10px] text-brand-muted hover:text-white transition-colors uppercase font-mono tracking-wider font-bold cursor-pointer"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Modal Content - List of collaborators */}
            <div className="p-5 overflow-y-auto flex-1 bg-brand-panel/40 space-y-3 custom-scrollbar">
              {filteredModalEmployees.length === 0 ? (
                <div className="text-center py-12 text-brand-muted">
                  <p className="text-xs">Nenhum colaborador correspondente encontrado nesta especialidade.</p>
                  {specialtySearchQuery && (
                    <button
                      onClick={() => setSpecialtySearchQuery('')}
                      className="mt-2 text-xs text-brand-accent hover:underline font-bold cursor-pointer"
                    >
                      Remover filtro de busca
                    </button>
                  )}
                </div>
              ) : (
                filteredModalEmployees.map((emp) => (
                  <div 
                    key={emp.id} 
                    className="bg-brand-panel border border-white/5 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Photo / Avatar */}
                      <div className="h-10 w-10 overflow-hidden rounded-full border border-white/10 bg-brand-panel-light flex items-center justify-center shrink-0">
                        {emp.foto ? (
                          <img src={emp.foto} alt={emp.nome} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <UserRound className="h-5 w-5 text-brand-muted" />
                        )}
                      </div>
                      
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-white uppercase truncate max-w-[200px]" title={emp.nome}>
                            {emp.nome}
                          </h4>
                          <span className="bg-white/5 border border-white/10 text-[9px] font-mono px-1.5 py-0.2 rounded text-slate-400 shrink-0">
                            Mat. {emp.matricula}
                          </span>
                          {emp.autorizadoDirigir && (
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded text-[9px] uppercase font-bold shrink-0 flex items-center gap-1" title="Condutor Autorizado">
                              <Car className="w-3 h-3 text-emerald-400 shrink-0" />
                              Condutor
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-[10px] text-brand-muted mt-1.5">
                          <span className="flex items-center gap-1 shrink-0">
                            <Building2 className="w-3.5 h-3.5 text-[#38BDF8]" />
                            <span className="text-slate-300">{emp.empresa}</span>
                          </span>
                          <span className="flex items-center gap-1 shrink-0">
                            <Users2 className="w-3.5 h-3.5 text-brand-accent/50" />
                            <span className="text-slate-400">{emp.coordenacao}</span>
                          </span>
                          <span className="flex items-center gap-1 shrink-0">
                            <MapPin className="w-3.5 h-3.5 text-brand-accent/50" />
                            <span className="text-slate-400 font-medium">{emp.lotacao}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <span className="text-[10px] text-brand-muted font-mono bg-black/20 border border-white/5 px-2.5 py-1 rounded-lg">
                        {emp.escalaTrabalho}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/5 bg-black/20 flex items-center justify-between shrink-0">
              <span className="text-[10px] text-brand-muted font-mono">
                Exibindo {filteredModalEmployees.length} de {filteredEmployees.filter(emp => emp.especialidade === selectedSpecialtyForModal).length} colaboradores
              </span>
              <button
                onClick={() => {
                  setSelectedSpecialtyForModal(null);
                  setSpecialtySearchQuery('');
                }}
                className="bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {isDriversModalOpen && createPortal(
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsDriversModalOpen(false);
              setDriversSearchQuery('');
            }
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 sm:p-6 animate-fade-in"
        >
          <div className="bg-brand-panel-light border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-white/5 flex items-start justify-between bg-black/20 shrink-0">
              <div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <Car className="w-5 h-5 shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Frota & Logística</span>
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider mt-1">
                  Condutores de Veículo
                </h3>
                <p className="text-[10px] text-brand-muted mt-1 leading-relaxed">
                  Lista de colaboradores autorizados a conduzir veículos operacionais, respeitando os filtros de Empresa e Coordenação ativas no topo.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsDriversModalOpen(false);
                  setDriversSearchQuery('');
                }}
                className="p-1.5 rounded-full text-brand-muted hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="px-5 py-3 border-b border-white/5 bg-black/10 flex items-center gap-2 shrink-0">
              <Search className="w-4 h-4 text-brand-muted shrink-0" />
              <input
                type="text"
                placeholder="Filtrar condutores por nome, matrícula, escala, lotação, cargo..."
                value={driversSearchQuery}
                onChange={(e) => setDriversSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-white text-xs placeholder:text-brand-muted/70 flex-1 py-1"
                autoFocus
              />
              {driversSearchQuery && (
                <button
                  onClick={() => setDriversSearchQuery('')}
                  className="text-[10px] text-brand-muted hover:text-white transition-colors uppercase font-mono tracking-wider font-bold cursor-pointer"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Modal Content - List of drivers */}
            <div className="p-5 overflow-y-auto flex-1 bg-brand-panel/40 space-y-3 custom-scrollbar">
              {filteredDriversModalEmployees.length === 0 ? (
                <div className="text-center py-12 text-brand-muted">
                  <p className="text-xs">Nenhum condutor correspondente encontrado.</p>
                  {driversSearchQuery && (
                    <button
                      onClick={() => setDriversSearchQuery('')}
                      className="mt-2 text-xs text-brand-accent hover:underline font-bold cursor-pointer"
                    >
                      Remover filtro de busca
                    </button>
                  )}
                </div>
              ) : (
                filteredDriversModalEmployees.map((emp) => (
                  <div 
                    key={emp.id} 
                    className="bg-brand-panel border border-white/5 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Photo / Avatar */}
                      <div className="h-10 w-10 overflow-hidden rounded-full border border-white/10 bg-brand-panel-light flex items-center justify-center shrink-0">
                        {emp.foto ? (
                          <img src={emp.foto} alt={emp.nome} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <UserRound className="h-5 w-5 text-brand-muted" />
                        )}
                      </div>
                      
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-white uppercase truncate max-w-[200px]" title={emp.nome}>
                            {emp.nome}
                          </h4>
                          <span className="bg-white/5 border border-white/10 text-[9px] font-mono px-1.5 py-0.2 rounded text-slate-400 shrink-0">
                            Mat. {emp.matricula}
                          </span>
                          <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded text-[9px] uppercase font-bold shrink-0 flex items-center gap-1">
                            <Car className="w-3 h-3" />
                            Autorizado
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-[10px] text-brand-muted mt-1.5">
                          {emp.especialidade && (
                            <span className="flex items-center gap-1 shrink-0">
                              <Briefcase className="w-3.5 h-3.5 text-brand-accent/50" />
                              <span className="text-slate-300 font-semibold truncate max-w-[150px]">{emp.especialidade}</span>
                            </span>
                          )}
                          <span className="flex items-center gap-1 shrink-0">
                            <Building2 className="w-3.5 h-3.5 text-[#38BDF8]" />
                            <span className="text-slate-300">{emp.empresa}</span>
                          </span>
                          <span className="flex items-center gap-1 shrink-0">
                            <Users2 className="w-3.5 h-3.5 text-brand-accent/50" />
                            <span className="text-slate-400">{emp.coordenacao}</span>
                          </span>
                          <span className="flex items-center gap-1 shrink-0">
                            <MapPin className="w-3.5 h-3.5 text-brand-accent/50" />
                            <span className="text-slate-400 font-medium">{emp.lotacao}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <span className="text-[10px] text-brand-muted font-mono bg-black/20 border border-white/5 px-2.5 py-1 rounded-lg">
                        {emp.escalaTrabalho}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/5 bg-black/20 flex items-center justify-between shrink-0">
              <span className="text-[10px] text-brand-muted font-mono">
                Exibindo {filteredDriversModalEmployees.length} de {filteredEmployees.filter(emp => emp.autorizadoDirigir).length} condutores ativos
              </span>
              <button
                onClick={() => {
                  setIsDriversModalOpen(false);
                  setDriversSearchQuery('');
                }}
                className="bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {isGenderModalOpen && createPortal(
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsGenderModalOpen(false);
              setGenderSearchQuery('');
            }
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 sm:p-6 animate-fade-in"
        >
          <div className="bg-brand-panel-light border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-white/5 flex items-start justify-between bg-black/20 shrink-0">
              <div>
                <div className="flex items-center gap-2 text-brand-accent">
                  <Users className="w-5 h-5 shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#B4E4FF]">Demografia & Inclusão</span>
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider mt-1">
                  Relatório de Diversidade
                </h3>
                <p className="text-[10px] text-brand-muted mt-1 leading-relaxed">
                  Lista detalhada de colaboradores por gênero ativo, respeitando os filtros de Empresa e Coordenação do topo.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsGenderModalOpen(false);
                  setGenderSearchQuery('');
                }}
                className="p-1.5 rounded-full text-brand-muted hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Segmented Controller to Toggle genders inside Modal */}
            <div className="px-5 py-3 border-b border-white/5 bg-brand-panel-light/40 flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-extrabold uppercase text-brand-muted mr-2">Gênero:</span>
              <div className="flex bg-black/30 p-1 rounded-lg border border-white/5 gap-1 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setSelectedGenderType('all')}
                  className={`px-3 py-1 rounded-md transition-colors ${selectedGenderType === 'all' ? 'bg-brand-accent text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Todos ({filteredEmployees.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedGenderType('Masculino')}
                  className={`px-3 py-1 rounded-md transition-colors ${selectedGenderType === 'Masculino' ? 'bg-brand-accent/30 border border-brand-accent/50 text-brand-accent' : 'text-slate-400 hover:text-white'}`}
                >
                  Masculino ({maleCount})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedGenderType('Feminino')}
                  className={`px-3 py-1 rounded-md transition-colors ${selectedGenderType === 'Feminino' ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400' : 'text-slate-400 hover:text-white'}`}
                >
                  Feminino ({femaleCount})
                </button>
              </div>
            </div>

            {/* Modal Search Bar */}
            <div className="px-5 py-3 border-b border-white/5 bg-black/10 flex items-center gap-2 shrink-0">
              <Search className="w-4 h-4 text-brand-muted shrink-0" />
              <input
                type="text"
                placeholder="Filtrar colaboradores por nome, matrícula, escala, especialidade, lotação..."
                value={genderSearchQuery}
                onChange={(e) => setGenderSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-white text-xs placeholder:text-brand-muted/70 flex-1 py-1"
                autoFocus
              />
              {genderSearchQuery && (
                <button
                  onClick={() => setGenderSearchQuery('')}
                  className="text-[10px] text-brand-muted hover:text-white transition-colors uppercase font-mono tracking-wider font-bold cursor-pointer"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Modal Content - List of drivers */}
            <div className="p-5 overflow-y-auto flex-1 bg-brand-panel/40 space-y-3 custom-scrollbar">
              {filteredGenderModalEmployees.length === 0 ? (
                <div className="text-center py-12 text-brand-muted">
                  <p className="text-xs">Nenhum colaborador correspondente encontrado para os filtros selecionados.</p>
                  {genderSearchQuery && (
                    <button
                      onClick={() => setGenderSearchQuery('')}
                      className="mt-2 text-xs text-brand-accent hover:underline font-bold cursor-pointer"
                    >
                      Remover filtro de busca
                    </button>
                  )}
                </div>
              ) : (
                filteredGenderModalEmployees.map((emp) => {
                  const firstLetter = emp.sexo?.toLowerCase().trim().slice(0, 1) || '';
                  const isFemale = firstLetter === 'f';
                  return (
                    <div 
                      key={emp.id} 
                      className="bg-brand-panel border border-white/5 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Photo / Avatar */}
                        <div className="h-10 w-10 overflow-hidden rounded-full border border-white/10 bg-brand-panel-light flex items-center justify-center shrink-0">
                          {emp.foto ? (
                            <img src={emp.foto} alt={emp.nome} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <UserRound className={`h-5 w-5 ${isFemale ? 'text-emerald-400' : 'text-brand-accent'}`} />
                          )}
                        </div>
                        
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs font-bold text-white uppercase truncate max-w-[200px]" title={emp.nome}>
                              {emp.nome}
                            </h4>
                            <span className="bg-white/5 border border-white/10 text-[9px] font-mono px-1.5 py-0.2 rounded text-slate-400 shrink-0">
                              Mat. {emp.matricula}
                            </span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold shrink-0 flex items-center gap-1 ${
                              isFemale 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-brand-accent/15 text-brand-accent border border-brand-accent/25'
                            }`}>
                              {isFemale ? 'Feminino' : 'Masculino'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-[10px] text-brand-muted mt-1.5">
                            {emp.especialidade && (
                              <span className="flex items-center gap-1 shrink-0">
                                <Briefcase className="w-3.5 h-3.5 text-brand-accent/50" />
                                <span className="text-slate-300 font-semibold truncate max-w-[150px]">{emp.especialidade}</span>
                              </span>
                            )}
                            <span className="flex items-center gap-1 shrink-0">
                              <Building2 className="w-3.5 h-3.5 text-[#38BDF8]" />
                              <span className="text-slate-300">{emp.empresa}</span>
                            </span>
                            <span className="flex items-center gap-1 shrink-0">
                              <Users2 className="w-3.5 h-3.5 text-brand-accent/50" />
                              <span className="text-slate-400">{emp.coordenacao}</span>
                            </span>
                            <span className="flex items-center gap-1 shrink-0">
                              <MapPin className="w-3.5 h-3.5 text-brand-accent/50" />
                              <span className="text-slate-400 font-medium">{emp.lotacao}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <span className="text-[10px] text-brand-muted font-mono bg-black/20 border border-white/5 px-2.5 py-1 rounded-lg">
                          {emp.escalaTrabalho}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/5 bg-black/20 flex items-center justify-between shrink-0">
              <span className="text-[10px] text-brand-muted font-mono">
                Exibindo {filteredGenderModalEmployees.length} colaboradores
              </span>
              <button
                onClick={() => {
                  setIsGenderModalOpen(false);
                  setGenderSearchQuery('');
                }}
                className="bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {isCoordModalOpen && selectedCoordForModal && createPortal(
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsCoordModalOpen(false);
              setCoordSearchQuery('');
            }
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 sm:p-6 animate-fade-in"
        >
          <div className="bg-brand-panel-light border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-white/5 flex items-start justify-between bg-black/20 shrink-0">
              <div className="min-w-0 pr-4">
                <div className="flex items-center gap-2 text-brand-accent">
                  <Activity className="w-5 h-5 shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#B4E4FF]">Auditoria de Alocação</span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider mt-1 truncate" title={selectedCoordForModal}>
                  {selectedCoordForModal}
                </h3>
                {(() => {
                  const match = coordenacoes.find(c => c.nome.toUpperCase() === selectedCoordForModal.toUpperCase());
                  return match && match.coordenador ? (
                    <p className="text-[10px] sm:text-xs text-brand-accent font-extrabold flex items-center gap-1.5 mt-1.5 leading-none uppercase tracking-wide">
                      <UserRound className="w-3.5 h-3.5 shrink-0" />
                      <span>Coordenador Responsável: <strong className="text-white bg-brand-accent/25 px-2 py-0.5 rounded border border-brand-accent/20 font-bold ml-1">{match.coordenador}</strong></span>
                    </p>
                  ) : (
                    <p className="text-[10px] text-brand-muted mt-1 leading-relaxed">
                      Efetivo ativo alocado, considerando os filtros globais de Empresa e escala.
                    </p>
                  );
                })()}
              </div>
              <button
                onClick={() => {
                  setIsCoordModalOpen(false);
                  setCoordSearchQuery('');
                }}
                className="p-1.5 rounded-full text-brand-muted hover:bg-white/5 hover:text-white transition-colors cursor-pointer shrink-0"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="px-5 py-3 border-b border-white/5 bg-black/10 flex items-center gap-2 shrink-0">
              <Search className="w-4 h-4 text-brand-muted shrink-0" />
              <input
                type="text"
                placeholder="Filtrar colaboradores por nome, matrícula, especialidade, lotação..."
                value={coordSearchQuery}
                onChange={(e) => setCoordSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-white text-xs placeholder:text-brand-muted/70 flex-1 py-1"
                autoFocus
              />
              {coordSearchQuery && (
                <button
                  onClick={() => setCoordSearchQuery('')}
                  className="text-[10px] text-brand-muted hover:text-white transition-colors uppercase font-mono tracking-wider font-bold cursor-pointer"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Modal Content - List of Coordination Employees */}
            <div className="p-5 overflow-y-auto flex-1 bg-brand-panel/40 space-y-3 custom-scrollbar">
              {filteredCoordModalEmployees.length === 0 ? (
                <div className="text-center py-12 text-brand-muted">
                  <p className="text-xs">Nenhum colaborador correspondente às regras de busca nesta coordenação.</p>
                  {coordSearchQuery && (
                    <button
                      onClick={() => setCoordSearchQuery('')}
                      className="mt-2 text-xs text-brand-accent hover:underline font-bold cursor-pointer"
                    >
                      Remover filtro de busca
                    </button>
                  )}
                </div>
              ) : (
                filteredCoordModalEmployees.map((emp) => {
                  const firstLetter = emp.sexo?.toLowerCase().trim().slice(0, 1) || '';
                  const isFemale = firstLetter === 'f';
                  return (
                    <div 
                      key={emp.id} 
                      className="bg-brand-panel border border-white/5 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Photo / Avatar */}
                        <div className="h-10 w-10 overflow-hidden rounded-full border border-white/10 bg-brand-panel-light flex items-center justify-center shrink-0">
                          {emp.foto ? (
                            <img src={emp.foto} alt={emp.nome} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <UserRound className={`h-5 w-5 ${isFemale ? 'text-emerald-400' : 'text-brand-accent'}`} />
                          )}
                        </div>
                        
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs font-bold text-white uppercase truncate max-w-[200px]" title={emp.nome}>
                              {emp.nome}
                            </h4>
                            <span className="bg-white/5 border border-white/10 text-[9px] font-mono px-1.5 py-0.2 rounded text-slate-400 shrink-0">
                              Mat. {emp.matricula}
                            </span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold shrink-0 flex items-center gap-1 ${
                              isFemale 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-brand-accent/15 text-brand-accent border border-brand-accent/25'
                            }`}>
                              {isFemale ? 'Feminino' : 'Masculino'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-[10px] text-brand-muted mt-1.5">
                            {emp.especialidade && (
                              <span className="flex items-center gap-1 shrink-0">
                                <Briefcase className="w-3.5 h-3.5 text-brand-accent/50" />
                                <span className="text-slate-300 font-semibold truncate max-w-[150px]">{emp.especialidade}</span>
                              </span>
                            )}
                            <span className="flex items-center gap-1 shrink-0">
                              <Building2 className="w-3.5 h-3.5 text-[#38BDF8]" />
                              <span className="text-slate-300">{emp.empresa}</span>
                            </span>
                            <span className="flex items-center gap-1 shrink-0">
                              <MapPin className="w-3.5 h-3.5 text-brand-accent/50" />
                              <span className="text-slate-400 font-medium">{emp.lotacao}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <span className="text-[10px] text-brand-muted font-mono bg-black/20 border border-white/5 px-2.5 py-1 rounded-lg">
                          {emp.escalaTrabalho}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/5 bg-black/20 flex items-center justify-between shrink-0">
              <span className="text-[10px] text-brand-muted font-mono">
                Exibindo {filteredCoordModalEmployees.length} de {filteredEmployees.filter(emp => emp.coordenacao?.toUpperCase() === selectedCoordForModal.toUpperCase()).length} colaboradores
              </span>
              <button
                onClick={() => {
                  setIsCoordModalOpen(false);
                  setCoordSearchQuery('');
                }}
                className="bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {isEpiModalOpen && createPortal(
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsEpiModalOpen(false);
              setEpiSearchQuery('');
            }
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 sm:p-6 animate-fade-in"
        >
          <div className="bg-brand-panel-light border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-white/5 flex items-start justify-between bg-black/20 shrink-0">
              <div className="min-w-0 pr-4">
                <div className="flex items-center gap-2 text-brand-accent">
                  <Shirt className="w-5 h-5 shrink-0 text-brand-accent animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#B4E4FF]">Fardamento dos Colaboradores</span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider mt-1 truncate">
                  {epiModalFilterType === 'shirt' && `Ficha de Uniformes: Camisa ${epiModalFilterValue}`}
                  {epiModalFilterType === 'pants' && `Ficha de Uniformes: Calça ${epiModalFilterValue}`}
                  {epiModalFilterType === 'spt' && `Ficha de Uniformes: Calçado SPT ${epiModalFilterValue}`}
                  {epiModalFilterType === 'empty' && 'Fichas de EPI Incompletas / Pendentes'}
                  {epiModalFilterType === 'all' && 'Painel Consolidado de Uniformes'}
                </h3>
                <p className="text-[10px] text-brand-muted mt-1 leading-relaxed">
                  {epiModalFilterType === 'empty' 
                    ? 'Visualização de colaboradores com tamanhos pendentes de configuração no cadastro geral.'
                    : 'Filtro dinâmico por dimensões corporativas e vestimentas, respeitando filtros de empresa e coordenação.'}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsEpiModalOpen(false);
                  setEpiSearchQuery('');
                }}
                className="p-1.5 rounded-full text-brand-muted hover:bg-white/5 hover:text-white transition-colors cursor-pointer shrink-0"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search Bar & Tab Selectors */}
            <div className="px-5 py-3 border-b border-white/5 bg-black/10 flex flex-col gap-2 shrink-0">
              {/* Filter pills inside modal for quick switching! Incredible usability improvement! */}
              <div 
                onMouseDown={handleDragScroll}
                className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none cursor-grab active:cursor-grabbing select-none"
              >
                <button 
                  onClick={() => { setEpiModalFilterType('all'); setEpiModalFilterValue(''); }}
                  className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider transition-colors shrink-0 ${
                    epiModalFilterType === 'all' ? 'bg-brand-accent text-white font-bold' : 'bg-white/5 hover:bg-white/10 text-brand-muted'
                  }`}
                >
                  Todos
                </button>
                <button 
                  onClick={() => { setEpiModalFilterType('empty'); setEpiModalFilterValue(''); }}
                  className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider transition-colors shrink-0 ${
                    epiModalFilterType === 'empty' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-white/5 hover:bg-white/10 text-brand-muted'
                  }`}
                >
                  Não Cadastrados ({filteredEmployees.filter(emp => !emp.camisa || !emp.calca || !emp.spt || emp.spt === 'Não' || emp.spt === '').length})
                </button>
                {shirtSizesList.map(size => {
                  const cnt = filteredEmployees.filter(emp => emp.camisa?.toUpperCase() === size).length;
                  if (cnt === 0) return null;
                  return (
                    <button 
                      key={`m-shirt-${size}`}
                      onClick={() => { setEpiModalFilterType('shirt'); setEpiModalFilterValue(size); }}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors shrink-0 ${
                        epiModalFilterType === 'shirt' && epiModalFilterValue === size ? 'bg-brand-accent/20 text-brand-accent border border-brand-accent/30 font-bold' : 'bg-white/5 hover:bg-white/10 text-brand-muted'
                      }`}
                    >
                      Camisa {size} ({cnt})
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-brand-muted shrink-0" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome, matrícula, empresa ou lotação..."
                  value={epiSearchQuery}
                  onChange={(e) => setEpiSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-white text-xs placeholder:text-brand-muted/70 flex-1 py-1"
                  autoFocus
                />
                {epiSearchQuery && (
                  <button
                    onClick={() => setEpiSearchQuery('')}
                    className="text-[10px] text-brand-muted hover:text-white transition-colors uppercase font-mono tracking-wider font-bold cursor-pointer"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>

            {/* Modal Content - List of Matches */}
            <div className="p-5 overflow-y-auto flex-1 bg-brand-panel/40 space-y-3 custom-scrollbar">
              {filteredEpiModalEmployees.length === 0 ? (
                <div className="text-center py-12 text-brand-muted">
                  <p className="text-xs">Nenhum colaborador encontrado com os critérios de fardamento selecionados.</p>
                  {epiSearchQuery && (
                    <button
                      onClick={() => setEpiSearchQuery('')}
                      className="mt-2 text-xs text-brand-accent hover:underline font-bold cursor-pointer"
                    >
                      Limpar filtro de busca
                    </button>
                  )}
                </div>
              ) : (
                filteredEpiModalEmployees.map((emp) => {
                  const firstLetter = emp.sexo?.toLowerCase().trim().slice(0, 1) || '';
                  const isFemale = firstLetter === 'f';
                  const hasShirt = emp.camisa && emp.camisa !== '';
                  const hasPants = emp.calca && emp.calca !== '';
                  const hasSpt = emp.spt && emp.spt !== 'Não' && emp.spt !== '';

                  return (
                    <div 
                      key={`epi-${emp.id}`} 
                      className="bg-brand-panel border border-white/5 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-white/10 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Photo / Avatar */}
                        <div className="h-10 w-10 overflow-hidden rounded-full border border-white/10 bg-brand-panel-light flex items-center justify-center shrink-0">
                          {emp.foto ? (
                            <img src={emp.foto} alt={emp.nome} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <UserRound className={`h-5 w-5 ${isFemale ? 'text-emerald-400' : 'text-brand-accent'}`} />
                          )}
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs font-bold text-white uppercase truncate max-w-[200px]" title={emp.nome}>
                              {emp.nome}
                            </h4>
                            <span className="bg-white/5 border border-white/10 text-[9px] font-mono px-1.5 py-0.2 rounded text-slate-400 shrink-0">
                              Mat. {emp.matricula}
                            </span>
                            {emp.coordenacao && (
                              <span className="bg-[#B4E4FF]/10 text-[#B4E4FF] border border-[#B4E4FF]/20 text-[9px] font-sans px-1.5 py-0.2 rounded font-black uppercase tracking-wider shrink-0">
                                {emp.coordenacao}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-[10px] text-brand-muted mt-1.5">
                            {emp.especialidade && (
                              <span className="flex items-center gap-1 shrink-0">
                                <Briefcase className="w-3.5 h-3.5 text-brand-accent/50" />
                                <span className="text-slate-300 font-semibold truncate max-w-[150px]">{emp.especialidade}</span>
                              </span>
                            )}
                            <span className="flex items-center gap-1 shrink-0">
                              <Building2 className="w-3.5 h-3.5 text-[#38BDF8]" />
                              <span className="text-slate-300">{emp.empresa}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Hand Side: Sizes indicators display */}
                      <div className="flex items-center gap-4 shrink-0 self-end md:self-center">
                        {/* Camisa */}
                        <div className="flex flex-col items-center">
                          <span className="text-[7.5px] uppercase font-black tracking-widest text-brand-muted mb-0.5">Camisa</span>
                          <span className={`px-2.5 py-1 rounded text-[10px] font-black font-mono transition-colors ${
                            hasShirt 
                              ? 'bg-brand-accent/15 text-brand-accent hover:bg-brand-accent/30 border border-brand-accent/25' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm shadow-amber-500/5 animate-pulse'
                          }`}>
                            {emp.camisa || 'PENDENTE'}
                          </span>
                        </div>

                        {/* Calça */}
                        <div className="flex flex-col items-center">
                          <span className="text-[7.5px] uppercase font-black tracking-widest text-brand-muted mb-0.5">Calça</span>
                          <span className={`px-2.5 py-1 rounded text-[10px] font-black font-mono transition-colors ${
                            hasPants 
                              ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm shadow-amber-500/5 animate-pulse'
                          }`}>
                            {emp.calca || 'PENDENTE'}
                          </span>
                        </div>

                        {/* Bota / Calçado */}
                        <div className="flex flex-col items-center">
                          <span className="text-[7.5px] uppercase font-black tracking-widest text-brand-muted mb-0.5">Calçado/Bota</span>
                          <span className={`px-2.5 py-1 rounded text-[10px] font-black font-mono transition-colors ${
                            hasSpt 
                              ? 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm shadow-amber-500/5 animate-pulse'
                          }`}>
                            {hasSpt ? emp.spt : 'PENDENTE'}
                          </span>
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/5 bg-black/20 flex items-center justify-between shrink-0">
              <span className="text-[10px] text-brand-muted font-mono">
                Exibindo {filteredEpiModalEmployees.length} colaboradores
              </span>
              <button
                onClick={() => {
                  setIsEpiModalOpen(false);
                  setEpiSearchQuery('');
                }}
                className="bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer"
              >
                Voltar
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {isMonthScaleModalOpen && selectedMonthForModal && createPortal(
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsMonthScaleModalOpen(false);
              setScaleSearchQuery('');
            }
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 sm:p-6 animate-fade-in"
        >
          <div className="bg-brand-panel-light border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-white/5 flex items-start justify-between bg-black/20 shrink-0">
              <div className="min-w-0 pr-4">
                <div className="flex items-center gap-2 text-orange-400">
                  <Calendar className="w-5 h-5 shrink-0 text-brand-accent animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#B4E4FF]">Auditoria Detalhada de Escalas</span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider mt-1 truncate">
                  Planejamento Nominal: {selectedMonthForModal} de {selectedYear}
                </h3>
                <p className="text-[10px] text-brand-muted mt-1 leading-relaxed">
                  Lista de colaboradores escalados para desfalque planejado/férias neste mês, com suas respectivas regras e coberturas.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsMonthScaleModalOpen(false);
                  setScaleSearchQuery('');
                }}
                className="p-1.5 rounded-full text-brand-muted hover:bg-white/5 hover:text-white transition-colors cursor-pointer shrink-0"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search Bar & Tab Selectors */}
            <div className="px-5 py-3 border-b border-white/5 bg-black/10 flex flex-col gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-brand-muted shrink-0" />
                <input
                  type="text"
                  placeholder="Pesquisar colaborador por nome, matrícula, empresa ou lotação..."
                  value={scaleSearchQuery}
                  onChange={(e) => setScaleSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-white text-xs placeholder:text-brand-muted/70 flex-1 py-1"
                  autoFocus
                />
                {scaleSearchQuery && (
                  <button
                    onClick={() => setScaleSearchQuery('')}
                    className="text-[10px] text-brand-muted hover:text-white transition-colors uppercase font-mono tracking-wider font-bold cursor-pointer"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>

            {/* Modal Content - List of Matches */}
            <div className="p-5 overflow-y-auto flex-1 bg-brand-panel/40 space-y-3 custom-scrollbar">
              {filteredMonthScaleEmployees.length === 0 ? (
                <div className="text-center py-12 text-brand-muted">
                  <p className="text-xs">Nenhum colaborador com programação ativa encontrado para {selectedMonthForModal}.</p>
                  {scaleSearchQuery && (
                    <button
                      onClick={() => setScaleSearchQuery('')}
                      className="mt-2 text-xs text-brand-accent hover:underline font-bold cursor-pointer"
                    >
                      Limpar filtro de busca
                    </button>
                  )}
                </div>
              ) : (
                filteredMonthScaleEmployees.map((emp) => {
                  const firstLetter = emp.sexo?.toLowerCase().trim().slice(0, 1) || '';
                  const isFemale = firstLetter === 'f';
                  const plan = vacationPlans.find(p => p.employeeId === emp.id && p.year === selectedYear);

                  return (
                    <div 
                      key={`scale-month-${emp.id}`} 
                      className="bg-brand-panel border border-white/5 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-white/10 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Photo / Avatar */}
                        <div className="h-10 w-10 overflow-hidden rounded-full border border-white/10 bg-brand-panel-light flex items-center justify-center shrink-0">
                          {emp.foto ? (
                            <img src={emp.foto} alt={emp.nome} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <UserRound className={`h-5 w-5 ${isFemale ? 'text-emerald-400' : 'text-brand-accent'}`} />
                          )}
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs font-bold text-white uppercase truncate max-w-[200px]" title={emp.nome}>
                              {emp.nome}
                            </h4>
                            <span className="bg-white/5 border border-white/10 text-[9px] font-mono px-1.5 py-0.2 rounded text-slate-400 shrink-0">
                              Mat. {emp.matricula}
                            </span>
                            {emp.coordenacao && (
                              <span className="bg-[#B4E4FF]/10 text-[#B4E4FF] border border-[#B4E4FF]/20 text-[9px] font-sans px-1.5 py-0.2 rounded font-black uppercase tracking-wider shrink-0">
                                {emp.coordenacao}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-[10px] text-brand-muted mt-1.5">
                            {emp.especialidade && (
                              <span className="flex items-center gap-1 shrink-0">
                                <Briefcase className="w-3.5 h-3.5 text-brand-accent/50" />
                                <span className="text-slate-300 font-semibold truncate max-w-[150px]">{emp.especialidade}</span>
                              </span>
                            )}
                            <span className="flex items-center gap-1 shrink-0">
                              <Building2 className="w-3.5 h-3.5 text-[#38BDF8]" />
                              <span className="text-slate-300">{emp.empresa}</span>
                            </span>
                          </div>

                          {plan?.observacao && (
                            <div className="mt-2 text-[10px] text-slate-400 bg-black/15 px-2 py-1 rounded border border-white/5 italic">
                              Obs: {plan.observacao}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Hand Side: Modality / Planning settings */}
                      <div className="flex flex-row md:flex-col items-end gap-2 shrink-0">
                        {plan ? (
                          <>
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                              plan.gozar30Dias 
                                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' 
                                : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                            }`}>
                              {plan.gozar30Dias ? 'Gozar 30 Dias' : 'Fracionado / Abono'}
                            </span>
                            
                            <div className="flex flex-col gap-0.5 items-end text-[9px] text-brand-muted font-mono font-bold mt-1">
                              {plan.trabalharPrimeiros10Dias && (
                                <span className="text-emerald-400">✓ Trab. primeiros 10 dias</span>
                              )}
                              {plan.trabalharUltimos10Dias && (
                                <span className="text-emerald-400">✓ Trab. últimos 10 dias</span>
                              )}
                              {!plan.gozar30Dias && !plan.trabalharPrimeiros10Dias && !plan.trabalharUltimos10Dias && (
                                <span className="text-slate-400">Vendas convencionais</span>
                              )}
                            </div>
                          </>
                        ) : (
                          <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                            Não Programado
                          </span>
                        )}
                      </div>

                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/5 bg-black/20 flex items-center justify-between shrink-0">
              <span className="text-[10px] text-brand-muted font-mono">
                Exibindo {filteredMonthScaleEmployees.length} colaboradores planejados
              </span>
              <button
                onClick={() => {
                  setIsMonthScaleModalOpen(false);
                  setScaleSearchQuery('');
                }}
                className="bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer"
              >
                Voltar
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
