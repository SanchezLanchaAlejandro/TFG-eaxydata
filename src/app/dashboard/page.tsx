"use client";

import AuthGuard from '@/components/Auth/AuthGuard';
import TarjetasResumen from '@/components/Dashboard/UI/TarjetasResumen';
import GraficoFacturacion from '@/components/Dashboard/UI/GraficoFacturacion';
import GraficoValoraciones from '@/components/Dashboard/UI/GraficoValoraciones';
import GraficoPolizas from '@/components/Dashboard/UI/GraficoPolizas';
import SelectorTalleres from '@/components/Dashboard/UI/SelectorTalleres';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useDashboard } from '@/hooks/useDashboard';

export default function DashboardPage() {
  const { hasRole } = useSupabaseData();
  const { 
    dashboardData,
    loading,
    error,
    tallerSeleccionado,
    cambiarTallerSeleccionado
  } = useDashboard();
  
  // Función para verificar si el usuario puede seleccionar taller
  const canSelectWorkshop = () => {
    return hasRole(['SUPER_ADMIN', 'GESTOR_RED']);
  };

  // Convertir tallerSeleccionado a number si es string
  const tallerSeleccionadoNumerico = typeof tallerSeleccionado === 'string' 
    ? Number(tallerSeleccionado) 
    : tallerSeleccionado;

  return (
    <AuthGuard>
      <div className="py-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Dashboard</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Visualiza y analiza los datos de rendimiento del sistema
            </p>
          </div>
          {/* Mostrar selector solo si el usuario es SUPER_ADMIN o GESTOR_RED */}
          {canSelectWorkshop() && (
            <SelectorTalleres 
              tallerSeleccionado={tallerSeleccionado}
              onChange={cambiarTallerSeleccionado}
              talleres={dashboardData.talleresDisponibles}
            />
          )}
        </div>
        
        {/* Estado de carga */}
        {loading && (
          <div className="bg-white dark:bg-slate-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">Cargando datos...</p>
          </div>
        )}
        
        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
        
        {/* Tarjetas de resumen */}
        {!loading && !error && (
          <TarjetasResumen 
            tallerSeleccionado={tallerSeleccionadoNumerico}
            dashboardData={dashboardData}
          />
        )}
        
        {/* Gráficos */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GraficoFacturacion 
            datos={dashboardData.datosFacturacionAnual}
            loading={loading} 
          />
          <GraficoValoraciones 
            datos={dashboardData.datosEstadoValoraciones}
            totales={dashboardData.totalesEstadoValoraciones}
            loading={loading}
          />
        </div>
        
        {/* Gráfico de pólizas */}
        <div className="mt-6">
          <GraficoPolizas 
            datos={dashboardData.datosDistribucionPolizas}
            total={dashboardData.totalesPolizas}
          />
        </div>
        
        
        {/* Actividad reciente (DESACTIVADO TEMPORALMENTE) */}
        {/* <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Actividad Reciente</h2>
          <div className="bg-white dark:bg-slate-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
                <InformationCircleIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No hay actividad reciente</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No se encontraron registros de actividad en el sistema.
              </p>
            </div>
          </div>
        </div> */}
      </div>
    </AuthGuard>
  );
} 