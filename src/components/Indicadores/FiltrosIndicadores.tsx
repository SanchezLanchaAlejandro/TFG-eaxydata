"use client";

import React from "react";
import {
  BuildingOfficeIcon,
  CalendarIcon,
  ChartBarIcon,
  XCircleIcon,
  CheckCircleIcon,
  LockClosedIcon
} from "@heroicons/react/24/outline";
import { useTalleres } from "@/hooks/useTalleres";

// Generar años (últimos 5 años incluyendo el actual)
const generarAnios = (): number[] => {
  const anioActual = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => anioActual - i);
};

const anios = generarAnios();

// Meses del año
const meses = [
  { valor: 0, nombre: "Enero" },
  { valor: 1, nombre: "Febrero" },
  { valor: 2, nombre: "Marzo" },
  { valor: 3, nombre: "Abril" },
  { valor: 4, nombre: "Mayo" },
  { valor: 5, nombre: "Junio" },
  { valor: 6, nombre: "Julio" },
  { valor: 7, nombre: "Agosto" },
  { valor: 8, nombre: "Septiembre" },
  { valor: 9, nombre: "Octubre" },
  { valor: 10, nombre: "Noviembre" },
  { valor: 11, nombre: "Diciembre" },
];

export interface FiltrosIndicadoresState {
  taller: string | number | "";
  fechaDesde: string;
  fechaHasta: string;
  mes: number | null;
  anio: number | null;
  modoTemporal: "rango" | "mesAnio" | null;
}

interface FiltrosIndicadoresProps {
  filtros: FiltrosIndicadoresState;
  onChange: (filtros: FiltrosIndicadoresState) => void;
  userRole?: string | null;
}

// Estado inicial para los filtros
export const filtrosInicialesState: FiltrosIndicadoresState = {
  taller: "",
  fechaDesde: "",
  fechaHasta: "",
  mes: null,
  anio: null,
  modoTemporal: null
};

export const FiltrosIndicadores: React.FC<FiltrosIndicadoresProps> = ({
  filtros,
  onChange,
  userRole
}) => {
  // Obtener los talleres disponibles según el rol del usuario
  const { talleres, loading: loadingTalleres } = useTalleres();

  // Handler para el cambio de taller
  const handleTallerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    
    // Si el valor está vacío, establecer a cadena vacía, sino mantener el valor como string
    if (value === "") {
      onChange({
        ...filtros,
        taller: "",
      });
    } else {
      // Mantener el ID como string para soportar UUIDs
      onChange({
        ...filtros,
        taller: value,
      });
    }
  };

  // Handler para el cambio de fecha desde
  const handleFechaDesdeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...filtros,
      fechaDesde: e.target.value,
      modoTemporal: "rango",
      mes: null,
      anio: null,
    });
  };

  // Handler para el cambio de fecha hasta
  const handleFechaHastaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...filtros,
      fechaHasta: e.target.value,
      modoTemporal: "rango",
      mes: null,
      anio: null,
    });
  };

  // Handler para el cambio de mes
  const handleMesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onChange({
      ...filtros,
      mes: value ? parseInt(value) : null,
      modoTemporal: "mesAnio",
      fechaDesde: "",
      fechaHasta: "",
    });
  };

  // Handler para el cambio de año
  const handleAnioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onChange({
      ...filtros,
      anio: value ? parseInt(value) : null,
      modoTemporal: "mesAnio",
      fechaDesde: "",
      fechaHasta: "",
    });
  };

  // Handler para limpiar todos los filtros
  const handleLimpiarFiltros = () => {
    onChange(filtrosInicialesState);
  };

  // Verifica si hay algún filtro activo para habilitar el botón de limpiar
  const hayFiltrosActivos = filtros.taller !== "" || filtros.modoTemporal !== null;

  // Verifica si el filtro de mes/año está activo y completo
  const mesAnioActivo = 
    filtros.modoTemporal === "mesAnio" && 
    filtros.mes !== null && 
    filtros.anio !== null;

  // Verifica si el filtro de rango está activo y tiene al menos fecha desde
  const rangoActivo = 
    filtros.modoTemporal === "rango" && 
    filtros.fechaDesde !== "";

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Filtros
        </h3>
        
        {/* Botón para limpiar filtros */}
        <button
          type="button"
          onClick={handleLimpiarFiltros}
          disabled={!hayFiltrosActivos}
          className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            hayFiltrosActivos
              ? "bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-800/40"
              : "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600"
          }`}
        >
          <XCircleIcon className="h-4 w-4 mr-1.5" />
          Limpiar filtros
        </button>
      </div>

      {/* Selector de taller - mostrado sólo si el usuario NO es un taller */}
      {userRole !== 'GESTOR_TALLER' && (
        <div className="mb-6">
          <label
            htmlFor="taller-select"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Taller
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
            </div>
            <select
              id="taller-select"
              value={filtros.taller}
              onChange={handleTallerChange}
              className="block w-full pl-10 pr-3 py-2 text-base border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white sm:text-sm"
              disabled={loadingTalleres}
            >
              <option value="">Seleccione un taller</option>
              {talleres.map((taller) => (
                <option key={taller.id} value={taller.id}>
                  {taller.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Filtros temporales */}
      <div className="space-y-4">
        <h4 className="text-base font-medium text-gray-800 dark:text-gray-200">
          Periodo de tiempo
        </h4>

        {/* Opción 1: Filtrado por mes y año */}
        <div className={`rounded-md transition-all duration-300 ${
          mesAnioActivo 
            ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-600" 
            : filtros.modoTemporal === "rango" 
              ? "bg-gray-50 dark:bg-slate-700/30 opacity-60" 
              : "bg-gray-50 dark:bg-slate-700/30"
        }`}>
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h5 className={`text-sm font-medium ${
                mesAnioActivo 
                  ? "text-blue-700 dark:text-blue-400" 
                  : "text-gray-700 dark:text-gray-300"
              }`}>
                Filtrar por mes y año
              </h5>
              {filtros.modoTemporal === "rango" && (
                <div className="flex items-center text-amber-600 dark:text-amber-400 text-xs font-medium">
                  <LockClosedIcon className="h-4 w-4 mr-1" />
                  <span>Desactivado por filtro de rango</span>
                </div>
              )}
              {mesAnioActivo && (
                <div className="flex items-center text-green-600 dark:text-green-400 text-xs font-medium">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  <span>Activo</span>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {/* Selector de mes */}
              <div className="w-full sm:w-1/2">
                <label
                  htmlFor="mes-select"
                  className={`block text-sm font-medium mb-1 ${
                    mesAnioActivo 
                      ? "text-blue-700 dark:text-blue-400" 
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  Mes
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className={`h-5 w-5 ${
                      mesAnioActivo 
                        ? "text-blue-500 dark:text-blue-400" 
                        : "text-gray-400"
                    }`} />
                  </div>
                  <select
                    id="mes-select"
                    value={filtros.mes !== null ? filtros.mes : ""}
                    onChange={handleMesChange}
                    disabled={filtros.modoTemporal === "rango"}
                    className={`block w-full pl-10 pr-3 py-2 text-base border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white sm:text-sm ${
                      filtros.modoTemporal === "rango"
                        ? "opacity-50 cursor-not-allowed"
                        : mesAnioActivo
                        ? "border-blue-300 dark:border-blue-500"
                        : ""
                    }`}
                  >
                    <option value="">Seleccione un mes</option>
                    {meses.map((mes) => (
                      <option key={mes.valor} value={mes.valor}>
                        {mes.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selector de año */}
              <div className="w-full sm:w-1/2">
                <label
                  htmlFor="anio-select"
                  className={`block text-sm font-medium mb-1 ${
                    mesAnioActivo 
                      ? "text-blue-700 dark:text-blue-400" 
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  Año
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className={`h-5 w-5 ${
                      mesAnioActivo 
                        ? "text-blue-500 dark:text-blue-400" 
                        : "text-gray-400"
                    }`} />
                  </div>
                  <select
                    id="anio-select"
                    value={filtros.anio !== null ? filtros.anio : ""}
                    onChange={handleAnioChange}
                    disabled={filtros.modoTemporal === "rango"}
                    className={`block w-full pl-10 pr-3 py-2 text-base border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white sm:text-sm ${
                      filtros.modoTemporal === "rango"
                        ? "opacity-50 cursor-not-allowed"
                        : mesAnioActivo
                        ? "border-blue-300 dark:border-blue-500"
                        : ""
                    }`}
                  >
                    <option value="">Seleccione un año</option>
                    {anios.map((anio) => (
                      <option key={anio} value={anio}>
                        {anio}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Opción 2: Filtrado por rango de fechas */}
        <div className={`rounded-md transition-all duration-300 ${
          rangoActivo 
            ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-600" 
            : filtros.modoTemporal === "mesAnio" 
              ? "bg-gray-50 dark:bg-slate-700/30 opacity-60" 
              : "bg-gray-50 dark:bg-slate-700/30"
        }`}>
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h5 className={`text-sm font-medium ${
                rangoActivo 
                  ? "text-blue-700 dark:text-blue-400" 
                  : "text-gray-700 dark:text-gray-300"
              }`}>
                Filtrar por rango de fechas
              </h5>
              {filtros.modoTemporal === "mesAnio" && (
                <div className="flex items-center text-amber-600 dark:text-amber-400 text-xs font-medium">
                  <LockClosedIcon className="h-4 w-4 mr-1" />
                  <span>Desactivado por filtro de mes/año</span>
                </div>
              )}
              {rangoActivo && (
                <div className="flex items-center text-green-600 dark:text-green-400 text-xs font-medium">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  <span>Activo</span>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {/* Selector de fecha desde */}
              <div className="w-full sm:w-1/2">
                <label
                  htmlFor="fecha-desde"
                  className={`block text-sm font-medium mb-1 ${
                    rangoActivo 
                      ? "text-blue-700 dark:text-blue-400" 
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  Fecha desde
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className={`h-5 w-5 ${
                      rangoActivo 
                        ? "text-blue-500 dark:text-blue-400" 
                        : "text-gray-400"
                    }`} />
                  </div>
                  <input
                    type="date"
                    id="fecha-desde"
                    value={filtros.fechaDesde}
                    onChange={handleFechaDesdeChange}
                    disabled={filtros.modoTemporal === "mesAnio"}
                    className={`block w-full pl-10 pr-3 py-2 text-base border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white sm:text-sm ${
                      filtros.modoTemporal === "mesAnio"
                        ? "opacity-50 cursor-not-allowed"
                        : rangoActivo
                        ? "border-blue-300 dark:border-blue-500"
                        : ""
                    }`}
                  />
                </div>
              </div>

              {/* Selector de fecha hasta */}
              <div className="w-full sm:w-1/2">
                <label
                  htmlFor="fecha-hasta"
                  className={`block text-sm font-medium mb-1 ${
                    rangoActivo 
                      ? "text-blue-700 dark:text-blue-400" 
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  Fecha hasta
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className={`h-5 w-5 ${
                      rangoActivo 
                        ? "text-blue-500 dark:text-blue-400" 
                        : "text-gray-400"
                    }`} />
                  </div>
                  <input
                    type="date"
                    id="fecha-hasta"
                    value={filtros.fechaHasta}
                    onChange={handleFechaHastaChange}
                    disabled={filtros.modoTemporal === "mesAnio"}
                    className={`block w-full pl-10 pr-3 py-2 text-base border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white sm:text-sm ${
                      filtros.modoTemporal === "mesAnio"
                        ? "opacity-50 cursor-not-allowed"
                        : rangoActivo
                        ? "border-blue-300 dark:border-blue-500"
                        : ""
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente para mostrar el resumen de filtros aplicados
interface ResumenFiltrosProps {
  filtros: FiltrosIndicadoresState;
  userRole?: string | null;
}

export const ResumenFiltros: React.FC<ResumenFiltrosProps> = ({ filtros, userRole }) => {
  // Obtener los talleres disponibles según el rol del usuario
  const { talleres } = useTalleres();
  
  // Si el usuario es un gestor de taller, mostramos un mensaje personalizado
  const esGestorTaller = userRole === 'GESTOR_TALLER';
  
  if (!filtros.taller) return null;

  // Buscar el taller seleccionado por su ID
  const tallerSeleccionado = talleres.find(t => t.id === filtros.taller)?.nombre || "Mi taller";

  // Formateador de fecha para la visualización
  const formatearFecha = (fechaISO: string): string => {
    if (!fechaISO) return "";

    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Obtener texto del periodo seleccionado
  const obtenerTextoPeriodo = (): string => {
    if (filtros.modoTemporal === "rango" && filtros.fechaDesde) {
      return `Periodo: ${formatearFecha(filtros.fechaDesde)} ${
        filtros.fechaHasta ? `- ${formatearFecha(filtros.fechaHasta)}` : ""
      }`;
    }

    if (
      filtros.modoTemporal === "mesAnio" &&
      filtros.mes !== null &&
      filtros.anio !== null
    ) {
      const nombreMes = new Date(filtros.anio, filtros.mes, 1).toLocaleString(
        "es-ES",
        { month: "long" }
      );
      return `Periodo: ${
        nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)
      } ${filtros.anio}`;
    }

    return "";
  };

  const textoPeriodo = obtenerTextoPeriodo();

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4">
      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
        <div className="flex items-center">
          <ChartBarIcon className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-2" />
          <h3 className="font-medium text-blue-700 dark:text-blue-300">
            Resumen de filtros
          </h3>
        </div>
        
        <div className="text-sm text-blue-600 dark:text-blue-400">
          {/* Mostrar el taller con texto personalizado según el rol */}
          <span className="inline-flex items-center mr-3">
            <BuildingOfficeIcon className="h-4 w-4 mr-1" />
            {esGestorTaller ? 'Mi taller' : tallerSeleccionado}
          </span>
          
          {/* Formatear y mostrar el periodo seleccionado */}
          <span className="inline-flex items-center">
            <CalendarIcon className="h-4 w-4 mr-1" />
            {textoPeriodo}
          </span>
        </div>
      </div>
    </div>
  );
};

// Función auxiliar para formatear fechas
const formatearFecha = (fechaISO: string): string => {
  if (!fechaISO) return "";

  const fecha = new Date(fechaISO);
  return fecha.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};
