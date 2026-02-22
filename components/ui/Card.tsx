import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  title,
  subtitle,
  action
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`.trim()}>
      {(title || subtitle || action) && (
        <div className={`p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center gap-4 ${headerClassName}`.trim()}>
          <div>
            {title && <h3 className="font-bold text-slate-800 text-sm uppercase tracking-tight">{title}</h3>}
            {subtitle && <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </div>
  );
};
