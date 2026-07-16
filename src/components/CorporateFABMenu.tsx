import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  ExternalLink, 
  Clock, 
  TrendingUp, 
  X, 
  Search, 
  Globe, 
  Sparkles, 
  Link2,
  Bookmark,
  ChevronRight
} from 'lucide-react';
import { Empresa } from '../types';

interface CorporateFABMenuProps {
  empresas: Empresa[];
  onNavigateToConfig?: () => void;
}

interface LinkStat {
  url: string;
  name: string;
  companyName: string;
  clickCount: number;
  lastAccessed: string; // ISO String
}

export function CorporateFABMenu({ empresas, onNavigateToConfig }: CorporateFABMenuProps) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<LinkStat[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load stats from localStorage
  useEffect(() => {
    const loadStats = () => {
      try {
        const savedStats = localStorage.getItem('@sit:fab_link_stats');
        if (savedStats) {
          setStats(JSON.parse(savedStats));
        }
      } catch (e) {
        console.error('Failed to load FAB link statistics', e);
      }
    };

    loadStats();
    
    // Listen for storage changes in other panels/tabs
    window.addEventListener('storage', loadStats);
    return () => window.removeEventListener('storage', loadStats);
  }, []);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Track the access stats when a link is clicked
  const handleLinkClick = (url: string, siteName: string, companyName: string) => {
    const uppercaseSiteName = siteName.toUpperCase();
    const formattedUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    
    try {
      const savedStatsList = localStorage.getItem('@sit:fab_link_stats');
      let currentStats: LinkStat[] = savedStatsList ? JSON.parse(savedStatsList) : [];
      
      const existingIndex = currentStats.findIndex(item => item.url.trim() === formattedUrl.trim());
      
      const nowStr = new Date().toISOString();
      
      if (existingIndex > -1) {
        currentStats[existingIndex].clickCount += 1;
        currentStats[existingIndex].lastAccessed = nowStr;
        currentStats[existingIndex].name = uppercaseSiteName;
        currentStats[existingIndex].companyName = companyName;
      } else {
        currentStats.push({
          url: formattedUrl,
          name: uppercaseSiteName,
          companyName: companyName,
          clickCount: 1,
          lastAccessed: nowStr
        });
      }
      
      localStorage.setItem('@sit:fab_link_stats', JSON.stringify(currentStats));
      setStats(currentStats);
      
      // Notify other parts of the app
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Error logging site access', e);
    }

    // Open link in new tab
    window.open(formattedUrl, '_blank', 'noopener,noreferrer');
  };

  // Extract all links from the companies
  const availableLinks = empresas.flatMap((emp) => {
    const companySites = emp.sites || [];
    return companySites.map((site) => {
      const uppercaseSiteName = site.nome.toUpperCase();
      const stat = stats.find(s => s.url.trim() === site.url.trim());
      return {
        companyId: emp.id,
        companyName: emp.razaoSocial,
        siteName: uppercaseSiteName,
        url: site.url,
        clickCount: stat ? stat.clickCount : 0,
        lastAccessed: stat ? stat.lastAccessed : null,
        description: `Canal de comunicação e portal corporativo da empresa ${emp.razaoSocial}.`
      };
    });
  });

  // Sort links automatically by frequency (most clicked first)
  const sortedLinks = [...availableLinks].sort((a, b) => {
    if (b.clickCount !== a.clickCount) {
      return b.clickCount - a.clickCount;
    }
    // Alphabetical tie breaker
    return a.siteName.localeCompare(b.siteName);
  });

  // Get recent accesses
  const recentAccesses = [...stats]
    .sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime())
    .slice(0, 4);

  // Filter based on search query
  const filteredLinks = sortedLinks.filter((link) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      link.siteName.toLowerCase().includes(searchLower) ||
      link.companyName.toLowerCase().includes(searchLower) ||
      link.url.toLowerCase().includes(searchLower)
    );
  });

  // Formatter for relative time
  const formatTimeAgo = (isoString: string) => {
    try {
      const diffMs = new Date().getTime() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Agora mesmo';
      if (diffMins < 60) return `Há ${diffMins} min`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `Há ${diffHours}h`;
      const diffDays = Math.floor(diffHours / 24);
      return `Há ${diffDays}d`;
    } catch {
      return 'Recentemente';
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end" ref={menuRef} id="corporate-fab-menu">
      
      {/* Backdrop for closing when clicking outside and smooth dimming */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black z-40 cursor-default pointer-events-auto"
          />
        )}
      </AnimatePresence>

      {/* Expanded Menu Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 30 }}
            transition={{ type: 'spring', damping: 20, stiffness: 220 }}
            className="sit-panel w-[380px] max-w-[calc(100vw-2rem)] mb-4 overflow-hidden z-50 flex flex-col shadow-2xl "
            style={{ maxHeight: 'min(580px, calc(100vh - 120px))' }}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-black/10 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="typ-subtitle text-brand-accent tracking-wider text-[10px]">CONEXÕES RÁPIDAS</span>
                  <Sparkles className="h-3 w-3 text-brand-accent animate-pulse" />
                </div>
                <h3 className="typ-card-title text-base text-white mt-0.5">Sistemas Associados</h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-white/10 text-brand-muted hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search Input Bar */}
            <div className="p-3 border-b border-white/5 bg-black/5">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-brand-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filtrar por portal ou empresa..."
                  className="sit-input w-full rounded-md pl-9 pr-8 py-1.5 text-xs text-white"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-brand-muted hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* List Body with Custom Scrollbar */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 sit-panel-inner m-3 max-h-[300px]">
              
              {filteredLinks.length > 0 ? (
                filteredLinks.map((link, idx) => (
                  <button
                    key={`${link.companyId}-${link.siteName}-${idx}`}
                    onClick={() => handleLinkClick(link.url, link.siteName, link.companyName)}
                    className="w-full text-left p-2.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 hover:border-brand-accent/30 transition-all duration-200 group flex items-start justify-between gap-3 cursor-pointer"
                  >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-bold text-xs text-white uppercase tracking-wide group-hover:text-brand-accent transition-colors">
                              {link.siteName}
                            </span>
                          </div>

                          <p className="text-[10px] text-brand-muted font-medium mt-1 uppercase">
                            {link.companyName}
                          </p>
                          
                          <p className="text-[11px] text-brand-muted/80 mt-0.5 leading-relaxed line-clamp-1 group-hover:text-white/90 transition-colors">
                            {link.url}
                          </p>
                        </div>
                        
                        <div className="self-center p-1 rounded bg-white/5 group-hover:bg-brand-accent/20 text-brand-muted group-hover:text-white transition-all transform group-hover:scale-105">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-8 px-4">
                      <Globe className="h-8 w-8 text-brand-muted mx-auto opacity-40 mb-2" />
                      <p className="text-xs text-white font-medium">Nenhum portal encontrado</p>
                      <p className="text-[11px] text-brand-muted mt-1">
                        {searchQuery 
                          ? 'Tente ajustar os termos de pesquisa' 
                          : 'As empresas cadastradas não possuem portais vinculados no momento.'}
                      </p>
                      {onNavigateToConfig && (
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            onNavigateToConfig();
                          }}
                          className="mt-3.5 px-3 py-1.5 bg-brand-accent/10 border border-brand-accent/20 hover:bg-brand-accent/20 text-brand-accent rounded text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          Ir para Cadastro de Empresas
                        </button>
                      )}
                    </div>
                  )}
            </div>

            {/* Footer / Quick Tip block */}
            <div className="px-4 py-3 bg-black/20 border-t border-white/10 flex items-center justify-between text-[11px] text-brand-muted">
              <span className="flex items-center gap-1">
                <Bookmark className="h-3 w-3 text-brand-accent" />
                Dica: Portais são extraídos do Cadastro de Empresas.
              </span>
              {onNavigateToConfig && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onNavigateToConfig();
                  }}
                  className="font-bold text-brand-accent hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  Gerenciar
                  <ChevronRight className="h-3 w-3" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button (FAB) Trigger */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`h-14 w-14 rounded-full flex items-center justify-center shadow-xl cursor-pointer transition-colors z-50 group border border-white/20 select-none ${
          isOpen 
            ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/10' 
            : 'bg-gradient-to-tr from-[#165AAB] to-[#38bdf8] hover:from-[#1E66BC] hover:to-[#5ccbfb] text-white shadow-[#165AAB]/30'
        }`}
        title="Menu Corporativo de Sistemas e Portais"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close-icon"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div
              key="globe-icon"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center relative"
            >
              <Globe className="h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
              {/* Optional tiny notification indicator showing total links available */}
              {availableLinks.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white font-bold font-mono text-[8.5px] h-4 w-4 rounded-full flex items-center justify-center border border-white">
                  {availableLinks.length}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>,
    document.body
  );
}
