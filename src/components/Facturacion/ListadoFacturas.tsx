import React, { useState, useEffect } from 'react';
import { useFacturacion, FacturaFormateada } from '@/hooks/useFacturacion';
import { DetalleFactura } from './DetalleFactura';
import { FiltrosFacturasState } from './FiltroFacturas';
import { 
  EyeIcon, 
  FolderArrowDownIcon, 
  CheckCircleIcon,
  ExclamationCircleIcon,
  XMarkIcon,
  DocumentTextIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import supabase, { testSupabaseConnection } from '@/lib/supabase';
import { FacturaPDFDownload } from './FacturaPDF';

interface ListadoFacturasProps {
  facturas?: FacturaFormateada[];
  filtrosActivos?: FiltrosFacturasState;
}

export const ListadoFacturas = ({ facturas: facturasProp, filtrosActivos }: ListadoFacturasProps) => {
  const { facturas: facturasHook, loading, error, recargarFacturas } = useFacturacion();
  const [filteredFacturas, setFilteredFacturas] = useState<FacturaFormateada[]>([]);
  
  // Estado para manejar la visualización del detalle de factura en modal
  const [selectedFacturaId, setSelectedFacturaId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [facturaDetalles, setFacturaDetalles] = useState<any>(null);
  const [clienteDetalles, setClienteDetalles] = useState<any>(null);
  const [tallerDetalles, setTallerDetalles] = useState<any>(null);
  const [itemsFactura, setItemsFactura] = useState<any[]>([]);
  const [cargandoDetalles, setCargandoDetalles] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ ok: boolean; message: string } | null>(null);

  // Verificar la conexión a Supabase al cargar el componente
  useEffect(() => {
    const checkConnection = async () => {
      const status = await testSupabaseConnection();
      setConnectionStatus(status);
    };
    
    checkConnection();
  }, []);

  // Obtener las facturas a usar (de props o del hook)
  const facturasBase = facturasProp ?? facturasHook;

  // Aplicar filtros cuando cambian las facturas o los criterios de búsqueda
  useEffect(() => {
    let result = [...facturasBase];
    
    // Si hay filtros activos, aplicarlos
    if (filtrosActivos) {
      // Filtrar por cliente (usando ID)
      if (filtrosActivos.cliente) {
        result = result.filter(factura => 
          factura.clienteId === filtrosActivos.cliente
        );
      }
      
      // Filtrar por concepto
      if (filtrosActivos.concepto) {
        result = result.filter(factura => 
          factura.concepto && factura.concepto.toLowerCase().includes(filtrosActivos.concepto.toLowerCase())
        );
      }
      
      // Filtrar por fecha desde
      if (filtrosActivos.fechaDesde) {
        const fechaDesde = new Date(filtrosActivos.fechaDesde);
        result = result.filter(factura => {
          const fechaFactura = new Date(factura.fechaEmision);
          return fechaFactura >= fechaDesde;
        });
      }
      
      // Filtrar por fecha hasta
      if (filtrosActivos.fechaHasta) {
        const fechaHasta = new Date(filtrosActivos.fechaHasta);
        fechaHasta.setHours(23, 59, 59, 999); // Fin del día
        result = result.filter(factura => {
          const fechaFactura = new Date(factura.fechaEmision);
          return fechaFactura <= fechaHasta;
        });
      }
      
      // Filtrar por estado de cobro
      if (filtrosActivos.estadoCobro !== '' && filtrosActivos.estadoCobro !== undefined) {
        const estadoCobro = filtrosActivos.estadoCobro === 'true';
        result = result.filter(factura => factura.estadoCobro === estadoCobro);
      }
    }
    
    setFilteredFacturas(result);
  }, [facturasBase, filtrosActivos]);

  // Efecto para bloquear el scroll cuando el modal está abierto
  useEffect(() => {
    if (modalVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [modalVisible]);

  // Efecto para escuchar el evento de actualización de facturas
  useEffect(() => {
    // Función para manejar el evento de actualización de facturas
    const handleFacturaActualizada = (event: Event) => {
      const customEvent = event as CustomEvent;
      
      // Si el evento tiene datos específicos de la factura actualizada
      if (customEvent.detail) {
        const { facturaId, nuevoEstado, accion, factura: facturaData } = customEvent.detail;
        
        // Si es una actualización de estado de cobro, actualizar localmente esa factura específica
        if (accion === 'estadoCobro' && facturaId) {
          setFilteredFacturas(prev => 
            prev.map(factura => 
              factura.id === facturaId 
                ? { ...factura, estadoCobro: nuevoEstado } 
                : factura
            )
          );
          
          // También actualizar en facturasBase si es necesario
          if (facturasProp) {
            const facturaActualizada = facturasProp.find(f => f.id === facturaId);
            if (facturaActualizada) {
              facturaActualizada.estadoCobro = nuevoEstado;
            }
          }
        } else {
          // Para otros tipos de actualizaciones, recargar todas las facturas
          recargarFacturas(true);
        }
      } else {
        // Si no hay detalles específicos, hacer una recarga completa como antes
        recargarFacturas(true);
      }
    };

    // Añadir listener para el evento personalizado
    window.addEventListener('facturaActualizada', handleFacturaActualizada);

    // Limpiar el listener cuando el componente se desmonte
    return () => {
      window.removeEventListener('facturaActualizada', handleFacturaActualizada);
    };
  }, [recargarFacturas, facturasProp]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };
  
  const handleVerFactura = (id: string) => {
    console.log('Intentando ver factura con ID:', id);
    setSelectedFacturaId(id);
    setModalVisible(true);
  };

  // Función para cargar los detalles de una factura para generar PDF
  const cargarDetallesFactura = async (facturaId: string) => {
    try {
      setCargandoDetalles(true);
      console.log('Cargando detalles para PDF de factura:', facturaId);

      // 1. Cargar información básica de la factura
      const { data: facturaData, error: facturaError } = await supabase
        .from('facturas')
        .select('*')
        .eq('id', facturaId)
        .single();

      if (facturaError || !facturaData) {
        console.error('Error al cargar la factura:', facturaError);
        return false;
      }

      console.log('Datos de factura obtenidos para PDF:', facturaData);

      // 2. Cargar datos del cliente
      const { data: clienteData, error: clienteError } = await supabase
        .from('clientes')
        .select('id, nombre, apellido, razon_social, nif_cif, direccion, email, telefono')
        .eq('id', facturaData.cliente_id)
        .single();

      if (clienteError || !clienteData) {
        console.error('Error al cargar el cliente:', clienteError);
        return false;
      }

      console.log('Datos de cliente obtenidos para PDF:', clienteData);

      // 3. Cargar datos del taller
      const { data: tallerData, error: tallerError } = await supabase
        .from('workshops')
        .select('id, nombre_comercial, razon_social, cif_nif, direccion, codigo_postal, ciudad, provincia, email_taller, telefono_movil')
        .eq('id', facturaData.workshop_id)
        .single();

      if (tallerError || !tallerData) {
        console.error('Error al cargar el taller:', tallerError);
        return false;
      }

      console.log('Datos de taller obtenidos para PDF:', tallerData);

      // 4. Cargar items de la factura
      const { data: itemsData, error: itemsError } = await supabase
        .from('items_facturas')
        .select('*')
        .eq('factura_id', facturaId);

      if (itemsError || !itemsData) {
        console.error('Error al cargar los items:', itemsError);
        return false;
      }

      console.log('Items de factura obtenidos para PDF:', itemsData.length);

      // Guardar los datos
      setFacturaDetalles(facturaData);
      setClienteDetalles(clienteData);
      setTallerDetalles(tallerData);
      setItemsFactura(itemsData);
      
      setCargandoDetalles(false);
      return true;
    } catch (error) {
      console.error('Error al cargar detalles de factura para PDF:', error);
      setCargandoDetalles(false);
      return false;
    }
  };
  
  const handleDescargarPDF = async (factura: FacturaFormateada) => {
    try {
      if (factura.url_pdf) {
        // Es una factura adjuntada, descargar desde Supabase
        const { data, error } = await supabase.storage
          .from('facturas')
          .download(factura.url_pdf);
        
        if (error) {
          console.error('Error al descargar PDF:', error);
          alert('Error al descargar el PDF');
          return;
        }

        // Crear URL para el archivo descargado
        const url = URL.createObjectURL(data);
        
        // Crear un enlace temporal y hacer clic en él para descargar
        const a = document.createElement('a');
        a.href = url;
        a.download = `Factura-${factura.numeroFactura}.pdf`;
        document.body.appendChild(a);
        a.click();
        
        // Limpiar
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else if (factura.tipo === 'Generada') {
        // Es una factura generada, cargar los datos para generar el PDF
        const detallesOk = await cargarDetallesFactura(factura.id);
        if (!detallesOk) {
          console.error('No se pudieron cargar los datos para generar el PDF');
          alert('Error al generar el PDF. Por favor, intente desde la vista de detalles.');
          handleVerFactura(factura.id);
        }
      }
    } catch (error) {
      console.error('Error en la descarga del PDF:', error);
      alert('Error al procesar el PDF');
    }
  };
  
  const handleCerrarModal = () => {
    setModalVisible(false);
    
    // Esperamos a que termine la animación de cierre antes de limpiar el estado
    setTimeout(() => {
      setSelectedFacturaId(null);
    }, 300);
  };

  // Preparar los datos para el componente PDF
  const prepararFacturaPDFData = () => {
    if (!facturaDetalles) return {
      id: '',
      numero_factura: '',
      fecha_emision: '',
      concepto: '',
      metodo_pago: '',
      observaciones: '',
      base_imponible: 0,
      iva_total: 0,
      total_factura: 0,
      estado_cobro: false
    };
    
    return {
      id: facturaDetalles.id,
      numero_factura: facturaDetalles.numero_factura,
      fecha_emision: facturaDetalles.fecha_emision,
      concepto: facturaDetalles.concepto,
      metodo_pago: facturaDetalles.metodo_pago,
      observaciones: facturaDetalles.observaciones,
      base_imponible: facturaDetalles.base_imponible,
      iva_total: facturaDetalles.iva_total,
      total_factura: facturaDetalles.total_factura,
      estado_cobro: facturaDetalles.estado_cobro
    };
  };

  // Si hay un error de conexión con Supabase, mostrarlo prominentemente
  if (connectionStatus && !connectionStatus.ok) {
    return (
      <div className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-md mb-4">
        <p className="flex items-center font-medium">
          <ExclamationCircleIcon className="h-5 w-5 mr-2" />
          Error de conexión con la base de datos
        </p>
        <p className="mt-2 pl-7">
          {connectionStatus.message}
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-3 ml-7 bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded text-sm"
        >
          Reintentar conexión
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 relative w-full">
      {loading ? (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-md">
          <p className="flex items-center">
            <ExclamationCircleIcon className="h-5 w-5 mr-2" />
            {error}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="min-w-full table-fixed divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[15%]">
                  Número
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[20%]">
                  Cliente
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[25%]">
                  Concepto
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[10%]">
                  Importe
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[10%]">
                  Fecha
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[10%]">
                  Estado
                </th>
                <th scope="col" className="relative px-4 py-3 w-[10%]">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredFacturas.length > 0 ? (
                filteredFacturas.map((factura) => (
                  <tr 
                    key={factura.id} 
                    className="hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer"
                    onClick={() => handleVerFactura(factura.id)}
                  >
                    <td className="px-4 py-4 text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                      <div className="font-medium text-gray-900 dark:text-white">{factura.numeroFactura}</div>
                    </td>
                    <td className="px-4 py-4 text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                      <div className="font-medium text-gray-900 dark:text-white">{factura.cliente}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400 overflow-hidden text-ellipsis">
                      {factura.concepto || (factura.tipo === 'Adjuntada' ? 'Factura Adjuntada' : '')}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                      {typeof factura.importe !== 'undefined' ? formatCurrency(factura.importe) : '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(factura.fechaEmision)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {factura.estadoCobro ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                          Cobrada
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-row justify-end space-x-2 flex-nowrap">
                        <button
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 inline-flex items-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVerFactura(factura.id);
                          }}
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          <span>Ver</span>
                        </button>
                        
                        {/* Botón de PDF para todas las facturas */}
                        {factura.url_pdf ? (
                          <button
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 inline-flex items-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDescargarPDF(factura);
                            }}
                          >
                            <FolderArrowDownIcon className="h-4 w-4 mr-1" />
                            <span>PDF</span>
                          </button>
                        ) : factura.tipo === 'Generada' && facturaDetalles && facturaDetalles.id === factura.id ? (
                          // Mostrar componente FacturaPDFDownload si ya tenemos los datos cargados
                          <FacturaPDFDownload
                            factura={prepararFacturaPDFData()}
                            cliente={clienteDetalles || {}}
                            taller={tallerDetalles || {}}
                            items={itemsFactura || []}
                            fileName={`Factura-${factura.numeroFactura}.pdf`}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 inline-flex items-center"
                          >
                            <DocumentTextIcon className="h-4 w-4 mr-1" />
                            <span>PDF</span>
                          </FacturaPDFDownload>
                        ) : (
                          <button
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 inline-flex items-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDescargarPDF(factura);
                            }}
                          >
                            <DocumentTextIcon className="h-4 w-4 mr-1" />
                            <span>{cargandoDetalles && selectedFacturaId === factura.id ? 'Cargando...' : 'PDF'}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    {filtrosActivos && (filtrosActivos.cliente || filtrosActivos.concepto || filtrosActivos.fechaDesde || filtrosActivos.fechaHasta || filtrosActivos.estadoCobro)
                      ? 'No se encontraron facturas que coincidan con los criterios de búsqueda.' 
                      : 'No hay facturas disponibles.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Modal para mostrar el detalle de factura */}
      {modalVisible && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true"  style={{zIndex: 9999}}>
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Fondo oscuro con animación de desvanecimiento */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-80 transition-opacity" 
              aria-hidden="true"
              onClick={handleCerrarModal}
              style={{zIndex: 9998}}
            ></div>
            
            {/* Centrar el modal */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            {/* Contenido del modal con animación de deslizamiento */}
            <div 
              className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:w-full md:max-w-5xl"
              style={{zIndex: 9999, position: 'relative'}}
            >
              {/* Cabecera del modal con título y botón para cerrar */}
              <div className="bg-gray-50 dark:bg-slate-700 px-4 py-2 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Detalle de Factura
                </h3>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-100"
                  onClick={handleCerrarModal}
                >
                  <span className="sr-only">Cerrar</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              
              {/* Contenido del detalle de factura */}
              <div className="bg-white dark:bg-slate-800 p-6">
                {selectedFacturaId ? (
                  <DetalleFactura facturaId={selectedFacturaId} onVolver={handleCerrarModal} />
                ) : (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                    <p className="text-yellow-700 dark:text-yellow-400">
                      Error: No se pudo obtener el ID de la factura para mostrar el detalle.
                    </p>
                    <button 
                      onClick={handleCerrarModal}
                      className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <ArrowLeftIcon className="h-4 w-4 mr-1" />
                      Cerrar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 