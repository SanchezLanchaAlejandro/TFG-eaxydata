import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import supabase from '@/lib/supabase';
import { FiltrosIndicadoresState } from '@/components/Indicadores/FiltrosIndicadores';

// Tipos para los datos de indicadores
export interface IndicadoresData {
  // Horas de trabajo
  horasMecanica: number;
  horasChapa: number;
  horasPintura: number;
  
  // Órdenes de reparación
  orMecanica: number;
  orCarroceria: number;
  
  // Materiales
  materialPintura: number;
  materialAnexos: number;
  
  // Totales
  totalMateriales: number;
  totalManoObra: number;
  totalFacturas: number;
  
  // Totales por tipo
  totalMaterialesMecanica: number;
  totalManoObraMecanica: number;
  totalMaterialesCarroceria: number;
  totalManoObraCarroceria: number;
}

// Estado del hook
interface IndicadoresState {
  data: IndicadoresData | null;
  loading: boolean;
  error: string | null;
}

// Estado inicial
const initialState: IndicadoresState = {
  data: null,
  loading: true,
  error: null
};

// Inicialización de datos vacíos
const emptyData: IndicadoresData = {
  horasMecanica: 0,
  horasChapa: 0,
  horasPintura: 0,
  orMecanica: 0,
  orCarroceria: 0,
  materialPintura: 0,
  materialAnexos: 0,
  totalMateriales: 0,
  totalManoObra: 0,
  totalFacturas: 0,
  totalMaterialesMecanica: 0,
  totalManoObraMecanica: 0,
  totalMaterialesCarroceria: 0,
  totalManoObraCarroceria: 0
};

export function useIndicadores(filtros: FiltrosIndicadoresState) {
  const [state, setState] = useState<IndicadoresState>(initialState);
  
  // Referencia para evitar múltiples cargas
  const isFetching = useRef(false);
  const lastTallerId = useRef<string | number | null>(null);
  const lastFechaDesde = useRef<string | null>(null);
  const lastFechaHasta = useRef<string | null>(null);

  // Función para generar la condición de fecha basada en los filtros
  const condicionFecha = useMemo(() => {
    if (filtros.modoTemporal === 'rango' && filtros.fechaDesde) {
      // Si tenemos un rango de fechas
      if (filtros.fechaHasta) {
        return {
          fechaDesde: filtros.fechaDesde,
          fechaHasta: filtros.fechaHasta
        };
      } else {
        // Solo tenemos fecha desde
        return {
          fechaDesde: filtros.fechaDesde,
          fechaHasta: new Date().toISOString().split('T')[0] // Hoy
        };
      }
    } else if (filtros.modoTemporal === 'mesAnio' && filtros.mes !== null && filtros.anio !== null) {
      // Si tenemos mes y año
      const mes = filtros.mes;
      const anio = filtros.anio;
      
      // Crear fecha de inicio (primer día del mes)
      const fechaDesde = new Date(anio, mes, 1).toISOString().split('T')[0];
      
      // Crear fecha de fin (último día del mes)
      const fechaHasta = new Date(anio, mes + 1, 0).toISOString().split('T')[0];
      
      return { fechaDesde, fechaHasta };
    } else {
      // Por defecto, último mes
      const hoy = new Date();
      const unMesAtras = new Date();
      unMesAtras.setMonth(hoy.getMonth() - 1);
      
      return {
        fechaDesde: unMesAtras.toISOString().split('T')[0],
        fechaHasta: hoy.toISOString().split('T')[0]
      };
    }
  }, [filtros.modoTemporal, filtros.fechaDesde, filtros.fechaHasta, filtros.mes, filtros.anio]);

  // Obtener los datos de los indicadores
  const fetchIndicadores = useCallback(async (forceRefresh = false) => {
    // Si no hay taller seleccionado, no podemos obtener datos
    if (!filtros.taller) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    
    // Evitar múltiples peticiones simultáneas
    if (isFetching.current) return;
    
    // Verificar si necesitamos recargar o podemos usar datos en caché
    if (!forceRefresh && 
        lastTallerId.current === filtros.taller && 
        lastFechaDesde.current === condicionFecha.fechaDesde &&
        lastFechaHasta.current === condicionFecha.fechaHasta) {
      return; // Evitar recarga innecesaria
    }

    try {
      isFetching.current = true;
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Guardar referencias de los parámetros actuales
      lastTallerId.current = filtros.taller;
      lastFechaDesde.current = condicionFecha.fechaDesde;
      lastFechaHasta.current = condicionFecha.fechaHasta;
      
      // Consultar directamente a la tabla kpis para obtener los indicadores
      const { data: kpisData, error: kpisError } = await supabase
        .from('kpis')
        .select('*')
        .eq('workshop_id', filtros.taller)
        .gte('fecha', condicionFecha.fechaDesde)
        .lte('fecha', condicionFecha.fechaHasta);
      
      if (kpisError) throw kpisError;
      
      // Si no hay datos, devolver datos vacíos
      if (!kpisData || kpisData.length === 0) {
        setState({
          data: emptyData,
          loading: false,
          error: null
        });
        return;
      }
      
      // Sumar los valores de todos los registros en el período seleccionado
      let horasMecanica = 0;
      let horasChapa = 0;
      let horasPintura = 0;
      let orMecanica = 0;
      let orCarroceria = 0;
      let materialPintura = 0;
      let materialAnexos = 0;
      let totalMateriales = 0;
      let totalManoObra = 0;
      let totalFacturas = 0;
      let totalMaterialesMecanica = 0;
      let totalManoObraMecanica = 0;
      let totalMaterialesCarroceria = 0;
      let totalManoObraCarroceria = 0;
      
      kpisData.forEach(kpi => {
        // Sumar horas (usando los nombres correctos de los campos)
        horasMecanica += kpi.mo_mecanica || 0;
        horasChapa += kpi.mo_chapa || 0;
        horasPintura += kpi.mo_pintura || 0;
        
        // Sumar órdenes de reparación
        orMecanica += kpi.or_mecanica || 0;
        orCarroceria += kpi.or_carroceria || 0;
        
        // Sumar materiales
        materialPintura += kpi.material_pintura || 0;
        materialAnexos += kpi.material_anexos || 0;
        
        // Sumar totales
        totalMateriales += kpi.total_materiales || 0;
        totalManoObra += kpi.total_mano_obra || 0;
        totalFacturas += kpi.total_facturas || 0;
        
        // Sumar totales por tipo (mecánica y carrocería)
        totalMaterialesMecanica += kpi.materiales_mecanica || 0;
        totalManoObraMecanica += kpi.mo_mecanica || 0;
        totalMaterialesCarroceria += (kpi.material_pintura || 0) + (kpi.material_anexos || 0);
        totalManoObraCarroceria += (kpi.mo_chapa || 0) + (kpi.mo_pintura || 0);
      });
      
      // Crear objeto con datos procesados
      const indicadoresData: IndicadoresData = {
        horasMecanica,
        horasChapa,
        horasPintura,
        orMecanica,
        orCarroceria,
        materialPintura,
        materialAnexos,
        totalMateriales,
        totalManoObra,
        totalFacturas,
        totalMaterialesMecanica,
        totalManoObraMecanica,
        totalMaterialesCarroceria,
        totalManoObraCarroceria
      };
      
      setState({
        data: indicadoresData,
        loading: false,
        error: null
      });
    } catch (err: any) {
      console.error('Error al obtener los indicadores:', err);
      setState({
        data: null,
        loading: false,
        error: err.message || 'Error al obtener los indicadores'
      });
    } finally {
      isFetching.current = false;
    }
  }, [filtros.taller, condicionFecha]);

  // Efecto para cargar los datos cuando cambian los filtros importantes
  useEffect(() => {
    fetchIndicadores();
  }, [filtros.taller, condicionFecha.fechaDesde, condicionFecha.fechaHasta]);

  // Cálculo de los ratios
  const ratios = useMemo(() => {
    if (!state.data) return null;
    
    const {
      horasMecanica,
      horasChapa,
      horasPintura,
      orMecanica,
      orCarroceria,
      materialPintura,
      materialAnexos,
      totalMaterialesMecanica,
      totalManoObraMecanica,
      totalMaterialesCarroceria,
      totalManoObraCarroceria
    } = state.data;
    
    // Evitar divisiones por cero
    const ratioHorasMecanicaPorOR = orMecanica > 0 
      ? (horasMecanica / orMecanica) 
      : 0;
    
    const ratioHorasChapaPinturaPorOR = orCarroceria > 0 
      ? ((horasChapa + horasPintura) / orCarroceria) 
      : 0;
    
    // Ticket medio mecánica: (materiales_mecanica + mo_mecanica) / or_mecanica
    const ticketMedioMecanica = orMecanica > 0 
      ? ((totalMaterialesMecanica + totalManoObraMecanica) / orMecanica) 
      : 0;
    
    // Ticket medio carrocería: (materiales_carrocería + mo_carroceria) / or_carroceria
    const ticketMedioCarroceria = orCarroceria > 0 
      ? ((totalMaterialesCarroceria + totalManoObraCarroceria) / orCarroceria) 
      : 0;
    
    const eficienciaMaterialPintura = horasPintura > 0 
      ? ((materialPintura + materialAnexos) / horasPintura) 
      : 0;
    
    const eficienciaMaterialPorOR = orCarroceria > 0 
      ? ((materialPintura + materialAnexos) / orCarroceria) 
      : 0;
    
    return {
      ratioHorasMecanicaPorOR,
      ratioHorasChapaPinturaPorOR,
      ticketMedioMecanica,
      ticketMedioCarroceria,
      eficienciaMaterialPintura,
      eficienciaMaterialPorOR
    };
  }, [state.data]);

  return {
    ...state,
    ratios,
    recargar: () => fetchIndicadores(true)
  };
} 