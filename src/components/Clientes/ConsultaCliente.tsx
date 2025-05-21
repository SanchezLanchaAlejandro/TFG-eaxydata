import { Cliente } from './types';

interface ConsultaClienteProps {
  cliente: Cliente;
  onEditar: () => void;
  onVolver: () => void;
}

export const ConsultaCliente = ({ cliente, onEditar, onVolver }: ConsultaClienteProps) => {
  return (
    <div className="bg-white dark:bg-slate-800 shadow-sm rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            Información del Cliente
          </h3>
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
        <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
          Detalles completos y datos de contacto.
        </p>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:p-0">
        <dl className="sm:divide-y sm:divide-gray-200 sm:dark:divide-gray-700">
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Nombre
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
              {cliente.nombre}
            </dd>
          </div>
          
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Apellidos
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
              {cliente.apellidos || "-"}
            </dd>
          </div>
          
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Razón social
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
              {cliente.razonSocial || "-"}
            </dd>
          </div>
          
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              NIE/NIF/CIF
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
              {cliente.cif}
            </dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Correo electrónico
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
              {cliente.email}
            </dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Teléfono
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
              {cliente.telefono}
            </dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Domicilio
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
              {cliente.direccion}
            </dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Fecha de alta
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
              {new Date(cliente.fechaAlta).toLocaleDateString('es-ES')}
            </dd>
          </div>
          
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Vehículos
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
              {cliente.vehiculos && cliente.vehiculos.length > 0 ? (
                <div className="space-y-3">
                  {cliente.vehiculos.map((vehiculo) => (
                    <div 
                      key={vehiculo.matricula} 
                      className="bg-gray-50 dark:bg-slate-700 p-3 rounded-md border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-blue-600 dark:text-blue-400">
                          Matrícula: {vehiculo.matricula}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-y-1 sm:grid-cols-2 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Marca:</span>{' '}
                          <span className="text-gray-900 dark:text-white">{vehiculo.marca}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Modelo:</span>{' '}
                          <span className="text-gray-900 dark:text-white">{vehiculo.modelo}</span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-gray-500 dark:text-gray-400">Bastidor:</span>{' '}
                          <span className="text-gray-900 dark:text-white font-mono">{vehiculo.bastidor}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-gray-500 dark:text-gray-400">
                  No hay vehículos asociados a este cliente
                </span>
              )}
            </dd>
          </div>
        </dl>
      </div>
      <div className="px-4 py-4 sm:px-6 flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onVolver}
          className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Volver
        </button>
        <button
          type="button"
          onClick={onEditar}
          className="rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Editar cliente
        </button>
      </div>
    </div>
  );
}; 