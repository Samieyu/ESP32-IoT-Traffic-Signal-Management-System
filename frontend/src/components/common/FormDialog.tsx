import React from 'react';
import { X } from 'lucide-react';

interface FormDialogProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  maxWidth?: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const FormDialog: React.FC<FormDialogProps> = ({
  isOpen,
  title,
  subtitle,
  maxWidth = 'max-w-lg',
  onClose,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className={`bg-white rounded-2xl w-full ${maxWidth} shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col`}>
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};
