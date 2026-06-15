import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  cancelText?: string;
  confirmText?: string;
  isAlertOnly?: boolean;
}

export function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  cancelText = 'Cancelar',
  confirmText = 'Confirmar Exclusão',
  isAlertOnly = false
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
    >
      <div className="sit-panel relative w-full max-w-md p-6">
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="rounded-full p-1 text-brand-muted hover:bg-brand-panel-light hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex flex-col items-center text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 mb-4 ring-1 ring-red-500/30">
            <AlertTriangle className="h-6 w-6 text-red-400" />
          </div>
          <h3 className="typ-section-title mb-2">{title}</h3>
          <p className="typ-card-desc mb-6 text-brand-muted">{message}</p>
        </div>

        <div className="flex items-center justify-center gap-3">
          {isAlertOnly ? (
            <button
              onClick={onClose}
              className="flex-1 rounded-lg px-4 py-2.5 typ-card-title bg-brand-accent hover:opacity-90 text-[#0b1623] font-bold transition-all text-center active:scale-[0.98] shadow-md"
            >
              Ok, Entendi
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                className="flex-1 rounded-lg px-4 py-2.5 typ-card-title bg-brand-panel-light/30 border border-brand-border hover:bg-brand-panel-light transition-colors text-white"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  if (onConfirm) onConfirm();
                  onClose();
                }}
                className="flex-1 rounded-lg bg-red-500 px-4 py-2.5 typ-card-title text-white shadow-sm hover:bg-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 transition-all active:scale-[0.98]"
              >
                {confirmText}
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
