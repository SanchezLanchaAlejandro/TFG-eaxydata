import AuthGuard from '@/components/Auth/AuthGuard';
import Sidebar from '@/components/Dashboard/Sidebar';
import IndicadoresNegocio from '@/components/Indicadores/IndicadoresNegocio';

export default function IndicadoresPage() {
  return (
    <AuthGuard>
      <Sidebar>
        <div className="py-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Gestión de Indicadores de Negocio
          </h1>
          
          <IndicadoresNegocio />
        </div>
      </Sidebar>
    </AuthGuard>
  );
} 