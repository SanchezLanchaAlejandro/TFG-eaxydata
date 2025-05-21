import { useState } from 'react';
import { FiltroClientes as FiltroClientesType } from './types';
import { UserIcon, IdentificationIcon, AtSymbolIcon, PhoneIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface FiltroClientesProps {
  filtros: FiltroClientesType;
  onFiltrosChange: (filtros: FiltroClientesType) => void;
}

export const FiltroClientes = ({ filtros, onFiltrosChange }: FiltroClientesProps) => {
  const [filtrosLocales, setFiltrosLocales] = useState<FiltroClientesType>(filtros);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(true);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    const nuevoValor = type === 'checkbox' ? checked : value;
    
    const nuevosFiltros = {
      ...filtrosLocales,
      [name]: nuevoValor
    };
    
    setFiltrosLocales(nuevosFiltros);
  };
  
  const aplicarFiltros = () => {
    onFiltrosChange(filtrosLocales);
  };
  
  const limpiarFiltros = () => {
    const filtrosLimpios: FiltroClientesType = {
      nombre: '',
      cif: '',
      email: '',
      telefono: '',
      mostrarInactivos: true
    };
    
    setFiltrosLocales(filtrosLimpios);
    onFiltrosChange(filtrosLimpios);
  };
  
  // Función para limpiar un filtro específico
  const limpiarFiltro = (nombreFiltro: keyof FiltroClientesType) => {
    const nuevosFiltros = {
      ...filtrosLocales,
      [nombreFiltro]: nombreFiltro === 'mostrarInactivos' ? true : ''
    };
    
    setFiltrosLocales(nuevosFiltros);
    onFiltrosChange(nuevosFiltros);
  };
  
  // Verificar si hay filtros activos
  const hayFiltrosActivos = () => {
    return (
      filtros.nombre || 
      filtros.cif || 
      filtros.email || 
      filtros.telefono || 
      filtros.mostrarInactivos === false
    );
  };
  
  // Manejar la tecla Enter en los inputs
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      aplicarFiltros();
    }
  };
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
      <div className="p-4 flex items-center justify-between border-b dark:border-gray-700">
        <h3 className="font-medium text-lg text-gray-900 dark:text-white">Filtrar Clientes</h3>
        <button 
          onClick={() => setFiltrosAbiertos(!filtrosAbiertos)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          {filtrosAbiertos ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>
      </div>
      
      {filtrosAbiertos && (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={filtrosLocales.nombre || ''}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Buscar por nombre"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="cif" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                NIE/NIF/CIF
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IdentificationIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="cif"
                  name="cif"
                  value={filtrosLocales.cif || ''}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Buscar por CIF/NIF"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <AtSymbolIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="email"
                  name="email"
                  value={filtrosLocales.email || ''}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Buscar por email"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Teléfono
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <PhoneIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="telefono"
                  name="telefono"
                  value={filtrosLocales.telefono || ''}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Buscar por teléfono"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="mostrarInactivos"
                name="mostrarInactivos"
                type="checkbox"
                checked={filtrosLocales.mostrarInactivos || false}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-slate-700"
              />
              <label htmlFor="mostrarInactivos" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Mostrar clientes inactivos
              </label>
            </div>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={limpiarFiltros}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 mr-2"
              >
                Limpiar filtros
              </button>
              <button
                type="button"
                onClick={aplicarFiltros}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Aplicar filtros
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Chips de filtros activos */}
      <div className="px-4 py-2 flex flex-wrap gap-2">
        {filtros.nombre && (
          <div className="flex items-center bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
            <span>Nombre: {filtros.nombre}</span>
            <button 
              onClick={() => limpiarFiltro('nombre')}
              className="ml-2 text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-500"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}
        
        {filtros.cif && (
          <div className="flex items-center bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
            <span>NIF/CIF: {filtros.cif}</span>
            <button 
              onClick={() => limpiarFiltro('cif')}
              className="ml-2 text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-500"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}
        
        {filtros.email && (
          <div className="flex items-center bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
            <span>Email: {filtros.email}</span>
            <button 
              onClick={() => limpiarFiltro('email')}
              className="ml-2 text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-500"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}
        
        {filtros.telefono && (
          <div className="flex items-center bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
            <span>Teléfono: {filtros.telefono}</span>
            <button 
              onClick={() => limpiarFiltro('telefono')}
              className="ml-2 text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-500"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}
        
        {filtros.mostrarInactivos === false && (
          <div className="flex items-center bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
            <span>Solo activos</span>
            <button 
              onClick={() => limpiarFiltro('mostrarInactivos')}
              className="ml-2 text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-500"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}
        
        {hayFiltrosActivos() && (
          <button 
            onClick={limpiarFiltros}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 underline"
          >
            Limpiar todos
          </button>
        )}
      </div>
    </div>
  );
}; 