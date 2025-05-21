import { useState, useEffect, useCallback, useRef } from 'react';
import supabase from '@/lib/supabase';
import { useSupabaseData } from './useSupabaseData';

// Definición de tipos para los datos del dashboard
export type DashboardData = {
  totalValoraciones: number;
  polizasActivas: number;
  facturacionMensual: number;
  nuevosClientesMes: number;
  datosFacturacionAnual: { mes: string; facturacion: number }[];
  talleresDisponibles: { id: string | number; nombre: string }[];
  datosEstadoValoraciones: { mes: string; pendientes: number; en_curso: number; finalizadas: number }[];
  totalesEstadoValoraciones: { pendientes: number; en_curso: number; finalizadas: number };
  datosDistribucionPolizas: { name: string; value: number; color?: string }[];
  totalesPolizas: number;
  valoracionesFinalizadasMesActual: number;
  valoracionesFinalizadasMesAnterior: number;
};

export function useDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalValoraciones: 0,
    polizasActivas: 0,
    facturacionMensual: 0,
    nuevosClientesMes: 0,
    datosFacturacionAnual: [],
    talleresDisponibles: [],
    datosEstadoValoraciones: [],
    totalesEstadoValoraciones: {
      pendientes: 0,
      en_curso: 0,
      finalizadas: 0
    },
    datosDistribucionPolizas: [],
    totalesPolizas: 0,
    valoracionesFinalizadasMesActual: 0,
    valoracionesFinalizadasMesAnterior: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tallerSeleccionado, setTallerSeleccionado] = useState<string | number | null>(null);
  
  const { userProfile } = useSupabaseData();
  
  // Referencias para rastrear el estado de carga
  const isFetching = useRef(false);
  const hasFetched = useRef(false);
  const hasFetchedTalleres = useRef(false);
  const lastUserProfileId = useRef<string | null>(null);
  const lastFetchedWorkshopId = useRef<string | number | null>(null);
  
  // Referencias para datos de facturación anual
  const lastFacturacionWorkshopId = useRef<string | number | null>(null);
  const lastFacturacionFetchTime = useRef<number>(0);
  const cachedFacturacionResult = useRef<Array<{ mes: string; facturacion: number }>>([]);
  
  // Función para obtener los talleres disponibles según el rol del usuario
  const fetchTalleresDisponibles = useCallback(async () => {
    if (!userProfile) return [];
    
    try {
      // GESTOR_TALLER no necesita ver el selector, pero le asignamos su taller para mostrar sus datos
      if (userProfile.role === 'GESTOR_TALLER') {
        if (userProfile.workshop_id) {
          const { data, error } = await supabase
            .from('workshops')
            .select('id, nombre_comercial')
            .eq('id', userProfile.workshop_id)
            .single();
          
          if (error) throw error;
          
          if (data) {
            return [{
              id: data.id,
              nombre: data.nombre_comercial
            }];
          }
        }
        return [];
      } 
      
      // Para SUPER_ADMIN y GESTOR_RED
      let query = supabase.from('workshops').select('id, nombre_comercial');
      
      // Si es GESTOR_RED, filtramos por su network_id
      if (userProfile.role === 'GESTOR_RED' && userProfile.network_id) {
        query = query.eq('network_id', userProfile.network_id);
      }
      
      // SUPER_ADMIN también debe filtrar por network_id si tiene uno asignado
      if (userProfile.role === 'SUPER_ADMIN' && userProfile.network_id) {
        query = query.eq('network_id', userProfile.network_id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Transformar los datos para que tengan la estructura esperada
      const talleres = (data || []).map(taller => ({
        id: taller.id,
        nombre: taller.nombre_comercial
      }));
      
      return talleres;
    } catch (err: any) {
      console.error('Error al obtener talleres disponibles:', err);
      return [];
    }
  }, [userProfile]);
  
  // Función para normalizar el estado de la valoración
  const normalizarEstado = (estado: string | null): 'pendiente' | 'en_curso' | 'finalizado' => {
    if (!estado) return 'pendiente';
    
    // Convertir a minúsculas y eliminar espacios
    const estadoLower = estado.toLowerCase().trim();
    
    // Normalizar el valor según lo que venga de la base de datos
    if (estadoLower === 'finalizado' || estadoLower === 'completado' || estadoLower === 'terminado') {
      return 'finalizado';
    } else if (estadoLower === 'en_curso' || estadoLower === 'en curso' || estadoLower === 'proceso' || estadoLower === 'en proceso') {
      return 'en_curso';
    } else {
      return 'pendiente';
    }
  };
  
  // Función para obtener los últimos 6 meses (incluyendo el actual)
  const obtenerUltimos6Meses = () => {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth();
    const anioActual = fechaActual.getFullYear();
    
    const ultimos6MesesInfo = [];
    
    for (let i = 5; i >= 0; i--) {
      // Calcular el índice del mes (0-11)
      let indiceMes = mesActual - i;
      let anio = anioActual;
      
      // Ajustar para meses del año anterior
      if (indiceMes < 0) {
        indiceMes += 12;
        anio -= 1;
      }
      
      ultimos6MesesInfo.push({
        mes: meses[indiceMes],
        mesNumero: indiceMes,
        anio: anio
      });
    }
    
    return ultimos6MesesInfo;
  };

  // Función para procesar datos de valoraciones por estado en los últimos 6 meses
  const procesarDatosEstadoValoraciones = (valoraciones: any[]) => {
    const mesesInfo = obtenerUltimos6Meses();
    
    // Inicializar los datos con ceros para cada mes
    const datosValoraciones = mesesInfo.map(info => ({
      mes: info.mes,
      mesNumero: info.mesNumero,
      anio: info.anio,
      pendientes: 0,
      en_curso: 0,
      finalizadas: 0
    }));
    
    // Inicializar totales
    const totalesValoraciones = {
      pendientes: 0,
      en_curso: 0,
      finalizadas: 0
    };
    
    if (!valoraciones || valoraciones.length === 0) {
      // Retornar datos vacíos pero con estructura correcta
      return {
        datos: datosValoraciones.map(dato => ({
          mes: dato.mes,
          pendientes: 0,
          en_curso: 0,
          finalizadas: 0
        })),
        totales: totalesValoraciones
      };
    }
    
    // Procesar cada valoración
    valoraciones.forEach(valoracion => {
      // Normalizar estado
      const estadoNormalizado = normalizarEstado(valoracion.estado);
      
      // Convertir el estado normalizado al formato requerido para los gráficos
      let estadoGrafico: 'pendientes' | 'en_curso' | 'finalizadas';
      
      if (estadoNormalizado === 'pendiente') {
        estadoGrafico = 'pendientes';
      } else if (estadoNormalizado === 'en_curso') {
        estadoGrafico = 'en_curso';
      } else { // 'finalizado'
        estadoGrafico = 'finalizadas';
      }
      
      // Incrementar el total para este estado
      totalesValoraciones[estadoGrafico]++;
      
      // Usar fecha_finalizado para valoraciones finalizadas, y fecha_creacion para las demás
      let fechaReferencia;
      if (estadoNormalizado === 'finalizado' && valoracion.fecha_finalizado) {
        fechaReferencia = new Date(valoracion.fecha_finalizado);
      } else {
        fechaReferencia = new Date(valoracion.fecha_creacion);
      }
      
      const mesReferencia = fechaReferencia.getMonth();
      const anioReferencia = fechaReferencia.getFullYear();
      
      // Buscar el mes correspondiente en nuestros datos y actualizar el contador
      mesesInfo.forEach((info, index) => {
        if (info.mesNumero === mesReferencia && info.anio === anioReferencia) {
          datosValoraciones[index][estadoGrafico]++;
        }
      });
    });
    
    // Formatear para el gráfico (eliminar propiedades que no necesitamos)
    const datosFormateados = datosValoraciones.map(dato => ({
      mes: dato.mes,
      pendientes: dato.pendientes,
      en_curso: dato.en_curso,
      finalizadas: dato.finalizadas
    }));
    
    return {
      datos: datosFormateados,
      totales: totalesValoraciones
    };
  };
  
  // Función para obtener la facturación mensual
  const fetchFacturacionMensual = useCallback(async (selectedWorkshopId: string | number | null = null) => {
    if (!userProfile) return 0;
    
    try {
      // Obtener el primer y último día del mes actual
      const now = new Date();
      const primerDiaMes = new Date(now.getFullYear(), now.getMonth(), 1);
      const ultimoDiaMes = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      // Formatear las fechas para la consulta SQL
      const fechaInicio = primerDiaMes.toISOString().split('T')[0];
      const fechaFin = ultimoDiaMes.toISOString().split('T')[0];
      
      let workshopIds: (string | number)[] = [];
      
      // Determinar qué workshop_ids utilizar según el rol y la selección
      if (selectedWorkshopId) {
        // Si hay un taller seleccionado, usamos ese
        workshopIds = [selectedWorkshopId];
      } else if (userProfile.role === 'GESTOR_TALLER' && userProfile.workshop_id) {
        // Para gestores de taller, usamos su taller asignado
        workshopIds = [userProfile.workshop_id];
      } else {
        // Para gestores de red y super admin, obtenemos los talleres filtrados por network_id si aplica
        let query = supabase.from('workshops').select('id');
        
        // Filtrar por network_id para GESTOR_RED
        if (userProfile.role === 'GESTOR_RED' && userProfile.network_id) {
          query = query.eq('network_id', userProfile.network_id);
        }
        
        // Filtrar por network_id para SUPER_ADMIN si tiene uno asignado
        if (userProfile.role === 'SUPER_ADMIN' && userProfile.network_id) {
          query = query.eq('network_id', userProfile.network_id);
        }
        
        const { data: talleres, error: errorTalleres } = await query;
        
        if (errorTalleres) throw errorTalleres;
        
        if (talleres && talleres.length > 0) {
          workshopIds = talleres.map(taller => taller.id);
        }
      }
      
      // Consulta para obtener la suma de las facturas del mes actual
      let queryFacturas;
      
      if (workshopIds.length > 0) {
        queryFacturas = supabase
          .from('facturas')
          .select('total_factura')
          .gte('fecha_emision', fechaInicio)
          .lte('fecha_emision', fechaFin)
          .eq('estado_cobro', true) // Solo facturas cobradas
          .in('workshop_id', workshopIds);
      } else {
        // Para super admin sin selección, obtener todas las facturas
        queryFacturas = supabase
          .from('facturas')
          .select('total_factura')
          .gte('fecha_emision', fechaInicio)
          .lte('fecha_emision', fechaFin)
          .eq('estado_cobro', true); // Solo facturas cobradas
      }
      
      const { data: facturas, error: errorFacturas } = await queryFacturas;
      
      if (errorFacturas) throw errorFacturas;
      
      // Calcular la suma total de las facturas
      const totalFacturacion = facturas?.reduce((total, factura) => {
        return total + (factura.total_factura || 0);
      }, 0) || 0;
      
      return totalFacturacion;
    } catch (err: any) {
      console.error('Error al obtener facturación mensual:', err);
      return 0;
    }
  }, [userProfile]);
  
  // Obtener los datos de facturación para todos los meses del año actual
  const fetchDatosFacturacionAnual = useCallback(async (selectedWorkshopId: string | number | null = null) => {
    if (!userProfile) return [];
    
    // Verificar si ya se consultó este taller recientemente (en los últimos 10 segundos)
    const now = Date.now();
    if (
      selectedWorkshopId === lastFacturacionWorkshopId.current && 
      cachedFacturacionResult.current.length > 0 &&
      now - lastFacturacionFetchTime.current < 10000
    ) {
      return cachedFacturacionResult.current;
    }
    
    try {
      // Obtener el año actual
      const añoActual = new Date().getFullYear();
      
      // Lista de meses abreviados en español
      const mesesAbreviados = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      
      // Array para almacenar los datos de facturación por mes
      const datosFacturacion = mesesAbreviados.map((mes, index) => ({
        mes,
        facturacion: 0
      }));
      
      // Obtener los IDs de talleres según la selección y rol
      let workshopIds: (string | number)[] = [];
      
      if (selectedWorkshopId) {
        // Si hay un taller seleccionado, usamos ese
        workshopIds = [selectedWorkshopId];
      } else if (userProfile.role === 'GESTOR_TALLER' && userProfile.workshop_id) {
        // Para gestores de taller, usamos su taller asignado
        workshopIds = [userProfile.workshop_id];
      } else {
        // Para gestores de red y super admin, obtenemos los talleres filtrados por network_id si aplica
        let query = supabase.from('workshops').select('id');
        
        // Filtrar por network_id para GESTOR_RED
        if (userProfile.role === 'GESTOR_RED' && userProfile.network_id) {
          query = query.eq('network_id', userProfile.network_id);
        }
        
        // Filtrar por network_id para SUPER_ADMIN si tiene uno asignado
        if (userProfile.role === 'SUPER_ADMIN' && userProfile.network_id) {
          query = query.eq('network_id', userProfile.network_id);
        }
        
        const { data: talleres, error: errorTalleres } = await query;
        
        if (errorTalleres) throw errorTalleres;
        
        if (talleres && talleres.length > 0) {
          workshopIds = talleres.map(taller => taller.id);
        }
      }
      
      // Consulta para obtener las facturas del año actual
      let queryFacturas;
      
      if (workshopIds.length > 0) {
        queryFacturas = supabase
          .from('facturas')
          .select('fecha_emision, total_factura')
          .gte('fecha_emision', `${añoActual}-01-01`)
          .lte('fecha_emision', `${añoActual}-12-31`)
          .eq('estado_cobro', true) // Solo facturas cobradas
          .in('workshop_id', workshopIds);
      } else {
        // Para super admin sin selección, obtener todas las facturas
        queryFacturas = supabase
          .from('facturas')
          .select('fecha_emision, total_factura')
          .gte('fecha_emision', `${añoActual}-01-01`)
          .lte('fecha_emision', `${añoActual}-12-31`)
          .eq('estado_cobro', true); // Solo facturas cobradas
      }
      
      const { data: facturas, error: errorFacturas } = await queryFacturas;
      
      if (errorFacturas) throw errorFacturas;
      
      // Procesar las facturas y actualizar los datos de facturación
      if (facturas && facturas.length > 0) {
        facturas.forEach(factura => {
          // Obtener el mes de la fecha (0-11)
          const fechaFactura = new Date(factura.fecha_emision);
          const mesIndex = fechaFactura.getMonth();
          
          // Sumar la facturación al mes correspondiente
          datosFacturacion[mesIndex].facturacion += factura.total_factura || 0;
        });
      }
      
      // Obtener el mes actual (0-11)
      const mesActual = new Date().getMonth();
      
      // Reordenar para que los últimos 6 meses estén en orden cronológico
      const últimos6MesesOrdenados = [];
      for (let i = 5; i >= 0; i--) {
        const indice = (mesActual - i + 12) % 12; // Asegura índices positivos
        últimos6MesesOrdenados.push(datosFacturacion[indice]);
      }
      
      // Actualizar referencias
      lastFacturacionWorkshopId.current = selectedWorkshopId;
      lastFacturacionFetchTime.current = now;
      cachedFacturacionResult.current = últimos6MesesOrdenados;
      
      return últimos6MesesOrdenados;
    } catch (err: any) {
      console.error('Error al obtener datos de facturación anual:', err);
      return [];
    }
  }, [userProfile]);
  
  // Función para obtener los nuevos clientes del mes actual
  const fetchNuevosClientesMes = useCallback(async (selectedWorkshopId: string | number | null = null) => {
    if (!userProfile) return 0;
    
    try {
      // Obtener el primer y último día del mes actual
      const now = new Date();
      const primerDiaMes = new Date(now.getFullYear(), now.getMonth(), 1);
      const ultimoDiaMes = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      // Formatear las fechas para la consulta SQL
      const fechaInicio = primerDiaMes.toISOString().split('T')[0];
      const fechaFin = ultimoDiaMes.toISOString().split('T')[0];
      
      let workshopIds: (string | number)[] = [];
      
      // Determinar qué workshop_ids utilizar según el rol y la selección
      if (selectedWorkshopId) {
        // Si hay un taller seleccionado, usamos ese
        workshopIds = [selectedWorkshopId];
      } else if (userProfile.role === 'GESTOR_TALLER' && userProfile.workshop_id) {
        // Para gestores de taller, usamos su taller asignado
        workshopIds = [userProfile.workshop_id];
      } else {
        // Para gestores de red y super admin, obtenemos los talleres filtrados por network_id si aplica
        let query = supabase.from('workshops').select('id');
        
        // Filtrar por network_id para GESTOR_RED
        if (userProfile.role === 'GESTOR_RED' && userProfile.network_id) {
          query = query.eq('network_id', userProfile.network_id);
        }
        
        // Filtrar por network_id para SUPER_ADMIN si tiene uno asignado
        if (userProfile.role === 'SUPER_ADMIN' && userProfile.network_id) {
          query = query.eq('network_id', userProfile.network_id);
        }
        
        const { data: talleres, error: errorTalleres } = await query;
        
        if (errorTalleres) throw errorTalleres;
        
        if (talleres && talleres.length > 0) {
          workshopIds = talleres.map(taller => taller.id);
        }
      }
      
      // Consulta para obtener los clientes creados en el mes actual
      let queryClientes;
      
      if (workshopIds.length > 0) {
        queryClientes = supabase
          .from('clientes')
          .select('id')
          .gte('fecha_creacion', fechaInicio)
          .lte('fecha_creacion', fechaFin)
          .in('workshop_id', workshopIds);
      } else {
        // Para super admin sin selección, obtener todos los clientes
        queryClientes = supabase
          .from('clientes')
          .select('id')
          .gte('fecha_creacion', fechaInicio)
          .lte('fecha_creacion', fechaFin);
      }
      
      const { data: clientes, error: errorClientes } = await queryClientes;
      
      if (errorClientes) throw errorClientes;
      
      const totalClientesNuevos = clientes?.length || 0;
      
      return totalClientesNuevos;
    } catch (err: any) {
      console.error('Error al obtener nuevos clientes del mes:', err);
      return 0;
    }
  }, [userProfile]);
  
  // Función para obtener las valoraciones finalizadas por mes
  const fetchValoracionesFinalizadasPorMes = useCallback(async (selectedWorkshopId: string | number | null = null) => {
    if (!userProfile) return { mesActual: 0, mesAnterior: 0 };
    
    try {
      // Obtener el mes y año actuales
      const fechaActual = new Date();
      const mesActual = fechaActual.getMonth();
      const añoActual = fechaActual.getFullYear();
      
      // Calcular el mes anterior y su año
      const fechaMesAnterior = new Date(fechaActual);
      fechaMesAnterior.setMonth(mesActual - 1);
      const mesAnterior = fechaMesAnterior.getMonth();
      const añoMesAnterior = fechaMesAnterior.getFullYear();
      
      // Formatear fechas para consultas
      const primerDiaMesActual = new Date(añoActual, mesActual, 1).toISOString().split('T')[0];
      const ultimoDiaMesActual = new Date(añoActual, mesActual + 1, 0).toISOString().split('T')[0];
      
      const primerDiaMesAnterior = new Date(añoMesAnterior, mesAnterior, 1).toISOString().split('T')[0];
      const ultimoDiaMesAnterior = new Date(añoMesAnterior, mesAnterior + 1, 0).toISOString().split('T')[0];
      
      let workshopIds: (string | number)[] = [];
      
      // Determinar qué workshop_ids utilizar según el rol y la selección
      if (selectedWorkshopId) {
        // Si hay un taller seleccionado, usamos ese
        workshopIds = [selectedWorkshopId];
      } else if (userProfile.role === 'GESTOR_TALLER' && userProfile.workshop_id) {
        // Para gestores de taller, usamos su taller asignado
        workshopIds = [userProfile.workshop_id];
      } else {
        // Para gestores de red y super admin, obtenemos los talleres filtrados por network_id si aplica
        let query = supabase.from('workshops').select('id');
        
        // Filtrar por network_id para GESTOR_RED
        if (userProfile.role === 'GESTOR_RED' && userProfile.network_id) {
          query = query.eq('network_id', userProfile.network_id);
        }
        
        // Filtrar por network_id para SUPER_ADMIN si tiene uno asignado
        if (userProfile.role === 'SUPER_ADMIN' && userProfile.network_id) {
          query = query.eq('network_id', userProfile.network_id);
        }
        
        const { data: talleres, error: errorTalleres } = await query;
        
        if (errorTalleres) throw errorTalleres;
        
        if (talleres && talleres.length > 0) {
          workshopIds = talleres.map(taller => taller.id);
        }
      }
      
      // Función para normalizar el estado
      const esEstadoFinalizado = (estado: string | null): boolean => {
        if (!estado) return false;
        
        const estadoLower = estado.toLowerCase().trim();
        return estadoLower === 'finalizado' || estadoLower === 'completado' || 
              estadoLower === 'terminado' || estadoLower === 'finalizada';
      };
      
      // Consulta para mes actual
      let queryMesActual;
      if (workshopIds.length > 0) {
        queryMesActual = supabase
          .from('valoraciones')
          .select('id, estado, fecha_finalizado')
          .in('workshop_id', workshopIds)
          .gte('fecha_finalizado', primerDiaMesActual)
          .lte('fecha_finalizado', ultimoDiaMesActual);
      } else {
        queryMesActual = supabase
          .from('valoraciones')
          .select('id, estado, fecha_finalizado')
          .gte('fecha_finalizado', primerDiaMesActual)
          .lte('fecha_finalizado', ultimoDiaMesActual);
      }
      
      // Consulta para mes anterior
      let queryMesAnterior;
      if (workshopIds.length > 0) {
        queryMesAnterior = supabase
          .from('valoraciones')
          .select('id, estado, fecha_finalizado')
          .in('workshop_id', workshopIds)
          .gte('fecha_finalizado', primerDiaMesAnterior)
          .lte('fecha_finalizado', ultimoDiaMesAnterior);
      } else {
        queryMesAnterior = supabase
          .from('valoraciones')
          .select('id, estado, fecha_finalizado')
          .gte('fecha_finalizado', primerDiaMesAnterior)
          .lte('fecha_finalizado', ultimoDiaMesAnterior);
      }
      
      const [respuestaMesActual, respuestaMesAnterior] = await Promise.all([
        queryMesActual,
        queryMesAnterior
      ]);
      
      if (respuestaMesActual.error) throw respuestaMesActual.error;
      if (respuestaMesAnterior.error) throw respuestaMesAnterior.error;
      
      // Filtrar por estado finalizado
      const finalizadasMesActual = respuestaMesActual.data?.filter(v => esEstadoFinalizado(v.estado)) || [];
      const finalizadasMesAnterior = respuestaMesAnterior.data?.filter(v => esEstadoFinalizado(v.estado)) || [];
      
      return {
        mesActual: finalizadasMesActual.length,
        mesAnterior: finalizadasMesAnterior.length
      };
      
    } catch (err: any) {
      console.error('Error al obtener valoraciones finalizadas por mes:', err);
      return { mesActual: 0, mesAnterior: 0 };
    }
  }, [userProfile]);
  
  // Función para obtener el total de valoraciones y pólizas activas
  const fetchDashboardData = useCallback(async (selectedWorkshopId: string | number | null = null) => {
    if (!userProfile) return null;
    
    // Evitar recargas innecesarias si ya está en proceso una carga o si el userProfile y workshop no han cambiado
    if (isFetching.current || 
        (lastUserProfileId.current === userProfile.id && 
         String(lastFetchedWorkshopId.current) === String(selectedWorkshopId) && 
         hasFetched.current)) {
      return null;
    }
    
    try {
      isFetching.current = true;
      setLoading(true);
      setError(null);
      
      // Actualizar las referencias
      lastUserProfileId.current = userProfile.id;
      lastFetchedWorkshopId.current = selectedWorkshopId;
      
      let workshopIds: (string | number)[] = [];
      
      // Determinar qué workshop_ids utilizar según el rol y la selección
      if (selectedWorkshopId) {
        // Si hay un taller seleccionado, usamos ese
        workshopIds = [selectedWorkshopId];
      } else if (userProfile.role === 'GESTOR_TALLER' && userProfile.workshop_id) {
        // Para gestores de taller, usamos su taller asignado
        workshopIds = [userProfile.workshop_id];
      } else {
        // Para gestores de red y super admin, obtenemos los talleres filtrados por network_id si aplica
        let query = supabase.from('workshops').select('id');
        
        // Filtrar por network_id para GESTOR_RED
        if (userProfile.role === 'GESTOR_RED' && userProfile.network_id) {
          query = query.eq('network_id', userProfile.network_id);
        }
        
        // Filtrar por network_id para SUPER_ADMIN si tiene uno asignado
        if (userProfile.role === 'SUPER_ADMIN' && userProfile.network_id) {
          query = query.eq('network_id', userProfile.network_id);
        }
        
        const { data: talleres, error: errorTalleres } = await query;
        
        if (errorTalleres) throw errorTalleres;
        
        if (talleres && talleres.length > 0) {
          workshopIds = talleres.map(taller => taller.id);
        }
      }
      
      // Consulta para obtener las valoraciones
      let queryValoraciones;
      
      if (workshopIds.length > 0) {
        queryValoraciones = supabase
          .from('valoraciones')
          .select('*')
          .in('workshop_id', workshopIds);
      } else {
        // Para super admin sin filtros, obtener todas las valoraciones
        queryValoraciones = supabase
          .from('valoraciones')
          .select('*');
      }
      
      const { data: valoraciones, error: errorValoraciones } = await queryValoraciones;
      
      if (errorValoraciones) throw errorValoraciones;
      
      // Paralelizar el resto de consultas
      const [
        facturacionMensual,
        datosFacturacionAnual,
        nuevosClientesMes,
        talleres
      ] = await Promise.all([
        // 1. Obtener facturación mensual
        fetchFacturacionMensual(selectedWorkshopId),
        
        // 2. Obtener datos de facturación anual
        fetchDatosFacturacionAnual(selectedWorkshopId),
        
        // 3. Obtener nuevos clientes
        fetchNuevosClientesMes(selectedWorkshopId),
        
        // 4. Obtener talleres disponibles
        fetchTalleresDisponibles()
      ]);
      
      // Procesar los datos de valoraciones
      const datosEstadoResult = procesarDatosEstadoValoraciones(valoraciones || []);
      
      // Calcular totales
      const totalValoraciones = valoraciones?.length || 0;
      const valoracionesNormalizadas = valoraciones?.map(v => ({
        ...v,
        estadoNormalizado: normalizarEstado(v.estado)
      })) || [];
      const polizasActivas = valoracionesNormalizadas.filter(v => v.estadoNormalizado === 'en_curso').length;
      
      // Datos de distribución de pólizas
      let datosDistribucionPolizas: { name: string; value: number; color?: string }[] = [];
      let totalesPolizas = 0;
      
      try {
        // Usamos las valoraciones en curso para calcular la distribución de tipos de pólizas
        const polizasEnCurso = valoracionesNormalizadas.filter(v => v.estadoNormalizado === 'en_curso');
        
        if (polizasEnCurso.length > 0) {
          // Agrupar por tipo de póliza
          const conteoPolizas = {
            'Todo Riesgo': 0,
            'Terceros Ampliado': 0,
            'Terceros': 0,
            'Otros': 0
          };
          
          polizasEnCurso.forEach(poliza => {
            const tipoPoliza = poliza.tipo_poliza?.trim() || '';
            
            if (!tipoPoliza) {
              conteoPolizas['Otros']++;
            } else if (tipoPoliza.toLowerCase().includes('todo') && tipoPoliza.toLowerCase().includes('riesgo')) {
              conteoPolizas['Todo Riesgo']++;
            } else if (tipoPoliza.toLowerCase().includes('terceros') && tipoPoliza.toLowerCase().includes('ampliado')) {
              conteoPolizas['Terceros Ampliado']++;
            } else if (tipoPoliza.toLowerCase().includes('terceros')) {
              conteoPolizas['Terceros']++;
            } else {
              conteoPolizas['Otros']++;
            }
          });
          
          // Crear los datos para el gráfico
          datosDistribucionPolizas = [
            { name: 'Todo Riesgo', value: conteoPolizas['Todo Riesgo'], color: '#3b82f6' },
            { name: 'Terceros Ampliado', value: conteoPolizas['Terceros Ampliado'], color: '#8b5cf6' },
            { name: 'Terceros', value: conteoPolizas['Terceros'], color: '#10b981' },
            { name: 'Otros', value: conteoPolizas['Otros'], color: '#6b7280' }
          ].filter(d => d.value > 0); // Filtrar categorías sin valores
          
          // Usar el total de pólizas en curso como totalesPolizas
          totalesPolizas = polizasEnCurso.length;
        }
      } catch (err: any) {
        console.error('Error al calcular distribución de pólizas:', err);
      }
      
      // Obtener valoraciones finalizadas por mes
      const valoracionesFinalizadas = await fetchValoracionesFinalizadasPorMes(selectedWorkshopId);
      
      // Actualizar todos los datos del dashboard a la vez
      setDashboardData({
        totalValoraciones,
        polizasActivas,
        facturacionMensual,
        nuevosClientesMes,
        datosFacturacionAnual,
        talleresDisponibles: talleres,
        datosEstadoValoraciones: datosEstadoResult.datos,
        totalesEstadoValoraciones: datosEstadoResult.totales,
        datosDistribucionPolizas,
        totalesPolizas,
        valoracionesFinalizadasMesActual: valoracionesFinalizadas.mesActual,
        valoracionesFinalizadasMesAnterior: valoracionesFinalizadas.mesAnterior
      });
      
      // Marcar que los datos ya se han cargado
      hasFetched.current = true;
      
      return null;
    } catch (err: any) {
      console.error('Error al obtener datos del dashboard:', err);
      setError(err.message || 'Error al cargar los datos del dashboard');
      return null;
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [userProfile, fetchFacturacionMensual, fetchDatosFacturacionAnual, fetchNuevosClientesMes, fetchTalleresDisponibles, fetchValoracionesFinalizadasPorMes, procesarDatosEstadoValoraciones]);
  
  // Efecto para cargar los talleres disponibles y establecer el taller seleccionado
  useEffect(() => {
    if (userProfile && !hasFetchedTalleres.current) {
      const loadTalleres = async () => {
        const talleres = await fetchTalleresDisponibles();
        
        // Actualizar los talleres en el estado
        setDashboardData(prevData => ({
          ...prevData,
          talleresDisponibles: talleres
        }));
        
        // Si es GESTOR_TALLER, seleccionar automáticamente su taller
        if (userProfile.role === 'GESTOR_TALLER' && userProfile.workshop_id) {
          // Primero verificamos que este workshop_id esté en la lista de talleres disponibles
          const tallerExiste = talleres.some(t => t.id === userProfile.workshop_id);
          if (tallerExiste) {
            setTallerSeleccionado(userProfile.workshop_id);
          } else {
            // Si el taller no existe en la lista, lo añadimos para evitar errores
            if (userProfile.workshop_id) {
              const { data } = await supabase
                .from('workshops')
                .select('id, nombre_comercial')
                .eq('id', userProfile.workshop_id)
                .single();
              
              if (data) {
                const nuevoTaller = {
                  id: data.id,
                  nombre: data.nombre_comercial
                };
                const talleresActualizados = [...talleres, nuevoTaller];
                setDashboardData(prevData => ({
                  ...prevData,
                  talleresDisponibles: talleresActualizados
                }));
                setTallerSeleccionado(userProfile.workshop_id);
              }
            }
          }
        }

        // Marcar que ya se cargaron los talleres
        hasFetchedTalleres.current = true;
      };
      
      loadTalleres();
    }
  }, [userProfile, fetchTalleresDisponibles]);
  
  // Efecto para cargar los datos del dashboard cuando cambia el taller seleccionado
  useEffect(() => {
    if (userProfile && hasFetchedTalleres.current && !hasFetched.current) {
      fetchDashboardData(tallerSeleccionado);
    }
  }, [userProfile, tallerSeleccionado, fetchDashboardData, hasFetchedTalleres.current]);
  
  // Efecto para manejar la visibilidad del documento (cuando el usuario vuelve a la pestaña)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Evitar múltiples ejecuciones en un corto período de tiempo (debounce)
        const now = Date.now();
        if (now - lastFacturacionFetchTime.current > 5000) { // 5 segundos de espera mínima
          lastFacturacionFetchTime.current = now;
          // El usuario puede usar refetchData() si necesita datos actualizados
        }
      }
    };

    // Agregar el event listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Eliminar el event listener al desmontar
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // Función para cambiar el taller seleccionado
  const cambiarTallerSeleccionado = async (tallerId: string | number | null) => {
    // Evitar operaciones duplicadas si ya está cargando
    if (isFetching.current) return;
    
    // Mostrar un estado de carga mientras se obtienen los nuevos datos
    setLoading(true);
    
    // Limpiar la caché de facturación
    lastFacturacionWorkshopId.current = null;
    cachedFacturacionResult.current = [];
    
    // Actualizar el taller seleccionado inmediatamente para que la UI refleje el cambio
    setTallerSeleccionado(tallerId);
    
    // Reiniciar las banderas hasFetched para permitir una nueva carga de datos
    hasFetched.current = false;
    
    try {
      // Forzar recarga de datos con el nuevo taller seleccionado
      await fetchDashboardData(tallerId);
    } catch (err: any) {
      console.error('Error al cambiar el taller seleccionado:', err);
      setError(err.message || 'Error al cambiar el taller seleccionado');
    } finally {
      setLoading(false);
    }
  };

  return {
    dashboardData,
    loading,
    error,
    tallerSeleccionado,
    cambiarTallerSeleccionado,
    refetchData: () => {
      // Solo permitir recarga si no hay una carga en proceso
      if (isFetching.current) return;
      
      // Limpiar la caché de facturación
      lastFacturacionWorkshopId.current = null;
      cachedFacturacionResult.current = [];
      
      // Reiniciar las banderas para forzar una recarga completa
      hasFetched.current = false;
      
      // Forzar recarga de datos
      fetchDashboardData(tallerSeleccionado);
    }
  };
} 