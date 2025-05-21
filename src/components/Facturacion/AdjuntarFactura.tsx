import React, { useState, useRef } from 'react';
import { Cliente as ClienteComponent } from '../Clientes/types';
import { XMarkIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { useFacturacion } from '@/hooks/useFacturacion';

interface AdjuntarFacturaProps {
  onClose: () => void;
  onSubmit: (facturaAdjuntada: {
    tipo: 'adjuntada';
    cliente: string;
    clienteId: string;
    archivo: File;
    fechaEmision: string;
  }) => void;
}

export const AdjuntarFactura = ({ onClose, onSubmit }: AdjuntarFacturaProps) => {
  const { clientes, loading, error: clientesError } = useFacturacion();
  const [clienteId, setClienteId] = useState<string>('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [fechaEmision, setFechaEmision] = useState<string>(new Date().toISOString().split('T')[0]);
  const [archivoError, setArchivoError] = useState<string>('');
  const [clienteError, setClienteError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manejar la selección de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validar tipo de archivo
      const tiposPermitidos = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      if (!tiposPermitidos.includes(file.type)) {
        setArchivoError('Tipo de archivo no permitido. Solo se admiten PDF, PNG y JPG.');
        setArchivo(null);
        return;
      }
      
      // Validar tamaño máximo (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setArchivoError('El archivo excede el tamaño máximo permitido (5MB).');
        setArchivo(null);
        return;
      }
      
      setArchivo(file);
      setArchivoError('');
    }
  };

  // Manejar el envío del formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que haya un cliente seleccionado
    if (!clienteId) {
      setClienteError('Debes seleccionar un cliente.');
      return;
    }
    
    // Validar que haya un archivo seleccionado
    if (!archivo) {
      setArchivoError('Debes seleccionar un archivo.');
      return;
    }
    
    // Obtener los datos del cliente seleccionado
    const clienteSeleccionado = clientes.find(c => c.id === clienteId);
    
    if (!clienteSeleccionado) {
      setClienteError('Cliente no válido.');
      return;
    }
    
    // Crear objeto con datos de la factura adjuntada
    const facturaAdjuntada = {
      tipo: 'adjuntada' as const,
      cliente: clienteSeleccionado.razon_social || `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}`,
      clienteId: clienteSeleccionado.id,
      archivo,
      fechaEmision
    };
    
    // Enviar datos
    onSubmit(facturaAdjuntada);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Adjuntar Factura</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Cerrar"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {/* Selección de cliente */}
          <div className="mb-4">
            <label htmlFor="cliente" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cliente *
            </label>
            {loading ? (
              <div className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-gray-200">
                Cargando clientes...
              </div>
            ) : clientesError ? (
              <div className="w-full p-2 border border-red-300 dark:border-red-600 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                Error al cargar clientes: {clientesError}
              </div>
            ) : (
              <select
                id="cliente"
                value={clienteId}
                onChange={(e) => {
                  setClienteId(e.target.value);
                  setClienteError('');
                }}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
              >
                <option value="">-- Selecciona un cliente --</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.razon_social || `${cliente.nombre} ${cliente.apellido}`}
                  </option>
                ))}
              </select>
            )}
            {clienteError && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{clienteError}</p>}
          </div>
          
          {/* Fecha de emisión */}
          <div className="mb-4">
            <label htmlFor="fechaEmision" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha de Emisión
            </label>
            <input
              type="date"
              id="fechaEmision"
              value={fechaEmision}
              onChange={(e) => setFechaEmision(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
            />
          </div>
          
          {/* Selección de archivo */}
          <div className="mb-6">
            <label htmlFor="archivo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Archivo de Factura (PDF, PNG, JPG, máx. 5MB) *
            </label>
            <div className="mt-1 flex items-center">
              <input
                type="file"
                id="archivo"
                ref={fileInputRef}
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="sr-only"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 inline-flex items-center"
              >
                <DocumentIcon className="h-5 w-5 mr-2" />
                Seleccionar archivo
              </button>
              {archivo && (
                <span className="ml-3 text-sm text-gray-600 dark:text-gray-400 truncate max-w-[200px]">
                  {archivo.name}
                </span>
              )}
            </div>
            {archivoError && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{archivoError}</p>}
            {archivo && !archivoError && (
              <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                Archivo seleccionado: {(archivo.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            )}
          </div>
          
          {/* Botones de acción */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 