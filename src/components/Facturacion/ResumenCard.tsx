import { ReactNode } from 'react';

interface ResumenCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon?: ReactNode;
  iconBgClass?: string;
  textClass?: string;
}

export const ResumenCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  iconBgClass = "bg-indigo-100 dark:bg-indigo-900/40", 
  textClass = "text-indigo-600 dark:text-indigo-400" 
}: ResumenCardProps) => {
  return (
    <div className="bg-white dark:bg-slate-800 shadow rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-4 py-5 sm:p-6 flex items-center">
        {icon && (
          <div className={`rounded-full ${iconBgClass} p-3 mr-4`}>
            {icon}
          </div>
        )}
        <div>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</div>
          <div className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
            {value}
          </div>
        </div>
      </div>
      <div className="bg-gray-50 dark:bg-slate-700/30 px-4 py-3">
        <div className={`text-sm ${textClass}`}>
          {subtitle}
        </div>
      </div>
    </div>
  );
}; 