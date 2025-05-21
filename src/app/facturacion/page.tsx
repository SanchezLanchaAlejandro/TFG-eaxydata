'use client';

import { useState, useEffect } from 'react';
import { ListadoFacturas } from '@/components/Facturacion/ListadoFacturas';
import { FiltroFacturas, FiltrosFacturasState } from '@/components/Facturacion/FiltroFacturas';
import { GeneradorFactura } from '@/components/Facturacion/GeneradorFactura';
import { AdjuntarFactura } from '@/components/Facturacion/AdjuntarFactura';
import { ModalNuevaFactura } from '@/components/Facturacion/ModalNuevaFactura';
import { EstadisticasFacturacion } from '@/components/Facturacion/EstadisticasFacturacion';
import { SelectorTalleresFacturacion } from '@/components/Facturacion/SelectorTalleresFacturacion';
import { ResumenCard } from '@/components/Facturacion/ResumenCard';
import { useFacturacion, Taller } from '@/hooks/useFacturacion';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { 
  PlusIcon, 
  DocumentTextIcon, 
  CurrencyDollarIcon, 
  UserGroupIcon
} from '@heroicons/react/24/outline';

export default function FacturacionPage() {
  // Estado para los modales
  const [mostrarSelectorFactura, setMostrarSelectorFactura] = useState(false);
  const [mostrarGenerador, setMostrarGenerador] = useState(false);
  const [mostrarAdjuntar, setMostrarAdjuntar] = useState(false);
  
  // Obtener el perfil de usuario para verificar permisos
  const { hasRole } = useSupabaseData();
  
  // Obtener datos con el hook refactorizado
  const { 
    facturasFiltradas, 
    clientes, 
    talleres, 
    tallerSeleccionado, 
    setTallerSeleccionado, 
    loading: dataLoading, 
    error: dataError, 
    recargarFacturas,
    getClientesByTaller
  } = useFacturacion();
  
  // Estado para los filtros
  const [filtrosActivos, setFiltrosActivos] = useState<FiltrosFacturasState>({
    cliente: '',
    concepto: '',
    fechaDesde: '',
    fechaHasta: '',
    estadoCobro: ''
  });

  // Estado para almacenar el resumen de facturas del mes actual
  const [resumenMesActual, setResumenMesActual] = useState({
    totalFacturas: 0,
    totalFacturasCobradas: 0,
    totalFacturado: 0,
    promedioFactura: 0
  });

  // Encontrar el taller seleccionado como objeto Taller
  const encontrarTallerPorId = (id: string | number | null): Taller | null => {
    if (!id) return null;
    const idStr = String(id);
    return talleres.find(t => String(t.id) === idStr) || null;
  };
  
  // Verificar si el usuario puede seleccionar taller
  const canSelectWorkshop = () => {
    return hasRole(['SUPER_ADMIN', 'GESTOR_RED']);
  };

  // Manejador para los cambios en el selector de taller principal
  const handleTallerChange = (tallerId: string | number | null) => {
    setTallerSeleccionado(tallerId);
    
    // Al cambiar el taller, cargar los clientes correspondientes
    if (tallerId) {
      getClientesByTaller(String(tallerId));
    } else {
      // Si se selecciona "Todos los talleres" (null), cargar todos los clientes
      getClientesByTaller("all");
    }
  };

  // Manejador para los cambios en los filtros
  const handleFiltrosChange = (nuevosFiltros: FiltrosFacturasState) => {
    setFiltrosActivos(nuevosFiltros);
  };
  
  // Manejador para crear nueva factura
  const handleAddFactura = () => {
    // Recargar las facturas desde el servidor
    recargarFacturas();
  };
  
  // Manejador para adjuntar factura
  const handleAdjuntarFactura = () => {
    // Recargar las facturas
    recargarFacturas();
  };
  
  // Función para mostrar el modal de opciones
  const handleNuevaFactura = () => {
    setMostrarSelectorFactura(true);
  };
  
  // Manejar la selección de tipo de factura
  const handleSeleccionarCrearFactura = () => {
    setMostrarSelectorFactura(false);
    setMostrarGenerador(true);
  };
  
  const handleSeleccionarAdjuntarFactura = () => {
    setMostrarSelectorFactura(false);
    setMostrarAdjuntar(true);
  };
  
  // Función para formatear cantidades como moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Convertir facturasFiltradas de FacturaFormateada[] a Factura[] para EstadisticasFacturacion
  const facturasParaEstadisticas = facturasFiltradas.map(factura => ({
    id: factura.id,
    cliente: factura.cliente,
    clienteId: factura.clienteId,
    concepto: factura.concepto,
    importe: factura.importe,
    fechaEmision: factura.fechaEmision,
    tipo: factura.tipo as 'generada' | 'adjuntada' | undefined,
    estadoCobro: factura.estadoCobro
  }));

  // Calcular el resumen del mes actual
  useEffect(() => {
    // Obtener el primer y último día del mes actual
    const fechaActual = new Date();
    const primerDiaMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
    const ultimoDiaMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0, 23, 59, 59, 999);
    
    // Filtrar facturas del mes actual por fecha_emision
    const facturasMesActual = facturasFiltradas.filter(factura => {
      const fechaEmision = new Date(factura.fechaEmision);
      return fechaEmision >= primerDiaMes && fechaEmision <= ultimoDiaMes;
    });
    
    // Facturas cobradas del mes actual
    const facturasMesActualCobradas = facturasMesActual.filter(f => f.estadoCobro === true);
    
    // Calcular totales
    const totalFacturadoMesActual = facturasMesActualCobradas.reduce((sum, f) => sum + (f.importe || 0), 0);
    const totalFacturasMesActual = facturasMesActual.length;
    const totalFacturasMesActualCobradas = facturasMesActualCobradas.length;
    const promedioFacturaMesActual = totalFacturasMesActualCobradas > 0 ? totalFacturadoMesActual / totalFacturasMesActualCobradas : 0;
    
    // Actualizar el estado
    setResumenMesActual({
      totalFacturas: totalFacturasMesActual,
      totalFacturasCobradas: totalFacturasMesActualCobradas,
      totalFacturado: totalFacturadoMesActual,
      promedioFactura: promedioFacturaMesActual
    });
  }, [facturasFiltradas]);

  // Cargar datos iniciales solo una vez
  useEffect(() => {
    let isMounted = true;
    
    // Función para cargar datos iniciales
    const cargarDatosIniciales = async () => {
      try {
        // Esperar a que se carguen los datos
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Si no hay datos, forzar una recarga
        if (isMounted && facturasFiltradas.length === 0 && !dataLoading) {
          recargarFacturas(true);
        }
      } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
      }
    };
    
    cargarDatosIniciales();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Añadir efecto para escuchar el evento de actualización de facturas
  useEffect(() => {
    // Función para manejar el evento de actualización de facturas
    const handleFacturaActualizada = (event: Event) => {
      const customEvent = event as CustomEvent;
      
      // Si el evento tiene datos específicos de la factura actualizada
      if (customEvent.detail) {
        const { facturaId, nuevoEstado, accion, factura: facturaData } = customEvent.detail;
        
        // Si es una actualización de estado de cobro y tenemos el ID
        if (accion === 'estadoCobro' && facturaId) {
          // Actualizar las facturas filtradas localmente sin necesidad de recargar
          const facturaActualizada = facturasFiltradas.find(f => f.id === facturaId);
          
          if (facturaActualizada) {
            facturaActualizada.estadoCobro = nuevoEstado;
            
            // Forzar recálculo del resumen del mes actual
            const fechaActual = new Date();
            const primerDiaMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
            const ultimoDiaMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0, 23, 59, 59, 999);
            
            // Usar la información de fecha de emisión directamente del evento si está disponible
            let fechaEmision: Date;
            if (facturaData?.fechaEmision) {
              fechaEmision = new Date(facturaData.fechaEmision);
            } else {
              fechaEmision = new Date(facturaActualizada.fechaEmision);
            }
            
            const esFacturaMesActual = fechaEmision >= primerDiaMes && fechaEmision <= ultimoDiaMes;
            
            if (esFacturaMesActual) {
              // Clone el array para asegurar que React detecta el cambio
              const updatedFacturasFiltradas = [...facturasFiltradas];
              
              // Recalcular y actualizar el resumen del mes actual
              const facturasMesActual = updatedFacturasFiltradas.filter(factura => {
                const fechaEmision = new Date(factura.fechaEmision);
                return fechaEmision >= primerDiaMes && fechaEmision <= ultimoDiaMes;
              });
              
              const facturasMesActualCobradas = facturasMesActual.filter(f => f.estadoCobro === true);
              
              const totalFacturadoMesActual = facturasMesActualCobradas.reduce((sum, f) => sum + (f.importe || 0), 0);
              const totalFacturasMesActual = facturasMesActual.length;
              const totalFacturasMesActualCobradas = facturasMesActualCobradas.length;
              const promedioFacturaMesActual = totalFacturasMesActualCobradas > 0 
                ? totalFacturadoMesActual / totalFacturasMesActualCobradas 
                : 0;
              
              // Actualizar el estado del resumen
              setResumenMesActual({
                totalFacturas: totalFacturasMesActual,
                totalFacturasCobradas: totalFacturasMesActualCobradas,
                totalFacturado: totalFacturadoMesActual,
                promedioFactura: promedioFacturaMesActual
              });
            }
          }
        }
      }
    };

    // Añadir listener para el evento personalizado
    window.addEventListener('facturaActualizada', handleFacturaActualizada);

    // Limpiar el listener cuando el componente se desmonte
    return () => {
      window.removeEventListener('facturaActualizada', handleFacturaActualizada);
    };
  }, [facturasFiltradas]);

  useEffect(() => {
    if (tallerSeleccionado) {
      // Usar una variable para controlar si este efecto está montado
      let isMounted = true;
      const loadClientes = async () => {
        try {
          // Solo ejecutar si el componente sigue montado
          if (isMounted) {
            await getClientesByTaller(String(tallerSeleccionado));
          }
        } catch (error) {
          console.error('Error al cargar clientes:', error);
        }
      };
      
      loadClientes();
      
      // Cleanup para evitar actualizaciones en componentes desmontados
      return () => {
        isMounted = false;
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tallerSeleccionado]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Facturación</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Administra y genera tus facturas desde un solo lugar
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-col items-end gap-3">
          {/* Selector de talleres - solo para SUPER_ADMIN y GESTOR_RED */}
          {canSelectWorkshop() && (
            <SelectorTalleresFacturacion
              tallerSeleccionado={tallerSeleccionado}
              onChange={handleTallerChange}
              talleres={talleres}
              loading={dataLoading}
            />
          )}
          
          <button
            onClick={handleNuevaFactura}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-800"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nueva Factura
          </button>
        </div>
      </div>
      
      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Tarjeta 1: Total Facturas */}
        <ResumenCard 
          title="Total Facturas (Mes Actual)"
          value={resumenMesActual.totalFacturas}
          subtitle={`${resumenMesActual.totalFacturasCobradas} cobradas (${Math.round((resumenMesActual.totalFacturasCobradas / resumenMesActual.totalFacturas) * 100) || 0}%)`}
          icon={<DocumentTextIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />}
        />
        
        {/* Tarjeta 2: Total Facturado */}
        <ResumenCard 
          title="Total Facturado Mes Actual (Cobrado)"
          value={formatCurrency(resumenMesActual.totalFacturado)}
          subtitle={`${formatCurrency(resumenMesActual.promedioFactura)} promedio por factura cobrada`}
          icon={<CurrencyDollarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />}
          iconBgClass="bg-green-100 dark:bg-green-900/40"
          textClass="text-green-600 dark:text-green-400"
        />
        
        {/* Tarjeta 3: Clientes */}
        <ResumenCard 
          title="Clientes Disponibles"
          value={dataLoading ? '...' : dataError ? '!' : clientes.length}
          subtitle={dataLoading ? 'Cargando clientes...' : 
            dataError ? 'Error al cargar clientes' : 
            tallerSeleccionado ? 
            `Clientes del taller ${encontrarTallerPorId(tallerSeleccionado)?.nombre || ''}` : 
            `Clientes asociados a ${clientes.length === 1 ? 'tu taller' : 'todos los talleres'}`}
          icon={<UserGroupIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
          iconBgClass="bg-blue-100 dark:bg-blue-900/40"
          textClass="text-blue-600 dark:text-blue-400"
        />
      </div>
      
      {/* Sección de Estadísticas y Listado */}
      <div className="mb-8">
        {/* Componente de estadísticas (ancho completo) */}
        <div className="mb-8">
          <EstadisticasFacturacion facturas={facturasParaEstadisticas} />
        </div>
        
        {/* Componente de filtros (ancho completo) */}
        <div>
          <div className="bg-white dark:bg-slate-800 shadow rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <FiltroFacturas 
              filtros={filtrosActivos} 
              onFiltrosChange={handleFiltrosChange} 
            />
          </div>
        </div>
      </div>
      
      {/* Componente de listado */}
      <div className="bg-white dark:bg-slate-800 shadow rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Facturas</h2>
        </div>
        
        <ListadoFacturas facturas={facturasFiltradas} filtrosActivos={filtrosActivos} />
      </div>
      
      {/* Modales */}
      {mostrarSelectorFactura && (
        <ModalNuevaFactura 
          onClose={() => setMostrarSelectorFactura(false)}
          onSeleccionarCrear={handleSeleccionarCrearFactura}
          onSeleccionarAdjuntar={handleSeleccionarAdjuntarFactura}
        />
      )}
      
      {mostrarGenerador && (
        <GeneradorFactura 
          onClose={() => setMostrarGenerador(false)} 
          onSubmit={handleAddFactura}
          tallerPreseleccionado={encontrarTallerPorId(tallerSeleccionado)}
        />
      )}
      
      {mostrarAdjuntar && (
        <AdjuntarFactura 
          onClose={() => setMostrarAdjuntar(false)} 
          onSubmit={handleAdjuntarFactura}
        />
      )}
    </div>
  );
}