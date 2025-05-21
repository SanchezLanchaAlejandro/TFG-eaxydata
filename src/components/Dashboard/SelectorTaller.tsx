interface SelectorTallerProps {
  talleres: Array<{ id: number; nombre: string }>;
  tallerSeleccionado: string | number | null;
  onSeleccionarTaller: (tallerId: string | null) => void;
  className?: string;
}

const SelectorTaller = ({ 
  talleres, 
  tallerSeleccionado, 
  onSeleccionarTaller,
  className = ''
}: SelectorTallerProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const valor = e.target.value;
    // Si el valor es "todos", pasamos null para indicar todos los talleres
    onSeleccionarTaller(valor === "todos" ? null : valor);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label htmlFor="selector-taller" className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Taller:
      </label>
      <select
        id="selector-taller"
        value={tallerSeleccionado || "todos"}
        onChange={handleChange}
        className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
      >
        <option value="todos">Todos los talleres</option>
        {talleres?.map((taller: { id: number; nombre: string }) => (
          <option 
            key={taller.id} 
            value={taller.id}
            selected={tallerSeleccionado === String(taller.id) || tallerSeleccionado === Number(taller.id)}
          >
            {taller.nombre}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SelectorTaller; 