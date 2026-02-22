
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, subtitle, icon, footer }) => {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
      {(title || icon) && (
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && <div className="text-blue-600">{icon}</div>}
            <div>
              {title && <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{title}</h3>}
              {subtitle && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{subtitle}</p>}
            </div>
          </div>
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
      {footer && (
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
          {footer}
        </div>
      )}
    </div>
  );
};
