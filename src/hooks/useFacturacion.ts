import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSupabaseData } from './useSupabaseData';
import supabase from '@/lib/supabase';

// Definición del tipo para los clientes
export type Cliente = {
  id: string;
  workshop_id: string;
  nombre: string;
  apellido: string;
  nif_cif: string;
  razon_social: string | null;
  direccion: string | null;
  email: string | null;
  telefono: string | null;
  fecha_creacion: string;
};

// Definición de tipos para facturas e items
export type ItemFactura = {
  id: string;
  factura_id?: string;
  created_at?: string;
  tipo: string;
  descripcion: string;
  precio_uni: number;
  cantidad: number;
  descuento: number;
  iva: number;
  importe_total: number;
};

export type Factura = {
  id?: string;
  usuario_id: string;
  workshop_id: string;
  cliente_id: string;
  concepto: string;
  fecha_emision: string;
  url_pdf?: string;
  tipo: string;
  procesada_por_ia?: boolean;
  nombre_archivo?: string;
  numero_factura: string;
  metodo_pago: string;
  observaciones?: string;
  base_imponible: number;
  iva_total: number;
  total_factura: number;
  estado_cobro?: boolean;
};

// Definición del tipo para los talleres
export type Taller = {
  id: string;
  nombre: string;
  network_id?: string;
  razon_social?: string;
  cif_nif?: string;
  direccion?: string;
  codigo_postal?: string;
  ciudad?: string;
  provincia?: string;
  email_taller?: string;
  telefono_movil?: string;
};

// Definición de tipos para facturas formateadas para el listado
export type FacturaFormateada = {
  id: string;
  numeroFactura: string;
  cliente: string;
  clienteId: string;
  concepto: string;
  fechaEmision: string;
  importe: number;
  tipo: string;
  estadoCobro?: boolean;
  url_pdf?: string;
  workshop_id?: string | number | null;
};

// Tipo para el estado del hook
type FacturacionState = {
  clientes: Cliente[];
  talleres: Taller[];
  facturas: FacturaFormateada[];
  loading: boolean;
  error: string | null;
};

export function useFacturacion() {
  const [state, setState] = useState<FacturacionState>({
    clientes: [],
    talleres: [],
    facturas: [],
    loading: true,
    error: null
  });
  
  const [tallerSeleccionado, setTallerSeleccionado] = useState<string | number | null>(null);
  
  const { userProfile } = useSupabaseData();
  
  // Referencias para control de recargas
  const isFetching = useRef(false);
  const lastTallerId = useRef<string | number | null>(null);
  const lastUserId = useRef<string | null>(null);
  const lastNetworkId = useRef<string | null | undefined>(null);
  const lastFetchTime = useRef<number>(0);
  const hasFetchedFacturas = useRef(false);

  // Función para obtener los talleres disponibles según el rol del usuario
  const fetchTalleres = useCallback(async () => {
    if (!userProfile) return [];

    try {
      // Si es GESTOR_TALLER, solo necesita su propio taller
      if (userProfile.role === 'GESTOR_TALLER' && userProfile.workshop_id) {
        const { data: taller, error } = await supabase
          .from('workshops')
          .select('id, nombre_comercial, razon_social, cif_nif, direccion, codigo_postal, ciudad, provincia, email_taller, telefono_movil')
          .eq('id', userProfile.workshop_id)
          .single();

        if (error) {
          console.error('Error al obtener el taller:', error);
          return [];
        }

        return taller ? [{
          id: taller.id,
          nombre: taller.nombre_comercial,
          razon_social: taller.razon_social,
          cif_nif: taller.cif_nif,
          direccion: taller.direccion,
          codigo_postal: taller.codigo_postal,
          ciudad: taller.ciudad,
          provincia: taller.provincia,
          email_taller: taller.email_taller,
          telefono_movil: taller.telefono_movil
        }] : [];
      }
      
      // Si es GESTOR_RED, obtener los talleres de su red
      else if (userProfile.role === 'GESTOR_RED' && userProfile.network_id) {
        const { data: talleres, error } = await supabase
          .from('workshops')
          .select('id, nombre_comercial, razon_social, cif_nif, direccion, codigo_postal, ciudad, provincia, email_taller, telefono_movil')
          .eq('network_id', userProfile.network_id);

        if (error) {
          console.error('Error al obtener talleres de la red:', error);
          return [];
        }

        return talleres ? talleres.map(taller => ({
          id: taller.id,
          nombre: taller.nombre_comercial,
          razon_social: taller.razon_social,
          cif_nif: taller.cif_nif,
          direccion: taller.direccion,
          codigo_postal: taller.codigo_postal,
          ciudad: taller.ciudad,
          provincia: taller.provincia,
          email_taller: taller.email_taller,
          telefono_movil: taller.telefono_movil
        })) : [];
      }
      
      // Si es SUPER_ADMIN, puede ver todos los talleres
      else if (userProfile.role === 'SUPER_ADMIN') {
        // Si tiene network_id asignado, filtrar por esa red
        let query = supabase
          .from('workshops')
          .select('id, nombre_comercial, network_id, razon_social, cif_nif, direccion, codigo_postal, ciudad, provincia, email_taller, telefono_movil');
        
        if (userProfile.network_id) {
          query = query.eq('network_id', userProfile.network_id);
        }
        
        const { data: talleres, error } = await query;

        if (error) {
          console.error('Error al obtener todos los talleres:', error);
          return [];
        }

        return talleres ? talleres.map(taller => ({
          id: taller.id,
          nombre: taller.nombre_comercial,
          network_id: taller.network_id,
          razon_social: taller.razon_social,
          cif_nif: taller.cif_nif,
          direccion: taller.direccion,
          codigo_postal: taller.codigo_postal,
          ciudad: taller.ciudad,
          provincia: taller.provincia,
          email_taller: taller.email_taller,
          telefono_movil: taller.telefono_movil
        })) : [];
      }
      
      return [];
    } catch (error: unknown) {
      console.error('Error en fetchTalleres:', error);
      return [];
    }
  }, [userProfile]);

  // Función para obtener los clientes según el rol del usuario
  const fetchClientes = useCallback(async (forceRefresh = false) => {
    if (!userProfile) return;
    
    // Evitar múltiples peticiones simultáneas
    if (isFetching.current && !forceRefresh) return;
    
    // Si los datos no han cambiado, evitar recargar
    if (!forceRefresh && 
        lastUserId.current === userProfile.id && 
        lastTallerId.current === tallerSeleccionado &&
        lastNetworkId.current === userProfile.network_id) {
      return;
    }

    try {
      isFetching.current = true;
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Actualizar referencias
      lastUserId.current = userProfile.id;
      lastTallerId.current = tallerSeleccionado;
      lastNetworkId.current = userProfile.network_id;
      
      // Iniciamos la consulta base
      let query = supabase.from('clientes').select('*');
      
      // Determinamos cómo filtrar según el rol del usuario
      if (userProfile.role === 'GESTOR_TALLER') {
        // Si es gestor de taller, solo mostramos clientes de su taller
        if (userProfile.workshop_id) {
          query = query.eq('workshop_id', userProfile.workshop_id);
        } else {
          setState(prev => ({ 
            ...prev, 
            clientes: [],
            loading: false,
            error: 'No tiene un taller asignado'
          }));
          isFetching.current = false;
          return;
        }
      } else if (userProfile.role === 'GESTOR_RED') {
        if (userProfile.network_id) {
          // Para gestor de red, hay dos casos
          if (tallerSeleccionado) {
            // 1. Si hay un taller seleccionado, filtrar solo por ese taller
            query = query.eq('workshop_id', tallerSeleccionado);
          } else {
            // 2. Si no hay taller seleccionado, obtener clientes de todos los talleres de la red
            const { data: talleres, error: errorTalleres } = await supabase
              .from('workshops')
              .select('id')
              .eq('network_id', userProfile.network_id);
            
            if (errorTalleres) {
              console.error('Error al obtener talleres para filtrar clientes:', errorTalleres);
              setState(prev => ({ 
                ...prev, 
                clientes: [],
                loading: false,
                error: 'Error al obtener talleres de la red'
              }));
              isFetching.current = false;
              return;
            }
            
            // Si no hay talleres en la red, devolver lista vacía
            if (!talleres || talleres.length === 0) {
              setState(prev => ({ 
                ...prev, 
                clientes: [],
                loading: false,
                error: null
              }));
              isFetching.current = false;
              return;
            }
            
            const workshopIds = talleres.map(t => t.id);
            query = query.in('workshop_id', workshopIds);
          }
        } else {
          setState(prev => ({ 
            ...prev, 
            clientes: [],
            loading: false,
            error: 'No tiene una red asignada'
          }));
          isFetching.current = false;
          return;
        }
      } else if (userProfile.role === 'SUPER_ADMIN') {
        // Para admin, filtrar según la selección o mostrar todos
        if (tallerSeleccionado) {
          query = query.eq('workshop_id', tallerSeleccionado);
        } else if (userProfile.network_id) {
          // Si el admin tiene network_id, filtrar por talleres de esa red
          const { data: talleres, error: errorTalleres } = await supabase
            .from('workshops')
            .select('id')
            .eq('network_id', userProfile.network_id);
          
          if (errorTalleres) {
            console.error('Error al obtener talleres para filtrar clientes:', errorTalleres);
            setState(prev => ({ 
              ...prev, 
              clientes: [],
              loading: false,
              error: 'Error al obtener talleres de la red'
            }));
            isFetching.current = false;
            return;
          }
          
          // Si no hay talleres en la red, devolver lista vacía
          if (!talleres || talleres.length === 0) {
            setState(prev => ({ 
              ...prev, 
              clientes: [],
              loading: false,
              error: null
            }));
            isFetching.current = false;
            return;
          }
          
          const workshopIds = talleres.map(t => t.id);
          query = query.in('workshop_id', workshopIds);
        }
        // Si no hay filtro, traer todos los clientes (sólo para admin sin network_id)
      }
      
      // Ejecutar la consulta filtrada
      const { data: clientes, error } = await query;
      
      if (error) {
        console.error('Error al obtener clientes:', error);
        setState(prev => ({ 
          ...prev, 
          clientes: [],
          loading: false,
          error: 'Error al obtener los clientes'
        }));
        isFetching.current = false;
        return;
      }
      
      // Actualizar el estado con los clientes obtenidos
      setState(prev => ({ 
        ...prev, 
        clientes: clientes || [],
        loading: false,
        error: null
      }));
    } catch (error: unknown) {
      console.error('Error al obtener clientes:', error instanceof Error ? error.message : String(error));
      setState(prev => ({ 
        ...prev, 
        loading: false,
        error: error instanceof Error ? error.message : 'Error al obtener los clientes'
      }));
    } finally {
      isFetching.current = false;
    }
  }, [userProfile, tallerSeleccionado]);

  // Función para obtener facturas según el rol del usuario
  const fetchFacturas = useCallback(async (forceRefresh = false) => {
    if (!userProfile) return;
    
    // Si ya hay una solicitud en curso, no iniciar otra
    if (isFetching.current && !forceRefresh) return;
    
    // Evitar recargas innecesarias si los datos no han cambiado
    const now = Date.now();
    if (!forceRefresh && 
        lastUserId.current === userProfile.id && 
        String(lastTallerId.current) === String(tallerSeleccionado) &&
        lastNetworkId.current === userProfile.network_id &&
        hasFetchedFacturas.current &&
        now - lastFetchTime.current < 10000) { // 10 segundos entre recargas
      return;
    }

    try {
      isFetching.current = true;
      
      // Solo actualizamos el estado loading aquí, no dentro de useEffect
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Actualizar referencias
      lastUserId.current = userProfile.id;
      lastTallerId.current = tallerSeleccionado;
      lastNetworkId.current = userProfile.network_id;
      lastFetchTime.current = now;
      
      let query = supabase
        .from('facturas')
        .select(`
          *,
          clientes(id, nombre, apellido, razon_social)
        `);
      
      // Determinar el filtro según el rol del usuario
      if (userProfile.role === 'GESTOR_TALLER') {
        // Si es gestor de taller, solo mostramos facturas de su taller
        if (userProfile.workshop_id) {
          query = query.eq('workshop_id', userProfile.workshop_id);
        } else {
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            error: 'No tienes un taller asignado'
          }));
          isFetching.current = false;
          return;
        }
      } else if (userProfile.role === 'GESTOR_RED' || (userProfile.role === 'SUPER_ADMIN' && userProfile.network_id)) {
        // Para gestores de red o super admins con network_id
        if (tallerSeleccionado) {
          // Si hay un taller seleccionado, filtrar solo por ese taller
          query = query.eq('workshop_id', tallerSeleccionado);
        } else if (userProfile.network_id) {
          // Si no hay taller seleccionado pero hay network_id, filtrar por talleres de la red
          const { data: talleres, error: errorTalleres } = await supabase
            .from('workshops')
            .select('id')
            .eq('network_id', userProfile.network_id);
          
          if (errorTalleres) {
            console.error('Error al obtener talleres de la red:', errorTalleres);
            setState(prev => ({ 
              ...prev, 
              loading: false, 
              error: 'Error al obtener talleres de la red: ' + errorTalleres.message,
              facturas: [] 
            }));
            isFetching.current = false;
            return;
          }
          
          if (talleres && talleres.length > 0) {
            const tallerIds = talleres.map(taller => taller.id);
            
            // Filtramos facturas que pertenezcan a estos talleres
            query = query.in('workshop_id', tallerIds);
          } else {
            setState(prev => ({ 
              ...prev, 
              facturas: [], 
              loading: false 
            }));
            isFetching.current = false;
            return;
          }
        } else {
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            error: 'No tienes una red asignada',
            facturas: [] 
          }));
          isFetching.current = false;
          return;
        }
      } else if (userProfile.role === 'SUPER_ADMIN') {
        // Si es SUPER_ADMIN sin network_id 
        if (tallerSeleccionado) {
          // Si hay taller seleccionado, filtrar por ese taller
          query = query.eq('workshop_id', tallerSeleccionado);
        }
        // Si no hay taller seleccionado, no aplicamos filtro (obtiene todas)
      }
      
      // Ordenamos las facturas por fecha de emisión (más recientes primero)
      query = query.order('fecha_emision', { ascending: false });
      
      // Ejecutamos la consulta
      const { data: facturas, error: facturasError } = await query;
      
      if (facturasError) {
        console.error('Error al obtener facturas:', facturasError);
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Error al obtener facturas: ' + facturasError.message,
          facturas: [] 
        }));
        isFetching.current = false;
        return;
      }
      
      // Procesar las facturas para darles el formato necesario para el componente de listado
      const facturasFormateadas: FacturaFormateada[] = facturas ? facturas.map(factura => {
        // Determinar el nombre del cliente
        const nombreCliente = factura.clientes ? 
          (`${factura.clientes.nombre || ''} ${factura.clientes.apellido || ''}`).trim() || 
          factura.clientes.razon_social || 'Cliente sin nombre' : 
          'Cliente desconocido';
        
        return {
          id: factura.id,
          numeroFactura: factura.numero_factura,
          cliente: nombreCliente,
          clienteId: factura.cliente_id,
          concepto: factura.concepto,
          fechaEmision: factura.fecha_emision,
          importe: factura.total_factura,
          tipo: factura.tipo,
          estadoCobro: factura.estado_cobro,
          url_pdf: factura.url_pdf,
          workshop_id: factura.workshop_id
        };
      }) : [];
      
      hasFetchedFacturas.current = true;
      
      setState(prev => ({
        ...prev,
        facturas: facturasFormateadas,
        loading: false,
        error: null
      }));
      
    } catch (error: unknown) {
      console.error('Error en fetchFacturas:', error instanceof Error ? error.message : String(error));
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Error al obtener facturas: ' + (error instanceof Error ? error.message : String(error)) 
      }));
    } finally {
      isFetching.current = false;
    }
  }, [userProfile, tallerSeleccionado]);

  // Función para guardar una factura en la base de datos
  const guardarFactura = async (
    facturaData: {
      numeroFactura: string;
      fechaEmision: string;
      cliente: Cliente;
      concepto: string;
      items: Array<{
        id: string;
        tipo: string;
        descripcion: string;
        precioUnitario: number;
        cantidad: number;
        descuento: number;
        iva: number;
      }>;
      metodoPago: string;
      observaciones: string;
      baseImponible: number;
      totalIva: number;
      totalFactura: number;
      workshop_id?: string; // Cambiado a string para UUID
      estadoCobro?: boolean; // Nuevo campo para estado de cobro
    }
  ): Promise<{ success: boolean; error?: string; facturaId?: string }> => {
    try {
      if (!userProfile) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      // Obtener workshop_id según el rol del usuario
      const workshop_id = userProfile.workshop_id || 
        (userProfile.workshop_id ? String(userProfile.workshop_id) : undefined);
      
      if (!workshop_id) {
        return { success: false, error: 'Se requiere seleccionar un taller para generar la factura' };
      }
      
      // Fecha actual para los campos timestamp
      const ahora = new Date().toISOString();
      
      // Convertir la fecha de emisión para incluir la hora actual (formato timestamp completo)
      // Si solo viene la fecha (YYYY-MM-DD), añadimos la hora actual
      const fechaEmisionCompleta = facturaData.fechaEmision.includes('T') 
        ? facturaData.fechaEmision  // Ya tiene formato ISO con hora
        : new Date(`${facturaData.fechaEmision}T${new Date().toTimeString().split(' ')[0]}`).toISOString();
      
      // Crear el objeto de factura para insertar en la base de datos
      const factura: Factura = {
        usuario_id: userProfile.id,
        workshop_id: workshop_id,
        cliente_id: facturaData.cliente.id,
        concepto: facturaData.concepto,
        fecha_emision: fechaEmisionCompleta,
        tipo: 'Generada',
        numero_factura: facturaData.numeroFactura,
        metodo_pago: facturaData.metodoPago,
        observaciones: facturaData.observaciones || '',
        base_imponible: facturaData.baseImponible,
        iva_total: facturaData.totalIva,
        total_factura: facturaData.totalFactura,
        estado_cobro: facturaData.estadoCobro || false
      };

      // Guardar la factura en la base de datos
      const { data: facturaInsertada, error: errorFactura } = await supabase
        .from('facturas')
        .insert(factura)
        .select('id')
        .single();

      if (errorFactura) {
        console.error('Error al guardar la factura:', errorFactura);
        return { success: false, error: 'Error al guardar la factura: ' + errorFactura.message };
      }

      if (!facturaInsertada || !facturaInsertada.id) {
        return { success: false, error: 'No se pudo obtener el ID de la factura creada' };
      }
      
      // Convertir los items de la factura al formato requerido para la base de datos
      const itemsParaInsertar = facturaData.items.map(item => {
        const precioConDescuento = item.precioUnitario * item.cantidad * (1 - item.descuento / 100);
        const ivaAmount = precioConDescuento * (item.iva / 100);
        const importeTotal = precioConDescuento + ivaAmount;

        return {
          factura_id: facturaInsertada.id,
          created_at: ahora, // Añadimos timestamp de creación
          tipo: item.tipo,
          descripcion: item.descripcion,
          precio_uni: item.precioUnitario,
          cantidad: item.cantidad,
          descuento: item.descuento,
          iva: item.iva,
          importe_total: importeTotal
        };
      });

      // Guardar los items en la base de datos
      const { error: errorItems } = await supabase
        .from('items_facturas')
        .insert(itemsParaInsertar);

      if (errorItems) {
        console.error('Error al guardar los items de la factura:', errorItems);
        
        // En caso de error al guardar los items, podríamos eliminar la factura creada para mantener consistencia
        await supabase.from('facturas').delete().eq('id', facturaInsertada.id);
        
        return { success: false, error: 'Error al guardar los items de la factura: ' + errorItems.message };
      }
      
      return { 
        success: true, 
        facturaId: facturaInsertada.id 
      };
    } catch (error: unknown) {
      console.error('Error en guardarFactura:', error instanceof Error ? error.message : String(error));
      return { 
        success: false, 
        error: 'Error al procesar la factura: ' + (error instanceof Error ? error.message : String(error)) 
      };
    }
  };

  // Función para obtener clientes por taller
  const getClientesByTaller = useCallback(async (workshop_id: string) => {
    try {
      // Caso especial: Si workshop_id es "all" o está vacío, obtener todos los clientes según el rol
      if (workshop_id === "all" || workshop_id.trim() === "") {
        await fetchClientes(true);
        return;
      }
      
      // Verificar que workshop_id sea un valor válido
      if (!workshop_id || workshop_id.trim() === '') {
        console.error('Error: workshop_id inválido o vacío:', workshop_id);
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'ID de taller inválido o vacío' 
        }));
        return;
      }

      setState(prev => ({ ...prev, loading: true }));
      
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('workshop_id', workshop_id);
      
      if (error) {
        console.error('Error al obtener clientes por taller:', error);
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Error al obtener clientes: ' + error.message 
        }));
        return;
      }
      
      // Manejo explícito del caso sin clientes
      if (!data || data.length === 0) {
        setState(prev => ({
          ...prev,
          clientes: [],
          loading: false,
          error: null
        }));
        return;
      }
      
      setState(prev => ({
        ...prev,
        clientes: data,
        loading: false,
        error: null // Limpiar el error si la operación tuvo éxito
      }));
    } catch (error: unknown) {
      console.error('Error en getClientesByTaller:', error instanceof Error ? error.message : String(error));
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Error al obtener clientes' 
      }));
    }
  }, [fetchClientes]);

  // Iniciar carga de talleres y clientes cuando el hook se monte
  useEffect(() => {
    const cargarTalleres = async () => {
      if (!userProfile) return;

      try {
        const talleres = await fetchTalleres();
        setState(prev => ({ ...prev, talleres }));
        
        // Si es GESTOR_TALLER, seleccionar automáticamente su taller
        if (userProfile.role === 'GESTOR_TALLER' && userProfile.workshop_id) {
          setTallerSeleccionado(userProfile.workshop_id);
        }
        
        // Cargar los clientes después de establecer los talleres
        fetchClientes(true);
      } catch (error: unknown) {
        console.error('Error al cargar talleres:', error instanceof Error ? error.message : String(error));
      }
    };
    
    cargarTalleres();
  }, [userProfile, fetchTalleres, fetchClientes]);
  
  // Cargar clientes cuando cambia el taller seleccionado
  useEffect(() => {
    if (tallerSeleccionado !== null) {
      fetchClientes();
    }
  }, [tallerSeleccionado, fetchClientes]);

  // Cargar facturas solo cuando se monta el componente inicialmente o cuando cambia de valor tallerSeleccionado
  useEffect(() => {
    const shouldFetch = 
      tallerSeleccionado !== lastTallerId.current || 
      !hasFetchedFacturas.current;
      
    if (shouldFetch) {
      fetchFacturas();
    }
  }, [tallerSeleccionado, fetchFacturas]);

  // Filtrar facturas por taller seleccionado
  const facturasFiltradas = useMemo(() => {
    // Nota: facturas ya viene filtradas por taller desde el backend en fetchFacturas
    // Este es un filtrado adicional por si acaso
    if (!tallerSeleccionado) {
      return state.facturas;
    }
    
    // Asegurarnos de comparar correctamente los IDs de taller (pueden ser string o number)
    return state.facturas.filter(factura => {
      if (!factura.workshop_id) return false;
      return String(factura.workshop_id) === String(tallerSeleccionado);
    });
  }, [state.facturas, tallerSeleccionado]);

  // Calcular estadísticas basadas en las facturas filtradas
  const facturasCobradas = useMemo(() => 
    facturasFiltradas.filter(f => f.estadoCobro === true),
  [facturasFiltradas]);

  // Calcular todas las estadísticas necesarias
  const summary = useMemo(() => {
    // Calcular sumas totales
    const totalFacturado = facturasCobradas.reduce((sum, f) => sum + (f.importe || 0), 0);
    const totalFacturas = facturasFiltradas.length;
    const totalFacturasCobradas = facturasCobradas.length;
    
    // Calcular estadísticas de los últimos 30 días
    const hace30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const ult30Todos = facturasFiltradas.filter(f => new Date(f.fechaEmision) >= hace30);
    const ult30Cobradas = facturasCobradas.filter(f => new Date(f.fechaEmision) >= hace30);
    
    const totalUltimos30Dias = ult30Cobradas.reduce((sum, f) => sum + (f.importe || 0), 0);
    const nuevasUltimos30Dias = ult30Todos.length;
    
    // Calcular promedios y porcentajes
    const promedioFactura = totalFacturasCobradas > 0 ? totalFacturado / totalFacturasCobradas : 0;
    const porcentajeUltimos30Dias = totalFacturado > 0 ? (totalUltimos30Dias / totalFacturado) * 100 : 0;
    
    return {
      totalFacturado,
      totalFacturas,
      totalFacturasCobradas,
      totalUltimos30Dias,
      nuevasUltimos30Dias,
      promedioFactura,
      porcentajeUltimos30Dias
    };
  }, [facturasFiltradas, facturasCobradas]);

  // Efecto para cargar clientes cuando cambia el taller seleccionado
  useEffect(() => {
    if (tallerSeleccionado) {
      getClientesByTaller(String(tallerSeleccionado));
    }
  }, [tallerSeleccionado, getClientesByTaller]);

  // Función para recargar manualmente los datos
  const recargarDatos = async () => {
    // Resetear las banderas para forzar la recarga
    hasFetchedFacturas.current = false;
    
    try {
      // Cargar talleres primero
      const talleres = await fetchTalleres();
      setState(prev => ({
        ...prev,
        talleres
      }));
      
      // Forzar recarga de clientes y facturas
      await fetchClientes(true);
      await fetchFacturas(true);
      
      return true;
    } catch (error: unknown) {
      console.error("Error al recargar datos:", error instanceof Error ? error.message : String(error));
      return false;
    }
  };

  // Función para recargar manualmente los talleres
  const recargarTalleres = async () => {
    const talleres = await fetchTalleres();
    setState(prev => ({
      ...prev,
      talleres
    }));
    return talleres;
  };

  // Función para actualizar el estado de cobro de una factura
  const actualizarEstadoCobroFactura = async (
    facturaId: string, 
    nuevoEstado: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!userProfile) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      // Actualizar el estado de cobro en la base de datos
      const { data, error } = await supabase
        .from('facturas')
        .update({ estado_cobro: nuevoEstado })
        .eq('id', facturaId)
        .select();

      if (error) {
        console.error('Error al actualizar el estado de cobro:', error);
        return { success: false, error: 'Error al actualizar el estado de cobro: ' + error.message };
      }
      
      if (!data || data.length === 0) {
        console.error('No se encontró la factura para actualizar');
        return { success: false, error: 'No se encontró la factura para actualizar' };
      }
      
      // Actualizar el estado local de facturas
      setState(prev => ({
        ...prev,
        facturas: prev.facturas.map(factura => 
          factura.id === facturaId 
            ? { ...factura, estadoCobro: nuevoEstado } 
            : factura
        )
      }));

      return { success: true };
    } catch (error: unknown) {
      console.error('Error en actualizarEstadoCobroFactura:', error instanceof Error ? error.message : String(error));
      return { 
        success: false, 
        error: 'Error al actualizar el estado de cobro: ' + (error instanceof Error ? error.message : String(error)) 
      };
    }
  };

  return {
    clientes: state.clientes,
    talleres: state.talleres,
    facturas: state.facturas,
    facturasFiltradas,
    tallerSeleccionado,
    setTallerSeleccionado,
    summary,
    loading: state.loading,
    error: state.error,
    recargarDatos,
    recargarClientes: (forceRefresh = true) => fetchClientes(forceRefresh),
    recargarFacturas: useCallback((forceRefresh = true) => {
      hasFetchedFacturas.current = false;
      return fetchFacturas(forceRefresh);
    }, [fetchFacturas]),
    recargarTalleres,
    guardarFactura,
    getClientesByTaller,
    actualizarEstadoCobroFactura
  };
} 