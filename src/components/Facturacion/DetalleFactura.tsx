import React, { useState, useEffect } from 'react';
import { useFacturacion } from '@/hooks/useFacturacion';
import supabase from '@/lib/supabase';
import { 
  ArrowLeftIcon, 
  PrinterIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentArrowDownIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
import { Spinner } from '../UI/Spinner';
import { FacturaPDFDownload } from './FacturaPDF';
import { toast } from 'react-hot-toast';
import { BanknotesIcon } from '@heroicons/react/24/solid';

interface ItemFacturaDetalle {
  id: string;
  factura_id: string;
  tipo: string;
  descripcion: string;
  precio_uni: number;
  cantidad: number;
  descuento: number;
  iva: number;
  importe_total: number;
}

interface ClienteFactura {
  id: string;
  nombre: string;
  apellido: string;
  razon_social: string | null;
  nif_cif: string;
  direccion: string | null;
  email: string | null;
  telefono: string | null;
}

interface TallerFactura {
  id: string;
  nombre_comercial: string;
  razon_social: string | null;
  cif_nif: string | null;
  direccion: string | null;
  codigo_postal: string | null;
  ciudad: string | null;
  provincia: string | null;
  email_taller: string | null;
  telefono_movil: string | null;
}

// Interfaz para la factura usada en este componente
interface FacturaDetalle {
  id: string;
  numeroFactura: string;
  fechaEmision: string;
  concepto: string;
  metodoPago: string;
  observaciones?: string;
  baseImponible: number;
  ivaTotal: number;
  importe: number;
  estadoCobro: boolean;
  url_pdf?: string;
}

interface DetalleFacturaProps {
  facturaId: string;
  onVolver: () => void;
}

export const DetalleFactura: React.FC<DetalleFacturaProps> = ({ 
  facturaId, 
  onVolver
}) => {
  const { actualizarEstadoCobroFactura } = useFacturacion();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [factura, setFactura] = useState<FacturaDetalle | null>(null);
  const [itemsFactura, setItemsFactura] = useState<ItemFacturaDetalle[]>([]);
  const [cliente, setCliente] = useState<ClienteFactura | null>(null);
  const [taller, setTaller] = useState<TallerFactura | null>(null);
  const [actualizandoEstado, setActualizandoEstado] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Formatear moneda a euros
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  };

  // Descargar PDF de la factura
  const handleDescargarPDF = async () => {
    if (!factura?.url_pdf) {
      alert('Esta factura no tiene un PDF asociado');
      return;
    }

    try {
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
    } catch (error: unknown) {
      console.error('Error en la descarga:', error);
      alert('Error al descargar el PDF');
    }
  };

  // Imprimir factura
  const handleImprimir = () => {
    window.print();
  };

  // Función para marcar la factura como cobrada
  const handleMarcarComoCobrada = async () => {
    if (!factura || factura.estadoCobro) return;
    
    try {
      setActualizandoEstado(true);
      const { success, error } = await actualizarEstadoCobroFactura(factura.id, true);
      
      if (success) {
        // Actualizar el estado local
        setFactura((prev: FacturaDetalle | null) => prev ? { ...prev, estadoCobro: true } : null);
        toast.success('Factura marcada como cobrada');
        
        // Disparar evento personalizado con los datos de la factura actualizada
        window.dispatchEvent(new CustomEvent('facturaActualizada', {
          detail: {
            facturaId: factura.id,
            nuevoEstado: true,
            accion: 'estadoCobro',
            factura: {
              id: factura.id,
              importe: factura.importe,
              fechaEmision: factura.fechaEmision
            }
          }
        }));
        
        // Cerrar el modal después de un tiempo
        setTimeout(() => {
          onVolver();
        }, 3000);
      } else {
        toast.error(`Error al marcar como cobrada: ${error}`);
      }
    } catch (error: unknown) {
      console.error('Error al marcar como cobrada:', error);
      toast.error('Error al marcar como cobrada');
    } finally {
      setActualizandoEstado(false);
    }
  };

  // Función para revertir el cobro de una factura
  const handleRevertirCobro = async () => {
    if (!factura || !factura.estadoCobro) return;
    
    try {
      setActualizandoEstado(true);
      const { success, error } = await actualizarEstadoCobroFactura(factura.id, false);
      
      if (success) {
        // Actualizar el estado local
        setFactura((prev: FacturaDetalle | null) => prev ? { ...prev, estadoCobro: false } : null);
        toast.success('Cobro revertido correctamente');
        
        // Disparar evento personalizado con los datos de la factura actualizada
        window.dispatchEvent(new CustomEvent('facturaActualizada', {
          detail: {
            facturaId: factura.id,
            nuevoEstado: false,
            accion: 'estadoCobro',
            factura: {
              id: factura.id,
              importe: factura.importe,
              fechaEmision: factura.fechaEmision
            }
          }
        }));
        
        // Cerrar el modal después de un tiempo
        setTimeout(() => {
          onVolver();
        }, 3000);
      } else {
        toast.error(`Error al revertir el cobro: ${error}`);
      }
    } catch (error: unknown) {
      console.error('Error al revertir el cobro:', error);
      toast.error('Error al revertir el cobro');
    } finally {
      setActualizandoEstado(false);
    }
  };

  // Efecto para cargar los detalles de la factura
  useEffect(() => {
    const cargarDetallesFactura = async () => {
      try {
        setLoading(true);
        setError(null);
        setDebugInfo('Iniciando carga de detalles...');

        // 1. Cargar información básica de la factura
        const { data: facturaData, error: facturaError } = await supabase
          .from('facturas')
          .select('*')
          .eq('id', facturaId)
          .single();

        if (facturaError) {
          console.error('Error obteniendo factura:', facturaError);
          setDebugInfo(`Error factura: ${facturaError.message}`);
          setError('Error al cargar la factura: ' + facturaError.message);
          setLoading(false);
          return;
        }

        if (!facturaData) {
          console.error('No se encontró la factura con ID:', facturaId);
          setDebugInfo('Factura no encontrada');
          setError('No se encontró la factura solicitada');
          setLoading(false);
          return;
        }

        setDebugInfo('Factura cargada correctamente');
        // Convertir datos de la base de datos al formato para el componente
        setFactura({
          id: facturaData.id,
          numeroFactura: facturaData.numero_factura,
          fechaEmision: facturaData.fecha_emision,
          concepto: facturaData.concepto,
          metodoPago: facturaData.metodo_pago,
          observaciones: facturaData.observaciones,
          baseImponible: facturaData.base_imponible,
          ivaTotal: facturaData.iva_total,
          importe: facturaData.total_factura,
          estadoCobro: facturaData.estado_cobro || false,
          url_pdf: facturaData.url_pdf
        });

        // 2. Cargar datos del cliente
        const { data: clienteData, error: clienteError } = await supabase
          .from('clientes')
          .select('id, nombre, apellido, razon_social, nif_cif, direccion, email, telefono')
          .eq('id', facturaData.cliente_id)
          .single();

        if (clienteError) {
          console.error('Error al cargar el cliente:', clienteError);
          setDebugInfo(prev => `${prev}, Error cliente: ${clienteError.message}`);
          if (clienteError.code !== 'PGRST116') {
            // Solo log, no interrumpimos el flujo
          }
        } else if (clienteData) {
          setDebugInfo(prev => `${prev}, Cliente cargado`);
          setCliente(clienteData);
        } else {
          console.warn('No se encontró información del cliente');
          setDebugInfo(prev => `${prev}, Cliente no encontrado`);
        }

        // 3. Cargar datos del taller
        const { data: tallerData, error: tallerError } = await supabase
          .from('workshops')
          .select('id, nombre_comercial, razon_social, cif_nif, direccion, codigo_postal, ciudad, provincia, email_taller, telefono_movil')
          .eq('id', facturaData.workshop_id)
          .single();

        if (tallerError) {
          console.error('Error al cargar el taller:', tallerError);
          setDebugInfo(prev => `${prev}, Error taller: ${tallerError.message}`);
          if (tallerError.code !== 'PGRST116') {
            // Solo log, no interrumpimos el flujo
          }
        } else if (tallerData) {
          setDebugInfo(prev => `${prev}, Taller cargado`);
          setTaller(tallerData);
        } else {
          console.warn('No se encontró información del taller');
          setDebugInfo(prev => `${prev}, Taller no encontrado`);
        }

        // 4. Cargar items de la factura
        const { data: itemsData, error: itemsError } = await supabase
          .from('items_facturas')
          .select('*')
          .eq('factura_id', facturaId);

        if (itemsError) {
          console.error('Error al cargar los items:', itemsError);
          setDebugInfo(prev => `${prev}, Error items: ${itemsError.message}`);
        } else {
          setDebugInfo(prev => `${prev}, Items cargados: ${itemsData?.length || 0}`);
          setItemsFactura(itemsData || []);
        }

        setLoading(false);
      } catch (error: unknown) {
        console.error('Error general al cargar detalles de factura:', error);
        setDebugInfo(`Error general: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        setError(`Error al cargar los detalles: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        setLoading(false);
      }
    };

    if (facturaId) {
      cargarDetallesFactura();
    }
  }, [facturaId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-6 h-96">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando datos de la factura...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
        <p className="text-red-700 dark:text-red-400 flex items-center">
          <XCircleIcon className="h-5 w-5 mr-2" />
          {error}
        </p>
        <p className="text-red-700 dark:text-red-400 text-sm mt-2">Debug: {debugInfo}</p>
        <button 
          onClick={onVolver}
          className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Volver
        </button>
      </div>
    );
  }

  if (!factura) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md">
        <p className="text-yellow-700 dark:text-yellow-400">
          No se pudieron cargar los datos de la factura.
        </p>
        <p className="text-yellow-700 dark:text-yellow-400 text-sm mt-2">Debug: {debugInfo}</p>
        <button 
          onClick={onVolver}
          className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      {/* Cabecera con información básica */}
      <div className="bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-gray-600 p-6 rounded-t-lg">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <span className="text-indigo-600 dark:text-indigo-400 mr-2">#</span>
          {factura.numeroFactura}
        </h2>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3 bg-white dark:bg-slate-800 rounded-md shadow-sm border border-gray-100 dark:border-gray-700">
            <span className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Fecha emisión</span>
            <p className="font-medium text-gray-900 dark:text-white">{formatDate(factura.fechaEmision)}</p>
          </div>
          <div className="p-3 bg-white dark:bg-slate-800 rounded-md shadow-sm border border-gray-100 dark:border-gray-700">
            <span className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Total factura</span>
            <p className="font-medium text-gray-900 dark:text-white text-lg">{formatCurrency(factura.importe)}</p>
          </div>
          <div className="p-3 bg-white dark:bg-slate-800 rounded-md shadow-sm border border-gray-100 dark:border-gray-700">
            <span className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Estado</span>
            <p className={`font-medium flex items-center ${factura.estadoCobro ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {factura.estadoCobro ? (
                <>
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Cobrada
                </>
              ) : (
                <>
                  <XCircleIcon className="h-4 w-4 mr-1" />
                  Pendiente
                </>
              )}
            </p>
          </div>
          <div className="p-3 bg-white dark:bg-slate-800 rounded-md shadow-sm border border-gray-100 dark:border-gray-700">
            <span className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Método de pago</span>
            <p className="font-medium text-gray-900 dark:text-white flex items-center">
              <CreditCardIcon className="h-4 w-4 mr-1 text-gray-400" />
              {factura.metodoPago}
            </p>
          </div>
        </div>
      </div>
      
      {/* Botones de acción */}
      <div className="px-6 py-4 flex flex-wrap gap-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800">
        <button 
          onClick={onVolver}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Volver
        </button>
        
        <button 
          onClick={handleImprimir}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-150"
        >
          <PrinterIcon className="h-4 w-4 mr-2" />
          Imprimir
        </button>
        
        {factura.url_pdf ? (
          <button 
            onClick={handleDescargarPDF}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            Descargar PDF
          </button>
        ) : factura.concepto === 'Generada' ? (
          <FacturaPDFDownload
            factura={{
              id: factura.id,
              numero_factura: factura.numeroFactura,
              fecha_emision: factura.fechaEmision,
              concepto: factura.concepto,
              metodo_pago: factura.metodoPago || '',
              observaciones: factura.observaciones || '',
              base_imponible: factura.baseImponible || 0,
              iva_total: factura.ivaTotal || 0,
              total_factura: factura.importe,
              estado_cobro: factura.estadoCobro
            }}
            cliente={cliente || {
              id: '',
              nombre: 'Cliente',
              apellido: '',
              razon_social: '',
              nif_cif: '',
              direccion: '',
              email: '',
              telefono: ''
            }}
            taller={taller || {
              id: '',
              nombre_comercial: 'Taller',
              razon_social: null,
              cif_nif: null,
              direccion: null,
              codigo_postal: null,
              ciudad: null,
              provincia: null,
              email_taller: null,
              telefono_movil: null
            }}
            items={itemsFactura}
            fileName={`Factura-${factura.numeroFactura}.pdf`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            Generar PDF
          </FacturaPDFDownload>
        ) : null}
        
        {!factura.estadoCobro ? (
          <button 
            onClick={handleMarcarComoCobrada}
            disabled={actualizandoEstado}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
          >
            <CreditCardIcon className="h-4 w-4 mr-2" />
            {actualizandoEstado ? 'Procesando...' : 'Marcar como Cobrada'}
          </button>
        ) : (
          <button 
            onClick={handleRevertirCobro}
            disabled={actualizandoEstado}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
          >
            <BanknotesIcon className="h-4 w-4 mr-2" />
            {actualizandoEstado ? 'Procesando...' : 'Revertir Cobro'}
          </button>
        )}
      </div>
      
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda */}
        <div className="lg:col-span-2 space-y-6">
          {/* Datos del cliente */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gray-50 dark:bg-slate-700 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">Datos del Cliente</h3>
            </div>
            <div className="p-4">
              <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-3">
                {cliente?.razon_social || `${cliente?.nombre || ''} ${cliente?.apellido || ''}`.trim() || 'Cliente'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-start">
                  <span className="text-gray-500 dark:text-gray-400 text-sm font-medium mr-2 w-24">NIF/CIF:</span>
                  <span className="text-gray-900 dark:text-white">{cliente?.nif_cif || '-'}</span>
                </div>
                {cliente?.direccion && (
                  <div className="flex items-start">
                    <span className="text-gray-500 dark:text-gray-400 text-sm font-medium mr-2 w-24">Dirección:</span>
                    <span className="text-gray-900 dark:text-white">{cliente.direccion}</span>
                  </div>
                )}
                {cliente?.email && (
                  <div className="flex items-start">
                    <span className="text-gray-500 dark:text-gray-400 text-sm font-medium mr-2 w-24">Email:</span>
                    <span className="text-gray-900 dark:text-white">{cliente.email}</span>
                  </div>
                )}
                {cliente?.telefono && (
                  <div className="flex items-start">
                    <span className="text-gray-500 dark:text-gray-400 text-sm font-medium mr-2 w-24">Teléfono:</span>
                    <span className="text-gray-900 dark:text-white">{cliente.telefono}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Concepto y descripción */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gray-50 dark:bg-slate-700 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">Concepto</h3>
            </div>
            <div className="p-4">
              <p className="text-gray-700 dark:text-gray-300">
                {factura.concepto || '-'}
              </p>
            </div>
          </div>
          
          {/* Tabla de items */}
          {itemsFactura.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gray-50 dark:bg-slate-700 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">Detalle de Items</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-slate-700">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Descripción</th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Precio</th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cant.</th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {itemsFactura.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors duration-150">
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{item.descripcion}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">{formatCurrency(item.precio_uni)}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">{item.cantidad}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">{formatCurrency(item.importe_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Observaciones si existen */}
          {factura.observaciones && (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gray-50 dark:bg-slate-700 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">Observaciones</h3>
              </div>
              <div className="p-4">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                  {factura.observaciones}
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Columna derecha con resumen */}
        <div>
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden sticky top-4">
            <div className="bg-gray-50 dark:bg-slate-700 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">Resumen</h3>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Base Imponible:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(factura.baseImponible || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">IVA:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(factura.ivaTotal || 0)}</span>
                </div>
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <span className="font-bold text-gray-900 dark:text-white">TOTAL:</span>
                  <span className="font-bold text-lg text-gray-900 dark:text-white">{formatCurrency(factura.importe)}</span>
                </div>
              </div>
              
              {/* Información adicional */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center mb-3">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${factura.estadoCobro ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'}`}>
                    {factura.estadoCobro ? (
                      <>
                        <CheckCircleIcon className="h-3 w-3 mr-1" />
                        Cobrada
                      </>
                    ) : (
                      <>
                        <XCircleIcon className="h-3 w-3 mr-1" />
                        Pendiente de cobro
                      </>
                    )}
                  </span>
                </div>
                
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <p>Creada el: {formatDate(factura.fechaEmision)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
