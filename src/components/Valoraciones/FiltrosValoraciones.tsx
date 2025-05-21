import { useState, useEffect } from 'react';
import { EstadoValoracion } from './types';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { useTalleres } from '@/hooks/useTalleres';

export interface FiltrosValoracionesState {
  matricula: string;
  tipoPoliza: string;
  aseguradora: string;
  fechaDesde: string;
  fechaHasta: string;
  estado: string;
  taller: number | string | null;
}

interface FiltrosValoracionesProps {
  onFiltrosChange: (filtros: FiltrosValoracionesState) => void;
}

export const FiltrosValoraciones = ({ onFiltrosChange }: FiltrosValoracionesProps) => {
  const { userProfile } = useSupabaseData();
  const { talleres, tallerSeleccionado, loading: loadingTalleres } = useTalleres();
  
  // Estado inicial de filtros
  const [filtros, setFiltros] = useState<FiltrosValoracionesState>({
    matricula: '',
    tipoPoliza: '',
    aseguradora: '',
    fechaDesde: '',
    fechaHasta: '',
    estado: '',
    taller: null
  });
  
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  
  // Determinar si el usuario puede seleccionar taller
  const canSelectWorkshop = () => {
    return userProfile?.role === 'SUPER_ADMIN' || userProfile?.role === 'GESTOR_RED';
  };

  // Inicializar taller para GESTOR_TALLER cuando tallerSeleccionado cambia
  useEffect(() => {
    if (!userProfile) return;
    
    if (userProfile.role === 'GESTOR_TALLER' && tallerSeleccionado) {
      // Actualizar el estado local
      setFiltros(prevFiltros => {
        // Solo actualizar si es diferente para evitar ciclos
        if (prevFiltros.taller !== tallerSeleccionado) {
          // Propagar el cambio al componente padre
          const nuevosFiltros = { ...prevFiltros, taller: tallerSeleccionado };
          onFiltrosChange(nuevosFiltros);
          return nuevosFiltros;
        }
        return prevFiltros;
      });
    }
  }, [userProfile, tallerSeleccionado, onFiltrosChange]);
  
  // Manejar cambios en los filtros
  const handleFiltroChange = (campo: keyof FiltrosValoracionesState, valor: any) => {
    // Actualizar el estado local
    setFiltros(prevFiltros => {
      const nuevosFiltros = {
        ...prevFiltros,
        [campo]: valor
      };
      
      // Propagar el cambio al componente padre
      onFiltrosChange(nuevosFiltros);
      return nuevosFiltros;
    });
  };
  
  // Limpiar todos los filtros
  const limpiarFiltros = () => {
    // Para GESTOR_TALLER, mantener su taller asignado
    const tallerInicial = userProfile?.role === 'GESTOR_TALLER' ? tallerSeleccionado : null;
    
    const filtrosVacios: FiltrosValoracionesState = {
      matricula: '',
      tipoPoliza: '',
      aseguradora: '',
      fechaDesde: '',
      fechaHasta: '',
      estado: '',
      taller: tallerInicial
    };
    
    setFiltros(filtrosVacios);
    onFiltrosChange(filtrosVacios);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
      <div className="p-4 flex items-center justify-between border-b dark:border-gray-700">
        <h3 className="font-medium text-lg dark:text-white">Filtros</h3>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Filtro de Taller (solo para SUPER_ADMIN y GESTOR_RED) */}
            {canSelectWorkshop() && (
              <div>
                <label htmlFor="filtro-taller" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Taller
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="filtro-taller"
                    value={filtros.taller || ''}
                    onChange={(e) => {
                      const selectedValue = e.target.value;
                      
                      // Si es una cadena vacía, usar null; de lo contrario, conservar el valor original
                      const tallerValue = selectedValue === '' ? null : selectedValue;
                      
                      handleFiltroChange('taller', tallerValue);
                    }}
                    className="w-full pl-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    disabled={loadingTalleres}
                  >
                    <option value="">Todos los talleres</option>
                    {talleres.map((taller) => (
                      <option key={taller.id} value={taller.id}>
                        {taller.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            
            {/* Filtro por Matrícula */}
            <div>
              <label htmlFor="filtro-matricula" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Matrícula
              </label>
              <input
                id="filtro-matricula"
                type="text"
                value={filtros.matricula}
                onChange={(e) => handleFiltroChange('matricula', e.target.value)}
                placeholder="Ej: 1234 ABC"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            {/* Filtro por Tipo de Póliza */}
            <div>
              <label htmlFor="filtro-tipo-poliza" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de Póliza
              </label>
              <select
                id="filtro-tipo-poliza"
                value={filtros.tipoPoliza}
                onChange={(e) => handleFiltroChange('tipoPoliza', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Todos</option>
                <option value="Todo riesgo">Todo riesgo</option>
                <option value="Todo riesgo sin franquicia">Todo riesgo sin franquicia</option>
                <option value="Terceros ampliado">Terceros ampliado</option>
                <option value="Terceros">Terceros básico</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            
            {/* Filtro por Aseguradora */}
            <div>
              <label htmlFor="filtro-aseguradora" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Aseguradora
              </label>
              <input
                id="filtro-aseguradora"
                type="text"
                value={filtros.aseguradora}
                onChange={(e) => handleFiltroChange('aseguradora', e.target.value)}
                placeholder="Ej: Mapfre"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            {/* Filtro por Fecha desde */}
            <div>
              <label htmlFor="filtro-fecha-desde" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha primera matriculación (desde)
              </label>
              <input
                id="filtro-fecha-desde"
                type="date"
                value={filtros.fechaDesde}
                onChange={(e) => handleFiltroChange('fechaDesde', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            {/* Filtro por Fecha hasta */}
            <div>
              <label htmlFor="filtro-fecha-hasta" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha primera matriculación (hasta)
              </label>
              <input
                id="filtro-fecha-hasta"
                type="date"
                value={filtros.fechaHasta}
                onChange={(e) => handleFiltroChange('fechaHasta', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            {/* Filtro por Estado */}
            <div>
              <label htmlFor="filtro-estado" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Estado
              </label>
              <select
                id="filtro-estado"
                value={filtros.estado}
                onChange={(e) => handleFiltroChange('estado', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Todos</option>
                <option value="pendiente">Pendiente</option>
                <option value="en_curso">En curso</option>
                <option value="finalizado">Finalizado</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={limpiarFiltros}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 mr-2"
            >
              Limpiar filtros
            </button>
            <button
              onClick={() => onFiltrosChange(filtros)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              Aplicar filtros
            </button>
          </div>
        </div>
      )}
      
      {/* Chips de filtros activos */}
      <div className="px-4 py-2 flex flex-wrap gap-2">
        {filtros.taller && (
          <div className="flex items-center bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
            <span>Taller: {talleres.find(t => t.id === filtros.taller)?.nombre || filtros.taller}</span>
            {canSelectWorkshop() && (
              <button 
                onClick={() => handleFiltroChange('taller', null)}
                className="ml-2 text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
      
        {filtros.matricula && (
          <div className="flex items-center bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
            <span>Matrícula: {filtros.matricula}</span>
            <button 
              onClick={() => handleFiltroChange('matricula', '')}
              className="ml-2 text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        {filtros.tipoPoliza && (
          <div className="flex items-center bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
            <span>Póliza: {filtros.tipoPoliza}</span>
            <button 
              onClick={() => handleFiltroChange('tipoPoliza', '')}
              className="ml-2 text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        {filtros.aseguradora && (
          <div className="flex items-center bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
            <span>Aseguradora: {filtros.aseguradora}</span>
            <button 
              onClick={() => handleFiltroChange('aseguradora', '')}
              className="ml-2 text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        {(filtros.fechaDesde || filtros.fechaHasta) && (
          <div className="flex items-center bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
            <span>
              Fecha matriculación: 
              {filtros.fechaDesde ? ` desde ${new Date(filtros.fechaDesde).toLocaleDateString('es-ES')}` : ''}
              {filtros.fechaHasta ? ` hasta ${new Date(filtros.fechaHasta).toLocaleDateString('es-ES')}` : ''}
            </span>
            <button 
              onClick={() => {
                handleFiltroChange('fechaDesde', '');
                handleFiltroChange('fechaHasta', '');
              }}
              className="ml-2 text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        {filtros.estado && (
          <div className="flex items-center bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
            <span>Estado: {filtros.estado === 'pendiente' ? 'Pendiente' : filtros.estado === 'en_curso' ? 'En curso' : 'Finalizado'}</span>
            <button 
              onClick={() => handleFiltroChange('estado', '')}
              className="ml-2 text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        {(filtros.matricula || filtros.tipoPoliza || filtros.aseguradora || filtros.fechaDesde || filtros.fechaHasta || filtros.estado || (filtros.taller && canSelectWorkshop())) && (
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