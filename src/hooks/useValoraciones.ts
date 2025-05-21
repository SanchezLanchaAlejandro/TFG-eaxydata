import { useState, useEffect, useCallback } from 'react';
import { useSupabaseData } from './useSupabaseData';
import { supabase } from '@/lib/supabase';
import { Valoracion as ValoracionUI } from '@/components/Valoraciones/types';

// Definición del tipo para las valoraciones
export type Valoracion = {
  id: string;
  workshop_id: string | number | null;
  usuario_id: string;
  matricula: string;
  chasis: string;
  motorizacion: string;
  fecha_primera_matriculacion: string | null;
  tipo_poliza: string | null;
  aseguradora: string | null;
  estado: 'pendiente' | 'en_curso' | 'finalizado';
  fecha_creacion: string;
  fecha_finalizado: string | null;
  url_pdf: string | null;
  siniestro_total: boolean;
  fecha_ult_act: string | null;
  valorador_id: string | null;
};

// Definición del tipo para las fotos de valoraciones
export type FotosValoracion = {
  id: string;
  valoracion_id: string;
  ficha_tecnica_1: string | null;
  ficha_tecnica_2: string | null;
  ficha_tecnica_3: string | null;
  ficha_tecnica_4: string | null;
  kilometros: string | null;
  delantera_izquierda: string | null;
  delantera_derecha: string | null;
  trasera_izquierda: string | null;
  trasera_derecha: string | null;
  dano_adicional_1: string | null;
  dano_adicional_2: string | null;
  dano_adicional_3: string | null;
  dano_adicional_4: string | null;
  dano_adicional_5: string | null;
  dano_adicional_6: string | null;
  dano_adicional_7: string | null;
  dano_adicional_8: string | null;
  dano_adicional_9: string | null;
  dano_adicional_10: string | null;
  dano_siniestro_1: string | null;
  dano_siniestro_2: string | null;
  dano_siniestro_3: string | null;
  dano_siniestro_4: string | null;
  dano_siniestro_5: string | null;
  dano_siniestro_6: string | null;
  dano_siniestro_7: string | null;
  dano_siniestro_8: string | null;
  dano_siniestro_9: string | null;
  dano_siniestro_10: string | null;
  dano_siniestro_11: string | null;
  dano_siniestro_12: string | null;
  dano_siniestro_13: string | null;
  dano_siniestro_14: string | null;
  dano_siniestro_15: string | null;
  dano_siniestro_16: string | null;
  dano_siniestro_17: string | null;
  dano_siniestro_18: string | null;
  dano_siniestro_19: string | null;
  dano_siniestro_20: string | null;
  fecha_creacion: string;
};

// Tipo para las fotos procesadas para visualización
export type FotosProcesadas = {
  documentacion: Array<{url: string, columna: string}>;
  generales: Array<{url: string, columna: string}>;
  danos: Array<{url: string, columna: string}>;
  siniestro: Array<{url: string, columna: string}>;
};

// Tipo para manejar los archivos de foto y sus metadatos
export type FotoFile = {
  file: File;
  tipo: string;  // Tipo de foto (ficha_tecnica_1, kilometros, etc.)
  fieldName: string; // Nombre del campo en la DB
};

export function useValoraciones() {
  const [valoraciones, setValoraciones] = useState<Valoracion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userProfile } = useSupabaseData();
  // Caché simple para almacenar resultados de fotos por valoración
  const [cacheFotos, setCacheFotos] = useState<Record<string, { timestamp: number, data: FotosProcesadas | null }>>({});
  
  // Duración de la caché en milisegundos (5 minutos)
  const CACHE_DURATION = 5 * 60 * 1000;

  // Función para obtener valoraciones basadas en el rol y los permisos del usuario
  const fetchValoraciones = useCallback(async () => {
    if (!userProfile) return;

    try {
      setLoading(true);
      setError(null);
      
      // Si el usuario es Super Admin pero tiene un network_id, forzamos el rol de Gestor Red para filtrar
      let rolEfectivo = userProfile.role;
      if (userProfile.role === 'SUPER_ADMIN' && userProfile.network_id) {
        rolEfectivo = 'GESTOR_RED';
      }
      
      let query = supabase.from('valoraciones').select('*');
      
      // Aplicamos los filtros según el rol del usuario
      if (rolEfectivo === 'GESTOR_TALLER') {
        // Para gestores de taller, solo vemos valoraciones de su taller
        if (userProfile.workshop_id) {
          query = query.eq('workshop_id', userProfile.workshop_id);
        } else {
          // Si no tiene workshop_id, no debería ver nada
          setValoraciones([]);
          setLoading(false);
          return;
        }
      } else if (rolEfectivo === 'GESTOR_RED') {
        // Para gestores de red, consultamos talleres de su red
        if (userProfile.network_id) {
          // Primero consultamos la tabla de red para verificar su existencia
          const { data: redInfo, error: redError } = await supabase
            .from('networks')
            .select('id')
            .eq('id', userProfile.network_id)
            .single();
            
          if (redError) {
            console.error('Error o red no encontrada:', redError);
          }
          
          // Primero obtenemos los talleres que pertenecen a su red
          const { data: talleres, error: errorTalleres } = await supabase
            .from('workshops')
            .select('id')
            .eq('network_id', userProfile.network_id);
            
          if (errorTalleres) {
            console.error('Error al buscar talleres:', errorTalleres);
            throw errorTalleres;
          }
          
          if (talleres && talleres.length > 0) {
            const tallerIds = talleres.map(taller => taller.id);
            
            if (tallerIds.length === 1) {
              // Si solo hay un taller, usamos eq en lugar de in
              query = query.eq('workshop_id', tallerIds[0]);
            } else {
              // Si hay múltiples talleres, usamos in
              query = query.in('workshop_id', tallerIds);
            }
          } else {
            // Si no hay talleres en la red, no debería ver nada
            setValoraciones([]);
            setLoading(false);
            return;
          }
        } else {
          // Si no tiene network_id, no debería ver nada
          setValoraciones([]);
          setLoading(false);
          return;
        }
      }
      
      const { data, error: errorQuery } = await query
        .order('fecha_creacion', { ascending: false });
      
      if (errorQuery) {
        console.error('Error en la consulta:', errorQuery);
        throw errorQuery;
      }
      
      setValoraciones(data || []);
    } catch (err: any) {
      console.error('Error al obtener valoraciones:', err);
      setError(err.message || 'Error al cargar las valoraciones');
    } finally {
      setLoading(false);
    }
  }, [userProfile]);

  // Función para subir un archivo al bucket de Supabase
  const subirFotoABucket = async (file: File, matricula: string, fileName: string): Promise<string | null> => {
    try {
      // Creamos la ruta dentro del bucket (carpeta con la matrícula)
      const filePath = `${matricula}/${fileName}`;
      
      // Subimos el archivo al bucket
      const { data, error } = await supabase.storage
        .from('fotos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) {
        console.error('Error al subir archivo:', error);
        throw error;
      }
      
      // Obtenemos la URL firmada del archivo (en lugar de pública)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('fotos')
        .createSignedUrl(filePath, 12 * 60 * 60); // URL válida por 12 horas
      
      if (signedUrlError) {
        console.error('Error al obtener URL firmada:', signedUrlError);
        throw signedUrlError;
      }
      
      return signedUrlData?.signedUrl || null;
    } catch (err: any) {
      console.error('Error en subirFotoABucket:', err);
      return null;
    }
  };
  
  // Función para subir múltiples fotos al bucket con un solo método
  const subirFotosABucket = async (fotos: Record<string, File>, matricula: string): Promise<Record<string, string>> => {
    const results: Record<string, string> = {};
    
    try {
      // Procesar cada foto en secuencia
      for (const [key, file] of Object.entries(fotos)) {
        // Generamos un nombre único para el archivo
        const extension = file.name.split('.').pop() || 'jpg';
        const fileName = `${key}-${Date.now()}.${extension}`;
        
        // Subimos el archivo
        const url = await subirFotoABucket(file, matricula, fileName);
        
        // Si se obtuvo una URL, la guardamos
        if (url) {
          results[key] = url;
        }
      }
      
      return results;
    } catch (err: any) {
      console.error('Error en subirFotosABucket:', err);
      return results; // Devolvemos lo que se pudo subir
    }
  };
  
  // Función mejorada para crear valoración con fotos
  const crearValoracionConFotos = async (
    datosValoracion: {
      matricula: string;
      chasis: string;
      motorizacion: string;
      tipoPoliza: string;
      aseguradora: string;
      fechaPrimeraMatriculacion: string;
      workshop_id?: string | number;
    },
    fotos: Record<string, File>
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      // 1. Crear valoración con estado "pendiente"
      const { data: valoracionCreada, error: errorCreacion } = await supabase
        .from('valoraciones')
        .insert({
          matricula: datosValoracion.matricula,
          chasis: datosValoracion.chasis,
          motorizacion: datosValoracion.motorizacion,
          tipo_poliza: datosValoracion.tipoPoliza,
          aseguradora: datosValoracion.aseguradora,
          fecha_primera_matriculacion: datosValoracion.fechaPrimeraMatriculacion,
          estado: 'Pendiente',
          workshop_id: datosValoracion.workshop_id || userProfile?.workshop_id || null,
          usuario_id: userProfile?.id || '',
          fecha_creacion: new Date().toISOString(),
          siniestro_total: false
        })
        .select()
        .single();
      
      if (errorCreacion) {
        console.error('Error al crear valoración:', errorCreacion);
        throw errorCreacion;
      }
      
      if (!valoracionCreada) {
        throw new Error('No se pudo crear la valoración');
      }
      
      // 2. Si hay fotos, las subimos al bucket y creamos el registro en fotos_valoraciones
      if (Object.keys(fotos).length > 0) {
        try {
          // Mapeo correcto entre IDs de inputs del formulario y campos de la BD
          const camposMapping: Record<string, string> = {
            'foto-ficha-tecnica-1': 'ficha_tecnica_1',
            'foto-ficha-tecnica-2': 'ficha_tecnica_2',
            'foto-ficha-tecnica-3': 'ficha_tecnica_3',
            'foto-ficha-tecnica-4': 'ficha_tecnica_4',
            'foto-cuentakilometros': 'kilometros',
            'foto-delantera-derecha': 'delantera_derecha',
            'foto-delantera-izquierda': 'delantera_izquierda',
            'foto-trasera-derecha': 'trasera_derecha',
            'foto-trasera-izquierda': 'trasera_izquierda', 
            'foto-dano-1': 'dano_adicional_1',
            'foto-dano-2': 'dano_adicional_2',
            'foto-dano-3': 'dano_adicional_3',
            'foto-dano-4': 'dano_adicional_4',
            'foto-dano-5': 'dano_adicional_5',
            'foto-dano-6': 'dano_adicional_6',
            'foto-dano-7': 'dano_adicional_7',
            'foto-dano-8': 'dano_adicional_8',
            'foto-dano-9': 'dano_adicional_9',
            'foto-dano-10': 'dano_adicional_10'
          };
          
          // Objeto para almacenar las URLs de las fotos subidas
          const fotosUrls: Record<string, string> = {};
          
          // Para cada foto, la subimos al bucket
          for (const [idInput, file] of Object.entries(fotos)) {
            const columnName = camposMapping[idInput];
            if (!columnName) continue;
            
            const extension = file.name.split('.').pop() || 'jpg';
            const fileName = `${columnName}_${Date.now()}.${extension}`;
            
            // Subir la foto al bucket y obtener la URL
            const url = await subirFotoABucket(file, valoracionCreada.matricula, fileName);
            if (url) {
              fotosUrls[columnName] = url;
            }
          }
          
          // Si se subieron fotos, creamos el registro en fotos_valoraciones
          if (Object.keys(fotosUrls).length > 0) {
            const { data: fotosCreadas, error: errorFotos } = await supabase
              .from('fotos_valoraciones')
              .insert({
                valoracion_id: valoracionCreada.id,
                ...fotosUrls
              });
            
            if (errorFotos) {
              console.error('Error al guardar las fotos en la base de datos:', errorFotos);
              // No lanzamos error, continua el flujo aunque falle el guardado de fotos
            }
          }
        } catch (err: any) {
          console.error('Error al procesar las fotos:', err);
          // No lanzamos error, continua el flujo aunque falle la subida
        }
      }
      
      // 3. Añadir valoración a la lista local
      fetchValoraciones();
      
      return { success: true, data: valoracionCreada };
    } catch (err: any) {
      console.error('Error al crear la valoración con fotos:', err);
      setError(err.message || 'Error al crear la valoración');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Cargar valoraciones cuando el perfil de usuario esté disponible
  useEffect(() => {
    if (userProfile) {
      fetchValoraciones();
    }
  }, [userProfile, fetchValoraciones]);
  
  // Función para actualizar el estado de una valoración
  const actualizarEstadoValoracion = async (id: string, nuevoEstado: 'pendiente' | 'en_curso' | 'finalizado') => {
    return updateValoracionEstado(id, { nuevoEstado });
  };
  
  // Función para actualizar el estado de una valoración
  const updateValoracionEstado = async (
    id: string, 
    options: { 
      nuevoEstado?: 'pendiente' | 'en_curso' | 'finalizado';
      valoradorId?: string | null;
    }
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      // Verificar estado actual de la valoración si se necesita para reglas de negocio
      const { data: valoracionActual, error: errorConsulta } = await supabase
        .from('valoraciones')
        .select('*')
        .eq('id', id)
        .single();
      
      if (errorConsulta) throw errorConsulta;
      
      const campos: Record<string, any> = {};
      
      // Procesar el nuevo estado si se especifica
      if (options.nuevoEstado) {
        // Convertir los estados de la UI al formato de la BD
        const estadosBDMapping: Record<string, string> = {
          'pendiente': 'Pendiente',
          'en_curso': 'En curso',
          'finalizado': 'Finalizado'
        };
        
        campos.estado = estadosBDMapping[options.nuevoEstado];
        
        // Si cambia a finalizado, guardar la fecha
        if (options.nuevoEstado === 'finalizado') {
          campos.fecha_finalizado = new Date().toISOString();
        }
      }
      
      // Implementar reglas de negocio para los flujos:
      
      // 1. Si se asigna un valorador, automáticamente pasar a estado "en curso"
      if (options.valoradorId !== undefined && options.valoradorId !== null && !options.nuevoEstado) {
        campos.valorador_id = options.valoradorId;
        campos.estado = 'En curso';
      } 
      // 2. Si se quita el valorador (cambio a null), poner estado a pendiente
      else if (options.valoradorId === null) {
        campos.valorador_id = null;
        
        // Solo cambiar estado si está "en curso" actualmente
        if (valoracionActual && convertirEstadoBDaUI(valoracionActual.estado) === 'en_curso') {
          campos.estado = 'Pendiente';
        }
      }
      // 3. Si se cambia a estado "pendiente", quitar el valorador automáticamente
      else if (options.nuevoEstado === 'pendiente') {
        campos.valorador_id = null;
      }
      // 4. Si se especifica valorador y estado, usar ambos valores
      else if (options.valoradorId !== undefined && options.nuevoEstado) {
        campos.valorador_id = options.valoradorId;
      }
      
      const { data, error } = await supabase
        .from('valoraciones')
        .update(campos)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Actualizar la valoración en el estado local
      if (data) {
        setValoraciones(prevValoraciones => 
          prevValoraciones.map(val => val.id === id ? data : val)
        );
      }
      
      return { success: true, data };
    } catch (err: any) {
      console.error('Error al actualizar valoración:', err);
      setError(err.message || 'Error al actualizar la valoración');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };
  
  // Función para obtener una valoración específica
  const obtenerValoracion = async (id: string) => {
    try {
      setLoading(true);
      
      // Consultar valoración con todos sus campos, incluyendo explícitamente valorador_id
      const { data, error } = await supabase
        .from('valoraciones')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      // Si tenemos datos, nos aseguramos de mapear correctamente los campos
      // para el formato que espera el componente VistaDetalleValoracion (ValoracionUI)
      if (data) {
        // Convertir del tipo Valoracion (BD) a ValoracionUI (componente)
        const valoracionBase = {
          id: data.id,
          matricula: data.matricula,
          chasis: data.chasis,
          motorizacion: data.motorizacion,
          tipoPoliza: data.tipo_poliza || '',
          aseguradora: data.aseguradora || '',
          fechaPrimeraMatriculacion: data.fecha_primera_matriculacion || '',
          fotos: [], // Se cargan por separado
          estado: convertirEstadoBDaUI(data.estado),
          esSiniestroTotal: data.siniestro_total || false,
          fecha_creacion: data.fecha_creacion,
          fecha_ult_act: data.fecha_ult_act || undefined,
          fecha_finalizado: data.fecha_finalizado || undefined,
          valorador_id: data.valorador_id // Pasar el valorador_id tal cual viene de la BD
        };
        
        // Crear el objeto final con el tipo correcto
        const valoracionFormateada: ValoracionUI = valoracionBase;
        
        // Añadir workshop_id solo si existe y no es null
        if (typeof data.workshop_id === 'string' || typeof data.workshop_id === 'number') {
          valoracionFormateada.workshop_id = data.workshop_id;
        }
        
        return { success: true, data: valoracionFormateada };
      }
      
      return { success: true, data: null };
    } catch (err: any) {
      console.error('Error al obtener la valoración:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };
  
  // Función para eliminar una valoración
  const eliminarValoracion = async (id: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('valoraciones')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Actualizar la lista de valoraciones
      setValoraciones(prevValoraciones => 
        prevValoraciones.filter(val => val.id !== id)
      );
      
      return { success: true };
    } catch (err: any) {
      console.error('Error al eliminar la valoración:', err);
      setError(err.message || 'Error al eliminar la valoración');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener las fotos de una valoración
  const obtenerFotosValoracion = async (valoracionId: string) => {
    try {
      // Revisar si hay datos en la caché y si son válidos
      const cacheDatos = cacheFotos[valoracionId];
      if (cacheDatos && Date.now() - cacheDatos.timestamp < CACHE_DURATION) {
        return { success: true, data: cacheDatos.data };
      }
      
      // Si no hay en caché o expiró, obtener de la base de datos
      const { data, error } = await supabase
        .from('fotos_valoraciones')
        .select('*')
        .eq('valoracion_id', valoracionId)
        .single();
      
      if (error) {
        // Si el error es que no hay datos, devolvemos success pero con data null
        if (error.code === 'PGRST116') {
          // Guardar en caché que no hay fotos
          setCacheFotos(prev => ({
            ...prev,
            [valoracionId]: { timestamp: Date.now(), data: null }
          }));
          return { success: true, data: null };
        }
        throw error;
      }
      
      if (!data) {
        // Guardar en caché que no hay fotos
        setCacheFotos(prev => ({
          ...prev,
          [valoracionId]: { timestamp: Date.now(), data: null }
        }));
        return { success: true, data: null };
      }
      
      // Función para verificar si una URL firmada ha expirado y regenerarla si es necesario
      const verificarYRegenerarUrl = async (url: string | null): Promise<string | null> => {
        if (!url) return null;
        
        // Extraer el path del archivo desde la URL firmada
        try {
          // Buscar la parte después de 'fotos/'
          const regex = /fotos\/([^?]+)/;
          const match = url.match(regex);
          
          if (!match || !match[1]) return url; // Si no podemos extraer el path, devolver la URL original
          
          const filePath = match[1];
          
          // Crear una nueva URL firmada con duración de 12 horas
          const { data, error } = await supabase.storage
            .from('fotos')
            .createSignedUrl(filePath, 12 * 60 * 60);
          
          if (error || !data) {
            console.error('Error al regenerar URL firmada:', error);
            return url; // Si hay error, devolver la URL original
          }
          
          return data.signedUrl;
        } catch (err) {
          console.error('Error al procesar URL:', err);
          return url; // En caso de error, devolver la URL original
        }
      };
      
      // Categorizar y procesar fotos
      const fotosProcesadas: FotosProcesadas = {
        documentacion: [],
        generales: [],
        danos: [],
        siniestro: []
      };
      
      // Procesar cada campo de la respuesta
      for (const [campo, valor] of Object.entries(data)) {
        // Ignorar campos que no son fotos
        if (campo === 'id' || campo === 'valoracion_id' || campo === 'fecha_creacion') continue;
        if (!valor) continue; // Ignorar valores nulos
        
        // Verificar y regenerar URL si es necesario
        const url = await verificarYRegenerarUrl(valor as string);
        if (!url) continue;
        
        // Categorizar según el tipo de foto
        if (campo.startsWith('ficha_tecnica')) {
          fotosProcesadas.documentacion.push({ url, columna: campo });
        } else if (campo === 'kilometros' || campo.includes('delantera') || campo.includes('trasera')) {
          fotosProcesadas.generales.push({ url, columna: campo });
        } else if (campo.startsWith('dano_adicional')) {
          fotosProcesadas.danos.push({ url, columna: campo });
        } else if (campo.startsWith('dano_siniestro')) {
          fotosProcesadas.siniestro.push({ url, columna: campo });
        }
      }
      
      // Guardar en caché las fotos procesadas
      setCacheFotos(prev => ({
        ...prev,
        [valoracionId]: { timestamp: Date.now(), data: fotosProcesadas }
      }));
      
      return { success: true, data: fotosProcesadas };
    } catch (err: any) {
      console.error('Error al obtener fotos de valoración:', err);
      return { success: false, error: err.message };
    }
  };

  // Función para guardar fotos de valoración
  const guardarFotosValoracion = async (valoracionId: string, fotos: Partial<FotosValoracion>) => {
    try {
      setLoading(true);
      
      // 1. Verificar primero si ya existe un registro de fotos para esta valoración
      const { data: existingData, error: checkError } = await supabase
        .from('fotos_valoraciones')
        .select('id')
        .eq('valoracion_id', valoracionId)
        .maybeSingle();
      
      if (checkError && checkError.code !== 'PGRST116') throw checkError;
      
      let result;
      
      // Si ya existe un registro, actualizar
      if (existingData) {
        result = await supabase
          .from('fotos_valoraciones')
          .update(fotos)
          .eq('valoracion_id', valoracionId);
      } else {
        // Si no existe, crear uno nuevo
        result = await supabase
          .from('fotos_valoraciones')
          .insert({
            valoracion_id: valoracionId,
            ...fotos
          });
      }
      
      if (result.error) throw result.error;
      
      // Invalidar la caché para esta valoración
      setCacheFotos(prev => {
        const newCache = { ...prev };
        delete newCache[valoracionId];
        return newCache;
      });
      
      return { success: true };
    } catch (err: any) {
      console.error('Error al guardar fotos de valoración:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };
  
  // Función para marcar una valoración como siniestro total
  const marcarSiniestroTotal = async (valoracionId: string) => {
    try {
      setLoading(true);
      
      // Actualizar el campo siniestro_total a true
      const { error } = await supabase
        .from('valoraciones')
        .update({ 
          siniestro_total: true
        })
        .eq('id', valoracionId);
      
      if (error) throw error;
      
      // Actualizar la valoración en el estado local
      setValoraciones(prevValoraciones => 
        prevValoraciones.map(val => {
          if (val.id === valoracionId) {
            return {
              ...val,
              siniestro_total: true
            };
          }
          return val;
        })
      );
      
      return { success: true };
    } catch (err: any) {
      console.error('Error al marcar como siniestro total:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };
  
  // Función específica para asignar valorador (asignarse a sí mismo)
  const asignarValoradorId = async (valoracionId: string) => {
    try {
      // Usar el ID del usuario autenticado (valorador) como valorador_id
      if (!userProfile?.id) {
        return { 
          success: false, 
          error: 'No se pudo determinar el ID del valorador'
        };
      }
      
      // Llamar a la función general de actualización con la lógica adecuada
      const result = await updateValoracionEstado(valoracionId, {
        valoradorId: userProfile.id
      });
      
      // Formatear los datos igual que antes, pero usando result.data
      if (result.data) {
        // Similar a obtenerValoracion, formatear los datos al tipo ValoracionUI
        const valoracionFormateada: ValoracionUI = {
          id: result.data.id,
          matricula: result.data.matricula,
          chasis: result.data.chasis,
          motorizacion: result.data.motorizacion,
          tipoPoliza: result.data.tipo_poliza || '',
          aseguradora: result.data.aseguradora || '',
          fechaPrimeraMatriculacion: result.data.fecha_primera_matriculacion || '',
          fotos: [], // Se cargan por separado
          estado: convertirEstadoBDaUI(result.data.estado),
          esSiniestroTotal: result.data.siniestro_total || false,
          fecha_creacion: result.data.fecha_creacion,
          fecha_ult_act: result.data.fecha_ult_act || undefined,
          fecha_finalizado: result.data.fecha_finalizado || undefined,
          valorador_id: result.data.valorador_id
        };
        
        // Añadir workshop_id solo si es un tipo válido
        if (typeof result.data.workshop_id === 'string' || typeof result.data.workshop_id === 'number') {
          valoracionFormateada.workshop_id = result.data.workshop_id;
        }
        
        return { success: true, data: valoracionFormateada };
      }
      
      return { success: true, data: null };
    } catch (err: any) {
      console.error('Error al asignar valorador:', err);
      return { 
        success: false, 
        error: err.message || 'Error al asignar valorador a la valoración'
      };
    }
  };

  // Función específica para desasignar valorador (quitar valorador_id)
  const desasignarValoradorId = async (valoracionId: string) => {
    try {
      const result = await updateValoracionEstado(valoracionId, {
        valoradorId: null
      });
      
      return result;
    } catch (err: any) {
      console.error('Error al desasignar valorador:', err);
      return { 
        success: false, 
        error: err.message || 'Error al desasignar valorador de la valoración'
      };
    }
  };
  
  // Función utilitaria para convertir estados de la BD a la UI
  const convertirEstadoBDaUI = (estadoBD: string): 'pendiente' | 'en_curso' | 'finalizado' => {
    const estadoBDLower = estadoBD.toLowerCase();
    
    if (estadoBDLower.includes('curso')) return 'en_curso';
    if (estadoBDLower.includes('final')) return 'finalizado';
    return 'pendiente';
  };
  
  // Función para obtener el nombre del valorador a partir de su ID
  const obtenerNombreValorador = async (valoradorId: string) => {
    try {
      // Consultar la tabla de usuarios para obtener el nombre del valorador
      const { data, error } = await supabase
        .from('users')
        .select('nombre')
        .eq('id', valoradorId)
        .single();
      
      if (error) throw error;
      
      if (!data || !data.nombre) {
        return {
          success: true,
          nombre: 'Valorador sin nombre'
        };
      }
      
      // Solo usar el nombre
      const nombreCompleto = data.nombre || '';
      
      return {
        success: true,
        nombre: nombreCompleto || 'Valorador sin nombre'
      };
    } catch (err: any) {
      console.error('Error al obtener nombre del valorador:', err);
      return {
        success: false,
        error: err.message,
        nombre: 'Error al obtener nombre'
      };
    }
  };
  
  // Función para guardar un informe HTML en la tabla informes_valoraciones
  const guardarInformeValoracion = async (valoracionId: string, contenidoHtml: string) => {
    try {
      setLoading(true);
      
      // Verificar si ya existe un registro para esta valoración
      const { data: existingInforme, error: errorConsulta } = await supabase
        .from('informes_valoraciones')
        .select('id')
        .eq('valoracion_id', valoracionId)
        .maybeSingle();
      
      if (errorConsulta && errorConsulta.code !== 'PGRST116') throw errorConsulta;
      
      let result;
      
      // Si ya existe, actualizar
      if (existingInforme) {
        result = await supabase
          .from('informes_valoraciones')
          .update({
            contenido_html: contenidoHtml,
            fecha_actualizacion: new Date().toISOString(),
            generado_por: userProfile?.id || null
          })
          .eq('valoracion_id', valoracionId);
      } else {
        // Si no existe, crear
        result = await supabase
          .from('informes_valoraciones')
          .insert({
            valoracion_id: valoracionId,
            contenido_html: contenidoHtml,
            generado_por: userProfile?.id || null
            // created_at se genera automáticamente
          });
      }
      
      if (result.error) throw result.error;
      
      // Actualizar la fecha de última actualización en la valoración
      const { error: updateError } = await supabase
        .from('valoraciones')
        .update({
          fecha_ult_act: new Date().toISOString()
        })
        .eq('id', valoracionId);
      
      if (updateError) throw updateError;
      
      // Actualizar valoración en el estado local
      setValoraciones(prev => 
        prev.map(v => 
          v.id === valoracionId 
            ? {...v, fecha_ult_act: new Date().toISOString()} 
            : v
        )
      );
      
      return { success: true };
    } catch (err: any) {
      console.error('Error al guardar informe de valoración:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };
  
  // Función para obtener el informe HTML de una valoración
  const obtenerInformeValoracion = async (valoracionId: string) => {
    try {
      // Consultar directamente la tabla informes_valoraciones para obtener el contenido HTML
      const { data: informe, error: errorInforme } = await supabase
        .from('informes_valoraciones')
        .select('contenido_html')
        .eq('valoracion_id', valoracionId)
        .single();
      
      if (errorInforme) {
        // Si el error es que no hay datos, devolvemos success pero con data null
        if (errorInforme.code === 'PGRST116') {
          return { success: true, data: null }; // No hay informe
        }
        throw errorInforme;
      }
      
      if (!informe || !informe.contenido_html) {
        return { success: true, data: null }; // Existe el registro pero sin contenido
      }
      
      // Devolver directamente el contenido HTML
      return { success: true, data: informe.contenido_html };
    } catch (err: any) {
      console.error('Error al obtener informe de valoración:', err);
      return { success: false, error: err.message };
    }
  };

  return {
    valoraciones,
    loading,
    error,
    fetchValoraciones,
    crearValoracion: crearValoracionConFotos,
    actualizarEstadoValoracion,
    updateValoracionEstado,
    obtenerValoracion,
    eliminarValoracion,
    obtenerFotosValoracion,
    guardarFotosValoracion,
    marcarSiniestroTotal,
    asignarValoradorId,
    desasignarValoradorId,
    subirFotoABucket,
    subirFotosABucket,
    obtenerNombreValorador,
    guardarInformeValoracion,
    obtenerInformeValoracion
  };
} 