import { useState, useRef, useEffect } from 'react';
import { Valoracion } from './types';
import { Modal } from '@/components/shared/Modal';
import { useTalleres } from '@/hooks/useTalleres';
import { useValoraciones } from '@/hooks/useValoraciones';
import { BuildingOfficeIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface FormularioNuevaValoracionProps {
  open: boolean;
  onClose: () => void;
  onGuardar: (valoracion: Omit<Valoracion, 'id'>) => void;
}

export const FormularioNuevaValoracion = ({ open, onClose, onGuardar }: FormularioNuevaValoracionProps) => {
  // Estados para las fotos
  const [previewsMap, setPreviewsMap] = useState<Record<string, string>>({});
  const [fotoVisualizacion, setFotoVisualizacion] = useState<string | null>(null);
  // Estado para almacenar los archivos de fotos
  const [fotosFiles, setFotosFiles] = useState<Record<string, File>>({});

  // Hook para obtener los talleres
  const { talleres, tallerSeleccionado, setTallerSeleccionado, loading: loadingTalleres, error: errorTalleres } = useTalleres();
  // Hook para gestionar valoraciones
  const { crearValoracion, loading: loadingValoraciones, fetchValoraciones } = useValoraciones();
  
  // Estado para controlar si el usuario puede seleccionar taller (SUPER_ADMIN, GESTOR_RED)
  const [puedeSeleccionarTaller, setPuedeSeleccionarTaller] = useState(false);
  
  // Efecto para verificar el rol del usuario y establecer si puede seleccionar taller
  useEffect(() => {
    // En una implementación real, esto vendría del contexto de autenticación
    // Por ahora, simplemente asumimos que el usuario puede seleccionar taller
    setPuedeSeleccionarTaller(true);
  }, []);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      toast.loading('Creando valoración...', { id: 'crearValoracion' });
      
      const formData = new FormData(e.currentTarget);
      
      // Verificamos que la matrícula exista para usarla como identificador de carpeta
      const matricula = formData.get('matricula') as string;
      if (!matricula) {
        toast.error('La matrícula es obligatoria', { id: 'crearValoracion' });
        return;
      }
      
      const datosValoracion = {
        matricula,
        chasis: formData.get('chasis') as string,
        motorizacion: formData.get('motorizacion') as string,
        tipoPoliza: formData.get('tipoPoliza') as string,
        aseguradora: formData.get('aseguradora') as string,
        fechaPrimeraMatriculacion: formData.get('fechaPrimeraMatriculacion') as string,
        workshop_id: tallerSeleccionado || undefined
      };
      
      // Verificar datos mínimos necesarios
      if (!datosValoracion.chasis) {
        toast.error('El número de chasis es obligatorio', { id: 'crearValoracion' });
        return;
      }
      
      // Crear la valoración con las fotos
      const resultado = await crearValoracion(datosValoracion, fotosFiles);
      
      if (resultado.success && resultado.data) {
        toast.success('Valoración creada correctamente', { id: 'crearValoracion' });
        
        // Llamar al callback con los datos de la valoración creada
        onGuardar({
          matricula: datosValoracion.matricula,
          chasis: datosValoracion.chasis,
          motorizacion: datosValoracion.motorizacion,
          tipoPoliza: datosValoracion.tipoPoliza,
          aseguradora: datosValoracion.aseguradora,
          fechaPrimeraMatriculacion: datosValoracion.fechaPrimeraMatriculacion,
          estado: 'pendiente',
          fotos: [],
          fecha_creacion: new Date().toISOString(),
          workshop_id: tallerSeleccionado || undefined
        });
        
        onClose();
      } else {
        toast.error(`Error: ${resultado.error || 'No se pudo crear la valoración'}`, { id: 'crearValoracion' });
      }
    } catch (error: any) {
      console.error('Error al crear valoración:', error);
      toast.error(`Error: ${error.message || 'Ha ocurrido un error inesperado'}`, { id: 'crearValoracion' });
    }
  };
  
  // Manejador para cambios en el selector de taller
  const handleTallerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setTallerSeleccionado(value === "" ? null : value);
  };
  
  const handleFotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Obtener el ID del input
    const inputId = e.target.id;
    const file = files[0]; // Solo procesamos la primera foto
    
    // Crear URL para preview
    const objectUrl = URL.createObjectURL(file);
    
    // Guardar la referencia del input ID con su vista previa
    setPreviewsMap(prev => ({
      ...prev,
      [inputId]: objectUrl
    }));
    
    // Guardar el archivo para subirlo después
    setFotosFiles(prev => ({
      ...prev,
      [inputId]: file
    }));
  };

  // Componente reutilizable para inputs de fotos
  const FotoInput = ({ id, label }: { id: string; label: string }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    
    const hasPreview = id in previewsMap;
    
    return (
      <div className="flex flex-col">
        <label htmlFor={id} className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 text-center">
          {label}
        </label>
        <div className="w-full h-32 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden relative">
          {/* Input para seleccionar archivo (oculto) */}
          <input
            ref={fileInputRef}
            id={id}
            name={id}
            type="file"
            accept="image/*"
            onChange={handleFotosChange}
            className="hidden"
          />
          
          {/* Input para capturar con cámara (oculto) */}
          <input
            ref={cameraInputRef}
            id={`${id}-camera`}
            name={`${id}-camera`}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFotosChange}
            className="hidden"
          />
          
          {/* Vista previa si hay imagen */}
          {hasPreview ? (
            <div className="relative w-full h-full">
              <img 
                src={previewsMap[id]} 
                alt={`Vista previa de ${label}`}
                className="w-full h-full object-cover" 
              />
              <div className="absolute top-1 right-1 flex space-x-1">
                {/* Botón para visualizar la imagen */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFotoVisualizacion(previewsMap[id]);
                  }}
                  className="bg-blue-500 text-white rounded-full p-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                {/* Botón para eliminar la imagen */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Eliminar la vista previa
                    setPreviewsMap(prev => {
                      const newMap = {...prev};
                      delete newMap[id];
                      return newMap;
                    });
                    // Eliminar el archivo
                    setFotosFiles(prev => {
                      const newFiles = {...prev};
                      delete newFiles[id];
                      return newFiles;
                    });
                  }}
                  className="bg-red-500 text-white rounded-full p-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 dark:text-gray-500 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              
              <div className="flex space-x-2 mt-1">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center justify-center px-2 py-1 text-xs bg-blue-500 text-white rounded-md"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                  Cámara
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center px-2 py-1 text-xs bg-gray-500 text-white rounded-md"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Galería
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Nueva Valoración">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Selector de Taller */}
          {puedeSeleccionarTaller && (
            <div className="col-span-1 md:col-span-2">
              <label htmlFor="taller" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Taller*
              </label>
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <BuildingOfficeIcon className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                </div>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ChevronDownIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </div>
                <select
                  id="taller"
                  name="taller"
                  value={tallerSeleccionado === null ? "" : String(tallerSeleccionado)}
                  onChange={handleTallerChange}
                  className="block w-full pl-10 pr-10 py-2 text-sm text-gray-700 dark:text-white bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none cursor-pointer transition-colors duration-200"
                  disabled={loadingTalleres || talleres.length === 0 || loadingValoraciones}
                  required
                >
                  <option value="">Seleccionar taller...</option>
                  {talleres.map((taller) => (
                    <option key={String(taller.id)} value={String(taller.id)}>
                      {taller.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {loadingTalleres ? (
                  <span>Cargando talleres...</span>
                ) : errorTalleres ? (
                  <span className="text-red-500">Error: {errorTalleres}</span>
                ) : talleres.length === 0 ? (
                  <span>No hay talleres disponibles</span>
                ) : tallerSeleccionado ? (
                  <span>Taller seleccionado: <span className="font-medium text-indigo-600 dark:text-indigo-400">{talleres.find(t => String(t.id) === String(tallerSeleccionado))?.nombre}</span></span>
                ) : (
                  <span>Seleccione un taller para continuar</span>
                )}
              </div>
            </div>
          )}
          
          <div>
            <label htmlFor="matricula" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Matrícula*
            </label>
            <input
              id="matricula"
              name="matricula"
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Ej: 1234 ABC"
              disabled={loadingValoraciones}
            />
          </div>
          
          <div>
            <label htmlFor="chasis" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Número de Chasis*
            </label>
            <input
              id="chasis"
              name="chasis"
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Ej: VF1RFA00066123456"
              disabled={loadingValoraciones}
            />
          </div>
          
          <div>
            <label htmlFor="motorizacion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Motorización*
            </label>
            <input
              id="motorizacion"
              name="motorizacion"
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Ej: Diésel 2.0"
              disabled={loadingValoraciones}
            />
          </div>
          
          <div>
            <label htmlFor="tipoPoliza" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo de Póliza*
            </label>
            <select
              id="tipoPoliza"
              name="tipoPoliza"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={loadingValoraciones}
            >
              <option value="">Seleccionar...</option>
              <option value="Todo riesgo">Todo riesgo</option>
              <option value="Todo riesgo sin franquicia">Todo riesgo sin franquicia</option>
              <option value="Terceros básico">Terceros básico</option>
              <option value="Terceros ampliado">Terceros ampliado</option>
              <option value="Otros">Otros</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="aseguradora" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Aseguradora*
            </label>
            <input
              id="aseguradora"
              name="aseguradora"
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Ej: Mapfre"
              disabled={loadingValoraciones}
            />
          </div>
          
          <div>
            <label htmlFor="fechaPrimeraMatriculacion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha Primera Matriculación*
            </label>
            <input
              id="fechaPrimeraMatriculacion"
              name="fechaPrimeraMatriculacion"
              type="date"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={loadingValoraciones}
            />
          </div>
        </div>
        
        {/* Sección de fotografías mejorada */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 border-b dark:border-gray-700 pb-2">Fotografías del Vehículo</h3>
          
          {/* 1. Sección de Ficha Técnica */}
          <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 bg-gray-50 dark:bg-gray-700 p-2 rounded">Ficha Técnica</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <FotoInput id="foto-ficha-tecnica-1" label="Ficha Técnica 1" />
              <FotoInput id="foto-ficha-tecnica-2" label="Ficha Técnica 2" />
              <FotoInput id="foto-ficha-tecnica-3" label="Ficha Técnica 3" />
              <FotoInput id="foto-ficha-tecnica-4" label="Ficha Técnica 4" />
            </div>
          </div>
          
          {/* 2. Sección de Cuentakilómetros */}
          <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 bg-gray-50 dark:bg-gray-700 p-2 rounded">Cuentakilómetros (KM)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 gap-4">
              <FotoInput id="foto-cuentakilometros" label="Cuentakilómetros" />
            </div>
          </div>
          
          {/* 3. Fotos generales */}
          <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 bg-gray-50 dark:bg-gray-700 p-2 rounded">Fotos generales</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <FotoInput id="foto-delantera-derecha" label="Delantera Derecha" />
              <FotoInput id="foto-delantera-izquierda" label="Delantera Izquierda" />
              <FotoInput id="foto-trasera-derecha" label="Trasera Derecha" />
              <FotoInput id="foto-trasera-izquierda" label="Trasera Izquierda" />
            </div>
          </div>
          
          {/* 4. Fotos de daños */}
          <div className="mb-8">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 bg-gray-50 dark:bg-gray-700 p-2 rounded">Fotos de daños</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, index) => (
                <FotoInput 
                  key={`foto-dano-${index + 1}`} 
                  id={`foto-dano-${index + 1}`} 
                  label={`Foto ${index + 1}`} 
                />
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loadingValoraciones}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loadingValoraciones}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loadingValoraciones ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              </>
            ) : (
              'Guardar'
            )}
          </button>
        </div>
      </form>
      
      {/* Modal para visualizar la imagen a tamaño completo */}
      {fotoVisualizacion && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[150] p-4"
          onClick={() => setFotoVisualizacion(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={fotoVisualizacion} 
              alt="Vista ampliada de la fotografía" 
              className="max-w-full max-h-[85vh] object-contain"
            />
            <button
              type="button"
              onClick={() => setFotoVisualizacion(null)}
              className="absolute top-2 right-2 bg-gray-800 dark:bg-gray-700 text-white rounded-full p-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}; 