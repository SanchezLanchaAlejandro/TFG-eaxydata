"use client";

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Función para formatear los valores del eje Y (euros)
const formatoEuros = (valor: number) => {
  return `${valor.toLocaleString('es-ES')}€`;
};

// Función para calcular el total anual
const calcularTotalAnual = (datos: { mes: string; facturacion: number }[]) => {
  if (!datos || datos.length === 0) return 0;
  return datos.reduce((total, dato) => total + dato.facturacion, 0);
};

// Función para calcular el promedio mensual
const calcularPromedioMensual = (datos: { mes: string; facturacion: number }[]) => {
  if (!datos || datos.length === 0) return 0;
  return Math.round(calcularTotalAnual(datos) / datos.length);
};

interface GraficoFacturacionProps {
  datos: { mes: string; facturacion: number }[];
  loading?: boolean;
}

export default function GraficoFacturacion({ datos, loading = false }: GraficoFacturacionProps) {
  // Filtrar solo los últimos 6 meses
  const últimos6Meses = datos && datos.length > 0 
    ? datos.slice(Math.max(0, datos.length - 6)) 
    : [];
  
  // Calcular totales con los datos filtrados
  const totalAnual = calcularTotalAnual(últimos6Meses);
  const promedioMensual = calcularPromedioMensual(últimos6Meses);

  // Verificar si hay datos para mostrar
  const noData = !últimos6Meses || últimos6Meses.length === 0 || (últimos6Meses.length > 0 && últimos6Meses.every(dato => dato.facturacion === 0));

  // Colores para el tema claro y oscuro
  const colors = {
    grid: '#e2e8f0',
    gridDark: '#334155',
    text: '#64748b',
    textDark: '#94a3b8',
    line: '#3b82f6',
    lineDark: '#60a5fa',
    dot: '#2563eb',
    dotDark: '#3b82f6',
    activeDot: '#1d4ed8',
    activeDotDark: '#2563eb',
    activeDotRing: '#bfdbfe',
    activeDotRingDark: '#1e3a8a'
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-shadow duration-200 hover:shadow-md">
      <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-5">
        Evolución de Facturación
      </h2>
      {loading ? (
        <div className="flex items-center justify-center" style={{ height: '300px' }}>
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : noData ? (
        <div className="flex flex-col items-center justify-center" style={{ height: '300px' }}>
          <span className="text-gray-500 dark:text-gray-400 mb-4">No hay datos de facturación disponibles</span>
        </div>
      ) : (
      <div className="mt-4" style={{ height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={últimos6Meses}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={colors.grid}
              className="dark:stroke-gray-700" 
            />
            <XAxis 
              dataKey="mes" 
              tick={{ fill: colors.text }}
              axisLine={{ stroke: colors.grid }}
              className="dark:text-gray-400 dark:stroke-gray-700"
            />
            <YAxis 
              tickFormatter={formatoEuros} 
              tick={{ fill: colors.text }}
              axisLine={{ stroke: colors.grid }}
              className="dark:text-gray-400 dark:stroke-gray-700"
            />
            <Tooltip 
              formatter={(value: number) => [`${value.toLocaleString('es-ES')}€`, 'Facturación']}
              labelFormatter={(label) => `Mes: ${label}`}
              contentStyle={{ 
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                color: '#1e293b'
              }}
              labelStyle={{ color: '#334155', fontWeight: 'bold' }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '8px' }}
              formatter={(value) => (
                <span style={{ color: colors.text }} className="dark:text-gray-300">{value}</span>
              )}
            />
            <Line
              type="monotone"
              dataKey="facturacion"
              name="Facturación"
              stroke={colors.line}
              strokeWidth={3}
              dot={{ r: 4, fill: colors.dot, strokeWidth: 0 }}
              activeDot={{ 
                r: 6, 
                fill: colors.activeDot, 
                stroke: colors.activeDotRing, 
                strokeWidth: 2 
              }}
              className="dark:stroke-blue-400"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      )}
      <div className="mt-5 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex justify-between">
          <span>Total semestral: <span className="font-semibold text-gray-900 dark:text-gray-100">{totalAnual.toLocaleString('es-ES')}€</span></span>
          <span>Promedio mensual: <span className="font-semibold text-gray-900 dark:text-gray-100">{promedioMensual.toLocaleString('es-ES')}€</span></span>
        </div>
      </div>
    </div>
  );
} 