import { useState, useEffect, useMemo } from 'react';
import { useValoraciones } from '@/hooks/useValoraciones';
import { useTalleres, Taller } from '@/hooks/useTalleres';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { ChartBarIcon } from '@heroicons/react/24/outline';

interface ValoracionesPorMes {
  mes: number;
  nombreMes: string;
  cantidad: number;
}

// Función para normalizar el estado según lo que viene de la BD
const esEstadoFinalizado = (estado: string | null): boolean => {
  if (!estado) return false;
  
  const estadoLower = estado.toLowerCase().trim();
  return estadoLower === 'finalizado' || estadoLower === 'completado' || 
         estadoLower === 'terminado' || estadoLower === 'finalizada';
};

const ResumenValoracionesFinalizadas = () => {
  const { valoraciones, loading } = useValoraciones();
  const { talleres, tallerSeleccionado, setTallerSeleccionado } = useTalleres();
  const { userProfile } = useSupabaseData();
  
  const [añoSeleccionado, setAñoSeleccionado] = useState<number>(new Date().getFullYear());
  const [añosDisponibles, setAñosDisponibles] = useState<number[]>([]);
  
  // Extraer los años únicos disponibles a partir de las valoraciones finalizadas
  useEffect(() => {
    if (valoraciones.length > 0) {
      const valoracionesFinalizadas = valoraciones.filter(v => 
        esEstadoFinalizado(v.estado) && v.fecha_finalizado
      );
      
      if (valoracionesFinalizadas.length > 0) {
        const años = valoracionesFinalizadas
          .map(v => new Date(v.fecha_finalizado!).getFullYear())
          .filter((año, index, self) => self.indexOf(año) === index)
          .sort((a, b) => b - a); // Ordenar de más reciente a más antiguo
        
        setAñosDisponibles(años);
        
        // Si no hay año seleccionado o el año seleccionado no está en la lista, seleccionar el más reciente
        if (años.length > 0 && !años.includes(añoSeleccionado)) {
          setAñoSeleccionado(años[0]);
        }
      }
    }
  }, [valoraciones, añoSeleccionado]);
  
  // Filtrar y agrupar valoraciones por mes para el año seleccionado y taller seleccionado
  const valoracionesPorMes = useMemo(() => {
    if (!valoraciones.length) return [];
    
    const nombresMeses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    // Inicializar array con todos los meses (para mostrar incluso los que tienen 0 valoraciones)
    const mesesInicializados: ValoracionesPorMes[] = Array.from({ length: 12 }, (_, index) => ({
      mes: index + 1,
      nombreMes: nombresMeses[index],
      cantidad: 0
    }));
    
    // Filtrar valoraciones finalizadas del año seleccionado y del taller seleccionado si hay alguno
    const valoracionesAñoActual = valoraciones.filter(v => {
      if (!esEstadoFinalizado(v.estado) || !v.fecha_finalizado) return false;
      
      const fechaFinalizacion = new Date(v.fecha_finalizado);
      const cumpleAño = fechaFinalizacion.getFullYear() === añoSeleccionado;
      
      // Si hay un taller seleccionado, filtrar por workshop_id
      if (tallerSeleccionado) {
        return cumpleAño && v.workshop_id === tallerSeleccionado;
      }
      
      return cumpleAño;
    });
    
    // Agrupar por mes
    valoracionesAñoActual.forEach(v => {
      const fechaFinalizacion = new Date(v.fecha_finalizado!);
      const mes = fechaFinalizacion.getMonth(); // 0-based index
      mesesInicializados[mes].cantidad += 1;
    });
    
    // Filtrar solo los meses que tienen valoraciones para mostrar
    return mesesInicializados.filter(m => m.cantidad > 0);
  }, [valoraciones, añoSeleccionado, tallerSeleccionado]);
  
  // Solo mostrar este componente para usuarios SUPER_ADMIN
  if (userProfile?.role !== 'SUPER_ADMIN') {
    return null;
  }
  
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-slate-200 dark:bg-slate-700 h-10 w-10"></div>
          <div className="flex-1 space-y-6 py-1">
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded col-span-2"></div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded col-span-1"></div>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (añosDisponibles.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="text-center py-4">
          <ChartBarIcon className="h-10 w-10 mx-auto text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay valoraciones finalizadas</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            No hay datos disponibles para mostrar estadísticas.
          </p>
        </div>
      </div>
    );
  }
  
  // Función auxiliar para obtener el nombre del taller seleccionado
  const obtenerNombreTallerSeleccionado = (): string => {
    if (!tallerSeleccionado) return '';
    const taller = talleres.find(t => t.id === tallerSeleccionado);
    return taller ? taller.nombre : '';
  };
  
  const nombreTallerSeleccionado = obtenerNombreTallerSeleccionado();
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Resumen Valoraciones Finalizadas</h3>
        <div className="flex space-x-2">
          <select
            className="bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-md py-1 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            value={tallerSeleccionado || ""}
            onChange={(e) => {
              const tallerId = e.target.value;
              setTallerSeleccionado(tallerId === "" ? null : tallerId);
            }}
          >
            <option value="">Todos los talleres</option>
            {talleres.map(taller => (
              <option key={taller.id.toString()} value={taller.id}>{taller.nombre}</option>
            ))}
          </select>
          
          <select
            className="bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-md py-1 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            value={añoSeleccionado}
            onChange={(e) => setAñoSeleccionado(parseInt(e.target.value))}
          >
            {añosDisponibles.map(año => (
              <option key={año} value={año}>{año}</option>
            ))}
          </select>
        </div>
      </div>
      
      {valoracionesPorMes.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Mes
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Valoraciones Finalizadas
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
              {valoracionesPorMes.map((item) => (
                <tr key={item.mes} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {item.nombreMes}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <div className="flex items-center">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold mr-2">{item.cantidad}</span>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min(100, (item.cantidad / Math.max(...valoracionesPorMes.map(v => v.cantidad))) * 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No hay valoraciones finalizadas {nombreTallerSeleccionado ? `para el taller ${nombreTallerSeleccionado}` : ''} en el año {añoSeleccionado}.
          </p>
        </div>
      )}
      
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-right">
        Total: {valoracionesPorMes.reduce((acc, item) => acc + item.cantidad, 0)} valoraciones finalizadas 
        {nombreTallerSeleccionado ? ` en ${nombreTallerSeleccionado}` : ''} en {añoSeleccionado}
      </div>
    </div>
  );
};

export default ResumenValoracionesFinalizadas; 