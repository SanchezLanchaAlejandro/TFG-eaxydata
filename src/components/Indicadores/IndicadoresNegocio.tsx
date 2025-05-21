"use client";

import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ClockIcon,
  DocumentTextIcon,
  ArrowsRightLeftIcon,
  CurrencyDollarIcon,
  BeakerIcon,
  WrenchIcon,
  PaintBrushIcon,
  TruckIcon,
  BuildingOfficeIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useIndicadores } from '@/hooks/useIndicadores';
import { useTalleres } from '@/hooks/useTalleres';
import { FiltrosIndicadores, ResumenFiltros, FiltrosIndicadoresState, filtrosInicialesState } from './FiltrosIndicadores';
import { TarjetaIndicador } from './TarjetaIndicador';
import { Spinner } from '../UI/Spinner';

// Componente principal de Indicadores de Negocio
const IndicadoresNegocio: React.FC = () => {
  // Estado para los filtros
  const [filtros, setFiltros] = useState<FiltrosIndicadoresState>(filtrosInicialesState);
  // Usar el hook useSupabaseData para obtener información del usuario
  const { userProfile, loading: loadingUser } = useSupabaseData();
  // Usar el hook useTalleres para obtener los talleres disponibles
  const { talleres, tallerSeleccionado, loading: loadingTalleres } = useTalleres();
  // Usar el hook useIndicadores para obtener los datos
  const { data, loading: loadingData, error, ratios } = useIndicadores(filtros);

  // Efecto para establecer el taller automáticamente si el usuario es GESTOR_TALLER
  // o si solo hay un taller disponible
  useEffect(() => {
    if (!loadingUser && !loadingTalleres && userProfile && talleres.length > 0) {
      // Obtener mes y año actual para establecer filtros por defecto
      const fechaActual = new Date();
      const mesActual = fechaActual.getMonth();
      const anioActual = fechaActual.getFullYear();
      
      // Si el usuario es un gestor de taller, establecer automáticamente su ID de taller
      if (userProfile.role === 'GESTOR_TALLER' && userProfile.workshop_id) {
        // Usar el workshop_id directamente sin convertir (puede ser UUID string)
        setFiltros(prevFiltros => ({
          ...prevFiltros,
          taller: userProfile.workshop_id as string | number,
          mes: mesActual,
          anio: anioActual,
          modoTemporal: 'mesAnio'
        }));
      } 
      // Si solo hay un taller disponible, seleccionarlo automáticamente
      else if (talleres.length === 1) {
        // Usar el ID del taller directamente sin convertir (puede ser UUID string)
        setFiltros(prevFiltros => ({
          ...prevFiltros,
          taller: talleres[0].id,
          mes: mesActual,
          anio: anioActual,
          modoTemporal: 'mesAnio'
        }));
      }
    }
  }, [userProfile, loadingUser, talleres, loadingTalleres]);

  // Handler para el cambio de filtros
  const handleFiltrosChange = (nuevosFiltros: FiltrosIndicadoresState) => {
    // Si el usuario es GESTOR_TALLER, preservar su taller asignado
    if (userProfile?.role === 'GESTOR_TALLER' && userProfile?.workshop_id) {
      // Usar el workshop_id directamente sin convertir
      nuevosFiltros.taller = userProfile.workshop_id;
    }
    
    setFiltros(nuevosFiltros);
  };
  
  // Determinar si se debe mostrar el mensaje de selección de taller
  // Para GESTOR_TALLER que ya tiene taller asignado, no mostrar este mensaje
  const mostrarMensajeSeleccionTaller = !filtros.taller && 
    (userProfile?.role !== 'GESTOR_TALLER' || !userProfile?.workshop_id);
  
  const isLoading = loadingUser || loadingTalleres;
  
  return (
    <div className="space-y-6">
      {/* Mostrar mensaje de carga mientras se obtiene el perfil del usuario o los talleres */}
      {isLoading ? (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 text-center">
          <p className="text-blue-700 dark:text-blue-400">
            Cargando información...
          </p>
        </div>
      ) : (
        <>
          {/* Componente de filtros - pasar el rol de usuario como prop */}
          <FiltrosIndicadores 
            filtros={filtros} 
            onChange={handleFiltrosChange}
            userRole={userProfile?.role || null}
          />

          {/* Mensaje si no hay taller seleccionado - solo para usuarios que no son GESTOR_TALLER o no tienen un taller asignado */}
          {mostrarMensajeSeleccionTaller ? (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg p-4 text-center">
              <p className="text-amber-700 dark:text-amber-400">
                Por favor, seleccione un taller para visualizar los indicadores
              </p>
            </div>
          ) : (
            <>
              {/* Resumen de filtros aplicados */}
              <ResumenFiltros filtros={filtros} userRole={userProfile?.role || null} />
              
              {/* Loader mientras se cargan los datos */}
              {loadingData ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 flex justify-center items-center">
                  <div className="flex flex-col items-center gap-2">
                    <Spinner size="md" />
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Cargando indicadores...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg p-4 text-center">
                  <p className="text-red-700 dark:text-red-400">
                    Error al cargar los indicadores: {error}
                  </p>
                </div>
              ) : (
                <>
                  {/* Sección de horas de trabajo */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Producción (horas)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <TarjetaIndicador
                        titulo="Horas Mecánica"
                        valor={typeof data?.horasMecanica === 'number' ? data.horasMecanica.toFixed(2) : '0.00'}
                        color="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
                        icon={<WrenchIcon className="h-6 w-6" />}
                        unidad="h"
                      />
                      <TarjetaIndicador
                        titulo="Horas Chapa"
                        valor={typeof data?.horasChapa === 'number' ? data.horasChapa.toFixed(2) : '0.00'}
                        color="bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400"
                        icon={<TruckIcon className="h-6 w-6" />}
                        unidad="h"
                      />
                      <TarjetaIndicador
                        titulo="Horas Pintura"
                        valor={typeof data?.horasPintura === 'number' ? data.horasPintura.toFixed(2) : '0.00'}
                        color="bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400"
                        icon={<PaintBrushIcon className="h-6 w-6" />}
                        unidad="h"
                      />
                    </div>
                  </div>
                  
                  {/* Sección de Órdenes de Reparación */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Órdenes de Reparación
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <TarjetaIndicador
                        titulo="OR Mecánica"
                        valor={data?.orMecanica || 0}
                        color="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
                        icon={<DocumentTextIcon className="h-6 w-6" />}
                        unidad="OR"
                      />
                      <TarjetaIndicador
                        titulo="OR Carrocería"
                        valor={data?.orCarroceria || 0}
                        color="bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400"
                        icon={<DocumentTextIcon className="h-6 w-6" />}
                        unidad="OR"
                      />
                    </div>
                  </div>
                  
                  {/* Sección de Ratios */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Ratios
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <TarjetaIndicador
                        titulo="Horas Mecánica / OR Mecánica"
                        valor={ratios?.ratioHorasMecanicaPorOR.toFixed(2) || "0.00"}
                        color="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"
                        icon={<ArrowsRightLeftIcon className="h-6 w-6" />}
                        unidad="h/OR"
                      />
                      <TarjetaIndicador
                        titulo="(Horas Chapa + Pintura) / OR Carrocería"
                        valor={ratios?.ratioHorasChapaPinturaPorOR.toFixed(2) || "0.00"}
                        color="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"
                        icon={<ArrowsRightLeftIcon className="h-6 w-6" />}
                        unidad="h/OR"
                      />
                    </div>
                  </div>
                  
                  {/* Sección de Ticket Medio */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Ticket Medio
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <TarjetaIndicador
                        titulo="Ticket Medio Mecánica"
                        valor={ratios?.ticketMedioMecanica.toFixed(2) || "0.00"}
                        color="bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400"
                        icon={<CurrencyDollarIcon className="h-6 w-6" />}
                        unidad="€"
                      />
                      <TarjetaIndicador
                        titulo="Ticket Medio Carrocería"
                        valor={ratios?.ticketMedioCarroceria.toFixed(2) || "0.00"}
                        color="bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400"
                        icon={<CurrencyDollarIcon className="h-6 w-6" />}
                        unidad="€"
                      />
                    </div>
                  </div>
                  
                  {/* Sección de Eficiencia de Materiales */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Eficiencia de Materiales
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <TarjetaIndicador
                        titulo="Material Pintura / Horas Pintura"
                        valor={ratios?.eficienciaMaterialPintura.toFixed(2) || "0.00"}
                        color="bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400"
                        icon={<BeakerIcon className="h-6 w-6" />}
                        unidad="€/h"
                      />
                      <TarjetaIndicador
                        titulo="Material Pintura / OR Carrocería"
                        valor={ratios?.eficienciaMaterialPorOR.toFixed(2) || "0.00"}
                        color="bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400"
                        icon={<BeakerIcon className="h-6 w-6" />}
                        unidad="€/OR"
                      />
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default IndicadoresNegocio; 