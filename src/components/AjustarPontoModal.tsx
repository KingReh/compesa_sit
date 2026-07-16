import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Search, 
  UserRound, 
  Calendar, 
  Mail, 
  Copy, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Trash2
} from 'lucide-react';
import { Employee, Empresa } from '../types';
import { useAuth } from '../context/AuthContext';
import { pointAdjustmentsService } from '../services/pointAdjustmentsService';

interface AjustarPontoModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  initialEmployee?: Employee | null;
  empresas: Empresa[];
}

// 11-digit formatted CPF helper
export function formatCPF(rawCpf: string | undefined | null): string {
  if (!rawCpf) return '-';
  let clean = rawCpf.replace(/\D/g, '');
  if (clean.length < 11) {
    console.warn('Dado inconsistente: CPF com menos de 11 dígitos', rawCpf);
    clean = clean.padStart(11, '0');
  }
  return `${clean.substring(0, 3)}.${clean.substring(3, 6)}.${clean.substring(6, 9)}-${clean.substring(9, 11)}`;
}

// Phone formatter helper
const formatPhone = (phone: string | undefined | null): string => {
  if (!phone) return '-';
  const clean = phone.replace(/\D/g, '');
  if (!clean) return '-';
  if (clean.length === 11) {
    return `(${clean.substring(0, 2)}) ${clean.substring(2, 7)}-${clean.substring(7, 11)}`;
  }
  if (clean.length === 10) {
    return `(${clean.substring(0, 2)}) ${clean.substring(2, 6)}-${clean.substring(6, 10)}`;
  }
  return phone;
};

// Formatting date to DD/MM/AAAA
const formatDateBR = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

export function AjustarPontoModal({ isOpen, onClose, employees, initialEmployee, empresas }: AjustarPontoModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const { user } = useAuth();

  // General state
  const [selectedColab, setSelectedColab] = useState<Employee | null>(null);
  const [selectedDates, setSelectedDates] = useState<string[]>([]); // Array of 'YYYY-MM-DD'
  const [paraEmails, setParaEmails] = useState<string[]>([]);
  const [ccEmails, setCcEmails] = useState<string[]>([]);

  // Stage 1 search
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Local storage used emails list for autocompletion
  const [savedEmails, setSavedEmails] = useState<string[]>([]);

  // Stage 3 specific autocomplete inputs
  const [paraInput, setParaInput] = useState('');
  const [ccInput, setCcInput] = useState('');
  
  const [paraError, setParaError] = useState(false);
  const [ccError, setCcError] = useState(false);

  const [activeParaSuggestion, setActiveParaSuggestion] = useState(false);
  const [activeCcSuggestion, setActiveCcSuggestion] = useState(false);

  // Stage 2: Custom Calendar state
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());

  // Copy success & toast State
  const [copyStatus, setCopyStatus] = useState<'success' | 'fallback' | 'error' | null>(null);

  // Refs for click-outside on autocompletes
  const paraRef = useRef<HTMLDivElement>(null);
  const ccRef = useRef<HTMLDivElement>(null);

  // Reset states on open/close
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedColab(initialEmployee || null);
      setSelectedDates([]);
      setParaEmails([]);
      setCcEmails([]);
      setSearchQuery('');
      setDebouncedQuery('');
      setParaInput('');
      setCcInput('');
      setParaError(false);
      setCcError(false);
      setCopyStatus(null);
      
      // Load saved emails from localStorage
      try {
        const stored = localStorage.getItem('@sit:used-emails');
        if (stored) {
          setSavedEmails(JSON.parse(stored));
        } else {
          setSavedEmails([]);
        }
      } catch (e) {
        console.error(e);
        setSavedEmails([]);
      }
    }
  }, [isOpen, initialEmployee]);

  // Sync debouncedQuery with searchQuery (RN-02 debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener for autocompletes
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (paraRef.current && !paraRef.current.contains(event.target as Node)) {
        setActiveParaSuggestion(false);
      }
      if (ccRef.current && !ccRef.current.contains(event.target as Node)) {
        setActiveCcSuggestion(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  // Filtrar colaboradores
  const filteredEmployees = (() => {
    let list = [...employees];
    
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase().trim();
      list = list.filter(e => 
        e.nome.toLowerCase().includes(q) || 
        e.matricula.toLowerCase().includes(q)
      );
    } else {
      // Ordenados alfabeticamente
      list.sort((a, b) => a.nome.localeCompare(b.nome));
    }
    return list;
  })();

  const visibleEmployees = filteredEmployees.slice(0, 10);
  const hasMoreThan10 = filteredEmployees.length > 10;

  // Custom Calendar Calculation Helpers
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // Sunday=0

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const handleDateClick = (day: number) => {
    const formattedMonth = String(currentMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;

    if (selectedDates.includes(dateStr)) {
      setSelectedDates(prev => prev.filter(d => d !== dateStr));
    } else {
      setSelectedDates(prev => [...prev, dateStr]);
    }
  };

  const removeDate = (dateStr: string) => {
    setSelectedDates(prev => prev.filter(d => d !== dateStr));
  };

  // Sort dates chronologically ascending (RN-06)
  const sortedSelectedDates = [...selectedDates].sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime();
  });

  // Email Validation Helper (RN-14)
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  const handleAddParaChip = () => {
    const val = paraInput.trim();
    if (!val) return;
    
    // Split on commas or semicolons
    const emails = val.split(/[,,;]+/).map(e => e.trim()).filter(Boolean);
    let allValid = true;
    const newChips: string[] = [];

    emails.forEach(email => {
      if (isValidEmail(email)) {
        if (!paraEmails.includes(email)) {
          newChips.push(email);
        }
      } else {
        allValid = false;
      }
    });

    if (newChips.length > 0) {
      setParaEmails(prev => [...prev, ...newChips]);
      setParaInput('');
      setParaError(false);
      setActiveParaSuggestion(false);
    }

    if (!allValid) {
      setParaError(true);
    }
  };

  const handleAddCcChip = () => {
    const val = ccInput.trim();
    if (!val) return;

    const emails = val.split(/[,,;]+/).map(e => e.trim()).filter(Boolean);
    let allValid = true;
    const newChips: string[] = [];

    emails.forEach(email => {
      if (isValidEmail(email)) {
        if (!ccEmails.includes(email)) {
          newChips.push(email);
        }
      } else {
        allValid = false;
      }
    });

    if (newChips.length > 0) {
      setCcEmails(prev => [...prev, ...newChips]);
      setCcInput('');
      setCcError(false);
      setActiveCcSuggestion(false);
    }

    if (!allValid) {
      setCcError(true);
    }
  };

  const removeParaChip = (index: number) => {
    setParaEmails(prev => prev.filter((_, i) => i !== index));
  };

  const removeCcChip = (index: number) => {
    setCcEmails(prev => prev.filter((_, i) => i !== index));
  };

  // Save unique emails to localStorage (RN-08, RN-13)
  const saveEmailsToStorage = (newEmails: string[]) => {
    try {
      const updated = Array.from(new Set([...savedEmails, ...newEmails]));
      localStorage.setItem('@sit:used-emails', JSON.stringify(updated));
      setSavedEmails(updated);
    } catch (e) {
      console.error(e);
    }
  };

  // Dynamic Greeting Resolver (RN-01)
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Bom dia!';
    if (hours < 18) return 'Boa tarde!';
    return 'Boa noite!';
  };

  // Formatted output generation
  const matchedEmpresa = selectedColab 
    ? empresas.find(emp => emp.razaoSocial === selectedColab.empresa) 
    : null;
  const companyEmails = matchedEmpresa?.emails || [];

  const emailSubject = selectedColab 
    ? `Ajuste de Ponto do colaborador ${selectedColab.nome}, matrícula ${selectedColab.matricula} - GPM`
    : '';

  const generateEmailBodyText = () => {
    if (!selectedColab) return '';
    const greeting = getGreeting();
    const formattedCpf = formatCPF(selectedColab.cpf);
    const formattedTel = formatPhone(selectedColab.telefone);
    const datesText = sortedSelectedDates.map(d => formatDateBR(d)).join('\n');

    return `${greeting}

Como coordenador da área de manutenção da ${selectedColab.coordenacao || '-'} na ${selectedColab.lotacao || '-'} e responsável pela equipe de manutenção das unidades da ${selectedColab.empresa || '-'}, gostaria de informar que o colaborador ${selectedColab.nome}, matrícula ${selectedColab.matricula}, CPF ${formattedCpf}, da especialidade ${selectedColab.especialidade}, do contrato ${selectedColab.contrato}, desempenhou suas atividades normalmente conforme o horário estabelecido nos dias:

${datesText}

O colaborador mencionou ter encontrado dificuldades para registrar o ponto nesses dias, o que impossibilitou a validação dos registros.
Solicito gentilmente que sejam realizados os ajustes necessários no sistema para inclusão dos dias de trabalho do colaborador mencionado.

Contato do Colaborador: ${formattedTel} (Whatsapp)`;
  };

  const generateEmailBodyHtml = () => {
    if (!selectedColab) return '';
    const greeting = getGreeting();
    const formattedCpf = formatCPF(selectedColab.cpf);
    const formattedTel = formatPhone(selectedColab.telefone);
    const datesListHtml = sortedSelectedDates.map(d => `<span style="font-family: monospace;">${formatDateBR(d)}</span>`).join('<br>');

    return `<p>${greeting}</p>
<br>
<p>Como coordenador da área de manutenção da <strong>${selectedColab.coordenacao || '-'}</strong> na <strong>${selectedColab.lotacao || '-'}</strong> e responsável pela equipe de manutenção das unidades da <strong>${selectedColab.empresa || '-'}</strong>, gostaria de informar que o colaborador <strong>${selectedColab.nome}</strong>, matrícula <strong>${selectedColab.matricula}</strong>, CPF <strong>${formattedCpf}</strong>, da especialidade <strong>${selectedColab.especialidade}</strong>, do contrato <strong>${selectedColab.contrato}</strong>, desempenhou suas atividades normalmente conforme o horário estabelecido nos dias:</p>
<br>
<p>${datesListHtml}</p>
<br>
<p>O colaborador mencionou ter encontrado dificuldades para registrar o ponto nesses dias, o que impossibilitou a validação dos registros.</p>
<p>Solicito gentilmente que sejam realizados os ajustes necessários no sistema para inclusão dos dias de trabalho do colaborador mencionado.</p>
<br>
<p>Contato do Colaborador: <strong>${formattedTel}</strong> (Whatsapp)</p>`;
  };

  // Safe clipboard rich text copy with fallback (RN-10, CA-08)
  const handleCopyEmail = async () => {
    const paraStr = paraEmails.join('; ');
    const ccStr = ccEmails.length > 0 ? ccEmails.join('; ') : '-';
    
    const plainText = `Para: ${paraStr}\nCc: ${ccStr}\nAssunto: ${emailSubject}\n\n${generateEmailBodyText()}`;
    const rawHtml = `<p><strong>Para:</strong> ${paraStr}</p><p><strong>Cc:</strong> ${ccStr}</p><p>Assunto: ${emailSubject}</p><br>${generateEmailBodyHtml()}`;

    // Save used emails to memory
    saveEmailsToStorage([...paraEmails, ...ccEmails]);

    try {
      if (selectedColab && user) {
        await pointAdjustmentsService.savePointAdjustment({
          employeeId: selectedColab.id,
          dates: sortedSelectedDates,
          paraEmails: paraEmails,
          ccEmails: ccEmails,
          subject: emailSubject,
          body: generateEmailBodyHtml(),
          solicitadoPor: user.id
        });
      }
    } catch (err) {
      console.error('Erro ao salvar ajuste de ponto no banco:', err);
    }

    try {
      if (typeof ClipboardItem !== 'undefined') {
        const textBlob = new Blob([plainText], { type: 'text/plain' });
        const htmlBlob = new Blob([rawHtml], { type: 'text/html' });
        
        const clipboardItem = new ClipboardItem({
          'text/plain': textBlob,
          'text/html': htmlBlob
        });

        await navigator.clipboard.write([clipboardItem]);
        setCopyStatus('success');
      } else {
        // Fallback for browsers/iframes missing ClipboardItem
        await navigator.clipboard.writeText(plainText);
        setCopyStatus('fallback');
      }
    } catch (e) {
      console.error('Clipboard rich-text error, initiating fallback', e);
      // Fallback
      try {
        await navigator.clipboard.writeText(plainText);
        setCopyStatus('fallback');
      } catch (err2) {
        setCopyStatus('error');
      }
    }

    setTimeout(() => {
      setCopyStatus(null);
    }, 4000);
  };

  return createPortal(
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/75 backdrop-blur-md p-4 sm:p-6 animate-fade-in"
    >
      <div className="sit-panel relative w-full max-w-4xl overflow-hidden shadow-2xl border-brand-accent/20 transition-all duration-300">
        
        {/* Glow Top Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-accent/50 via-cyan-400 to-emerald-400" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-brand-border/40 px-6 py-4 bg-gradient-to-b from-black/20 to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-accent/15 border border-brand-accent/30 text-brand-accent">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[9px] font-black text-brand-accent uppercase tracking-widest block font-mono">Painel Executivo / Ajustar Ponto</span>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight uppercase">
                {step === 1 && "Ajustar Ponto — Selecionar Colaborador"}
                {step === 2 && "Ajustar Ponto — Selecionar Datas"}
                {step === 3 && "Ajustar Ponto — Destinatários"}
                {step === 4 && "Ajustar Ponto — Prévia do E-mail"}
              </h3>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="rounded-lg p-2 bg-white/5 border border-white/5 text-brand-muted hover:bg-white/10 hover:border-white/15 hover:text-white transition-all duration-200 cursor-pointer"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-6 overflow-y-auto bg-black/5 max-h-[65vh]">
          
          {/* STEP 1: SELECT EMPLOYEE */}
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Left Panel: Search & Select */}
              <div className="md:col-span-7 flex flex-col space-y-4">
                <h4 className="text-xs uppercase tracking-widest font-extrabold text-brand-accent">
                  Lista de Colaboradores
                </h4>
                
                {/* Search query input */}
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-brand-muted">
                    <Search className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar por nome ou matrícula…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="sit-input block w-full rounded-lg py-2.5 pl-10 pr-4 sm:text-sm"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-brand-muted hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Search result indicators */}
                {hasMoreThan10 && (
                  <div className="p-2 bg-brand-accent/5 rounded-lg border border-brand-accent/15 text-[11px] text-brand-muted/90 flex items-center gap-1.5 font-sans">
                    <AlertCircle className="w-4.5 h-4.5 text-brand-accent shrink-0" />
                    <span>Exibindo os 10 primeiros resultados — refine a busca.</span>
                  </div>
                )}

                {/* List Container */}
                <div className="sit-panel-inner p-1 max-h-[300px] overflow-y-auto space-y-1 styled-scrollbars-light">
                  {visibleEmployees.length === 0 ? (
                    <div className="py-10 text-center text-brand-muted flex flex-col items-center">
                      <UserRound className="h-8 w-8 mb-2 opacity-30 text-brand-accent" />
                      <p className="text-xs font-semibold text-white">Nenhum colaborador encontrado.</p>
                      <p className="text-[11px] text-brand-muted mt-0.5">Refine ou troque os termos de busca.</p>
                    </div>
                  ) : (
                    visibleEmployees.map((colab) => {
                      const isSelected = selectedColab?.id === colab.id;
                      const initials = colab.nome.trim().split(/\s+/).slice(0, 2).map(n => n[0]).join('').toUpperCase();
                      
                      return (
                        <button
                          key={colab.id}
                          onClick={() => setSelectedColab(colab)}
                          className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-brand-accent/15 border border-brand-accent/30 text-white shadow-inner' 
                              : 'border border-transparent text-brand-muted hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <div className="h-9 w-9 rounded-full overflow-hidden shrink-0 border border-white/10 flex items-center justify-center bg-black/40 text-[11px] font-bold text-brand-accent">
                            {colab.foto ? (
                              <img src={colab.foto} alt={colab.nome} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <span>{initials}</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-bold leading-tight truncate ${isSelected ? 'text-white' : 'text-white/80'}`}>
                              {colab.nome}
                            </p>
                            <p className="text-[10px] font-mono text-brand-muted leading-tight mt-0.5">
                              Matrícula: {colab.matricula}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Panel: Selected Résumé */}
              <div className="md:col-span-5 flex flex-col space-y-4 border-t md:border-t-0 md:border-l border-brand-border/20 pt-6 md:pt-0 md:pl-6">
                <h4 className="text-xs uppercase tracking-widest font-extrabold text-brand-accent">
                  Resumo do Colaborador
                </h4>
                
                {selectedColab ? (
                  <div className="space-y-4 animate-fade-in">
                    {/* Header with image */}
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full overflow-hidden shrink-0 border-2 border-brand-accent/30 bg-black/30 flex items-center justify-center text-sm font-bold text-brand-accent shadow">
                        {selectedColab.foto ? (
                          <img src={selectedColab.foto} alt={selectedColab.nome} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <span>{selectedColab.nome.trim().split(/\s+/).slice(0, 2).map(n => n[0]).join('').toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <h5 className="text-sm font-black text-white leading-tight">{selectedColab.nome}</h5>
                        <p className="text-[11px] text-brand-muted mt-1 font-semibold uppercase tracking-wider">
                          {selectedColab.especialidade}
                        </p>
                      </div>
                    </div>

                    {/* Detailed info lists */}
                    <div className="space-y-2 pt-2 border-t border-brand-border/15">
                      <div className="flex justify-between items-center text-xs py-1.5 border-b border-white/5">
                        <span className="text-brand-muted font-semibold uppercase text-[10px]">Matrícula</span>
                        <span className="text-white font-bold font-mono">{selectedColab.matricula}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs py-1.5 border-b border-white/5">
                        <span className="text-brand-muted font-semibold uppercase text-[10px]">CPF</span>
                        <span className="text-white font-bold font-mono">{formatCPF(selectedColab.cpf)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs py-1.5 border-b border-white/5">
                        <span className="text-brand-muted font-semibold uppercase text-[10px]">Especialidade</span>
                        <span className="text-white font-medium text-right max-w-[180px] truncate">{selectedColab.especialidade}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs py-1.5 border-b border-white/5">
                        <span className="text-brand-muted font-semibold uppercase text-[10px]">Contrato</span>
                        <span className="text-brand-accent font-bold font-mono">{selectedColab.contrato}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs py-1.5 pointer-events-none">
                        <span className="text-brand-muted font-semibold uppercase text-[10px]">Lotação</span>
                        <span className="text-white font-semibold">{selectedColab.lotacao}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-brand-muted italic text-xs h-[240px] sit-panel-inner">
                    <UserRound className="w-8 h-8 text-brand-muted opacity-30 mb-2" />
                    <span>Selecione um colaborador para visualizar os dados.</span>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* STEP 2: SELECT DATES */}
          {step === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Left Panel: Pt-BR Interactive Calendar */}
              <div className="md:col-span-7 flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs uppercase tracking-widest font-extrabold text-brand-accent">
                    Calendário (Mapeamento de Ponto)
                  </h4>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handlePrevMonth}
                      className="p-1 px-2 rounded bg-black/25 text-brand-muted border border-white/5 hover:text-white hover:bg-brand-accent/15 hover:border-brand-accent/30 transition-all cursor-pointer text-xs"
                      title="Mês Anterior"
                    >
                      ‹
                    </button>
                    <span className="text-xs font-black text-white font-mono uppercase bg-black/20 px-3 py-1 rounded border border-white/5">
                      {monthNames[currentMonth]} {currentYear}
                    </span>
                    <button 
                      onClick={handleNextMonth}
                      className="p-1 px-2 rounded bg-black/25 text-brand-muted border border-white/5 hover:text-white hover:bg-brand-accent/15 hover:border-brand-accent/30 transition-all cursor-pointer text-xs"
                      title="Próximo Mês"
                    >
                      ›
                    </button>
                  </div>
                </div>

                {/* Calendar Grid Container */}
                <div className="p-4 rounded-xl border border-white/5 bg-black/15">
                  {/* Weekdays standard header */}
                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {weekdays.map((wd, i) => (
                      <span key={i} className="text-[10px] font-black text-brand-muted/70 uppercase">
                        {wd}
                      </span>
                    ))}
                  </div>

                  {/* Day blocks */}
                  <div className="grid grid-cols-7 gap-1">
                    {/* Padding cells */}
                    {Array.from({ length: firstDayIndex }).map((_, idx) => (
                      <div key={`empty-${idx}`} className="h-9" />
                    ))}
                    
                    {/* Month Days */}
                    {Array.from({ length: daysInMonth }).map((_, idx) => {
                      const dayNum = idx + 1;
                      const formattedMonth = String(currentMonth + 1).padStart(2, '0');
                      const formattedDay = String(dayNum).padStart(2, '0');
                      const dateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;
                      const isSelected = selectedDates.includes(dateStr);

                      return (
                        <button
                          key={`day-${dayNum}`}
                          onClick={() => handleDateClick(dayNum)}
                          className={`h-9 rounded-lg text-xs font-bold transition-all relative flex items-center justify-center cursor-pointer ${
                            isSelected 
                              ? 'bg-brand-accent text-white shadow-md font-black shadow-brand-accent/20' 
                              : 'bg-black/20 border border-white/[0.03] text-[#f8fafc]/90 hover:border-brand-accent/40 hover:bg-white/5'
                          }`}
                        >
                          <span>{dayNum}</span>
                          {/* Selected Dot Indicator */}
                          {isSelected && (
                            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-white animate-pulse" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Panel: Selected Dates List sorted chronologically */}
              <div className="md:col-span-5 flex flex-col space-y-4 border-t md:border-t-0 md:border-l border-brand-border/20 pt-6 md:pt-0 md:pl-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs uppercase tracking-widest font-extrabold text-brand-accent">
                    Datas Selecionadas
                  </h4>
                  <span className="text-[10px] font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded-full">
                    {selectedDates.length} {selectedDates.length === 1 ? 'Dia' : 'Dias'}
                  </span>
                </div>

                <div className="sit-panel-inner p-2 max-h-[240px] overflow-y-auto space-y-1.5 styled-scrollbars-light">
                  {sortedSelectedDates.length === 0 ? (
                    <div className="py-10 text-center text-brand-muted/70 italic text-xs h-full flex flex-col items-center justify-center">
                      <Calendar className="w-8 h-8 text-brand-muted opacity-30 mb-2" />
                      <span>Nenhuma data selecionada.</span>
                    </div>
                  ) : (
                    sortedSelectedDates.map((dateStr) => (
                      <div 
                        key={dateStr}
                        className="flex items-center justify-between bg-black/25 p-2 rounded-lg border border-white/5 hover:border-brand-accent/20 transition-all font-mono text-xs text-white"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-brand-accent" />
                          <span>{formatDateBR(dateStr)}</span>
                        </div>
                        <button 
                          onClick={() => removeDate(dateStr)}
                          className="p-1 rounded text-brand-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Remover data"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* STEP 3: DESTINATOR AND COPIES */}
          {step === 3 && (
            <div className="space-y-6">
              <p className="text-xs text-brand-muted italic leading-relaxed">
                Digite os e-mails dos setores responsáveis na empresa contratada e pressione <strong>Enter</strong>, <strong>vírgula</strong> ou <strong>ponto e vírgula</strong> para adicioná-los como chips removíveis. Sugestões de e-mails gravados na memória local serão oferecidas automaticamente.
              </p>

              {/* PARA Campo */}
              <div className="space-y-2 relative" ref={paraRef}>
                <label className="typ-form-label block flex items-center justify-between">
                  <span className="text-white font-bold uppercase tracking-wide text-xs">Para (E-mail do Destinatário) <span className="text-rose-400 font-extrabold">*</span></span>
                  <span className="text-[10px] text-brand-muted italic font-semibold">Min 1 destinatário obrigatório</span>
                </label>
                
                {/* Chip Area and Input Container */}
                <div className={`sit-input flex flex-wrap items-center gap-2 p-2 rounded-lg transition-all ${paraError ? 'border-red-500 ring-1 ring-red-500' : ''}`}>
                  {paraEmails.map((email, i) => (
                    <div 
                      key={i} 
                      className="inline-flex items-center gap-1.5 bg-brand-accent/20 border border-brand-accent/30 text-white px-2.5 py-1 rounded-md text-xs font-medium"
                    >
                      <span>{email}</span>
                      <button 
                        onClick={() => removeParaChip(i)}
                        className="hover:text-red-400 text-brand-muted shrink-0 transition-colors rounded"
                        title="Remover e-mail"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <input
                    type="text"
                    placeholder={paraEmails.length === 0 ? "Adicione e-mail e pressione Enter..." : ""}
                    value={paraInput}
                    onChange={(e) => {
                      setParaInput(e.target.value);
                      setParaError(false);
                      setActiveParaSuggestion(true);
                    }}
                    onFocus={() => setActiveParaSuggestion(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
                        e.preventDefault();
                        handleAddParaChip();
                      }
                    }}
                    onBlur={() => {
                      // Small delay to let clicks register on suggestion box
                      setTimeout(() => {
                        // Validate left-over text silently or show error
                      }, 150);
                    }}
                    className="flex-1 bg-transparent border-none outline-none text-xs text-white min-w-[150px] py-1 focus:ring-0"
                  />
                  {paraInput && (
                    <button 
                      onClick={handleAddParaChip}
                      className="p-1 text-brand-accent hover:text-white transition-colors"
                      title="Adicionar endereço"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Inline Error */}
                {paraError && (
                  <p className="text-[11px] text-red-400 font-semibold flex items-center gap-1 mt-1 animate-fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>E-mail inválido digitado! Digite no formato correto: usuario@dominio.tld</span>
                  </p>
                )}

                {/* Local Storage AutoComplete Dropdown */}
                {activeParaSuggestion && paraInput && savedEmails.filter(email => 
                  email.toLowerCase().includes(paraInput.toLowerCase()) && !paraEmails.includes(email)
                ).length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-1 sit-panel bg-[#114F98] max-h-[150px] overflow-y-auto shadow-2xl border-brand-border py-1">
                    {savedEmails.filter(email => 
                      email.toLowerCase().includes(paraInput.toLowerCase()) && !paraEmails.includes(email)
                    ).map((email, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setParaEmails(prev => [...prev, email]);
                          setParaInput('');
                          setParaError(false);
                          setActiveParaSuggestion(false);
                        }}
                        className="w-full text-left font-mono font-medium text-xs py-2 px-3 hover:bg-brand-accent/20 hover:text-white text-slate-300 border-b border-white/[0.03] last:border-0"
                      >
                        {email}
                      </button>
                    ))}
                  </div>
                )}

                {/* Company Contact Email Suggestions */}
                {companyEmails.length > 0 && (
                  <div className="mt-2.5 text-left">
                    <span className="text-[10px] text-brand-muted uppercase font-black tracking-widest block mb-1">
                      Contatos Recomendados ({selectedColab?.empresa}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {companyEmails.map((item, idx) => {
                        const isAdded = paraEmails.includes(item.email);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              if (isAdded) {
                                setParaEmails(prev => prev.filter(e => e !== item.email));
                              } else {
                                setParaEmails(prev => [...prev, item.email]);
                              }
                            }}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[10.5px] font-bold rounded-lg transition-all border cursor-pointer ${
                              isAdded
                                ? 'bg-brand-accent text-white border-brand-accent/50 shadow-inner scale-[0.98]'
                                : 'bg-[#114F98]/30 hover:bg-brand-accent/20 text-[#6ee7b7] border-brand-accent/20 hover:border-brand-accent/40 hover:text-white'
                            }`}
                          >
                            <Mail className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              {item.nome}: <span className="font-mono font-medium underline underline-offset-2">{item.email}</span>
                            </span>
                            {isAdded && <Check className="w-3 h-3 shrink-0 ml-0.5 text-[#34d399]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* CC Campo */}
              <div className="space-y-2 relative" ref={ccRef}>
                <label className="typ-form-label block flex items-center justify-between">
                  <span className="text-white font-bold uppercase tracking-wide text-xs">Cc (Cópia Opcional)</span>
                </label>

                {/* Chip Area and Input Container */}
                <div className={`sit-input flex flex-wrap items-center gap-2 p-2 rounded-lg transition-all ${ccError ? 'border-red-500 ring-1 ring-red-500' : ''}`}>
                  {ccEmails.map((email, i) => (
                    <div 
                      key={i} 
                      className="inline-flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/25 text-white px-2.5 py-1 rounded-md text-xs font-medium"
                    >
                      <span>{email}</span>
                      <button 
                        onClick={() => removeCcChip(i)}
                        className="hover:text-red-400 text-brand-muted shrink-0 transition-colors rounded"
                        title="Remover e-mail"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <input
                    type="text"
                    placeholder={ccEmails.length === 0 ? "Adicione e-mail para cópia opcional..." : ""}
                    value={ccInput}
                    onChange={(e) => {
                      setCcInput(e.target.value);
                      setCcError(false);
                      setActiveCcSuggestion(true);
                    }}
                    onFocus={() => setActiveCcSuggestion(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
                        e.preventDefault();
                        handleAddCcChip();
                      }
                    }}
                    className="flex-1 bg-transparent border-none outline-none text-xs text-white min-w-[150px] py-1 focus:ring-0"
                  />
                  {ccInput && (
                    <button 
                      onClick={handleAddCcChip}
                      className="p-1 text-emerald-400 hover:text-white transition-colors"
                      title="Adicionar endereço para cópia"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Inline Error */}
                {ccError && (
                  <p className="text-[11px] text-red-400 font-semibold flex items-center gap-1 mt-1 animate-fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>E-mail inválido digitado! Digite no formato correto: usuario@dominio.tld</span>
                  </p>
                )}

                {/* Local Storage AutoComplete Dropdown */}
                {activeCcSuggestion && ccInput && savedEmails.filter(email => 
                  email.toLowerCase().includes(ccInput.toLowerCase()) && !ccEmails.includes(email)
                ).length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-1 sit-panel bg-[#114F98] max-h-[150px] overflow-y-auto shadow-2xl border-brand-border py-1">
                    {savedEmails.filter(email => 
                      email.toLowerCase().includes(ccInput.toLowerCase()) && !ccEmails.includes(email)
                    ).map((email, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setCcEmails(prev => [...prev, email]);
                          setCcInput('');
                          setCcError(false);
                          setActiveCcSuggestion(false);
                        }}
                        className="w-full text-left font-mono font-medium text-xs py-2 px-3 hover:bg-brand-accent/20 hover:text-white text-slate-300 border-b border-white/[0.03] last:border-0"
                      >
                        {email}
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* STEP 4: PREVIEW AND COPY */}
          {step === 4 && (
            <div className="space-y-6">
              
              {/* Header Box (Read Only representation of Para, Cc, Assunto) */}
              <div className="p-4 rounded-xl border border-white/5 bg-black/15 space-y-3 font-sans text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center py-1 gap-1 border-b border-white/5 pb-2">
                  <span className="text-brand-muted font-bold uppercase text-[10px] sm:w-[80px] shrink-0">Para:</span>
                  <span className="text-white font-mono break-all">{paraEmails.join('; ')}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center py-1 gap-1 border-b border-white/5 pb-2">
                  <span className="text-brand-muted font-bold uppercase text-[10px] sm:w-[80px] shrink-0">Cc:</span>
                  <span className="text-white font-mono break-all">{ccEmails.length > 0 ? ccEmails.join('; ') : '-'}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-start py-1 gap-1">
                  <span className="text-brand-muted font-bold uppercase text-[10px] sm:w-[80px] shrink-0">Assunto:</span>
                  <span className="text-white font-bold leading-normal">{emailSubject}</span>
                </div>
              </div>

              {/* Outlook Simulation Render Block (Scrollable area) */}
              <div className="space-y-2">
                <h5 className="text-[11px] font-black uppercase text-brand-accent tracking-wider">Corpo do E-mail (Prévia Formatada)</h5>
                <div className="rounded-xl border border-brand-border/30 bg-slate-900/60 p-5 overflow-y-auto max-h-[280px] text-xs text-white leading-relaxed font-sans styled-scrollbars-light">
                  
                  {/* Visual design resembling email content with bold tags, custom sizes */}
                  <p>{getGreeting()}</p>
                  <p className="mt-4">
                    Como coordenador da área de manutenção da <strong>{selectedColab?.coordenacao || '-'}</strong> na <strong>{selectedColab?.lotacao || '-'}</strong> e responsável pela equipe de manutenção das unidades da <strong>{selectedColab?.empresa || '-'}</strong>, gostaria de informar que o colaborador <strong>{selectedColab?.nome}</strong>, matrícula <strong>{selectedColab?.matricula}</strong>, CPF <strong>{formatCPF(selectedColab?.cpf)}</strong>, da especialidade <strong>{selectedColab?.especialidade}</strong>, do contrato <strong>{selectedColab?.contrato}</strong>, desempenhou suas atividades normalmente conforme o horário estabelecido nos dias:
                  </p>
                  
                  <div className="my-4 space-y-1 font-mono text-[11px] pl-3 border-l-2 border-brand-accent/50 text-[#6ee7b7]/90 font-semibold">
                    {sortedSelectedDates.map(d => (
                      <p key={d}>{formatDateBR(d)}</p>
                    ))}
                  </div>

                  <p className="mt-4">
                    O colaborador mencionou ter encontrado dificuldades para registrar o ponto nesses dias, o que impossibilitou a validação dos registros.
                  </p>
                  <p className="mt-2">
                    Solicito gentilmente que sejam realizados os ajustes necessários no sistema para inclusão dos dias de trabalho do colaborador mencionado.
                  </p>
                  
                  <p className="mt-6">
                    Contato do Colaborador: <strong>{formatPhone(selectedColab?.telefone)}</strong> (Whatsapp)
                  </p>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-between border-t border-brand-border/40 bg-black/15 px-6 py-4 rounded-b-2xl shrink-0">
          
          {/* Toast Copy alerts inside action footers */}
          <div className="flex-1">
            {copyStatus === 'success' && (
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Conteúdo formatado copiado para a área de transferência.</span>
              </span>
            )}
            {copyStatus === 'fallback' && (
              <span className="text-[11px] text-yellow-400 font-semibold flex items-center gap-1.5 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0" />
                <span>Copiado como texto simples. A formatação pode precisar ser ajustada ao colar.</span>
              </span>
            )}
            {copyStatus === 'error' && (
              <span className="text-[11px] text-red-400 font-semibold flex items-center gap-1.5 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>Não foi possível copiar automaticamente. Selecione o conteúdo manualmente e pressione Ctrl+C.</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 justify-end">
            
            {/* STAGE 1 Actions */}
            {step === 1 && (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold font-mono uppercase tracking-wider text-brand-muted hover:text-white hover:bg-white/5 rounded-lg border border-transparent hover:border-white/5 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!selectedColab}
                  className="sit-button-primary px-5 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-[0.98]"
                >
                  Montar E-mail
                </button>
              </>
            )}

            {/* STAGE 2 Actions */}
            {step === 2 && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    // Back to step 1, clear selected dates (RN-09 says back to step 1 keeps collaborator but clears dates)
                    setSelectedDates([]);
                    setStep(1);
                  }}
                  className="px-4 py-2 text-xs font-bold font-mono uppercase tracking-wider text-brand-muted hover:text-white hover:bg-white/5 rounded-lg border border-transparent hover:border-white/5 transition-all cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={selectedDates.length === 0}
                  className="sit-button-primary px-5 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-[0.98]"
                >
                  Confirmar Datas
                </button>
              </>
            )}

            {/* STAGE 3 Actions */}
            {step === 3 && (
              <>
                <button
                  type="button"
                  onClick={() => setStep(2)}  // Back to Step 2, keep dates in memory
                  className="px-4 py-2 text-xs font-bold font-mono uppercase tracking-wider text-brand-muted hover:text-white hover:bg-white/5 rounded-lg border border-transparent hover:border-white/5 transition-all cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  disabled={paraEmails.length === 0}
                  className="sit-button-primary px-5 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-[0.98]"
                >
                  Confirmar
                </button>
              </>
            )}

            {/* STAGE 4 Actions */}
            {step === 4 && (
              <>
                <button
                  type="button"
                  onClick={() => setStep(3)} // Back to step 3, keep emails in memory
                  className="px-4 py-2 text-xs font-bold font-mono uppercase tracking-wider text-brand-muted hover:text-white hover:bg-white/5 rounded-lg border border-transparent hover:border-white/5 transition-all cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="px-5 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg cursor-pointer bg-emerald-500 border border-emerald-400 text-white hover:bg-emerald-600 transition-all font-sans"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copiar E-mail</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="sit-button-primary px-5 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-lg cursor-pointer transition-all"
                >
                  Fechar
                </button>
              </>
            )}

          </div>

        </div>

      </div>
    </div>,
    document.body
  );
}
