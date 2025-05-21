import React, { useState } from 'react';
import { 
  DndContext, 
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
  rectIntersection,
  pointerWithin,
  CollisionDetection
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Valoracion } from './types';
import { TarjetaValoracion } from './TarjetaValoracion';
import { toast } from 'react-hot-toast';

interface ValoracionesKanbanProps {
  valoraciones: Valoracion[];
  onValoracionClick: (id: string) => void;
  onEstadoChange?: (id: string, nuevoEstado: 'pendiente' | 'en_curso' | 'finalizado') => void;
}

type Columna = {
  id: string;
  titulo: string;
  valoraciones: Valoracion[];
  color: string;
  bgColor: string;
  borderColor: string;
};

// Componente para tarjeta arrastrable
const TarjetaArrastrable = ({ valoracion, onClick }: { valoracion: Valoracion, onClick: (id: string) => void }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: valoracion.id,
    data: {
      type: 'valoracion',
      valoracion,
      estadoActual: valoracion.estado
    }
  });
  
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 10
  } : undefined;
  
  // Si está siendo arrastrada, no mostramos nada en la posición original
  if (isDragging) {
    return <div ref={setNodeRef} className="h-0 w-full overflow-hidden" />;
  }
  
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...listeners} 
      {...attributes}
      className="cursor-grab active:cursor-grabbing transition-all duration-150 hover:shadow-md hover:-translate-y-0.5"
    >
      <TarjetaValoracion 
        valoracion={valoracion} 
        onClick={onClick} 
      />
    </div>
  );
};

// Componente para columna que puede recibir elementos
const ColumnaKanban = ({ 
  columna, 
  onValoracionClick 
}: { 
  columna: Columna, 
  onValoracionClick: (id: string) => void 
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: columna.id,
    data: {
      type: 'columna',
      columna
    }
  });
  
  return (
    <div
      ref={setNodeRef}
      className={`${columna.bgColor} p-4 rounded-lg shadow-sm border ${columna.borderColor} transition-all duration-200 
        ${isOver 
          ? 'ring-2 ring-blue-500 shadow-lg transform scale-[1.02]' 
          : 'hover:shadow-md'}`
      }
    >
      <h3 className={`font-semibold text-lg mb-4 ${columna.color} flex items-center justify-between`}>
        <span>{columna.titulo}</span>
        <span className="bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-full text-sm shadow-sm">
          {columna.valoraciones.length}
        </span>
      </h3>
      
      <div 
        className={`min-h-[200px] space-y-3 ${isOver ? 'bg-white/30 dark:bg-slate-700/20 rounded-lg p-2' : ''}`}
      >
        {columna.valoraciones.length > 0 ? (
          columna.valoraciones.map(valoracion => (
            <TarjetaArrastrable
              key={valoracion.id}
              valoracion={valoracion}
              onClick={onValoracionClick}
            />
          ))
        ) : (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400 italic bg-white/50 dark:bg-slate-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
            No hay valoraciones
          </div>
        )}
      </div>
    </div>
  );
};

export const ValoracionesKanban = ({ 
  onValoracionClick, 
  valoraciones,
  onEstadoChange 
}: ValoracionesKanbanProps) => {
  const [activaValoracion, setActivaValoracion] = useState<Valoracion | null>(null);
  const [activeDroppableId, setActiveDroppableId] = useState<string | null>(null);
  const [valoracionesLocales, setValoracionesLocales] = useState<Valoracion[]>(valoraciones);
  
  // Actualizar valoraciones locales cuando cambian las props
  React.useEffect(() => {
    setValoracionesLocales(valoraciones);
  }, [valoraciones]);
  
  // Modificar función handleValoracionClick para incluir el nuevo manejador
  const handleValoracionClick = (id: string) => {
    onValoracionClick(id);
  };
  
  // Sensores para detectar eventos de arrastre
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Crear un detector de colisiones personalizado
  const customCollisionDetection: CollisionDetection = (args) => {
    // Usamos pointerWithin como primera opción para detectar cuando el puntero está dentro de una columna
    const pointerCollisions = pointerWithin(args);
    
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    
    // Si no hay colisiones con pointerWithin, usamos rectIntersection como respaldo
    return rectIntersection(args);
  };
  
  // Manejadores de eventos de arrastre
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const id = active.id.toString();
    
    // Encontrar la valoración en alguna de las columnas
    const valoracion = valoracionesLocales.find(v => v.id === id);
    
    if (valoracion) {
      setActivaValoracion(valoracion);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (over) {
      const activeId = active.id.toString();
      const overId = over.id.toString();
      
      // Verificar si estamos sobre una columna válida
      if (['pendiente', 'en_curso', 'finalizado'].includes(overId)) {
        setActiveDroppableId(overId);
      }
    } else {
      setActiveDroppableId(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    // Resetear la valoración activa y el droppable activo
    setActivaValoracion(null);
    setActiveDroppableId(null);
    
    // Si no hay elemento sobre el que soltar, no hay cambio
    if (!over) {
      return;
    }
    
    const valoracionId = active.id.toString();
    const destinoId = over.id.toString();
    
    
    // Verificar si estamos soltando sobre una columna válida
    if (['pendiente', 'en_curso', 'finalizado'].includes(destinoId)) {
      // Buscar la valoración en el estado local
      const valoracion = valoracionesLocales.find(v => v.id === valoracionId);
      
      if (valoracion) {
        // Obtener el estado actual directamente de la valoración
        const estadoActual = valoracion.estado;
        
        // Solo actualizar si el estado es diferente
        if (estadoActual !== destinoId) {
          // Actualizar estado local
          setValoracionesLocales(prev => 
            prev.map(v => 
              v.id === valoracionId 
                ? { ...v, estado: destinoId as 'pendiente' | 'en_curso' | 'finalizado' } 
                : v
            )
          );
          
          // Llamar a la función proporcionada por el componente padre
          if (onEstadoChange) {
            onEstadoChange(valoracionId, destinoId as 'pendiente' | 'en_curso' | 'finalizado');
            // Mostrar notificación
            toast.success('Estado de la valoración actualizado correctamente.');
          }
        } else {
          console.log('No se requiere cambio de estado - mismo estado actual');
        }
      }
    } else {
      console.log('Destino no válido:', destinoId);
    }
  };

  // Preparamos las columnas directamente desde las valoraciones locales filtradas
  const columnas: Columna[] = [
    { 
      id: 'pendiente', 
      titulo: 'Pendientes', 
      valoraciones: valoracionesLocales.filter(v => {
        // Normalizar el valor de estado para la comparación
        const estado = v.estado.toLowerCase().trim();
        return estado === 'pendiente';
      }),
      color: 'text-red-500 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800/30'
    },
    { 
      id: 'en_curso', 
      titulo: 'En Curso', 
      valoraciones: valoracionesLocales.filter(v => {
        // Normalizar el valor de estado para la comparación
        const estado = v.estado.toLowerCase().trim();
        return estado === 'en_curso' || estado === 'en curso' || estado === 'proceso';
      }),
      color: 'text-amber-500 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      borderColor: 'border-amber-200 dark:border-amber-800/30'
    },
    { 
      id: 'finalizado', 
      titulo: 'Finalizadas', 
      valoraciones: valoracionesLocales.filter(v => {
        // Normalizar el valor de estado para la comparación
        const estado = v.estado.toLowerCase().trim();
        return estado === 'finalizado' || estado === 'terminado' || estado === 'completado';
      }),
      color: 'text-emerald-500 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      borderColor: 'border-emerald-200 dark:border-emerald-800/30'
    }
  ];
  
  return (
    <div className="p-6 bg-white dark:bg-slate-800 rounded-lg">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Panel Kanban</h2>
      
      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columnas.map(columna => (
            <ColumnaKanban 
              key={columna.id} 
              columna={columna} 
              onValoracionClick={handleValoracionClick} 
            />
          ))}
        </div>
        
        <DragOverlay>
          {activaValoracion ? (
            <div className="shadow-xl">
              <TarjetaValoracion
                valoracion={activaValoracion}
                onClick={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}; 