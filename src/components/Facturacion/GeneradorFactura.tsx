import { useState, useEffect, useRef } from 'react';
import { Cliente as ClienteComponent } from '../Clientes/types';
import { Modal } from '@/components/shared/Modal';
import { useFacturacion, Cliente, Taller } from '@/hooks/useFacturacion';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { toast } from 'react-hot-toast';

interface ItemFactura {
  id: string;
  tipo: 'Mano de obra mecánica' | 'Mano de obra chapa' | 'Mano de obra pintura' | 'Pieza mecánica' | 'Pieza chapa' | 'Pintura' | 'Otro';
  descripcion: string;
  precioUnitario: number;
  cantidad: number;
  descuento: number;
  iva: number;
}

interface FacturaData {
  numeroFactura: string;
  fechaEmision: string;
  cliente: ClienteComponent | null;
  concepto: string;
  items: ItemFactura[];
  metodoPago: string;
  observaciones: string;
  numeroCuenta: string;
  workshop_id?: string;
  estadoCobro: boolean;
  tallerSeleccionado: Taller | null;
}

interface GeneradorFacturaProps {
  onClose: () => void;
  onSubmit: (factura: any) => void;
  tallerPreseleccionado?: Taller | null;
}

export const GeneradorFactura = ({ onClose, onSubmit, tallerPreseleccionado }: GeneradorFacturaProps) => {
  const { clientes, talleres, loading, error, guardarFactura, getClientesByTaller } = useFacturacion();
  const { userProfile } = useSupabaseData();
  
  // Referencia para controlar si ya hemos cargado los clientes para el taller actual
  const clientesCheckedRef = useRef(false);
  // Referencia para evitar ciclos infinitos
  const initialLoadDoneRef = useRef(false);
  
  const [facturaData, setFacturaData] = useState<FacturaData>({
    numeroFactura: generarNumeroFactura(),
    fechaEmision: new Date().toISOString().split('.')[0],  // Formato YYYY-MM-DDTHH:MM:SS
    cliente: null,
    concepto: '',
    items: [],
    metodoPago: '',
    observaciones: '',
    numeroCuenta: 'ES12 3456 7890 1234 5678 9012',
    workshop_id: undefined, // Inicialmente undefined, se establecerá en el efecto
    estadoCobro: false, // Por defecto, no está cobrada
    tallerSeleccionado: tallerPreseleccionado || null // Inicialmente no hay taller seleccionado
  });

  // TypeScript no está detectando correctamente la comparación, así que definimos explícitamente 
  // una función para manejar esto correctamente
  const encontrarTallerPorId = (id: string | number | null | undefined, talleres: Taller[]): Taller | null => {
    if (!id) return null;
    const idStr = String(id);
    return talleres.find(t => t.id === idStr) || null;
  };

  // Un solo efecto para la configuración inicial
  useEffect(() => {
    // Solo ejecutamos esto una vez
    if (!initialLoadDoneRef.current) {
      initialLoadDoneRef.current = true; // Marcamos que ya se ejecutó
      
      // 1. Si hay taller preseleccionado, lo usamos
      if (tallerPreseleccionado && tallerPreseleccionado.id) {
        setFacturaData(prev => ({
          ...prev,
          tallerSeleccionado: tallerPreseleccionado,
          workshop_id: String(tallerPreseleccionado.id)
        }));
        
        getClientesByTaller(String(tallerPreseleccionado.id));
      }
      // 2. Si no hay taller preseleccionado pero el usuario es GESTOR_TALLER
      else if (userProfile && userProfile.role === 'GESTOR_TALLER' && userProfile.workshop_id) {
        setFacturaData(prev => ({
          ...prev,
          workshop_id: String(userProfile.workshop_id)
        }));
        
        getClientesByTaller(String(userProfile.workshop_id));
      }
    }
  }, []);

  // Efecto para añadir un item inicial si no hay ninguno
  useEffect(() => {
    if (facturaData.items.length === 0) {
      agregarItem();
    }
  }, []);

  // Manejador para la selección de taller (modifiquémoslo para evitar ciclos)
  const handleTallerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const valor = e.target.value;
    
    // Verificar si el valor es vacío
    if (!valor) {
      setFacturaData(prev => ({
        ...prev,
        workshop_id: undefined,
        cliente: null,
        tallerSeleccionado: null
      }));
      return;
    }
    
    // Buscar directamente el taller por ID sin actualizar el estado
    const taller = talleres.find(t => String(t.id) === valor);
    
    if (taller) {
      // Actualizamos todo de una vez para evitar renderizados adicionales
      setFacturaData(prev => ({
        ...prev,
        workshop_id: valor,
        cliente: null,
        tallerSeleccionado: taller
      }));
      
      // Cargar clientes después de actualizar el estado
      getClientesByTaller(valor);
    } else {
      console.error('❌ No se encontró el taller con ID:', valor);
    }
  };

  // Función para generar un número de factura automático con formato EAXY-YYYY-XXXX
  function generarNumeroFactura(): string {
    const año = new Date().getFullYear();
    const numero = Math.floor(1000 + Math.random() * 9000);
    return `EAXY-${año}-${numero}`;
  }

  // Función para generar un ID único para cada ítem
  const generarIdItem = (): string => {
    return Math.random().toString(36).substring(2, 11);
  };

  // Función para calcular el total de la factura
  const calcularTotalFactura = (): { 
    baseImponible: number; 
    totalIva: number; 
    totalFactura: number;
    desglosePorIva: { [key: number]: { base: number, iva: number } };
  } => {
    // Inicializamos el desglose por tipos de IVA
    const desglosePorIva: { [key: number]: { base: number, iva: number } } = {};
    
    // Calculamos los totales
    const totales = facturaData.items.reduce((acc, item) => {
      // Calculamos la base imponible de este ítem (precio con descuento aplicado)
      const precioConDescuento = item.precioUnitario * item.cantidad * (1 - item.descuento / 100);
      
      // Calculamos el IVA para este ítem específico
      const ivaAmount = precioConDescuento * (item.iva / 100);
      
      // Añadimos al desglose por tipo de IVA
      if (!desglosePorIva[item.iva]) {
        desglosePorIva[item.iva] = { base: 0, iva: 0 };
      }
      desglosePorIva[item.iva].base += precioConDescuento;
      desglosePorIva[item.iva].iva += ivaAmount;
      
      return {
        baseImponible: acc.baseImponible + precioConDescuento,
        totalIva: acc.totalIva + ivaAmount
      };
    }, { baseImponible: 0, totalIva: 0 });
    
    // Calculamos el total de la factura: Base imponible + IVA
    const totalFactura = totales.baseImponible + totales.totalIva;
    
    return { 
      ...totales, 
      totalFactura,
      desglosePorIva 
    };
  };

  // Función para calcular el importe total de un ítem
  const calcularImporteItem = (item: ItemFactura): number => {
    const precioConDescuento = item.precioUnitario * item.cantidad * (1 - item.descuento / 100);
    const ivaAmount = precioConDescuento * (item.iva / 100);
    return precioConDescuento + ivaAmount;
  };
  
  // Función para calcular solo la base imponible de un ítem (sin IVA)
  const calcularBaseImponibleItem = (item: ItemFactura): number => {
    return item.precioUnitario * item.cantidad * (1 - item.descuento / 100);
  };

  // Manejador para cambios en el formulario principal
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFacturaData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Manejador para selección de cliente
  const handleClienteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clienteId = e.target.value;
    const clienteSeleccionado = clientes.find(c => c.id === clienteId) || null;
    
    // Convertir el cliente de Supabase al formato que espera el componente
    if (clienteSeleccionado) {
      const clienteFormateado: ClienteComponent = {
        id: clienteSeleccionado.id,
        nombre: clienteSeleccionado.nombre,
        apellidos: clienteSeleccionado.apellido,
        razonSocial: clienteSeleccionado.razon_social || '',
        cif: clienteSeleccionado.nif_cif,
        direccion: clienteSeleccionado.direccion || '',
        telefono: clienteSeleccionado.telefono || '',
        email: clienteSeleccionado.email || '',
        fechaAlta: clienteSeleccionado.fecha_creacion,
        activo: true,
        vehiculos: []
      };
      
    setFacturaData(prev => ({
      ...prev,
        cliente: clienteFormateado
      }));
    } else {
      setFacturaData(prev => ({
        ...prev,
        cliente: null
      }));
    }
  };

  // Añadir un nuevo ítem a la factura
  const agregarItem = () => {
    const nuevoItem: ItemFactura = {
      id: generarIdItem(),
      tipo: 'Mano de obra mecánica',
      descripcion: '',
      precioUnitario: 0,
      cantidad: 1,
      descuento: 0,
      iva: 21
    };
    
    setFacturaData(prev => ({
      ...prev,
      items: [...prev.items, nuevoItem]
    }));
  };

  // Actualizar un ítem existente
  const actualizarItem = (id: string, campo: keyof ItemFactura, valor: any) => {
    setFacturaData(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === id ? { ...item, [campo]: valor } : item
      )
    }));
  };

  // Eliminar un ítem de la factura
  const eliminarItem = (id: string) => {
    setFacturaData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  // Manejador del formulario
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validar que todos los campos requeridos estén completos
    if (facturaData.workshop_id === undefined) {
      toast.error('Debe seleccionar un taller');
      return;
    }
    
    if (!facturaData.cliente) {
      toast.error('Debe seleccionar un cliente');
      return;
    }
    
    if (facturaData.items.some(item => !item.descripcion)) {
      toast.error('Todos los ítems deben tener una descripción');
      return;
    }
    
    if (!facturaData.metodoPago) {
      toast.error('Debe seleccionar un método de pago');
      return;
    }
    
    const totales = calcularTotalFactura();
    
    try {
      toast.loading('Guardando factura...', { id: 'guardarFactura' });
      
      // Preparar datos para guardar la factura
      const facturaParaGuardar = {
        numeroFactura: facturaData.numeroFactura,
        fechaEmision: facturaData.fechaEmision,
        cliente: facturaData.cliente,
        concepto: facturaData.concepto,
        items: facturaData.items,
        metodoPago: facturaData.metodoPago,
        observaciones: facturaData.observaciones,
        baseImponible: totales.baseImponible,
        totalIva: totales.totalIva,
        totalFactura: totales.totalFactura,
        workshop_id: facturaData.workshop_id,
        estadoCobro: facturaData.estadoCobro
      };
      
      // Guardar la factura en la base de datos
      const resultado = await guardarFactura(facturaParaGuardar);
      
      if (resultado.success) {
        toast.success('Factura guardada correctamente', { id: 'guardarFactura' });
        
        // Crear objeto de factura para pasar al componente padre
    const nuevaFactura = {
          id: resultado.facturaId,
          numeroFactura: facturaData.numeroFactura,
          cliente: facturaData.cliente?.razonSocial || `${facturaData.cliente?.nombre} ${facturaData.cliente?.apellidos}`,
      clienteId: facturaData.cliente?.id || '',
      clienteData: facturaData.cliente,
      concepto: facturaData.concepto,
      items: facturaData.items,
      baseImponible: totales.baseImponible,
      totalIva: totales.totalIva,
      totalFactura: totales.totalFactura,
      fechaEmision: facturaData.fechaEmision,
      metodoPago: facturaData.metodoPago,
      observaciones: facturaData.observaciones,
      numeroCuenta: facturaData.numeroCuenta
    };
    
    onSubmit(nuevaFactura);
    onClose();
      } else {
        toast.error(`Error al guardar la factura: ${resultado.error}`, { id: 'guardarFactura' });
      }
    } catch (error: any) {
      console.error('Error al procesar la factura:', error);
      toast.error(`Error al procesar la factura: ${error.message}`, { id: 'guardarFactura' });
    }
  };

  // Determinar si se necesita mostrar el selector de talleres
  const requiereSelectorTaller = 
    userProfile?.role === 'SUPER_ADMIN' || 
    userProfile?.role === 'GESTOR_RED';

  return (
    <Modal isOpen={true} onClose={onClose} title="Nueva Factura" maxWidth="max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b pb-2 dark:border-gray-700">Datos de Factura</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="numeroFactura" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Número de Factura*
                </label>
                <input
                  id="numeroFactura"
                  name="numeroFactura"
                  type="text"
                  placeholder="Insertar número de factura"
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                />
              </div>
              
              <div>
                <label htmlFor="fechaEmision" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha y Hora de Emisión*
                </label>
                <input
                  id="fechaEmision"
                  name="fechaEmision"
                  type="datetime-local"
                  value={facturaData.fechaEmision}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>

            {/* Selector de Taller (solo para SUPER_ADMIN y GESTOR_RED) */}
            {requiereSelectorTaller && (
              <div>
                <label htmlFor="taller" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Taller*
                </label>
                {loading ? (
                  <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-slate-700">
                    Cargando talleres...
                  </div>
                ) : error ? (
                  <div className="w-full px-3 py-2 border border-red-300 dark:border-red-600 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                    Error al cargar talleres: {error}
                  </div>
                ) : (
                  <select
                    id="taller"
                    value={facturaData.workshop_id || ''}
                    onChange={handleTallerChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  >
                    <option value="">Seleccione un taller</option>
                    {talleres.length === 0 ? (
                      <option value="" disabled>No hay talleres disponibles</option>
                    ) : (
                      talleres.map(taller => (
                        <option key={taller.id} value={String(taller.id)}>
                          {taller.nombre || 'Taller sin nombre'}
                        </option>
                      ))
                    )}
                  </select>
                )}
              </div>
            )}

            <div>
              <label htmlFor="cliente" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cliente*
              </label>
              {loading ? (
                <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-slate-700">
                  Cargando clientes...
                </div>
              ) : error ? (
                <div className="w-full px-3 py-2 border border-red-300 dark:border-red-600 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                  Error al cargar clientes: {error}
                </div>
              ) : clientes.length === 0 && clientesCheckedRef.current ? (
                <div className="w-full px-3 py-2 border border-amber-300 dark:border-amber-600 rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                  No hay clientes disponibles para este taller
                </div>
              ) : (
              <select
                id="cliente"
                name="cliente"
                value={facturaData.cliente?.id || ''}
                onChange={handleClienteChange}
                required
                disabled={(requiereSelectorTaller && !facturaData.workshop_id) || (clientes.length === 0 && loading)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:bg-slate-800 dark:disabled:text-gray-400"
              >
                <option value="">
                  {requiereSelectorTaller && !facturaData.workshop_id 
                    ? 'Primero seleccione un taller' 
                    : clientes.length === 0 
                      ? 'No hay clientes disponibles' 
                      : 'Seleccione un cliente'}
                </option>
                {clientes.map(cliente => (
                  <option key={cliente.id} value={cliente.id}>
                    {`${cliente.nombre} ${cliente.apellido}` || cliente.razon_social}
                  </option>
                ))}
              </select>
              )}
            </div>

            {/* Datos del cliente seleccionado */}
            {facturaData.cliente && (
              <div className="bg-gray-50 dark:bg-slate-700/30 p-4 rounded-md border border-gray-200 dark:border-gray-700">
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2 text-sm">Datos del cliente:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="block text-gray-500 dark:text-gray-400">Razón Social:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{facturaData.cliente.razonSocial || `${facturaData.cliente.nombre} ${facturaData.cliente.apellidos}`}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 dark:text-gray-400">CIF/NIF:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{facturaData.cliente.cif}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 dark:text-gray-400">Dirección:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{facturaData.cliente.direccion}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 dark:text-gray-400">Teléfono:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{facturaData.cliente.telefono}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 dark:text-gray-400">Email:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{facturaData.cliente.email}</span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="concepto" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Concepto General de la Factura*
              </label>
              <input
                id="concepto"
                name="concepto"
                type="text"
                value={facturaData.concepto}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                placeholder="Describe el concepto general de la factura"
              />
            </div>
            
            {/* Detalle de ítems de la factura */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b pb-2 dark:border-gray-700 mb-4">
                Detalle de la Factura
              </h3>
              
              <div className="bg-gray-50 dark:bg-slate-700/20 rounded-md border border-gray-200 dark:border-gray-700 p-4 mb-4">
                {facturaData.items.map((item, index) => (
                  <div key={item.id} className="mb-6 last:mb-0">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Ítem #{index + 1}
                      </h4>
                      <button
                        type="button"
                        onClick={() => eliminarItem(item.id)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
                      <div>
                        <label htmlFor={`item-tipo-${item.id}`} className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Tipo*
                        </label>
                        <select
                          id={`item-tipo-${item.id}`}
                          value={item.tipo}
                          onChange={(e) => actualizarItem(item.id, 'tipo', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                        >
                          <option value="Mano de obra mecánica">Mano de obra mecánica</option>
                          <option value="Mano de obra chapa">Mano de obra chapa</option>
                          <option value="Mano de obra pintura">Mano de obra pintura</option>
                          <option value="Pieza mecánica">Pieza mecánica</option>
                          <option value="Pieza chapa">Pieza chapa</option>
                          <option value="Pintura">Pintura</option>
                          <option value="Otro">Otro</option>
                        </select>
                      </div>
                      
                      <div className="md:col-span-2">
                        <label htmlFor={`item-descripcion-${item.id}`} className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Descripción*
                        </label>
                        <input
                          id={`item-descripcion-${item.id}`}
                          type="text"
                          value={item.descripcion}
                          onChange={(e) => actualizarItem(item.id, 'descripcion', e.target.value)}
                          placeholder="Descripción detallada del ítem"
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div>
                        <label htmlFor={`item-precio-${item.id}`} className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 whitespace-nowrap">
                          Precio Uni. (€)*
                        </label>
                        <input
                          id={`item-precio-${item.id}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.precioUnitario}
                          onChange={(e) => actualizarItem(item.id, 'precioUnitario', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor={`item-cantidad-${item.id}`} className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 whitespace-nowrap">
                          Cantidad *
                        </label>
                        <input
                          id={`item-cantidad-${item.id}`}
                          type="number"
                          step="1"
                          min="1"
                          value={item.cantidad}
                          onChange={(e) => actualizarItem(item.id, 'cantidad', parseInt(e.target.value) || 1)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor={`item-descuento-${item.id}`} className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 whitespace-nowrap">
                          Dto. (%)
                        </label>
                        <input
                          id={`item-descuento-${item.id}`}
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={item.descuento}
                          onChange={(e) => actualizarItem(item.id, 'descuento', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor={`item-iva-${item.id}`} className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 whitespace-nowrap">
                          IVA (%)*
                        </label>
                        <input
                          id={`item-iva-${item.id}`}
                          type="number"
                          step="1"
                          min="0"
                          max="100"
                          value={item.iva}
                          onChange={(e) => actualizarItem(item.id, 'iva', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor={`item-total-${item.id}`} className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 whitespace-nowrap">
                          Total (€)
                        </label>
                        <div className="w-full px-2 py-1.5 text-sm bg-gray-100 dark:bg-slate-600 border border-gray-300 dark:border-gray-700 rounded-md text-gray-800 dark:text-gray-200 font-medium">
                          {calcularImporteItem(item).toLocaleString('es-ES', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </div>
                        <div className="flex justify-between text-xs mt-1 text-gray-500 dark:text-gray-400">
                          <span>Base: {calcularBaseImponibleItem(item).toLocaleString('es-ES', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}</span>
                          <span>IVA: {(calcularBaseImponibleItem(item) * item.iva / 100).toLocaleString('es-ES', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={agregarItem}
                  className="mt-3 flex items-center text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Añadir línea
                </button>
              </div>
              
              {/* Resumen de la factura */}
              <div className="bg-gray-50 dark:bg-slate-700/20 rounded-md border border-gray-200 dark:border-gray-700 p-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Resumen</h4>
                
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Base Imponible:</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {calcularTotalFactura().baseImponible.toLocaleString('es-ES', {
                        style: 'currency',
                        currency: 'EUR'
                      })}
                    </span>
                  </div>
                  
                  {/* Total de IVA acumulado */}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total IVA:</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {calcularTotalFactura().totalIva.toLocaleString('es-ES', {
                        style: 'currency',
                        currency: 'EUR'
                      })}
                    </span>
                  </div>
                  
                  {/* Desglose por tipos de IVA (opcional, para información) */}
                  {Object.entries(calcularTotalFactura().desglosePorIva).length > 1 && (
                    <div className="ml-4 text-xs text-gray-500 dark:text-gray-400">
                      <details>
                        <summary className="cursor-pointer mb-1">Ver desglose IVA por tipos</summary>
                        <div className="pl-2 space-y-1">
                          {Object.entries(calcularTotalFactura().desglosePorIva).map(([tipoIva, valores]) => (
                            <div key={tipoIva} className="flex justify-between">
                              <span>IVA {tipoIva}%:</span>
                              <span>
                                {valores.iva.toLocaleString('es-ES', {
                                  style: 'currency',
                                  currency: 'EUR'
                                })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-sm pt-2 border-t dark:border-gray-600">
                    <span className="font-medium text-gray-800 dark:text-gray-200">Total Factura:</span>
                    <span className="font-bold text-gray-900 dark:text-white text-base">
                      {calcularTotalFactura().totalFactura.toLocaleString('es-ES', {
                        style: 'currency',
                        currency: 'EUR'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label htmlFor="metodoPago" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Método de Pago*
                </label>
                <select
                  id="metodoPago"
                  name="metodoPago"
                  value={facturaData.metodoPago}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                >
                  <option value="">Seleccione un método</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="Bizum">Bizum</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              
              {facturaData.metodoPago === 'Transferencia' && (
                <div>
                  <label htmlFor="numeroCuenta" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Número de Cuenta
                  </label>
                  <input
                    id="numeroCuenta"
                    name="numeroCuenta"
                    type="text"
                    value={facturaData.numeroCuenta}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                    placeholder="IBAN"
                  />
                </div>
              )}
              
              {/* Switch para estado de cobro */}
              <div className={facturaData.metodoPago === 'Transferencia' ? 'col-span-2' : 'col-span-1'}>
                <div className="my-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Estado de cobro
                  </label>
                  <div className="flex items-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={facturaData.estadoCobro}
                        onChange={() => {}}
                        className="sr-only"
                      />
                      <button
                        type="button" 
                        onClick={() => setFacturaData(prev => ({...prev, estadoCobro: !prev.estadoCobro}))}
                        className={`w-11 h-6 rounded-full cursor-pointer 
                          ${facturaData.estadoCobro ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}
                          relative inline-flex items-center`}
                      >
                        <span 
                          className={`w-5 h-5 rounded-full bg-white border border-gray-300
                            transition-all duration-200 ease-in-out transform
                            ${facturaData.estadoCobro ? 'translate-x-6 border-white' : 'translate-x-1'}`} 
                        />
                      </button>
                      <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {facturaData.estadoCobro ? 'Factura cobrada' : 'Factura pendiente de cobro'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className={facturaData.metodoPago === 'Transferencia' ? 'col-span-2' : ''}>
                <label htmlFor="observaciones" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Observaciones
                </label>
                <textarea
                  id="observaciones"
                  name="observaciones"
                  rows={3}
                  value={facturaData.observaciones}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  placeholder="Observaciones adicionales (opcional)"
                ></textarea>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 mt-6">
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              Guardar Factura
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Generar PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              Cancelar
            </button>
          </div>
        </form>
        
        {/* Vista previa de la factura */}
        <div className="bg-gray-50 dark:bg-slate-700/20 p-6 rounded-lg border border-gray-200 dark:border-gray-700 relative">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b pb-2 mb-4 dark:border-gray-700">Vista Previa de Factura</h3>
          
          <div className="bg-white dark:bg-slate-800 p-8 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 min-h-[60vh]">
            {/* Cabecera de la factura con datos del taller */}
            <div className="flex flex-col md:flex-row justify-between mb-8 border-b pb-4 dark:border-gray-700">
              <div>
                {facturaData.tallerSeleccionado ? (
                  <>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                      {facturaData.tallerSeleccionado.razon_social || facturaData.tallerSeleccionado.nombre}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                      {[
                        facturaData.tallerSeleccionado.direccion,
                        facturaData.tallerSeleccionado.codigo_postal,
                        facturaData.tallerSeleccionado.ciudad,
                        facturaData.tallerSeleccionado.provincia
                      ].filter(Boolean).join(', ')}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {facturaData.tallerSeleccionado.cif_nif || ''}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {facturaData.tallerSeleccionado.email_taller || ''}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {facturaData.tallerSeleccionado.telefono_movil || ''}
                    </p>
                  </>
                ) : (
                  <>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                      {userProfile?.workshop_id ? 'Cargando datos del taller...' : 'Seleccione un taller'}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 italic">
                      Los datos del taller aparecerán aquí
                    </p>
                  </>
                )}
              </div>
              <div className="mt-4 md:mt-0 md:text-right">
                <h2 className="text-lg font-bold text-blue-600 dark:text-blue-400">FACTURA</h2>
                <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Nº:</span> {facturaData.numeroFactura}</p>
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Fecha:</span> {
                    facturaData.fechaEmision 
                      ? new Date(facturaData.fechaEmision).toLocaleDateString('es-ES')
                      : new Date().toLocaleDateString('es-ES')
                  }
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Estado:</span> {
                    facturaData.estadoCobro 
                      ? <span className="text-green-600 dark:text-green-400">Cobrada</span>
                      : <span className="text-amber-600 dark:text-amber-400">Pendiente de cobro</span>
                  }
                </p>
              </div>
            </div>
            
            {/* Datos del cliente */}
            <div className="mb-8">
              <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">Datos del Cliente:</h3>
              <div className="p-3 bg-gray-50 dark:bg-slate-700/30 rounded border border-gray-200 dark:border-gray-700">
                {facturaData.cliente ? (
                  <>
                    <p className="text-gray-800 dark:text-gray-200 font-medium">
                      {facturaData.cliente.razonSocial || `${facturaData.cliente.nombre} ${facturaData.cliente.apellidos}`}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">CIF/NIF: {facturaData.cliente.cif}</p>
                    <p className="text-gray-600 dark:text-gray-400">{facturaData.cliente.direccion}</p>
                    <p className="text-gray-600 dark:text-gray-400">Tel: {facturaData.cliente.telefono}</p>
                    <p className="text-gray-600 dark:text-gray-400">{facturaData.cliente.email}</p>
                  </>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">Seleccione un cliente</p>
                )}
              </div>
            </div>

            {/* Concepto general */}
            {facturaData.concepto && (
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">Concepto General:</h3>
                <p className="text-gray-700 dark:text-gray-300">{facturaData.concepto}</p>
              </div>
            )}
            
            {/* Detalle de la factura */}
            <div className="mb-8">
              <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">Detalle:</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full table-fixed bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-700 dark:text-gray-300 w-[20%]">Tipo</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-700 dark:text-gray-300 w-[32%]">Descripción</th>
                      <th className="text-right py-2 px-3 text-xs font-medium text-gray-700 dark:text-gray-300 w-[14%]">Precio U.</th>
                      <th className="text-right py-2 px-3 text-xs font-medium text-gray-700 dark:text-gray-300 w-[6%]">Cant.</th>
                      <th className="text-right py-2 px-3 text-xs font-medium text-gray-700 dark:text-gray-300 w-[6%]">Dto.</th>
                      <th className="text-right py-2 px-3 text-xs font-medium text-gray-700 dark:text-gray-300 w-[8%]">Base</th>
                      <th className="text-right py-2 px-3 text-xs font-medium text-gray-700 dark:text-gray-300 w-[8%]">IVA</th>
                      <th className="text-right py-2 px-3 text-xs font-medium text-gray-700 dark:text-gray-300 w-[6%]">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facturaData.items.map((item, index) => {
                      const baseImponible = calcularBaseImponibleItem(item);
                      const ivaAmount = baseImponible * (item.iva / 100);
                      const totalItem = baseImponible + ivaAmount;
                      
                      return (
                        <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-slate-700/20' : ''}>
                          <td className="py-2 px-3 text-xs text-gray-800 dark:text-gray-200 align-top break-words">
                            {item.tipo}
                          </td>
                          <td className="py-2 px-3 text-xs text-gray-800 dark:text-gray-200 align-top break-words">
                            {item.descripcion || '<Sin descripción>'}
                          </td>
                          <td className="py-2 px-3 text-xs text-right text-gray-800 dark:text-gray-200 align-top whitespace-nowrap">
                            {item.precioUnitario.toLocaleString('es-ES', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })} €
                          </td>
                          <td className="py-2 px-3 text-xs text-right text-gray-800 dark:text-gray-200 align-top whitespace-nowrap">
                            {item.cantidad}
                          </td>
                          <td className="py-2 px-3 text-xs text-right text-gray-800 dark:text-gray-200 align-top whitespace-nowrap">
                            {item.descuento > 0 ? `${item.descuento}%` : '-'}
                          </td>
                          <td className="py-2 px-3 text-xs text-right text-gray-800 dark:text-gray-200 align-top whitespace-nowrap">
                            {baseImponible.toLocaleString('es-ES', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })} €
                          </td>
                          <td className="py-2 px-3 text-xs text-right text-gray-800 dark:text-gray-200 align-top whitespace-nowrap">
                            {ivaAmount.toLocaleString('es-ES', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })} €<br/>({item.iva}%)
                          </td>
                          <td className="py-2 px-3 text-xs text-right font-medium text-gray-800 dark:text-gray-200 align-top whitespace-nowrap">
                            {totalItem.toLocaleString('es-ES', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })} €
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 dark:bg-slate-700/50 border-t-2 border-gray-300 dark:border-gray-600">
                      <td colSpan={6} className="py-2 px-3"></td>
                      <td className="py-2 px-3 text-xs text-right font-medium text-gray-700 dark:text-gray-300">
                        Base Imponible:
                      </td>
                      <td className="py-2 px-3 text-xs text-right font-medium text-gray-800 dark:text-gray-200">
                        {calcularTotalFactura().baseImponible.toLocaleString('es-ES', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })} €
                      </td>
                    </tr>
                    
                    {/* Total acumulado de IVA */}
                    <tr className="bg-gray-50 dark:bg-slate-700/50">
                      <td colSpan={6} className="py-2 px-3"></td>
                      <td className="py-2 px-3 text-xs text-right font-medium text-gray-700 dark:text-gray-300">
                        Total IVA:
                      </td>
                      <td className="py-2 px-3 text-xs text-right font-medium text-gray-800 dark:text-gray-200">
                        {calcularTotalFactura().totalIva.toLocaleString('es-ES', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })} €
                      </td>
                    </tr>
                    
                    <tr className="bg-gray-100 dark:bg-slate-700 font-bold border-t border-gray-300 dark:border-gray-600">
                      <td colSpan={6} className="py-2 px-3"></td>
                      <td className="py-2 px-3 text-sm text-right text-gray-800 dark:text-gray-200">
                        TOTAL:
                      </td>
                      <td className="py-2 px-3 text-sm text-right text-gray-800 dark:text-gray-200">
                        {calcularTotalFactura().totalFactura.toLocaleString('es-ES', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })} €
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            
            {/* Forma de pago */}
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">Forma de pago:</h3>
              <p className="text-gray-700 dark:text-gray-300">
                {facturaData.metodoPago || 'Pendiente de seleccionar'}
                {facturaData.metodoPago === 'Transferencia' && facturaData.numeroCuenta && (
                  <span className="block mt-1">
                    IBAN: <span className="font-medium">{facturaData.numeroCuenta}</span>
                  </span>
                )}
              </p>
            </div>
            
            {/* Observaciones */}
            {facturaData.observaciones && (
              <div className="border-t pt-4 dark:border-gray-700">
                <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">Observaciones:</h3>
                <p className="text-gray-700 dark:text-gray-300">{facturaData.observaciones}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}; 