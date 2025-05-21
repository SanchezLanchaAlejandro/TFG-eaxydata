"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Sector } from 'recharts';

interface GraficoPolizasProps {
  datos: { name: string; value: number; color?: string }[];
  total: number;
}

export default function GraficoPolizas({ datos = [], total = 0 }: GraficoPolizasProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Datos con colores asignados
  const datosConColores = datos.map(item => ({
    ...item,
    color: item.color || getDefaultColor(item.name)
  }));

  // Asignar colores predeterminados basados en el nombre de la categoría
  function getDefaultColor(name: string): string {
    switch(name) {
      case 'Todo Riesgo':
        return '#ef4444'; // red-500
      case 'Todo Riesgo con Franquicia':
        return '#f59e0b'; // amber-500
      case 'Terceros Ampliado':
        return '#8b5cf6'; // violet-500
      case 'Terceros':
        return '#10b981'; // emerald-500
      default:
        return '#6b7280'; // gray-500
    }
  }
  
  // Detectar si estamos en modo oscuro
  useEffect(() => {
    // Comprobar si estamos en modo oscuro al cargar el componente
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const htmlElement = document.documentElement;
    
    const checkDarkMode = () => {
      const isDark = htmlElement.classList.contains('dark') || 
                     darkModeMediaQuery.matches;
      setIsDarkMode(isDark);
    };
    
    // Comprobar el modo inicial
    checkDarkMode();
    
    // Actualizar cuando el modo cambie
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkDarkMode();
        }
      });
    });
    
    observer.observe(htmlElement, { attributes: true });
    
    // Limpiar el observer al desmontar
    return () => observer.disconnect();
  }, []);

  // Renderizador de etiquetas en el gráfico con tipos seguros
  const renderCustomizedLabel = (props: any) => {
    // Verificar y extraer las propiedades necesarias de manera segura
    if (typeof props !== 'object' || props === null) return null;
    
    const cx = typeof props.cx === 'number' ? props.cx : 0;
    const cy = typeof props.cy === 'number' ? props.cy : 0;
    const midAngle = typeof props.midAngle === 'number' ? props.midAngle : 0;
    const innerRadius = typeof props.innerRadius === 'number' ? props.innerRadius : 0;
    const outerRadius = typeof props.outerRadius === 'number' ? props.outerRadius : 0;
    const percent = typeof props.percent === 'number' ? props.percent : 0;
    
    if (percent === 0) return null;
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.7;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Renderizador de sectores activos con tipos seguros
  const renderActiveShape = (props: any) => {
    // Si no hay props válidas, devolver un elemento vacío en lugar de null
    if (typeof props !== 'object' || props === null) {
      return <g></g>; // Devolver un grupo vacío en lugar de null
    }
    
    const cx = typeof props.cx === 'number' ? props.cx : 0;
    const cy = typeof props.cy === 'number' ? props.cy : 0;
    const innerRadius = typeof props.innerRadius === 'number' ? props.innerRadius : 0;
    const outerRadius = typeof props.outerRadius === 'number' ? props.outerRadius : 0;
    const startAngle = typeof props.startAngle === 'number' ? props.startAngle : 0;
    const endAngle = typeof props.endAngle === 'number' ? props.endAngle : 0;
    const fill = typeof props.fill === 'string' ? props.fill : '#000';
    
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          opacity={0.8}
        />
      </g>
    );
  };

  // Manejador para activar un sector
  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-shadow duration-200 hover:shadow-md">
      <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center justify-between">
        <span>Distribución de Pólizas</span>
        <span className="text-base text-gray-600 dark:text-gray-300 font-normal">
          Total: <span className="font-semibold text-blue-600 dark:text-blue-400">{total}</span>
        </span>
      </h2>
      
      {total === 0 ? (
        <div className="flex flex-col items-center justify-center" style={{ height: '300px' }}>
          <span className="text-gray-500 dark:text-gray-400 mb-4">No hay pólizas activas para mostrar</span>
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-center">
              <PieChart width={280} height={280}>
                <Pie
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  data={datosConColores}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={115}
                  innerRadius={55}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={3}
                  onMouseEnter={onPieEnter}
                >
                  {datosConColores.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      stroke="#ffffff" 
                      strokeWidth={2}
                      className="dark:stroke-slate-800"
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value} (${((Number(value)/total)*100).toFixed(1)}%)`, 'Pólizas']}
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? '#374151' : 'white', 
                    border: isDarkMode ? '1px solid #4B5563' : '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    color: isDarkMode ? '#F9FAFB' : '#1e293b',
                    fontWeight: 'medium',
                    padding: '8px 12px'
                  }}
                  itemStyle={{ color: isDarkMode ? '#E5E7EB' : '#334155' }}
                />
              </PieChart>
            </div>
            
            <div className="flex flex-col">
              <div className="bg-gray-50 dark:bg-slate-900/40 p-4 rounded-lg border border-gray-100 dark:border-gray-800 h-full flex flex-col justify-center">
                {/* Mostrar solo la categoría seleccionada */}
                {datosConColores[activeIndex] && (
                  <div className="p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Categoría seleccionada</div>
                    <div className="flex items-center">
                      <div 
                        className="w-5 h-5 rounded-full mr-3" 
                        style={{ backgroundColor: datosConColores[activeIndex].color }}
                      />
                      <div className="text-gray-900 dark:text-gray-100 font-bold text-lg">
                        {datosConColores[activeIndex].name}
                      </div>
                    </div>
                    <div className="mt-3 text-gray-700 dark:text-gray-300">
                      <span className="font-semibold text-xl">{datosConColores[activeIndex].value}</span> 
                      <span className="text-sm ml-2">({((datosConColores[activeIndex].value/total)*100).toFixed(1)}% del total)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {datosConColores.map((poliza, index) => (
              <div 
                key={index}
                className={`p-2 rounded-lg border transition-all cursor-pointer ${
                  activeIndex === index 
                    ? 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                onClick={() => setActiveIndex(index)}
              >
                <div className="flex items-center justify-center p-1">
                  <div 
                    className="w-4 h-4 rounded-full mr-2" 
                    style={{ backgroundColor: poliza.color }}
                  />
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                    {poliza.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 