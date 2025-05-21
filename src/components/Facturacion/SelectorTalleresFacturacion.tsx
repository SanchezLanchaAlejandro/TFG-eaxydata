"use client";

import { BuildingOfficeIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Taller } from '@/hooks/useFacturacion';

interface SelectorTalleresFacturacionProps {
  tallerSeleccionado: string | number | null;
  onChange: (tallerId: string | number | null) => void;
  talleres: Taller[];
  loading?: boolean;
}

export const SelectorTalleresFacturacion = ({ 
  tallerSeleccionado, 
  onChange, 
  talleres,
  loading = false 
}: SelectorTalleresFacturacionProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    // Si está vacío, usamos null, de lo contrario conservamos el valor original
    onChange(value === "" ? null : value);
  };

  return (
    <div className="sm:w-64">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow transition-all duration-200">
        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          <label
            htmlFor="taller-select-facturacion"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Filtrar por Taller
          </label>
        </div>
        <div className="relative p-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <BuildingOfficeIcon className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
            </div>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDownIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </div>
            <select
              id="taller-select-facturacion"
              value={tallerSeleccionado === null ? "" : String(tallerSeleccionado)}
              onChange={handleChange}
              className="block w-full pl-10 pr-10 py-2 text-sm text-gray-700 dark:text-white bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none cursor-pointer transition-colors duration-200"
              disabled={loading || talleres.length === 0}
            >
              <option value="">Todos los talleres</option>
              {talleres.map((taller) => (
                <option key={String(taller.id)} value={String(taller.id)}>
                  {taller.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {loading ? (
              <span>Cargando talleres...</span>
            ) : talleres.length === 0 ? (
              <span>No hay talleres disponibles</span>
            ) : tallerSeleccionado ? (
              <span>Mostrando datos para <span className="font-medium text-indigo-600 dark:text-indigo-400">{talleres.find(t => String(t.id) === String(tallerSeleccionado))?.nombre}</span></span>
            ) : (
              <span>Mostrando datos agregados de todos los talleres</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 