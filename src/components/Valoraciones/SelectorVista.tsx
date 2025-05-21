import React from 'react';
import { ViewColumnsIcon, Bars4Icon } from '@heroicons/react/24/outline';

export type TipoVista = 'kanban' | 'lista';

interface SelectorVistaProps {
  vista: TipoVista;
  onCambioVista: (vista: TipoVista) => void;
}

export const SelectorVista = ({ vista, onCambioVista }: SelectorVistaProps) => {
  return (
    <div className="inline-flex rounded-md shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 overflow-hidden">
      <button
        type="button"
        className={`
          relative inline-flex items-center px-4 py-2 text-sm font-medium 
          ${vista === 'kanban' 
            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 z-10' 
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50'
          }
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:z-10
        `}
        onClick={() => onCambioVista('kanban')}
      >
        <ViewColumnsIcon className="h-5 w-5 mr-2" />
        Kanban
      </button>
      <button
        type="button"
        className={`
          relative inline-flex items-center px-4 py-2 text-sm font-medium
          ${vista === 'lista' 
            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 z-10' 
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50'
          }
          transition-colors duration-200
          -ml-px 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:z-10
        `}
        onClick={() => onCambioVista('lista')}
      >
        <Bars4Icon className="h-5 w-5 mr-2" />
        Lista
      </button>
    </div>
  );
}; 