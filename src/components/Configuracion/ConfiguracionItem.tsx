import { ReactNode } from 'react';

interface ConfiguracionItemProps {
  title: string;
  description: string;
  onEdit: () => void;
  icon?: ReactNode;
  disabled?: boolean;
}

export const ConfiguracionItem: React.FC<ConfiguracionItemProps> = ({
  title,
  description,
  onEdit,
  icon,
  disabled = false
}) => {
  return (
    <div className="flex items-center justify-between py-5">
      <div className="flex items-start space-x-3">
        {icon && <div className="flex-shrink-0 mt-0.5">{icon}</div>}
        <div>
          <h3 className="text-base font-medium text-gray-900 dark:text-white">{title}</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        disabled={disabled}
        className={`
          inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium
          ${disabled
            ? 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-gray-800 cursor-not-allowed'
            : 'border-transparent text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          }
        `}
      >
        {disabled ? 'Próximamente' : 'Editar'}
      </button>
    </div>
  );
}; 