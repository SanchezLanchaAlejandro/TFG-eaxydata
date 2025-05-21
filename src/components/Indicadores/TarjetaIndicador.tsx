import React from 'react';

// Componente para una tarjeta de indicador individual
interface TarjetaIndicadorProps {
  titulo: string;
  valor: string | number;
  color: string;
  icon: React.ReactNode;
  unidad?: string;
}

export const TarjetaIndicador: React.FC<TarjetaIndicadorProps> = ({ 
  titulo, 
  valor, 
  color, 
  icon, 
  unidad = '' 
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-all duration-200 hover:shadow-md hover:translate-y-[-2px]">
      <div className="flex items-center space-x-4">
        <div className={`flex-shrink-0 ${color} rounded-full p-2`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
            {titulo}
          </p>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {valor}
            </p>
            {unidad && (
              <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">
                {unidad}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 