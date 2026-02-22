
import React from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const FormInput: React.FC<FormInputProps> = ({ 
  label, 
  error, 
  helperText, 
  className = '', 
  ...props 
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">
        {label}
      </label>
      <input 
        {...props}
        className={`w-full border-2 rounded-xl p-3 text-sm outline-none transition-all
          ${error 
            ? 'border-red-100 bg-red-50 focus:border-red-500' 
            : 'border-slate-100 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5'
          }`}
      />
      {error && <p className="text-[10px] text-red-500 font-bold ml-1">{error}</p>}
      {helperText && !error && <p className="text-[10px] text-slate-400 ml-1">{helperText}</p>}
    </div>
  );
};
