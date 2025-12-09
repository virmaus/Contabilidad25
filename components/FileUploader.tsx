import React, { useRef } from 'react';
import { UploadCloud, FileText, Loader2, Layers } from 'lucide-react';

interface FileUploaderProps {
  onFilesSelected: (files: FileList) => void;
  isLoading: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFilesSelected, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
    }
  };

  return (
    <div
      onClick={isLoading ? undefined : handleClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300
        flex flex-col items-center justify-center gap-4 group
        ${isLoading ? 'bg-slate-50 border-slate-300 cursor-not-allowed opacity-70' : 'bg-slate-50 border-slate-300 hover:border-blue-500 hover:bg-blue-50'}
      `}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleChange}
        multiple
        accept=".csv"
        className="hidden"
        disabled={isLoading}
      />

      {isLoading ? (
        <div className="flex flex-col items-center animate-pulse">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-3" />
          <p className="text-slate-600 font-medium">Procesando archivos...</p>
        </div>
      ) : (
        <>
          <div className="p-4 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300">
            <UploadCloud className="w-10 h-10 text-blue-600" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-800">
              Selecciona todos tus archivos CSV
            </h3>
            <p className="text-slate-500 text-sm">
              Arrastra o selecciona múltiples archivos para el análisis anual (Ene-Dic)
            </p>
          </div>
          <div className="flex gap-2 mt-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <Layers className="w-3 h-3 mr-1" />
              Consolidación Automática
            </span>
          </div>
        </>
      )}
    </div>
  );
};