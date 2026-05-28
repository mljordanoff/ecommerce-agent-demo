# Guía de Traspaso Técnico (Handoff) para Desarrolladores
## Proyecto: Agente de E-commerce Baufest 2026 (MVP)

Este documento sirve como especificación técnica para migrar el prototipo interactivo (frontend local) a una arquitectura escalable de producción con agentes de Inteligencia Artificial conectados a sistemas core (ERP, CRM, WMS).

---

## 1. Estructura del Prototipo Actual
El código actual está autocontenido y estructurado de forma modular para facilitar su migración:
* **[index.html](file:///C:/Users/mljordanoff/.gemini/antigravity/scratch/ecommerce-agent/index.html)**: Interfaz de usuario (Chat, consola de trazas y dashboard CFO).
* **[styles.css](file:///C:/Users/mljordanoff/.gemini/antigravity/scratch/ecommerce-agent/styles.css)**: Estilos y componentes visuales (Glassmorphism, grilla de almacén, animaciones).
* **[catalog.js](file:///C:/Users/mljordanoff/.gemini/antigravity/scratch/ecommerce-agent/catalog.js)**: Base de datos mock y definición de reglas de margen comercial.
* **[app.js](file:///C:/Users/mljordanoff/.gemini/antigravity/scratch/ecommerce-agent/app.js)**: Motor de la simulación. Contiene el flujo conversacional y algoritmos lógicos (negociación B2B y cálculo de rutas de picking).

---

## 2. Hoja de Ruta de Integración (De Simulación a Producción)

Para pasar del frontend simulado a producción, el equipo de desarrollo debe realizar las siguientes tareas de integración:

### Tarea 1: Arquitectura de Carrito Multiproducto (B2C)
En la última versión, el agente implementa un flujo de carrito acumulativo antes del checkout:
* **Estado del Carrito (`b2cCart`)**: Se mantiene en memoria de sesión o local.
* **Interacción del Agente**: El agente no gatilla la compra inmediata. Llama a `simulateB2CCartAdd()` para reservar stock temporal y renderiza una tarjeta interactiva con la tabla del carrito (`renderB2CCart()`).
* **Integración en Producción**:
  * La reserva temporal debe llamar a un endpoint de *Cart API* (ej: en VTEX, Shopify o tu propio microservicio) para asegurar que el stock se reserve en el ERP por N minutos.
  * El botón **"Proceder al Pago"** debe redirigir al checkout seguro de la empresa (o procesar el pago mediante una pasarela integrada como Stripe/MercadoPago).

### Tarea 2: Implementar el API Client para ERP y CRM
Actualmente, las llamadas a sistemas externos son simuladas. Se deben reemplazar por integraciones reales utilizando las APIs REST o GraphQL de la empresa (SAP, Salesforce, etc.):
* **Consulta de Stock (ERP)**: Reemplazar el acceso a `Catalog.b2cProducts` / `Catalog.b2bProducts` por una llamada HTTP a las existencias reales del almacén.
* **Datos de Cliente y Contrato (CRM)**: Reemplazar `Catalog.b2bClients` por una consulta al CRM para obtener en tiempo real el Tier del cliente (Gold, Silver, Bronze) y sus condiciones de pago pactadas.

### Tarea 3: Configurar el Motor de Inteligencia Artificial (Gemini API)
En lugar de analizar texto con comparaciones básicas de palabras clave (`query.includes()`), se debe implementar un agente conversacional real:
1. Usar el SDK de **Gemini** (o frameworks como **LangGraph** / **LlamaIndex** / **Semantic Kernel**).
2. Definir **Function Calling** (Herramientas / Tools) para el LLM. El agente debe estar configurado para llamar de manera autónoma a funciones como:
   * `buscar_producto_en_catalogo(categoria, specs)`
   * `obtener_stock(producto_id)`
   * `agregar_item_al_carrito(producto_id, cantidad)`
   * `ver_carrito_actual()`
   * `calcular_precio_y_descuento_b2b(cliente_id, producto_id, cantidad)`
   * `generar_cotizacion_borrador(cliente_id, line_items)`

### Tarea 4: Implementar los Guardrails del Negocio (Capa de Seguridad)
Para evitar que el agente (LLM) invente precios o aplique descuentos que dañen la rentabilidad (alucinaciones), se debe programar una capa intermedia de backend que valide las reglas definidas en `catalog.js`:
* **Margen Mínimo**: Ninguna cotización generada por el agente debe aprobarse si el precio final cobrado está por debajo del `Costo + Margen Mínimo (15%)`. Esta validación debe correr en código duro en el servidor, no en el prompt del LLM.
* **Autonomía del Agente**: Si el descuento solicitado por el usuario es viable (>15% de margen) pero supera el límite autónomo del agente (ej. 8% para clientes Silver), el sistema debe bloquear temporalmente el flujo conversacional y disparar una alerta de aprobación.

### Tarea 5: Programar la Aprobación Humana (Human-in-the-Loop)
El flujo simulado de aprobación de 3 segundos debe convertirse en un flujo asíncrono real:
1. Cuando el agente escala la solicitud de descuento, el backend envía una notificación interactiva (Adaptive Cards) a través de **Microsoft Teams** o **Slack** al canal del Ejecutivo de Cuentas.
2. El ejecutivo presiona el botón **[Aprobar]** o **[Rechazar]** directamente en el chat de Teams/Slack.
3. Este evento dispara un Webhook que notifica al agente de e-commerce, desbloqueando el chat del cliente final y mostrándole la cotización aprobada.

### Tarea 6: Conectar la Orquestación de Picking (Logística)
La animación en 2D de la ruta óptima de picking en el canvas debe conectarse al backend del **WMS (Warehouse Management System)**:
* Enviar la orden aprobada del ERP al WMS.
* Devolver al frontend la ruta de picking calculada por el optimizador del depósito para pintar el recorrido real del operador.

---

## 3. Stack Tecnológico Sugerido para Producción

* **Backend**: Node.js (TypeScript) o Python (FastAPI).
* **Framework de Agentes**: LangGraph (ideal para flujos cíclicos con interacción humana) o LangChain.
* **Motor LLM**: Gemini 1.5 Pro / Gemini 3.5 Flash (alta velocidad, bajo costo y soporte nativo para JSON estructurado).
* **Base de Datos Vectorial (para búsquedas conversacionales B2C)**: Pinecone, pgvector (PostgreSQL) o Elasticsearch.
