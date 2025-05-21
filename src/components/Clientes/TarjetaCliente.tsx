import { Cliente } from './types';

interface TarjetaClienteProps {
  cliente: Cliente;
  onClick: (id: string) => void;
}

export const TarjetaCliente = ({ cliente, onClick }: TarjetaClienteProps) => {
  return (
    <div
      className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-md hover:translate-y-[-2px] cursor-pointer"
      onClick={() => onClick(cliente.id)}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white">
            {cliente.nombre} {cliente.apellidos}
          </h3>
          {cliente.razonSocial && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {cliente.razonSocial}
            </p>
          )}
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          cliente.activo 
            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
        }`}>
          <span className={`mr-1.5 h-2 w-2 rounded-full ${
            cliente.activo 
              ? 'bg-emerald-500 dark:bg-emerald-400' 
              : 'bg-red-500 dark:bg-red-400'
          }`}></span>
          {cliente.activo ? 'Activo' : 'Inactivo'}
        </span>
      </div>
      
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
        <p className="mb-1">
          <span className="font-medium text-gray-700 dark:text-gray-300">NIE/NIF/CIF:</span> {cliente.cif}
        </p>
        <p className="mb-1">
          <span className="font-medium text-gray-700 dark:text-gray-300">Email:</span> {cliente.email}
        </p>
        <p>
          <span className="font-medium text-gray-700 dark:text-gray-300">Teléfono:</span> {cliente.telefono}
        </p>
      </div>
      
      {cliente.vehiculos && cliente.vehiculos.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Vehículos ({cliente.vehiculos.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {cliente.vehiculos.slice(0, 2).map((vehiculo) => (
              <div key={vehiculo.id} className="flex items-center bg-gray-50 dark:bg-slate-700 rounded-md px-2 py-1 text-xs">
                <span className="font-medium text-blue-600 dark:text-blue-400 mr-1">{vehiculo.matricula}</span>
                <span className="text-gray-500 dark:text-gray-400">{vehiculo.marca} {vehiculo.modelo}</span>
              </div>
            ))}
            {cliente.vehiculos.length > 2 && (
              <div className="bg-gray-50 dark:bg-slate-700 rounded-md px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                +{cliente.vehiculos.length - 2} más
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="pt-2 mt-2 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
        <span>
          Alta: {new Date(cliente.fechaAlta).toLocaleDateString('es-ES')}
        </span>
        <button 
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          onClick={(e) => {
            e.stopPropagation();
            onClick(cliente.id);
          }}
        >
          Ver detalles
        </button>
      </div>
    </div>
  );
}; 