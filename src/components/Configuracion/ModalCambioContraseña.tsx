"use client";

import { useState, useEffect } from 'react';
import { useConfiguracion } from '@/hooks/useConfiguracion';
import { LockClosedIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface ModalCambioContraseñaProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModalCambioContraseña: React.FC<ModalCambioContraseñaProps> = ({
  isOpen,
  onClose
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const { cambiarContraseña, loading, error } = useConfiguracion();
  
  // Calcular la fortaleza de la contraseña
  const passwordStrength = () => {
    if (!newPassword) return 0;
    let score = 0;
    
    // Longitud
    if (newPassword.length >= 6) score += 1;
    if (newPassword.length >= 10) score += 1;
    
    // Complejidad
    if (/[A-Z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;
    
    return Math.min(score, 5);
  };
  
  const getStrengthColor = (strength: number) => {
    if (strength === 0) return 'bg-gray-200 dark:bg-gray-700';
    if (strength < 3) return 'bg-red-500';
    if (strength < 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  const getStrengthText = (strength: number) => {
    if (strength === 0) return '';
    if (strength < 3) return 'Débil';
    if (strength < 4) return 'Media';
    return 'Fuerte';
  };

  // Limpiar los campos y mensajes cuando se abre/cierra el modal
  useEffect(() => {
    if (isOpen) {
      setNewPassword('');
      setConfirmPassword('');
      setValidationError(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos
    if (!newPassword || !confirmPassword) {
      setValidationError('Todos los campos son obligatorios');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setValidationError('Las contraseñas nuevas no coinciden');
      return;
    }
    
    if (newPassword.length < 6) {
      setValidationError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    setValidationError(null);
    
    try {
      // Actualizar contraseña directamente
      const result = await cambiarContraseña(newPassword);
      
      if (result.success) {
        setSuccessMessage('Contraseña actualizada correctamente');
        
        // Limpiar los campos después de éxito
        setNewPassword('');
        setConfirmPassword('');
        
        // Cerrar el modal después de unos segundos
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err: unknown) {
      setValidationError(err instanceof Error ? err.message : 'Error al cambiar la contraseña');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 transition-opacity backdrop-blur-sm" aria-hidden="true" onClick={onClose}></div>
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-lg overflow-hidden shadow-xl w-full max-w-md mx-auto">
        {/* Encabezado */}
        <div className="bg-blue-600 py-4 px-6 text-center">
          <h3 className="text-lg leading-6 font-medium text-white">
            Cambiar Contraseña
          </h3>
        </div>
        
        <div className="p-6">
          {/* Mensaje de éxito */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">
                    {successMessage}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Mensajes de error */}
          {(validationError || error) && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">
                    {validationError || error}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="new-password" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                <LockClosedIcon className="h-4 w-4 mr-2 text-gray-400" />
                Nueva Contraseña
              </label>
              <div className="mt-2">
                <input
                  type="password"
                  id="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white text-sm"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              
              {/* Indicador de fortaleza de contraseña */}
              {newPassword && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`${getStrengthColor(passwordStrength())} h-2 rounded-full transition-all duration-300 ease-in-out`} 
                        style={{ width: `${(passwordStrength() / 5) * 100}%` }}
                      ></div>
                    </div>
                    <span className="ml-3 text-xs text-gray-500 dark:text-gray-400 w-16">
                      {getStrengthText(passwordStrength())}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Para mayor seguridad, usa letras mayúsculas, minúsculas, números y símbolos
                  </p>
                </div>
              )}
            </div>
            
            <div>
              <label htmlFor="confirm-password" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                <CheckCircleIcon className="h-4 w-4 mr-2 text-gray-400" />
                Confirmar Nueva Contraseña
              </label>
              <div className="mt-2">
                <input
                  type="password"
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`block w-full px-4 py-2.5 border ${
                    confirmPassword && newPassword !== confirmPassword 
                      ? 'border-red-300 dark:border-red-500 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500'
                  } rounded-md shadow-sm dark:bg-gray-800 dark:text-white text-sm`}
                  placeholder="Repite la nueva contraseña"
                />
                {confirmPassword && (
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    {newPassword === confirmPassword ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                  Las contraseñas no coinciden
                </p>
              )}
            </div>
            
            <div className="pt-4 mt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors duration-200"
                >
                  {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}; 