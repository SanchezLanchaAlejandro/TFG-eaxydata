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
cd dms-cst
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
```bash
cp .env.local.example .env.local
```
Edita `.env.local` con tus credenciales de Supabase y Resend.

4. Inicia el servidor de desarrollo:
```bash
npm run dev
```

5. Abre [http://localhost:3000](http://localhost:3000) para ver la aplicación.

## Despliegue en Netlify

Este proyecto está configurado para ser desplegado fácilmente en Netlify. Solo necesitas:

1. Conectar tu repositorio a Netlify
2. Configurar las variables de entorno en el panel de Netlify
3. Netlify detectará automáticamente que es un proyecto Next.js y lo desplegará correctamente

## Roles de usuario

- **SuperAdmin**: Acceso completo a todas las funcionalidades
- **Gestor Red**: Gestión de talleres y valoraciones
- **Gestor Taller**: Acceso limitado a las funcionalidades de su taller

## Tecnologías

- Next.js 14
- TypeScript
- Tailwind CSS
- Supabase
- Resend
