import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose?: () => void;
  maxWidthClassName?: string;
  overlayClassName?: string;
  contentClassName?: string;
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  children,
  isOpen,
  onClose,
  maxWidthClassName = 'max-w-2xl',
  overlayClassName = 'bg-slate-900/70 backdrop-blur-sm',
  contentClassName = '',
  showCloseButton = false
}) => {
  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[110] flex items-center justify-center p-4 ${overlayClassName}`.trim()}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full overflow-hidden ${maxWidthClassName} ${contentClassName}`.trim()}>
        {showCloseButton && onClose && (
          <div className="flex justify-end p-3 border-b border-slate-100">
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};
