import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Save, 
  CheckSquare, 
  Square, 
  AlertTriangle, 
  CheckCircle2, 
  Building2, 
  Users, 
  Info, 
  Sparkles,
  ArrowUpDown,
  Filter,
  X,
  Plus,
  Sun,
  Compass,
  Palmtree,
  Map,
  Camera,
  Ticket,
  Tent,
  Sailboat,
  TreePine,
  Briefcase,
  Plane
} from 'lucide-react';
import { Employee, Coordenacao, Empresa, VacationPlan } from '../types';

interface VacationPlanningProps {
  employees: Employee[];
  coordenacoes: Coordenacao[];
  empresas: Empresa[];
}

type SortField = 'nome' | 'matricula' | 'cpf' | 'especialidade' | 'empresa' | 'coordenacao' | 'month' | null;
type SortOrder = 'asc' | 'desc';

export function VacationPlanning({ employees, coordenacoes, empresas }: VacationPlanningProps) {
  // 1. Selector of Year
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('@sit:vacation:selectedYear');
      return saved ? Number(saved) : 2026;
    } catch {
      return 2026;
    }
  });

  // New Tab Navigation State
  const [activeTab, setActiveTab2] = useState<'planejamento' | 'cronograma'>(() => {
    try {
      const saved = localStorage.getItem('@sit:vacation:activeTab');
      return (saved === 'planejamento' || saved === 'cronograma') ? saved : 'planejamento';
    } catch {
      return 'planejamento';
    }
  });

  // Interactive Month Detail Modal State
  const [selectedDetailMonth, setSelectedDetailMonth] = useState<string | null>(() => {
    try {
      return localStorage.getItem('@sit:vacation:selectedDetailMonth');
    } catch {
      return null;
    }
  });
  const [detailCompanyFilter, setDetailCompanyFilter] = useState(() => {
    try {
      return localStorage.getItem('@sit:vacation:detailCompanyFilter') || '';
    } catch {
      return '';
    }
  });
  const [detailCoordFilter, setDetailCoordFilter] = useState(() => {
    try {
      return localStorage.getItem('@sit:vacation:detailCoordFilter') || '';
    } catch {
      return '';
    }
  });
  const [detailSpecialtyFilter, setDetailSpecialtyFilter] = useState(() => {
    try {
      return localStorage.getItem('@sit:vacation:detailSpecialtyFilter') || '';
    } catch {
      return '';
    }
  });
  const [detailModeFilter, setDetailModeFilter] = useState(() => {
    try {
      return localStorage.getItem('@sit:vacation:detailModeFilter') || '';
    } catch {
      return '';
    }
  });
  const [detailSearchQuery, setDetailSearchQuery] = useState(() => {
    try {
      return localStorage.getItem('@sit:vacation:detailSearchQuery') || '';
    } catch {
      return '';
    }
  });

  const isModalFirstMount = useRef(true);

  // Reset detail filters when selected month changes
  useEffect(() => {
    if (isModalFirstMount.current) {
      isModalFirstMount.current = false;
      return;
    }
    setDetailCompanyFilter('');
    setDetailCoordFilter('');
    setDetailSpecialtyFilter('');
    setDetailModeFilter('');
    setDetailSearchQuery('');
  }, [selectedDetailMonth]);

  // 2. State for Vacation Plans
  // We'll store all saved plans as a state, loaded from local storage
  const [savedPlans, setSavedPlans] = useState<VacationPlan[]>([]);
  
  // This holds current workspace edits: key is `employeeId_year`
  const [editedPlans, setEditedPlans] = useState<Record<string, VacationPlan>>({});
  
  // To keep track of whether we finished loading from localStorage to avoid overwriting initial state
  const [isLoaded, setIsLoaded] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // 3. Dropdown Search / Filter States
  const [selectedCoords, setSelectedCoords] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('@sit:vacation:selectedCoords');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [coordSearch, setCoordSearch] = useState('');
  const [showCoordDropdown, setShowCoordDropdown] = useState(false);

  const [selectedEmps, setSelectedEmps] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('@sit:vacation:selectedEmps');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [empSearch, setEmpSearch] = useState('');
  const [showEmpDropdown, setShowEmpDropdown] = useState(false);

  const [searchQuery, setSearchQuery] = useState(() => {
    try {
      return localStorage.getItem('@sit:vacation:searchQuery') || '';
    } catch {
      return '';
    }
  });

  // Ref dropdown click-out side effects
  const coordDropdownRef = useRef<HTMLDivElement>(null);
  const empDropdownRef = useRef<HTMLDivElement>(null);

  // Pagination and sorting states
  const [currentPage, setCurrentPage] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('@sit:vacation:currentPage');
      return saved ? Number(saved) : 1;
    } catch {
      return 1;
    }
  });
  const itemsPerPage = 8;
  const [sortField, setSortField] = useState<SortField>(() => {
    try {
      const saved = localStorage.getItem('@sit:vacation:sortField');
      return saved ? (saved as SortField) : 'nome';
    } catch {
      return 'nome';
    }
  });
  const [sortOrder, setSortOrder] = useState<SortOrder>(() => {
    try {
      const saved = localStorage.getItem('@sit:vacation:sortOrder');
      return (saved === 'asc' || saved === 'desc') ? saved : 'asc';
    } catch {
      return 'asc';
    }
  });

  // Persist filter preferences
  useEffect(() => {
    try {
      localStorage.setItem('@sit:vacation:selectedYear', String(selectedYear));
    } catch {}
  }, [selectedYear]);

  useEffect(() => {
    try {
      localStorage.setItem('@sit:vacation:activeTab', activeTab);
    } catch {}
  }, [activeTab]);

  useEffect(() => {
    try {
      if (selectedDetailMonth) {
        localStorage.setItem('@sit:vacation:selectedDetailMonth', selectedDetailMonth);
      } else {
        localStorage.removeItem('@sit:vacation:selectedDetailMonth');
      }
    } catch {}
  }, [selectedDetailMonth]);

  useEffect(() => {
    try {
      localStorage.setItem('@sit:vacation:detailCompanyFilter', detailCompanyFilter);
    } catch {}
  }, [detailCompanyFilter]);

  useEffect(() => {
    try {
      localStorage.setItem('@sit:vacation:detailCoordFilter', detailCoordFilter);
    } catch {}
  }, [detailCoordFilter]);

  useEffect(() => {
    try {
      localStorage.setItem('@sit:vacation:detailSpecialtyFilter', detailSpecialtyFilter);
    } catch {}
  }, [detailSpecialtyFilter]);

  useEffect(() => {
    try {
      localStorage.setItem('@sit:vacation:detailModeFilter', detailModeFilter);
    } catch {}
  }, [detailModeFilter]);

  useEffect(() => {
    try {
      localStorage.setItem('@sit:vacation:detailSearchQuery', detailSearchQuery);
    } catch {}
  }, [detailSearchQuery]);

  useEffect(() => {
    try {
      localStorage.setItem('@sit:vacation:selectedCoords', JSON.stringify(selectedCoords));
    } catch {}
  }, [selectedCoords]);

  useEffect(() => {
    try {
      localStorage.setItem('@sit:vacation:selectedEmps', JSON.stringify(selectedEmps));
    } catch {}
  }, [selectedEmps]);

  useEffect(() => {
    try {
      localStorage.setItem('@sit:vacation:searchQuery', searchQuery);
    } catch {}
  }, [searchQuery]);

  useEffect(() => {
    try {
      localStorage.setItem('@sit:vacation:currentPage', String(currentPage));
    } catch {}
  }, [currentPage]);

  useEffect(() => {
    try {
      if (sortField) {
        localStorage.setItem('@sit:vacation:sortField', sortField);
      } else {
        localStorage.removeItem('@sit:vacation:sortField');
      }
    } catch {}
  }, [sortField]);

  useEffect(() => {
    try {
      localStorage.setItem('@sit:vacation:sortOrder', sortOrder);
    } catch {}
  }, [sortOrder]);

  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  // Load from localStorage on mount and filter out mock/test data
  useEffect(() => {
    try {
      const saved = localStorage.getItem('@sit:vacation_plans');
      if (saved) {
        const parsed: VacationPlan[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(plan => plan.employeeId && !plan.employeeId.startsWith('emp-'));
          setSavedPlans(filtered);
          localStorage.setItem('@sit:vacation_plans', JSON.stringify(filtered));
        }
      }
    } catch (e) {
      console.error('Failed to parse vacation plans', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // When savedPlans or selectedYear changes, build the editedPlans map for edits
  useEffect(() => {
    if (!isLoaded) return;
    
    const initialEdits: Record<string, VacationPlan> = {};
    // Populate with saved plans for this year
    savedPlans.forEach(plan => {
      initialEdits[`${plan.employeeId}_${plan.year}`] = { ...plan };
    });
    
    // For any employee who doesn't have a plan for this year, we initialize a default blank plan in local view
    employees.forEach(emp => {
      const key = `${emp.id}_${selectedYear}`;
      if (!initialEdits[key]) {
        initialEdits[key] = {
          employeeId: emp.id,
          year: selectedYear,
          month: '',
          gozar30Dias: false,
          trabalharPrimeiros10Dias: false,
          trabalharUltimos10Dias: false,
          observacao: ''
        };
      }
    });

    setEditedPlans(initialEdits);
  }, [savedPlans, selectedYear, employees, isLoaded]);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (coordDropdownRef.current && !coordDropdownRef.current.contains(event.target as Node)) {
        setShowCoordDropdown(false);
      }
      if (empDropdownRef.current && !empDropdownRef.current.contains(event.target as Node)) {
        setShowEmpDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePrevYear = () => {
    setSelectedYear(prev => prev - 1);
  };

  const handleNextYear = () => {
    setSelectedYear(prev => prev + 1);
  };

  // Change individual cell values in the editable map
  const handleCellChange = <K extends keyof VacationPlan>(
    employeeId: string, 
    field: K, 
    value: VacationPlan[K]
  ) => {
    const key = `${employeeId}_${selectedYear}`;
    
    setEditedPlans(prev => {
      const current = prev[key] || {
        employeeId,
        year: selectedYear,
        month: '',
        gozar30Dias: false,
        trabalharPrimeiros10Dias: false,
        trabalharUltimos10Dias: false,
        observacao: ''
      };

      const updated = { ...current, [field]: value };

      // enforce Business Rules / Exclusivity:
      // When "Gozar os 30 dias de férias" is checked, the remaining must be automatically disabled/desabilitados
      if (field === 'gozar30Dias' && value === true) {
        updated.trabalharPrimeiros10Dias = false;
        updated.trabalharUltimos10Dias = false;
      }
      // If client checks either of the 10-days, "Gozar os 30 dias" must remain/become false
      // and they are mutually exclusive between themselves
      if (field === 'trabalharPrimeiros10Dias' && value === true) {
        updated.gozar30Dias = false;
        updated.trabalharUltimos10Dias = false;
      }
      if (field === 'trabalharUltimos10Dias' && value === true) {
        updated.gozar30Dias = false;
        updated.trabalharPrimeiros10Dias = false;
      }

      return {
        ...prev,
        [key]: updated
      };
    });
  };

  // Save changes handler
  const handleSavePlanning = () => {
    // Collect all plans in the current edited state and merge them back with the saved list
    const currentYearKeySuffix = `_${selectedYear}`;
    
    // Filter out plans for other years of savedPlans so we overwrite completely for the current selectedYear
    const otherYearsPlans = savedPlans.filter(p => p.year !== selectedYear);
    
    // Extract plans of this year from the edited map
    const activeEditedPlans = (Object.entries(editedPlans) as [string, VacationPlan][])
      .filter(([key]) => key.endsWith(currentYearKeySuffix))
      .map(([_, plan]) => plan);

    // Save only plans that have some content (e.g. either selected a month, checked gozar, or wrote an observation)
    // Actually, saving all of them keeps the structure, but we can filter empty ones to keep database small
    const nonDefaultPlans = activeEditedPlans.filter(plan => {
      return plan.month !== '' || plan.gozar30Dias || plan.trabalharPrimeiros10Dias || plan.trabalharUltimos10Dias || plan.observacao !== '';
    });

    const merged = [...otherYearsPlans, ...nonDefaultPlans];
    
    setSavedPlans(merged);
    localStorage.setItem('@sit:vacation_plans', JSON.stringify(merged));
    
    setToastMessage(`Planejamento de férias do ano de ${selectedYear} salvo com sucesso!`);
    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 4000);
  };

  // Helper validation to detect "Conflitos ou Inconsistências"
  const getPlanStatus = (employeeId: string) => {
    const key = `${employeeId}_${selectedYear}`;
    const plan = editedPlans[key];
    const saved = savedPlans.find(p => p.employeeId === employeeId && p.year === selectedYear);

    if (!plan) return { isPlanned: false, isDirty: false, hasConflict: false, conflictMessage: '' };

    const isPlanned = plan.month !== '';
    
    // Check if dirty (different from what's stored in savedPlans)
    const savedMonth = saved ? saved.month : '';
    const saved30 = saved ? saved.gozar30Dias : false;
    const savedP10 = saved ? saved.trabalharPrimeiros10Dias : false;
    const savedU10 = saved ? saved.trabalharUltimos10Dias : false;
    const savedObs = saved ? saved.observacao : '';

    const isDirty = (
      plan.month !== savedMonth ||
      plan.gozar30Dias !== saved30 ||
      plan.trabalharPrimeiros10Dias !== savedP10 ||
      plan.trabalharUltimos10Dias !== savedU10 ||
      plan.observacao !== savedObs
    );

    let hasConflict = false;
    let conflictMessage = '';

    // 1. Mês selecionado mas nenhuma modalidade de gozo de férias foi assinalada
    if (isPlanned && !plan.gozar30Dias && !plan.trabalharPrimeiros10Dias && !plan.trabalharUltimos10Dias) {
      hasConflict = true;
      conflictMessage = 'Mês definido, selecione modalidade de gozo';
    }

    // 2. Mês NÃO selecionado mas alguma modalidade/observação foi assinalada
    if (!isPlanned && (plan.gozar30Dias || plan.trabalharPrimeiros10Dias || plan.trabalharUltimos10Dias || plan.observacao.trim() !== '')) {
      hasConflict = true;
      conflictMessage = 'Mês de férias não definido para as opções selecionadas';
    }

    return {
      isPlanned,
      isDirty,
      hasConflict,
      conflictMessage
    };
  };

  // Dynamic values based on coordination search
  const filteredCoords = useMemo(() => {
    return coordenacoes.filter(c => 
      c.nome.toLowerCase().includes(coordSearch.toLowerCase())
    );
  }, [coordenacoes, coordSearch]);

  // Dynamic values based on company search
  const filteredEmpresas = useMemo(() => {
    return empresas.filter(e => 
      e.razaoSocial.toLowerCase().includes(empSearch.toLowerCase())
    );
  }, [empresas, empSearch]);

  // Handle coordination filter toggle
  const toggleCoordFilter = (nome: string) => {
    setSelectedCoords(prev => 
      prev.includes(nome) ? prev.filter(c => c !== nome) : [...prev, nome]
    );
    setCurrentPage(1);
  };

  // Handle company filter toggle
  const toggleEmpFilter = (nome: string) => {
    setSelectedEmps(prev => 
      prev.includes(nome) ? prev.filter(e => e !== nome) : [...prev, nome]
    );
    setCurrentPage(1);
  };

  // Sort and filter logic for Employees
  const filteredEmployeesList = useMemo(() => {
    let result = [...employees];

    // Filter by general search (Name, CPF, Matricula)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(emp => 
        emp.nome.toLowerCase().includes(q) ||
        emp.matricula.toLowerCase().includes(q) ||
        emp.cpf.replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
        emp.cpf.includes(q)
      );
    }

    // Filter by selected coordinations (multi-select)
    if (selectedCoords.length > 0) {
      result = result.filter(emp => selectedCoords.includes(emp.coordenacao));
    }

    // Filter by selected companies (multi-select)
    if (selectedEmps.length > 0) {
      result = result.filter(emp => selectedEmps.includes(emp.empresa));
    }

    // Sort
    result.sort((a, b) => {
      let valA: string = '';
      let valB: string = '';

      if (sortField === 'nome') {
        valA = a.nome;
        valB = b.nome;
      } else if (sortField === 'matricula') {
        valA = a.matricula;
        valB = b.matricula;
      } else if (sortField === 'cpf') {
        valA = a.cpf;
        valB = b.cpf;
      } else if (sortField === 'especialidade') {
        valA = a.especialidade;
        valB = b.especialidade;
      } else if (sortField === 'empresa') {
        valA = a.empresa;
        valB = b.empresa;
      } else if (sortField === 'coordenacao') {
        valA = a.coordenacao;
        valB = b.coordenacao;
      } else if (sortField === 'month') {
        const pKeyA = `${a.id}_${selectedYear}`;
        const pKeyB = `${b.id}_${selectedYear}`;
        valA = editedPlans[pKeyA]?.month || '';
        valB = editedPlans[pKeyB]?.month || '';
      }

      if (sortOrder === 'asc') {
        return valA.localeCompare(valB);
      } else {
        return valB.localeCompare(valA);
      }
    });

    return result;
  }, [employees, searchQuery, selectedCoords, selectedEmps, sortField, sortOrder, editedPlans, selectedYear]);

  // Pagination bounds
  const totalPages = Math.ceil(filteredEmployeesList.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEmployeesList.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEmployeesList, currentPage, itemsPerPage]);

  // Adjust pagination if page out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortHeader = ({ field, label, className = '' }: { field: SortField; label: string; className?: string }) => (
    <th 
      onClick={() => handleSort(field)}
      className={`px-1.5 py-2 text-left text-[10.5px] font-bold text-white uppercase tracking-wider select-none cursor-pointer hover:bg-white/5 transition-all group ${className}`}
    >
      <div className="flex items-center gap-1 justify-between min-w-0">
        <span className="truncate" title={label}>{label}</span>
        <ArrowUpDown className="h-3 w-3 text-brand-muted/60 group-hover:text-white transition-colors shrink-0" />
      </div>
    </th>
  );

  // --- ANNUAL SCHEDULE HELPER FUNCTIONS & COMPUTED MEMOS ---
  
  // Month icon getter helper
  const getMonthIcon = (month: string) => {
    switch (month) {
      case 'Janeiro': return Sun;
      case 'Fevereiro': return Compass;
      case 'Março': return Palmtree;
      case 'Abril': return Map;
      case 'Maio': return Camera;
      case 'Junho': return Ticket;
      case 'Julho': return Tent;
      case 'Agosto': return Sailboat;
      case 'Setembro': return TreePine;
      case 'Outubro': return Briefcase;
      case 'Novembro': return Plane;
      case 'Dezembro': return Sparkles;
      default: return Calendar;
    }
  };

  // Occupancy details helper
  const getOccupancyInfo = (count: number, total: number) => {
    if (count === 0) return { label: 'Vazio', bg: 'bg-white/5 text-white/50 border-white/5', progressColor: 'bg-white/20' };
    const pct = total > 0 ? (count / total) * 100 : 0;
    if (pct <= 10) return { label: 'Baixo', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', progressColor: 'bg-emerald-500' };
    if (pct <= 25) return { label: 'Médio', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20', progressColor: 'bg-amber-500' };
    return { label: 'Alto', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20', progressColor: 'bg-rose-500' };
  };

  // Initials generator helper
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Modalidade details badge mapper
  const getModalidadeBadge = (plan: VacationPlan) => {
    if (plan.gozar30Dias) {
      return {
        label: '30 Dias Gozo',
        fullLabel: 'Gozar os 30 dias de férias',
        style: 'bg-[#0d3466]/40 text-[#c8e1ff] border-brand-accent/20'
      };
    }
    if (plan.trabalharPrimeiros10Dias && plan.trabalharUltimos10Dias) {
      return {
        label: 'Trab. Início e Fim (10+10d)',
        fullLabel: 'Primeiros e últimos 10 dias trabalhados',
        style: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
      };
    }
    if (plan.trabalharPrimeiros10Dias) {
      return {
        label: 'Trab. Início (10d)',
        fullLabel: 'Primeiros 10 dias trabalhados',
        style: 'bg-amber-500/10 text-amber-300 border-amber-500/25'
      };
    }
    if (plan.trabalharUltimos10Dias) {
      return {
        label: 'Trab. Fim (10d)',
        fullLabel: 'Últimos 10 dias trabalhados',
        style: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/25'
      };
    }
    return {
      label: 'Indefinido',
      fullLabel: 'Modalidade de férias não definida',
      style: 'bg-white/5 text-white/50 border-white/10'
    };
  };

  // Unique lists for detailed modal filters
  const uniqueDetailCompanies = useMemo(() => {
    const list = employees.map(e => e.empresa).filter(Boolean);
    return Array.from(new Set(list)).sort();
  }, [employees]);

  const uniqueDetailCoords = useMemo(() => {
    const list = employees.map(e => e.coordenacao).filter(Boolean);
    return Array.from(new Set(list)).sort();
  }, [employees]);

  const uniqueDetailSpecialties = useMemo(() => {
    const list = employees.map(e => e.especialidade).filter(Boolean);
    return Array.from(new Set(list)).sort();
  }, [employees]);

  // Dynamic filter for detailed month modal List of Employees
  const detailedEmployeesList = useMemo(() => {
    if (!selectedDetailMonth) return [];

    let result = employees.filter(emp => {
      const plan = editedPlans[`${emp.id}_${selectedYear}`];
      return plan && plan.month === selectedDetailMonth;
    });

    if (detailCompanyFilter) {
      result = result.filter(emp => emp.empresa === detailCompanyFilter);
    }
    if (detailCoordFilter) {
      result = result.filter(emp => emp.coordenacao === detailCoordFilter);
    }
    if (detailSpecialtyFilter) {
      result = result.filter(emp => emp.especialidade === detailSpecialtyFilter);
    }
    if (detailSearchQuery) {
      const q = detailSearchQuery.toLowerCase();
      result = result.filter(emp => emp.nome.toLowerCase().includes(q));
    }
    if (detailModeFilter) {
      result = result.filter(emp => {
        const plan = editedPlans[`${emp.id}_${selectedYear}`];
        if (!plan) return false;
        
        switch (detailModeFilter) {
          case '30_dias':
            return plan.gozar30Dias;
          case 'p10':
            return plan.trabalharPrimeiros10Dias;
          case 'u10':
            return plan.trabalharUltimos10Dias;
          default:
            return true;
        }
      });
    }

    result.sort((a, b) => a.nome.localeCompare(b.nome));
    return result;
  }, [selectedDetailMonth, employees, editedPlans, selectedYear, detailCompanyFilter, detailCoordFilter, detailSpecialtyFilter, detailModeFilter, detailSearchQuery]);

  // Compute live statistics for the Cronograma dashboard and Indicators
  const stats = useMemo(() => {
    const monthCounts: Record<string, number> = {};
    meses.forEach(m => {
      monthCounts[m] = 0;
    });

    let totalPlanejado = 0;

    // Filter employees based on the active global/exterior filters
    let filteredList = employees;
    if (detailCompanyFilter) {
      filteredList = filteredList.filter(emp => emp.empresa === detailCompanyFilter);
    }
    if (detailCoordFilter) {
      filteredList = filteredList.filter(emp => emp.coordenacao === detailCoordFilter);
    }
    if (detailSpecialtyFilter) {
      filteredList = filteredList.filter(emp => emp.especialidade === detailSpecialtyFilter);
    }
    if (detailSearchQuery) {
      const q = detailSearchQuery.toLowerCase();
      filteredList = filteredList.filter(emp => emp.nome.toLowerCase().includes(q));
    }
    if (detailModeFilter) {
      filteredList = filteredList.filter(emp => {
        const plan = editedPlans[`${emp.id}_${selectedYear}`];
        if (!plan) return false;
        
        switch (detailModeFilter) {
          case '30_dias':
            return plan.gozar30Dias;
          case 'p10':
            return plan.trabalharPrimeiros10Dias;
          case 'u10':
            return plan.trabalharUltimos10Dias;
          default:
            return true;
        }
      });
    }

    filteredList.forEach(emp => {
      const plan = editedPlans[`${emp.id}_${selectedYear}`];
      if (plan && plan.month && meses.includes(plan.month)) {
        monthCounts[plan.month]++;
        totalPlanejado++;
      }
    });

    const totalSemPlanejamento = Math.max(0, filteredList.length - totalPlanejado);

    // Find custom high/low concentration months
    let maxMonth = 'Nenhum';
    let maxVal = -1;
    let minMonth = 'Nenhum';
    let minVal = Infinity;

    meses.forEach(m => {
      const cnt = monthCounts[m];
      if (cnt > maxVal) {
        maxVal = cnt;
        maxMonth = m;
      }
      if (cnt > 0 && cnt < minVal) {
        minVal = cnt;
        minMonth = m;
      }
    });

    if (maxVal <= 0) {
      maxMonth = 'Nenhum';
      maxVal = 0;
    }
    if (minVal === Infinity) {
      minMonth = 'Nenhum';
      minVal = 0;
    }

    return {
      monthCounts,
      totalPlanejado,
      totalSemPlanejamento,
      maxMonth,
      maxVal,
      minMonth,
      minVal,
      totalFiltrados: filteredList.length
    };
  }, [employees, editedPlans, selectedYear, meses, detailCompanyFilter, detailCoordFilter, detailSpecialtyFilter, detailSearchQuery, detailModeFilter]);

  return (
    <div className="animate-fade-in space-y-6">
      
      {/* 2. Top Navigation Tabs */}
      <div className="flex bg-black/25 p-1 rounded-xl w-fit border border-white/5 select-none shrink-0 shadow-inner">
        <button
          onClick={() => setActiveTab2('planejamento')}
          className={`flex items-center gap-2.5 px-6 py-2.5 rounded-lg transition-all text-xs font-bold cursor-pointer hover:scale-[1.01] active:scale-[0.98] ${
            activeTab === 'planejamento' 
              ? 'bg-brand-accent text-[#034289] shadow-md shadow-brand-accent/10 font-extrabold' 
              : 'text-white/80 hover:text-white hover:bg-white/5'
          }`}
        >
          <Calendar className="w-4 h-4 shrink-0" />
          <span>Planejamento de Férias</span>
        </button>
        <button
          onClick={() => setActiveTab2('cronograma')}
          className={`flex items-center gap-2.5 px-6 py-2.5 rounded-lg transition-all text-xs font-bold cursor-pointer hover:scale-[1.01] active:scale-[0.98] ${
            activeTab === 'cronograma' 
              ? 'bg-brand-accent text-[#034289] shadow-md shadow-brand-accent/10 font-extrabold' 
              : 'text-white/80 hover:text-white hover:bg-white/5'
          }`}
        >
          <Calendar className="w-4 h-4 shrink-0" />
          <span>Cronograma Anual</span>
        </button>
      </div>

      {activeTab === 'planejamento' ? (
        <div className="space-y-6 animate-fade-in">
          {/* 2. Top Header Panel (Selector of Year and Stats) */}
          <div className="sit-panel p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="typ-subtitle">MÓDULO DE FÉRIAS</span>
          <h2 className="typ-hero mt-1.5">Planejamento Anual de Férias</h2>
          <p className="typ-card-desc mt-1 max-w-xl">
            Gerencie de forma centralizada a escala anual, modalidades de gozo, períodos e observações de férias dos funcionários do sistema.
          </p>
        </div>

        {/* Rotative Year Selection */}
        <div className="flex items-center gap-4 bg-black/35 py-2.5 px-5 rounded-2xl border border-white/10 shadow-lg shrink-0 select-none">
          <button 
            onClick={handlePrevYear}
            className="p-1 px-2 rounded-lg text-brand-accent hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Ano Anterior"
          >
            <ChevronLeft className="w-5 h-5 shrink-0" />
          </button>
          <span className="text-xl font-black font-sans text-white tracking-widest px-2">{selectedYear}</span>
          <button 
            onClick={handleNextYear}
            className="p-1 px-2 rounded-lg text-brand-accent hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Próximo Ano"
          >
            <ChevronRight className="w-5 h-5 shrink-0" />
          </button>
        </div>

        {/* Actions Button Group */}
        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full md:w-auto">
          {/* Global Save Button */}
          <button
            onClick={handleSavePlanning}
            className="sit-button-primary w-full sm:w-auto inline-flex justify-center items-center gap-2 rounded-lg px-5 py-3 text-xs sm:text-sm font-bold shadow-md cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.98] shrink-0"
          >
            <Save className="w-4 h-4 text-white" />
            <span>Salvar Planejamento</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {showSuccessToast && (
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl animate-slide-up shadow-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* 3. Toolbar (Filtro por Coordenação, Filtro por Empresa, Busca Geral) */}
      <div className="sit-panel p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Filtro por Coordenação (Dropdown) */}
        <div className="flex flex-col gap-1.5 relative" ref={coordDropdownRef}>
          <label className="text-[10px] font-bold text-brand-muted tracking-wide uppercase select-none flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-brand-accent" />
            <span>Filtrar por Coordenação ({selectedCoords.length})</span>
          </label>
          <button
            onClick={() => setShowCoordDropdown(!showCoordDropdown)}
            className="sit-input w-full rounded-lg py-2.5 px-3.5 text-xs font-semibold text-left flex justify-between items-center bg-black/20"
          >
            <span className="truncate">
              {selectedCoords.length === 0 
                ? 'Todas as Coordenações' 
                : `${selectedCoords.length} selecionada(s)`}
            </span>
            <span className="text-brand-muted shrink-0 text-[10px]">▼</span>
          </button>

          {showCoordDropdown && (
            <div className="absolute top-[102%] left-0 right-0 z-30 bg-brand-panel-light p-3 rounded-xl border border-white/10 shadow-2xl max-h-60 overflow-y-auto styled-scrollbars-light animate-fade-in">
              <input
                type="text"
                placeholder="Pesquisar coordenação..."
                value={coordSearch}
                onChange={(e) => setCoordSearch(e.target.value)}
                className="sit-input w-full rounded-md py-1.5 px-2.5 text-xs mb-2 bg-black/30 placeholder:text-brand-muted/70"
              />
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {coordenacoes.length === 0 && (
                  <p className="text-[11px] italic text-brand-muted py-1">Nenhuma coordenação cadastrada.</p>
                )}
                {filteredCoords.length === 0 && coordenacoes.length > 0 && (
                  <p className="text-[11px] italic text-brand-muted py-1">Nenhum resultado.</p>
                )}
                {filteredCoords.map(c => {
                  const isChecked = selectedCoords.includes(c.nome);
                  return (
                    <label 
                      key={c.id} 
                      className="flex items-center gap-2 py-1 px-1.5 rounded hover:bg-black/15 cursor-pointer text-xs select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCoordFilter(c.nome)}
                        className="accent-brand-accent rounded w-3.5 h-3.5"
                      />
                      <span className="text-white truncate font-semibold">{c.nome}</span>
                    </label>
                  );
                })}
              </div>
              {selectedCoords.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedCoords([])}
                  className="w-full text-center mt-2.5 pt-2 border-t border-white/5 text-[10.5px] font-bold text-brand-accent hover:text-white transition-colors"
                >
                  Limpar Filtros
                </button>
              )}
            </div>
          )}
        </div>

        {/* Filtro por Empresa (Dropdown) */}
        <div className="flex flex-col gap-1.5 relative" ref={empDropdownRef}>
          <label className="text-[10px] font-bold text-brand-muted tracking-wide uppercase select-none flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-brand-accent" />
            <span>Filtrar por Empresa ({selectedEmps.length})</span>
          </label>
          <button
            onClick={() => setShowEmpDropdown(!showEmpDropdown)}
            className="sit-input w-full rounded-lg py-2.5 px-3.5 text-xs font-semibold text-left flex justify-between items-center bg-black/20"
          >
            <span className="truncate">
              {selectedEmps.length === 0 
                ? 'Todas as Empresas' 
                : `${selectedEmps.length} selecionada(s)`}
            </span>
            <span className="text-brand-muted shrink-0 text-[10px]">▼</span>
          </button>

          {showEmpDropdown && (
            <div className="absolute top-[102%] left-0 right-0 z-30 bg-brand-panel-light p-3 rounded-xl border border-white/10 shadow-2xl max-h-60 overflow-y-auto styled-scrollbars-light animate-fade-in">
              <input
                type="text"
                placeholder="Pesquisar empresa..."
                value={empSearch}
                onChange={(e) => setEmpSearch(e.target.value)}
                className="sit-input w-full rounded-md py-1.5 px-2.5 text-xs mb-2 bg-black/30 placeholder:text-brand-muted/70"
              />
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {empresas.length === 0 && (
                  <p className="text-[11px] italic text-brand-muted py-1">Nenhuma empresa cadastrada.</p>
                )}
                {filteredEmpresas.length === 0 && empresas.length > 0 && (
                  <p className="text-[11px] italic text-brand-muted py-1">Nenhum resultado.</p>
                )}
                {filteredEmpresas.map(emp => {
                  const isChecked = selectedEmps.includes(emp.razaoSocial);
                  return (
                    <label 
                      key={emp.id} 
                      className="flex items-center gap-2 py-1 px-1.5 rounded hover:bg-black/15 cursor-pointer text-xs select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleEmpFilter(emp.razaoSocial)}
                        className="accent-brand-accent rounded w-3.5 h-3.5"
                      />
                      <span className="text-white truncate font-semibold">{emp.razaoSocial}</span>
                    </label>
                  );
                })}
              </div>
              {selectedEmps.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedEmps([])}
                  className="w-full text-center mt-2.5 pt-2 border-t border-white/5 text-[10.5px] font-bold text-brand-accent hover:text-white transition-colors"
                >
                  Limpar Filtros
                </button>
              )}
            </div>
          )}
        </div>

        {/* Busca Geral */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-brand-muted tracking-wide uppercase select-none flex items-center gap-1">
            <Search className="w-3.5 h-3.5 text-brand-accent" />
            <span>Busca Geral</span>
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Pesquise por Nome, Matrícula ou CPF..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="sit-input block w-full rounded-lg py-2.5 pl-3.5 pr-10 text-xs text-white"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-brand-muted hover:text-white"
              >
                <X className="w-4 h-4 shrink-0" />
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Active Filter Badges */}
      {(selectedCoords.length > 0 || selectedEmps.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-[#0d3466]/40 border rounded-xl border-brand-border/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mr-1">Filtros ativos:</span>
          {selectedCoords.map(coord => (
            <span key={coord} className="inline-flex items-center gap-1.5 rounded-md bg-brand-accent/15 border border-brand-accent/30 px-2 py-0.5 text-xs text-brand-accent font-medium">
              <span>{coord}</span>
              <button onClick={() => toggleCoordFilter(coord)} className="hover:bg-brand-accent/20 rounded-full p-0.5 cursor-pointer">
                <X className="w-3 h-3 shrink-0" />
              </button>
            </span>
          ))}
          {selectedEmps.map(emp => (
            <span key={emp} className="inline-flex items-center gap-1.5 rounded-md bg-brand-accent/15 border border-brand-accent/30 px-2 py-0.5 text-xs text-brand-accent font-medium">
              <span>{emp}</span>
              <button onClick={() => toggleEmpFilter(emp)} className="hover:bg-brand-accent/20 rounded-full p-0.5 cursor-pointer">
                <X className="w-3 h-3 shrink-0" />
              </button>
            </span>
          ))}
          <button
            onClick={() => { setSelectedCoords([]); setSelectedEmps([]); }}
            className="text-[10.5px] font-bold text-brand-muted hover:text-white underline decoration-dotted underline-offset-4 ml-auto"
          >
            Limpar todos
          </button>
        </div>
      )}

      {/* 4. Main Vacation Grade (Table) */}
      <div className="sit-panel overflow-hidden border border-brand-border/40 shadow-xl rounded-2xl">
        <div className="overflow-x-auto styled-scrollbars transition-all">
          <table className="w-full divide-y divide-white/10 table-fixed">
            <thead className="bg-[#0b3365]">
              <tr>
                <SortHeader field="nome" label="Nome" className="w-[28%] min-w-[180px]" />
                <SortHeader field="matricula" label="Mat" className="w-[8%] min-w-[40px]" />
                <SortHeader field="especialidade" label="Especialidade" className="w-[10%] min-w-[85px]" />
                <SortHeader field="coordenacao" label="Coord." className="w-[11%] min-w-[85px]" />
                
                {/* Fixed Inputs columns */}
                <SortHeader field="month" label="Mês" className="w-[11%] min-w-[90px]" />
                
                <th className="px-1 py-2 text-center text-[10px] font-bold text-white uppercase tracking-wider select-none w-[7%] min-w-[50px] leading-tight" title="Gozar os 30 dias de férias">
                  Gozar 30d
                </th>
                <th className="px-1 py-2 text-center text-[10px] font-bold text-white uppercase tracking-wider select-none w-[7%] min-w-[55px] leading-tight" title="Trabalhar os primeiros 10 dias">
                  Trab 1ºs 10d
                </th>
                <th className="px-1 py-2 text-center text-[10px] font-bold text-white uppercase tracking-wider select-none w-[7%] min-w-[55px] leading-tight" title="Trabalhar os últimos 10 dias">
                  Trab Últ 10d
                </th>
                <th className="px-1.5 py-2 text-left text-[10px] font-bold text-white uppercase tracking-wider select-none w-[14%] min-w-[100px]">
                  Observação
                </th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-white/5 bg-black/5">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-brand-muted/70 italic text-sm">
                    Nenhum colaborador encontrado com base nos filtros especificados.
                  </td>
                </tr>
              ) : (
                currentItems.map((emp) => {
                  const key = `${emp.id}_${selectedYear}`;
                  const plan = editedPlans[key] || {
                    employeeId: emp.id,
                    year: selectedYear,
                    month: '',
                    gozar30Dias: false,
                    trabalharPrimeiros10Dias: false,
                    trabalharUltimos10Dias: false,
                    observacao: ''
                  };

                  const { isPlanned, isDirty, hasConflict, conflictMessage } = getPlanStatus(emp.id);

                  // Decide highlight background classes
                  let bgClass = "hover:bg-brand-panel-light/5 transition-colors border-l-2 border-transparent";
                  if (isDirty) {
                    bgClass = "bg-emerald-500/10 hover:bg-emerald-500/15 border-l-2 border-emerald-400 transition-colors";
                  }

                  return (
                    <tr key={emp.id} className={bgClass}>
                      {/* Nome Completo */}
                      <td className="px-1.5 py-1.5 text-[11px] font-bold text-white truncate max-w-[180px]" title={emp.nome}>
                        <div className="flex flex-col min-w-0">
                          <span className="truncate">{emp.nome}</span>
                          {isDirty && (
                            <span className="text-[8px] font-black tracking-widest text-[#6ee7b7] mt-0.5 animate-pulse uppercase leading-none">[Alterado]</span>
                          )}
                        </div>
                      </td>

                      {/* Matrícula */}
                      <td className="px-1.5 py-1.5 text-[10.5px] font-mono text-brand-muted font-semibold truncate max-w-[40px]" title={emp.matricula}>
                        {emp.matricula}
                      </td>

                      {/* Especialidade */}
                      <td className="px-1.5 py-1.5 text-[10.5px] text-white/90 truncate max-w-[85px]" title={emp.especialidade}>
                        {emp.especialidade}
                      </td>

                      {/* Coordenação */}
                      <td className="px-1.5 py-1.5 text-[10.5px] text-brand-muted truncate max-w-[85px]" title={emp.coordenacao}>
                        {emp.coordenacao}
                      </td>

                      {/* Mês de Férias (Select) */}
                      <td className="px-1 py-1 w-[11%] min-w-[90px]">
                        <select
                          value={plan.month}
                          onChange={(e) => handleCellChange(emp.id, 'month', e.target.value)}
                          className={`sit-input py-0.5 px-1.5 rounded text-[10.5px] font-semibold cursor-pointer w-full text-white ${
                            plan.month ? 'bg-[#0d3466]' : 'bg-black/35 text-white/40 border-white/5'
                          }`}
                        >
                          <option value="" className="bg-brand-panel text-white/60">-- Mês --</option>
                          {meses.map((m) => (
                            <option key={m} value={m} className="bg-brand-panel">{m}</option>
                          ))}
                        </select>
                      </td>

                      {/* Gozar os 30 dias de férias (Checkbox) */}
                      <td className="px-1 py-1 text-center w-[7%] min-w-[50px]">
                        <input
                          type="checkbox"
                          checked={plan.gozar30Dias}
                          onChange={(e) => handleCellChange(emp.id, 'gozar30Dias', e.target.checked)}
                          className="accent-brand-accent rounded w-3.5 h-3.5 cursor-pointer mx-auto block"
                        />
                      </td>

                      {/* Trabalhar os primeiros 10 dias (Checkbox) */}
                      <td className="px-1 py-1 text-center w-[7%] min-w-[55px]">
                        <input
                          type="checkbox"
                          checked={plan.trabalharPrimeiros10Dias}
                          disabled={plan.gozar30Dias}
                          onChange={(e) => handleCellChange(emp.id, 'trabalharPrimeiros10Dias', e.target.checked)}
                          className="accent-brand-accent rounded w-3.5 h-3.5 cursor-pointer mx-auto block disabled:opacity-30 disabled:cursor-not-allowed"
                        />
                      </td>

                      {/* Trabalhar os últimos 10 dias (Checkbox) */}
                      <td className="px-1 py-1 text-center w-[7%] min-w-[55px]">
                        <input
                          type="checkbox"
                          checked={plan.trabalharUltimos10Dias}
                          disabled={plan.gozar30Dias}
                          onChange={(e) => handleCellChange(emp.id, 'trabalharUltimos10Dias', e.target.checked)}
                          className="accent-brand-accent rounded w-3.5 h-3.5 cursor-pointer mx-auto block disabled:opacity-30 disabled:cursor-not-allowed"
                        />
                      </td>

                      {/* Observação */}
                      <td className="px-1 py-1 w-[14%] min-w-[100px]">
                        <input
                          type="text"
                          value={plan.observacao}
                          placeholder="Obs..."
                          title={plan.observacao}
                          onChange={(e) => handleCellChange(emp.id, 'observacao', e.target.value)}
                          className="sit-input w-full py-0.5 px-1.5 rounded text-[10.5px] placeholder:text-brand-muted/30 font-medium"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="bg-[#0b3365] px-4 py-3.5 flex items-center justify-between border-t border-white/10 select-none">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="relative inline-flex items-center bg-black/20 rounded-md border border-white/10 px-4 py-2 text-xs font-bold text-brand-muted hover:text-white disabled:opacity-40 cursor-pointer"
              >
                Anterior
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="relative ml-2 inline-flex items-center bg-black/20 rounded-md border border-white/10 px-4 py-2 text-xs font-bold text-brand-muted hover:text-white disabled:opacity-40 cursor-pointer"
              >
                Próximo
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-brand-muted font-medium">
                  Exibindo de <span className="font-bold text-white">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredEmployeesList.length)}</span> a{' '}
                  <span className="font-bold text-white">{Math.min(currentPage * itemsPerPage, filteredEmployeesList.length)}</span> de{' '}
                  <span className="font-bold text-white">{filteredEmployeesList.length}</span> funcionários
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm gap-1" aria-label="Pagination">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="relative inline-flex items-center rounded-l-md bg-black/25 border border-white/10 p-2 text-xs text-brand-muted hover:bg-black/40 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span className="sr-only">Anterior</span>
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                  
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`relative inline-flex items-center px-3.5 py-2 text-xs font-bold border rounded-md transition-all ${
                          currentPage === pageNum
                            ? 'bg-brand-accent/20 border-brand-accent text-[#6ee7b7]'
                            : 'bg-black/25 border-white/10 text-brand-muted hover:text-white hover:bg-black/40'
                        } cursor-pointer`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="relative inline-flex items-center rounded-r-md bg-black/25 border border-white/10 p-2 text-xs text-brand-muted hover:bg-black/40 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span className="sr-only">Próximo</span>
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    ) : (
        <div className="space-y-8 animate-fade-in">
          {/* Header & Year Selector inside Cronograma */}
          <div className="sit-panel p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <span className="typ-subtitle">MÓDULO DE FÉRIAS</span>
              <h2 className="typ-hero mt-1.5 font-black">Cronograma Anual de Férias</h2>
              <p className="typ-card-desc mt-1 max-w-xl">
                Visão consolidada anual e distribuição de escalas. As informações refletem em tempo real as configurações do Planejamento.
              </p>
            </div>

            {/* Rotative Year Selection */}
            <div className="flex items-center gap-4 bg-black/35 py-2.5 px-5 rounded-2xl border border-white/10 shadow-lg shrink-0 select-none">
              <button 
                onClick={handlePrevYear}
                className="p-1 px-2 rounded-lg text-brand-accent hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Ano Anterior"
              >
                <ChevronLeft className="w-5 h-5 shrink-0" />
              </button>
              <span className="text-xl font-black font-sans text-white tracking-widest px-2">{selectedYear}</span>
              <button 
                onClick={handleNextYear}
                className="p-1 px-2 rounded-lg text-brand-accent hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Próximo Ano"
              >
                <ChevronRight className="w-5 h-5 shrink-0" />
              </button>
            </div>
          </div>

          {/* Indicators Panel (4 cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Indicator 1: Total Planejado */}
            <div className="sit-panel p-5 relative overflow-hidden group hover:border-white/10 transition-all duration-300">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Calendar className="w-20 h-20 text-brand-accent" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">Total Planejado ({selectedYear})</span>
                <span className="text-3xl font-black text-brand-accent mt-1">{stats.totalPlanejado}</span>
                <span className="text-xs text-white/50 mt-1">Colaboradores com escala definida</span>
              </div>
            </div>

            {/* Indicator 2: Mês Mais Concorrido */}
            <div className="sit-panel p-5 relative overflow-hidden group hover:border-white/10 transition-all duration-300">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Sun className="w-20 h-20 text-emerald-400" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">Mês Mais Concorrido</span>
                <span className="text-xl font-extrabold text-emerald-400 mt-2 truncate">
                  {stats.maxVal > 0 ? `${stats.maxMonth} (${stats.maxVal} func)` : 'Nenhum'}
                </span>
                <span className="text-xs text-white/50 mt-1">
                  {stats.maxVal > 0 ? `${stats.maxVal} funcionário(s) programado(s)` : 'Nenhuma escala definida'}
                </span>
              </div>
            </div>

            {/* Indicator 3: Mês com Menor Concentração */}
            <div className="sit-panel p-5 relative overflow-hidden group hover:border-white/10 transition-all duration-300">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Compass className="w-20 h-20 text-cyan-400" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">Menor Concentração</span>
                <span className="text-xl font-extrabold text-cyan-400 mt-2 truncate">
                  {stats.minVal > 0 ? `${stats.minMonth} (${stats.minVal} func)` : 'Nenhum'}
                </span>
                <span className="text-xs text-white/50 mt-1">
                  {stats.minVal > 0 ? `${stats.minVal} funcionário(s) programado(s)` : 'Nenhuma escala definida'}
                </span>
              </div>
            </div>

            {/* Indicator 4: Sem Planejamento */}
            <div className="sit-panel p-5 relative overflow-hidden group hover:border-white/10 transition-all duration-300">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <AlertTriangle className="w-20 h-20 text-rose-400" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">Faltando Planejamento</span>
                <span className="text-3xl font-black text-rose-400 mt-1">{stats.totalSemPlanejamento}</span>
                <span className="text-xs text-white/50 mt-1">Colaboradores sem mês definido</span>
              </div>
            </div>

          </div>

          {/* Filtros do Dashboard do Cronograma Anual */}
          <div className="sit-panel p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 relative min-w-0 w-full overflow-hidden">
            {/* Busca por nome */}
            <div className="flex flex-col gap-1.5 min-w-0">
              <label className="text-[10px] font-black tracking-wider text-brand-muted uppercase flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-brand-accent shrink-0" />
                <span className="truncate">Nome do Funcionário</span>
              </label>
              <div className="relative mt-1">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-white/40" />
                <input
                  type="text"
                  placeholder="Buscar por nome..."
                  value={detailSearchQuery}
                  onChange={(e) => setDetailSearchQuery(e.target.value)}
                  className="sit-input w-full pl-8 py-1.5 rounded-lg text-xs placeholder:text-white/20 text-white bg-black/35 border-white/5 focus:border-brand-accent focus:ring-1 focus:ring-brand-accent min-w-0"
                />
              </div>
            </div>

            {/* Empresa */}
            <div className="flex flex-col gap-1.5 min-w-0">
              <label className="text-[10px] font-black tracking-wider text-brand-muted uppercase flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-brand-accent shrink-0" />
                <span className="truncate">Empresa</span>
              </label>
              <select
                value={detailCompanyFilter}
                onChange={(e) => setDetailCompanyFilter(e.target.value)}
                className="sit-input w-full py-1.5 px-2.5 rounded-lg text-xs font-semibold cursor-pointer text-white bg-black/35 border-white/5 mt-1 min-w-0 truncate"
              >
                <option value="" className="bg-[#082142]">Todas</option>
                {uniqueDetailCompanies.map(c => (
                  <option key={c} value={c} className="bg-[#082142]">{c}</option>
                ))}
              </select>
            </div>

            {/* Coordenação */}
            <div className="flex flex-col gap-1.5 min-w-0">
              <label className="text-[10px] font-black tracking-wider text-brand-muted uppercase flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-brand-accent shrink-0" />
                <span className="truncate">Coordenação</span>
              </label>
              <select
                value={detailCoordFilter}
                onChange={(e) => setDetailCoordFilter(e.target.value)}
                className="sit-input w-full py-1.5 px-2.5 rounded-lg text-xs font-semibold cursor-pointer text-white bg-black/35 border-white/5 mt-1 min-w-0 truncate"
              >
                <option value="" className="bg-[#082142]">Todas</option>
                {uniqueDetailCoords.map(c => (
                  <option key={c} value={c} className="bg-[#082142]">{c}</option>
                ))}
              </select>
            </div>

            {/* Especialidade */}
            <div className="flex flex-col gap-1.5 min-w-0">
              <label className="text-[10px] font-black tracking-wider text-brand-muted uppercase flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-brand-accent shrink-0" />
                <span className="truncate">Especialidade</span>
              </label>
              <select
                value={detailSpecialtyFilter}
                onChange={(e) => setDetailSpecialtyFilter(e.target.value)}
                className="sit-input w-full py-1.5 px-2.5 rounded-lg text-xs font-semibold cursor-pointer text-white bg-black/35 border-white/5 mt-1 min-w-0 truncate"
              >
                <option value="" className="bg-[#082142]">Todas</option>
                {uniqueDetailSpecialties.map(s => (
                  <option key={s} value={s} className="bg-[#082142]">{s}</option>
                ))}
              </select>
            </div>

            {/* Modalidade */}
            <div className="flex flex-col gap-1.5 min-w-0">
              <label className="text-[10px] font-black tracking-wider text-brand-muted uppercase flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-brand-accent shrink-0" />
                <span className="truncate">Modalidade</span>
              </label>
              <div className="flex gap-2 items-center mt-1 min-w-0 w-full">
                <select
                  value={detailModeFilter}
                  onChange={(e) => setDetailModeFilter(e.target.value)}
                  className="sit-input flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold cursor-pointer text-white bg-black/35 border-white/5 min-w-0 w-full truncate"
                >
                  <option value="" className="bg-[#082142]">Todas</option>
                  <option value="30_dias" className="bg-[#082142]">30 Dias</option>
                  <option value="p10" className="bg-[#082142]">Primeiros 10 Dias</option>
                  <option value="u10" className="bg-[#082142]">Últimos 10 Dias</option>
                </select>
                {(detailSearchQuery || detailCompanyFilter || detailCoordFilter || detailSpecialtyFilter || detailModeFilter) && (
                  <button
                    onClick={() => {
                      setDetailSearchQuery('');
                      setDetailCompanyFilter('');
                      setDetailCoordFilter('');
                      setDetailSpecialtyFilter('');
                      setDetailModeFilter('');
                    }}
                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-lg border border-rose-500/25 transition-all text-xs font-bold cursor-pointer shrink-0"
                    title="Limpar todos os filtros"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Calendar Grid of Month Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {meses.map((month) => {
              const count = stats.monthCounts[month] || 0;
              const Icon = getMonthIcon(month);
              const occupancy = getOccupancyInfo(count, employees.length);
              const progressPct = employees.length > 0 ? (count / employees.length) * 100 : 0;

              return (
                <div
                  key={month}
                  onClick={() => setSelectedDetailMonth(month)}
                  className="sit-panel p-6 flex flex-col justify-between min-h-[170px] relative transition-all duration-300 hover:border-brand-accent/30 hover:shadow-xl hover:shadow-brand-accent/5 hover:-translate-y-1 group cursor-pointer overflow-hidden"
                >
                  {/* Subtle background glow on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-black text-white tracking-wide group-hover:text-brand-accent transition-colors">
                        {month}
                      </h3>
                      <span className="text-[10px] font-bold text-brand-muted/70 uppercase">
                        Calendário {selectedYear}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-black/25 border border-white/5 text-brand-accent group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-4 h-4 shrink-0" />
                    </div>
                  </div>

                  <div className="mt-8 space-y-3.5 relative z-10">
                    <div className="flex items-end justify-between text-xs">
                      <div>
                        <span className="text-xl font-bold text-white mr-1.5">{count}</span>
                        <span className="text-white/40 text-[11px] font-medium">
                          {count === 1 ? 'Funcionário' : 'Funcionários'}
                        </span>
                      </div>
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${occupancy.bg}`}>
                        {occupancy.label}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${occupancy.progressColor}`}
                          style={{ width: `${Math.max(2, progressPct)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-white/30 font-semibold tracking-wider uppercase">
                        <span>Lotação</span>
                        <span>{Math.round(progressPct)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Modal / Drawer containing the detailed view of selected month */}
          {selectedDetailMonth && createPortal(
            <div 
              onClick={() => setSelectedDetailMonth(null)}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[150] flex items-center justify-center p-4"
            >
              <div
                className="w-full max-w-5xl bg-[#082142] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-scale-up"
                onClick={(e) => e.stopPropagation()}
              >
                
                {/* Modal Header */}
                <div className="p-6 bg-brand-panel border-b border-white/10 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-brand-accent/20 border border-brand-accent/30 rounded-xl text-brand-accent">
                      {React.createElement(getMonthIcon(selectedDetailMonth), { className: 'w-5 h-5 shrink-0' })}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white tracking-wide">
                        Planejamento Detalhado — {selectedDetailMonth}
                      </h3>
                      <p className="text-xs text-brand-muted">
                        Visualização e filtragem gerencial de férias programadas para {selectedDetailMonth} de {selectedYear}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedDetailMonth(null)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-brand-muted hover:text-white transition-all cursor-pointer border border-white/5"
                    title="Fechar"
                  >
                    <X className="w-5 h-5 shrink-0" />
                  </button>
                </div>

                {/* Visual indicator of active filters */}
                {(detailSearchQuery || detailCompanyFilter || detailCoordFilter || detailSpecialtyFilter || detailModeFilter) && (
                  <div className="px-6 py-3 bg-brand-accent/5 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs select-none">
                    <div className="flex items-center gap-2 text-brand-muted font-medium">
                      <Filter className="w-4 h-4 text-brand-accent" />
                      <span>Filtros gerais ativos aplicados:</span>
                      {detailSearchQuery && <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white font-semibold">Busca: "{detailSearchQuery}"</span>}
                      {detailCompanyFilter && <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white font-semibold">Empresa: {detailCompanyFilter}</span>}
                      {detailCoordFilter && <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white font-semibold">Coord: {detailCoordFilter}</span>}
                      {detailSpecialtyFilter && <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white font-semibold">Especialidade: {detailSpecialtyFilter}</span>}
                      {detailModeFilter && <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white font-semibold flex items-center">Modalidade: {detailModeFilter === '30_dias' ? '30 Dias' : detailModeFilter === 'p10' ? 'Primeiros 10 Dias Trabalhados' : 'Últimos 10 Dias Trabalhados'}</span>}
                    </div>
                  </div>
                )}

                {/* Employees planned lists / table body */}
                <div className="flex-1 overflow-y-auto p-6">
                  {detailedEmployeesList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="p-4 rounded-full bg-white/5 border border-white/10 text-brand-muted mb-4 opacity-50">
                        <Users className="w-8 h-8" />
                      </div>
                      <h4 className="text-sm font-semibold text-white">Nenhum funcionário encontrado</h4>
                      <p className="text-xs text-brand-muted/70 mt-1 max-w-sm">
                        Não existem colaboradores programados que atendam aos critérios de busca ou filtros selecionados.
                      </p>
                    </div>
                  ) : (
                    <div className="sit-panel overflow-hidden border border-white/10 shadow-xl rounded-xl">
                      <div className="overflow-x-auto styled-scrollbars scroll-smooth">
                        <table className="w-full divide-y divide-white/10 table-auto">
                          <thead className="bg-[#0b3365]">
                            <tr>
                              <th className="px-4 py-3 text-left text-[10px] font-bold text-white uppercase tracking-wider">Colaborador</th>
                              <th className="px-4 py-3 text-left text-[10px] font-bold text-white uppercase tracking-wider">Empresa</th>
                              <th className="px-4 py-3 text-left text-[10px] font-bold text-white uppercase tracking-wider">Coordenação</th>
                              <th className="px-4 py-3 text-left text-[10px] font-bold text-white uppercase tracking-wider">Especialidade</th>
                              <th className="px-4 py-3 text-left text-[10px] font-bold text-white uppercase tracking-wider">Modalidade</th>
                              <th className="px-4 py-3 text-left text-[10px] font-bold text-white uppercase tracking-wider">Observação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 bg-black/25">
                            {detailedEmployeesList.map((emp) => {
                              const plan = editedPlans[`${emp.id}_${selectedYear}`];
                              const badgeInfo = plan ? getModalidadeBadge(plan) : { label: 'Indefinido', fullLabel: 'Modalidade de férias não definida', style: 'bg-white/5 text-white/50 border-white/10' };

                              return (
                                <tr key={emp.id} className="hover:bg-white/5 transition-colors">
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                      {emp.foto ? (
                                        <img
                                          src={emp.foto}
                                          alt={emp.nome}
                                          className="w-8 h-8 rounded-lg object-cover border border-white/10 shrink-0"
                                          referrerPolicy="no-referrer"
                                        />
                                      ) : (
                                        <div className="w-8 h-8 rounded-lg bg-brand-accent/20 border border-brand-accent/30 flex items-center justify-center text-brand-accent text-[11px] font-bold font-sans shrink-0">
                                          {getInitials(emp.nome)}
                                        </div>
                                      )}
                                      <span className="text-xs font-bold text-white uppercase tracking-wide truncate max-w-[200px]" title={emp.nome}>
                                        {emp.nome}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-xs text-brand-muted font-semibold">
                                    {emp.empresa}
                                  </td>
                                  <td className="px-4 py-3 text-xs text-brand-muted font-semibold">
                                    {emp.coordenacao}
                                  </td>
                                  <td className="px-4 py-3 text-xs text-brand-muted font-semibold">
                                    {emp.especialidade}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span 
                                      title={badgeInfo.fullLabel}
                                      className={`text-[9px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded border inline-block whitespace-nowrap cursor-help select-none ${badgeInfo.style}`}
                                    >
                                      {badgeInfo.label}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-xs">
                                    {plan && plan.observacao ? (
                                      <span className="text-emerald-400 italic font-medium max-w-[200px] truncate block" title={plan.observacao}>
                                        "{plan.observacao}"
                                      </span>
                                    ) : (
                                      <span className="text-white/20 italic">-</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer of modal */}
                <div className="p-4 bg-brand-panel border-t border-white/10 text-right text-[10px] text-brand-muted font-bold tracking-wider uppercase shrink-0">
                  Mostrando {detailedEmployeesList.length} de {
                    employees.filter(emp => {
                      const plan = editedPlans[`${emp.id}_${selectedYear}`];
                      return plan && plan.month === selectedDetailMonth;
                    }).length
                  } programado(s) para o mês
                </div>

              </div>
            </div>,
            document.body
          )}
        </div>
      )}

    </div>
  );
}
