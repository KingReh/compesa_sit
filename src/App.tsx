import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Plus, Building2, LayoutDashboard, UserPlus, FileText, Settings, Users, Calendar, LogOut, UserCheck, Download, CheckCircle2, Bell } from 'lucide-react';
import { Employee, Coordenacao, Contrato, Unidade, Empresa, AuthSession, VacationPlan } from './types';
import { formatEmployeeName } from './utils';
import { useAuth } from './context/AuthContext';
import { Dashboard } from './components/Dashboard';
import { EmployeeTable } from './components/EmployeeTable';
import { EmployeeModal } from './components/EmployeeModal';
import { ConfirmModal } from './components/ConfirmModal';
import { ViewModal } from './components/ViewModal';
import { DriversModal } from './components/DriversModal';
import { AjustarPontoModal } from './components/AjustarPontoModal';
import { RegistrationPanel } from './components/RegistrationPanel';
import { WhatsAppConfirmModal } from './components/WhatsAppConfirmModal';
import { MapaLotacoesWidget } from './components/MapaLotacoesWidget';
import { VacationPlanning } from './components/VacationPlanning';
import { Reports } from './components/Reports';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { BirthdayToasts } from './components/BirthdayToasts';
import { CorporateFABMenu } from './components/CorporateFABMenu';
import { AuthScreen } from './components/AuthScreen';
import { WelcomeModal, isWelcomeSeen } from './components/WelcomeModal';
import { NotificationCenter } from './components/NotificationCenter';
import { useFilters } from './context/FiltersContext';
import { empresasService } from './services/empresasService';
import { coordenacoesService } from './services/coordenacoesService';
import { unidadesService } from './services/unidadesService';
import { contratosService } from './services/contratosService';
import { employeesService } from './services/employeesService';
import { vacationPlansService } from './services/vacationPlansService';


export default function App() {
  const { user, isLoading, signOut } = useAuth();
  const { searchQuery, setSearchQuery, applyFilters } = useFilters();

  const handleLogout = () => {
    signOut();
  };

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [coordenacoes, setCoordenacoes] = useState<Coordenacao[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [vacationPlans, setVacationPlans] = useState<VacationPlan[]>([]);
  const [currentView, setCurrentView] = useState<'painel' | 'configuracao' | 'relatorios' | 'ferias'>('painel');
  const [installToast, setInstallToast] = useState(false);

  // Fonte única da verdade: aplica os filtros globais em toda a aplicação.
  // Central de Notificações, Mapa de Lotações e Painel Executivo compartilham
  // exatamente o mesmo subconjunto de dados.
  const filteredEmployees = React.useMemo(() => applyFilters(employees), [applyFilters, employees]);

  // One-time cleanup of legacy transient UI state persisted in localStorage.
  // We intentionally do NOT persist navigation, tabs, search queries, pagination
  // or other transient UI state across sessions. Only data filters/display
  // preferences remain persisted by their respective components.
  useEffect(() => {
    try {
      const transientKeys = [
        '@sit:currentView',
        '@sit:reg:activeTab',
        '@sit:reg:unidadeSearchQuery',
        '@sit:reg:unidadesCurrentPage',
        '@sit:reg:empresaSearchQuery',
        '@sit:reg:empresasCurrentPage',
        '@sit:vacation:activeTab',
        '@sit:vacation:selectedDetailMonth',
        '@sit:vacation:detailSearchQuery',
        '@sit:vacation:selectedCoords',
        '@sit:vacation:selectedEmps',
        '@sit:vacation:searchQuery',
        '@sit:vacation:currentPage',
        '@sit:reports:activeSubTab',
        '@sit:reports:statusTableSearch',
        '@sit:currentPage',
      ];
      transientKeys.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Auto-hide install toast
  useEffect(() => {
    if (!installToast) return;
    const timer = setTimeout(() => setInstallToast(false), 4000);
    return () => clearTimeout(timer);
  }, [installToast]);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isAjustarPontoOpen, setIsAjustarPontoOpen] = useState(false);
  const [isDriversModalOpen, setIsDriversModalOpen] = useState(false);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);


  // Handlers state
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
  const [employeeToView, setEmployeeToView] = useState<Employee | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);
  const [employeeForWhatsApp, setEmployeeForWhatsApp] = useState<Employee | null>(null);
  const [employeeForAjustarPonto, setEmployeeForAjustarPonto] = useState<Employee | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDbLoading, setIsDbLoading] = useState(true);

  // Load data from Supabase
  useEffect(() => {
    if (!user) {
      setIsDbLoading(false);
      return;
    }

    async function loadDbData() {
      try {
        setIsDbLoading(true);
        const [empRows, coordRows, unitRows, contrRows, emplRows, vacRows] = await Promise.all([
          empresasService.getEmpresas(),
          coordenacoesService.getCoordenacoes(),
          unidadesService.getUnidades(),
          contratosService.getContratos(),
          employeesService.getEmployees(),
          vacationPlansService.getVacationPlans()
        ]);
        setEmpresas(empRows);
        setCoordenacoes(coordRows);
        setUnidades(unitRows);
        setContratos(contrRows);
        setEmployees(emplRows);
        setVacationPlans(vacRows);
      } catch (err) {
        console.error('Erro ao carregar dados do Supabase:', err);
      } finally {
        setIsDbLoading(false);
        setIsLoaded(true);
      }
    }

    loadDbData();
  }, [user?.id]);

  // Exibe modal de boas-vindas no primeiro acesso do usuário autenticado.
  useEffect(() => {
    if (isLoading || !user) return;
    if (!isWelcomeSeen()) {
      // Pequeno atraso para não competir com o carregamento inicial da interface.
      const timer = setTimeout(() => setIsWelcomeOpen(true), 400);
      return () => clearTimeout(timer);
    }
  }, [user, isLoading]);

  const handleSave = async (employee: Omit<Employee, 'id'> & { id?: string }) => {
    try {
      if (employeeToEdit && employee.id) {
        const updated = await employeesService.updateEmployee(employee as Employee);
        setEmployees((prev) => prev.map((e) => e.id === updated.id ? updated : e));
      } else {
        const created = await employeesService.createEmployee(employee);
        setEmployees((prev) => [...prev, created]);
      }
      setIsFormModalOpen(false);
      setEmployeeToEdit(null);
    } catch (err) {
      console.error('Erro ao salvar funcionário:', err);
      alert('Ocorreu um erro ao salvar o funcionário no banco de dados.');
    }
  };

  const handleEdit = (employee: Employee) => {
    setEmployeeToEdit(employee);
    setIsFormModalOpen(true);
  };

  const handleDeleteRequest = (id: string) => {
    setEmployeeToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (employeeToDelete) {
      try {
        await employeesService.deleteEmployee(employeeToDelete);
        setEmployees((prev) => prev.filter((e) => e.id !== employeeToDelete));
      } catch (err) {
        console.error('Erro ao excluir funcionário:', err);
        alert('Ocorreu um erro ao excluir o funcionário do banco de dados.');
      }
    }
    setEmployeeToDelete(null);
  };

  const handleView = (employee: Employee) => {
    setEmployeeToView(employee);
    setIsViewModalOpen(true);
  };

  const handleViewDriver = (employee: Employee) => {
    setEmployeeToView(employee);
    setIsDriversModalOpen(false);
    setIsViewModalOpen(true);
  };

  const handleWhatsAppClick = (employee: Employee) => {
    setEmployeeForWhatsApp(employee);
    setIsWhatsAppModalOpen(true);
  };

  const handleAjustarPontoClick = (employee: Employee) => {
    setEmployeeForAjustarPonto(employee);
    setIsViewModalOpen(false);
    setIsAjustarPontoOpen(true);
  };

  const handleOpenNew = () => {
    setEmployeeToEdit(null);
    setIsFormModalOpen(true);
  };

  const renderContent = () => {
    if (currentView === 'painel') {
      return (
        <div className="animate-fade-in">
          {/* Top Panel (Actions & Title) */}
          <div className="sit-panel p-4 sm:p-6 mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-6">
            <div>
              <p className="typ-subtitle mb-1">Portal Geral Corporativo</p>
              <h2 className="typ-hero mt-1">SIT - Painel Executivo</h2>
              <p className="typ-card-desc mt-1">Console consolidado para monitoramento de efetivo, alocações e conformidade de equipes.</p>
            </div>
            <div className="flex flex-col flex-1 sm:flex-row items-center justify-end gap-2 sm:gap-4 w-full">
              <div className="relative w-full sm:max-w-xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-brand-muted">
                  <Search className="h-4 w-4" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="sit-input block w-full rounded-lg py-2 sm:py-2.5 pl-10 pr-4 text-xs sm:text-sm"
                />
              </div>
              <button
                onClick={handleOpenNew}
                className="sit-button-primary w-full sm:w-auto inline-flex justify-center items-center gap-x-2 rounded-lg px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-bold shadow-sm shrink-0"
              >
                <Plus className="-ml-0.5 h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                <span className="typ-card-title !text-white">Cadastrar</span>
              </button>
            </div>
          </div>

          <Dashboard
            employees={employees}
            unidades={unidades}
            contratos={contratos}
            onDriversClick={() => setIsDriversModalOpen(true)}
          />

          <EmployeeTable
            employees={employees}
            unidades={unidades}
            contratos={contratos}
            searchQuery={searchQuery}
            onEdit={handleEdit}
            onDelete={handleDeleteRequest}
            onView={handleView}
            onWhatsAppClick={handleWhatsAppClick}
          />
        </div>
      );
    }
    if (currentView === 'configuracao') {
      return (
        <RegistrationPanel
          coordenacoes={coordenacoes}
          setCoordenacoes={setCoordenacoes}
          contratos={contratos}
          setContratos={setContratos}
          unidades={unidades}
          setUnidades={setUnidades}
          empresas={empresas}
          setEmpresas={setEmpresas}
          employees={employees}
          setEmployees={setEmployees}
        />
      );
    }
    if (currentView === 'relatorios') {
      return (
        <Reports
          employees={employees}
          coordenacoes={coordenacoes}
          contratos={contratos}
          unidades={unidades}
          empresas={empresas}
        />
      );
    }
    if (currentView === 'ferias') {
      return (
        <VacationPlanning
          employees={employees}
          coordenacoes={coordenacoes}
          empresas={empresas}
        />
      );
    }
  };

  if (isLoading || isDbLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-radial from-brand-panel via-brand-bg to-[#011B3D]">
        <svg className="animate-spin h-10 w-10 text-brand-accent" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans animate-fade-in">

      {/* Header NavBar */}
      <header className="pt-8 pb-4">
        <div className="mx-auto max-w-[1400px] px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-bg shadow-lg shadow-black/10">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <h1 className="typ-brand leading-none">SIT</h1>
                <p className="typ-brand-sub leading-none mt-1 text-brand-accent">SISTEMA INTEGRADO DE TERCEIRIZADOS</p>
              </div>
            </div>

            {/* Profile and Logout option in Header */}
            <div className="flex items-center gap-2 sm:gap-4">
              <NotificationCenter
                employees={employees}
                vacationPlans={vacationPlans}
                onViewEmployee={(emp) => {
                  setEmployeeToView(emp);
                  setIsViewModalOpen(true);
                }}
                onNavigate={(view) => setCurrentView(view)}
              />

              <div className="hidden sm:flex flex-col text-right">
                <span className="text-sm font-bold text-white select-none">{user?.nome}</span>
                <span className="text-[10px] text-brand-muted uppercase tracking-widest font-mono font-bold select-none">
                  {user?.perfil === 'Admin' ? 'Administrador' : 'Usuário - SIT'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-white transition-colors cursor-pointer select-none active:scale-[0.98]"
                title="Sair do Sistema"
                id="header-logout-btn"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <main className="flex-1 pb-8">
        <div className="mx-auto max-w-[1400px] px-3 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-3 sm:gap-6 animate-slide-up">

          {/* Sidebar */}
          <aside className="w-full lg:w-72 flex-shrink-0 space-y-3 sm:space-y-6">

            {/* Logged User Info */}
            <div className="sit-panel p-5 relative overflow-hidden animate-fade-in" id="sidebar-user-card">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <UserCheck className="w-20 h-20 text-white" />
              </div>
              <div className="flex items-center gap-3 mb-4 select-none">
                <div className="h-10 w-10 shrink-0 rounded-full bg-brand-accent/20 border border-brand-accent/30 flex items-center justify-center text-brand-accent font-bold text-sm">
                  {user?.nome.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white truncate" title={user?.nome}>
                    {user?.nome}
                  </h4>
                  <p className="text-[10px] text-brand-muted truncate block mt-0.5">
                    CPF: {user?.matricula}
                  </p>
                </div>
              </div>
              <div className="bg-black/15 rounded-lg p-3 border border-white/5 space-y-1.5 select-none text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-brand-muted font-semibold uppercase">Perfil</span>
                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded text-white ${user?.perfil === 'Admin' ? 'bg-amber-500/40 border border-amber-500/20' : 'bg-brand-accent/40 border border-brand-accent/20'
                    }`}>
                    {user?.perfil === 'Admin' ? 'Administrador' : 'Usuário - SIT'}
                  </span>
                </div>
                <div className="text-[10px] text-brand-muted truncate font-mono mt-1" title={user?.email}>
                  {user?.email}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full mt-4 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-white transition-all duration-200 cursor-pointer"
                id="sidebar-logout-btn"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sair do Sistema</span>
              </button>
            </div>

            <div className="sit-panel p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span className="typ-subtitle text-brand-muted tracking-wider text-[10px]">COORDENAÇÕES CONECTADAS</span>
              </div>
              <h3 className="typ-card-title text-white mb-2">SIT - COMPESA</h3>
              <p className="typ-card-desc leading-relaxed">
                Status geral e controle operacional da força de trabalho terceirizada na gerência GPM.
              </p>
            </div>

            <nav className="sit-panel overflow-hidden">
              <div className="p-4 border-b border-white/5">
                <span className="typ-subtitle text-brand-muted tracking-wider text-[10px]">MENU DE APLICAÇÕES</span>
              </div>
              <div className="p-2 flex flex-col gap-1">
                <button
                  onClick={() => setCurrentView('painel')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${currentView === 'painel' ? 'bg-black/20 text-white font-medium shadow-inner' : 'text-brand-muted hover:text-white hover:bg-black/10'}`}
                >
                  <LayoutDashboard className="w-5 h-5 shrink-0" />
                  <span className="text-sm">Painel Executivo</span>
                </button>
                <button
                  onClick={() => setCurrentView('ferias')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${currentView === 'ferias' ? 'bg-black/20 text-white font-medium shadow-inner' : 'text-brand-muted hover:text-white hover:bg-black/10'}`}
                >
                  <Calendar className="w-5 h-5 shrink-0" />
                  <span className="text-sm">Planejamento de Férias</span>
                </button>
                <button
                  onClick={() => setCurrentView('relatorios')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${currentView === 'relatorios' ? 'bg-black/20 text-white font-medium shadow-inner' : 'text-brand-muted hover:text-white hover:bg-black/10'}`}
                >
                  <FileText className="w-5 h-5 shrink-0" />
                  <span className="text-sm">Relatórios</span>
                </button>
                <button
                  onClick={() => setCurrentView('configuracao')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${currentView === 'configuracao' ? 'bg-black/20 text-white font-medium shadow-inner' : 'text-brand-muted hover:text-white hover:bg-black/10'}`}
                >
                  <Settings className="w-5 h-5 shrink-0" />
                  <span className="text-sm">Configuração</span>
                </button>
                <button
                  onClick={() => {
                    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone || document.referrer.includes('android-app://');
                    if (isStandalone) {
                      setInstallToast(true);
                    } else {
                      window.dispatchEvent(new CustomEvent('reopen-pwa-prompt'));
                    }
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left text-brand-muted hover:text-white hover:bg-black/10"
                >
                  <Download className="w-5 h-5 shrink-0" />
                  <span className="text-sm">Instalar App</span>
                </button>
              </div>
            </nav>

            {/* Injetando o Widget do Mapa de Lotações */}
            <MapaLotacoesWidget unidades={unidades} employees={employees} />

          </aside>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {renderContent()}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 mt-auto border-t border-white/10 bg-black/10 select-none">
        <div className="mx-auto max-w-[1400px] px-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-brand-muted/90">
            Desenvolvido por: <span className="text-white font-semibold">Renato Henrique</span> — Administrativo CMA SUL/GPM
          </p>
          <p className="text-xs text-brand-muted/70">
            © 2026 Gerenciamento de Terceirizados
          </p>
        </div>
      </footer>

      {/* Modals */}
      <EmployeeModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSave}
        employeeToEdit={employeeToEdit}
        coordenacoes={coordenacoes}
        contratos={contratos}
        unidades={unidades}
        empresas={empresas}
      />

      <ViewModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        employee={employeeToView}
        onAjustarPonto={handleAjustarPontoClick}
      />

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Excluir Funcionário"
        message="Tem certeza que deseja excluir este funcionário? Esta ação não poderá ser desfeita e os dados serão removidos permanentemente."
      />

      <WhatsAppConfirmModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        employee={employeeForWhatsApp}
      />

      <AjustarPontoModal
        isOpen={isAjustarPontoOpen}
        onClose={() => setIsAjustarPontoOpen(false)}
        employees={employees}
        initialEmployee={employeeForAjustarPonto}
        empresas={empresas}
      />

      <DriversModal
        isOpen={isDriversModalOpen}
        onClose={() => setIsDriversModalOpen(false)}
        employees={employees}
        onView={handleViewDriver}
      />

      <PWAInstallPrompt />
      <BirthdayToasts employees={employees} />
      <WelcomeModal isOpen={isWelcomeOpen} onClose={() => setIsWelcomeOpen(false)} />
      <CorporateFABMenu empresas={empresas} onNavigateToConfig={() => setCurrentView('configuracao')} />

      {/* Toast: app already installed */}
      {installToast && createPortal(
        <div className="fixed bottom-6 right-6 z-[10000] animate-fade-in">
          <div className="sit-panel p-4 flex items-center gap-3 shadow-2xl border border-green-500/30 bg-green-950/90 backdrop-blur-xl text-white rounded-xl">
            <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
            <div>
              <p className="text-sm font-bold text-white">App já instalado</p>
              <p className="text-xs text-green-200/80">O SIT está sendo executado no modo aplicativo.</p>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
