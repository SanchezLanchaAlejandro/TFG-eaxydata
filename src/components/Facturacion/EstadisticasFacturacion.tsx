import { useMemo, useEffect, useState } from 'react';
import { Factura } from './types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  TooltipItem,
  Chart,
  Plugin
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Registrar los componentes necesarios de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Función para formatear cantidades como moneda
const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('es-ES', {
    style: 'currency',
    currency: 'EUR'
  });
};

// Función para obtener clave de mes (para ordenación)
const obtenerClaveMes = (fecha: Date): string => {
  return `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}`;
};

// Función para formatear mes corto
const formatearMesCorto = (fecha: Date): string => {
  return fecha.toLocaleDateString('es-ES', { month: 'short' }).toLowerCase();
};

// Interfaz para los datos estadísticos de facturación
interface EstadisticasData {
  totalFacturas: number;
  facturacionTotal: number;
  facturacionUltimos30Dias: number;
  facturacionPorMes: Record<string, number>;
  clientesMasFacturados: Array<{
    cliente: string;
    total: number;
    cantidadFacturas: number;
  }>;
}

interface EstadisticasFacturacionProps {
  facturas: Factura[];
}

export const EstadisticasFacturacion = ({ facturas }: EstadisticasFacturacionProps) => {
  // Estado para detectar el tema oscuro
  const [isDarkMode, setIsDarkMode] = useState(false);
  // Estado para forzar recálculos cuando se actualiza una factura
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Detectar el tema oscuro
  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const htmlElement = document.documentElement;
    
    const updateTheme = () => {
      const isDark = 
        darkModeMediaQuery.matches || 
        htmlElement.classList.contains('dark') || 
        localStorage.theme === 'dark';
      setIsDarkMode(isDark);
    };
    
    updateTheme();
    darkModeMediaQuery.addEventListener('change', updateTheme);
    
    // Observer para detectar cambios en el elemento html
    const observer = new MutationObserver(updateTheme);
    observer.observe(htmlElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => {
      darkModeMediaQuery.removeEventListener('change', updateTheme);
      observer.disconnect();
    };
  }, []);

  // Efecto para escuchar el evento de actualización de facturas
  useEffect(() => {
    // Función para manejar el evento de actualización de facturas
    const handleFacturaActualizada = (event: Event) => {
      const customEvent = event as CustomEvent;
      
      // Si el evento tiene datos específicos de la factura actualizada
      if (customEvent.detail) {
        const { facturaId, nuevoEstado, accion } = customEvent.detail;
        
        // Si es una actualización de estado de cobro, forzar recálculo
        if (accion === 'estadoCobro' && facturaId) {
          // Incrementar el refreshKey para forzar que los useMemo se recalculen
          setRefreshKey(prev => prev + 1);
        }
      }
    };

    // Añadir listener para el evento personalizado
    window.addEventListener('facturaActualizada', handleFacturaActualizada);

    // Limpiar el listener cuando el componente se desmonte
    return () => {
      window.removeEventListener('facturaActualizada', handleFacturaActualizada);
    };
  }, []);

  // Filtrar solo las facturas cobradas para los cálculos de facturación
  const facturasCobradas = useMemo(() => {
    return facturas.filter(factura => factura.estadoCobro === true);
  }, [facturas, refreshKey]);

  // Calcular todas las estadísticas relevantes
  const estadisticas: EstadisticasData = useMemo(() => {
    // Fecha actual y fecha hace 30 días
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);
    
    // Facturación de los últimos 30 días (solo facturas cobradas)
    const facturasUltimos30Dias = facturasCobradas.filter(factura => {
      const fechaFactura = new Date(factura.fechaEmision);
      return fechaFactura >= hace30Dias && fechaFactura <= hoy;
    });
    
    // Generar meses para asegurar que siempre tenemos los últimos 6 meses
    const mesesGenerados: Record<string, { fecha: Date, clave: string, importe: number }> = {};
    
    // Generar los últimos 6 meses con sus claves
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date();
      fecha.setDate(1); // Primer día del mes para evitar problemas con el día del mes
      fecha.setMonth(fecha.getMonth() - i);
      
      const clave = obtenerClaveMes(fecha);
      mesesGenerados[clave] = {
        fecha,
        clave,
        importe: 0
      };
    }
    
    // Facturación por cliente (solo facturas cobradas)
    const facturacionPorCliente: Record<string, { total: number; cantidadFacturas: number }> = {};
    
    // Procesar todas las facturas cobradas para las distintas estadísticas
    facturasCobradas.forEach(factura => {
      // Agrupar por mes
      const fechaFactura = new Date(factura.fechaEmision);
      const claveFactura = obtenerClaveMes(fechaFactura);
      
      // Añadir importe si el mes está dentro de los últimos 6 meses
      if (mesesGenerados[claveFactura]) {
        mesesGenerados[claveFactura].importe += factura.importe;
      }
      
      // Agrupar por cliente
      if (!facturacionPorCliente[factura.cliente]) {
        facturacionPorCliente[factura.cliente] = { total: 0, cantidadFacturas: 0 };
      }
      facturacionPorCliente[factura.cliente].total += factura.importe;
      facturacionPorCliente[factura.cliente].cantidadFacturas += 1;
    });
    
    // Convertir mesesGenerados a facturacionPorMes
    const facturacionPorMes: Record<string, number> = {};
    Object.values(mesesGenerados).forEach(mes => {
      const nombreMes = formatearMesCorto(mes.fecha);
      const año = mes.fecha.getFullYear().toString().slice(2); // Últimos dos dígitos del año
      facturacionPorMes[`${nombreMes} '${año}`] = mes.importe;
    });
    
    // Ordenar clientes por total facturado (descendente)
    const clientesMasFacturados = Object.entries(facturacionPorCliente)
      .map(([cliente, datos]) => ({
        cliente,
        total: datos.total,
        cantidadFacturas: datos.cantidadFacturas
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5); // Top 5 clientes
    
    return {
      totalFacturas: facturasCobradas.length,
      facturacionTotal: facturasCobradas.reduce((sum, factura) => sum + factura.importe, 0),
      facturacionUltimos30Dias: facturasUltimos30Dias.reduce((sum, factura) => sum + factura.importe, 0),
      facturacionPorMes,
      clientesMasFacturados
    };
  }, [facturasCobradas]);

  // Preparar datos para el gráfico de barras (últimos 6 meses)
  const chartData = useMemo(() => {
    const labels = Object.keys(estadisticas.facturacionPorMes);
    const datos = Object.values(estadisticas.facturacionPorMes);
    
    return {
      labels,
      datasets: [
        {
          label: 'Facturación',
          data: datos,
          backgroundColor: 'rgba(59, 130, 246, 0.7)', // Azul semi-transparente
          borderColor: 'rgba(59, 130, 246, 1)', // Azul sólido para el borde
          borderWidth: 1,
          borderRadius: 4,
          hoverBackgroundColor: 'rgba(59, 130, 246, 0.9)',
        },
      ],
    };
  }, [estadisticas.facturacionPorMes]);

  // Función para formatear valores compactos (para etiquetas)
  const formatCompactCurrency = (value: number): string => {
    // Para valores grandes, usar notación compacta
    if (value >= 1000) {
      if (value >= 1000000) {
        return (value / 1000000).toFixed(1) + 'M€';
      }
      return (value / 1000).toFixed(1) + 'K€';
    }
    // Para valores pequeños, usar notación normal
    return value.toFixed(0) + '€';
  };

  // Plugin para mostrar valores encima de las barras (siempre)
  const datalabelsPlugin: Plugin<'bar'> = {
    id: 'datalabels',
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      chart.data.datasets.forEach((dataset, datasetIndex) => {
        const meta = chart.getDatasetMeta(datasetIndex);
        if (!meta.hidden) {
          meta.data.forEach((element, index) => {
            const value = dataset.data[index] as number;
            if (value > 0) {
              // Posición del texto
              const x = (element as any).x;
              const y = (element as any).y;
              
              // Formatear valor
              const formattedValue = formatCurrency(value).replace('€', '').trim();
              
              // Configurar texto
              ctx.font = 'bold 11px Arial';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'bottom';
              ctx.fillStyle = isDarkMode ? '#ffffff' : '#374151';
              
              // Posicionar 10px encima de la barra
              const labelY = y - 10;
              
              // Dibujar texto directamente (sin fondo)
              ctx.fillText(formattedValue, x, labelY);
            }
          });
        }
      });
    }
  };

  // Opciones para la gráfica
  const chartOptions = useMemo(() => {
    const fontColor = isDarkMode ? '#e5e7eb' : '#6b7280';
    const gridColor = isDarkMode ? 'rgba(156, 163, 175, 0.15)' : 'rgba(156, 163, 175, 0.1)';
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false, // Ocultar leyenda ya que solo hay una serie
        },
        tooltip: {
          backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
          titleColor: isDarkMode ? '#e5e7eb' : '#374151',
          bodyColor: isDarkMode ? '#e5e7eb' : '#374151',
          borderColor: isDarkMode ? 'rgba(71, 85, 105, 0.5)' : 'rgba(203, 213, 225, 0.5)',
          borderWidth: 1,
          padding: 10,
          cornerRadius: 4,
          callbacks: {
            label: function(context: TooltipItem<'bar'>) {
              return formatCurrency(context.parsed.y);
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: fontColor,
            callback: function(value: number | string) {
              if (typeof value === 'number') {
                return formatCurrency(value).replace('€', '').trim();
              }
              return value;
            }
          },
          grid: {
            color: gridColor
          },
          border: {
            color: isDarkMode ? 'rgba(107, 114, 128, 0.3)' : 'rgba(107, 114, 128, 0.1)'
          },
          suggestedMax: (context: any) => {
            // Añadir un 25% extra de espacio en la parte superior para las etiquetas
            const maxValue = Math.max(...Object.values(estadisticas.facturacionPorMes), 0);
            return maxValue * 1.25;
          }
        },
        x: {
          ticks: {
            color: fontColor,
          },
          grid: {
            display: false
          },
          border: {
            color: isDarkMode ? 'rgba(107, 114, 128, 0.3)' : 'rgba(107, 114, 128, 0.1)'
          }
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      },
      interaction: {
        mode: 'index' as const,
        intersect: false,
      }
    } as ChartOptions<'bar'>;
  }, [isDarkMode, estadisticas.facturacionPorMes]);

  return (
    <div className="bg-white dark:bg-slate-800 shadow rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">
          Estadísticas de Facturación
        </h3>
        
        {/* Gráfico de barras por mes */}
        <div>
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
            Facturación por mes (últimos 6 meses)
          </h4>
          
          <div className="bg-gray-50 dark:bg-slate-700/30 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="h-64">
              <Bar data={chartData} options={chartOptions} plugins={[datalabelsPlugin]} />
            </div>
          </div>
        </div>
        
        {/* Top clientes por facturación */}
        <div className="mt-8">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
            Top Clientes por Facturación
          </h4>
          
          <div className="bg-gray-50 dark:bg-slate-700/30 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-100 dark:bg-slate-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Facturas
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                {estadisticas.clientesMasFacturados.length > 0 ? (
                  estadisticas.clientesMasFacturados.map((cliente, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {cliente.cliente}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">
                        {cliente.cantidadFacturas}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-white">
                        {formatCurrency(cliente.total)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No hay datos disponibles
                    </td>
                  </tr>
                )}
                
                {/* Si no hay suficientes clientes, mostrar filas vacías */}
                {estadisticas.clientesMasFacturados.length > 0 && 
                 estadisticas.clientesMasFacturados.length < 5 && 
                 Array.from({ length: 5 - estadisticas.clientesMasFacturados.length }).map((_, index) => (
                  <tr key={`empty-${index}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 dark:text-gray-500">-</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-400 dark:text-gray-500">-</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-400 dark:text-gray-500">-</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}; 