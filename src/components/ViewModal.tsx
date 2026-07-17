import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  UserRound, 
  MapPin, 
  Building, 
  Phone, 
  Calendar, 
  Briefcase, 
  FileSignature, 
  Car, 
  Copy, 
  Check, 
  ExternalLink,
  Shirt,
  Clock,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { parseLocalDate, formatLocalDateBR } from '../utils';
import { Employee } from '../types';

interface ViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onAjustarPonto?: (employee: Employee) => void;
}

type TabType = 'pessoais' | 'operacional' | 'suprimentos';

export function ViewModal({ isOpen, onClose, employee, onAjustarPonto }: ViewModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('pessoais');
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  // Reset active tab to default when modal changes/opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('pessoais');
      setCopiedLabel(null);
    }
  }, [isOpen, employee]);

  if (!isOpen || !employee) return null;

  // Calculadora de idade em tempo real
  const getAge = (birthDateStr: string) => {
    if (!birthDateStr) return 'Não cadastrado';
    try {
      const birthDate = parseLocalDate(birthDateStr);
      if (!birthDate) return 'Dados inválidos';
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return `${age} anos`;
    } catch {
      return 'Erro no cálculo';
    }
  };

  // Calculadora de tempo de casa (senioridade)
  const getSeniority = (admissionDateStr: string) => {
    if (!admissionDateStr) return 'Não cadastrado';
    try {
      const admDate = parseLocalDate(admissionDateStr);
      if (!admDate) return 'Dados inválidos';
      const today = new Date();
      
      const diffTime = Math.abs(today.getTime() - admDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const years = Math.floor(diffDays / 365);
      const months = Math.floor((diffDays % 365) / 30);
      
      if (years === 0) {
        return `${months} ${months === 1 ? 'mês' : 'meses'}`;
      }
      if (months === 0) {
        return `${years} ${years === 1 ? 'ano' : 'anos'}`;
      }
      return `${years} ${years === 1 ? 'ano' : 'anos'} e ${months} ${months === 1 ? 'mês' : 'meses'}`;
    } catch {
      return 'Erro no cálculo';
    }
  };

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedLabel(label);
    setTimeout(() => {
      setCopiedLabel(null);
    }, 1800);
  };

  return createPortal(
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[300] flex items-center sm:items-center justify-center overflow-y-auto overflow-x-hidden bg-black/75 backdrop-blur-md p-0 sm:p-6 animate-fade-in"
    >
      {/* Toast feedback for copy actions (mobile-friendly) */}
      {copiedLabel && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-6 sm:bottom-10 z-[60] bg-emerald-500/95 text-white text-[11px] font-black uppercase tracking-wider px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 animate-fade-in pointer-events-none">
          <Check className="w-3.5 h-3.5" />
          {copiedLabel} copiado
        </div>
      )}

      {/* Targeted Element container with premium elevation, glossy finishes, and responsive geometry */}
      <div className="sit-panel relative w-full max-w-3xl overflow-hidden shadow-2xl border-brand-accent/20 transition-all duration-300 min-h-screen sm:min-h-0 rounded-none sm:rounded-2xl">
        
        {/* Subtle upper glow line representing active details */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-accent/50 via-cyan-400 to-emerald-400" />

        {/* Header Section */}
        <div className="flex items-center justify-between border-b border-brand-border/40 px-4 sm:px-6 py-3.5 sm:py-5 bg-gradient-to-b from-black/20 to-transparent shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-xl bg-brand-accent/15 border border-brand-accent/30 text-brand-accent shrink-0">
              <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-black text-brand-accent uppercase tracking-widest block font-mono">Ficha de Consulta</span>
              <h3 className="text-sm sm:text-lg font-black text-white tracking-tight uppercase truncate">
                Perfil de Colaborador
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2.5 bg-white/5 border border-white/5 text-brand-muted hover:bg-white/10 hover:border-white/15 hover:text-white active:scale-95 transition-all duration-200 cursor-pointer shrink-0 ml-2"
            aria-label="Fechar Modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Master Profile Header Hero block */}
        <div className="px-4 sm:px-6 py-4 sm:py-6 bg-black/15 border-b border-brand-border/30">
          <div className="flex flex-row sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            {/* Avatar frame with interactive ring glow */}
            <div className="relative group shrink-0">
              <div className="absolute inset-0 bg-brand-accent/20 rounded-full blur-md opacity-75 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative h-20 w-20 sm:h-32 sm:w-32 overflow-hidden rounded-full border-[3px] sm:border-4 border-brand-panel-light bg-black/40 flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-[1.02]">
                {employee.foto ? (
                  <img src={employee.foto} alt={employee.nome} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="flex flex-col items-center gap-1.5">
                    <UserRound className="h-8 w-8 sm:h-12 sm:w-12 text-brand-accent" />
                  </div>
                )}
              </div>
              {employee.autorizadoDirigir && (
                <div 
                  className="absolute -bottom-1 -right-1 h-7 w-7 sm:h-10 sm:w-10 bg-emerald-500 border-[3px] sm:border-4 border-brand-panel rounded-full flex items-center justify-center text-white shadow-xl shadow-emerald-900/35 transition-transform duration-300 hover:scale-110" 
                  title="Condutor Autorizado pelo SIT"
                >
                  <Car className="h-3 w-3 sm:h-4 sm:w-4" />
                </div>
              )}
            </div>

            {/* Profile Meta Info Block */}
            <div className="text-left sm:text-left flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                <h4 className="typ-hero text-base sm:text-2xl font-black text-white leading-tight drop-shadow-sm break-words">{employee.nome}</h4>
                {employee.id && (
                  <span className="self-start sm:self-auto bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-extrabold flex items-center gap-1 shrink-0 w-fit">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Ativo
                  </span>
                )}
              </div>
              <p className="text-brand-accent font-extrabold text-[11px] sm:text-[12px] uppercase tracking-wider mt-1 sm:mt-1.5 flex items-center justify-start gap-2 break-words">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-accent animate-pulse shrink-0" />
                <span className="min-w-0">{employee.especialidade || 'Função Não Definida'}</span>
              </p>

              {/* Verified badges */}
              <div className="mt-3 sm:mt-4 flex flex-wrap gap-2 justify-start">
                <button
                  type="button"
                  onClick={() => handleCopy(employee.matricula || '', 'Matrícula')}
                  className="inline-flex items-center gap-1.5 bg-black/25 px-2.5 py-1.5 rounded-lg border border-white/5 text-[11px] font-mono font-semibold text-brand-muted hover:border-brand-accent/30 active:scale-95 transition-all cursor-pointer"
                  title="Copiar Matrícula"
                >
                  <span className="text-[10px] text-brand-accent">MAT:</span>
                  <span className="text-white font-bold">{employee.matricula || '-'}</span>
                  {copiedLabel === 'Matrícula' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-brand-muted/70" />
                  )}
                </button>

                {employee.empresa && (
                  <span className="bg-brand-accent/10 border border-brand-accent/20 text-brand-accent px-2.5 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-wider flex items-center gap-1.5 max-w-full">
                    <Building className="h-3 w-3 shrink-0" />
                    <span className="truncate">{employee.empresa}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic segment tabs containing interactive state — equal width on mobile */}
        <div className="grid grid-cols-3 sm:flex border-b border-brand-border/40 bg-black/10 px-2 sm:px-6 py-2 gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('pessoais')}
            className={`px-2 sm:px-4 py-2.5 rounded-lg text-[10px] sm:text-xs font-black tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95 ${
              activeTab === 'pessoais'
                ? 'bg-brand-accent/15 border border-brand-accent/30 text-white shadow-inner shadow-brand-accent/5'
                : 'border border-transparent text-brand-muted/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <UserRound className="w-3.5 h-3.5 shrink-0" />
            <span className="sm:hidden">Pessoais</span>
            <span className="hidden sm:inline">Dados Pessoais</span>
          </button>
          
          <button
            onClick={() => setActiveTab('operacional')}
            className={`px-2 sm:px-4 py-2.5 rounded-lg text-[10px] sm:text-xs font-black tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95 ${
              activeTab === 'operacional'
                ? 'bg-brand-accent/15 border border-brand-accent/30 text-white shadow-inner shadow-brand-accent/5'
                : 'border border-transparent text-brand-muted/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 shrink-0" />
            <span className="sm:hidden">Vínculo</span>
            <span className="hidden sm:inline">Vínculo Operacional</span>
          </button>

          <button
            onClick={() => setActiveTab('suprimentos')}
            className={`px-2 sm:px-4 py-2.5 rounded-lg text-[10px] sm:text-xs font-black tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95 ${
              activeTab === 'suprimentos'
                ? 'bg-brand-accent/15 border border-brand-accent/30 text-white shadow-inner shadow-brand-accent/5'
                : 'border border-transparent text-brand-muted/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Shirt className="w-3.5 h-3.5 shrink-0" />
            <span className="sm:hidden">Fardas</span>
            <span className="hidden sm:inline">Fardamentos</span>
          </button>
        </div>

        {/* Content Box with scrolling and interactive elements */}
        <div className="px-4 sm:px-6 py-4 sm:py-6 max-h-[calc(100vh-360px)] sm:max-h-[45vh] overflow-y-auto styled-scrollbars-light bg-black/5">
          {activeTab === 'pessoais' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* CPF Box */}
              <div className="p-4 rounded-xl border border-white/5 bg-black/15 hover:border-brand-accent/20 hover:bg-black/25 hover:shadow-lg hover:shadow-brand-accent/5 transition-all duration-300 group">
                <span className="typ-subtitle flex items-center gap-2 mb-1.5">
                  <FileSignature className="h-3.5 w-3.5 text-brand-accent" /> CPF
                </span>
                <div className="flex items-center justify-between">
                  <p className="typ-mono-meta text-white font-semibold text-sm tracking-wide">{employee.cpf || '-'}</p>
                  {employee.cpf && (
                    <button
                      onClick={() => handleCopy(employee.cpf, 'CPF')}
                      className="sm:opacity-0 sm:group-hover:opacity-100 p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-brand-muted hover:text-white transition-all cursor-pointer"
                      title="Copiar CPF"
                    >
                      {copiedLabel === 'CPF' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Sexo Box */}
              <div className="p-4 rounded-xl border border-white/5 bg-black/15 hover:border-brand-accent/20 hover:bg-black/25 hover:shadow-lg hover:shadow-brand-accent/5 transition-all duration-300">
                <span className="typ-subtitle flex items-center gap-2 mb-1.5">
                  <UserRound className="h-3.5 w-3.5 text-brand-accent" /> Gênero / Sexo
                </span>
                <p className="typ-card-title text-sm">{employee.sexo === 'M' ? 'Masculino' : employee.sexo === 'F' ? 'Feminino' : employee.sexo === 'O' ? 'Outro' : 'Não Declarado'}</p>
              </div>

              {/* Telefone Box */}
              <div className="p-4 rounded-xl border border-white/5 bg-black/15 hover:border-brand-accent/20 hover:bg-black/25 hover:shadow-lg hover:shadow-brand-accent/5 transition-all duration-300 col-span-1 group">
                <span className="typ-subtitle flex items-center gap-2 mb-1.5">
                  <Phone className="h-3.5 w-3.5 text-brand-accent" /> Contato Directo
                </span>
                <div className="flex justify-between items-center">
                  <p className="typ-card-title text-sm">{employee.telefone || 'Sem contato'}</p>
                  {employee.telefone && (
                    <div className="sm:opacity-0 sm:group-hover:opacity-100 flex gap-1.5 transition-all">
                      <a
                        href={`tel:${employee.telefone.replace(/\D/g, '')}`}
                        className="p-1 px-2.5 text-[9px] bg-sky-500/10 border border-sky-400/20 text-sky-300 hover:bg-sky-500/20 rounded-md uppercase font-black transition-colors"
                      >
                        Ligar
                      </a>
                      <a
                        href={`https://wa.me/55${employee.telefone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 px-2.5 text-[9px] bg-emerald-500/15 border border-emerald-400/20 text-emerald-300 hover:bg-emerald-500/25 rounded-md uppercase font-black flex items-center gap-1 transition-colors"
                      >
                        WhatsApp
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Nascimento Box */}
              <div className="p-4 rounded-xl border border-white/5 bg-black/15 hover:border-brand-accent/20 hover:bg-black/25 hover:shadow-lg hover:shadow-brand-accent/5 transition-all duration-300">
                <span className="typ-subtitle flex items-center gap-2 mb-1.5">
                  <Calendar className="h-3.5 w-3.5 text-brand-accent" /> Nascimento / Idade
                </span>
                <p className="typ-card-title text-sm flex items-center gap-2">
                  <span>{employee.dataNascimento ? formatLocalDateBR(employee.dataNascimento) : '-'}</span>
                  {employee.dataNascimento && (
                    <span className="text-[10px] bg-brand-accent/20 border border-brand-accent/30 text-white rounded-md px-1.5 font-bold font-mono">
                      {getAge(employee.dataNascimento)}
                    </span>
                  )}
                </p>
              </div>

              {/* Endereço Residente Box */}
              <div className="p-4 rounded-xl border border-white/5 bg-black/15 hover:border-brand-accent/20 hover:bg-black/25 hover:shadow-lg hover:shadow-brand-accent/5 transition-all duration-300 sm:col-span-2 group">
                <span className="typ-subtitle flex items-center gap-2 mb-1.5">
                  <MapPin className="h-3.5 w-3.5 text-brand-accent" /> Endereço Residencial
                </span>
                <div className="flex justify-between items-start gap-4">
                  <p className="typ-card-title text-sm leading-relaxed">{employee.endereco || 'Endereço não cadastrado'}</p>
                  {employee.endereco && (
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(employee.endereco)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="sm:opacity-0 sm:group-hover:opacity-100 p-1.5 bg-white/5 border border-white/5 hover:bg-brand-accent hover:border-brand-accent/30 hover:text-black rounded-lg text-brand-muted transition-all duration-200 shrink-0 flex items-center gap-1 text-[10px] font-bold"
                      title="Ver endereço no Google Maps"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

            </div>
          )}

          {activeTab === 'operacional' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Lotação Box */}
              <div className="p-4 rounded-xl border border-white/5 bg-black/15 hover:border-brand-accent/20 hover:bg-black/25 hover:shadow-lg hover:shadow-brand-accent/5 transition-all duration-300">
                <span className="typ-subtitle flex items-center gap-2 mb-1.5">
                  <MapPin className="h-3.5 w-3.5 text-brand-accent" /> Lotação
                </span>
                <p className="typ-card-title text-sm font-semibold">{employee.lotacao || '-'}</p>
              </div>

              {/* Coordenação Box */}
              <div className="p-4 rounded-xl border border-white/5 bg-black/15 hover:border-brand-accent/20 hover:bg-black/25 hover:shadow-lg hover:shadow-brand-accent/5 transition-all duration-300">
                <span className="typ-subtitle flex items-center gap-2 mb-1.5">
                  <Building className="h-3.5 w-3.5 text-brand-accent" /> Coordenação Ativa
                </span>
                <p className="typ-card-title text-sm font-semibold">{employee.coordenacao || '-'}</p>
              </div>

              {/* Contrato Box */}
              <div className="p-4 rounded-xl border border-white/5 bg-black/15 hover:border-brand-accent/20 hover:bg-black/25 hover:shadow-lg hover:shadow-brand-accent/5 transition-all duration-300">
                <span className="typ-subtitle flex items-center gap-2 mb-1.5">
                  <FileSignature className="h-3.5 w-3.5 text-brand-accent" /> Número de Contrato
                </span>
                <p className="typ-card-title text-sm">{employee.contrato || '-'}</p>
              </div>

              {/* Escala Trabalho Box */}
              <div className="p-4 rounded-xl border border-white/5 bg-black/15 hover:border-brand-accent/20 hover:bg-black/25 hover:shadow-lg hover:shadow-brand-accent/5 transition-all duration-300">
                <span className="typ-subtitle flex items-center gap-2 mb-1.5">
                  <Clock className="h-3.5 w-3.5 text-brand-accent" /> Escala de Trabalho
                </span>
                <p className="typ-card-title text-sm font-mono font-medium">{employee.escalaTrabalho || '-'}</p>
              </div>

              {/* Data Admissão / Senioridade Box */}
              <div className="p-4 rounded-xl border border-white/5 bg-black/15 hover:border-brand-accent/20 hover:bg-black/25 hover:shadow-lg hover:shadow-brand-accent/5 transition-all duration-300 sm:col-span-2">
                <span className="typ-subtitle flex items-center gap-2 mb-1.5">
                  <Calendar className="h-3.5 w-3.5 text-brand-accent" /> Data de Admissão & Tempo de Casa
                </span>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <p className="typ-card-title text-sm font-semibold">
                    {employee.dataAdmissao ? formatLocalDateBR(employee.dataAdmissao) : '-'}
                  </p>
                  {employee.dataAdmissao && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-lg px-3 py-1.5 text-xs font-mono font-extrabold flex items-center gap-1.5 self-start sm:self-auto shadow-inner">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {getSeniority(employee.dataAdmissao)} de dedicação
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {activeTab === 'suprimentos' && (
            <div className="space-y-4">
              
              {/* Enxoval card listing sizes */}
              <div className="p-5 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 hover:border-emerald-500/25 transition-all duration-350">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Shirt className="h-4 w-4" />
                  </div>
                  <div>
                    <h5 className="text-[11px] font-black uppercase text-emerald-300 tracking-wider">Tamanhos de Vestimenta</h5>
                    <p className="text-[9px] text-[#A7F3D0]/60">Tamanhos de uniforme cadastrados no sistema.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
                  
                  {/* Camisa */}
                  <div className="p-4 rounded-xl bg-black/25 border border-white/5 hover:border-emerald-500/20 transition-all text-center">
                    <span className="text-[10px] text-brand-muted/70 block uppercase font-bold tracking-wider mb-1">Camisa (Tamanho)</span>
                    <strong className="text-white text-base font-black uppercase">{employee.camisa || 'N/D'}</strong>
                  </div>

                  {/* Calça */}
                  <div className="p-4 rounded-xl bg-black/25 border border-white/5 hover:border-emerald-500/20 transition-all text-center">
                    <span className="text-[10px] text-brand-muted/70 block uppercase font-bold tracking-wider mb-1">Calça (Tamanho)</span>
                    <strong className="text-white text-base font-black uppercase">{employee.calca || 'N/D'}</strong>
                  </div>

                  {/* Calçado */}
                  <div className="p-4 rounded-xl bg-black/25 border border-white/5 hover:border-emerald-500/20 transition-all text-center">
                    <span className="text-[10px] text-brand-muted/70 block uppercase font-bold tracking-wider mb-1">Calçado (Nº)</span>
                    <strong className="text-white text-base font-black uppercase">{employee.spt || 'N/D'}</strong>
                  </div>

                </div>
              </div>

              {/* Informative advice label */}
              <div className="p-3 bg-brand-accent/5 rounded-xl border border-brand-accent/10 text-[10px] text-brand-muted leading-normal flex items-start gap-2 max-w-full">
                <span className="text-brand-accent font-bold mt-0.5 animate-bounce">💡</span>
                <span>Qualquer divergência nas fardas deve ser informada à coordenação administrativa para retificação imediata no sistema para manter sistema atualizado.</span>
              </div>

            </div>
          )}
        </div>

        {/* Footer containing quick action closing controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-t border-brand-border/40 bg-black/15 px-4 sm:px-6 py-3 sm:py-4 gap-2.5 sm:gap-3 rounded-b-none sm:rounded-b-2xl shrink-0">
          <p className="text-[9.5px] text-brand-muted/70 font-mono tracking-wider uppercase font-semibold hidden sm:block">
            SIT - SISTEMA INTEGRADO DE TERCEIRIZADOS • GPM
          </p>
          <div className="flex items-stretch sm:items-center justify-end w-full sm:w-auto gap-2 sm:gap-3">
            {onAjustarPonto && (
              <button
                onClick={() => onAjustarPonto(employee)}
                className="flex-1 sm:flex-none inline-flex justify-center items-center gap-x-1.5 rounded-lg border border-brand-accent/20 bg-brand-accent/10 hover:bg-brand-accent/20 text-brand-accent hover:text-white transition-all active:scale-95 cursor-pointer shadow-sm px-4 py-2.5 sm:py-2 font-bold text-xs"
              >
                <Clock className="w-4 h-4 text-brand-accent" />
                <span>Ajustar Ponto</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="sit-button-accent flex-1 sm:flex-none py-2.5 sm:py-2 px-6 rounded-lg font-bold text-xs flex items-center justify-center gap-1 shadow-lg cursor-pointer transition-all active:scale-95"
            >
              Concluir Consulta
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
