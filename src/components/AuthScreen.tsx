import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Lock, 
  Mail, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ArrowLeft, 
  AlertTriangle, 
  CheckCircle, 
  ShieldAlert, 
  KeyRound, 
  UserCheck, 
  ClipboardCheck,
  Copy,
  Check
} from 'lucide-react';
import { User as AppUser, UserProfile, AuthSession } from '../types';
import { hashPassword, evaluatePasswordStrength } from '../utils/crypto';

// In-memory/localStorage constants
const USERS_STORAGE_KEY = '@sit:users';
const SESSION_STORAGE_KEY = '@sit:session';
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

interface AuthScreenProps {
  onLoginSuccess: (session: AuthSession) => void;
}

export function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  // Screens: 'login' | 'register_step1' | 'register_step2' | 'forgot_password' | 'force_password_reset'
  const [currentScreen, setCurrentScreen] = useState<'login' | 'register_step1' | 'register_step2' | 'forgot_password' | 'force_password_reset'>('login');
  
  // General State
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isLocked = false;

  // --- LOGIN STATE ---
  const [loginIdentifier, setLoginIdentifier] = useState(''); // matrícula or e-mail
  const [loginPassword, setLoginPassword] = useState('');

  // --- REGISTER STATE ---
  // Step 1
  const [regNome, setRegNome] = useState('');
  const [regMatricula, setRegMatricula] = useState('');
  const [regEmail, setRegEmail] = useState('');
  // Step 2
  const [regPerfil, setRegPerfil] = useState<UserProfile>('Gestor de Contrato');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // --- FORGOT PASSWORD STATE ---
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [generatedTempPassword, setGeneratedTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // --- FORCE PASSWORD RESET STATE ---
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');



  // First Access Auto Seed
  useEffect(() => {
    const seedDefaultAdmin = async () => {
      try {
        const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
        const users: AppUser[] = storedUsers ? JSON.parse(storedUsers) : [];
        if (users.length === 0) {
          const adminPassHash = await hashPassword('SIT@2026');
          const defaultAdmin: AppUser = {
            id: 'admin-default',
            nome: 'Administrador SIT',
            matricula: '00001',
            email: 'admin@sit.interno',
            perfil: 'Admin',
            passwordHash: adminPassHash,
          };
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([defaultAdmin]));
        }
      } catch (e) {
        console.error('Erro no semeio automático de Admin', e);
      }
    };
    seedDefaultAdmin();
  }, []);

  // Helper: Retrieve all users safely
  const getStoredUsers = (): AppUser[] => {
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  // Helper: Save users back to localStorage
  const saveStoredUsers = (users: AppUser[]) => {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Login Attempt
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!loginIdentifier || !loginPassword) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate slight network delay for premium feedback
      await new Promise(resolve => setTimeout(resolve, 800));

      const users = getStoredUsers();
      const inputHash = await hashPassword(loginPassword);

      // Search user by email OR matrícula (case insensitive for email)
      const sanitizedIdentifier = loginIdentifier.trim().toLowerCase();
      const user = users.find(u => 
        u.matricula.trim() === loginIdentifier.trim() || 
        u.email.trim().toLowerCase() === sanitizedIdentifier
      );

      if (user && user.passwordHash === inputHash) {
        if (user.needsPasswordReset) {
          setResettingUserId(user.id);
          setNewPassword('');
          setConfirmNewPassword('');
          setCurrentScreen('force_password_reset');
          setSuccess('Código temporário validado. Redirecionando para definição de nova senha...');
          setIsLoading(false);
          return;
        }

        // Populate session
        const session: AuthSession = {
          userId: user.id,
          nome: user.nome,
          matricula: user.matricula,
          email: user.email,
          perfil: user.perfil,
          expiresAt: Date.now() + SESSION_DURATION_MS,
        };

        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
        setSuccess('Autenticação bem-sucedida! Entrando...');
        
        // Brief timeout before notifying parent component
        setTimeout(() => {
          onLoginSuccess(session);
        }, 600);
      } else {
        // Rule: Error messages should never specify which field is incorrect
        setError('Usuário ou senha incorretos.');
      }
    } catch (err) {
      setError('Ocorreu um erro ao processar a autenticação. Tente novamente.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Registration Step 1
  const handleRegisterStep1Next = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const name = regNome.trim();
    const matricula = regMatricula.trim();
    const email = regEmail.trim();

    if (!name || !matricula || !email) {
      setError('Por favor, preencha todos os campos do primeiro passo.');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, insira um endereço de e-mail válido.');
      return;
    }

    // Check duplicate email or matrícula
    const users = getStoredUsers();
    const isDuplicateEmail = users.some(u => u.email.toLowerCase() === email.toLowerCase());
    const isDuplicateMatricula = users.some(u => u.matricula.toLowerCase() === matricula.toLowerCase());

    if (isDuplicateEmail) {
      setError('Já existe um usuário cadastrado com este e-mail.');
      return;
    }

    if (isDuplicateMatricula) {
      setError('Já existe um usuário cadastrado com este CPF.');
      return;
    }

    setIsLoading(true);

    try {
      // Validação local (sem backend): segue para a próxima etapa.
      // Quando houver serviço de validação de CPF, reintroduzir a chamada aqui.
      setCurrentScreen('register_step2');
    } catch (err) {
      setError('Não foi possível prosseguir com o cadastro. Tente novamente.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Complete Registration (Step 2)
  const handleRegisterComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!regPassword || !regConfirmPassword) {
      setError('Por favor, preencha os campos de senha.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    const strength = evaluatePasswordStrength(regPassword);
    if (strength === 'Fraca') {
      setError('A senha informada é fraca demais. Ela deve conter no mínimo 6 caracteres.');
      return;
    }

    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const users = getStoredUsers();
      const passwordHash = await hashPassword(regPassword);

      const newUser: AppUser = {
        id: `user-${Math.random().toString(36).substr(2, 9)}`,
        nome: regNome.trim(),
        matricula: regMatricula.trim(),
        email: regEmail.trim().toLowerCase(),
        perfil: regPerfil,
        passwordHash,
      };

      users.push(newUser);
      saveStoredUsers(users);

      // Auto-login upon registration
      const session: AuthSession = {
        userId: newUser.id,
        nome: newUser.nome,
        matricula: newUser.matricula,
        email: newUser.email,
        perfil: newUser.perfil,
        expiresAt: Date.now() + SESSION_DURATION_MS,
      };

      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      setSuccess('Cadastro efetuado com sucesso! Entrando...');

      setTimeout(() => {
        onLoginSuccess(session);
      }, 800);
    } catch (err) {
      setError('Erro ao concluir o cadastro profissional. Tente novamente.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot password flow - Generate temporary password on-screen without email
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setGeneratedTempPassword(null);

    const identifier = forgotIdentifier.trim();
    if (!identifier) {
      setError('Preencha seu e-mail ou CPF cadastrados.');
      return;
    }

    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      const users = getStoredUsers();
      const userIndex = users.findIndex(u => 
        u.matricula.trim() === identifier || 
        u.email.toLowerCase() === identifier.toLowerCase()
      );

      if (userIndex !== -1) {
        const matchedUser = users[userIndex];
        
        // Generate a random temporary password (e.g. SIT@2026-TEMP-4592)
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const tempPassword = `SIT@2026-TEMP-${randomNum}`;

        // Save new hashed password temporary
        const tempHash = await hashPassword(tempPassword);
        users[userIndex] = {
          ...matchedUser,
          passwordHash: tempHash,
          needsPasswordReset: true
        };
        saveStoredUsers(users);

        setGeneratedTempPassword(tempPassword);
        setSuccess('Uma nova senha temporária foi gerada com sucesso.');
      } else {
        // Keep security practices: don't disclose whether the identifier exists
        setError('Nenhum usuário foi localizado com as credenciais especificadas.');
      }
    } catch (err) {
      setError('Erro ao processar recuperação de senha.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Force Password Reset Flow
  const handleForcePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!resettingUserId) {
      setError('Sessão de redefinição inválida. Tente novamente.');
      return;
    }

    if (!newPassword || !confirmNewPassword) {
      setError('Preencha os campos de nova senha de acesso.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('As senhas digitadas não são idênticas.');
      return;
    }

    const strength = evaluatePasswordStrength(newPassword);
    if (strength === 'Fraca') {
      setError('Por razões de segurança corporativa, a senha não pode ser classificada como Fraca.');
      return;
    }

    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const users = getStoredUsers();
      const userIndex = users.findIndex(u => u.id === resettingUserId);

      if (userIndex !== -1) {
        const passwordHash = await hashPassword(newPassword);
        const updatedUser = {
          ...users[userIndex],
          passwordHash,
          needsPasswordReset: false // successful reset, clear flag
        };

        const updatedUsers = [...users];
        updatedUsers[userIndex] = updatedUser;
        saveStoredUsers(updatedUsers);

        // Auto-login upon resetting
        const session: AuthSession = {
          userId: updatedUser.id,
          nome: updatedUser.nome,
          matricula: updatedUser.matricula,
          email: updatedUser.email,
          perfil: updatedUser.perfil,
          expiresAt: Date.now() + SESSION_DURATION_MS,
        };

        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
        setSuccess('Nova senha salva com sucesso! Entrando no sistema...');

        setTimeout(() => {
          onLoginSuccess(session);
        }, 800);
      } else {
        setError('Erro interno: usuário não cadastrado.');
      }
    } catch (err) {
      setError('Ocorreu um erro ao atualizar sua senha corporativa.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset inputs
  const resetRegForm = () => {
    setRegNome('');
    setRegMatricula('');
    setRegEmail('');
    setRegPassword('');
    setRegConfirmPassword('');
    setRegPerfil('Gestor de Contrato');
    setNewPassword('');
    setConfirmNewPassword('');
    setResettingUserId(null);
    setCopied(false);
    setError(null);
    setSuccess(null);
  };

  // Evaluation visual helpers for password dynamic bar
  const passwordStrength = evaluatePasswordStrength(regPassword);
  const newPasswordStrength = evaluatePasswordStrength(newPassword);
  
  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-radial from-brand-panel via-brand-bg to-[#011B3D] font-sans">
      
      {/* Upper Logo header */}
      <div className="mb-4 text-center select-none animate-fade-in">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-brand-bg shadow-2xl mb-3">
          <Building2 className="h-10 w-10 text-[#034289]" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white leading-none">SIT</h1>
        <p className="text-[10px] tracking-widest uppercase text-brand-accent font-bold mt-1.5">
          Sistema Integrado de Terceirizados
        </p>
      </div>

      {/* Main card box container */}
      <div id="auth-main-card" className="w-full max-w-lg sit-panel p-8 sm:p-10 relative overflow-hidden animate-slide-up">
        
        {/* Visual elegant decoration line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-accent via-emerald-400 to-brand-accent" />

        {/* --- GENERAL ALERTS DISPLAY --- */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/15 border border-rose-500/20 text-rose-200 text-xs flex gap-3 items-start animate-fade-in">
            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
            <div>
              <p className="font-bold">Atenção</p>
              <p className="mt-0.5 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {success && !generatedTempPassword && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-200 text-xs flex gap-3 items-start animate-fade-in">
            <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
            <div>
              <p className="font-bold">Status</p>
              <p className="mt-0.5 leading-relaxed">{success}</p>
            </div>
          </div>
        )}

        {/* --- SCREEN 1: LOGIN PANEL --- */}
        {currentScreen === 'login' && (
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold text-white tracking-tight">Portal Corporativo</h2>
              <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                Insira suas credenciais integradas de e-mail ou CPF para efetuar o login corporativo.
              </p>
            </div>



            <div className="space-y-4">
              <div>
                <label className="typ-form-label block" htmlFor="login-identity">E-mail ou CPF</label>
                <div className="relative mt-1.5">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-muted">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    id="login-identity"
                    type="text"
                    required
                    disabled={isLocked || isLoading}
                    placeholder="CPF ou email@gmail.com"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="sit-input block w-full rounded-xl py-3 pl-10 pr-4 text-sm"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <label className="typ-form-label" htmlFor="login-pass">Senha de Acesso</label>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setSuccess(null);
                      setCurrentScreen('forgot_password');
                    }}
                    className="text-xs text-brand-accent hover:underline font-semibold focus:outline-none"
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <div className="relative mt-1.5">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-muted">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    id="login-pass"
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={isLocked || isLoading}
                    placeholder="Digite sua senha cadastrada"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="sit-input block w-full rounded-xl py-3 pl-10 pr-11 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-brand-muted hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLocked || isLoading}
              className="sit-button-primary w-full py-3.5 rounded-xl text-sm font-bold flex justify-center items-center gap-2 cursor-pointer select-none active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Autenticando credenciais...</span>
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4" />
                  <span>Entrar no Sistema</span>
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <span className="text-xs text-brand-muted">Novo usuário no SIT? </span>
              <button
                type="button"
                onClick={() => {
                  resetRegForm();
                  setCurrentScreen('register_step1');
                }}
                className="text-xs text-brand-accent hover:underline font-bold focus:outline-none"
              >
                Criar cadastro de acesso
              </button>
            </div>
          </form>
        )}

        {/* --- SCREEN 2: REGISTRATION STEP 1 (PERSONAL DETAILS) --- */}
        {currentScreen === 'register_step1' && (
          <form onSubmit={handleRegisterStep1Next} className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Cadastro de Novo Usuário</h2>
                <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                  Passo 1 de 2: Informe suas informações pessoais e de identificação.
                </p>
              </div>
              <span className="text-xs bg-brand-panel-light px-3 py-1.5 rounded-lg border border-brand-border/30 font-bold font-mono">1 / 2</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="typ-form-label block" htmlFor="reg-nome">Nome Completo</label>
                <div className="relative mt-1.5">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-muted">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    id="reg-nome"
                    type="text"
                    required
                    placeholder="Seu nome profissional completo"
                    value={regNome}
                    onChange={(e) => setRegNome(e.target.value)}
                    className="sit-input block w-full rounded-xl py-3 pl-10 pr-4 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="typ-form-label block" htmlFor="reg-matricula">CPF do Usuário</label>
                <div className="relative mt-1.5">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-muted">
                    <ClipboardCheck className="h-4 w-4" />
                  </span>
                  <input
                    id="reg-matricula"
                    type="text"
                    required
                    placeholder="Apenas números (Ex: 12345678901)"
                    value={regMatricula}
                    onChange={(e) => setRegMatricula(e.target.value)}
                    className="sit-input block w-full rounded-xl py-3 pl-10 pr-4 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="typ-form-label block" htmlFor="reg-email">E-mail</label>
                <div className="relative mt-1.5">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-muted">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    placeholder="email@sit.interno ou email@empresa.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="sit-input block w-full rounded-xl py-3 pl-10 pr-4 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => setCurrentScreen('login')}
                className="w-1/3 py-3 rounded-xl border border-white/10 text-brand-muted hover:text-white hover:bg-white/5 text-sm font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="sit-button-primary flex-1 py-3.5 rounded-xl text-sm font-bold flex justify-center items-center gap-2 cursor-pointer select-none active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Validando CPF...</span>
                  </>
                ) : (
                  <>
                    <span>Prosseguir</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* --- SCREEN 3: REGISTRATION STEP 2 (PASSWORD) --- */}
        {currentScreen === 'register_step2' && (
          <form onSubmit={handleRegisterComplete} className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Cadastro de Usuário</h2>
                <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                  Passo 2 de 2: Defina sua senha de acesso segura.
                </p>
              </div>
              <span className="text-xs bg-brand-panel-light px-3 py-1.5 rounded-lg border border-brand-border/30 font-bold font-mono">2 / 2</span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center">
                  <label className="typ-form-label block" htmlFor="reg-pass">Senha de Acesso</label>
                  {regPassword && (
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      passwordStrength === 'Fraca' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/10' :
                      passwordStrength === 'Média' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/10' :
                      'bg-emerald-500/20 text-emerald-300 border border-emerald-500/10'
                    }`}>
                      Força: {passwordStrength}
                    </span>
                  )}
                </div>
                <div className="relative mt-1.5">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-muted">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    id="reg-pass"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Mínimo de 6 caracteres recomendados"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="sit-input block w-full rounded-xl py-3 pl-10 pr-11 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-brand-muted hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Password strength visual progress indicator helper */}
                {regPassword && (
                  <div className="mt-2.5 flex gap-1 h-1.5 w-full bg-black/30 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${
                      passwordStrength === 'Fraca' ? 'w-1/3 bg-rose-500' :
                      passwordStrength === 'Média' ? 'w-2/3 bg-amber-400' :
                      'w-full bg-emerald-500'
                    }`} />
                  </div>
                )}
              </div>

              <div>
                <label className="typ-form-label block" htmlFor="reg-confirm-pass">Confirmar Senha</label>
                <div className="relative mt-1.5">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-muted">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    id="reg-confirm-pass"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Repita sua senha exatamente igual"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="sit-input block w-full rounded-xl py-3 pl-10 pr-11 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-brand-muted hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={() => setCurrentScreen('register_step1')}
                className="w-1/3 py-3 rounded-xl border border-white/10 text-brand-muted hover:text-white hover:bg-white/5 text-sm font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98]"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="sit-button-primary flex-1 py-3.5 rounded-xl text-sm font-bold flex justify-center items-center gap-2 cursor-pointer select-none active:scale-[0.99] disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Efetivando credenciais...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4" />
                    <span>Concluir Cadastro</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* --- SCREEN 4: FORGOT PASSWORD / SENHA TEMPORÁRIA --- */}
        {currentScreen === 'forgot_password' && (
          <form onSubmit={handleForgotPassword} className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Recuperar Credenciais</h2>
              <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                Forneça seu e-mail ou CPF cadastrado para gerar uma nova chave temporária corporativa de login imediatamente.
              </p>
            </div>

            {/* Generated temporary password dynamic indicator box */}
            {generatedTempPassword && (
              <div className="p-5 rounded-2xl bg-emerald-500/15 border-2 border-dashed border-emerald-400/40 text-center animate-fade-in space-y-3.5 shadow-inner">
                <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-300">Nova Senha Corporativa Liberada</p>
                <div className="flex flex-col items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedTempPassword);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="group relative flex items-center justify-center gap-2.5 bg-slate-900/50 hover:bg-slate-900/80 px-5 py-3 rounded-xl border border-white/10 hover:border-emerald-500/30 transition-all active:scale-95 cursor-pointer w-full max-w-xs mx-auto"
                    title="Clique para copiar"
                  >
                    <code className="text-xl font-bold font-mono text-white tracking-wider select-all select-none">
                      {generatedTempPassword}
                    </code>
                    {copied ? (
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Copy className="h-4 w-4 text-brand-muted group-hover:text-emerald-400 transition-colors shrink-0" />
                    )}
                  </button>
                  {copied && (
                    <span className="text-[10px] text-emerald-400 font-semibold animate-pulse">Código copiado!</span>
                  )}
                </div>
                <div className="text-emerald-400 text-[10px] leading-relaxed px-2 font-mono">
                  Clique no elemento acima para copiar a chave corporativa temporária e volte à tela anterior para realizar o login integrado. Troque-a logo após o acesso.
                </div>
              </div>
            )}

            {!generatedTempPassword && (
              <div className="space-y-4">
                <div>
                  <label className="typ-form-label block" htmlFor="forgot-identity">E-mail ou CPF Cadastrados</label>
                  <div className="relative mt-1.5">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-muted">
                      <User className="h-4 w-4" />
                    </span>
                    <input
                      id="forgot-identity"
                      type="text"
                      required
                      placeholder="CPF ou email@gmail.com"
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      className="sit-input block w-full rounded-xl py-3 pl-10 pr-4 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setSuccess(null);
                  setGeneratedTempPassword(null);
                  setForgotIdentifier('');
                  setCurrentScreen('login');
                }}
                className="w-1/3 py-3 rounded-xl border border-white/10 text-brand-muted hover:text-white hover:bg-white/5 text-sm font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98]"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </button>

              {!generatedTempPassword && (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="sit-button-primary flex-1 py-3.5 rounded-xl text-sm font-bold flex justify-center items-center gap-2 cursor-pointer select-none active:scale-[0.99] disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Validando prontuário...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4" />
                      <span>Gerar Nova Senha</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        )}

        {/* --- SCREEN 5: FORCE PASSWORD RESET (FOR TEMP CODES) --- */}
        {currentScreen === 'force_password_reset' && (
          <form onSubmit={handleForcePasswordReset} className="space-y-6" id="force-password-reset-form animate-fade-in">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Definir Nova Senha de Acesso</h2>
              <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                Você utilizou um código temporário. Por razões de segurança corporativa, é necessário definir uma nova senha forte antes de entrar no sistema.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center">
                  <label className="typ-form-label block" htmlFor="new-pass">Nova Senha Corporativa</label>
                  {newPassword && (
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      newPasswordStrength === 'Fraca' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/10' :
                      newPasswordStrength === 'Média' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/10' :
                      'bg-emerald-500/20 text-emerald-300 border border-emerald-500/10'
                    }`}>
                      Força: {newPasswordStrength}
                    </span>
                  )}
                </div>
                <div className="relative mt-1.5">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-muted">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    id="new-pass"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Defina uma senha robusta"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="sit-input block w-full rounded-xl py-3 pl-10 pr-11 text-sm bg-brand-panel-light"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-brand-muted hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Password strength progress animation bar */}
                {newPassword && (
                  <div className="mt-2.5 flex gap-1 h-1.5 w-full bg-black/30 rounded-full overflow-hidden animate-fade-in">
                    <div className={`h-full rounded-full transition-all duration-300 ${
                      newPasswordStrength === 'Fraca' ? 'w-1/3 bg-rose-500' :
                      newPasswordStrength === 'Média' ? 'w-2/3 bg-amber-400' :
                      'w-full bg-emerald-500'
                    }`} />
                  </div>
                )}
              </div>

              <div>
                <label className="typ-form-label block" htmlFor="confirm-new-pass">Confirmar Nova Senha</label>
                <div className="relative mt-1.5">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-muted">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    id="confirm-new-pass"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Digite a mesma senha"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="sit-input block w-full rounded-xl py-3 pl-10 pr-11 text-sm bg-brand-panel-light"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-brand-muted hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button
                type="button"
                id="force-reset-back-btn"
                onClick={() => {
                  setError(null);
                  setSuccess(null);
                  setNewPassword('');
                  setConfirmNewPassword('');
                  setResettingUserId(null);
                  setCurrentScreen('login');
                }}
                className="w-1/3 py-3 rounded-xl border border-white/10 text-brand-muted hover:text-white hover:bg-white/5 text-sm font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98]"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Cancelar</span>
              </button>

              <button
                type="submit"
                id="force-reset-submit-btn"
                disabled={isLoading}
                className="sit-button-primary flex-1 py-3.5 rounded-xl text-sm font-bold flex justify-center items-center gap-2 cursor-pointer select-none active:scale-[0.99] disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Salvando senha...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4" />
                    <span>Salvar e Entrar</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

      </div>

      {/* Decorative corporate notice footer */}
      <div className="text-center mt-6 text-[10px] text-brand-muted/70 tracking-wide font-medium">
        © 2026 COMPESA - Companhia Pernambucana de Saneamento. Todos os direitos reservados.<br />
        Tecnologia da Informação e Segurança Operacional de Redes.
      </div>

    </div>
  );
}
