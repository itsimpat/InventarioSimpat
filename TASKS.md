# Simpat Tech Inventario — Plan de Tareas

## Stack
- **Frontend:** Vite + React + TailwindCSS
- **Backend/DB:** InsForge (BaaS + base de datos)
- **Auth:** InsForge Auth
- **Tipo de cambio:** API Banxico (gratuita)

---

## Reglas de negocio clave
- Solo usuarios autenticados pueden acceder a la app
- Solo administradores pueden crear/editar/eliminar registros
- Máximo ~5 administradores, creados desde la app
- Un equipo → asignado a una sola persona a la vez
- Un periférico tiene su propio registro; cambia de ownership (Bodega → Colaborador)
- Un periférico puede estar asignado a un colaborador Y tener estatus "en reparación"
- Estatus válidos para equipos y periféricos: Asignado, En Bodega, En Reparación, Vendido, Dado de Baja, Solicitado
- El tipo de cambio MXN/USD se obtiene automáticamente de Banxico al registrar
- Los reportes de costo se presentan en USD
- Notificaciones de renovación de licencias: configurable, default 7 días antes
- Budget Improve Yourself (IY): fijo por colaborador, actualizable; se notifica al admin cuando un colaborador sale
- Los artículos de oficina son inventario informativo (no se asignan a personas)
- El historial de un equipo/periférico registra reasignaciones y eventos (reparaciones, mantenimientos)
- Al desactivar un colaborador, su historial se conserva

---

## Modelos de datos

### Collaborator
- nombre, área, puesto, email
- activo (boolean)
- fecha de ingreso

### Equipment (Computadoras)
- marca, modelo, año de compra, costo MXN, costo USD
- especificaciones (RAM, CPU, almacenamiento, etc.)
- estatus: Asignado | En Bodega | En Reparación | Vendido | Dado de Baja | Solicitado
- colaborador_id (nullable)
- fecha de compra

### Peripheral (Periféricos)
- tipo: Monitor | Teclado | Audífonos | Mouse | Otro
- marca, modelo, costo MXN, costo USD, fecha de compra
- estatus: Asignado | En Bodega | En Reparación | Vendido | Dado de Baja | Solicitado
- ownership: Bodega | Colaborador (colaborador_id nullable)

### License (Licencias)
- nombre del producto
- tipo: Mensual | Anual
- costo MXN, costo USD
- fecha de próxima renovación
- colaborador_id
- categoría: IY (Improve Yourself) | General
- activa (boolean)

### IYBudget (Presupuesto Improve Yourself)
- colaborador_id
- monto_total (USD)
- monto_gastado (calculado desde licencias IY activas)
- monto_disponible (calculado)

### OfficeItem (Inventario de Oficina)
- nombre, categoría (Silla | Mesa | TV | Otro)
- marca, costo MXN, costo USD
- fecha de compra
- cantidad

### HistoryEvent (Historial)
- entidad_tipo: Equipment | Peripheral | OfficeItem
- entidad_id
- tipo_evento: Reasignación | Reparación | Mantenimiento | Otro
- descripción
- fecha_inicio, fecha_fin (nullable)
- técnico / proveedor (nombre, teléfono) — para reparaciones
- costo del evento (nullable)
- colaborador_anterior_id, colaborador_nuevo_id — para reasignaciones
- registrado_por (admin)

### ExchangeRate
- fecha, valor (MXN por 1 USD)
- fuente: Banxico

### NotificationConfig
- días_anticipación (default: 7)
- por admin o global

---

## Prioridades y Tareas

---

### PRIORIDAD 1 — Setup del proyecto

- [x] **1.1** Instalar InsForge CLI y configurar cuenta
- [x] **1.2** Crear proyecto en InsForge (base de datos + auth)
- [x] **1.3** Inicializar proyecto con Vite + React + TypeScript
- [x] **1.4** Instalar y configurar TailwindCSS
- [x] **1.5** Instalar dependencias base: react-router-dom, axios o fetch wrapper, react-query o SWR, react-hook-form, zod (validaciones)
- [x] **1.6** Conectar InsForge SDK/cliente al proyecto React
- [x] **1.7** Configurar variables de entorno (.env)
- [x] **1.8** Estructura de carpetas del proyecto (pages, components, hooks, services, types, utils)

---

### PRIORIDAD 2 — Autenticación

- [ ] **2.1** Configurar InsForge Auth en el frontend
- [ ] **2.2** Pantalla de Login (email + password)
- [ ] **2.3** Proteger rutas: redirigir a login si no autenticado
- [ ] **2.4** Guardar sesión y manejar token/refresh
- [ ] **2.5** Pantalla de logout
- [ ] **2.6** Manejo de roles: campo `role` en el usuario (admin | viewer — solo admins usan la app por ahora pero la arquitectura lo soporta)

---

### PRIORIDAD 3 — Gestión de Administradores y Colaboradores

- [ ] **3.1** Crear esquema `Collaborator` en InsForge
- [ ] **3.2** Pantalla: listado de colaboradores (con búsqueda y filtro por área/estatus)
- [ ] **3.3** Pantalla: crear colaborador (nombre, área, puesto, email, fecha de ingreso)
- [ ] **3.4** Pantalla: detalle/editar colaborador
- [ ] **3.5** Acción: desactivar colaborador (soft delete — conserva historial)
- [ ] **3.6** Al desactivar: notificación/alerta al admin sobre licencias IY activas del colaborador
- [ ] **3.7** Pantalla de Administradores: crear cuentas de admin desde la app (máx ~5)
- [ ] **3.8** Crear esquema `IYBudget` en InsForge, asociado a colaborador

---

### PRIORIDAD 4 — Equipos (Computadoras)

- [ ] **4.1** Crear esquema `Equipment` en InsForge
- [ ] **4.2** Integración con Banxico API para obtener tipo de cambio al registrar
- [ ] **4.3** Pantalla: listado de equipos (filtros por estatus, colaborador, marca; paginación)
- [ ] **4.4** Pantalla: crear equipo (con conversión automática MXN↔USD)
- [ ] **4.5** Pantalla: detalle de equipo (info completa + historial + colaborador asignado)
- [ ] **4.6** Pantalla: editar equipo
- [ ] **4.7** Acción: cambiar estatus del equipo
- [ ] **4.8** Acción: asignar/reasignar equipo a colaborador (genera evento en historial)
- [ ] **4.9** Crear esquema `HistoryEvent` en InsForge
- [ ] **4.10** Al reasignar: registrar automáticamente evento de reasignación en historial

---

### PRIORIDAD 5 — Periféricos

- [ ] **5.1** Crear esquema `Peripheral` en InsForge
- [ ] **5.2** Pantalla: listado de periféricos (filtros por tipo, estatus, ownership; paginación)
- [ ] **5.3** Pantalla: crear periférico (tipo, marca, modelo, costo con conversión automática)
- [ ] **5.4** Pantalla: detalle de periférico (info + historial + ownership actual)
- [ ] **5.5** Pantalla: editar periférico
- [ ] **5.6** Acción: mover periférico de Bodega a Colaborador (actualiza ownership + genera historial)
- [ ] **5.7** Acción: cambiar estatus del periférico (independiente del ownership)
- [ ] **5.8** Acción: regresar periférico a Bodega (genera historial)

---

### PRIORIDAD 6 — Licencias

- [ ] **6.1** Crear esquema `License` en InsForge
- [ ] **6.2** Pantalla: listado de licencias (filtros por colaborador, tipo, categoría; paginación)
- [ ] **6.3** Pantalla: crear licencia (con conversión automática MXN↔USD, indicar si es IY)
- [ ] **6.4** Pantalla: detalle/editar licencia
- [ ] **6.5** Acción: desactivar licencia (sin eliminar)
- [ ] **6.6** Acción: reasignar licencia a otro colaborador
- [ ] **6.7** Cálculo automático de monto gastado vs disponible del budget IY al asignar licencias IY

---

### PRIORIDAD 7 — Notificaciones

- [ ] **7.1** Crear esquema `NotificationConfig` en InsForge (días de anticipación, default 7)
- [ ] **7.2** Pantalla de configuración de notificaciones (solo admin)
- [ ] **7.3** Lógica: al cargar la app, verificar licencias próximas a vencer según config
- [ ] **7.4** Mostrar alerta/banner en el dashboard con licencias próximas a renovarse
- [ ] **7.5** Alerta especial cuando un colaborador se desactiva y tiene licencias IY activas

---

### PRIORIDAD 8 — Inventario de Oficina

- [ ] **8.1** Crear esquema `OfficeItem` en InsForge
- [ ] **8.2** Pantalla: listado de inventario de oficina (filtros por categoría; paginación)
- [ ] **8.3** Pantalla: crear artículo (nombre, categoría, marca, costo con conversión, fecha de compra, cantidad)
- [ ] **8.4** Pantalla: detalle/editar artículo (actualizar cantidad)
- [ ] **8.5** Acción: registrar mantenimiento de artículo de oficina (genera historial)
- [ ] **8.6** Vista de historial de mantenimientos por artículo

---

### PRIORIDAD 9 — Historial y Eventos

- [ ] **9.1** Pantalla: historial completo de un equipo (reasignaciones + reparaciones + mantenimientos)
- [ ] **9.2** Pantalla: historial completo de un periférico
- [ ] **9.3** Formulario: registrar evento manual (reparación, mantenimiento) con técnico, teléfono, fechas, costo
- [ ] **9.4** Formulario: cerrar evento de reparación (registrar fecha de salida)
- [ ] **9.5** Timeline visual de eventos por equipo/periférico

---

### PRIORIDAD 10 — Reportes y Dashboard

- [ ] **10.1** Dashboard principal: KPIs globales (total equipos, licencias activas, alertas, inversión total en USD)
- [ ] **10.2** Dashboard: últimas actividades / movimientos recientes
- [ ] **10.3** Sección de reportes: selector de reporte (por colaborador / por área / global empresa)
- [ ] **10.4** Reporte por colaborador: equipos asignados + periféricos + licencias + IY budget (todo en USD)
- [ ] **10.5** Reporte por área/equipo: total de inversión del área
- [ ] **10.6** Reporte global empresa: total equipos, total licencias, total periféricos, total oficina (en USD)
- [ ] **10.7** Reporte IY: seguimiento del budget IY por colaborador (gastado vs disponible)

---

### PRIORIDAD 11 — Pulido y UX

- [ ] **11.1** Diseño visual consistente con TailwindCSS (paleta de colores Simpat Tech)
- [ ] **11.2** Componentes reutilizables: Table, Modal, Form, Badge de estatus, Card
- [ ] **11.3** Estados de carga (skeletons/spinners) y manejo de errores
- [ ] **11.4** Responsive básico (desktop primero)
- [ ] **11.5** Confirmaciones antes de eliminar o desactivar registros
- [ ] **11.6** Mensajes de éxito/error (toasts)

---

## Integraciones externas

| Integración | Uso | API |
|---|---|---|
| Banxico | Tipo de cambio MXN/USD automático | `https://www.banxico.org.mx/SieAPIRest/service/v1/` |

---

## Notas
- Los reportes se muestran en pantalla (no hay exportación a PDF/Excel en V1)
- Las notificaciones son alertas dentro de la app (no correo en V1)
- Los artículos de oficina no se asignan a personas
- Al registrar un monto, siempre se guarda tanto en MXN como en USD usando el tipo de cambio del momento
