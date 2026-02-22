import React from 'react';
import { LucideIcon } from 'lucide-react';

interface BaseCardProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  variant?: 'dark' | 'light' | 'none';
  noPadding?: boolean;
  contentClassName?: string;
  headerClassName?: string;
}

export const BaseCard: React.FC<BaseCardProps> = ({
  title,
  subtitle,
  icon: Icon,
  headerActions,
  children,
  className = '',
  variant = 'dark',
  noPadding = false,
  contentClassName = 'p-6',
  headerClassName = '',
}) => {
  const headerStyles = {
    dark: 'bg-slate-900 text-white p-6',
    light: 'bg-slate-50 text-slate-800 p-6 border-b border-slate-200',
    none: 'bg-transparent text-slate-800 py-4 px-0',
  };

  const iconStyles = {
    dark: 'text-blue-400',
    light: 'text-blue-600',
    none: 'text-blue-600',
  };

  const subtitleStyles = {
    dark: 'text-slate-400',
    light: 'text-slate-500',
    none: 'text-slate-500',
  };

  if (variant === 'none') {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex justify-between items-center no-print">
          <div className="flex items-center gap-3">
            {Icon && <Icon className="w-6 h-6 text-blue-600" />}
            <div>
              <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wider">{title}</h2>
              {subtitle && <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 font-bold">{subtitle}</p>}
            </div>
          </div>
          {headerActions && <div className="flex gap-2">{headerActions}</div>}
        </div>
        <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${noPadding ? '' : contentClassName}`}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
      <div className={`${headerStyles[variant]} ${headerClassName} flex justify-between items-center`}>
        <div className="flex items-center gap-3">
          {Icon && <Icon className={`w-6 h-6 ${iconStyles[variant]}`} />}
          <div>
            <h2 className="text-xl font-bold leading-none uppercase tracking-tight">{title}</h2>
            {subtitle && (
              <p className={`text-[10px] ${subtitleStyles[variant]} uppercase tracking-widest mt-1 font-bold`}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {headerActions && <div className="flex gap-2">{headerActions}</div>}
      </div>
      <div className={`${noPadding ? '' : contentClassName}`}>
        {children}
      </div>
    </div>
  );
};
