# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

-----------------------------------------------------------------------------------------------------------------------------------------

# Estado del Proyecto - Autenticación Supabase + Google OAuth

## Configuración realizada:
- Triggers y Funciones SQL en Supabase para sincronizar `auth.users` con la tabla `empleados`.
- Manejo de roles dinámicos (Admin, Supervisor, Empleado).
- Integración del cliente `@supabase/supabase-js` con `onAuthStateChange`.

## Configuración pendiente en Supabase Dashboard:
1. Ir a **Authentication -> Sign In / Providers -> Google**.
2. Marcar **Enable Google provider**.
3. Pegar **Client ID** y **Client Secret** obtenidos de Google Cloud Console.
4. Agregar la callback URL de Supabase (`https://<tu-proyecto-id>.supabase.co/auth/v1/callback`) en la consola de Google Cloud.

DISEÑO
     1_Paletas de Colores TA 
     2_Diseño de TA
     3_Fuente de TA
AVISOS SOPORTE 
     1_Este es un apartado donde uno pede acceder y comunicarse con soporte osea el admin unica forma de conectase con el admin donde usuarios pueden escribir su peticion queja y consultas . 
NOTIFICACIONES DE AVISOS
     1_Sonido de notiifcaicon tanto para empleados , supervisores , el admin debe tener notificaiones sobre avisos y soporte no del trabajo de los empleados . Usar el q tengan los usuarios en sus telefonos
SEGURIDAD
      1_Revisar y blindar datos 
BASE DE DATOS
      1_Organizar eficientenetne
SEPARACION DE TAREAS 
       1_Ordenar codigo 
ENVIOS VIA WHATAPP
        1_Avisos o compartir una tarea para mejor visualizacion coordinacion y compromiso vincularse con whatsapp 

-----------------------------------------------------------------------------------------------------------------------------------------
        # 🚀 ORBIT Logística — Logros del Sprint Anterior (Entregado)

En este sprint completamos la infraestructura crítica de autenticación, gestión de usuarios por roles y persistencia de datos en tiempo real mediante Supabase y Google OAuth.

### 🔐 Autenticación y Control de Acceso
- [x] **Integración con Google OAuth:** Inicio de sesión único (SSO) mediante cuentas institucionales/Gmail a través de Supabase Auth.
- [x] **Sincronización Automática de Usuarios:** Captura del perfil de Google mediante `onAuthStateChange` e inserción automática del registro en la tabla `empleados`.
- [x] **Manejo Dinámico de Roles (RBAC):**
  - Asignación automática del rol `ADMIN` al correo maestro del sistema (`tomasaguero140@gmail.com`).
  - Panel de Alta y Control de Usuarios para pre-registrar correos y asignar roles (`ADMIN`, `SUPERVISOR`, `EMPLEADO`).
  - Renderizado condicional de vistas y permisos según el rol activo.

### 🛡️ Base de Datos y Seguridad (Supabase)
- [x] **Configuración de RLS (Row Level Security):** Creación e implementación de políticas de seguridad para la tabla `empleados` (permisos de `INSERT` y `SELECT`), resolviendo los bloqueos de acceso 403.
- [x] **Estructura y Tablas:** Vinculación operativa de las tablas `empleados`, `notificaciones`, `planificacion_cuadrante` y `registros`.

### 📦 Módulos Operativos Entregados
- [x] **Gestión de Notificaciones y Avisos:** Envíos individuales desde la administración y panel para que el empleado confirme asistencia o disponibilidad de turnos.
- [x] **Planificación Interactiva por Sectores:**
  - Vistas independientes para *Salón y Cajas*, *Carne y Carniceros*, *Panadería y Lácteos*.
  - Módulo de **Control de Camiones** (bultos, horarios de llegada e inicio de reposición).
  - **Cuadrante de Personal** interactivo con asignación de turnos, descansos y tareas por horario.

-----------------------------------------------------------------------------------------------------------------------------------------
  # ⏳ ORBIT Logística — Backlog de Tareas Pendientes (Próximo Sprint)

A continuación se detallan los requerimientos de diseño, comunicación, seguridad y arquitectura pendientes de implementación.

---

### 🎨 1. Sistema de Diseño e Identidad (Brand System TA)
- [ ] **Paleta de Colores TA:** Refinar y aplicar la paleta de colores oficial de TA en la hoja de estilos globales.
- [ ] **Diseño e Interfaz TA:** Ajustar maquetación visual, bordes, tarjetas y espaciados según los lineamientos de diseño de la marca.
- [ ] **Tipografía Oficial:** Importar e integrar la fuente tipográfica de TA en la aplicación.

---

### 💬 2. Canal de Avisos y Soporte Técnico
- [ ] **Modulo de Contacto Directo con el Admin:** Crear un apartado exclusivo en la interfaz para que empleados y supervisores envíen peticiones, quejas y consultas directamente al Administrador General.

---

### 🔔 3. Sistema de Alertas Sonoras
- [ ] **Notificaciones Audibles:** Integrar reproducción de sonido de notificación nativo en dispositivos móviles y web al recibir alertas o avisos del sistema (diferenciando avisos operativos de mensajes de soporte).

---

### 📲 4. Integración con WhatsApp
- [ ] **Exportación y Envío de Tareas:** Implementar la vinculación con WhatsApp Web / App para compartir la planificación de tareas o asignaciones de cuadrante con un solo clic, mejorando el compromiso y la coordinación del equipo.

---

### 🔒 5. Seguridad y Blindaje de Datos
- [ ] **Revisión Granular de RLS:** Ajustar las políticas en Supabase para segmentar el acceso estricto por usuario y sector, evitando que un empleado pueda modificar o leer registros de otras áreas no autorizadas.
- [ ] **Sanitización de Consultas:** Validar entradas de formularios a nivel de backend/base de datos.

---

### 🛠️ 6. Arquitectura y Limpieza de Código (Refactor)
- [ ] **Separación de Responsabilidades:** Desarmar el archivo monolítico `App.jsx` dividiéndolo en:
  - `/src/services/supabase.js` (cliente y llamadas API).
  - `/src/components/` (Sidebar, Navbar, Modales).
  - `/src/views/` (Login, Dashboard, Planificación, Usuarios).
  # 📦 ORBIT Logística — Estado del Proyecto

Resumen del estado de desarrollo del sistema ORBIT Logística tras el último sprint de trabajo.

---------------------------------------------------------------------------------------------------------------------------------

## 🟢 1. Objetivos Cumplidos (100%)

### 🛠️ Arquitectura y Refactorización de Código
- **Estructura Modular:** Desacoplamiento total del archivo monolítico `App.jsx` dividiendo la lógica en directorios claros: `/views`, `/services`, `/utils` y `/components`.
- **Gestión de Sesiones:** Autenticación fluida con Google OAuth y sincronización automática del perfil de usuario y rol en Supabase.

### 🔒 Seguridad y Blindaje de Datos (RLS)
- **Row Level Security (RLS) Activo:** Aplicación de políticas estrictas a nivel de base de datos en Supabase para las tablas `empleados`, `notificaciones`, `planificacion_cuadrante`, `registros` y `soporte_tickets`.
- **Aislamiento por Rol:** Restricción de permisos según el rol (`ADMIN`, `SUPERVISOR`, `EMPLEADO`) asegurando que los usuarios solo accedan o modifiquen la información autorizada.

### 🔔 Sistema de Alertas Sonoras
- **Web Audio API:** Integración de un sintetizador nativo de audio en `soundNotifier.js` sin dependencia de archivos mp3 externos.
- **Suscripciones Realtime:** Escucha de eventos `INSERT` en tiempo real mediante Supabase para activar alertas auditivas diferenciadas (notificaciones operativas vs. soporte urgente).

### 📲 Integración con WhatsApp
- **Exportación con Un Clic:** Generación dinámica de mensajes y enlaces (`wa.me`) desde `whatsappHelper.js` y `BotonWhatsApp.jsx`.
- **Soporte Multiplataforma:** Transición automática que abre WhatsApp Web en navegadores de escritorio y la aplicación nativa en dispositivos móviles (Android/iOS).

### 💬 Canal de Avisos y Soporte Técnico
- **Gestión de Tickets:** Módulo en `SoporteView.jsx` que permite la comunicación directa y estructurada entre los empleados/supervisores y la administración.

---

## 🔴 2. Tareas Pendientes y Próximos Pasos

### 🧪 Pruebas Integrales y Testing en Entorno Real (En Progreso)
- [ ] **QA y Testing de Usuario:** Probar el flujo completo de la aplicación desde dispositivos móviles y de escritorio.
- [ ] **Verificación de Notificaciones en Vivo:** Validar el comportamiento del sonido y alertas en tiempo real con múltiples usuarios simulados en paralelo.
- [ ] **Auditoría de Roles:** Confirmar que las restricciones de lectura y escritura de RLS se ejecuten correctamente según el tipo de usuario.

### 🎨 Sistema de Diseño e Identidad (Brand System TA)
- [ ] **Paleta Oficial TA:** Cargar y aplicar los colores corporativos definitivos en el objeto global de estilos.
- [ ] **Tipografía e Interfaz:** Integrar la fuente oficial de la marca y maquetar los bordes, tarjetas y espaciados finales.