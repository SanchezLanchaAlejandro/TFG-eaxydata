"use client";

import { BuildingOfficeIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

// La lista de talleres se pasará como prop ahora
interface SelectorTalleresProps {
  tallerSeleccionado: string | number | null;
  onChange: (tallerId: string | number | null) => void;
  talleres: { id: string | number; nombre: string }[];
}

export default function SelectorTalleres({ tallerSeleccionado, onChange, talleres }: SelectorTalleresProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    // Si está vacío, usamos null, de lo contrario conservamos el valor original
    onChange(value === "" ? null : value);
  };

  return (
    <div className="w-full sm:w-72">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow transition-all duration-200">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <label
            htmlFor="taller-select"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Seleccionar Taller
          </label>
        </div>
        <div className="relative p-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <BuildingOfficeIcon className="h-5 w-5 text-blue-500 dark:text-blue-400" />
            </div>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDownIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </div>
            <select
              id="taller-select"
              value={tallerSeleccionado === null ? "" : String(tallerSeleccionado)}
              onChange={handleChange}
              className="block w-full pl-10 pr-10 py-2.5 text-sm text-gray-700 dark:text-white bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer transition-colors duration-200"
            >
              <option value="">Todos los talleres</option>
              {talleres.map((taller) => (
                <option key={String(taller.id)} value={String(taller.id)}>
                  {taller.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {tallerSeleccionado ? (
              <span>Mostrando datos para <span className="font-medium text-blue-600 dark:text-blue-400">{talleres.find(t => String(t.id) === String(tallerSeleccionado))?.nombre}</span></span>
            ) : (
              <span>Mostrando datos agregados de todos los talleres</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 