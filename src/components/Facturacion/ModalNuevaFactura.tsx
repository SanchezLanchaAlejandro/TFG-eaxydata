import React from 'react';
import { 
  DocumentPlusIcon, 
  ArrowUpTrayIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Modal } from '@/components/shared/Modal';

interface ModalNuevaFacturaProps {
  onClose: () => void;
  onSeleccionarCrear: () => void;
  onSeleccionarAdjuntar: () => void;
}

export const ModalNuevaFactura = ({ 
  onClose, 
  onSeleccionarCrear, 
  onSeleccionarAdjuntar 
}: ModalNuevaFacturaProps) => {
  return (
    <Modal isOpen={true} onClose={onClose} title="Nueva Factura" maxWidth="max-w-md">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={onSeleccionarCrear}
            className="bg-white dark:bg-slate-700 p-6 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-slate-600 transition duration-200 flex flex-col items-center text-center"
          >
            <div className="bg-indigo-100 dark:bg-indigo-900/40 p-4 rounded-full mb-4">
              <DocumentPlusIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Crear Factura</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Generar una nueva factura con el formulario completo
            </p>
          </button>
          
          <button
            onClick={onSeleccionarAdjuntar}
            className="bg-white dark:bg-slate-700 p-6 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-slate-600 transition duration-200 flex flex-col items-center text-center"
          >
            <div className="bg-blue-100 dark:bg-blue-900/40 p-4 rounded-full mb-4">
              <ArrowUpTrayIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Adjuntar Factura</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Subir un documento PDF, PNG o JPG como factura
            </p>
          </button>
        </div>
      </div>
      
      <div className="bg-gray-50 dark:bg-slate-700/30 p-4 mt-6 rounded-lg border-t dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Selecciona una de las opciones para continuar
        </p>
      </div>
    </Modal>
  );
}; 