'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  ValoracionesKanban, 
  ValoracionesLista,
  FormularioNuevaValoracion, 
  VistaDetalleValoracion,
  FiltrosValoraciones, 
  FiltrosValoracionesState,
  SelectorVista,
  TipoVista,
  ResumenValoracionesFinalizadas
} from '@/components/Valoraciones';
import { Valoracion as ValoracionUI } from '@/components/Valoraciones/types';
import { 
  ChartBarIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  ClipboardDocumentCheckIcon,
  PlusIcon,
  ClipboardIcon
} from '@heroicons/react/24/outline';
// Importamos el hook de valoraciones
import { useValoraciones, Valoracion as ValoracionBD } from '@/hooks/useValoraciones';
import { useSupabaseData } from '@/hooks/useSupabaseData';

export default function ValoracionesPage() {
  const [modalNuevaValoracion, setModalNuevaValoracion] = useState(false);
  const [valoracionSeleccionada, setValoracionSeleccionada] = useState<ValoracionUI | null>(null);
  const [valoracionesFiltradas, setValoracionesFiltradas] = useState<ValoracionUI[]>([]);
  const [filtrosActivos, setFiltrosActivos] = useState<FiltrosValoracionesState>({
    matricula: '',
    tipoPoliza: '',
    aseguradora: '',
    fechaDesde: '',
    fechaHasta: '',
    estado: '',
    taller: null
  });
  const [tipoVista, setTipoVista] = useState<TipoVista>('kanban');
  const [valoracionesUI, setValoracionesUI] = useState<ValoracionUI[]>([]);
  
  // Utilizamos el hook para obtener las valoraciones
  const { 
    valoraciones: valoracionesBD, 
    loading, 
    error, 
    actualizarEstadoValoracion,
    fetchValoraciones,
    obtenerValoracion
  } = useValoraciones();

  const { userProfile } = useSupabaseData();

  // Función para transformar el formato de valoración de BD a UI
  const transformarValoracionParaUI = useCallback((valoracionBD: ValoracionBD): ValoracionUI => {
    // Normalizar el estado para asegurar que coincide con los valores esperados
    let estadoNormalizado: 'pendiente' | 'en_curso' | 'finalizado' = 'pendiente';
    
    if (valoracionBD.estado) {
      // Convertir a minúsculas y eliminar espacios
      const estadoLower = valoracionBD.estado.toLowerCase().trim();
      
      // Normalizar el valor según lo que venga de la base de datos
      if (estadoLower === 'finalizado' || estadoLower === 'completado' || estadoLower === 'terminado') {
        estadoNormalizado = 'finalizado';
      } else if (estadoLower === 'en_curso' || estadoLower === 'en curso' || estadoLower === 'proceso' || estadoLower === 'en proceso') {
        estadoNormalizado = 'en_curso';
      } else {
        estadoNormalizado = 'pendiente';
      }
    }
    
    // Formatear la fecha de primera matriculación correctamente
    let fechaFormateada = '';
    if (valoracionBD.fecha_primera_matriculacion) {
      try {
        // Intentar crear una fecha válida
        const fecha = new Date(valoracionBD.fecha_primera_matriculacion);
        
        // Verificar que la fecha es válida
        if (!isNaN(fecha.getTime())) {
          // Formato YYYY-MM-DD para input type="date"
          fechaFormateada = fecha.toISOString().split('T')[0];
        } else {
          console.warn('Fecha inválida en BD:', valoracionBD.fecha_primera_matriculacion, 'para valoración:', valoracionBD.id);
        }
      } catch (error) {
        console.error('Error al formatear fecha de primera matriculación:', valoracionBD.fecha_primera_matriculacion, error);
      }
    }
    
    return {
      id: valoracionBD.id,
      matricula: valoracionBD.matricula,
      chasis: valoracionBD.chasis,
      motorizacion: valoracionBD.motorizacion,
      tipoPoliza: valoracionBD.tipo_poliza || '',
      aseguradora: valoracionBD.aseguradora || '',
      fechaPrimeraMatriculacion: fechaFormateada,
      fotos: [], // No tenemos fotos en la BD por ahora
      estado: estadoNormalizado,
      esSiniestroTotal: valoracionBD.siniestro_total,
      fecha_creacion: valoracionBD.fecha_creacion || new Date().toISOString(),
      fecha_ult_act: valoracionBD.fecha_ult_act || undefined,
      fecha_finalizado: valoracionBD.fecha_finalizado || undefined
    };
  }, []);

  // Transformamos las valoraciones cuando cambian los datos de la BD
  useEffect(() => {
    if (valoracionesBD && valoracionesBD.length > 0) {
      const valoracionesTransformadas = valoracionesBD.map(transformarValoracionParaUI);
      setValoracionesUI(valoracionesTransformadas);
    } else {
      setValoracionesUI([]);
    }
  }, [valoracionesBD, transformarValoracionParaUI]);

  // Aplicar los filtros cuando cambien
  useEffect(() => {
    let resultado = valoracionesUI;
    
    // Filtro por taller
    if (filtrosActivos.taller) {
      // Método seguro: pre-filtrar los IDs de las valoraciones por workshop_id
      const idsValoracionesFiltradas = valoracionesBD
        .filter(v => {
          // Comprobar si workshop_id coincide con el filtro, intentando tanto con string como con number
          // En algunos casos puede ser UUID (string) y en otros number, por lo que probamos ambas conversiones
          const tallerFiltroStr = String(filtrosActivos.taller);
          const tallerFiltroNum = Number(filtrosActivos.taller);
          const workshopIdStr = v.workshop_id !== null ? String(v.workshop_id) : '';
          const workshopIdNum = v.workshop_id !== null ? Number(v.workshop_id) : NaN;
          
          // Comparamos ambos formatos para cubrir todos los casos posibles
          const coincideStr = workshopIdStr === tallerFiltroStr;
          const coincideNum = !isNaN(workshopIdNum) && !isNaN(tallerFiltroNum) && workshopIdNum === tallerFiltroNum;
          const coincide = coincideStr || coincideNum;
          
          return coincide;
        })
        .map(v => v.id);
      
      // Filtrar las valoraciones UI usando los IDs filtrados
      resultado = resultado.filter(v => idsValoracionesFiltradas.includes(v.id));
    }
    
    // Filtro por matrícula
    if (filtrosActivos.matricula) {
      resultado = resultado.filter(v => 
        v.matricula.toLowerCase().includes(filtrosActivos.matricula.toLowerCase())
      );
    }
    
    // Filtro por tipo de póliza
    if (filtrosActivos.tipoPoliza) {
      resultado = resultado.filter(v => 
        v.tipoPoliza === filtrosActivos.tipoPoliza
      );
    }
    
    // Filtro por aseguradora
    if (filtrosActivos.aseguradora) {
      resultado = resultado.filter(v => 
        v.aseguradora.toLowerCase().includes(filtrosActivos.aseguradora.toLowerCase())
      );
    }
    
    // Filtro por fecha desde
    if (filtrosActivos.fechaDesde) {
      try {
        const fechaDesde = new Date(filtrosActivos.fechaDesde);
        
        // Comprobar que la fecha es válida
        if (isNaN(fechaDesde.getTime())) {
          console.error('Fecha desde inválida:', filtrosActivos.fechaDesde);
        } else {
          resultado = resultado.filter(v => {
            // Verificar que la fecha de matriculación existe y es válida
            if (!v.fechaPrimeraMatriculacion) return false;
            
            try {
              // Asegurarnos de que es una fecha válida
              const fechaMatriculacion = new Date(v.fechaPrimeraMatriculacion);
              
              if (isNaN(fechaMatriculacion.getTime())) {
                console.warn('Fecha de matriculación inválida:', v.fechaPrimeraMatriculacion, 'para valoración:', v.id);
                return false;
              }
              
              // Comparar solo las fechas sin la hora
              const fechaDesdeSoloFecha = new Date(fechaDesde.getFullYear(), fechaDesde.getMonth(), fechaDesde.getDate());
              const fechaMatriculacionSoloFecha = new Date(fechaMatriculacion.getFullYear(), fechaMatriculacion.getMonth(), fechaMatriculacion.getDate());
              
              return fechaMatriculacionSoloFecha >= fechaDesdeSoloFecha;
            } catch (error) {
              console.error('Error al procesar fecha de matriculación:', v.fechaPrimeraMatriculacion, error);
              return false;
            }
          });
        }
      } catch (error) {
        console.error('Error al procesar fecha desde:', filtrosActivos.fechaDesde, error);
      }
    }
    
    // Filtro por fecha hasta
    if (filtrosActivos.fechaHasta) {
      try {
        const fechaHasta = new Date(filtrosActivos.fechaHasta);
        
        // Comprobar que la fecha es válida
        if (isNaN(fechaHasta.getTime())) {
          console.error('Fecha hasta inválida:', filtrosActivos.fechaHasta);
        } else {
          resultado = resultado.filter(v => {
            // Verificar que la fecha de matriculación existe y es válida
            if (!v.fechaPrimeraMatriculacion) return false;
            
            try {
              // Asegurarnos de que es una fecha válida
              const fechaMatriculacion = new Date(v.fechaPrimeraMatriculacion);
              
              if (isNaN(fechaMatriculacion.getTime())) {
                console.warn('Fecha de matriculación inválida:', v.fechaPrimeraMatriculacion, 'para valoración:', v.id);
                return false;
              }
              
              // Comparar solo las fechas sin la hora
              const fechaHastaSoloFecha = new Date(fechaHasta.getFullYear(), fechaHasta.getMonth(), fechaHasta.getDate());
              // Asegurarnos de que la fecha hasta incluya el día completo
              fechaHastaSoloFecha.setHours(23, 59, 59, 999);
              
              const fechaMatriculacionSoloFecha = new Date(fechaMatriculacion.getFullYear(), fechaMatriculacion.getMonth(), fechaMatriculacion.getDate());
              
              return fechaMatriculacionSoloFecha <= fechaHastaSoloFecha;
            } catch (error) {
              console.error('Error al procesar fecha de matriculación:', v.fechaPrimeraMatriculacion, error);
              return false;
            }
          });
        }
      } catch (error) {
        console.error('Error al procesar fecha hasta:', filtrosActivos.fechaHasta, error);
      }
    }
    
    // Filtro por estado
    if (filtrosActivos.estado) {
      resultado = resultado.filter(v => 
        v.estado === filtrosActivos.estado
      );
    }
    setValoracionesFiltradas(resultado);
  }, [filtrosActivos, valoracionesBD, valoracionesUI]);

  // Función para manejar la adición de una nueva valoración
  const handleAgregarValoracion = async () => {
    // La lógica de guardado de la valoración ahora se maneja directamente en el componente FormularioNuevaValoracion
    // que utiliza el hook useValoraciones. Aquí solo actualizamos la UI si es necesario.
    
    // No hacemos nada más aquí ya que la valoración ya se añadió a la BD
    // y el hook fetchValoraciones se encargará de actualizar el estado
    
    // Forzamos una recarga de las valoraciones para asegurarnos de tener las más recientes
    fetchValoraciones();
  };

  const handleValoracionClick = async (id: string) => {
    try {
      // Obtener la valoración completa desde la API
      const resultado = await obtenerValoracion(id);
      
      if (resultado.success && resultado.data) {
        // Usamos los datos actualizados de la API que incluyen valorador_id
        setValoracionSeleccionada(resultado.data);
      } else {
        // Si hay un error, intentamos usar los datos en caché
        console.warn('No se pudo obtener la valoración desde la API, usando datos en caché:', resultado.error);
        const valoracion = valoracionesUI.find(v => v.id === id);
        if (valoracion) {
          setValoracionSeleccionada(valoracion);
        }
      }
    } catch (error) {
      console.error('Error al obtener valoración para detalle:', error);
      // Intentamos usar los datos en caché como fallback
      const valoracion = valoracionesUI.find(v => v.id === id);
      if (valoracion) {
        setValoracionSeleccionada(valoracion);
      }
    }
  };
  
  const handleFiltrosChange = (filtros: FiltrosValoracionesState) => {
    setFiltrosActivos(filtros);
  };
  
  const handleCambioVista = (vista: TipoVista) => {
    setTipoVista(vista);
  };

  // Función para actualizar el estado de una valoración
  const handleEstadoChange = async (id: string, nuevoEstado: 'pendiente' | 'en_curso' | 'finalizado') => {
    const resultado = await actualizarEstadoValoracion(id, nuevoEstado);
    
    if (!resultado.success) {
      // Aquí se podría mostrar un mensaje de error
      console.error('Error al actualizar estado:', resultado.error);
    }
  };

  // Mostrar un indicador de carga mientras se obtienen los datos
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-700 dark:text-gray-300">Cargando valoraciones...</p>
        </div>
      </div>
    );
  }

  // Mostrar un mensaje de error si hay algún problema
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">Error al cargar datos</h2>
          <p className="text-gray-700 dark:text-gray-300">{error}</p>
          <button 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-4 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Valoraciones</h1>
          <button
            onClick={() => setModalNuevaValoracion(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors duration-200 flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-1" />
            Nueva Valoración
          </button>
        </div>
        
        {/* Panel de KPIs */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200 hover:shadow-md hover:translate-y-[-2px]">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 dark:bg-blue-600 rounded-full p-2">
                  <ChartBarIcon className="h-5 w-5 text-white" />
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Valoraciones Año</dt>
                    <dd className="flex items-baseline mt-1">
                      <div className="text-xl font-semibold text-blue-700 dark:text-blue-300">
                        {valoracionesUI.filter(v => {
                          // Filtrar por año actual
                          const fechaCreacion = new Date(v.fecha_creacion);
                          const añoActual = new Date().getFullYear();
                          return fechaCreacion.getFullYear() === añoActual;
                        }).length}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="h-1 bg-blue-500 dark:bg-blue-600"></div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200 hover:shadow-md hover:translate-y-[-2px]">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-emerald-500 dark:bg-emerald-600 rounded-full p-2">
                  <CheckCircleIcon className="h-5 w-5 text-white" />
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Finalizadas</dt>
                    <dd className="flex items-baseline mt-1">
                      <div className="text-xl font-semibold text-emerald-700 dark:text-emerald-300">
                        {valoracionesUI.filter(v => v.estado === 'finalizado').length}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="h-1 bg-emerald-500 dark:bg-emerald-600"></div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200 hover:shadow-md hover:translate-y-[-2px]">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-500 dark:bg-yellow-600 rounded-full p-2">
                  <ClipboardDocumentCheckIcon className="h-5 w-5 text-white" />
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">En Curso</dt>
                    <dd className="flex items-baseline mt-1">
                      <div className="text-xl font-semibold text-yellow-700 dark:text-yellow-300">
                        {valoracionesUI.filter(v => v.estado === 'en_curso').length}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="h-1 bg-yellow-500 dark:bg-yellow-600"></div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200 hover:shadow-md hover:translate-y-[-2px]">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-500 dark:bg-red-600 rounded-full p-2">
                  <ClockIcon className="h-5 w-5 text-white" />
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Pendientes</dt>
                    <dd className="flex items-baseline mt-1">
                      <div className="text-xl font-semibold text-red-700 dark:text-red-300">
                        {valoracionesUI.filter(v => v.estado === 'pendiente').length}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="h-1 bg-red-500 dark:bg-red-600"></div>
          </div>
        </div>
        
        {/* Componente ResumenValoracionesFinalizadas para SUPER_ADMIN */}
        <ResumenValoracionesFinalizadas />
        
        {/* Componente de Filtros */}
        <div className="mb-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <FiltrosValoraciones onFiltrosChange={handleFiltrosChange} />
        </div>
        
        {/* Contenedor para estadísticas y selector de vista */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6 transition-shadow duration-200 hover:shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <div className="flex items-center mb-4 sm:mb-0">
              <span className="mr-2">
                <ClipboardIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </span>
              <div className="text-sm">
                <span className="text-gray-500 dark:text-gray-400">Mostrando </span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{valoracionesFiltradas.length}</span>
                <span className="text-gray-500 dark:text-gray-400"> de </span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{valoracionesUI.length}</span>
                <span className="text-gray-500 dark:text-gray-400"> valoraciones</span>
              </div>
            </div>
            
            {/* Selector de vista */}
            <SelectorVista vista={tipoVista} onCambioVista={handleCambioVista} />
          </div>
        </div>
        
        {/* Contenedor principal de valoraciones */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 min-h-[500px]">
          {tipoVista === 'kanban' ? (
            <ValoracionesKanban 
              valoraciones={valoracionesFiltradas}
              onValoracionClick={handleValoracionClick}
              onEstadoChange={handleEstadoChange}
            />
          ) : (
            <ValoracionesLista 
              valoraciones={valoracionesFiltradas}
              onValoracionClick={handleValoracionClick}
            />
          )}
        </div>
      </div>
      
      {/* Modal para crear nueva valoración */}
      {modalNuevaValoracion && (
        <FormularioNuevaValoracion
          open={modalNuevaValoracion}
          onClose={() => setModalNuevaValoracion(false)}
          onGuardar={handleAgregarValoracion}
        />
      )}
      
      {/* Vista detalle de valoración */}
      {valoracionSeleccionada && (
        <VistaDetalleValoracion
          valoracion={valoracionSeleccionada}
          open={!!valoracionSeleccionada}
          onClose={() => {
            // Forzar una recarga de las valoraciones al cerrar el modal
            // para asegurar que los datos están sincronizados
            fetchValoraciones();
            setValoracionSeleccionada(null);
          }}
          onEstadoChange={(nuevoEstado) => {
            handleEstadoChange(valoracionSeleccionada.id, nuevoEstado);
            setValoracionSeleccionada({
              ...valoracionSeleccionada,
              estado: nuevoEstado
            });
          }}
          userRole={userProfile?.role || undefined}
        />
      )}
    </div>
  );
} 