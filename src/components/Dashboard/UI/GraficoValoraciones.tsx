"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface GraficoValoracionesProps {
  datos: { mes: string; pendientes: number; en_curso: number; finalizadas: number }[];
  totales: { pendientes: number; en_curso: number; finalizadas: number };
  loading?: boolean;
}

export default function GraficoValoraciones({ datos, totales, loading = false }: GraficoValoracionesProps) {
  const colores = {
    pendientes: '#ef4444', // red-500
    en_curso: '#f59e0b', // amber-500
    finalizadas: '#10b981', // emerald-500
  };

  const formatoLeyenda = (value: string) => {
    const valueMap: { [key: string]: string } = {
      pendientes: 'Pendientes',
      en_curso: 'En Curso',
      finalizadas: 'Finalizadas'
    };
    return <span className="text-gray-700 dark:text-gray-300">{valueMap[value] || value}</span>;
  };

  const tieneAlgunDato = totales.pendientes > 0 || totales.en_curso > 0 || totales.finalizadas > 0;

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-shadow duration-200 hover:shadow-md">
      <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-5">
        Estado de Valoraciones
      </h2>
      {loading ? (
        <div className="flex items-center justify-center" style={{ height: '300px' }}>
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : !tieneAlgunDato ? (
        <div className="flex flex-col items-center justify-center" style={{ height: '300px' }}>
          <span className="text-gray-500 dark:text-gray-400 mb-4">No hay datos de valoraciones disponibles</span>
        </div>
      ) : (
      <div className="mt-4" style={{ height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={datos}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700" />
            <XAxis 
              dataKey="mes" 
              tick={{ fill: '#4b5563' }}
              axisLine={{ stroke: '#d1d5db' }}
              className="dark:text-gray-400 dark:stroke-gray-700"
            />
            <YAxis 
              tick={{ fill: '#4b5563' }} 
              axisLine={{ stroke: '#d1d5db' }}
              className="dark:text-gray-400 dark:stroke-gray-700"
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e2e8f0',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                color: '#1e293b',
                padding: '8px 12px'
              }}
              formatter={(value, name) => {
                const nameMap: { [key: string]: string } = {
                  pendientes: 'Pendientes',
                  en_curso: 'En Curso',
                  finalizadas: 'Finalizadas'
                };
                return [`${value}`, nameMap[name] || name];
              }}
              itemStyle={{ color: '#334155' }}
              cursor={{ fill: 'rgba(243, 244, 246, 0.4)', stroke: '#d1d5db', strokeWidth: 1 }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '10px' }}
              formatter={formatoLeyenda}
              iconSize={12}
              iconType="square"
            />
            <Bar 
              dataKey="pendientes" 
              name="pendientes"
              stackId="a" 
              fill={colores.pendientes}
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="en_curso" 
              name="en_curso"
              stackId="a" 
              fill={colores.en_curso}
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="finalizadas" 
              name="finalizadas"
              stackId="a" 
              fill={colores.finalizadas}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      )}
      <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
        <div className="flex flex-col items-center">
          <span className="text-gray-600 dark:text-gray-400 mb-1">Pendientes</span>
          <span className="font-semibold text-lg text-red-600 dark:text-red-400">{totales.pendientes}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-gray-600 dark:text-gray-400 mb-1">En Curso</span>
          <span className="font-semibold text-lg text-amber-600 dark:text-amber-400">{totales.en_curso}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-gray-600 dark:text-gray-400 mb-1">Finalizadas</span>
          <span className="font-semibold text-lg text-emerald-600 dark:text-emerald-400">{totales.finalizadas}</span>
        </div>
      </div>
    </div>
  );
} 