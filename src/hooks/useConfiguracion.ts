import { useState, useRef } from 'react';
import supabase from '@/lib/supabase';

type PasswordChangeResponse = {
  success: boolean;
  error?: string;
};

export function useConfiguracion() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isChangingPassword = useRef(false);

  /**
   * Cambia la contraseña del usuario actual sin verificación previa
   * @param newPassword Nueva contraseña
   * @returns Objeto con el resultado de la operación
   */
  const cambiarContraseña = async (newPassword: string): Promise<PasswordChangeResponse> => {
    // Evitar cambios de contraseña simultáneos
    if (isChangingPassword.current) {
      return { 
        success: false, 
        error: 'Ya hay una operación de cambio de contraseña en curso'
      };
    }
    
    try {
      isChangingPassword.current = true;
      setLoading(true);
      setError(null);

      // Cambiar la contraseña directamente
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      return { success: true };
    } catch (err: any) {
      console.error('Error al cambiar la contraseña:', err);
      setError(err.message || 'Error al cambiar la contraseña');
      return { 
        success: false, 
        error: err.message || 'Error al cambiar la contraseña'
      };
    } finally {
      setLoading(false);
      isChangingPassword.current = false;
    }
  };

  return {
    loading,
    error,
    cambiarContraseña
  };
} 