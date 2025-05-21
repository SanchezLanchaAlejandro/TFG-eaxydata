"use client";

import React, { useEffect, useState } from 'react';
import { 
  ChartBarIcon, 
  DocumentCheckIcon, 
  CurrencyDollarIcon, 
  UsersIcon 
} from '@heroicons/react/24/outline';
import { DashboardData } from '@/hooks/useDashboard';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { supabase } from '@/lib/supabase';

interface CardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  changePercent?: number;
}

const Card = ({ title, value, icon, color, changePercent }: CardProps) => {
  // Mapeo de colores a clases de Tailwind
  const colorMap: Record<string, { bg: string; text: string; iconBg: string }> = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-700 dark:text-blue-300',
      iconBg: 'bg-blue-500 dark:bg-blue-600'
    },
    green: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      text: 'text-emerald-700 dark:text-emerald-300',
      iconBg: 'bg-emerald-500 dark:bg-emerald-600'
    },
    yellow: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      text: 'text-amber-700 dark:text-amber-300',
      iconBg: 'bg-amber-500 dark:bg-amber-600'
    },
    indigo: {
      bg: 'bg-violet-50 dark:bg-violet-900/20',
      text: 'text-violet-700 dark:text-violet-300',
      iconBg: 'bg-violet-500 dark:bg-violet-600'
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-700 dark:text-red-300',
      iconBg: 'bg-red-500 dark:bg-red-600'
    }
  };

  const colorClasses = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200 hover:shadow-md hover:translate-y-[-2px]">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${colorClasses.iconBg} rounded-full p-2`}>
            {icon}
          </div>
          <div className="ml-4 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</dt>
              <dd className="flex items-baseline mt-1">
                <div className={`text-xl font-semibold ${colorClasses.text}`}>{value}</div>
                {changePercent !== undefined && (
                  <div className={`ml-2 flex items-baseline text-xs font-semibold ${
                    changePercent >= 0 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    <span className="sr-only">{changePercent >= 0 ? 'Incremento' : 'Decremento'} de</span>
                    {changePercent >= 0 ? '↑' : '↓'} {Math.abs(changePercent)}%
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className={`h-1 ${colorClasses.iconBg}`}></div>
    </div>
  );
};

interface TarjetasResumenProps {
  tallerSeleccionado: number | null;
  dashboardData: DashboardData;
}

export default function TarjetasResumen({ tallerSeleccionado, dashboardData }: TarjetasResumenProps) {
  const { userProfile } = useSupabaseData();
  const [facturacionMesAnterior, setFacturacionMesAnterior] = useState(0);
  const [nuevosClientesMesAnterior, setNuevosClientesMesAnterior] = useState(0);
  
  // Función para formatear números a formato de euros
  const formatoEuros = (valor: number) => {
    return `€${valor.toLocaleString('es-ES')}`;
  };

  // Calcular el cambio porcentual entre dos valores
  const calcularCambioPorcentual = (actual: number, anterior: number): number => {
    if (anterior === 0) return actual > 0 ? 100 : 0;
    return Math.round(((actual - anterior) / anterior) * 100);
  };

  // Obtener facturación mensual del mes anterior de la gráfica de facturación
  useEffect(() => {
    // La propiedad datosFacturacionAnual contiene los datos de los últimos 6 meses
    // ordenados de más antiguo a más reciente
    if (!dashboardData.datosFacturacionAnual || dashboardData.datosFacturacionAnual.length === 0) {
      setFacturacionMesAnterior(0);
      return;
    }
    
    // Los datos de facturación están ordenados cronológicamente, con el último valor 
    // siendo el mes actual y el penúltimo el mes anterior
    const mesAnteriorIndex = dashboardData.datosFacturacionAnual.length - 2;
    
    // Si tenemos datos del mes anterior (debe haber al menos 2 meses de datos)
    if (mesAnteriorIndex >= 0) {
      setFacturacionMesAnterior(dashboardData.datosFacturacionAnual[mesAnteriorIndex].facturacion);
    } else {
      // Si solo tenemos datos del mes actual, usamos 0 como valor anterior
      setFacturacionMesAnterior(0);
    }
  }, [dashboardData.datosFacturacionAnual, tallerSeleccionado]);

  // Consultar datos de nuevos clientes del mes anterior
  useEffect(() => {
    if (!userProfile) return;
    
    const obtenerClientesMesAnterior = async () => {
      try {
        // Obtener el primer y último día del mes anterior
        const now = new Date();
        const mesAnterior = new Date(now);
        mesAnterior.setMonth(now.getMonth() - 1);
        
        const primerDiaMesAnterior = new Date(mesAnterior.getFullYear(), mesAnterior.getMonth(), 1);
        const ultimoDiaMesAnterior = new Date(mesAnterior.getFullYear(), mesAnterior.getMonth() + 1, 0);
        
        // Formatear las fechas para la consulta SQL
        const fechaInicio = primerDiaMesAnterior.toISOString().split('T')[0];
        const fechaFin = ultimoDiaMesAnterior.toISOString().split('T')[0];
        
        let workshopIds: (string | number)[] = [];
        
        // Determinar qué workshop_ids utilizar según el rol y la selección
        if (tallerSeleccionado) {
          // Si hay un taller seleccionado, usamos ese
          workshopIds = [tallerSeleccionado];
        } else if (userProfile.role === 'GESTOR_TALLER' && userProfile.workshop_id) {
          // Para gestores de taller, usamos su taller asignado
          workshopIds = [userProfile.workshop_id];
        } else {
          // Para gestores de red y super admin, obtenemos los talleres filtrados por network_id si aplica
          let query = supabase.from('workshops').select('id');
          
          // Filtrar por network_id para GESTOR_RED
          if (userProfile.role === 'GESTOR_RED' && userProfile.network_id) {
            query = query.eq('network_id', userProfile.network_id);
          }
          
          // Filtrar por network_id para SUPER_ADMIN si tiene uno asignado
          if (userProfile.role === 'SUPER_ADMIN' && userProfile.network_id) {
            query = query.eq('network_id', userProfile.network_id);
          }
          
          const { data: talleres, error: errorTalleres } = await query;
          
          if (errorTalleres) throw errorTalleres;
          
          if (talleres && talleres.length > 0) {
            workshopIds = talleres.map(taller => taller.id);
          }
        }
        
        // Consulta para obtener los clientes creados en el mes anterior
        let queryClientes;
        
        if (workshopIds.length > 0) {
          queryClientes = supabase
            .from('clientes')
            .select('id')
            .gte('fecha_creacion', fechaInicio)
            .lte('fecha_creacion', fechaFin)
            .in('workshop_id', workshopIds);
        } else {
          // Para super admin sin selección, obtener todos los clientes
          queryClientes = supabase
            .from('clientes')
            .select('id')
            .gte('fecha_creacion', fechaInicio)
            .lte('fecha_creacion', fechaFin);
        }
        
        const { data: clientes, error: clientesError } = await queryClientes;
        
        if (clientesError) throw clientesError;
        
        // Actualizar el contador de nuevos clientes del mes anterior
        setNuevosClientesMesAnterior(clientes?.length || 0);
        
      } catch (error) {
        console.error("Error al obtener datos de nuevos clientes del mes anterior:", error);
        setNuevosClientesMesAnterior(0);
      }
    };
    
    obtenerClientesMesAnterior();
  }, [userProfile, tallerSeleccionado]);

  // Crear los datos de las tarjetas con los valores reales del dashboard
  const kpiData = [
    {
      title: 'Valoraciones Activas',
      value: dashboardData.polizasActivas.toString(),
      icon: <ChartBarIcon className="h-5 w-5 text-white" />,
      color: 'blue',
    },
    {
      title: 'Valoraciones Finalizadas',
      value: dashboardData.valoracionesFinalizadasMesActual.toString(),
      icon: <DocumentCheckIcon className="h-5 w-5 text-white" />,
      color: 'green',
      changePercent: calcularCambioPorcentual(dashboardData.valoracionesFinalizadasMesActual, dashboardData.valoracionesFinalizadasMesAnterior)
    },
    {
      title: 'Facturación Mensual',
      value: formatoEuros(dashboardData.facturacionMensual),
      icon: <CurrencyDollarIcon className="h-5 w-5 text-white" />,
      color: 'yellow',
      changePercent: calcularCambioPorcentual(dashboardData.facturacionMensual, facturacionMesAnterior)
    },
    {
      title: 'Nuevos Clientes Mes',
      value: dashboardData.nuevosClientesMes.toString(),
      icon: <UsersIcon className="h-5 w-5 text-white" />,
      color: 'indigo',
      changePercent: calcularCambioPorcentual(dashboardData.nuevosClientesMes, nuevosClientesMesAnterior)
    }
  ];
  
  // Obtener el nombre del taller seleccionado (si hay uno seleccionado)
  const nombreTaller = tallerSeleccionado 
    ? dashboardData.talleresDisponibles.find(t => Number(t.id) === Number(tallerSeleccionado))?.nombre 
    : "Todos los talleres";

  return (
    <div className="mt-4">
      <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-5">
        Resumen Mes en Curso {tallerSeleccionado ? `- ${nombreTaller}` : ""}
      </h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((card, index) => (
          <Card 
            key={index}
            title={card.title}
            value={card.value}
            icon={card.icon}
            color={card.color}
            changePercent={card.changePercent}
          />
        ))}
      </div>
    </div>
  );
} 