import { useState, useEffect, useRef } from 'react';
import { useUser } from './useUser';
import supabase from '@/lib/supabase';

// Tipo para los roles posibles
export type UserRole = 'SUPER_ADMIN' | 'GESTOR_RED' | 'GESTOR_TALLER';

// Tipo para la información del perfil de usuario
export type UserProfile = {
  id: string;
  role: UserRole | null;
  nombre: string;
  email: string;
  telefono?: string | null;
  network_id?: string | null;
  workshop_id?: string | null;
  activo: boolean;
  fecha_creacion?: string;
  multi_workshop?: boolean;
  network_logo?: string | null;
};

export function useSupabaseData() {
  const { user, session, loading: authLoading } = useUser();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Referencias para evitar operaciones innecesarias
  const isFetching = useRef(false);
  const lastUserId = useRef<string | null>(null);
  const isComponentMounted = useRef(true);
  
  // Control de visibilidad del documento
  const isDocumentVisible = useRef(true);
  const lastVisibilityChange = useRef(Date.now());

  // Efecto para manejar cambios de visibilidad del documento
  useEffect(() => {
    const handleVisibilityChange = () => {
      const now = Date.now();
      // Evitar múltiples ejecuciones en poco tiempo
      if (now - lastVisibilityChange.current < 1000) {
        return;
      }
      
      lastVisibilityChange.current = now;
      isDocumentVisible.current = document.visibilityState === 'visible';
      
      // No hacer nada cuando la pestaña se oculta
      if (!isDocumentVisible.current || !isComponentMounted.current) {
        return;
      }
      
      // Al volver a ser visible, no realizamos recarga automática
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      isComponentMounted.current = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Efecto para obtener el perfil de usuario, incluyendo el rol
  useEffect(() => {
    const fetchUserProfile = async () => {
      // Si no hay usuario o ya estamos cargando, o la pestaña no es visible, no hacer nada
      if (!user || isFetching.current || !isComponentMounted.current || !isDocumentVisible.current) {
        if (!user) {
          setUserProfile(null);
          setLoading(false);
        }
        return;
      }
      
      // Si el ID del usuario no ha cambiado, no recargar el perfil
      if (lastUserId.current === user.id && userProfile) {
        return;
      }

      try {
        isFetching.current = true;
        setLoading(true);
        setError(null);
        
        // Actualizar referencia del usuario
        lastUserId.current = user.id;

        // Consultar el perfil del usuario en la tabla 'users' usando su ID
        const { data, error } = await supabase
          .from('users')
          .select('id, rol, nombre, email, telefono, network_id, workshop_id, activo, fecha_creacion, multi_workshop')
          .eq('id', user.id)
          .single();

        if (error) {
          throw error;
        }

        if (data && isComponentMounted.current) {
          // Si network_id es un UUID (string), intentar convertirlo a número
          const networkId = data.network_id as string | undefined;
          
          // Si workshop_id es un UUID (string), intentar convertirlo a número
          const workshopId = data.workshop_id as string | undefined;

          // Obtener el logo de la red si existe network_id
          let networkLogo = null;
          if (networkId) {
            const { data: networkData, error: networkError } = await supabase
              .from('networks')
              .select('logo_image')
              .eq('id', networkId)
              .single();

            if (!networkError && networkData) {
              networkLogo = networkData.logo_image;
            }
          }
          
          const profileData = {
            id: data.id,
            role: data.rol as UserRole,  // Nota: la columna se llama 'rol' no 'role'
            nombre: data.nombre,
            email: data.email || user.email || '',
            telefono: data.telefono,
            network_id: networkId,
            workshop_id: workshopId,
            activo: data.activo,
            fecha_creacion: data.fecha_creacion,
            multi_workshop: data.multi_workshop,
            network_logo: networkLogo
          };
          
          if (isComponentMounted.current) {
            setUserProfile(profileData);
          }
        }
      } catch (err: unknown) {
        console.error('Error al obtener el perfil de usuario:', err);
        if (isComponentMounted.current) {
          setError(err instanceof Error ? err.message : 'Error al obtener el perfil de usuario');
        }
      } finally {
        if (isComponentMounted.current) {
          setLoading(false);
        }
        isFetching.current = false;
      }
    };

    if (!authLoading) {
      fetchUserProfile();
    }
  }, [user, session, authLoading, userProfile]);

  // Función para actualizar el rol del usuario
  const updateUserRole = async (userId: string, newRole: UserRole) => {
    if (isFetching.current || !isComponentMounted.current) {
      return { success: false, error: 'Operación en progreso o componente desmontado' };
    }
    
    try {
      isFetching.current = true;
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('users')
        .update({ rol: newRole })  // Nota: la columna se llama 'rol' no 'role'
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data && userProfile && isComponentMounted.current) {
        setUserProfile({ ...userProfile, role: data.rol });
      }

      return { success: true };
    } catch (err: unknown) {
      console.error('Error al actualizar el rol del usuario:', err);
      if (isComponentMounted.current) {
        setError(err instanceof Error ? err.message : 'Error al actualizar el rol del usuario');
      }
      return { success: false, error: err instanceof Error ? err.message : 'Error al actualizar el rol del usuario' };
    } finally {
      if (isComponentMounted.current) {
        setLoading(false);
      }
      isFetching.current = false;
    }
  };

  // Función para verificar si el usuario tiene un rol específico
  const hasRole = (requiredRole: UserRole | UserRole[]): boolean => {
    if (!userProfile || !userProfile.role) return false;
    
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(userProfile.role);
    }
    
    return userProfile.role === requiredRole;
  };
  
  // Función para forzar recarga del perfil
  const reloadProfile = async () => {
    if (isFetching.current || !user || !isComponentMounted.current) {
      return { success: false };
    }
    
    // Resetear el ID del último usuario para forzar la recarga
    lastUserId.current = null;
    
    try {
      isFetching.current = true;
      setLoading(true);
      
      // Reutilizamos la lógica del efecto
      await supabase.auth.refreshSession();
      
      // El efecto se encargará de recargar el perfil
      return { success: true };
    } catch (err) {
      console.error('Error al recargar el perfil:', err);
      return { success: false };
    } finally {
      isFetching.current = false;
      setLoading(false);
    }
  };

  // Efecto de limpieza cuando el componente se desmonta
  useEffect(() => {
    return () => {
      isComponentMounted.current = false;
    };
  }, []);

  return {
    userProfile,
    loading: loading || authLoading,
    error,
    updateUserRole,
    hasRole,
    reloadProfile,
    isAdmin: userProfile?.role === 'SUPER_ADMIN',
    isGestorRed: userProfile?.role === 'GESTOR_RED',
    isGestorTaller: userProfile?.role === 'GESTOR_TALLER',
  };
} 