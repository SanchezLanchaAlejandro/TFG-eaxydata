/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
import { useState, useEffect, useMemo } from 'react';
import { Valoracion } from './types';
import Image from 'next/image';
import { Modal } from '@/components/shared/Modal';
import { useValoraciones, FotosProcesadas } from '@/hooks/useValoraciones';
import { UserRole } from '@/hooks/useSupabaseData';
import { InformeValoracion } from './InformeValoracion';

interface VistaDetalleValoracionProps {
  valoracion: Valoracion;
  open: boolean;
  onClose: () => void;
  onEstadoChange?: (nuevoEstado: 'pendiente' | 'en_curso' | 'finalizado', id: string) => void;
  userRole?: UserRole;
}

type FotoEtiqueta = {
  url: string;
  etiqueta: string;
  tipo: 'documentacion' | 'general' | 'dano' | 'siniestro';
};

type Comentario = {
  id: string;
  autor: string;
  fecha: string;
  texto: string;
};

// Componente de vista previa de imagen simplificado
const ImagePreview = ({ foto, onClose }: { foto: FotoEtiqueta; onClose: () => void }) => {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 z-[150] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {foto.etiqueta}
          </h3>
          
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
          <div className="relative max-h-[70vh]">
            <img
              src={foto.url}
              alt={foto.etiqueta}
              className="max-w-full max-h-[70vh] object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export const VistaDetalleValoracion = ({ 
  valoracion: valoracionProp, 
  open,
  onClose,
  onEstadoChange,
  userRole = 'SUPER_ADMIN'
}: VistaDetalleValoracionProps) => {
  const [valoracion, setValoracion] = useState<Valoracion>({...valoracionProp});
  const [fotoSeleccionada, setFotoSeleccionada] = useState<FotoEtiqueta | null>(null);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [mostrarSelectorFotos, setMostrarSelectorFotos] = useState(false);
  const [esSiniestroTotal, setEsSiniestroTotal] = useState(valoracionProp.esSiniestroTotal || false);
  const [nuevasFotos, setNuevasFotos] = useState<FotoEtiqueta[]>([]);
  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);
  const [estadoCambio, setEstadoCambio] = useState<'pendiente' | 'en_curso' | 'finalizado' | null>(null);
  const [mostrarConfirmacionEstado, setMostrarConfirmacionEstado] = useState(false);
  const [metodoCaptura, setMetodoCaptura] = useState<'subir' | 'capturar'>('subir');
  const [previewsMap, setPreviewsMap] = useState<Record<number, string>>({});
  const [fotosDB, setFotosDB] = useState<FotosProcesadas | null>(null);
  const [cargandoFotos, setCargandoFotos] = useState(true);
  // Verificamos explícitamente si valorador_id tiene un valor
  const [tieneValoradorAsignado, setTieneValoradorAsignado] = useState(valoracionProp.valorador_id !== null && valoracionProp.valorador_id !== undefined && valoracionProp.valorador_id !== '');
  
  const [asignandoValoracion, setAsignandoValoracion] = useState(false);
  const [mostrarConfirmacionAsignacion, setMostrarConfirmacionAsignacion] = useState(false);
  const MAX_FOTOS = 20;
  
  // Nuevo estado para almacenar el nombre del valorador
  const [nombreValorador, setNombreValorador] = useState<string | null>(null);
  
  // Nuevo estado para controlar la visibilidad de la sección de informe
  const [mostrarSeccionInforme, setMostrarSeccionInforme] = useState(false);
  const [informeExiste, setInformeExiste] = useState<boolean | null>(null);
  
  // Variable para simplificar la comprobación del rol de administrador
  const esAdmin = userRole === 'SUPER_ADMIN';
  
  // Usamos el hook para acceder a las funciones de valoraciones
  const { 
    obtenerFotosValoracion, 
    marcarSiniestroTotal, 
    asignarValoradorId, 
    desasignarValoradorId,
    updateValoracionEstado,
    obtenerNombreValorador,
    obtenerInformeValoracion
  } = useValoraciones();
  
  // Actualizar el estado tieneValoradorAsignado cuando cambie la valoracion
  useEffect(() => {
    const tieneValoradorActual = valoracion.valorador_id !== null && 
                                valoracion.valorador_id !== undefined && 
                                valoracion.valorador_id !== '';
    
    if (tieneValoradorActual !== tieneValoradorAsignado) {
      setTieneValoradorAsignado(tieneValoradorActual);
    }
  }, [valoracion.valorador_id, tieneValoradorAsignado]);
  
  // Efecto para obtener el nombre del valorador cuando se abre el modal y hay un valorador asignado
  useEffect(() => {
    const cargarNombreValorador = async () => {
      if (open && valoracion.valorador_id) {
        try {
          const resultado = await obtenerNombreValorador(valoracion.valorador_id);
          
          if (resultado.success && resultado.nombre) {
            setNombreValorador(resultado.nombre);
          } else {
            setNombreValorador('Desconocido');
          }
        } catch (_error) {
          // Error ya manejado, solo registramos
          console.error('Error al obtener nombre del valorador');
          setNombreValorador('Desconocido');
        }
      }
    };
    
    cargarNombreValorador();
  }, [open, valoracion.valorador_id, obtenerNombreValorador]);
  
  // Cargamos las fotos cuando se abre el modal
  useEffect(() => {
    let isMounted = true;
    
    const cargarFotos = async () => {
      if (open && valoracion.id) {
        setCargandoFotos(true);
        try {
          const resultado = await obtenerFotosValoracion(valoracion.id);
          
          if (!isMounted) return;
          
          if (resultado.success) {
            setFotosDB(resultado.data || null);
          }
        } catch (error) {
          if (!isMounted) return;
        } finally {
          if (isMounted) {
            setCargandoFotos(false);
          }
        }
      }
    };
    
    if (open) {
      cargarFotos();
    } else {
      // Limpiar el estado cuando se cierra el modal para evitar peticiones innecesarias
      setFotosDB(null);
      setCargandoFotos(false);
    }
    
    return () => {
      isMounted = false;
    };
  }, [open, valoracion.id, obtenerFotosValoracion]);
  
  // Transformamos las fotos de la base de datos al formato que necesita el componente usando useMemo
  const fotosConEtiquetas = useMemo(() => {
    const fotos: FotoEtiqueta[] = [];
    
    // Si tenemos fotos en la base de datos, las procesamos
    if (fotosDB) {
      // Procesamos fotos de documentación
      fotosDB.documentacion.forEach((item) => {
        // Determinar la etiqueta según la columna
        let etiqueta = 'Documento';
        
        switch (item.columna) {
          case 'ficha_tecnica_1':
            etiqueta = 'Ficha técnica (1)';
            break;
          case 'ficha_tecnica_2':
            etiqueta = 'Ficha técnica (2)';
            break;
          case 'ficha_tecnica_3':
            etiqueta = 'Ficha técnica (3)';
            break;
          case 'ficha_tecnica_4':
            etiqueta = 'Ficha técnica (4)';
            break;
          case 'kilometros':
            etiqueta = 'Cuentakilómetros';
            break;
          default:
            etiqueta = 'Documento técnico';
        }
        
        fotos.push({
          url: item.url,
          etiqueta,
          tipo: 'documentacion'
        });
      });
      
      // Procesamos fotos generales
      fotosDB.generales.forEach((item) => {
        let etiqueta = 'Vista general';
        
        switch (item.columna) {
          case 'delantera_izquierda':
            etiqueta = 'Delantera izquierda';
            break;
          case 'delantera_derecha':
            etiqueta = 'Delantera derecha';
            break;
          case 'trasera_izquierda':
            etiqueta = 'Trasera izquierda';
            break;
          case 'trasera_derecha':
            etiqueta = 'Trasera derecha';
            break;
          default:
            etiqueta = 'Vista general';
        }
        
        fotos.push({
          url: item.url,
          etiqueta,
          tipo: 'general'
        });
      });
      
      // Procesamos fotos de daños
      fotosDB.danos.forEach((item) => {
        // Extraer el número del daño desde el nombre de la columna
        const numeroMatch = item.columna.match(/\d+$/);
        const numero = numeroMatch ? numeroMatch[0] : '';
        
        fotos.push({
          url: item.url,
          etiqueta: `Daño adicional ${numero}`,
          tipo: 'dano'
        });
      });
      
      // Procesamos fotos de siniestro
      fotosDB.siniestro.forEach((item) => {
        // Extraer el número del siniestro desde el nombre de la columna
        const numeroMatch = item.columna.match(/\d+$/);
        const numero = numeroMatch ? numeroMatch[0] : '';
        
        fotos.push({
          url: item.url,
          etiqueta: `Foto siniestro ${numero}`,
          tipo: 'siniestro'
        });
      });
    }
    
    return fotos;
  }, [fotosDB]);
  
  const getBadgeColor = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300';
      case 'en_curso':
        return 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300';
      case 'finalizado':
        return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300';
    }
  };
  
  const getEstadoTexto = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return 'Pendiente';
      case 'en_curso':
        return 'En curso';
      case 'finalizado':
        return 'Finalizado';
      default:
        return 'Desconocido';
    }
  };
  
  const getFotosPorTipo = (tipo: 'documentacion' | 'general' | 'dano' | 'siniestro') => {
    return [...fotosConEtiquetas, ...nuevasFotos].filter(foto => foto.tipo === tipo);
  };
  
  const handleNuevoComentario = () => {
    if (!nuevoComentario.trim()) return;
    
    // Crear la fecha actual en formato español
    const ahora = new Date();
    const fecha = ahora.toLocaleDateString('es-ES') + ' ' + 
                  ahora.getHours().toString().padStart(2, '0') + ':' + 
                  ahora.getMinutes().toString().padStart(2, '0');
    
    // Añadir el nuevo comentario al principio del array (para que aparezca al final de la lista)
    setComentarios([
      ...comentarios,
      {
        id: Date.now().toString(),
        autor: 'Usuario CST', // Usuario actual (estático por ahora)
        fecha: fecha,
        texto: nuevoComentario
      }
    ]);
    
    // Limpiar el input
    setNuevoComentario('');
  };
  
  // Función para mostrar la modal de confirmación
  const mostrarConfirmacionSiniestroTotal = () => {
    setMostrarModalConfirmacion(true);
  };
  
  // Función para marcar como siniestro total
  const handleMarcarSiniestroTotal = async () => {
    if (esSiniestroTotal) return; // Evitar duplicados
    
    // Actualizar en la base de datos
    if (valoracion.id) {
      try {
        const resultado = await marcarSiniestroTotal(valoracion.id);
        
        if (!resultado.success) {
          alert("Ha ocurrido un error al marcar como siniestro total. Por favor, inténtalo de nuevo.");
          return;
        }
        
        // Actualizar la UI
        setEsSiniestroTotal(true);
        setMostrarModalConfirmacion(false); // Cerrar la modal de confirmación
        setMostrarSelectorFotos(true); // Mostrar automáticamente el selector de fotos
        
        // Actualizar la valoración local
        setValoracion(prev => ({
          ...prev,
          esSiniestroTotal: true,
          siniestro_total: true
          // Ya no actualizamos el estado automáticamente
        }));
        
        // Crear la fecha actual en formato español
        const ahora = new Date();
        const fecha = ahora.toLocaleDateString('es-ES') + ' ' + 
                    ahora.getHours().toString().padStart(2, '0') + ':' + 
                    ahora.getMinutes().toString().padStart(2, '0');
        
        // Añadir un comentario automático
        setComentarios([
          ...comentarios,
          {
            id: Date.now().toString(),
            autor: userRole === 'SUPER_ADMIN' ? 'Administrador' : 'Usuario CST', 
            fecha: fecha,
            texto: "Esta valoración ha sido marcada como siniestro total."
          }
        ]);
      } catch (_error) {
        alert("Ha ocurrido un error al marcar como siniestro total. Por favor, inténtalo de nuevo.");
      }
    }
  };
  
  // Función para manejar la subida de nuevas fotos
  const handleNuevasFotos = (e: React.ChangeEvent<HTMLInputElement>, inputId: number) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Crear URL para preview
    const objectUrl = URL.createObjectURL(files[0]);
    
    // Guardar la referencia del input ID con su vista previa
    setPreviewsMap(prev => ({
      ...prev,
      [inputId]: objectUrl
    }));
    
    // Crear nueva foto
    const nuevaFoto: FotoEtiqueta = {
      url: objectUrl,
      etiqueta: `Foto adicional ${nuevasFotos.length + 1}`,
      tipo: 'siniestro'
    };
    
    setNuevasFotos(prev => [...prev, nuevaFoto]);
    
    // Aquí luego deberíamos subir la foto a un almacenamiento y guardar la URL en la base de datos
  };
  
  // Función para capturar foto usando la cámara
  const handleCapturarFoto = (inputId: number) => {
    // Esta función simula la captura de una foto (en producción, usaríamos WebRTC o APIs nativas)
    const simulatedImage = '/images/captured-photo.jpg'; // URL de ejemplo
    
    // Guardar la referencia del input ID con su vista previa
    setPreviewsMap(prev => ({
      ...prev,
      [inputId]: simulatedImage
    }));
    
    // Añadir la foto capturada
    const nuevaFoto: FotoEtiqueta = {
      url: simulatedImage,
      etiqueta: `Foto capturada ${nuevasFotos.length + 1}`,
      tipo: 'siniestro'
    };
    
    setNuevasFotos(prev => [...prev, nuevaFoto]);
  };
  
  // Función para eliminar una foto
  const handleEliminarFoto = (inputId: number) => {
    const fotoUrl = previewsMap[inputId];
    
    // Eliminar la foto del mapa de previews
    setPreviewsMap(prev => {
      const newMap = {...prev};
      delete newMap[inputId];
      return newMap;
    });
    
    // Eliminar la foto de nuevasFotos
    setNuevasFotos(prev => prev.filter(foto => foto.url !== fotoUrl));
  };

  // Función para mostrar la confirmación de cambio de estado
  const mostrarConfirmacionCambioEstado = (nuevoEstado: 'pendiente' | 'en_curso' | 'finalizado') => {
    setEstadoCambio(nuevoEstado);
    setMostrarConfirmacionEstado(true);
  };

  // Función para manejar el cambio de estado (ahora llamada desde la confirmación)
  const handleEstadoChange = async () => {
    if (!valoracion.id || !estadoCambio) {
      return;
    }
    
    try {
      // Verificar si había un valorador asignado antes del cambio
      const teniaValoradorAsignado = tieneValoradorAsignado;
      
      // Actualizar en la base de datos usando la función centralizada
      const resultado = await updateValoracionEstado(valoracion.id, { nuevoEstado: estadoCambio });
      
      if (!resultado.success) {
        alert("Ha ocurrido un error al cambiar el estado. Por favor, inténtalo de nuevo.");
        return;
      }
      
      // Crear la fecha actual en formato español
      const ahora = new Date();
      const fecha = ahora.toLocaleDateString('es-ES') + ' ' + 
                ahora.getHours().toString().padStart(2, '0') + ':' + 
                ahora.getMinutes().toString().padStart(2, '0');
      
      // Añadir un comentario automático
      setComentarios([
        ...comentarios,
        {
          id: Date.now().toString(),
          autor: userRole === 'SUPER_ADMIN' ? 'Administrador' : 'Usuario CST', 
          fecha: fecha,
          texto: estadoCambio === 'pendiente' && teniaValoradorAsignado
            ? `El estado de la valoración ha cambiado a: ${getEstadoTexto(estadoCambio)} y se ha desasignado del valorador.`
            : `El estado de la valoración ha cambiado a: ${getEstadoTexto(estadoCambio)}`
        }
      ]);
      
      // Actualizar el estado localmente
      setValoracion(prev => {
        const newState = {
          ...prev,
          estado: estadoCambio
        };
        
        // Si cambiamos a pendiente, también quitamos el valorador asignado
        if (estadoCambio === 'pendiente') {
          newState.valorador_id = null;
          setTieneValoradorAsignado(false);
          setNombreValorador(null);
        }
        
        return newState;
      });
      
      // Notificar al componente padre si es necesario
      if (onEstadoChange) {
        onEstadoChange(estadoCambio, valoracion.id);
      }
      
      // Cerrar el modal de confirmación
      setMostrarConfirmacionEstado(false);
      setEstadoCambio(null);
      
    } catch (_error) {
      alert("Ha ocurrido un error al cambiar el estado. Por favor, inténtalo de nuevo.");
    }
  };

  // Función para guardar las fotos de siniestro total
  const handleGuardarFotosSiniestro = async () => {
    // En una implementación real, aquí subiríamos las fotos al servidor
    // y guardaríamos las URLs en la base de datos
    
    // Simulamos la subida con un tiempo de espera
    const nuevasFotosUrls = nuevasFotos.map(foto => foto.url);
    
    if (nuevasFotosUrls.length > 0) {
      // Crear la fecha actual en formato español
      const ahora = new Date();
      const fecha = ahora.toLocaleDateString('es-ES') + ' ' + 
                  ahora.getHours().toString().padStart(2, '0') + ':' + 
                  ahora.getMinutes().toString().padStart(2, '0');
    
      // Añadir un comentario automático
      setComentarios([
        ...comentarios,
        {
          id: Date.now().toString(),
          autor: userRole === 'SUPER_ADMIN' ? 'Administrador' : 'Usuario CST', 
          fecha: fecha,
          texto: `Se han añadido ${nuevasFotosUrls.length} fotografías de siniestro total.`
        }
      ]);
      
      // Aquí normalmente llamaríamos a la API para guardar las fotos
      
      // Mostrar un mensaje de éxito
      alert('Fotos de siniestro total guardadas correctamente.');
      
      // Ocultar el selector de fotos
      setMostrarSelectorFotos(false);
    } else {
      alert('No hay fotos para guardar.');
    }
  };

  // Función para mostrar la confirmación de asignación
  const mostrarConfirmacionAsignarme = () => {
    setMostrarConfirmacionAsignacion(true);
  };
  
  // Función para asignar la valoración al admin actual
  const handleAsignarValoracion = async () => {
    if (tieneValoradorAsignado) {
      return;
    }
    
    setAsignandoValoracion(true);
    
    if (valoracion.id) {
      try {
        // Usamos la función centralizada que auto-cambia el estado a en_curso
        const resultado = await asignarValoradorId(valoracion.id);
        
        if (!resultado.success) {
          alert("Ha ocurrido un error al asignar la valoración. Por favor, inténtalo de nuevo.");
          return;
        }
        
        // Actualizar el estado local
        setTieneValoradorAsignado(true);
        setMostrarConfirmacionAsignacion(false);
        
        // Crear la fecha actual en formato español
        const ahora = new Date();
        const fecha = ahora.toLocaleDateString('es-ES') + ' ' + 
                    ahora.getHours().toString().padStart(2, '0') + ':' + 
                    ahora.getMinutes().toString().padStart(2, '0');
        
        // Añadir un comentario automático
        setComentarios([
          ...comentarios,
          {
            id: Date.now().toString(),
            autor: 'Administrador',
            fecha: fecha,
            texto: "Esta valoración ha sido asignada a un administrador y pasó a estado EN CURSO automáticamente."
          }
        ]);
        
        // Actualizar la valoración local con los datos recibidos del servidor
        if (resultado.data) {
          // Actualizar el estado completo con los datos recibidos
          setValoracion({
            ...resultado.data,
            tipoPoliza: resultado.data.tipoPoliza || '',
            aseguradora: resultado.data.aseguradora || '',
            fechaPrimeraMatriculacion: resultado.data.fechaPrimeraMatriculacion || ''
          });
        }
        
      } catch (_error) {
        alert("Ha ocurrido un error al asignar la valoración. Por favor, inténtalo de nuevo.");
      } finally {
        setAsignandoValoracion(false);
      }
    }
  };
  
  // Función para desasignar la valoración (quitar valorador)
  const handleDesasignarValoracion = async () => {
    if (!tieneValoradorAsignado || !valoracion.id) {
      return;
    }
    
    setAsignandoValoracion(true);
    
    try {
      // Usamos la función centralizada que auto-cambia el estado a pendiente
      const resultado = await desasignarValoradorId(valoracion.id);
      
      if (!resultado.success) {
        alert("Ha ocurrido un error al desasignar la valoración. Por favor, inténtalo de nuevo.");
        return;
      }
      
      // Actualizar el estado local
      setTieneValoradorAsignado(false);
      setNombreValorador(null);
      
      // Crear la fecha actual en formato español
      const ahora = new Date();
      const fecha = ahora.toLocaleDateString('es-ES') + ' ' + 
                  ahora.getHours().toString().padStart(2, '0') + ':' + 
                  ahora.getMinutes().toString().padStart(2, '0');
      
      // Añadir un comentario automático
      setComentarios([
        ...comentarios,
        {
          id: Date.now().toString(),
          autor: 'Administrador',
          fecha: fecha,
          texto: "Esta valoración ha sido desasignada y pasó a estado PENDIENTE automáticamente."
        }
      ]);
      
      // Actualizar la valoración local con los datos recibidos del servidor
      if (resultado.data) {
        setValoracion({
          ...valoracion,
          estado: 'pendiente',
          valorador_id: null,
          // Asegurar que estos campos no sean null
          tipoPoliza: valoracion.tipoPoliza || '',
          aseguradora: valoracion.aseguradora || '',
          fechaPrimeraMatriculacion: valoracion.fechaPrimeraMatriculacion || ''
        });
      }
      
    } catch (_error) {
      alert("Ha ocurrido un error al desasignar la valoración. Por favor, inténtalo de nuevo.");
    } finally {
      setAsignandoValoracion(false);
    }
  };

  // Función para verificar si ya existe un informe para esta valoración
  useEffect(() => {
    if (open && valoracion.id) {
      const verificarInforme = async () => {
        try {
          const resultado = await obtenerInformeValoracion(valoracion.id);
          setInformeExiste(resultado.success && resultado.data !== null);
        } catch (_error) {
          console.error('Error al verificar informe');
          setInformeExiste(false);
        }
      };
      
      verificarInforme();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, valoracion.id]);

  return (
    <>
      {/* Modal de vista previa de imagen */}
      {fotoSeleccionada && (
        <ImagePreview 
          foto={fotoSeleccionada} 
          onClose={() => setFotoSeleccionada(null)} 
        />
      )}
      
      {/* Modal de confirmación para marcar como siniestro total */}
      {mostrarModalConfirmacion && (
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirmar Siniestro Total</h3>
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              ¿Estás seguro de que deseas marcar esta valoración como siniestro total? Esta acción no se puede deshacer y requerirá documentación adicional.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setMostrarModalConfirmacion(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleMarcarSiniestroTotal}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 rounded-md transition-colors flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de confirmación para asignar valorador */}
      {mostrarConfirmacionAsignacion && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110] p-4"
          style={{ backdropFilter: 'blur(5px)' }}
        >
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirmar Asignación</h3>
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              ¿Estás seguro de que deseas asignarte esta valoración? Tú serás responsable de su seguimiento y gestión.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setMostrarConfirmacionAsignacion(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAsignarValoracion}
                disabled={asignandoValoracion}
                className="px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 rounded-md transition-colors flex items-center"
              >
                {asignandoValoracion ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Asignando...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Confirmar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de confirmación para cambio de estado */}
      {mostrarConfirmacionEstado && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110] p-4"
          style={{ backdropFilter: 'blur(5px)' }}
        >
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className={`p-2 rounded-full mr-3 ${
                estadoCambio === 'pendiente' 
                  ? 'bg-amber-100 dark:bg-amber-900/30' 
                  : estadoCambio === 'en_curso' 
                    ? 'bg-blue-100 dark:bg-blue-900/30' 
                    : 'bg-green-100 dark:bg-green-900/30'
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${
                  estadoCambio === 'pendiente' 
                    ? 'text-amber-600 dark:text-amber-400' 
                    : estadoCambio === 'en_curso' 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-green-600 dark:text-green-400'
                }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirmar cambio de estado</h3>
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              {estadoCambio === 'pendiente' && tieneValoradorAsignado ? (
                <>
                  ¿Estás seguro de que deseas cambiar el estado a <span className="font-semibold">Pendiente</span>?
                  <br /><br />
                  <span className="text-amber-600 dark:text-amber-400 font-medium">Esto también desasignará la valoración del valorador actual.</span>
                </>
              ) : (
                <>
                  ¿Estás seguro de que deseas cambiar el estado a <span className="font-semibold">{getEstadoTexto(estadoCambio || 'pendiente')}</span>?
                </>
              )}
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setMostrarConfirmacionEstado(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEstadoChange}
                className={`px-4 py-2 text-white rounded-md transition-colors flex items-center ${
                  estadoCambio === 'pendiente' 
                    ? 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-800' 
                    : estadoCambio === 'en_curso' 
                      ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800' 
                      : 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
      
      <Modal isOpen={open} onClose={onClose} maxWidth="max-w-6xl" showCloseButton={false}>
        {/* Encabezado */}
        <div className="flex justify-between items-center pb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m-4-4v8m0 0l-4 4m4-4l4 4m-8 4h8" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Valoración de: <span className="text-blue-600 dark:text-blue-400">{valoracion.matricula}</span></h2>
                
                {/* Badge de Siniestro Total */}
                {esSiniestroTotal && (
                  <span className="ml-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Siniestro Total
                  </span>
                )}
                
                {/* Badge de Valorador Asignado (Modificado para mostrar el nombre) */}
                {tieneValoradorAsignado && (
                  <span className="ml-3 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Valorador Asignado: {nombreValorador || 'Cargando...'}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          {/* Bloques de información */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 mt-6">
            {/* Información del vehículo */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Datos del vehículo
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Matrícula</h4>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{valoracion.matricula}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Número de Chasis</h4>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{valoracion.chasis}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Motorización</h4>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{valoracion.motorizacion}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Tipo de Póliza</h4>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{valoracion.tipoPoliza}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Aseguradora</h4>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{valoracion.aseguradora}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Fecha Primera Matriculación</h4>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {new Date(valoracion.fechaPrimeraMatriculacion).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Información adicional */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6 h-full">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Información adicional
                </h3>
                <div className="space-y-4">
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Estado</h4>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getBadgeColor(valoracion.estado)}`}>
                        <span className={`mr-1.5 h-2 w-2 rounded-full ${
                          valoracion.estado === 'pendiente' ? 'bg-red-500 dark:bg-red-400' : 
                          valoracion.estado === 'en_curso' ? 'bg-amber-500 dark:bg-amber-400' : 
                          'bg-emerald-500 dark:bg-emerald-400'
                        }`}></span>
                        {getEstadoTexto(valoracion.estado)}
                      </span>
                    </div>
                    
                    {/* Selector de cambio de estado */}
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Cambiar estado</h4>
                      <div className="flex flex-col gap-2">
                        {valoracion.estado !== 'pendiente' && (
                          <button
                            onClick={() => mostrarConfirmacionCambioEstado('pendiente')}
                            className="flex items-center justify-center px-3 py-2 text-sm rounded-md bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Marcar como Pendiente
                          </button>
                        )}
                        
                        {valoracion.estado !== 'en_curso' && (
                          <button
                            onClick={() => mostrarConfirmacionCambioEstado('en_curso')}
                            className="flex items-center justify-center px-3 py-2 text-sm rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/30 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Marcar como En Curso
                          </button>
                        )}
                        
                        {valoracion.estado !== 'finalizado' && (
                          <button
                            onClick={() => mostrarConfirmacionCambioEstado('finalizado')}
                            className="flex items-center justify-center px-3 py-2 text-sm rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-900/30 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Marcar como Finalizado
                          </button>
                        )}
                        
                        {/* Asignación de valorador solo visible para SUPER_ADMIN y estado pendiente */}
                        {esAdmin && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Asignación</h4>
                            {valoracion.estado === 'pendiente' && !tieneValoradorAsignado ? (
                              <button
                                onClick={mostrarConfirmacionAsignarme}
                                disabled={asignandoValoracion}
                                className="flex items-center px-3 py-2 text-sm rounded-md bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:hover:bg-purple-900/30 transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Asignarme esta valoración
                              </button>
                            ) : tieneValoradorAsignado ? (
                              <div className="flex items-center px-3 py-2 text-sm rounded-md bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Valoración asignada
                              </div>
                            ) : (
                              <div className="flex items-center px-3 py-2 text-sm rounded-md bg-gray-50 text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                No disponible en estado {getEstadoTexto(valoracion.estado)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Fecha de alta</h4>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      {new Date(valoracion.fecha_creacion).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  
                  {valoracion.fecha_ult_act && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Última actualización</h4>
                      <p className="text-base font-semibold text-gray-900 dark:text-white">
                        {new Date(valoracion.fecha_ult_act).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  )}
                  
                  {valoracion.fecha_finalizado && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Fecha finalización</h4>
                      <p className="text-base font-semibold text-gray-900 dark:text-white">
                        {new Date(valoracion.fecha_finalizado).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Sección de fotografías */}
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Fotografías adjuntas
              </h3>
            </div>
            
            {/* Visualización de fotografías cargadas */}
            {cargandoFotos ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                {/* Si no hay fotos, mostrar mensaje */}
                {(!fotosConEtiquetas || fotosConEtiquetas.length === 0) && (
                  <div className="text-center py-8">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">No hay fotografías disponibles para esta valoración</p>
                  </div>
                )}

                {/* Si hay fotos, mostrarlas por categorías */}
                {fotosConEtiquetas && fotosConEtiquetas.length > 0 && (
                  <div className="space-y-6">
                    {/* Fotos de documentación */}
                    {getFotosPorTipo('documentacion').length > 0 && (
                      <div>
                        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Documentación</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {getFotosPorTipo('documentacion').map((foto, index) => (
                            <div key={`doc-${index}`} className="relative group">
                              <div 
                                className="aspect-square rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-100 dark:bg-gray-800 relative"
                              >
                                <Image
                                  src={foto.url}
                                  alt={foto.etiqueta}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                  placeholder="empty"
                                  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAEtAJLUn8Q8QAAAABJRU5ErkJggg=="
                                />
                                
                                {/* Overlay con botón de visualización */}
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      console.log("Seleccionando foto documentación:", foto);
                                      setFotoSeleccionada(foto);
                                    }}
                                    className="bg-blue-500 text-white rounded-full p-2 transform scale-90 group-hover:scale-100 transition-transform duration-200"
                                    title="Ver imagen"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              <div className="mt-2 px-1">
                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">{foto.etiqueta}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fotos generales */}
                    {getFotosPorTipo('general').length > 0 && (
                      <div>
                        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Vistas generales</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {getFotosPorTipo('general').map((foto, index) => (
                            <div key={`gen-${index}`} className="relative group">
                              <div 
                                className="aspect-square rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-100 dark:bg-gray-800 relative"
                              >
                                <Image
                                  src={foto.url}
                                  alt={foto.etiqueta}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                  placeholder="empty"
                                  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAEtAJLUn8Q8QAAAABJRU5ErkJggg=="
                                />
                                
                                {/* Overlay con botón de visualización */}
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFotoSeleccionada(foto);
                                    }}
                                    className="bg-blue-500 text-white rounded-full p-2 transform scale-90 group-hover:scale-100 transition-transform duration-200"
                                    title="Ver imagen"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              <div className="mt-2 px-1">
                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">{foto.etiqueta}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fotos de daños */}
                    {getFotosPorTipo('dano').length > 0 && (
                      <div>
                        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Fotografías de daños</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {getFotosPorTipo('dano').map((foto, index) => (
                            <div key={`dano-${index}`} className="relative group">
                              <div 
                                className="aspect-square rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-100 dark:bg-gray-800 relative"
                              >
                                <Image
                                  src={foto.url}
                                  alt={foto.etiqueta}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                  placeholder="empty"
                                  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAEtAJLUn8Q8QAAAABJRU5ErkJggg=="
                                />
                                
                                {/* Overlay con botón de visualización */}
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFotoSeleccionada(foto);
                                    }}
                                    className="bg-blue-500 text-white rounded-full p-2 transform scale-90 group-hover:scale-100 transition-transform duration-200"
                                    title="Ver imagen"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              <div className="mt-2 px-1">
                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">{foto.etiqueta}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fotos de siniestro */}
                    {getFotosPorTipo('siniestro').length > 0 && (
                      <div>
                        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Fotografías de siniestro total</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {getFotosPorTipo('siniestro').map((foto, index) => (
                            <div key={`siniestro-${index}`} className="relative group">
                              <div 
                                className="aspect-square rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-100 dark:bg-gray-800 relative"
                              >
                                <Image
                                  src={foto.url}
                                  alt={foto.etiqueta}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                  placeholder="empty"
                                  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAEtAJLUn8Q8QAAAABJRU5ErkJggg=="
                                />
                                
                                {/* Overlay con botón de visualización */}
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFotoSeleccionada(foto);
                                    }}
                                    className="bg-blue-500 text-white rounded-full p-2 transform scale-90 group-hover:scale-100 transition-transform duration-200"
                                    title="Ver imagen"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              <div className="mt-2 px-1">
                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">{foto.etiqueta}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            
            {/* Selector de Nuevas Fotos (solo visible cuando se activa Y es siniestro total) */}
            {mostrarSelectorFotos && esSiniestroTotal && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">Documentación de Siniestro Total</h4>
                
                {/* Selector de método de captura */}
                <div className="flex border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden mb-4 w-56">
                  <button 
                    onClick={() => setMetodoCaptura('subir')}
                    className={`flex-1 py-2 px-3 text-sm font-medium ${
                      metodoCaptura === 'subir' 
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300' 
                        : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    Subir foto
                  </button>
                  <button 
                    onClick={() => setMetodoCaptura('capturar')}
                    className={`flex-1 py-2 px-3 text-sm font-medium ${
                      metodoCaptura === 'capturar' 
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300' 
                        : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    Hacer foto
                  </button>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Añade hasta {MAX_FOTOS} fotos para documentar el siniestro total. Estas fotos serán evaluadas por nuestro equipo técnico.
                </p>
                
                {/* Grid para seleccionar múltiples fotos */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
                  {/* Fotos ya subidas */}
                  {Object.entries(previewsMap).map(([inputId, url]) => (
                    <div key={inputId} className="relative group">
                      <div className="aspect-square rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-100 dark:bg-gray-800 relative">
                        <div className="relative w-full h-full">
                          <img
                            src={url}
                            alt={`Foto siniestro ${inputId}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-1 right-1 flex space-x-1">
                            {/* Botón para visualizar la imagen */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFotoSeleccionada({
                                  url,
                                  etiqueta: `Foto siniestro ${inputId}`,
                                  tipo: 'siniestro'
                                });
                              }}
                              className="bg-blue-500 text-white rounded-full p-1"
                              title="Ver imagen"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            {/* Botón para eliminar la imagen */}
                            <button
                              type="button"
                              onClick={() => handleEliminarFoto(Number(inputId))}
                              className="bg-red-500 text-white rounded-full p-1"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-center text-gray-600 dark:text-gray-400 truncate">Foto {Number(Object.keys(previewsMap).indexOf(inputId)) + 1}</p>
                    </div>
                  ))}
                  
                  {/* Espacio para agregar nuevas fotos, solo si no hemos llegado al límite */}
                  {Object.keys(previewsMap).length < MAX_FOTOS && (
                    <div className="aspect-square rounded-lg border border-dashed border-gray-300 dark:border-gray-600 overflow-hidden bg-gray-50 dark:bg-gray-700 relative">
                      {metodoCaptura === 'subir' ? (
                        <>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleNuevasFotos(e, Date.now())}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div className="flex flex-col items-center justify-center h-full p-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 dark:text-gray-500 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Subir foto</span>
                          </div>
                        </>
                      ) : (
                        <button 
                          onClick={() => handleCapturarFoto(Date.now())}
                          className="absolute inset-0 w-full h-full flex flex-col items-center justify-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 dark:text-gray-500 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-xs text-gray-500 dark:text-gray-400">Hacer foto</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Botones de acción */}
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {Object.keys(previewsMap).length} de {MAX_FOTOS} fotos añadidas
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setMostrarSelectorFotos(false)}
                      className="px-4 py-2 text-sm bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={Object.keys(previewsMap).length === 0}
                      onClick={handleGuardarFotosSiniestro}
                      className={`px-4 py-2 text-sm flex items-center rounded-md transition-colors ${
                        Object.keys(previewsMap).length === 0
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400'
                          : 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Guardar fotos
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Botones para acciones principales */}
            <div className="mt-6 flex flex-wrap gap-3 justify-end border-t pt-4 border-gray-200 dark:border-gray-700">
              {/* Botón "Marcar como Siniestro Total" disponible para todos */}
              <button
                type="button"
                onClick={mostrarConfirmacionSiniestroTotal}
                disabled={esSiniestroTotal}
                className={`flex items-center px-4 py-2 rounded-md transition-colors duration-200 ${
                  esSiniestroTotal 
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400' 
                    : 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {esSiniestroTotal ? 'Marcado como Siniestro Total' : 'Marcar como Siniestro Total'}
              </button>
              
              {/* Botón para añadir fotos adicionales (solo visible si ya es siniestro total) */}
              {esSiniestroTotal && (
                <button
                  type="button"
                  onClick={() => setMostrarSelectorFotos(!mostrarSelectorFotos)}
                  className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30 rounded-md transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {mostrarSelectorFotos ? 'Ocultar selector de fotos' : 'Añadir Fotos Adicionales'}
                </button>
              )}
            </div>
          </div>
          
          {/* Sección de informe de valoración */}
          {!mostrarSeccionInforme ? (
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6 mb-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Informe técnico
                </h3>
                
                {informeExiste ? (
                  // Si hay informe, todos los usuarios pueden verlo
                  <button 
                    onClick={() => setMostrarSeccionInforme(true)}
                    className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30 rounded-md transition-colors duration-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Ver informe
                  </button>
                ) : esAdmin ? (
                  // Si no hay informe y es admin, puede crearlo
                  <button 
                    onClick={() => setMostrarSeccionInforme(true)}
                    className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30 rounded-md transition-colors duration-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Generar informe
                  </button>
                ) : (
                  // Si no hay informe y no es admin, muestra mensaje estático
                  <div className="flex items-center px-4 py-2 bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400 rounded-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    No hay informe disponible
                  </div>
                )}
              </div>
              
              <div className="mt-4 text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  {informeExiste 
                    ? 'Existe un informe para esta valoración. Haga clic en "Ver informe" para consultarlo.'
                    : (esAdmin 
                      ? 'Aún no se ha generado un informe para esta valoración.'
                      : 'No existe un informe para esta valoración. Solo los administradores pueden generar informes.'
                    )
                  }
                </p>
              </div>
            </div>
          ) : (
            <InformeValoracion 
              valoracion={valoracion} 
              onClose={() => setMostrarSeccionInforme(false)}
              userRole={userRole}
            />
          )}
          
          {/* Sección de Comentarios */}
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Comentarios
            </h3>
            
            {/* Lista de comentarios */}
            <div className="space-y-4 mb-6">
              {comentarios.map((comentario) => (
                <div key={comentario.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium text-blue-600 dark:text-blue-400">{comentario.autor}</h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{comentario.fecha}</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{comentario.texto}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Formulario para añadir comentario */}
            <div className="mt-4">
              <textarea
                placeholder="Escribe tu comentario..."
                rows={3}
                value={nuevoComentario}
                onChange={(e) => setNuevoComentario(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={handleNuevoComentario}
                  disabled={!nuevoComentario.trim()}
                  className={`flex items-center px-4 py-2 rounded-md transition-colors duration-200 ${
                    !nuevoComentario.trim()
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400'
                      : 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  Añadir comentario
                </button>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}; 