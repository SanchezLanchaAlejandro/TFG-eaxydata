import React, { useState, useEffect } from 'react';
import { Valoracion } from './types';
import { useValoraciones } from '@/hooks/useValoraciones';
import { toast } from 'react-hot-toast';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { InformeValoracionPDFDownload } from './InformeValoracionPDF';
import dynamic from 'next/dynamic';
import { UserRole } from '@/hooks/useSupabaseData';

// Importación dinámica del editor personalizado (sin SSR)
const CustomEditor = dynamic(
  () => import('../Editor/CustomEditor'),
  { ssr: false }
);

interface InformeValoracionProps {
  valoracion: Valoracion;
  onClose?: () => void;
  userRole?: UserRole;
}

export const InformeValoracion = ({ valoracion, onClose, userRole = 'SUPER_ADMIN' }: InformeValoracionProps) => {
  const [editorContent, setEditorContent] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [informeExistente, setInformeExistente] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [contenidoOriginal, setContenidoOriginal] = useState('');
  const [mostrarConfirmacionCancelar, setMostrarConfirmacionCancelar] = useState(false);
  
  const { guardarInformeValoracion, obtenerInformeValoracion } = useValoraciones();
  
  // Verificar si el usuario es administrador (puede crear/editar)
  const esAdmin = userRole === 'SUPER_ADMIN';
  
  // Generar contenido inicial con los datos del vehículo
  const generarContenidoInicial = () => {
    return `
      <h1>Informe de Valoración - ${valoracion.matricula}</h1>
      
      <h2>Datos del Vehículo</h2>
      <ul>
        <li><strong>Matrícula:</strong> ${valoracion.matricula}</li>
        <li><strong>Número de Chasis:</strong> ${valoracion.chasis}</li>
        <li><strong>Motorización:</strong> ${valoracion.motorizacion}</li>
        <li><strong>Aseguradora:</strong> ${valoracion.aseguradora || 'No especificada'}</li>
        <li><strong>Tipo de Póliza:</strong> ${valoracion.tipoPoliza || 'No especificada'}</li>
        <li><strong>Fecha de Matriculación:</strong> ${valoracion.fechaPrimeraMatriculacion ? new Date(valoracion.fechaPrimeraMatriculacion).toLocaleDateString('es-ES') : 'No especificada'}</li>
      </ul>
      
      <h2>Observaciones</h2>
      <p>Añada aquí sus observaciones sobre el estado del vehículo...</p>
    `;
  };
  
  // Cargar informe existente o generar uno nuevo
  useEffect(() => {
    const cargarInforme = async () => {
      if (!valoracion.id) return;
      
      setCargando(true);
      try {
        const resultado = await obtenerInformeValoracion(valoracion.id);
        
        if (resultado.success) {
          if (resultado.data) {
            // Se encontró un informe existente
            setInformeExistente(resultado.data);
            setEditorContent(resultado.data || '');
            setContenidoOriginal(resultado.data || '');
            setModoEdicion(false);
          } else if (esAdmin) {
            // No hay informe y el usuario es admin, generar contenido inicial
            console.log('No se encontró un informe, generando contenido inicial');
            const contenidoInicial = generarContenidoInicial();
            setEditorContent(contenidoInicial);
            setContenidoOriginal(contenidoInicial);
            setModoEdicion(true);
          } else {
            // No hay informe y el usuario no es admin, mostrar mensaje
            toast.error('No existe un informe para esta valoración');
            onClose?.();
            return;
          }
        } else {
          // Error al obtener el informe
          console.error('Error al obtener el informe:', resultado.error);
          toast.error('Error al cargar el informe');
          if (esAdmin) {
            const contenidoInicial = generarContenidoInicial();
            setEditorContent(contenidoInicial);
            setContenidoOriginal(contenidoInicial);
            setModoEdicion(true);
          } else {
            onClose?.();
            return;
          }
        }
      } catch (error) {
        console.error('Error inesperado al cargar el informe:', error);
        toast.error('Error inesperado al cargar el informe');
        if (esAdmin) {
          const contenidoInicial = generarContenidoInicial();
          setEditorContent(contenidoInicial);
          setContenidoOriginal(contenidoInicial);
          setModoEdicion(true);
        } else {
          onClose?.();
          return;
        }
      } finally {
        setCargando(false);
      }
    };
    
    cargarInforme();
  }, [valoracion.id, esAdmin, onClose]);
  
  // Función para obtener la fecha actual como string
  const getFechaActual = () => {
    return new Date().toLocaleString('es-ES');
  };

  // Función para guardar el informe
  const handleGuardarInforme = async () => {
    if (!valoracion.id || !esAdmin) return;
    
    setCargando(true);
    try {
      const resultado = await guardarInformeValoracion(valoracion.id, editorContent);
      
      if (resultado.success) {
        // Como guardarInformeValoracion ya no devuelve datos, simplemente actualizamos
        // el estado con el contenido actual
        setInformeExistente(editorContent);
        setContenidoOriginal(editorContent);
        setModoEdicion(false);
        toast.success('Informe guardado correctamente');
      } else {
        toast.error('Error al guardar el informe');
      }
    } catch (error) {
      console.error('Error al guardar el informe:', error);
      toast.error('Error al guardar el informe');
    } finally {
      setCargando(false);
    }
  };
  
  // Función para iniciar el proceso de cancelación
  const iniciarCancelacion = () => {
    // Si es un informe nuevo (no existente), mostrar confirmación
    if (!informeExistente) {
      setMostrarConfirmacionCancelar(true);
    } else {
      // Si es un informe existente, cancelar directamente
      setEditorContent(contenidoOriginal);
      setModoEdicion(false);
      toast.success('Edición cancelada');
    }
  };

  // Función para confirmar la cancelación
  const confirmarCancelacion = () => {
    setMostrarConfirmacionCancelar(false);
    onClose?.();
    toast.success('Creación de informe cancelada');
  };

  // Función para cancelar la cancelación (mantener editando)
  const cancelarCancelacion = () => {
    setMostrarConfirmacionCancelar(false);
  };
  
  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6 mb-6">
      {/* Modal de confirmación para cancelar */}
      {mostrarConfirmacionCancelar && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110] p-4"
          style={{ backdropFilter: 'blur(5px)' }}
        >
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirmar cancelación</h3>
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              ¿Estás seguro de que deseas cancelar? Los cambios no guardados se perderán.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelarCancelacion}
                className="px-4 py-2 bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarCancelacion}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 rounded-md transition-colors flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {modoEdicion ? 
            (informeExistente ? 'Editar informe' : 'Crear nuevo informe') : 
            'Informe de valoración'
          }
        </h3>
        
        <div className="flex space-x-2">
          {onClose && !modoEdicion && (
            <button
              onClick={onClose}
              className="flex items-center px-3 py-1.5 text-sm rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-700/50 dark:text-gray-300 dark:hover:bg-gray-700/80 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver
            </button>
          )}
          
          {!modoEdicion && informeExistente && (
            <InformeValoracionPDFDownload
              valoracion={valoracion}
              informe={informeExistente}
              fileName={`Informe-Valoracion-${valoracion.matricula}.pdf`}
              className="flex items-center px-3 py-1.5 text-sm rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-900/30 transition-colors"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-1.5" />
              Exportar PDF
            </InformeValoracionPDFDownload>
          )}
          
          {/* Botón de edición solo visible para administradores */}
          {esAdmin && informeExistente && !modoEdicion ? (
            <button
              onClick={() => setModoEdicion(true)}
              className="flex items-center px-3 py-1.5 text-sm rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar informe
            </button>
          ) : modoEdicion && esAdmin && (
            <>
              <button
                onClick={iniciarCancelacion}
                className="flex items-center px-3 py-1.5 text-sm rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-700/50 dark:text-gray-300 dark:hover:bg-gray-700/80 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {informeExistente ? 'Cancelar' : 'Cancelar informe'}
              </button>
              <button
                onClick={handleGuardarInforme}
                disabled={cargando}
                className="flex items-center px-3 py-1.5 text-sm rounded-md bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/30 transition-colors"
              >
                {cargando ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-1.5 text-green-700 dark:text-green-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {informeExistente ? 'Guardar cambios' : 'Crear informe'}
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
      
      {cargando && !editorContent ? (
        <div className="h-60 w-full flex items-center justify-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : modoEdicion && esAdmin ? (
        // Modo editor con nuestro editor personalizado (solo para administradores)
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <CustomEditor 
            value={editorContent}
            onChange={(newContent) => {
              setEditorContent(newContent);
            }}
            className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
      ) : (
        // Modo visualización del HTML (para todos los usuarios)
        <div 
          className="prose prose-blue max-w-none dark:prose-invert px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg min-h-60 overflow-auto"
          dangerouslySetInnerHTML={{ __html: editorContent }}
        ></div>
      )}
      
      {informeExistente && !modoEdicion && (
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          Última modificación: {getFechaActual()}
        </div>
      )}
    </div>
  );
}; 