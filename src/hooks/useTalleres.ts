import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useSupabaseData } from '@/hooks/useSupabaseData';

// Definición del tipo para taller simplificado
export interface Taller {
  id: string | number;
  nombre: string;
}

interface UseTalleresReturn {
  talleres: Taller[];
  tallerSeleccionado: string | number | null;
  setTallerSeleccionado: (tallerId: string | number | null) => void;
  loading: boolean;
  error: string | null;
}

export function useTalleres(): UseTalleresReturn {
  const [talleres, setTalleres] = useState<Taller[]>([]);
  const [tallerSeleccionado, setTallerSeleccionado] = useState<string | number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const { userProfile } = useSupabaseData();

  // Manejador personalizado para el estado de taller seleccionado que garantiza conversión de tipos
  const handleSetTallerSeleccionado = useCallback((tallerId: string | number | null) => {
    // Si es null o cadena vacía, establecer como null
    const parsedTallerId = tallerId === null || tallerId === '' ? null : tallerId;
    setTallerSeleccionado(parsedTallerId);
  }, []);

  // Función para obtener los talleres disponibles según el rol del usuario
  const fetchTalleres = useCallback(async () => {
    if (!userProfile) return [];
    
    try {
      setLoading(true);
      setError(null);
      
      // Si es GESTOR_TALLER, solo necesita su propio taller
      if (userProfile.role === 'GESTOR_TALLER') {
        if (userProfile.workshop_id) {
          const { data, error } = await supabase
            .from('workshops')
            .select('id, nombre_comercial')
            .eq('id', userProfile.workshop_id)
            .single();
          
          if (error) throw error;
          
          if (data) {
            // Preservar el tipo original del ID sin convertir
            const tallerId = data.id;
            
            const talleresData = [{
              id: tallerId,
              nombre: data.nombre_comercial
            }];
            setTalleres(talleresData);
            handleSetTallerSeleccionado(tallerId);
            setLoading(false);
            return talleresData;
          }
        }
        setLoading(false);
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
      
      if (data && data.length > 0) {
        // Convertir los IDs a números
        const talleresData = data.map(taller => ({
          id: taller.id, // Preservar el tipo original
          nombre: taller.nombre_comercial
        }));
        setTalleres(talleresData);
        setLoading(false);
        return talleresData;
      }
      
      setLoading(false);
      return [];
    } catch (err: any) {
      console.error('Error al obtener talleres:', err);
      setError(err.message || 'Error al obtener talleres');
      setLoading(false);
      return [];
    }
  }, [userProfile, handleSetTallerSeleccionado]);
  
  // Efecto para cargar los talleres disponibles cuando cambia el perfil del usuario
  useEffect(() => {
    if (userProfile) {
      fetchTalleres();
    }
  }, [userProfile, fetchTalleres]);
  
  return {
    talleres,
    tallerSeleccionado,
    setTallerSeleccionado: handleSetTallerSeleccionado,
    loading,
    error
  };
} 