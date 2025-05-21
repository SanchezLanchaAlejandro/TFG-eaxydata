import { Valoracion } from './types';

interface ValoracionesListaProps {
  valoraciones: Valoracion[];
  onValoracionClick: (id: string) => void;
}

export const ValoracionesLista = ({ valoraciones, onValoracionClick }: ValoracionesListaProps) => {
  return (
    <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Listado de Valoraciones</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-slate-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Matrícula
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Tipo de Póliza
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Aseguradora
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Fecha Primera Matriculación
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Estado
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
            {valoraciones.length > 0 ? (
              valoraciones.map((valoracion) => (
                <tr 
                  key={valoracion.id} 
                  className="hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer"
                  onClick={() => onValoracionClick(valoracion.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="font-medium text-gray-900 dark:text-white">{valoracion.matricula}</div>
                      {valoracion.esSiniestroTotal && (
                        <span className="ml-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full text-xs font-medium flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Siniestro Total
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{valoracion.chasis}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                      {valoracion.tipoPoliza}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {valoracion.aseguradora}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {valoracion.fechaPrimeraMatriculacion ? (
                      (() => {
                        try {
                          const fecha = new Date(valoracion.fechaPrimeraMatriculacion);
                          if (!isNaN(fecha.getTime())) {
                            return fecha.toLocaleDateString('es-ES');
                          }
                          return 'Fecha no válida';
                        } catch (error) {
                          console.error('Error al formatear fecha:', valoracion.fechaPrimeraMatriculacion, error);
                          return 'Error en fecha';
                        }
                      })()
                    ) : (
                      'Sin fecha'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${valoracion.estado === 'pendiente' 
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' 
                        : valoracion.estado === 'en_curso' 
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' 
                        : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'}`}>
                      {valoracion.estado === 'pendiente' ? 'Pendiente' : 
                       valoracion.estado === 'en_curso' ? 'En curso' : 
                       'Finalizado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onValoracionClick(valoracion.id);
                      }}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No hay valoraciones que coincidan con los filtros aplicados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}; 