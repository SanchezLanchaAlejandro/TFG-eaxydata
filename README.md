# DMS CST - Sistema de Gestión

DMS CST es un sistema de gestión para talleres y valoraciones de vehículos desarrollado con Next.js, TypeScript, Tailwind CSS, Supabase (base de datos y autenticación) y Resend (emails transaccionales).

## Características principales

- **Autenticación Supabase**: Gestión de usuarios y roles (SuperAdmin, Gestor Red, Gestor Taller)
- **Dashboard**: Visión general del sistema
- **Valoraciones**: Gestión completa de valoraciones de vehículos
- **Facturación**: Sistema de gestión de facturas para clientes
- **Emails transaccionales**: Notificaciones por email usando Resend

## Estructura del proyecto

```
src/
├── app/ (rutas y páginas principales)
│   ├── dashboard/page.tsx
│   ├── valoraciones/page.tsx
│   ├── facturacion/page.tsx
│   └── layout.tsx
│
├── components/ (componentes organizados por módulo)
│   ├── Common/ (componentes reutilizables generales)
│   ├── Layout/
│   │   └── Navbar.tsx
│   ├── Dashboard/
│   ├── Valoraciones/
│   ├── Facturacion/
│   └── Auth/
│       └── AuthGuard.tsx (componente protección rutas)
│
├── lib/ (configuraciones externas específicas)
│   ├── supabase.ts (conexión Supabase)
│   └── resend.ts (configuración Resend para emails)
│
├── hooks/ (hooks personalizados reutilizables)
├── utils/ (funciones auxiliares generales)
├── styles/ (estilos globales o específicos adicionales)
```

## Instalación

1. Clona el repositorio:
```bash
git clone [URL_DEL_REPOSITORIO]
cd eaxydata
```

2. Instala las dependencias:
```bash
npm install
```

3. Inicia el servidor de desarrollo:
```bash
npm run dev
```

4. Abre [http://localhost:3000](http://localhost:3000) para ver la aplicación.

## Tecnologías

- Next.js 14
- TypeScript
- Tailwind CSS
- Supabase
- Resend
