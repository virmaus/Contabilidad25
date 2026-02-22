import React from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  containerClassName = '',
  labelClassName = '',
  inputClassName = '',
  ...props
}) => {
  return (
    <div className={containerClassName}>
      <label className={`text-[10px] font-bold text-slate-400 block mb-1 uppercase ${labelClassName}`.trim()}>
        {label}
      </label>
      <input
        {...props}
        className={`w-full border border-slate-300 rounded p-2 text-sm outline-none focus:border-blue-500 transition-colors ${inputClassName}`.trim()}
      />
    </div>
  );
};
