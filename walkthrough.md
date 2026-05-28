# Demo Walkthrough: Simulador de Agente de E-commerce (Baufest 2026)

Este documento detalla el desarrollo realizado para tangibilizar el plan del Agente de E-commerce de la presentación. Hemos construido un **Simulador Interactivo de Alta Fidelidad** ejecutable de forma local y pública que puedes presentar directamente a tus stakeholders.

* **Enlace Demo en Vivo (GitHub Pages)**: [https://mljordanoff.github.io/ecommerce-agent-demo/](https://mljordanoff.github.io/ecommerce-agent-demo/)
* **Repositorio de GitHub**: [https://github.com/mljordanoff/ecommerce-agent-demo](https://github.com/mljordanoff/ecommerce-agent-demo)
* **Guía de Traspaso Técnico (Handoff)**: [handoff_guide.md](https://github.com/mljordanoff/ecommerce-agent-demo/blob/main/handoff_guide.md)

---

## 🛠️ Cambios Realizados y Estructura

El desarrollo se ha completado en el directorio local:
[C:\Users\mljordanoff\.gemini\antigravity\scratch\ecommerce-agent](file:///C:/Users/mljordanoff/.gemini/antigravity/scratch/ecommerce-agent)

La arquitectura consta de los siguientes módulos estructurados de manera limpia y modular:

1. **`catalog.js` (Dataset del Negocio)**: Define los productos simulados, niveles de stock en almacén, datos de clientes B2B (Gold, Silver, Bronze), y las reglas de márgenes mínimos absolutos de la empresa.
2. **`styles.css` (Diseño Premium)**: Estilos en tema oscuro premium inspirados en la identidad de Baufest. Utiliza glassmorphism, tipografías Outfit/JetBrains Mono, y animaciones fluidas.
3. **`index.html` (Maquetación)**: Estructura del panel de control de dos columnas (Simulación e Interacciones vs. Consola de Trazabilidad) y el Dashboard CFO de métricas de negocio.
4. **`app.js` (Motor de la Simulación)**: Controla la lógica conversacional, los algoritmos de negociación B2B, las validaciones de guardrails de margen, la renderización del picking 2D y la actualización del dashboard financiero.

---

## 🚀 Guía de Uso para Demostración con Stakeholders

Para abrir y mostrar el simulador:
1. Abre tu navegador web (Chrome, Edge, Firefox).
2. Arrastra y suelta el archivo [index.html](file:///C:/Users/mljordanoff/.gemini/antigravity/scratch/ecommerce-agent/index.html) en la ventana del navegador (o haz doble clic sobre él en el Explorador de Archivos).
3. Interactúa con las tres pestañas superiores para hacer las siguientes demostraciones en vivo:

### Escenario 1: Asistente B2C Minorista (Búsqueda Dinámica y Catálogo Realista)
* **Objetivo**: Demostrar cómo el agente interactúa dinámicamente con un catálogo de 11 productos detallados (Calzado, Indumentaria, Accesorios, Equipamiento Outdoor), buscando por tags y filtrando por presupuesto del cliente.
* **Flujo**:
  1. Haz clic en sugerencias como *"Busco calzado cómodo para el gimnasio o funcional"* o escribe en el chat libremente (por ejemplo: *"camperas para lluvia"* o *"relojes inteligentes"*).
  2. Prueba con un filtro de presupuesto: *"mochila por menos de 130 dólares"* o *"termos por hasta 50 USD"*. El agente filtrará dinámicamente según precios.
  3. Si la búsqueda arroja **un solo producto**, verás su ficha de especificaciones detallada y stock disponible con el botón **"Agregar"**.
  4. Si arroja **múltiples coincidencias** (por ejemplo, escribe *"zapatillas"*), el agente mostrará una elegante tarjeta comparativa para que agregues el modelo que prefieras.
  5. Haz clic en **"Agregar"** en uno o más productos para cargarlos a tu carrito virtual, luego haz clic en **"Proceder al Pago"** para simular la facturación electrónica.
  6. **Impacto CFO**: En el dashboard inferior, verás cómo la *Conversión B2C* escala del 2.4% al **14.8%** y el *NPS* sube gracias a la recomendación precisa.

### Escenario 2: Cotizador & Negociador B2B Mayorista
* **Objetivo**: Mostrar cómo el agente elimina esperas de 48 horas en cotizaciones y protege los márgenes comerciales en las negociaciones de descuento.
* **Flujo**:
  1. Selecciona una Cuenta (ej: *Global Tech Solutions (GOLD)*) y el rol de *Decisor*.
  2. Haz clic en la sugerencia *"Cotizar 50 Notebooks ThinkWork Pro v6"*. El agente consulta al ERP y CRM, y genera una cotización formal.
  3. Cambia el rol a *Evaluador Técnico* y observa en la consola cómo el agente adapta su mensaje a especificaciones técnicas y arquitectura.
  4. Solicita un descuento en el chat: escribiendo *"¿Me haces un 10%?"* (Aprobado automáticamente) o *"¿Me haces un 25%?"* (Rechazado automáticamente para proteger el **margen mínimo absoluto de la empresa del 15%**).
  5. Solicita un descuento intermedio (*"¿Me haces un 12%?"* para una cuenta Gold/Silver): Observa el flujo de **"Humano-en-el-loop"**, donde el agente escala y recibe aprobación del ejecutivo de cuentas en segundos.
  6. **Impacto CFO**: La métrica de *Velocidad comercial* pasa de **48 hs a 12 segundos**, y la recompra sube al **25%**.

### Escenario 3: Orquestación de Almacén (Logística)
* **Objetivo**: Mostrar que la IA puede orquestar flujos físicos eficientes de recolección y devoluciones automáticas.
* **Flujo**:
  1. Ve a la pestaña **Almacén & Logística**. Verás una grilla representativa del depósito y estanterías.
  2. Haz clic en **Simular Picking Óptimo**. Observarás al robot/operador calculando la ruta más eficiente para juntar 5 ítems distribuidos por el almacén en lugar de una búsqueda manual desordenada.
  3. **Impacto CFO**: El costo operativo de picking se reduce al **65%** (ahorro del 35%).

### Escenario 4: Consulta de Detalles de Facturas (ERP Real-Time Log)
* **Objetivo**: Demostrar la trazabilidad fiscal y la emisión automatizada de comprobantes electrónicos (AFIP style) integrados con el ERP.
* **Flujo**:
  1. Dirígete a la sección inferior de la pantalla: **Base de Datos Transaccional (ERP/CRM Real-Time Log)**.
  2. Haz clic en **cualquier fila** de la tabla de transacciones de la base de datos (por ejemplo, `ORD-10492` o una devolución generada como `RET-XXXXX`).
  3. Verás abrirse un modal premium con la Factura Electrónica (Factura "A" / "B") o Nota de Crédito correspondiente en caso de devoluciones.
  4. Analiza el desglose exacto de Neto Gravado y el cálculo automático del IVA (21%), el email dinámico de facturación, y el código de autorización CAE homologado.
  5. Prueba el botón **"Imprimir"** para simular la descarga física en PDF.

---

## 🛠️ ¿Cómo se escala esto a Producción?

Para demostrarle a tus stakeholders que no es "humo", explícales que el backend del código está modularizado para una migración limpia:

* **Integración ERP**: Las funciones como `consultarStockERP()` en `app.js` hoy leen el JSON local. Para ir a producción, un desarrollador web solo debe cambiar esa llamada por un `fetch()` que se comunique con la API de vuestro ERP (SAP, Dynamics, etc.).
* **Motor de IA (LLM)**: El motor de texto de `app.js` que detecta las intenciones se reemplazará por herramientas RAG de Gemini que traduzcan la consulta del usuario en parámetros de búsqueda estructurada.
* **Gobernanza**: Las políticas de margen mínimo del archivo `catalog.js` (`absoluteMinMargin: 0.15`) son constantes del sistema que en producción son consumidas desde el sistema de políticas corporativas, garantizando que el LLM nunca pueda regalar margen.
