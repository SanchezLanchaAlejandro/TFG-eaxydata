import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Image from 'next/image';
import { Valoracion } from './types';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface TarjetaValoracionProps {
  valoracion: Valoracion;
  onClick: (id: string) => void;
}

export const TarjetaValoracion = ({ valoracion, onClick }: TarjetaValoracionProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: valoracion.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Mapear estados a colores
  const estadoColores = {
    pendiente: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-700 dark:text-red-300',
      dot: 'bg-red-500 dark:bg-red-400'
    },
    en_curso: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      text: 'text-amber-700 dark:text-amber-300',
      dot: 'bg-amber-500 dark:bg-amber-400'
    },
    finalizado: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      text: 'text-emerald-700 dark:text-emerald-300',
      dot: 'bg-emerald-500 dark:bg-emerald-400'
    }
  };

  const estadoLabel = {
    pendiente: 'Pendiente',
    en_curso: 'En curso',
    finalizado: 'Finalizado'
  };
  
  const colorClases = estadoColores[valoracion.estado];
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-md hover:translate-y-[-2px]"
      onClick={() => onClick(valoracion.id)}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex flex-col">
          <div className="flex items-center">
            <h3 className="font-medium text-gray-900 dark:text-white">
              {valoracion.matricula}
            </h3>
            
            {/* Badge de Siniestro Total */}
            {valoracion.esSiniestroTotal && (
              <span className="ml-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full text-xs font-medium flex items-center">
                <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                ST
              </span>
            )}
          </div>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClases.bg} ${colorClases.text}`}>
          <span className={`mr-1.5 h-2 w-2 rounded-full ${colorClases.dot}`}></span>
          {estadoLabel[valoracion.estado]}
        </span>
      </div>
      
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
        <p className="mb-1">
          <span className="font-medium text-gray-700 dark:text-gray-300">Chasis:</span> {valoracion.chasis.substring(0, 8)}...
        </p>
        <p className="mb-1">
          <span className="font-medium text-gray-700 dark:text-gray-300">Aseguradora:</span> {valoracion.aseguradora}
        </p>
        <p>
          <span className="font-medium text-gray-700 dark:text-gray-300">Tipo Póliza:</span> 
          <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            {valoracion.tipoPoliza}
          </span>
        </p>
      </div>
      
      <div className="pt-2 mt-2 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
        <span>
          {new Date(valoracion.fechaPrimeraMatriculacion).toLocaleDateString('es-ES')}
        </span>
        <button 
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          onClick={(e) => {
            e.stopPropagation();
            onClick(valoracion.id);
          }}
        >
          Ver detalles
        </button>
      </div>
    </div>
  );
}; 