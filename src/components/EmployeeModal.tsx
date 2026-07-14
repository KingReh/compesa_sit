import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload } from 'lucide-react';
import { Employee, Coordenacao, Contrato, Unidade, Empresa } from '../types';
import { maskCPF, maskPhone, classNames, formatEmployeeName } from '../utils';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employee: Employee) => void;
  employeeToEdit?: Employee | null;
  coordenacoes: Coordenacao[];
  contratos: Contrato[];
  unidades: Unidade[];
  empresas: Empresa[];
}

const ESPECIALIDADES = [
  "ENCANADOR", "AJUDANTE DE MANUTENÇÃO", "VIGILANTE", "PEDREIRO", "OPERADOR", 
  "PORTEIRO", "MECÂNICO", "AGENTE DE SANEAMENTO", "APOIO ADMINISTRATIVO", 
  "OPERADOR VOLANTE", "AUXILIAR DE COLETAS", "AUXILIAR DE SERVIÇOS GERAIS", 
  "SERVENTE DE OBRAS", "SOLDADOR", "AJUDANTE DE SOLDADOR", "ELETRICISTA", 
  "AJUDANTE DE MECÂNICO", "AJUDANTE DE ELETRICISTA", "TÉCNICO EM EDIFICAÇÕES", 
  "ALMOXARIFE"
];

const ESCALAS = [
  "HORÁRIO COMERCIAL", "12H x 36H", "24H x 72H", "12H x 24H e 12H x 48H", "12H x 24H"
];

const TAMANHOS_ROUPA = [
  "PP", "P", "M", "G", "GG", "EXG"
];

const initialForm = {
  foto: '',
  nome: '',
  matricula: '',
  cpf: '',
  especialidade: '',
  empresa: '',
  lotacao: '',
  coordenacao: '',
  sexo: '',
  telefone: '',
  endereco: '',
  dataNascimento: '',
  dataAdmissao: '',
  escalaTrabalho: '',
  contrato: '',
  camisa: '',
  calca: '',
  spt: '',
  autorizadoDirigir: false,
};

export function EmployeeModal({ isOpen, onClose, onSave, employeeToEdit, coordenacoes, contratos, unidades, empresas }: EmployeeModalProps) {
  const [formData, setFormData] = useState<Omit<Employee, 'id'>>({ ...initialForm });
  const [errors, setErrors] = useState<Partial<Record<keyof Employee, string>>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const cursorRef = useRef<{ start: number | null; end: number | null }>({ start: null, end: null });

  useEffect(() => {
    if (isOpen) {
      if (employeeToEdit) {
        setFormData({
          ...initialForm,
          ...employeeToEdit
        });
      } else {
        setFormData({ ...initialForm });
      }
      setErrors({});
    }
  }, [isOpen, employeeToEdit]);

  useEffect(() => {
    if (nameInputRef.current && cursorRef.current.start !== null) {
      const len = nameInputRef.current.value.length;
      const start = Math.min(cursorRef.current.start, len);
      const end = Math.min(cursorRef.current.end ?? 0, len);
      nameInputRef.current.setSelectionRange(start, end);
      cursorRef.current = { start: null, end: null };
    }
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let newValue: any = value;

    if (type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked;
    } else if (name === 'cpf') {
      newValue = maskCPF(value);
    } else if (name === 'telefone') {
      newValue = maskPhone(value);
    } else if (name === 'nome') {
      newValue = formatEmployeeName(value);
      const input = e.target as HTMLInputElement;
      cursorRef.current = {
        start: input.selectionStart,
        end: input.selectionEnd
      };
    }

    setFormData((prev) => ({ ...prev, [name]: newValue }));
    
    // Clear error for this field
    if (errors[name as keyof Employee]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleDatePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const raw = e.clipboardData.getData('text').trim();
    if (!raw) return;
    let iso = '';
    const isoMatch = raw.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/);
    const dmyMatch = raw.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})/);
    if (isoMatch) {
      iso = `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
    } else if (dmyMatch) {
      let y = parseInt(dmyMatch[3], 10);
      if (y < 100) y += 2000;
      iso = `${y}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
    } else {
      return;
    }
    e.preventDefault();
    const name = (e.currentTarget as HTMLInputElement).name;
    setFormData((prev) => ({ ...prev, [name]: iso }));
    if (errors[name as keyof Employee]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, foto: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof Employee, string>> = {};
    if (!formData.nome.trim()) newErrors.nome = 'Nome é obrigatório';
    if (!formData.matricula.trim()) newErrors.matricula = 'Matrícula é obrigatória';
    if (!formData.cpf.trim() || formData.cpf.length < 14) newErrors.cpf = 'CPF inválido';
    if (!formData.especialidade.trim()) newErrors.especialidade = 'Especialidade é obrigatória';
    if (!formData.empresa.trim()) newErrors.empresa = 'Empresa é obrigatória';
    if (!formData.lotacao.trim()) newErrors.lotacao = 'Lotação é obrigatória';
    if (!formData.coordenacao.trim()) newErrors.coordenacao = 'Coordenação é obrigatória';
    if (!formData.contrato.trim()) newErrors.contrato = 'Contrato é obrigatório';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const savedData = employeeToEdit 
        ? { ...formData, id: employeeToEdit.id } 
        : { ...formData };
      
      onSave(savedData as Employee);
    }
  };

  return createPortal(
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 md:p-6 animate-fade-in overflow-hidden"
    >
      <div className="sit-panel relative w-full max-w-4xl max-h-[92vh] md:max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-brand-border/30 px-5 py-3 sm:py-4 bg-transparent shrink-0">
            <div className="flex flex-col">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                {employeeToEdit ? 'Editar Cadastro do Funcionário' : 'Novo Cadastro de Funcionário'}
              </h3>
              <p className="text-[10px] text-brand-muted mt-0.5">Preencha os campos abaixo com os dados cadastrais e contratuais.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-brand-muted hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-4 styled-scrollbars bg-transparent">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              
              {/* Left Column: Personal and Professional Data (8/12) */}
              <div className="md:col-span-8 flex flex-col gap-4">
                
                {/* Section: Identificação */}
                <div className="p-3.5 rounded-lg border border-brand-border/20 bg-white/[0.01]">
                  <h4 className="text-[10px] font-bold text-brand-accent tracking-widest uppercase border-b border-brand-border/10 pb-1 mb-3">
                    1. Identificação e Dados Pessoais
                  </h4>
                  <div className="grid grid-cols-1 gap-x-3 gap-y-2.5 sm:grid-cols-6">
                    
                    <div className="sm:col-span-6">
                      <label className="block text-[10px] font-bold tracking-wider text-brand-muted uppercase mb-0.5">Nome Completo *</label>
                      <input
                        ref={nameInputRef}
                        type="text"
                        name="nome"
                        autoFocus
                        value={formData.nome}
                        onChange={handleChange}
                        className={classNames(
                          "block w-full rounded-md sit-input py-1.5 px-3 text-xs placeholder:text-brand-muted/40",
                          errors.nome ? "ring-1 ring-red-400" : ""
                        )}
                        placeholder="Nome completo do funcionário"
                      />
                      {errors.nome && <p className="mt-0.5 text-[10px] text-red-400 font-semibold">{errors.nome}</p>}
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-bold tracking-wider text-brand-muted uppercase mb-0.5">Matrícula *</label>
                      <input
                        type="text"
                        name="matricula"
                        value={formData.matricula}
                        onChange={handleChange}
                        className={classNames(
                          "block w-full rounded-md sit-input py-1.5 px-3 text-xs placeholder:text-brand-muted/40 font-mono",
                          errors.matricula ? "ring-1 ring-red-400" : ""
                        )}
                        placeholder="Digitar matrícula"
                      />
                      {errors.matricula && <p className="mt-0.5 text-[10px] text-red-400 font-semibold">{errors.matricula}</p>}
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-bold tracking-wider text-brand-muted uppercase mb-0.5">CPF *</label>
                      <input
                        type="text"
                        name="cpf"
                        value={formData.cpf}
                        onChange={handleChange}
                        maxLength={14}
                        className={classNames(
                          "block w-full rounded-md sit-input py-1.5 px-3 text-xs placeholder:text-brand-muted/40 font-mono",
                          errors.cpf ? "ring-1 ring-red-400" : ""
                        )}
                        placeholder="000.000.000-00"
                      />
                      {errors.cpf && <p className="mt-0.5 text-[10px] text-red-400 font-semibold">{errors.cpf}</p>}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold tracking-wider text-brand-muted uppercase mb-0.5">Sexo</label>
                      <select
                        name="sexo"
                        value={formData.sexo}
                        onChange={handleChange}
                        className="block w-full rounded-md sit-input py-1.5 px-2 text-xs"
                      >
                        <option value="" className="bg-[#0b4d8f]">Selecione...</option>
                        <option value="M" className="bg-[#0b4d8f]">Masculino</option>
                        <option value="F" className="bg-[#0b4d8f]">Feminino</option>
                        <option value="O" className="bg-[#0b4d8f]">Outro</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold tracking-wider text-brand-muted uppercase mb-0.5">Data de Nascimento</label>
                      <input
                        type="date"
                        name="dataNascimento"
                        value={formData.dataNascimento}
                        onChange={handleChange}
                        onPaste={handleDatePaste}
                        className="block w-full rounded-md sit-input py-1.5 px-2 text-xs !color-scheme-dark"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold tracking-wider text-brand-muted uppercase mb-0.5">Telefone</label>
                      <input
                        type="text"
                        name="telefone"
                        value={formData.telefone}
                        onChange={handleChange}
                        maxLength={15}
                        className="block w-full rounded-md sit-input py-1.5 px-3 text-xs placeholder:text-brand-muted/40 font-mono"
                        placeholder="(00) 00000-0000"
                      />
                    </div>

                    <div className="sm:col-span-6">
                      <label className="block text-[10px] font-bold tracking-wider text-brand-muted uppercase mb-0.5">Endereço Residencial</label>
                      <input
                        type="text"
                        name="endereco"
                        value={formData.endereco}
                        onChange={handleChange}
                        className="block w-full rounded-md sit-input py-1.5 px-3 text-xs placeholder:text-brand-muted/40"
                        placeholder="Rua, número, bairro, cidade..."
                      />
                    </div>

                  </div>
                </div>

                {/* Section: Atuação de Campo */}
                <div className="p-3.5 rounded-lg border border-brand-border/20 bg-white/[0.01]">
                  <h4 className="text-[10px] font-bold text-brand-accent tracking-widest uppercase border-b border-brand-border/10 pb-1 mb-3">
                    2. Perfil de Atendimento e Lotação
                  </h4>
                  <div className="grid grid-cols-1 gap-x-3 gap-y-2.5 sm:grid-cols-6">
                    
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-bold tracking-wider text-brand-muted uppercase mb-0.5">Especialidade (Cargo) *</label>
                      <select
                        name="especialidade"
                        value={formData.especialidade}
                        onChange={handleChange}
                        className={classNames(
                          "block w-full rounded-md sit-input py-1.5 px-2 text-xs",
                          errors.especialidade ? "ring-1 ring-red-400" : ""
                        )}
                      >
                        <option value="" className="bg-[#0b4d8f]">Selecione...</option>
                        {ESPECIALIDADES.map((opt) => (
                          <option key={opt} value={opt} className="bg-[#0b4d8f]">{opt}</option>
                        ))}
                      </select>
                      {errors.especialidade && <p className="mt-0.5 text-[10px] text-red-400 font-semibold">{errors.especialidade}</p>}
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-bold tracking-wider text-brand-muted uppercase mb-0.5">Empresa *</label>
                      <select
                        name="empresa"
                        value={formData.empresa}
                        onChange={handleChange}
                        className={classNames(
                          "block w-full rounded-md sit-input py-1.5 px-2 text-xs",
                          errors.empresa ? "ring-1 ring-red-400" : ""
                        )}
                      >
                        <option value="" className="bg-[#0b4d8f]">Selecione uma empresa...</option>
                        {Array.from(empresas).sort((a,b) => a.razaoSocial.localeCompare(b.razaoSocial)).map((emp) => (
                          <option key={emp.id} value={emp.razaoSocial} className="bg-[#0b4d8f]">{emp.razaoSocial}</option>
                        ))}
                      </select>
                      {errors.empresa && <p className="mt-0.5 text-[10px] text-red-400 font-semibold">{errors.empresa}</p>}
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-bold tracking-wider text-brand-muted uppercase mb-0.5">Lotação *</label>
                      <select
                        name="lotacao"
                        value={formData.lotacao}
                        onChange={handleChange}
                        className={classNames(
                          "block w-full rounded-md sit-input py-1.5 px-2 text-xs",
                          errors.lotacao ? "ring-1 ring-red-400" : ""
                        )}
                      >
                        <option value="" className="bg-[#0b4d8f]">Selecione uma unidade...</option>
                        {Array.from(unidades).sort((a,b) => a.nome.localeCompare(b.nome)).map((unidade) => (
                          <option key={unidade.id} value={unidade.nome} className="bg-[#0b4d8f]">{unidade.nome}</option>
                        ))}
                      </select>
                      {errors.lotacao && <p className="mt-0.5 text-[10px] text-red-400 font-semibold">{errors.lotacao}</p>}
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-bold tracking-wider text-brand-muted uppercase mb-0.5">Coordenação *</label>
                      <select
                        name="coordenacao"
                        value={formData.coordenacao}
                        onChange={handleChange}
                        className={classNames(
                          "block w-full rounded-md sit-input py-1.5 px-2 text-xs",
                          errors.coordenacao ? "ring-1 ring-red-400" : ""
                        )}
                      >
                        <option value="" className="bg-[#0b4d8f]">Selecione...</option>
                        {coordenacoes.map((coord) => (
                          <option key={coord.id} value={coord.nome} className="bg-[#0b4d8f]">{coord.nome}</option>
                        ))}
                      </select>
                      {errors.coordenacao && <p className="mt-0.5 text-[10px] text-red-400 font-semibold">{errors.coordenacao}</p>}
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-bold tracking-wider text-brand-muted uppercase mb-0.5">Contrato Associado *</label>
                      <select
                        name="contrato"
                        value={formData.contrato}
                        onChange={handleChange}
                        className={classNames(
                          "block w-full rounded-md sit-input py-1.5 px-2 text-xs",
                          errors.contrato ? "ring-1 ring-red-400" : ""
                        )}
                      >
                        <option value="" className="bg-[#0b4d8f]">Selecione...</option>
                        {contratos.map((ct) => (
                          <option key={ct.id} value={ct.numero} className="bg-[#0b4d8f]">{ct.numero} - {ct.empresa}</option>
                        ))}
                      </select>
                      {errors.contrato && <p className="mt-0.5 text-[10px] text-red-400 font-semibold">{errors.contrato}</p>}
                    </div>

                    <div className="sm:col-span-3 flex items-center h-full pt-4 pl-1">
                      <label className="relative flex items-center gap-2 cursor-pointer group select-none">
                        <input
                          id="employee-autorizado-dirigir"
                          type="checkbox"
                          name="autorizadoDirigir"
                          checked={!!formData.autorizadoDirigir}
                          onChange={handleChange}
                          className="h-4.5 w-4.5 rounded border border-brand-border bg-white/[0.03] text-brand-accent focus:ring-1 focus:ring-brand-accent focus:ring-offset-0 focus:outline-none transition-all cursor-pointer"
                        />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold tracking-wider text-brand-muted uppercase group-hover:text-white transition-colors">
                            Credenciado a Dirigir
                          </span>
                          <span className="text-[8px] text-brand-muted/70 leading-none mt-0.5 uppercase tracking-wide">
                            Identificar como condutor de veículos
                          </span>
                        </div>
                      </label>
                    </div>

                  </div>
                </div>

              </div>

              {/* Right Column: Photo, Contract details and Uniform Sizes (4/12) */}
              <div className="md:col-span-4 flex flex-col gap-3 md:border-l border-brand-border/20 md:pl-4">
                
                {/* 1. Profile Picture upload card */}
                <div className="p-3 rounded-lg border border-brand-border/20 bg-white/[0.01] flex flex-col items-center">
                  <h4 className="text-[10px] font-bold text-brand-accent tracking-widest uppercase mb-2">
                    Foto do Funcionário
                  </h4>
                  <div className="h-16 w-16 overflow-hidden rounded-full border border-brand-border bg-brand-panel-light/40 flex items-center justify-center shrink-0 mb-2">
                    {formData.foto ? (
                      <img src={formData.foto} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <Upload className="h-5 w-5 text-brand-muted" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded bg-[#0b4d8f]/40 border border-brand-border/30 px-2.5 py-1 text-[10px] font-bold text-brand-accent hover:bg-[#0b4d8f]/85 hover:text-white transition-all shadow-sm cursor-pointer"
                  >
                    Selecionar Foto
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                {/* 2. Contract Dates and Schedule card */}
                <div className="p-3 rounded-lg border border-brand-border/20 bg-white/[0.01]">
                  <h4 className="text-[10px] font-bold text-brand-accent tracking-widest uppercase mb-2.5 border-b border-brand-border/10 pb-1">
                    3. Detalhes do Vínculo
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] font-bold tracking-wider text-brand-muted uppercase mb-0.5">Data de Admissão</label>
                      <input
                        type="date"
                        name="dataAdmissao"
                        value={formData.dataAdmissao}
                        onChange={handleChange}
                        onPaste={handleDatePaste}
                        className="block w-full rounded-md sit-input py-1 px-2 text-xs !color-scheme-dark"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold tracking-wider text-brand-muted uppercase mb-0.5">Escala de Trabalho</label>
                      <select
                        name="escalaTrabalho"
                        value={formData.escalaTrabalho}
                        onChange={handleChange}
                        className="block w-full rounded-md sit-input py-1 px-2 text-xs"
                      >
                        <option value="" className="bg-[#0b4d8f]">Selecione...</option>
                        {ESCALAS.map((opt) => (
                           <option key={opt} value={opt} className="bg-[#0b4d8f]">{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. Uniform sizes card */}
                <div className="p-3 rounded-lg border border-[#eec13a]/25 bg-white/[0.01]">
                  <h4 className="text-[10px] font-bold text-brand-accent tracking-widest uppercase mb-2.5 border-b border-[#eec13a]/10 pb-1">
                    4. Kit Uniforme & Calçado
                  </h4>
                  <div className="grid grid-cols-3 gap-1.5">
                    <div>
                      <label className="block text-[9px] font-bold tracking-wider text-brand-muted uppercase mb-0.5">Camisa</label>
                      <select
                        name="camisa"
                        value={formData.camisa}
                        onChange={handleChange}
                        className="block w-full rounded-md sit-input py-1 px-1 text-[11px] text-center"
                      >
                        <option value="" className="bg-[#0b4d8f]">-</option>
                        {TAMANHOS_ROUPA.map((opt) => (
                           <option key={opt} value={opt} className="bg-[#0b4d8f]">{opt}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold tracking-wider text-brand-muted uppercase mb-0.5">Calça</label>
                      <select
                        name="calca"
                        value={formData.calca}
                        onChange={handleChange}
                        className="block w-full rounded-md sit-input py-1 px-1 text-[11px] text-center"
                      >
                        <option value="" className="bg-[#0b4d8f]">-</option>
                        {TAMANHOS_ROUPA.map((opt) => (
                           <option key={opt} value={opt} className="bg-[#0b4d8f]">{opt}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold tracking-wider text-brand-muted uppercase mb-0.5">Calçado</label>
                      <input
                        type="number"
                        name="spt"
                        value={formData.spt}
                        onChange={handleChange}
                        min="30"
                        placeholder="Ex: 40"
                        className="block w-full rounded-md sit-input py-1 px-1 text-[11px] text-center placeholder:text-brand-muted/30 !color-scheme-dark font-mono"
                      />
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-brand-border/30 bg-black/15 px-5 py-3 sm:py-4 rounded-b-2xl shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-1.5 text-xs font-semibold bg-white/5 border border-brand-border/20 hover:bg-white/10 transition-colors text-white cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="sit-button-primary rounded-lg px-5 py-1.5 text-xs font-bold text-white shadow-md cursor-pointer"
            >
              {employeeToEdit ? 'Salvar Alterações' : 'Confirmar Cadastro'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
