"use client";

import { useEffect, ReactNode } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: string;
  showCloseButton?: boolean;
}

export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = 'max-w-5xl',
  showCloseButton = true,
}: ModalProps) => {
  // Manejar el overflow del body y ocultar el sidebar cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      // Guardar el estado original para restaurarlo después
      const originalBodyStyle = {
        overflow: document.body.style.overflow,
        paddingRight: document.body.style.paddingRight
      };
      
      // Detectar si estamos en Safari
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      
      // Guardar las propiedades originales de la estructura de la app
      const appContainer = document.querySelector('#__next') || document.querySelector('body > div');
      const originalAppStyle = appContainer ? {
        gridTemplateColumns: (appContainer as HTMLElement).style.gridTemplateColumns,
        display: (appContainer as HTMLElement).style.display
      } : null;
      
      // Calcular el ancho del scrollbar para evitar saltos cuando se oculta
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      // Aplicar estilos para evitar scroll del body
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      
      // Seleccionar el sidebar de diversas maneras para mayor compatibilidad
      const sidebarSelectors = [
        '.md\\:flex.md\\:flex-shrink-0',
        '.hidden.md\\:flex',
        '.md\\:block.fixed.inset-y-0.left-0',
        '.h-screen.flex.overflow-hidden > div:first-child'
      ];
      
      let sidebarDesktop = null;
      for (const selector of sidebarSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          sidebarDesktop = element;
          break;
        }
      }
      
      const mobileHeaderSelectors = [
        '.md\\:hidden.pl-1.pt-1.sm\\:pl-3.sm\\:pt-3',
        '.md\\:hidden.pl-1',
        'header.md\\:hidden',
        '.flex.md\\:hidden'
      ];
      
      let sidebarMobile = null;
      for (const selector of mobileHeaderSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          sidebarMobile = element;
          break;
        }
      }
      
      // Almacenar los estilos originales del sidebar
      const originalSidebarStyles = {
        desktop: sidebarDesktop ? {
          display: (sidebarDesktop as HTMLElement).style.display,
          position: (sidebarDesktop as HTMLElement).style.position,
          width: (sidebarDesktop as HTMLElement).style.width,
          visibility: (sidebarDesktop as HTMLElement).style.visibility,
          transform: (sidebarDesktop as HTMLElement).style.transform,
          left: (sidebarDesktop as HTMLElement).style.left
        } : null,
        mobile: sidebarMobile ? {
          display: (sidebarMobile as HTMLElement).style.display,
          position: (sidebarMobile as HTMLElement).style.position,
          width: (sidebarMobile as HTMLElement).style.width,
          visibility: (sidebarMobile as HTMLElement).style.visibility,
          transform: (sidebarMobile as HTMLElement).style.transform,
          left: (sidebarMobile as HTMLElement).style.left
        } : null
      };
      
      // Modificar el layout del contenedor principal para usar todo el ancho
      if (appContainer) {
        if (isSafari) {
          // En Safari, modificamos el contenedor principal de manera diferente
          (appContainer as HTMLElement).style.display = 'block';
        } else {
          // Para otros navegadores
          (appContainer as HTMLElement).style.gridTemplateColumns = '1fr';
        }
      }
      
      // Aplicar estilos para ocultar el sidebar en Safari
      if (sidebarDesktop) {
        (sidebarDesktop as HTMLElement).style.display = 'none';
        (sidebarDesktop as HTMLElement).style.position = 'absolute';
        (sidebarDesktop as HTMLElement).style.width = '0';
        (sidebarDesktop as HTMLElement).style.visibility = 'hidden';
        (sidebarDesktop as HTMLElement).style.transform = 'translateX(-100%)';
        (sidebarDesktop as HTMLElement).style.left = '-260px';
      }
      
      if (sidebarMobile) {
        (sidebarMobile as HTMLElement).style.display = 'none';
        (sidebarMobile as HTMLElement).style.position = 'absolute';
        (sidebarMobile as HTMLElement).style.width = '0';
        (sidebarMobile as HTMLElement).style.visibility = 'hidden';
        (sidebarMobile as HTMLElement).style.transform = 'translateX(-100%)';
        (sidebarMobile as HTMLElement).style.left = '-260px';
      }
      
      // También aplicar al contenedor principal específico del sidebar si existe
      const mainContentSelectors = [
        '.flex.flex-1.overflow-hidden',
        '.w-0.flex-1.overflow-hidden',
        'main.flex-1',
        '.py-6 .max-w-7xl'
      ];
      
      let mainContentContainer = null;
      for (const selector of mainContentSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          mainContentContainer = element;
          break;
        }
      }
      
      if (mainContentContainer) {
        (mainContentContainer as HTMLElement).style.marginLeft = '0';
        (mainContentContainer as HTMLElement).style.width = '100%';
        (mainContentContainer as HTMLElement).style.maxWidth = '100%';
      }
      
      // Limpieza al desmontar o cerrar
      return () => {
        // Restaurar estilos del body
        document.body.style.overflow = originalBodyStyle.overflow;
        document.body.style.paddingRight = originalBodyStyle.paddingRight;
        
        // Restaurar layout del contenedor principal
        if (appContainer && originalAppStyle) {
          (appContainer as HTMLElement).style.gridTemplateColumns = originalAppStyle.gridTemplateColumns;
          (appContainer as HTMLElement).style.display = originalAppStyle.display;
        }
        
        // Restaurar visibilidad y layout del sidebar
        if (sidebarDesktop && originalSidebarStyles.desktop) {
          (sidebarDesktop as HTMLElement).style.display = originalSidebarStyles.desktop.display;
          (sidebarDesktop as HTMLElement).style.position = originalSidebarStyles.desktop.position;
          (sidebarDesktop as HTMLElement).style.width = originalSidebarStyles.desktop.width;
          (sidebarDesktop as HTMLElement).style.visibility = originalSidebarStyles.desktop.visibility;
          (sidebarDesktop as HTMLElement).style.transform = originalSidebarStyles.desktop.transform;
          (sidebarDesktop as HTMLElement).style.left = originalSidebarStyles.desktop.left;
        }
        
        if (sidebarMobile && originalSidebarStyles.mobile) {
          (sidebarMobile as HTMLElement).style.display = originalSidebarStyles.mobile.display;
          (sidebarMobile as HTMLElement).style.position = originalSidebarStyles.mobile.position;
          (sidebarMobile as HTMLElement).style.width = originalSidebarStyles.mobile.width;
          (sidebarMobile as HTMLElement).style.visibility = originalSidebarStyles.mobile.visibility;
          (sidebarMobile as HTMLElement).style.transform = originalSidebarStyles.mobile.transform;
          (sidebarMobile as HTMLElement).style.left = originalSidebarStyles.mobile.left;
        }
        
        // Restaurar el contenedor principal si existe
        if (mainContentContainer) {
          (mainContentContainer as HTMLElement).style.marginLeft = '';
          (mainContentContainer as HTMLElement).style.width = '';
          (mainContentContainer as HTMLElement).style.maxWidth = '';
        }
      };
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4 overflow-y-auto"
      onClick={onClose}
      style={{ 
        backdropFilter: 'blur(5px)',
        left: 0,
        width: '100vw'  
      }}
    >
      <div 
        className={`bg-white dark:bg-slate-800 rounded-lg shadow-xl ${maxWidth} w-full max-h-[90vh] overflow-y-auto mx-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
            {title && <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>}
            
            {showCloseButton && (
              <button 
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Cerrar"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            )}
          </div>
        )}
        
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}; 