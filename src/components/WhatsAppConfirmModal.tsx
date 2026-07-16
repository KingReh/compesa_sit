import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, MessageCircle, AlertCircle, Phone, Check, Copy } from 'lucide-react';
import { Employee } from '../types';

interface WhatsAppConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
}

export function WhatsAppConfirmModal({ isOpen, onClose, employee }: WhatsAppConfirmModalProps) {
  const [hasError, setHasError] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reset states when modal is opened or closed
  useEffect(() => {
    if (isOpen) {
      setHasError(false);
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen || !employee) return null;

  const handleCopyNumber = () => {
    if (!employee.telefone) return;
    navigator.clipboard.writeText(employee.telefone).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleInitiateWhatsApp = () => {
    setHasError(false);
    const phoneStr = employee.telefone;
    if (!phoneStr || phoneStr.trim() === '-' || phoneStr.trim() === '') {
      setHasError(true);
      return;
    }

    // Extraction of only digits
    const digits = phoneStr.replace(/\D/g, '');
    if (!digits) {
      setHasError(true);
      return;
    }

    // Add country code 55 (Brazil) if not present and length looks like standard area code + number
    const formattedNumber = digits.length <= 11 && !digits.startsWith('55') ? '55' + digits : digits;

    // Device detection
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
      // Direct deep link
      const appUrl = `whatsapp://send?phone=${formattedNumber}`;
      const webUrl = `https://api.whatsapp.com/send?phone=${formattedNumber}`;
      
      let focused = true;
      const handleBlur = () => {
        focused = false;
      };

      window.addEventListener('blur', handleBlur);
      
      // Attempting directly via protocol
      window.location.href = appUrl;

      // Check after 1.5 seconds if window focus shifted (meaning WhatsApp app didn't open)
      setTimeout(() => {
        window.removeEventListener('blur', handleBlur);
        if (focused) {
          // If still focused, custom protocol failed, try standard web url in new tab
          const newWindow = window.open(webUrl, '_blank');
          if (!newWindow) {
            setHasError(true);
          }
        } else {
          // Success, close the modal
          onClose();
        }
      }, 1500);

    } else {
      // Desktop: Redirect to WhatsApp Web in new tab
      const webUrl = `https://web.whatsapp.com/send?phone=${formattedNumber}`;
      const newWindow = window.open(webUrl, '_blank');
      
      if (newWindow) {
        onClose();
      } else {
        // Popup blocked or not possible to open window
        setHasError(true);
      }
    }
  };

  return createPortal(
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
    >
      <div className="sit-panel relative w-full max-w-md p-6">
        <div className="flex justify-end absolute top-4 right-4">
          <button
            onClick={onClose}
            className="rounded-full p-1 text-brand-muted hover:bg-brand-panel-light hover:text-white transition-colors"
            title="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex flex-col items-center text-center mt-2">
          {/* Stylized WhatsApp colored Icon Header */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 mb-4 ring-1 ring-emerald-400/30">
            <MessageCircle className="h-7 w-7 text-emerald-400" />
          </div>
          
          <h3 className="typ-section-title mb-2 text-white">Contatar Funcionário</h3>
          <p className="typ-card-desc mb-5 text-brand-muted px-2">
            Deseja entrar em contato com este funcionário pelo WhatsApp?
          </p>

          {/* Employee Badge Area */}
          <div className="w-full bg-black/20 rounded-xl border border-white/5 p-4 mb-5 text-left font-sans">
            <p className="text-[10px] text-brand-accent font-bold tracking-wider uppercase mb-1">Funcionário(a)</p>
            <h4 className="text-sm font-bold text-white truncate mb-2">{employee.nome}</h4>
            <div className="flex items-center justify-between bg-black/10 rounded-md p-2 border border-white/5">
              <div className="flex items-center gap-1.5 text-brand-muted">
                <Phone className="h-3.5 w-3.5 text-brand-accent" />
                <span className="text-xs font-mono">{employee.telefone || 'Sem telefone'}</span>
              </div>
              {employee.telefone && (
                <button
                  type="button"
                  onClick={handleCopyNumber}
                  className="flex items-center gap-1 text-[11px] font-semibold text-brand-accent hover:text-white transition-colors px-2 py-1 rounded bg-white/5 hover:bg-white/10"
                  title="Copiar número de telefone"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-green-400" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Informative Error message if WhatsApp couldn't open */}
          {hasError && (
            <div className="w-full bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-5 text-left flex items-start gap-2.5 animate-fade-in">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-red-400 mb-0.5">Não foi possível abrir o WhatsApp</h5>
                <p className="text-[10.5px] text-brand-muted leading-relaxed">
                  Não pudemos iniciar a conversa automaticamente. Verifique se o aplicativo está instalado ou use o recurso "Copiar" acima para salvar o número manualmente.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg px-4 py-2.5 text-xs font-bold bg-brand-panel-light/30 border border-brand-border hover:bg-brand-panel-light transition-colors text-white cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleInitiateWhatsApp}
            className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Abrir WhatsApp</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
