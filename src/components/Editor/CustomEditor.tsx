import React, { useEffect, useRef, useState } from 'react';
import 'react-quill/dist/quill.snow.css';

interface CustomEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function CustomEditor({ value, onChange, className = '' }: CustomEditorProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Inicializar el cliente
  useEffect(() => {
    setIsClient(true);
    
    return () => {
      if (editorRef.current && typeof editorRef.current.destroy === 'function') {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []);
  
  // Inicializar Quill cuando estemos en el cliente
  useEffect(() => {
    if (!isClient || editorRef.current) return;
    
    const initQuill = async () => {
      try {
        const Quill = (await import('quill')).default;
        
        // Configuración del editor
        const modules = {
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
            [{'align': []}, {'color': []}, {'background': []}],
            ['link'],
            ['clean']
          ],
        };
        
        const formats = [
          'header',
          'bold', 'italic', 'underline', 'strike', 'blockquote',
          'list', 'bullet', 'indent',
          'align', 'color', 'background',
          'link'
        ];
        
        // Asegurarse de que el contenedor existe
        if (!containerRef.current) {
          console.error('Contenedor del editor no encontrado');
          return;
        }
        
        // Crear el editor
        const quill = new Quill(containerRef.current, {
          theme: 'snow',
          modules,
          formats,
          placeholder: 'Escriba el contenido aquí...',
        });
        
        // Establecer el contenido inicial
        if (value) {
          const delta = quill.clipboard.convert(value);
          quill.setContents(delta, 'silent');
        }
        
        // Manejar cambios en el editor
        quill.on('text-change', () => {
          const newContent = quill.root.innerHTML;
          onChange(newContent);
        });
        
        // Guardar referencia al editor
        editorRef.current = quill;
      } catch (error) {
        console.error('Error al inicializar el editor:', error);
      }
    };
    
    initQuill();
  }, [isClient, onChange, value]);
  
  // Actualizar el contenido cuando cambia el prop value
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.root.innerHTML) {
      editorRef.current.root.innerHTML = value;
    }
  }, [value]);
  
  return (
    <div className={`${className} relative`}>
      {!isClient ? (
        <div className="h-96 w-full flex items-center justify-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div 
          ref={containerRef} 
          id="quill-container" 
          className="min-h-[400px]"
        ></div>
      )}
    </div>
  );
} 