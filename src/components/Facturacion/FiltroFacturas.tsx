import { useState } from 'react';
import { useFacturacion } from '@/hooks/useFacturacion';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { XMarkIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

export interface FiltrosFacturasState {
  cliente: string;
  concepto: string;
  fechaDesde: string;
  fechaHasta: string;
  estadoCobro: string;
}

interface FiltroFacturasProps {
  filtros?: FiltrosFacturasState;
  onFiltrosChange: (filtros: FiltrosFacturasState) => void;
}

export const FiltroFacturas = ({ filtros: filtrosIniciales, onFiltrosChange }: FiltroFacturasProps) => {
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosFacturasState>(filtrosIniciales || {
    cliente: '',
    concepto: '',
    fechaDesde: '',
    fechaHasta: '',
    estadoCobro: ''
  });
  
  // Obtener perfil de usuario para verificar permisos
  const { userProfile, hasRole } = useSupabaseData();
  
  // Obtenemos la lista de clientes usando el hook
  const { clientes, loading: dataLoading } = useFacturacion();

  const handleFiltroChange = (campo: keyof FiltrosFacturasState, valor: any) => {
    const nuevosFiltros = {
      ...filtros,
      [campo]: valor
    };
    
    setFiltros(nuevosFiltros);
    onFiltrosChange(nuevosFiltros);
  };
  
  const limpiarFiltros = () => {
    const filtrosLimpios = {
      cliente: '',
      concepto: '',
      fechaDesde: '',
      fechaHasta: '',
      estadoCobro: ''
    };
    
    setFiltros(filtrosLimpios);
    onFiltrosChange(filtrosLimpios);
  };
  
  return (
    <div className="bg-white dark:bg-slate-800 shadow rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div 
        className="px-4 py-3 bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center cursor-pointer"
        onClick={() => setFiltrosAbiertos(!filtrosAbiertos)}
      >
        <div className="font-medium text-gray-700 dark:text-gray-300 flex items-center">
          <span>Filtrar facturas</span>
          {/* Indicador de filtros activos */}
          {(filtros.cliente || filtros.concepto || filtros.fechaDesde || filtros.fechaHasta || filtros.estadoCobro) && (
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
              Filtros activos
            </span>
          )}
        </div>
        <div className="flex items-center">
          {/* Boton para limpiar filtros */}
          {(filtros.cliente || filtros.concepto || filtros.fechaDesde || filtros.fechaHasta || filtros.estadoCobro) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                limpiarFiltros();
              }}
              className="mr-2 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
          
          {/* Icono para mostrar/ocultar filtros */}
          {filtrosAbiertos ? (
            <ChevronUpIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          )}
        </div>
      </div>
      
      {/* Panel de filtros desplegable */}
      {filtrosAbiertos && (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Filtro por Cliente */}
            <div>
              <label htmlFor="filtro-cliente" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cliente
              </label>
              <select
                id="filtro-cliente"
                value={filtros.cliente}
                onChange={(e) => handleFiltroChange('cliente', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                disabled={dataLoading}
              >
                <option value="">Todos los clientes</option>
                {clientes.map(cliente => (
                  <option key={cliente.id} value={cliente.id}>
                    {`${cliente.nombre} ${cliente.apellido}`}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Filtro por Concepto */}
            <div>
              <label htmlFor="filtro-concepto" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Concepto
              </label>
              <input
                id="filtro-concepto"
                type="text"
                value={filtros.concepto}
                onChange={(e) => handleFiltroChange('concepto', e.target.value)}
                placeholder="Concepto de la factura"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              />
            </div>
            
            {/* Filtro por Fecha desde */}
            <div>
              <label htmlFor="filtro-fecha-desde" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha emisión (desde)
              </label>
              <input
                id="filtro-fecha-desde"
                type="date"
                value={filtros.fechaDesde}
                onChange={(e) => handleFiltroChange('fechaDesde', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              />
            </div>
            
            {/* Filtro por Fecha hasta */}
            <div>
              <label htmlFor="filtro-fecha-hasta" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha emisión (hasta)
              </label>
              <input
                id="filtro-fecha-hasta"
                type="date"
                value={filtros.fechaHasta}
                onChange={(e) => handleFiltroChange('fechaHasta', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              />
            </div>

            {/* Filtro por Estado de Cobro */}
            <div>
              <label htmlFor="filtro-estado-cobro" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Estado de Cobro
              </label>
              <select
                id="filtro-estado-cobro"
                value={filtros.estadoCobro}
                onChange={(e) => handleFiltroChange('estadoCobro', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              >
                <option value="">Todos</option>
                <option value="true">Cobrada</option>
                <option value="false">Pendiente</option>
              </select>
            </div>
          </div>
        </div>
      )}
      
      {/* Chips de filtros activos */}
      <div className="px-4 py-2 flex flex-wrap gap-2">
        {/* Chip para cliente */}
        {filtros.cliente && (
          <div className="flex items-center bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-sm">
            <span>Cliente: {
              clientes.find(c => c.id === filtros.cliente) 
                ? `${clientes.find(c => c.id === filtros.cliente)?.nombre} ${clientes.find(c => c.id === filtros.cliente)?.apellido}` 
                : filtros.cliente
            }</span>
            <button 
              onClick={() => handleFiltroChange('cliente', '')}
              className="ml-2 text-indigo-500 hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-500"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}
        
        {/* Otros chips... mantener los existentes */}
      </div>
    </div>
  );
}; 