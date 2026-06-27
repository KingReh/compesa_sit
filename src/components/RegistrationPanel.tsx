import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Building, FileSignature, MapPin, Phone, Mail, X, CheckCircle2, Globe, Copy, ExternalLink, Calendar, AlertTriangle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { Coordenacao, Contrato, Unidade, Employee, Empresa } from '../types';
import { formatEmployeeName, parseDMS } from '../utils';
import { MapModal } from './MapModal';
import { WhatsAppConfirmModal } from './WhatsAppConfirmModal';
import { ConfirmModal } from './ConfirmModal';
import { empresasService } from '../services/empresasService';
import { coordenacoesService } from '../services/coordenacoesService';
import { unidadesService } from '../services/unidadesService';
import { contratosService } from '../services/contratosService';

interface RegistrationPanelProps {
  coordenacoes: Coordenacao[];
  setCoordenacoes: React.Dispatch<React.SetStateAction<Coordenacao[]>>;
  contratos: Contrato[];
  setContratos: React.Dispatch<React.SetStateAction<Contrato[]>>;
  unidades: Unidade[];
  setUnidades: React.Dispatch<React.SetStateAction<Unidade[]>>;
  empresas: Empresa[];
  setEmpresas: React.Dispatch<React.SetStateAction<Empresa[]>>;
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
}

export function RegistrationPanel({
  coordenacoes,
  setCoordenacoes,
  contratos,
  setContratos,
  unidades,
  setUnidades,
  empresas,
  setEmpresas,
  employees,
  setEmployees
}: RegistrationPanelProps) {
  const [activeTab, setActiveTab] = useState<'coordenacoes' | 'contratos' | 'unidades' | 'empresas'>('coordenacoes');
  
  // Delete confirm modal state
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: (() => void) | null;
    isAlertOnly?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    isAlertOnly: false,
  });

  // State for coordenação
  const [isEditingCoord, setIsEditingCoord] = useState(false);
  const [currentCoord, setCurrentCoord] = useState<Coordenacao>({ id: '', nome: '', coordenador: '' });
  
  // State for contrato
  const [isEditingContrato, setIsEditingContrato] = useState(false);
  const [currentContrato, setCurrentContrato] = useState<Contrato>({ id: '', numero: '', empresa: '', descricao: '' });

  const [isEditingUnidade, setIsEditingUnidade] = useState(false);
  const [currentUnidade, setCurrentUnidade] = useState<Unidade>({ id: '', nome: '', latitude: '', longitude: '' });
  const [unidadeSearchQuery, setUnidadeSearchQuery] = useState('');
  const [unidadesCurrentPage, setUnidadesCurrentPage] = useState<number>(1);
  const [viewingMapUnidade, setViewingMapUnidade] = useState<Unidade | null>(null);
  const unidadesPerPage = 5;

  const [isEditingEmpresa, setIsEditingEmpresa] = useState(false);
  const [currentEmpresa, setCurrentEmpresa] = useState<Empresa>({ 
    id: '', 
    cnpj: '', 
    razaoSocial: '', 
    endereco: '', 
    latitude: '', 
    longitude: '',
    telefones: [],
    emails: [],
    sites: []
  });
  const [empresaSearchQuery, setEmpresaSearchQuery] = useState('');
  const [empresasCurrentPage, setEmpresasCurrentPage] = useState<number>(1);
  const [viewingMapEmpresa, setViewingMapEmpresa] = useState<Empresa | null>(null);
  const [isSearchingCnpj, setIsSearchingCnpj] = useState(false);
  const empresasPerPage = 5;
  const [toast, setToast] = useState<string | null>(null);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [employeeForWhatsApp, setEmployeeForWhatsApp] = useState<Employee | null>(null);


  const handlePhoneClick = (companyName: string, contactName: string, phoneNumber: string) => {
    const dummyEmployee = {
      id: 'whatsapp-company-contact',
      nome: `${companyName} (${contactName})`,
      telefone: phoneNumber,
    } as any as Employee;
    setEmployeeForWhatsApp(dummyEmployee);
    setIsWhatsAppModalOpen(true);
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email).then(() => {
      setToast(`E-mail "${email}" copiado com sucesso`);
    }).catch((err) => {
      console.error('Failed to copy email: ', err);
    });
  };

  React.useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Temporary input state for contacts
  const [newPhoneName, setNewPhoneName] = useState('');
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [newEmailName, setNewEmailName] = useState('');
  const [newEmailAddress, setNewEmailAddress] = useState('');
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteUrl, setNewSiteUrl] = useState('');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 11) val = val.substring(0, 11);
    if (val.length > 6) {
      val = `(${val.substring(0, 2)}) ${val.substring(2, 7)}-${val.substring(7)}`;
    } else if (val.length > 2) {
      val = `(${val.substring(0, 2)}) ${val.substring(2)}`;
    } else if (val.length > 0) {
      val = `(${val}`;
    }
    setNewPhoneNumber(val);
  };

  const handleAddTelefone = () => {
    if (!newPhoneName.trim() || !newPhoneNumber.trim()) return;
    setCurrentEmpresa(prev => ({
      ...prev,
      telefones: [...(prev.telefones || []), { nome: newPhoneName.trim(), numero: newPhoneNumber }]
    }));
    setNewPhoneName('');
    setNewPhoneNumber('');
  };

  const handleRemoveTelefone = (index: number) => {
    setCurrentEmpresa(prev => ({
      ...prev,
      telefones: (prev.telefones || []).filter((_, idx) => idx !== index)
    }));
  };

  const handleAddEmail = () => {
    if (!newEmailName.trim() || !newEmailAddress.trim()) return;
    setCurrentEmpresa(prev => ({
      ...prev,
      emails: [...(prev.emails || []), { nome: newEmailName.trim(), email: newEmailAddress.toLowerCase() }]
    }));
    setNewEmailName('');
    setNewEmailAddress('');
  };

  const handleRemoveEmail = (index: number) => {
    setCurrentEmpresa(prev => ({
      ...prev,
      emails: (prev.emails || []).filter((_, idx) => idx !== index)
    }));
  };

  const handleAddSite = () => {
    if (!newSiteName.trim() || !newSiteUrl.trim()) return;
    let url = newSiteUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }
    setCurrentEmpresa(prev => ({
      ...prev,
      sites: [...(prev.sites || []), { nome: newSiteName.toUpperCase(), url }]
    }));
    setNewSiteName('');
    setNewSiteUrl('');
  };

  const handleRemoveSite = (index: number) => {
    setCurrentEmpresa(prev => ({
      ...prev,
      sites: (prev.sites || []).filter((_, idx) => idx !== index)
    }));
  };

  const handleSaveCoord = async (e: React.FormEvent) => {
    e.preventDefault();
    const newNomeCoord = currentCoord.nome.toUpperCase().trim();
    if (!newNomeCoord) return;

    // Check for duplicate by exact name
    const isDuplicate = coordenacoes.find(c => c.nome.toUpperCase() === newNomeCoord && c.id !== currentCoord.id);
    if (isDuplicate) {
      alert('Já existe uma coordenação cadastrada com esse nome.');
      return;
    }

    const updatedCoord = { ...currentCoord, nome: newNomeCoord, coordenador: currentCoord.coordenador?.trim() || '' };

    try {
      if (currentCoord.id) {
        const oldCoord = coordenacoes.find(c => c.id === currentCoord.id);
        const result = await coordenacoesService.updateCoordenacao(updatedCoord);
        setCoordenacoes(prev => prev.map(c => c.id === currentCoord.id ? result : c));
        
        // Update linked employees
        if (oldCoord && oldCoord.nome !== newNomeCoord) {
          setEmployees(prev => prev.map(emp => 
            emp.coordenacao === oldCoord.nome ? { ...emp, coordenacao: newNomeCoord } : emp
          ));
        }
      } else {
        const result = await coordenacoesService.createCoordenacao(updatedCoord);
        setCoordenacoes(prev => [...prev, result]);
      }
      setCurrentCoord({ id: '', nome: '', coordenador: '' });
      setIsEditingCoord(false);
    } catch (err) {
      console.error('Erro ao salvar coordenação:', err);
      alert('Ocorreu um erro ao salvar a coordenação no banco de dados.');
    }
  };

  const handleDeleteCoord = (id: string) => {
    const coordToDelete = coordenacoes.find(c => c.id === id);
    if (!coordToDelete) return;

    const employeesInCoord = employees.filter(e => e.coordenacao === coordToDelete.nome);
    const title = 'Excluir Coordenação';
    let message = 'Tem certeza que deseja excluir esta coordenação?';

    if (employeesInCoord.length > 0) {
      message = `Atenção: Existem ${employeesInCoord.length} funcionário(s) vinculado(s) à coordenação "${coordToDelete.nome}". Você realmente deseja excluir esta coordenação? O vínculo atual ficará sem pasta até ser atualizado no cadastro do funcionário.`;
    }

    setDeleteConfirmState({
      isOpen: true,
      title,
      message,
      onConfirm: async () => {
        try {
          await coordenacoesService.deleteCoordenacao(id);
          setCoordenacoes(prev => prev.filter(c => c.id !== id));
        } catch (err) {
          console.error('Erro ao excluir coordenação:', err);
          alert('Ocorreu um erro ao excluir a coordenação no banco de dados.');
        }
      }
    });
  };

  const handleSaveContrato = async (e: React.FormEvent) => {
    e.preventDefault();
    const newNumeroContrato = currentContrato.numero.toUpperCase().trim();
    const newEmpresaContrato = currentContrato.empresa.toUpperCase().trim();
    const newDescricaoContrato = currentContrato.descricao.toUpperCase().trim();

    if (!newNumeroContrato || !newEmpresaContrato || !newDescricaoContrato) return;

    // Check for duplicate by contract number
    const isDuplicate = contratos.find(c => c.numero.toUpperCase() === newNumeroContrato && c.id !== currentContrato.id);
    if (isDuplicate) {
      alert('Já existe um contrato cadastrado com esse número.');
      return;
    }

    const updatedContrato = {
      ...currentContrato,
      numero: newNumeroContrato,
      empresa: newEmpresaContrato,
      descricao: newDescricaoContrato
    };

    try {
      if (currentContrato.id) {
        const oldContrato = contratos.find(c => c.id === currentContrato.id);
        const result = await contratosService.updateContrato(updatedContrato);
        setContratos(prev => prev.map(c => c.id === currentContrato.id ? result : c));

        // Update linked employees
        if (oldContrato && oldContrato.numero !== newNumeroContrato) {
          setEmployees(prev => prev.map(emp => 
            emp.contrato === oldContrato.numero ? { ...emp, contrato: newNumeroContrato } : emp
          ));
        }
      } else {
        const result = await contratosService.createContrato(updatedContrato);
        setContratos(prev => [...prev, result]);
      }
      setCurrentContrato({ id: '', numero: '', empresa: '', descricao: '' });
      setIsEditingContrato(false);
    } catch (err) {
      console.error('Erro ao salvar contrato:', err);
      alert('Ocorreu um erro ao salvar o contrato no banco de dados. Verifique se a empresa informada está cadastrada.');
    }
  };

  const handleDeleteContrato = (id: string) => {
    const contratoToDelete = contratos.find(c => c.id === id);
    if (!contratoToDelete) return;

    const employeesInContrato = employees.filter(e => e.contrato === contratoToDelete.numero);
    const title = 'Excluir Contrato';
    let message = 'Tem certeza que deseja excluir este contrato?';

    if (employeesInContrato.length > 0) {
      message = `Atenção: Existem ${employeesInContrato.length} funcionário(s) vinculado(s) ao contrato "${contratoToDelete.numero}". Você realmente deseja excluir este contrato? O vínculo atual ficará sem pasta até ser atualizado no cadastro do funcionário.`;
    }

    setDeleteConfirmState({
      isOpen: true,
      title,
      message,
      onConfirm: async () => {
        try {
          await contratosService.deleteContrato(id);
          setContratos(prev => prev.filter(c => c.id !== id));
        } catch (err) {
          console.error('Erro ao excluir contrato:', err);
          alert('Ocorreu um erro ao excluir o contrato no banco de dados.');
        }
      }
    });
  };

  const handleSaveUnidade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUnidade.nome.trim() || !currentUnidade.latitude.trim() || !currentUnidade.longitude.trim()) return;

    const newNomeUnidade = currentUnidade.nome.toUpperCase();

    // Check for duplicity by exact name (case-insensitive) except self
    const isDuplicate = unidades.find(u => u.nome.toUpperCase() === newNomeUnidade && u.id !== currentUnidade.id);
    if (isDuplicate) {
      alert('Já existe uma unidade cadastrada com esse nome.');
      return;
    }

    try {
      if (currentUnidade.id) {
        const oldUnidade = unidades.find(u => u.id === currentUnidade.id);
        const result = await unidadesService.updateUnidade(currentUnidade);
        setUnidades(prev => prev.map(u => u.id === currentUnidade.id ? result : u));
        
        // Update linked employees if name changed
        if (oldUnidade && oldUnidade.nome !== newNomeUnidade) {
          setEmployees(prev => prev.map(emp => 
            emp.lotacao === oldUnidade.nome ? { ...emp, lotacao: newNomeUnidade } : emp
          ));
        }
      } else {
        const result = await unidadesService.createUnidade(currentUnidade);
        setUnidades(prev => [...prev, result]);
      }
      setCurrentUnidade({ id: '', nome: '', latitude: '', longitude: '' });
      setIsEditingUnidade(false);
    } catch (err) {
      console.error('Erro ao salvar unidade:', err);
      alert('Ocorreu um erro ao salvar a unidade no banco de dados.');
    }
  };

  const handleDeleteUnidade = (id: string) => {
    const unidadeToDelete = unidades.find(u => u.id === id);
    if (!unidadeToDelete) return;

    const employeesInUnidade = employees.filter(e => e.lotacao === unidadeToDelete.nome);
    const title = 'Excluir Unidade';
    let message = 'Tem certeza que deseja excluir esta unidade?';
    
    if (employeesInUnidade.length > 0) {
      message = `Atenção: Existem ${employeesInUnidade.length} funcionário(s) vinculado(s) à unidade "${unidadeToDelete.nome}". Você realmente deseja excluir esta unidade? O vínculo atual ficará órfão até ser atualizado no cadastro do funcionário.`;
    }

    setDeleteConfirmState({
      isOpen: true,
      title,
      message,
      onConfirm: async () => {
        try {
          await unidadesService.deleteUnidade(id);
          setUnidades(prev => prev.filter(u => u.id !== id));
        } catch (err) {
          console.error('Erro ao excluir unidade:', err);
          alert('Ocorreu um erro ao excluir a unidade no banco de dados.');
        }
      }
    });
  };

  const filteredUnidades = unidades.filter(u => 
    u.nome.toLowerCase().includes(unidadeSearchQuery.toLowerCase())
  ).sort((a, b) => a.nome.localeCompare(b.nome));

  // Pagination for Unidades
  const totalUnidadesPages = Math.ceil(filteredUnidades.length / unidadesPerPage);
  const paginatedUnidades = filteredUnidades.slice(
    (unidadesCurrentPage - 1) * unidadesPerPage,
    unidadesCurrentPage * unidadesPerPage
  );

  // Reset page when search query changes
  React.useEffect(() => {
    setUnidadesCurrentPage(1);
  }, [unidadeSearchQuery]);

  const handleSaveEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCnpj = currentEmpresa.cnpj.trim();
    const cleanRazaoSocial = currentEmpresa.razaoSocial.trim().toUpperCase();
    const cleanEndereco = currentEmpresa.endereco.trim().toUpperCase();

    if (!cleanCnpj || !cleanRazaoSocial || !cleanEndereco) {
      alert('Por favor, preencha todos os campos obrigatórios (CNPJ, Razão Social e Endereço).');
      return;
    }

    if (!currentEmpresa.id) {
       const isDuplicate = empresas.find(emp => emp.cnpj === cleanCnpj);
       if (isDuplicate) {
         alert('Já existe uma empresa cadastrada com este CNPJ.');
         return;
       }
    }

    // Prepare updated coordinates with safe fallbacks if empty
    const lat = currentEmpresa.latitude?.trim() || '-8.05389';
    const lng = currentEmpresa.longitude?.trim() || '-34.88111';

    const savedEmpresa: Empresa = {
      ...currentEmpresa,
      cnpj: cleanCnpj,
      razaoSocial: cleanRazaoSocial,
      endereco: cleanEndereco,
      latitude: lat,
      longitude: lng
    };

    try {
      if (currentEmpresa.id) {
        const oldEmpresa = empresas.find(emp => emp.id === currentEmpresa.id);
        const result = await empresasService.updateEmpresa(savedEmpresa);
        setEmpresas(prev => prev.map(emp => emp.id === currentEmpresa.id ? result : emp));
        
        // Update linked employees
        if (oldEmpresa && oldEmpresa.razaoSocial !== cleanRazaoSocial) {
          setEmployees(prev => prev.map(emp => 
            emp.empresa === oldEmpresa.razaoSocial ? { ...emp, empresa: cleanRazaoSocial } : emp
          ));
        }
      } else {
        const result = await empresasService.createEmpresa(savedEmpresa);
        setEmpresas(prev => [...prev, result]);
      }
      
      setCurrentEmpresa({ id: '', cnpj: '', razaoSocial: '', endereco: '', latitude: '', longitude: '', telefones: [], emails: [], sites: [] });
      setNewPhoneName('');
      setNewPhoneNumber('');
      setNewEmailName('');
      setNewEmailAddress('');
      setNewSiteName('');
      setNewSiteUrl('');
      setIsEditingEmpresa(false);
    } catch (err) {
      console.error('Erro ao salvar empresa:', err);
      alert('Ocorreu um erro ao salvar a empresa no banco de dados.');
    }
  };

  const handleDeleteEmpresa = (id: string) => {
    const empresaToDelete = empresas.find(e => e.id === id);
    if (!empresaToDelete) return;

    const employeesInEmpresa = employees.filter(e => e.empresa === empresaToDelete.razaoSocial);
    
    if (employeesInEmpresa.length > 0) {
      setDeleteConfirmState({
        isOpen: true,
        title: 'Exclusão Bloqueada',
        message: `Atenção: Existem ${employeesInEmpresa.length} funcionário(s) associado(s) à empresa "${empresaToDelete.razaoSocial}". A exclusão está bloqueada para preservar a integridade dos dados.`,
        onConfirm: null,
        isAlertOnly: true
      });
      return;
    }

    setDeleteConfirmState({
      isOpen: true,
      title: 'Excluir Empresa',
      message: 'Tem certeza que deseja excluir esta empresa?',
      onConfirm: async () => {
        try {
          await empresasService.deleteEmpresa(id);
          setEmpresas(prev => prev.filter(c => c.id !== id));
        } catch (err) {
          console.error('Erro ao excluir empresa:', err);
          alert('Ocorreu um erro ao excluir a empresa no banco de dados.');
        }
      },
      isAlertOnly: false
    });
  };

  const formatCNPJ = (value: string) => {
    let clean = value.replace(/\D/g, '');
    clean = clean.substring(0, 14);
    if (clean.length > 12) {
      clean = clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2}).*/, '$1.$2.$3/$4-$5');
    } else if (clean.length > 8) {
      clean = clean.replace(/^(\d{2})(\d{3})(\d{3})(\d+).*/, '$1.$2.$3/$4');
    } else if (clean.length > 5) {
      clean = clean.replace(/^(\d{2})(\d{3})(\d+).*/, '$1.$2.$3');
    } else if (clean.length > 2) {
      clean = clean.replace(/^(\d{2})(\d+).*/, '$1.$2');
    }
    return clean;
  };

  const handleCnpjChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = formatCNPJ(e.target.value);
    setCurrentEmpresa(prev => ({ ...prev, cnpj: value }));
    const rawCnpj = value.replace(/\D/g, '');
    
    if (rawCnpj.length === 14) {
      setIsSearchingCnpj(true);
      try {
        const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${rawCnpj}`);
        if (res.ok) {
          const data = await res.json();
          const nomeFantasia = data.nome_fantasia?.trim();
          const razaoSocial = data.razao_social?.trim();
          const valorPreenchimento = nomeFantasia || razaoSocial || '';
          setCurrentEmpresa(prev => ({ ...prev, razaoSocial: valorPreenchimento }));
        } else {
           alert('Não foi possível obter dados para este CNPJ.');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearchingCnpj(false);
      }
    }
  };

  const searchAddressCoords = async (val: string) => {
    setCurrentEmpresa(prev => ({ ...prev, endereco: val }));
    if (val.length < 5) return;
    
    // Simulate geocoding to OpenStreetMap format output or google format using standard lat lng, using hardcoded timeout for search delay 
    // Ideally user typed actual address string, to fetch we can use a free api
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setCurrentEmpresa(prev => ({ ...prev, latitude: data[0].lat, longitude: data[0].lon }));
        } else {
          setCurrentEmpresa(prev => ({ ...prev, latitude: '', longitude: '' }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (currentEmpresa.endereco && currentEmpresa.endereco.length > 5 && isEditingEmpresa) {
        searchAddressCoords(currentEmpresa.endereco);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [currentEmpresa.endereco, isEditingEmpresa]);

  const filteredEmpresas = empresas.filter(u => 
    u.cnpj.includes(empresaSearchQuery) || 
    u.razaoSocial.toLowerCase().includes(empresaSearchQuery.toLowerCase()) ||
    u.endereco.toLowerCase().includes(empresaSearchQuery.toLowerCase())
  ).sort((a, b) => a.razaoSocial.localeCompare(b.razaoSocial));

  const totalEmpresasPages = Math.ceil(filteredEmpresas.length / empresasPerPage);
  const paginatedEmpresas = filteredEmpresas.slice(
    (empresasCurrentPage - 1) * empresasPerPage,
    empresasCurrentPage * empresasPerPage
  );

  React.useEffect(() => {
    setEmpresasCurrentPage(1);
  }, [empresaSearchQuery]);

  // Try to generate a Google Maps statically map URL or link that can be embedded
  const getMapIframeUrl = (lat: string, lng: string) => {
    const parsedLat = parseDMS(lat);
    const parsedLng = parseDMS(lng);
    const query = (parsedLat !== null && parsedLng !== null)
      ? `${parsedLat},${parsedLng}`
      : `${lat} ${lng}`;
    const q = encodeURIComponent(query);
    return `https://maps.google.com/maps?q=${q}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      
      {/* Tabs */}
      <div className="flex bg-black/20 p-1 rounded-lg w-full sm:w-fit mb-2">
        <button
          onClick={() => setActiveTab('coordenacoes')}
          className={`flex flex-1 sm:flex-none items-center justify-center gap-1 sm:gap-2 px-2 sm:px-6 py-2 sm:py-2.5 rounded-md transition-colors text-xs sm:text-sm whitespace-nowrap ${
            activeTab === 'coordenacoes'
            ? 'bg-brand-accent text-brand-bg font-semibold shadow-sm'
            : 'text-white hover:bg-black/20'
          }`}
        >
          <Building className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="sm:hidden">Coords</span>
          <span className="hidden sm:inline">Coordenações</span>
        </button>
        <button
          onClick={() => setActiveTab('contratos')}
          className={`flex flex-1 sm:flex-none items-center justify-center gap-1 sm:gap-2 px-2 sm:px-6 py-2 sm:py-2.5 rounded-md transition-colors text-xs sm:text-sm whitespace-nowrap ${
            activeTab === 'contratos'
            ? 'bg-brand-accent text-brand-bg font-semibold shadow-sm'
            : 'text-white hover:bg-black/20'
          }`}
        >
          <FileSignature className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="sm:hidden">Contr.</span>
          <span className="hidden sm:inline">Contratos</span>
        </button>
        <button
          onClick={() => setActiveTab('unidades')}
          className={`flex flex-1 sm:flex-none items-center justify-center gap-1 sm:gap-2 px-2 sm:px-6 py-2 sm:py-2.5 rounded-md transition-colors text-xs sm:text-sm whitespace-nowrap ${
            activeTab === 'unidades'
            ? 'bg-brand-accent text-brand-bg font-semibold shadow-sm'
            : 'text-white hover:bg-black/20'
          }`}
        >
          <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="sm:hidden">Unids</span>
          <span className="hidden sm:inline">Unidades</span>
        </button>
        <button
          onClick={() => setActiveTab('empresas')}
          className={`flex flex-1 sm:flex-none items-center justify-center gap-1 sm:gap-2 px-2 sm:px-6 py-2 sm:py-2.5 rounded-md transition-colors text-xs sm:text-sm whitespace-nowrap ${
            activeTab === 'empresas'
            ? 'bg-brand-accent text-brand-bg font-semibold shadow-sm'
            : 'text-white hover:bg-black/20'
          }`}
        >
          <Building className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="sm:hidden">Empr.</span>
          <span className="hidden sm:inline">Empresas</span>
        </button>
      </div>

      {activeTab === 'coordenacoes' && (
        <div className="sit-panel p-6 animate-slide-up">
          <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
            <div>
              <h2 className="typ-card-title text-white">Gerenciar Coordenações</h2>
              <p className="typ-card-desc mt-1">Crie, edite ou exclua coordenações para listagem nos cadastros.</p>
            </div>
            {!isEditingCoord && (
              <button
                onClick={() => { setCurrentCoord({ id: '', nome: '', coordenador: '' }); setIsEditingCoord(true); }}
                className="sit-button-primary rounded-lg px-4 py-2 typ-card-title flex items-center gap-2 text-white font-bold"
              >
                <Plus className="w-4 h-4" />
                Nova Coordenação
              </button>
            )}
          </div>

          {isEditingCoord && (
            <form onSubmit={handleSaveCoord} className="bg-black/10 p-5 rounded-xl border border-white/5 mb-6">
              <h3 className="typ-subtitle text-brand-accent mb-4">
                {currentCoord.id ? 'Editar Coordenação' : 'Nova Coordenação'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start col-span-full">
                <div>
                  <label className="block typ-form-label mb-1">Nome da Coordenação *</label>
                  <input
                    type="text"
                    required
                    value={currentCoord.nome}
                    onChange={(e) => setCurrentCoord({ ...currentCoord, nome: e.target.value.toUpperCase() })}
                    className="block w-full rounded-lg sit-input py-2.5 px-3 sm:text-sm sm:leading-6 placeholder:text-brand-muted uppercase"
                    placeholder="Ex: CPR SUL"
                  />
                </div>
                <div>
                  <label className="block typ-form-label mb-1">Coordenador</label>
                  <input
                    type="text"
                    value={currentCoord.coordenador || ''}
                    onChange={(e) => setCurrentCoord({ ...currentCoord, coordenador: formatEmployeeName(e.target.value) })}
                    className="block w-full rounded-lg sit-input py-2.5 px-3 sm:text-sm sm:leading-6 placeholder:text-brand-muted"
                    placeholder="Ex: Jéssica Alves"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                <button type="submit" className="sit-button-primary rounded-lg px-6 py-2.5 text-white font-bold text-sm">
                  Salvar
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsEditingCoord(false)}
                  className="bg-black/20 hover:bg-black/30 text-white rounded-lg px-6 py-2.5 font-semibold text-sm transition-colors border border-brand-border"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/20 shadow-lg">
            <table className="w-full text-left text-sm text-brand-muted min-w-[600px]">
              <thead className="bg-black/40 text-[11px] uppercase tracking-wider font-semibold text-brand-accent border-b border-white/10">
                <tr>
                  <th className="px-6 py-4.5">Nome da Coordenação</th>
                  <th className="px-6 py-4.5">Coordenador</th>
                  <th className="px-6 py-4.5 text-right w-28">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {coordenacoes.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-brand-muted/70 italic">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Building className="w-8 h-8 text-white/15" />
                        <span>Nenhuma coordenação cadastrada no sistema.</span>
                      </div>
                    </td>
                  </tr>
                )}
                {coordenacoes.map((coord) => (
                  <tr key={coord.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-6 py-4 font-medium text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-brand-accent/70" />
                        <span>{coord.nome}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white/90">
                      {coord.coordenador ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 text-white/80 border border-white/5">
                          {coord.coordenador}
                        </span>
                      ) : (
                        <span className="text-white/40 italic text-xs">Não informado</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => { setCurrentCoord({ id: coord.id, nome: coord.nome, coordenador: coord.coordenador || '' }); setIsEditingCoord(true); }}
                          className="p-2 text-white/60 hover:text-brand-accent hover:bg-brand-accent/10 transition-colors rounded-lg border border-transparent hover:border-brand-accent/20"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCoord(coord.id)}
                          className="p-2 text-white/60 hover:text-red-400 hover:bg-red-500/10 transition-colors rounded-lg border border-transparent hover:border-red-500/20"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'contratos' && (
        <div className="sit-panel p-6 animate-slide-up">
          <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
            <div>
              <h2 className="typ-card-title text-white">Gerenciar Contratos</h2>
              <p className="typ-card-desc mt-1">Crie, edite ou exclua contratos para listagem nos cadastros.</p>
            </div>
            {!isEditingContrato && (
              <button
                onClick={() => { setCurrentContrato({ id: '', numero: '', empresa: '', descricao: '' }); setIsEditingContrato(true); }}
                className="sit-button-primary rounded-lg px-4 py-2 typ-card-title flex items-center gap-2 text-white font-bold"
              >
                <Plus className="w-4 h-4" />
                Novo Contrato
              </button>
            )}
          </div>

          {isEditingContrato && (
            <form onSubmit={handleSaveContrato} className="bg-black/10 p-5 rounded-xl border border-white/5 mb-6">
              <h3 className="typ-subtitle text-brand-accent mb-4">
                {currentContrato.id ? 'Editar Contrato' : 'Novo Contrato'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                <div>
                  <label className="block typ-form-label mb-1">Nº do Contrato *</label>
                  <input
                    type="text"
                    required
                    value={currentContrato.numero}
                    onChange={(e) => setCurrentContrato({ ...currentContrato, numero: e.target.value.toUpperCase() })}
                    className="block w-full rounded-lg sit-input py-2.5 px-3 sm:text-sm sm:leading-6 placeholder:text-brand-muted uppercase"
                    placeholder="Ex: CT.PS.22.4.417"
                  />
                </div>
                <div>
                  <label className="block typ-form-label mb-1">Empresa *</label>
                  <input
                    type="text"
                    required
                    value={currentContrato.empresa}
                    onChange={(e) => setCurrentContrato({ ...currentContrato, empresa: e.target.value.toUpperCase() })}
                    className="block w-full rounded-lg sit-input py-2.5 px-3 sm:text-sm sm:leading-6 placeholder:text-brand-muted uppercase"
                    placeholder="Ex: SERVITIUM"
                  />
                </div>
                <div>
                  <label className="block typ-form-label mb-1">Descrição *</label>
                  <input
                    type="text"
                    required
                    value={currentContrato.descricao}
                    onChange={(e) => setCurrentContrato({ ...currentContrato, descricao: e.target.value.toUpperCase() })}
                    className="block w-full rounded-lg sit-input py-2.5 px-3 sm:text-sm sm:leading-6 placeholder:text-brand-muted uppercase"
                    placeholder="Ex: Serviço de Manutenção"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                <button type="submit" className="sit-button-primary rounded-lg px-6 py-2.5 text-white font-bold text-sm">
                  Salvar
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsEditingContrato(false)}
                  className="bg-black/20 hover:bg-black/30 text-white rounded-lg px-6 py-2.5 font-semibold text-sm transition-colors border border-brand-border"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/20 shadow-lg">
            <table className="w-full text-left text-sm text-brand-muted min-w-[700px]">
              <thead className="bg-black/40 text-[11px] uppercase tracking-wider font-semibold text-brand-accent border-b border-white/10">
                <tr>
                  <th className="px-6 py-4.5">Nº Contrato</th>
                  <th className="px-6 py-4.5">Empresa</th>
                  <th className="px-6 py-4.5">Descrição</th>
                  <th className="px-6 py-4.5 text-right w-28">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {contratos.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-brand-muted/70 italic">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileSignature className="w-8 h-8 text-white/15" />
                        <span>Nenhum contrato cadastrado no sistema.</span>
                      </div>
                    </td>
                  </tr>
                )}
                {contratos.map((ct) => (
                  <tr key={ct.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-6 py-4 font-medium text-white">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#0b4d8f]/30 text-white border border-[#0b4d8f]/50 font-mono text-[11px]">
                        {ct.numero}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white/90">
                      <div className="line-clamp-1 font-medium">{ct.empresa}</div>
                    </td>
                    <td className="px-6 py-4 text-white/70">
                      <div className="line-clamp-1 text-xs">{ct.descricao}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => { setCurrentContrato(ct); setIsEditingContrato(true); }}
                          className="p-2 text-white/60 hover:text-brand-accent hover:bg-brand-accent/10 transition-colors rounded-lg border border-transparent hover:border-brand-accent/20"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteContrato(ct.id)}
                          className="p-2 text-white/60 hover:text-red-400 hover:bg-red-500/10 transition-colors rounded-lg border border-transparent hover:border-red-500/20"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'unidades' && (
        <div className="sit-panel p-6 animate-slide-up">
          <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
            <div>
              <h2 className="typ-card-title text-white">Gerenciar Unidades</h2>
              <p className="typ-card-desc mt-1">Crie, edite ou exclua unidades e instalações (Lotações) disponíveis nos cadastros.</p>
            </div>
            {!isEditingUnidade && (
              <button
                onClick={() => { setCurrentUnidade({ id: '', nome: '', latitude: '', longitude: '' }); setIsEditingUnidade(true); }}
                className="sit-button-primary rounded-lg px-4 py-2 typ-card-title flex items-center gap-2 text-white font-bold"
              >
                <Plus className="w-4 h-4" />
                Nova Unidade
              </button>
            )}
          </div>

          <div className="mb-4">
            <input
              type="text"
              placeholder="Buscar unidade por nome..."
              value={unidadeSearchQuery}
              onChange={(e) => setUnidadeSearchQuery(e.target.value)}
              className="block w-full max-w-sm rounded-lg sit-input py-2 px-3 text-sm placeholder:text-brand-muted/50"
            />
          </div>

          {isEditingUnidade && (
            <form onSubmit={handleSaveUnidade} className="bg-black/10 p-5 rounded-xl border border-white/5 mb-6">
              <h3 className="typ-subtitle text-brand-accent mb-4">
                {currentUnidade.id ? 'Editar Unidade' : 'Nova Unidade'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                <div>
                  <label className="block typ-form-label mb-1">Nome da Unidade *</label>
                  <input
                    type="text"
                    required
                    value={currentUnidade.nome}
                    onChange={(e) => setCurrentUnidade({ ...currentUnidade, nome: e.target.value.toUpperCase() })}
                    className="block w-full rounded-lg sit-input py-2.5 px-3 sm:text-sm sm:leading-6 placeholder:text-brand-muted uppercase"
                    placeholder="Ex: ETA CHARNECA"
                  />
                </div>
                <div>
                  <label className="block typ-form-label mb-1">Latitude *</label>
                  <input
                    type="text"
                    required
                    value={currentUnidade.latitude}
                    onChange={(e) => setCurrentUnidade({ ...currentUnidade, latitude: e.target.value })}
                    className="block w-full rounded-lg sit-input py-2.5 px-3 sm:text-sm sm:leading-6 placeholder:text-brand-muted"
                    placeholder="Ex: 8°14'25&quot;S"
                  />
                </div>
                <div>
                  <label className="block typ-form-label mb-1">Longitude *</label>
                  <input
                    type="text"
                    required
                    value={currentUnidade.longitude}
                    onChange={(e) => setCurrentUnidade({ ...currentUnidade, longitude: e.target.value })}
                    className="block w-full rounded-lg sit-input py-2.5 px-3 sm:text-sm sm:leading-6 placeholder:text-brand-muted"
                    placeholder="Ex: 35°02'55&quot;W"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                <button type="submit" className="sit-button-primary rounded-lg px-6 py-2.5 text-white font-bold text-sm">
                  Salvar
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsEditingUnidade(false)}
                  className="bg-black/20 hover:bg-black/30 text-white rounded-lg px-6 py-2.5 font-semibold text-sm transition-colors border border-brand-border"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/20 shadow-lg styled-scrollbars">
            <table className="w-full text-left text-sm text-brand-muted min-w-[800px]">
              <thead className="bg-black/40 text-[11px] uppercase tracking-wider font-semibold text-brand-accent border-b border-white/10">
                <tr>
                  <th className="px-6 py-4.5">Unidade</th>
                  <th className="px-6 py-4.5">Coordenadas</th>
                  <th className="px-6 py-4.5 text-center w-72">Mapa</th>
                  <th className="px-6 py-4.5 text-right w-28">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedUnidades.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-brand-muted/70 italic">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <MapPin className="w-8 h-8 text-white/15" />
                        <span>Nenhuma unidade encontrada.</span>
                      </div>
                    </td>
                  </tr>
                )}
                {paginatedUnidades.map((unidade) => (
                  <tr key={unidade.id} className="hover:bg-white/[0.03] transition-colors relative group">
                    <td className="px-6 py-3 font-medium text-white align-middle">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-brand-accent/70" />
                        <span>{unidade.nome}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-white/90 align-middle">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs bg-white/5 px-2 py-0.5 rounded border border-white/5 w-fit font-mono">Lat: {unidade.latitude}</span>
                        <span className="text-xs bg-white/5 px-2 py-0.5 rounded border border-white/5 w-fit font-mono">Lng: {unidade.longitude}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-middle text-center overflow-hidden">
                      <div 
                        className="w-full h-28 rounded-lg overflow-hidden border border-white/10 bg-black/50 relative shadow-inner cursor-pointer group-hover:border-brand-accent/50 transition-colors"
                        onClick={() => setViewingMapUnidade(unidade)}
                      >
                        {parseDMS(unidade.latitude) !== null && parseDMS(unidade.longitude) !== null ? (
                          <iframe 
                            src={getMapIframeUrl(unidade.latitude, unidade.longitude)}
                            width="100%" 
                            height="100%" 
                            className="border-0 pointer-events-none opacity-80"
                            loading="lazy"
                            title={`Mapa ${unidade.nome}`}
                            referrerPolicy="no-referrer-when-downgrade"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-[10px] text-amber-500 bg-amber-500/5">
                            <AlertTriangle className="w-4 h-4 text-amber-500/70" />
                            <span>Coordenadas Inválidas</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30" title="Ver mapa interativo">
                          <MapPin className="w-6 h-6 text-brand-accent drop-shadow-md" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right align-middle">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => { setCurrentUnidade(unidade); setIsEditingUnidade(true); }}
                          className="p-2 text-white/60 hover:text-brand-accent hover:bg-brand-accent/10 transition-colors rounded-lg border border-transparent hover:border-brand-accent/20"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUnidade(unidade.id)}
                          className="p-2 text-white/60 hover:text-red-400 hover:bg-red-500/10 transition-colors rounded-lg border border-transparent hover:border-red-500/20"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Container for Unidades */}
          {totalUnidadesPages > 1 && (
            <div className="flex items-center justify-between border-t border-brand-border bg-black/10 px-6 py-4 mt-2 rounded-xl">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => setUnidadesCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={unidadesCurrentPage === 1}
                  className="relative inline-flex items-center rounded-md border border-brand-border sit-panel-inner px-4 py-2 typ-card-desc text-white hover:brightness-110 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setUnidadesCurrentPage((p) => Math.min(totalUnidadesPages, p + 1))}
                  disabled={unidadesCurrentPage === totalUnidadesPages}
                  className="relative ml-3 inline-flex items-center rounded-md border border-brand-border sit-panel-inner px-4 py-2 typ-card-desc text-white hover:brightness-110 disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="typ-card-desc">
                    Mostrando <span className="font-bold text-white">{((unidadesCurrentPage - 1) * unidadesPerPage) + 1}</span> até{' '}
                    <span className="font-bold text-white">
                      {Math.min(unidadesCurrentPage * unidadesPerPage, filteredUnidades.length)}
                    </span>{' '}
                    de <span className="font-bold text-white">{filteredUnidades.length}</span> unidades
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    {Array.from({ length: totalUnidadesPages }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setUnidadesCurrentPage(idx + 1)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus:outline-offset-0 ${
                          unidadesCurrentPage === idx + 1
                            ? 'z-10 bg-brand-panel-light text-white ring-1 ring-inset ring-brand-border'
                            : 'text-brand-muted ring-1 ring-inset ring-brand-border bg-brand-panel hover:bg-brand-panel-light'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'empresas' && (
        <div className="sit-panel p-6 animate-slide-up">
          <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
            <div>
              <h2 className="typ-card-title text-white">Gerenciar Empresas</h2>
              <p className="typ-card-desc mt-1">Crie, edite ou exclua empresas cadastradas no sistema.</p>
            </div>
            {!isEditingEmpresa && (
              <button
                onClick={() => { setCurrentEmpresa({ id: '', cnpj: '', razaoSocial: '', endereco: '', latitude: '', longitude: '', telefones: [], emails: [], sites: [] }); setIsEditingEmpresa(true); }}
                className="sit-button-primary rounded-lg px-4 py-2 typ-card-title flex items-center gap-2 text-white font-bold"
              >
                <Plus className="w-4 h-4" />
                Nova Empresa
              </button>
            )}
          </div>

          <div className="mb-6 flex justify-between items-center gap-4">
            <input
              type="text"
              placeholder="Pesquisar por CNPJ, Razão Social ou Endereço..."
              value={empresaSearchQuery}
              onChange={(e) => setEmpresaSearchQuery(e.target.value)}
              className="block w-full max-w-sm rounded-lg sit-input py-2 px-3 text-sm placeholder:text-brand-muted/50"
            />
          </div>

          {isEditingEmpresa && (
            <form onSubmit={handleSaveEmpresa} className="bg-black/10 p-5 rounded-xl border border-white/5 mb-6">
              <h3 className="typ-subtitle text-brand-accent mb-4">
                {currentEmpresa.id ? 'Editar Empresa' : 'Nova Empresa'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start col-span-full">
                <div>
                  <label className="block typ-form-label mb-1">CNPJ *</label>
                  <input
                    type="text"
                    required
                    value={currentEmpresa.cnpj}
                    onChange={handleCnpjChange}
                    className="block w-full rounded-lg sit-input py-2.5 px-3 sm:text-sm sm:leading-6 placeholder:text-brand-muted"
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                  />
                  {isSearchingCnpj && <p className="text-xs text-brand-accent mt-1 animate-pulse">Consultando CNPJ...</p>}
                </div>
                <div>
                  <label className="block typ-form-label mb-1">Razão Social *</label>
                  <input
                    type="text"
                    required
                    value={currentEmpresa.razaoSocial}
                    onChange={(e) => setCurrentEmpresa(prev => ({ ...prev, razaoSocial: e.target.value.toUpperCase() }))}
                    className="block w-full rounded-lg sit-input py-2.5 px-3 sm:text-sm sm:leading-6 placeholder:text-brand-muted uppercase"
                    placeholder="Razão Social da Empresa"
                  />
                </div>
                <div>
                  <label className="block typ-form-label mb-1">Latitude (Preenche automaticamente ao pesquisar endereço)</label>
                  <input
                    type="text"
                    value={currentEmpresa.latitude || ''}
                    onChange={(e) => setCurrentEmpresa(prev => ({ ...prev, latitude: e.target.value }))}
                    className="block w-full rounded-lg sit-input py-2.5 px-3 sm:text-sm sm:leading-6 placeholder:text-brand-muted"
                    placeholder="Ex: -8.05389"
                  />
                </div>
                <div>
                  <label className="block typ-form-label mb-1">Longitude (Preenche automaticamente ao pesquisar endereço)</label>
                  <input
                    type="text"
                    value={currentEmpresa.longitude || ''}
                    onChange={(e) => setCurrentEmpresa(prev => ({ ...prev, longitude: e.target.value }))}
                    className="block w-full rounded-lg sit-input py-2.5 px-3 sm:text-sm sm:leading-6 placeholder:text-brand-muted"
                    placeholder="Ex: -34.88111"
                  />
                </div>
                <div className="col-span-full">
                  <label className="block typ-form-label mb-1">Endereço *</label>
                  <input
                    type="text"
                    required
                    value={currentEmpresa.endereco}
                    onChange={(e) => setCurrentEmpresa(prev => ({ ...prev, endereco: e.target.value.toUpperCase() }))}
                    className="block w-full rounded-lg sit-input py-2.5 px-3 sm:text-sm sm:leading-6 placeholder:text-brand-muted uppercase"
                    placeholder="Digite o endereço para localizar no mapa (Ex: Rua da Paz, 10, Recife)"
                  />
                </div>
              </div>

              {/* Subformulários para telefones e e-mails de contatos */}
              <div className="mt-6 pt-5 border-t border-white/5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-accent mb-3 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" />
                  Gerenciamento de Contatos da Empresa
                </h4>
                
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-4">
                  
                  {/* Telefones de Contato */}
                  <div className="bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col gap-3">
                    <span className="text-xs font-semibold text-white/80">Telefones para Contato</span>
                    
                    <div className="space-y-2 max-h-40 overflow-y-auto styled-scrollbars min-h-[40px] flex flex-col justify-start">
                      {(!currentEmpresa.telefones || currentEmpresa.telefones.length === 0) ? (
                        <p className="text-xs text-brand-muted italic py-2 text-center">Nenhum telefone adicionado.</p>
                      ) : (
                        currentEmpresa.telefones.map((tel, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-black/30 border border-white/5 py-1.5 px-3 rounded-lg text-xs leading-none">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-bold text-brand-accent truncate max-w-[100px]" title={tel.nome}>{tel.nome}:</span>
                              <span className="font-mono text-white/90">{tel.numero}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveTelefone(idx)}
                              className="text-white/40 hover:text-red-400 p-1 rounded-md hover:bg-red-500/10 transition-colors"
                              title="Remover Contato"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="flex gap-2 mt-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Nome (ex: Financeiro)"
                          value={newPhoneName}
                          onChange={(e) => setNewPhoneName(formatEmployeeName(e.target.value))}
                          className="block w-full rounded-md sit-input py-1.5 px-2.5 text-xs placeholder:text-brand-muted"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="(81) 99999-9999"
                          value={newPhoneNumber}
                          onChange={handlePhoneChange}
                          className="block w-full rounded-md sit-input py-1.5 px-2.5 text-xs placeholder:text-brand-muted"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddTelefone}
                        className="bg-brand-accent text-brand-bg hover:brightness-110 font-bold text-xs px-3.5 rounded-md transition-all flex items-center gap-1 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Adicionar
                      </button>
                    </div>
                  </div>

                  {/* E-mails de Contato */}
                  <div className="bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col gap-3">
                    <span className="text-xs font-semibold text-white/80">E-mails para Contato</span>
                    
                    <div className="space-y-2 max-h-40 overflow-y-auto styled-scrollbars min-h-[40px] flex flex-col justify-start">
                      {(!currentEmpresa.emails || currentEmpresa.emails.length === 0) ? (
                        <p className="text-xs text-brand-muted italic py-2 text-center">Nenhum e-mail adicionado.</p>
                      ) : (
                        currentEmpresa.emails.map((mail, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-black/30 border border-white/5 py-1.5 px-3 rounded-lg text-xs leading-none">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-bold text-brand-accent truncate max-w-[100px]" title={mail.nome}>{mail.nome}:</span>
                              <span className="font-mono text-white/90 truncate max-w-[150px]" title={mail.email}>{mail.email}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveEmail(idx)}
                              className="text-white/40 hover:text-red-400 p-1 rounded-md hover:bg-red-500/10 transition-colors"
                              title="Remover Contato"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="flex gap-2 mt-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Nome (ex: RH)"
                          value={newEmailName}
                          onChange={(e) => setNewEmailName(formatEmployeeName(e.target.value))}
                          className="block w-full rounded-md sit-input py-1.5 px-2.5 text-xs placeholder:text-brand-muted"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="email"
                          placeholder="contato@empresa.com"
                          value={newEmailAddress}
                          onChange={(e) => setNewEmailAddress(e.target.value)}
                          className="block w-full rounded-md sit-input py-1.5 px-2.5 text-xs placeholder:text-brand-muted"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddEmail}
                        className="bg-brand-accent text-brand-bg hover:brightness-110 font-bold text-xs px-3.5 rounded-md transition-all flex items-center gap-1 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Adicionar
                      </button>
                    </div>
                  </div>

                  {/* Sites da Empresa */}
                  <div className="bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col gap-3">
                    <span className="text-xs font-semibold text-white/80">Sites da Empresa</span>
                    
                    <div className="space-y-2 max-h-40 overflow-y-auto styled-scrollbars min-h-[40px] flex flex-col justify-start">
                      {(!currentEmpresa.sites || currentEmpresa.sites.length === 0) ? (
                        <p className="text-xs text-brand-muted italic py-2 text-center">Nenhum site adicionado.</p>
                      ) : (
                        currentEmpresa.sites.map((st, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-black/30 border border-white/5 py-1.5 px-3 rounded-lg text-xs leading-none">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-bold text-brand-accent truncate max-w-[100px]" title={st.nome}>{st.nome}:</span>
                              <span className="font-mono text-white/90 truncate max-w-[150px]" title={st.url}>{st.url}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveSite(idx)}
                              className="text-white/40 hover:text-red-400 p-1 rounded-md hover:bg-red-500/10 transition-colors"
                              title="Remover Site"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="flex gap-2 mt-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Nome (ex: Portal)"
                          value={newSiteName}
                          onChange={(e) => setNewSiteName(e.target.value)}
                          className="block w-full rounded-md sit-input py-1.5 px-2.5 text-xs placeholder:text-brand-muted uppercase"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="www.empresa.com"
                          value={newSiteUrl}
                          onChange={(e) => setNewSiteUrl(e.target.value)}
                          className="block w-full rounded-md sit-input py-1.5 px-2.5 text-xs placeholder:text-brand-muted"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddSite}
                        className="bg-brand-accent text-brand-bg hover:brightness-110 font-bold text-xs px-3.5 rounded-md transition-all flex items-center gap-1 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Adicionar
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {currentEmpresa.endereco && currentEmpresa.endereco.length > 5 && (
                 <div className="mt-4 w-full h-32 rounded-lg overflow-hidden border border-brand-accent/30 opacity-80 pointer-events-none">
                    <iframe 
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(currentEmpresa.endereco)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                        width="100%" 
                        height="100%" 
                        className="border-0"
                        title="Live Map Preview"
                    />
                 </div>
              )}

              <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                <button type="submit" className="sit-button-primary rounded-lg px-6 py-2.5 text-white font-bold text-sm">
                  Salvar
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsEditingEmpresa(false)}
                  className="bg-black/20 hover:bg-black/30 text-white rounded-lg px-6 py-2.5 font-semibold text-sm transition-colors border border-brand-border"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {paginatedEmpresas.length === 0 && (
              <div className="col-span-full py-12 text-center text-brand-muted/70 italic bg-black/20 rounded-xl border border-white/10">
                <div className="flex flex-col items-center justify-center gap-2">
                  <Building className="w-8 h-8 text-white/15" />
                  <span>Nenhuma empresa encontrada.</span>
                </div>
              </div>
            )}
            {paginatedEmpresas.map((empresa, cardIdx) => {
              const empCount = employees.filter(e => e.empresa === empresa.razaoSocial).length;
              return (
                <motion.div 
                  key={empresa.id} 
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.3, ease: 'easeOut', delay: cardIdx * 0.05 }}
                  className="bg-brand-panel/30 hover:bg-brand-panel/45 backdrop-blur-sm border border-white/10 hover:border-[#38bdf8]/40 rounded-2xl p-5 flex flex-col shadow-xl hover:shadow-[0_20px_25px_-5px_rgba(3,66,137,0.3),0_0_15px_1px_rgba(56,189,248,0.05)] transition-all duration-300 relative overflow-hidden group md:h-[34rem]"
                >
                  {/* Premium glowing decorative highlight in card header on hover */}
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-brand-accent/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="flex-1 min-h-0 md:overflow-y-auto overflow-x-hidden pr-1 -mr-1">
                    {/* Card Header */}
                    <div className="flex justify-between items-start gap-3 mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 rounded-xl bg-brand-accent/10 border border-brand-accent/15 text-brand-accent shrink-0 font-bold group-hover:bg-brand-accent/20 group-hover:border-brand-accent/30 transition-all duration-300">
                           <Building className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-white group-hover:text-brand-accent transition-colors leading-snug text-base text-left truncate" title={empresa.razaoSocial}>
                            {empresa.razaoSocial}
                          </h3>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(empresa.cnpj);
                              setToast(`CNPJ "${empresa.cnpj}" copiado.`);
                            }}
                            className="font-mono text-[10px] text-brand-muted/70 flex items-center gap-1.5 mt-1 leading-none text-left hover:text-brand-accent hover:underline transition-colors cursor-pointer"
                            title="Clique para copiar o CNPJ"
                          >
                            <span>{empresa.cnpj}</span>
                            <Copy className="w-3 h-3 text-[#5fc5fa] opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Actions with absolute hover transition reveal */}
                      <div className="flex items-center gap-1.5 shrink-0 bg-black/20 border border-white/5 p-1 rounded-lg">
                        <button
                          onClick={() => { setCurrentEmpresa({ ...empresa, telefones: empresa.telefones || [], emails: empresa.emails || [], sites: empresa.sites || [] }); setIsEditingEmpresa(true); }}
                          className="p-1.5 text-white/50 hover:text-brand-accent hover:bg-brand-accent/15 transition-all rounded-md cursor-pointer hover:scale-110 active:scale-95"
                          title="Editar cadastro"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEmpresa(empresa.id)}
                          className="p-1.5 text-white/50 hover:text-red-400 hover:bg-red-500/15 transition-all rounded-md cursor-pointer hover:scale-110 active:scale-95"
                          title="Excluir cadastro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Content stats (Engaging Metrics) */}
                    <div className="mt-4 flex flex-col gap-1 border-t border-b border-white/5 py-3 ml-[-2px]">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#a5b4fc] font-semibold tracking-wider uppercase text-[9px]">Efetivo Integrado</span>
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-accent/10 border border-brand-accent/25 text-brand-accent shadow-sm">
                          {empCount} {empCount === 1 ? 'operador' : 'operadores'}
                        </span>
                      </div>
                      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-1.5 flex relative">
                        <div 
                          className="bg-gradient-to-r from-brand-accent to-[#5fc5fa] h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(95,197,250,0.4)]"
                          style={{ width: `${Math.min(100, Math.max(5, empCount * 10))}%` }}
                        />
                      </div>
                    </div>

                    {/* Contacts block list */}
                    <div className="my-4 space-y-3 pt-1">
                      {/* Telefones */}
                      {empresa.telefones && empresa.telefones.length > 0 ? (
                        <div className="flex flex-col gap-1.5 text-xs text-left">
                          <span className="text-white/40 text-[9px] uppercase tracking-wider font-bold tracking-widest flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Telefones de Plantão
                          </span>
                          <div className="flex flex-wrap gap-1.5 mt-0.5">
                            {empresa.telefones.map((tel, idx) => (
                              <button 
                                key={idx} 
                                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0ea5e9]/10 hover:bg-[#0284c7]/25 px-2.5 py-1 text-[10px] font-semibold text-[#38bdf8] border border-[#0ea5e9]/20 leading-none cursor-pointer hover:border-[#38bdf8]/40 transition-all duration-150 transform hover:scale-[1.02] active:scale-95"
                                title={`Clique para abrir WhatsApp: ${tel.numero}`}
                                onClick={() => handlePhoneClick(empresa.razaoSocial, tel.nome, tel.numero)}
                              >
                                <span className="text-white/90 font-bold border-r border-[#0ea5e9]/20 pr-1.5 mr-0.5">{tel.nome}</span> 
                                <span className="font-mono">{tel.numero}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {/* Emails */}
                      {empresa.emails && empresa.emails.length > 0 ? (
                        <div className="flex flex-col gap-1.5 text-xs text-left">
                          <span className="text-white/40 text-[9px] uppercase tracking-wider font-bold tracking-widest flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-[#5fc5fa]" /> Correio Eletrônico
                          </span>
                          <div className="flex flex-wrap gap-1.5 mt-0.5">
                            {empresa.emails.map((mail, idx) => (
                              <button 
                                key={idx} 
                                className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 hover:bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white/80 border border-white/10 leading-none cursor-pointer hover:border-[#5fc5fa]/30 transition-all duration-150 transform hover:scale-[1.02] active:scale-95" 
                                title={`Clique para copiar e-mail: ${mail.email}`}
                                onClick={() => handleCopyEmail(mail.email)}
                              >
                                <span className="text-white/60 font-bold border-r border-white/10 pr-1.5 mr-0.5">{mail.nome}</span> 
                                <span className="font-mono text-white/95 truncate max-w-[140px]">{mail.email}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {/* Sites */}
                      {empresa.sites && empresa.sites.length > 0 ? (
                        <div className="flex flex-col gap-1.5 text-xs text-left">
                          <span className="text-white/40 text-[9px] uppercase tracking-wider font-bold tracking-widest flex items-center gap-1.5">
                            <Globe className="w-3 h-3 text-[#818cf8]" /> Portais Web
                          </span>
                          <div className="flex flex-wrap gap-1.5 mt-0.5">
                            {empresa.sites.map((st, idx) => (
                              <a 
                                key={idx} 
                                href={st.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-lg bg-[#6366f1]/10 hover:bg-[#4f46e5]/25 px-2.5 py-1 text-[10px] font-semibold text-[#a5b4fc] border border-[#6366f1]/20 leading-none cursor-pointer hover:border-[#818cf8]/40 transition-all duration-150 transform hover:scale-[1.02] active:scale-95" 
                                title={`Clique para abrir no navegador: ${st.url}`}
                              >
                                <span className="text-[#c7d2fe] font-bold border-r border-[#6366f1]/20 pr-1.5 mr-0.5">{st.nome}</span> 
                                <span className="font-mono text-[#e0e7ff]">{st.url.replace(/^https?:\/\//i, '').replace(/\/+$/, '')}</span>
                                <ExternalLink className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                              </a>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {((!empresa.telefones || empresa.telefones.length === 0) && (!empresa.emails || empresa.emails.length === 0) && (!empresa.sites || empresa.sites.length === 0)) ? (
                        <p className="text-[10px] text-white/20 italic py-1 text-left bg-white/[0.02] border border-dashed border-white/5 rounded-lg px-2">Sem contatos cadastrados</p>
                      ) : null}
                    </div>

                    {/* Endereço */}
                    <div className="text-xs text-left pb-1 border-t border-white/5 pt-3 mt-1">
                      <span className="text-white/40 text-[9px] uppercase tracking-wider font-bold tracking-widest flex items-center justify-between mb-1.5">
                        <span>Endereço Administrativo</span>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(empresa.endereco);
                            setToast(`Endereço copiado para área de transferência!`);
                          }}
                          className="text-[9px] text-[#5fc5fa] hover:text-brand-accent hover:underline cursor-pointer lowercase flex items-center gap-1"
                        >
                          <Copy className="w-2.5 h-2.5" /> copiar
                        </button>
                      </span>
                      <p className="text-white/80 line-clamp-2 leading-relaxed text-xs bg-black/20 border border-white/5 px-3 py-2 rounded-xl" title={empresa.endereco}>
                        {empresa.endereco}
                      </p>
                    </div>
                  </div>

                  {/* Interactive Map Mini Frame with premium glassy design */}
                  {parseDMS(empresa.latitude) !== null && parseDMS(empresa.longitude) !== null ? (
                    <div 
                      className="mt-4 w-full h-24 rounded-xl overflow-hidden border border-white/10 bg-black/30 relative shadow-lg cursor-pointer hover:border-brand-accent/50 transition-all duration-300 transform active:scale-[0.99] group/map shrink-0"
                      onClick={() => setViewingMapEmpresa(empresa)}
                    >
                      <iframe 
                        src={getMapIframeUrl(empresa.latitude, empresa.longitude)}
                        width="100%" 
                        height="100%" 
                        className="border-0 pointer-events-none opacity-60 group-hover:opacity-85 transition-opacity duration-300"
                        loading="lazy"
                        title={`Mapa Card ${empresa.razaoSocial}`}
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                      <div className="absolute inset-0 bg-[#0ea5e9]/10 group-hover/map:bg-[#0ea5e9]/20 transition-colors duration-300" />
                      <div className="absolute bottom-2 right-2 bg-brand-panel-light/95 backdrop-blur-sm border border-brand-border/30 rounded-lg py-1 px-2 text-[9px] font-semibold text-white tracking-wider uppercase flex items-center gap-1 shadow-md">
                        <MapPin className="w-3 h-3 text-brand-accent" />
                        <span>Ver Mapa</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 w-full h-24 rounded-xl bg-black/15 border border-dashed border-white/5 flex items-center justify-center text-xs text-brand-muted/40 shrink-0">
                      Coordenadas geográficas indisponíveis
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Pagination Container for Empresas */}
          {totalEmpresasPages > 1 && (
            <div className="flex items-center justify-between border-t border-brand-border bg-black/10 px-6 py-4 mt-2 rounded-xl">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => setEmpresasCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={empresasCurrentPage === 1}
                  className="relative inline-flex items-center rounded-md border border-brand-border sit-panel-inner px-4 py-2 typ-card-desc text-white hover:brightness-110 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setEmpresasCurrentPage((p) => Math.min(totalEmpresasPages, p + 1))}
                  disabled={empresasCurrentPage === totalEmpresasPages}
                  className="relative ml-3 inline-flex items-center rounded-md border border-brand-border sit-panel-inner px-4 py-2 typ-card-desc text-white hover:brightness-110 disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="typ-card-desc">
                    Mostrando <span className="font-bold text-white">{((empresasCurrentPage - 1) * empresasPerPage) + 1}</span> até{' '}
                    <span className="font-bold text-white">
                      {Math.min(empresasCurrentPage * empresasPerPage, filteredEmpresas.length)}
                    </span>{' '}
                    de <span className="font-bold text-white">{filteredEmpresas.length}</span> empresas
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    {Array.from({ length: totalEmpresasPages }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setEmpresasCurrentPage(idx + 1)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus:outline-offset-0 ${
                          empresasCurrentPage === idx + 1
                            ? 'z-10 bg-brand-panel-light text-white ring-1 ring-inset ring-brand-border'
                            : 'text-brand-muted ring-1 ring-inset ring-brand-border bg-brand-panel hover:bg-brand-panel-light'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {viewingMapUnidade && (
        <MapModal 
          location={viewingMapUnidade} 
          onClose={() => setViewingMapUnidade(null)} 
        />
      )}

      {viewingMapEmpresa && (
        <MapModal 
          location={{ nome: viewingMapEmpresa.razaoSocial, latitude: viewingMapEmpresa.latitude, longitude: viewingMapEmpresa.longitude }} 
          onClose={() => setViewingMapEmpresa(null)} 
        />
      )}

      <WhatsAppConfirmModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        employee={employeeForWhatsApp}
      />

      <ConfirmModal
        isOpen={deleteConfirmState.isOpen}
        onClose={() => setDeleteConfirmState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={deleteConfirmState.onConfirm || undefined}
        title={deleteConfirmState.title}
        message={deleteConfirmState.message}
        isAlertOnly={deleteConfirmState.isAlertOnly}
      />

      {toast && typeof document !== 'undefined' && createPortal(
        <div 
          id="copy-toast" 
          className="fixed bottom-6 left-6 z-[9999] flex items-center gap-2.5 rounded-lg border border-brand-accent/30 bg-[#121620]/95 backdrop-blur-sm px-4 py-3 text-xs font-semibold text-[#6ee7b7] shadow-2xl shadow-black/80 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
        >
          <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
          <span className="text-white">{toast}</span>
        </div>,
        document.body
      )}
    </div>
  );
}
