
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  maxWidth = 'max-w-2xl'
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className={`bg-white rounded-3xl shadow-2xl ${maxWidth} w-full overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95`}>
        <div className="bg-slate-50 p-6 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>
        <div className="flex-grow overflow-y-auto p-8">
          {children}
        </div>
        {footer && (
          <div className="p-6 bg-slate-50 border-t border-slate-200">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
