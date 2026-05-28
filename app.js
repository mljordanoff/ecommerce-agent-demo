// Lógica del Simulador del Agente de E-Commerce (baufest 2026)

const DEFAULT_ORDERS = [
  { id: "ORD-10492", time: "Hoy 08:30", channel: "B2C", client: "g.gomez@gmail.com", items: "1x SpeedTrail Pro", total: 150.00, status: "Facturado" },
  { id: "ORD-10493", time: "Hoy 09:15", channel: "B2B", client: "Global Tech Solutions", items: "15x FlexMonitor 24\"", total: 2619.00, status: "En Proceso" },
  { id: "ORD-10494", time: "Hoy 10:02", channel: "B2C", client: "m.rodriguez@gmail.com", items: "1x UltraBoost Nova 2026", total: 180.00, status: "Facturado" }
];

// Estado Global de la Simulación
let state = {
  currentMode: 'b2c',
  // B2C Cart state
  b2cCart: [],
  // B2B state
  b2b: {
    clientKey: 'CLI-GLOBAL-TECH',
    role: 'decisor',
    activeProduct: null,
    pendingProduct: null, // Guardar producto mencionado para cuando digan solo la cantidad
    negotiating: false,   // Saber si estamos esperando un porcentaje de descuento
    quantity: 0,
    listPrice: 0,
    currentDiscount: 0.05, // descuento base inicial
    quoteNumber: null
  },
  // KPI values (dynamic representation)
  kpis: {
    conversion: 2.4,
    speed: '48h',
    reorder: 0,
    cost: 100,
    nps: 45
  },
  // Base de datos de órdenes (simulada)
  orders: []
};

// Configuración de los Prompts Sugeridos por Modo
const SUGGESTIONS = {
  b2c: [
    "Busco calzado cómodo para el gimnasio o funcional",
    "¿Qué camperas abrigadas o impermeables tienen para correr con frío?",
    "Quiero ver opciones de tecnología deportiva como auriculares o relojes",
    "¿Tienen termos de acero inoxidable para camping?"
  ],
  b2b: [
    "Cotizar 50 Notebooks ThinkWork Pro v6",
    "Necesito un presupuesto de 30 Monitores FlexMonitor 24\"",
    "¿Podemos negociar un descuento adicional del 12% en la cotización?",
    "Cotizar 5 Servidores Edge CloudBox S1"
  ]
};

// Mensajes Iniciales de Bienvenida del Agente
const WELCOME_MESSAGES = {
  b2c: `¡Hola! 👋 Soy tu <strong>Agente de Compras Personalizado</strong>. Estoy conectado directamente al catálogo y stock en tiempo real de Baufest. ¿En qué puedo ayudarte hoy? Cuéntame qué estás buscando (zapatillas, camperas, auriculares, termos, mochilas, etc.) o indícame tu presupuesto.`,
  b2b: `Estimado socio corporativo, bienvenido al canal de <strong>Cotización Inteligente B2B</strong>. <br><br>Estoy autorizado para realizar consultas en ERP, verificar niveles de contrato en CRM y **negociar precios de volumen con aprobación inmediata**. ¿Qué productos y cantidades desea cotizar hoy?`
};

// Al iniciar la página
document.addEventListener("DOMContentLoaded", () => {
  initApp();

  // Re-ajustar canvas al cambiar tamaño de pantalla
  window.addEventListener("resize", () => {
    if (state.currentMode === 'logistics') {
      setupWarehouseCanvas();
      drawWarehouseGrid(null);
    }
  });
});

function initApp() {
  // Cargar órdenes de localStorage o inicializar con las default
  const storedOrders = localStorage.getItem('baufest_sim_orders');
  if (storedOrders) {
    try {
      state.orders = JSON.parse(storedOrders);
    } catch (e) {
      console.error("Error al decodificar órdenes guardadas, usando por defecto.", e);
      state.orders = [...DEFAULT_ORDERS];
      localStorage.setItem('baufest_sim_orders', JSON.stringify(state.orders));
    }
  } else {
    state.orders = [...DEFAULT_ORDERS];
    localStorage.setItem('baufest_sim_orders', JSON.stringify(state.orders));
  }

  switchMode('b2c');
  setupWarehouseCanvas();
  renderOrdersTable();
}

// Cambiar de Modo (B2C, B2B, Logística)
function switchMode(mode) {
  state.currentMode = mode;
  
  // Actualizar botones de navegación
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeBtn = document.querySelector(`.tab-btn[onclick="switchMode('${mode}')"]`);
  if (activeBtn) activeBtn.classList.add('active');

  // Obtener elementos
  const b2bConfig = document.getElementById('b2b-config');
  const chatWindowArea = document.getElementById('chat-window-area');
  const warehouseArea = document.getElementById('warehouse-area');
  const simTitle = document.getElementById('simulator-title');
  const simIcon = document.getElementById('simulator-icon');

  // Limpiar chat y trazas
  document.getElementById('chat-messages').innerHTML = '';
  document.getElementById('trace-logger').innerHTML = '';

  // Configurar interfaz según modo
  if (mode === 'b2c') {
    b2bConfig.style.display = 'none';
    chatWindowArea.style.display = 'flex';
    warehouseArea.style.display = 'none';
    simTitle.innerText = "Asistente de Ventas B2C (Conversión)";
    simIcon.className = "fa-solid fa-shopping-bag";
    
    addTrace('interpreta', 'Contexto B2C', 'Cargando canal minorista. Reglas: Optimización de conversión de carrito y recomendación inteligente de catálogo.');
    addTrace('consulta', 'Conectando Catálogo', 'Accediendo a base de datos de productos minoristas. Stock activo sincronizado.');
    
    appendAgentMessage(WELCOME_MESSAGES.b2c);
    renderSuggestions('b2c');
    
  } else if (mode === 'b2b') {
    b2bConfig.style.display = 'flex';
    chatWindowArea.style.display = 'flex';
    warehouseArea.style.display = 'none';
    simTitle.innerText = "Agente de Negociación B2B (Cotizador)";
    simIcon.className = "fa-solid fa-building";
    
    onB2BConfigChange();
    appendAgentMessage(WELCOME_MESSAGES.b2b);
    renderSuggestions('b2b');
    
  } else if (mode === 'logistics') {
    b2bConfig.style.display = 'none';
    chatWindowArea.style.display = 'none';
    warehouseArea.style.display = 'flex';
    simTitle.innerText = "Orquestación de Centro de Distribución";
    simIcon.className = "fa-solid fa-boxes-packing";
    
    addTrace('interpreta', 'Contexto Almacén (WMS)', 'Iniciando módulo de optimización de operaciones de picking y devoluciones.');
    addTrace('consulta', 'Conexión WMS/ERP', 'Conectado a inventarios físicos y mapa tridimensional de estanterías del depósito.');
    
    // Medir y configurar el canvas con un leve retraso para permitir la recálculo de diseño del navegador
    setTimeout(() => {
      setupWarehouseCanvas();
      drawWarehouseGrid(null); // Dibujar mapa de almacén estático inicial
    }, 50);
  }
}

// Renderizar Chips de sugerencias
function renderSuggestions(mode) {
  const container = document.getElementById('prompt-chips');
  container.innerHTML = '';
  SUGGESTIONS[mode].forEach(text => {
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.innerText = text;
    chip.onclick = () => {
      document.getElementById('chat-input').value = text;
      sendMessage();
    };
    container.appendChild(chip);
  });
}

// Manejar cambios de cuenta/rol en B2B
function onB2BConfigChange() {
  const clientKey = document.getElementById('b2b-client-select').value;
  const role = document.getElementById('b2b-role-select').value;
  
  state.b2b.clientKey = clientKey;
  state.b2b.role = role;
  
  const clientInfo = window.Catalog.b2bClients[clientKey];
  
  addTrace('consulta', 'Verificando CRM', `Empresa: ${clientInfo.name} | Contrato: ${clientInfo.contractTerm} | Nivel: ${clientInfo.tier} | Descuento Máx Auto: ${Math.round(clientInfo.maxAutoDiscount*100)}% | Condiciones Pago: ${clientInfo.paymentTerms}`);
  
  // Si cambia el rol y hay una cotización activa, explicar el impacto en las trazas
  if (state.b2b.activeProduct) {
    explainB2BPersonalization();
  }
}

// Enviar Mensaje
function sendMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;

  // Renderizar mensaje de usuario
  appendUserMessage(text);
  input.value = '';

  // Simular tiempo de pensamiento del agente
  setTimeout(() => {
    if (state.currentMode === 'b2c') {
      handleB2CInput(text);
    } else if (state.currentMode === 'b2b') {
      handleB2BInput(text);
    }
  }, 600);
}

function handleChatKey(event) {
  if (event.key === 'Enter') {
    sendMessage();
  }
}

// Renderizar burbujas en el chat
function appendUserMessage(text) {
  const chat = document.getElementById('chat-messages');
  const msg = document.createElement('div');
  msg.className = 'message user';
  msg.innerText = text;
  chat.appendChild(msg);
  chat.scrollTop = chat.scrollHeight;
}

function appendAgentMessage(html) {
  const chat = document.getElementById('chat-messages');
  const msg = document.createElement('div');
  msg.className = 'message agent';
  msg.innerHTML = html;
  chat.appendChild(msg);
  chat.scrollTop = chat.scrollHeight;
}

function appendSystemAlert(text) {
  const chat = document.getElementById('chat-messages');
  const msg = document.createElement('div');
  msg.className = 'message system-alert';
  msg.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${text}`;
  chat.appendChild(msg);
  chat.scrollTop = chat.scrollHeight;
}

// Escribir en la Consola de Trazas (Under the Hood)
function addTrace(type, title, body) {
  const logger = document.getElementById('trace-logger');
  const entry = document.createElement('div');
  entry.className = `trace-entry ${type}`;
  
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${(now.getMilliseconds()/10).toFixed(0).padStart(2, '0')}`;
  
  let icon = 'info-circle';
  if (type === 'interpreta') icon = 'brain';
  if (type === 'consulta') icon = 'database';
  if (type === 'recomienda') icon = 'wand-magic-sparkles';
  if (type === 'negocia') icon = 'handshake';
  if (type === 'ejecuta') icon = 'check-double';
  if (type === 'alerta') icon = 'triangle-exclamation';

  entry.innerHTML = `
    <div class="trace-tag ${type}">
      <i class="fa-solid fa-${icon}"></i> ${title} 
      <span class="trace-time">[${timeStr}]</span>
    </div>
    <div class="trace-body">${body}</div>
  `;
  
  logger.appendChild(entry);
  logger.scrollTop = logger.scrollHeight;
}

// -------------------------------------------------------------
// MOTOR DE DIÁLOGO B2C (Minorista)
// -------------------------------------------------------------
function handleB2CInput(text) {
  const query = text.toLowerCase().trim();
  
  addTrace('interpreta', 'NLP - Interpreta Intención', `Analizando consulta de usuario: "${text}"`);
  
  // 1. Ver carrito
  if (query.includes('carrito') || query.includes('mostrar carrito') || query.includes('ver mi carrito')) {
    addTrace('consulta', 'Consulta Carrito B2C', 'Recuperando items activos en el carrito de compras.');
    renderB2CCart();
    return;
  }

  // 2. Checkout
  if (query.includes('comprar') || query.includes('pagar') || query.includes('checkout') || query.includes('confirmar')) {
    checkoutB2C();
    return;
  }
  
  // 3. Saludos
  if (query.includes('hola') || query.includes('buen') || query.includes('inicio') || query.includes('empezar')) {
    addTrace('recomienda', 'Saludo Detectado', 'Respondiendo saludo inicial.');
    appendAgentMessage(`¡Hola! 😊 ¿Cómo puedo ayudarte hoy? Estoy aquí para ayudarte a elegir el mejor equipamiento o indumentaria deportiva. 
      <br><br>Puedes consultarme por calzado (running, trail, gym), indumentaria (camperas, remeras, calzas), tecnología (auriculares, relojes inteligentes) o equipamiento de camping (mochilas, termos, bolsas de dormir).`);
    return;
  }

  // 4. Ver catálogo completo
  if (query.includes('catalogo') || query.includes('productos') || query.includes('que tenes') || query.includes('que venden') || query.includes('lista')) {
    addTrace('consulta', 'Consulta Catálogo Completo', 'Listando todos los productos B2C de la base de datos.');
    let html = `<p>Actualmente tengo los siguientes productos en oferta minorista B2C:</p>
      <div style="max-height: 200px; overflow-y: auto; margin-top: 0.5rem; border: 1px solid var(--border-color); border-radius: 8px; padding: 0.5rem; background: rgba(0,0,0,0.15);">
      <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; text-align: left;">
        <thead>
          <tr style="border-bottom: 1px solid var(--border-color); color: var(--accent-cyan);">
            <th style="padding: 0.4rem;">Categoría</th>
            <th style="padding: 0.4rem;">Producto</th>
            <th style="padding: 0.4rem; text-align: right;">Precio</th>
          </tr>
        </thead>
        <tbody>`;
    
    window.Catalog.b2cProducts.forEach(p => {
      html += `<tr style="border-bottom: 1px dashed rgba(255,255,255,0.03);">
        <td style="padding: 0.4rem; color: var(--text-secondary);">${p.category}</td>
        <td style="padding: 0.4rem; font-weight: 500;">${p.name}</td>
        <td style="padding: 0.4rem; text-align: right; color: var(--accent-cyan); font-family: var(--font-mono);">$${p.price.toFixed(2)}</td>
      </tr>`;
    });
    
    html += `</tbody></table></div><p style="margin-top: 0.5rem;">Dígame cuál le interesa y le daré más detalles y especificaciones.</p>`;
    appendAgentMessage(html);
    return;
  }

  // 5. Redirigir si busca productos B2B corporativos
  if (query.includes('notebook') || query.includes('thinkwork') || query.includes('laptop') || query.includes('portatil') || query.includes('monitor') || query.includes('servidor') || query.includes('cloudbox') || query.includes('mayorista') || query.includes('b2b')) {
    addTrace('alerta', 'Guardrail - Intención B2B', 'Se detectó búsqueda de productos corporativos/B2B en el canal minorista B2C.');
    appendAgentMessage(`💼 **Canal de Compras Corporativas (B2B)**<br>Veo que estás buscando equipos tecnológicos o compras al por mayor (Notebooks, Monitores o Servidores).<br><br>Por favor, **haz clic en la pestaña "B2B Mayorista"** en la parte superior para acceder al cotizador automático y al negociador de descuentos de volumen.`);
    return;
  }

  // 6. Ejecutar Búsqueda y Filtro de Presupuesto
  let maxPrice = null;
  const priceMatch = query.match(/(?:presupuesto|precio|hasta|dolares|usd|\$)\s*(\d+)/i) || query.match(/(\d+)\s*(?:dolares|usd|dólares)/i);
  if (priceMatch) {
    maxPrice = parseInt(priceMatch[1]);
    addTrace('interpreta', 'Filtro de Presupuesto', `Detectado límite de precio: $${maxPrice} USD`);
  }

  let matchedProducts = searchB2CProducts(query);

  if (maxPrice !== null) {
    if (matchedProducts.length > 0) {
      matchedProducts = matchedProducts.filter(p => p.price <= maxPrice);
    } else {
      matchedProducts = window.Catalog.b2cProducts.filter(p => p.price <= maxPrice);
    }
  }

  // 7. Renderizar Respuestas
  if (matchedProducts.length === 0) {
    addTrace('consulta', 'Motor RAG Fallback', 'No se encontraron coincidencias para la búsqueda.');
    let msg = `No encontré ningún producto que coincida exactamente con tu búsqueda`;
    if (maxPrice !== null) msg += ` por menos de $${maxPrice} USD`;
    msg += `.<br><br>Contamos con calzado deportivo, remeras, calzas, camperas cortavientos, mochilas, botellas térmicas y tecnología deportiva. ¿Te gustaría afinar tu búsqueda o escribir **'ver catalogo'**?`;
    appendAgentMessage(msg);
    return;
  }

  // Si hay una única coincidencia
  if (matchedProducts.length === 1) {
    const selected = matchedProducts[0];
    addTrace('recomienda', 'Recomendación Única', `Presentando ficha de producto para ${selected.id} (Score alto).`);
    
    let specsHtml = "";
    Object.keys(selected.specs).forEach(key => {
      specsHtml += `<br>• **${key.charAt(0).toUpperCase() + key.slice(1)}**: ${selected.specs[key]}`;
    });

    let icon = "fa-cubes";
    if (selected.category === "Zapatillas") icon = "fa-shoe-prints";
    if (selected.category === "Indumentaria") icon = "fa-shirt";
    if (selected.category === "Accesorios") icon = "fa-clock";
    if (selected.category === "Equipamiento") icon = "fa-backpack";

    let html = `
      <p>Te recomiendo la / el <strong>${selected.name}</strong> (${selected.category}). 
      Es ideal para lo que buscas. Nos quedan **${selected.stock} unidades** en stock central.
      <br><br>
      <strong>Especificaciones:</strong>${specsHtml}
      </p>
      <div class="product-card-preview" style="margin-top: 0.8rem;">
        <div class="product-img-placeholder"><i class="fa-solid ${icon}"></i></div>
        <div class="product-info-mini">
          <div class="product-name-mini">${selected.name}</div>
          <div class="product-price-mini">$${selected.price.toFixed(2)} USD</div>
        </div>
        <button class="send-btn" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="simulateB2CCartAdd('${selected.name}', ${selected.price})">Agregar</button>
      </div>
    `;
    appendAgentMessage(html);
    updateCFOkpis({ conversion: Math.min(25.0, state.kpis.conversion + 1.2) });
    return;
  }

  // Si hay múltiples coincidencias
  addTrace('recomienda', 'Recomendación Comparativa', `Mostrando lista de ${matchedProducts.length} productos coincidentes.`);
  let html = `<p>Encontré varias opciones excelentes que coinciden con tu búsqueda:</p>
    <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem; max-height: 200px; overflow-y: auto; padding-right: 0.25rem;">`;

  matchedProducts.forEach(selected => {
    let icon = "fa-cubes";
    if (selected.category === "Zapatillas") icon = "fa-shoe-prints";
    if (selected.category === "Indumentaria") icon = "fa-shirt";
    if (selected.category === "Accesorios") icon = "fa-clock";
    if (selected.category === "Equipamiento") icon = "fa-backpack";

    html += `
      <div class="product-card-preview" style="margin-top: 0;">
        <div class="product-img-placeholder" style="width: 40px; height: 40px; font-size: 1rem;"><i class="fa-solid ${icon}"></i></div>
        <div class="product-info-mini">
          <div class="product-name-mini" style="font-size: 0.8rem;">${selected.name} <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: normal;">(${selected.category})</span></div>
          <div class="product-price-mini" style="font-size: 0.75rem;">$${selected.price.toFixed(2)} USD - Stock: ${selected.stock}</div>
        </div>
        <button class="send-btn" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;" onclick="simulateB2CCartAdd('${selected.name}', ${selected.price})">Agregar</button>
      </div>
    `;
  });

  html += `</div><p style="margin-top: 0.5rem; font-size: 0.85rem;">¿Deseas detalles sobre alguno en particular? Pregúntame, por ejemplo: *"Detalles del ${matchedProducts[0].name}"*.</p>`;
  appendAgentMessage(html);
  updateCFOkpis({ conversion: Math.min(25.0, state.kpis.conversion + 0.5) });
}

// Buscar productos B2C de manera dinámica basándose en keywords/tags de la consulta
function searchB2CProducts(query) {
  const words = query.split(/\s+/).filter(w => w.length > 2);
  let matches = [];

  window.Catalog.b2cProducts.forEach(product => {
    let score = 0;
    
    // Coincidencia exacta de nombre (peso alto)
    if (product.name.toLowerCase().includes(query)) {
      score += 10;
    }
    
    // Coincidencia exacta de categoría (peso alto)
    if (product.category.toLowerCase().includes(query) || query.includes(product.category.toLowerCase())) {
      score += 8;
    }

    // Coincidencias individuales de palabras
    words.forEach(word => {
      // Coincidencia en tags
      if (product.tags && product.tags.some(tag => tag === word || tag.includes(word))) {
        score += 3;
      }
      // Coincidencia en nombre
      if (product.name.toLowerCase().includes(word)) {
        score += 2;
      }
      // Coincidencia en descripción
      if (product.description.toLowerCase().includes(word)) {
        score += 1;
      }
    });

    if (score > 0) {
      matches.push({ product, score });
    }
  });

  // Ordenar por score descendente
  matches.sort((a, b) => b.score - a.score);
  return matches.map(m => m.product);
}

// Simular agregado al carrito B2C y desglose
function simulateB2CCartAdd(name, price) {
  addTrace('ejecuta', 'Operación de Carrito', `Agregando ${name} al carrito de compras virtual del cliente.`);
  
  // Agregar al array del carrito
  const existingItem = state.b2cCart.find(item => item.name === name);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    state.b2cCart.push({ name: name, price: price, quantity: 1 });
  }

  appendSystemAlert(`Has agregado 1x <strong>${name}</strong> al carrito.`);
  addTrace('consulta', 'Inventario ERP B2C', `Reservando stock temporal para 1 unidad de ${name}. Stock OK.`);
  
  let html = `
    <p>¡Listo! He agregado <strong>${name}</strong> a tu carrito de compras.</p>
  `;
  appendAgentMessage(html);
  
  // Mostrar resumen del carrito en el chat
  setTimeout(() => {
    renderB2CCart();
  }, 300);
}

// Renderizar tabla del carrito de compras
function renderB2CCart() {
  if (state.b2cCart.length === 0) {
    appendAgentMessage("Tu carrito de compras está vacío. ¿Te gustaría buscar algún producto como zapatillas o mochilas?");
    return;
  }

  let total = 0;
  let html = `
    <p>Aquí tienes el detalle de tu <strong>carrito de compras</strong> actual:</p>
    <div class="quote-sheet">
  `;
  state.b2cCart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    html += `
      <div class="quote-line">
        <span>${item.name} (x${item.quantity})</span>
        <span>$${itemTotal.toFixed(2)} USD</span>
      </div>
    `;
  });
  html += `
      <div class="quote-line total">
        <span>Total del Carrito:</span>
        <span>$${total.toFixed(2)} USD</span>
      </div>
    </div>
    <div style="margin-top: 0.8rem; display: flex; gap: 0.5rem;">
      <button class="send-btn" style="background: var(--success); color: var(--bg-primary);" onclick="checkoutB2C()">Proceder al Pago</button>
      <button class="send-btn" style="background: rgba(255,255,255,0.05); color: var(--text-primary); border: 1px solid var(--border-color);" onclick="clearB2CCart()">Vaciar Carrito</button>
    </div>
  `;
  appendAgentMessage(html);
}

// Vaciar Carrito B2C
function clearB2CCart() {
  state.b2cCart = [];
  addTrace('ejecuta', 'Vaciando Carrito B2C', 'Se eliminaron todos los productos del carrito.');
  appendSystemAlert("Has vaciado tu carrito de compras.");
  appendAgentMessage("Tu carrito ahora está vacío. ¿En qué más puedo ayudarte?");
}

// Procesar Pago (Checkout) B2C
function checkoutB2C() {
  if (state.b2cCart.length === 0) {
    appendAgentMessage("No hay productos en tu carrito para comprar.");
    return;
  }

  let total = 0;
  state.b2cCart.forEach(item => {
    total += item.price * item.quantity;
  });

  addTrace('ejecuta', 'Checkout B2C Iniciado', 'Cliente procede a finalizar la compra. Cargando datos de envío y pago predeterminados.');
  appendSystemAlert(`Procesando pago por $${total.toFixed(2)} USD...`);

  setTimeout(() => {
    addTrace('ejecuta', 'Transacción ERP/OMS', `Generando orden de venta en ERP por $${total.toFixed(2)} USD. Pago aprobado.`);
    addTrace('ejecuta', 'Registro en CRM', 'Orden registrada con éxito. Estado: Completada.');

    appendAgentMessage(`🚀 **¡Compra finalizada con éxito!** Se ha procesado tu orden por un total de **$${total.toFixed(2)} USD**. Tu pedido ya se está preparando en el centro de distribución. El comprobante y la factura electrónica fueron enviados a tu correo: **mljordanoff@baufest.com**.`);
    
    // Registrar la orden en la base de datos simulada
    const itemsList = state.b2cCart.map(item => `${item.quantity}x ${item.name}`).join(", ");
    registerOrder("B2C", "mljordanoff@baufest.com", itemsList, total);

    // Vaciar carrito
    state.b2cCart = [];

    updateCFOkpis({ 
      conversion: 14.8, 
      nps: 58 
    });
  }, 1000);
}

// -------------------------------------------------------------
// MOTOR DE DIÁLOGO B2B (Mayorista & Negociador)
// -------------------------------------------------------------
function handleB2BInput(text) {
  const query = text.toLowerCase();
  addTrace('interpreta', 'NLP B2B - Interpreta Rol & Intención', `Analizando consulta corporativa: "${text}" bajo rol de [${state.b2b.role.toUpperCase()}]`);

  // Identificar si hay números/cantidad en este mensaje
  const matchNumber = query.match(/(\d+)/);
  const parsedNumber = matchNumber ? parseInt(matchNumber[1]) : 0;

  // 1. Si estamos activamente esperando un porcentaje de descuento de la negociación
  if (state.b2b.negotiating && parsedNumber > 0) {
    state.b2b.negotiating = false;
    let requestedDiscount = parsedNumber;
    if (requestedDiscount > 1) {
      requestedDiscount = requestedDiscount / 100; // Convertir 12 a 0.12
    }
    executeB2BNegotiation(requestedDiscount);
    return;
  }

  // Identificar si se menciona algún producto
  let productMentioned = null;
  if (query.includes('notebook') || query.includes('thinkwork') || query.includes('portatil') || query.includes('laptop')) {
    productMentioned = window.Catalog.b2bProducts.find(p => p.id === 'B2B-LAP-01');
  } else if (query.includes('monitor') || query.includes('flexmonitor')) {
    productMentioned = window.Catalog.b2bProducts.find(p => p.id === 'B2B-MON-02');
  } else if (query.includes('servidor') || query.includes('cloudbox')) {
    productMentioned = window.Catalog.b2bProducts.find(p => p.id === 'B2B-SRV-03');
  }

  // Solicitud de descuento adicional
  if (query.includes('descuento') || query.includes('negociar') || query.includes('rebaja') || query.includes('%') || 
      ((query === 'si' || query === 'sí' || query === 'quiero' || query === 'claro' || query === 'ok' || query.includes('adicional')) && state.b2b.activeProduct)) {
    
    if (!state.b2b.activeProduct) {
      appendAgentMessage("Para negociar un descuento, primero necesitamos generar una cotización. ¿Qué producto y cantidad le gustaría cotizar?");
      return;
    }
    
    // Resetear flag de negociación temporal
    state.b2b.negotiating = false;

    // Extraer porcentaje si existe en la query
    const matchPercent = query.match(/(\d+)\s*%/);
    const matchNumRaw = query.match(/(\d+)/);
    
    if (matchPercent) {
      let requestedDiscount = parseFloat(matchPercent[1]) / 100;
      executeB2BNegotiation(requestedDiscount);
    } else if (matchNumRaw && query.includes('%')) {
      let requestedDiscount = parseFloat(matchNumRaw[1]) / 100;
      executeB2BNegotiation(requestedDiscount);
    } else {
      // Si no especificó un porcentaje, le preguntamos y activamos el flag
      state.b2b.negotiating = true;
      addTrace('interpreta', 'Intención de Negociación', 'El cliente desea negociar un descuento pero no especificó el porcentaje.');
      appendAgentMessage(`Entendido, iniciemos la negociación de la cotización **${state.b2b.quoteNumber}**. <br><br>¿Qué porcentaje de descuento adicional desea solicitar? Por favor, indíquelo (ejemplo: **12%** o **15%**).`);
    }
    return;
  }

  // Confirmar orden o rechazar negociación de descuento adicional (Aceptar cotización base)
  if ((query === 'no' || query === 'no gracias' || query === 'confirmar' || query === 'aceptar' || query === 'comprar' || query === 'aprobar' || query === 'no negociar' || query === 'no quiero') && state.b2b.activeProduct) {
    state.b2b.negotiating = false;
    const clientInfo = window.Catalog.b2bClients[state.b2b.clientKey];
    const product = state.b2b.activeProduct;
    const qty = state.b2b.quantity;
    const subtotal = product.listPrice * qty;
    const discountVal = subtotal * state.b2b.currentDiscount;
    const total = subtotal - discountVal;
    
    addTrace('ejecuta', 'Confirmación Directa', 'Cliente decide no negociar descuentos adicionales y aprueba la cotización base.');
    approveB2BQuote(state.b2b.quoteNumber, total);
    return;
  }

  let selected = null;
  let qty = 0;

  if (productMentioned) {
    if (parsedNumber > 0) {
      // Caso 1: Menciona el producto y la cantidad en el mismo mensaje
      selected = productMentioned;
      qty = parsedNumber;
      state.b2b.pendingProduct = null; // Limpiar pendientes
      state.b2b.negotiating = false;   // Resetear negociación
    } else {
      // Caso 2: Menciona el producto pero no la cantidad
      state.b2b.pendingProduct = productMentioned;
      state.b2b.negotiating = false;   // Resetear negociación
      addTrace('interpreta', 'Falta Cantidad', `Detectado producto ${productMentioned.name} sin cantidad especificada. Solicitando cantidad.`);
      appendAgentMessage(`Excelente elección. Desea cotizar **${productMentioned.name}**. ¿Qué cantidad de unidades necesita? (Por favor, responda indicando solo el número, el pedido mínimo es de ${productMentioned.minOrderQty} unidades).`);
      return;
    }
  } else if (parsedNumber > 0 && state.b2b.pendingProduct) {
    // Caso 3: Mandó solo un número, y teníamos guardado un producto pendiente
    selected = state.b2b.pendingProduct;
    qty = parsedNumber;
    state.b2b.pendingProduct = null; // Limpiar
    state.b2b.negotiating = false;   // Resetear negociación
    addTrace('interpreta', 'Cantidad Vinculada', `Asociando cantidad de ${qty} unidades al producto pendiente ${selected.name}.`);
  }

  // Generar Cotización Inicial si logramos identificar ambos
  if (selected && qty > 0) {
    if (qty < selected.minOrderQty) {
      addTrace('alerta', 'Guardrail - Cantidad Mínima', `Cantidad ${qty} es menor al pedido mínimo B2B (${selected.minOrderQty}). Ajustando automáticamente.`);
      appendSystemAlert(`El pedido mínimo para <strong>${selected.name}</strong> es de <strong>${selected.minOrderQty} unidades</strong>. He ajustado la cantidad para poder emitir la cotización.`);
      qty = selected.minOrderQty;
    }

    state.b2b.activeProduct = selected;
    state.b2b.quantity = qty;
    state.b2b.listPrice = selected.listPrice;
    state.b2b.quoteNumber = `Q-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    addTrace('consulta', 'ERP - Chequeo de Stock', `Validando existencia de ${qty} unidades de ${selected.id}. Disponible: ${selected.stock} unidades.`);
    
    calculateAndRenderQuote();
    return;
  }

  // Fallback
  addTrace('interpreta', 'Clasificación Conversacional', 'Consulta general sin intención clara de cotización.');
  appendAgentMessage("Puedo generar cotizaciones automáticas para nuestros productos mayoristas (Notebooks ThinkWork Pro, Monitores FlexMonitor y Servidores CloudBox). Indíqueme el producto y la cantidad requerida para procesarlo.");
}

// Calcular y Renderizar la Hoja de Cotización
function calculateAndRenderQuote() {
  const clientInfo = window.Catalog.b2bClients[state.b2b.clientKey];
  const product = state.b2b.activeProduct;
  const qty = state.b2b.quantity;
  
  // Descuento base según nivel de cliente
  let baseDiscount = 0.02; // Bronze / general
  if (clientInfo.tier === 'GOLD') baseDiscount = 0.05;
  if (clientInfo.tier === 'SILVER') baseDiscount = 0.03;
  
  state.b2b.currentDiscount = baseDiscount;
  
  const subtotal = product.listPrice * qty;
  const discountVal = subtotal * baseDiscount;
  const total = subtotal - discountVal;
  
  addTrace('ejecuta', 'Motor de Precios B2B', `Aplicando descuento comercial estándar de nivel ${clientInfo.tier} (${baseDiscount*100}%).`);
  addTrace('ejecuta', 'Generación de Presupuesto', `Generando presupuesto ${state.b2b.quoteNumber} en formato CRM.`);

  // Explicación adaptada al Rol
  let explanation = "";
  if (state.b2b.role === 'decisor') {
    const roiVal = (subtotal * 0.25).toFixed(0); // Simulación de ROI
    explanation = `He preparado la propuesta comercial enfocada en la eficiencia operativa. La incorporación de estos equipos proyecta un **retorno de inversión (ROI) estimado de $${roiVal} USD** en el primer año debido al ahorro de energía y productividad.`;
  } else if (state.b2b.role === 'compras') {
    explanation = `Aquí tiene el detalle de la cotización para compras. Se ha aplicado la tarifa especial con **condiciones de pago a ${clientInfo.paymentTerms}** según nuestro acuerdo de nivel corporativo.`;
  } else if (state.b2b.role === 'tecnico') {
    explanation = `Propuesta técnica lista. Los equipos cumplen con las especificaciones del contrato: **${product.specs.procesador || product.specs.resolucion || 'Especificación Corporativa'}** y garantía corporativa de **${product.specs.garantia || '1 año'}**.`;
  }

  let html = `
    <p>He emitido la cotización oficial **${state.b2b.quoteNumber}** para la cuenta **${clientInfo.name}**.</p>
    <p style="margin-top: 0.5rem; font-size: 0.9rem; color: var(--text-secondary); italic;">${explanation}</p>
    
    <div class="quote-sheet">
      <div class="quote-line"><span>Producto:</span> <span>${product.name}</span></div>
      <div class="quote-line"><span>Cantidad:</span> <span>${qty} un.</span></div>
      <div class="quote-line"><span>Precio Unitario Lista:</span> <span>$${product.listPrice.toFixed(2)} USD</span></div>
      <div class="quote-line"><span>Descuento Inicial (${Math.round(baseDiscount*100)}%):</span> <span>-$${discountVal.toFixed(2)} USD</span></div>
      <div class="quote-line total"><span>Total Cotizado:</span> <span>$${total.toFixed(2)} USD</span></div>
    </div>
    
    <div style="margin-top: 0.8rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
      <button class="send-btn" style="background: var(--success); color: var(--bg-primary);" onclick="approveB2BQuote('${state.b2b.quoteNumber}', ${total})">Aceptar y Enviar al ERP</button>
    </div>
    
    <p style="margin-top: 0.8rem; font-size: 0.85rem; color: var(--accent-cyan);"><i class="fa-solid fa-comments"></i> <em>¿Desea negociar un descuento comercial adicional para cerrar la orden hoy?</em></p>
  `;
  
  appendAgentMessage(html);
  
  // Actualizar métricas
  updateCFOkpis({ 
    speed: '12 seg', // Velocidad Comercial pasa de 48h a 12 seg!
    conversion: 5.5
  });
}

// Proceso de personalización según el Rol B2B en caliente
function explainB2BPersonalization() {
  const role = state.b2b.role;
  const product = state.b2b.activeProduct;
  const subtotal = product.listPrice * state.b2b.quantity;

  addTrace('interpreta', 'Adaptación Contextual de Rol', `El interlocutor cambió a [${role.toUpperCase()}]. Re-estructurando presentación de valor.`);
  
  let details = "";
  if (role === 'decisor') {
    details = `Análisis de Negocio para el **Decisor (CFO/Director)**: Foco en ROI y productividad comercial.`;
  } else if (role === 'compras') {
    details = `Análisis de Compras: Foco en costos unitarios, plazos de pago (${window.Catalog.b2bClients[state.b2b.clientKey].paymentTerms}) y descuentos.`;
  } else if (role === 'tecnico') {
    details = `Ficha de Homologación Técnica: Arquitectura e integraciones del equipo.`;
  }
  
  addTrace('recomienda', 'Personalización de Contenido', details);
}

// MOTOR DE NEGOCIACIÓN B2B CON GUARDRAILS DE MARGEN
function executeB2BNegotiation(requestedDiscount) {
  const clientInfo = window.Catalog.b2bClients[state.b2b.clientKey];
  const product = state.b2b.activeProduct;
  const qty = state.b2b.quantity;
  
  addTrace('interpreta', 'Negociación - Análisis de Descuento', `Cliente solicita descuento del ${Math.round(requestedDiscount*100)}% en la cotización.`);

  const listPriceTotal = product.listPrice * qty;
  const costTotal = product.cost * qty;
  
  // Calcular precio propuesto y margen resultante
  const proposedPriceTotal = listPriceTotal * (1 - requestedDiscount);
  const calculatedMargin = (proposedPriceTotal - costTotal) / proposedPriceTotal;

  addTrace('consulta', 'Guardrails - Rentabilidad', `Costo Total: $${costTotal} USD | Precio Propuesto: $${proposedPriceTotal} USD | Margen Estimado: ${Math.round(calculatedMargin*100)}% (Límite Mín: ${window.Catalog.rules.absoluteMinMargin*100}%)`);

  // Regla 1: Violar margen absoluto mínimo corporativo (Ej: margen cae abajo del 15%)
  if (calculatedMargin < window.Catalog.rules.absoluteMinMargin) {
    addTrace('alerta', 'Guardrail Infringido', `El descuento solicitado del ${Math.round(requestedDiscount*100)}% dejaría un margen del ${Math.round(calculatedMargin*100)}%, inferior al mínimo absoluto de la compañía (${window.Catalog.rules.absoluteMinMargin*100}%). Operación rechazada.`);
    
    // Proponer descuento máximo que sí respete el margen mínimo
    // proposedPrice = costTotal / (1 - minMargin)
    const maxViablePrice = costTotal / (1 - window.Catalog.rules.absoluteMinMargin);
    const maxViableDiscount = (listPriceTotal - maxViablePrice) / listPriceTotal;
    
    const finalAllowedDiscount = Math.floor(maxViableDiscount * 100) / 100;
    const finalTotal = listPriceTotal * (1 - finalAllowedDiscount);

    let html = `
      <p>⚠️ **Solicitud de Descuento Excedida**</p>
      <p>No puedo autorizar un descuento del **${Math.round(requestedDiscount*100)}%** debido a las políticas de rentabilidad y margen mínimo sobre la línea ${product.category}.</p>
      <p>Sin embargo, para cerrar el acuerdo hoy, mi sistema me permite otorgarle un **descuento máximo del ${Math.round(finalAllowedDiscount*100)}%** con aprobación inmediata.</p>
      
      <div class="quote-sheet">
        <div class="quote-line"><span>Producto:</span> <span>${product.name}</span></div>
        <div class="quote-line"><span>Cantidad:</span> <span>${qty} un.</span></div>
        <div class="quote-line"><span>Precio Unitario Lista:</span> <span>$${product.listPrice.toFixed(2)} USD</span></div>
        <div class="quote-line"><span>Descuento Máximo (${Math.round(finalAllowedDiscount*100)}%):</span> <span>-$${(listPriceTotal * finalAllowedDiscount).toFixed(2)} USD</span></div>
        <div class="quote-line total" style="color: var(--warning);"><span>Total Final Viable:</span> <span>$${finalTotal.toFixed(2)} USD</span></div>
      </div>
      <button class="send-btn" style="margin-top: 0.8rem; background: var(--success); color: var(--bg-primary);" onclick="approveB2BQuote('${state.b2b.quoteNumber}', ${finalTotal})">Confirmar Compra</button>
    `;
    
    appendAgentMessage(html);
    return;
  }

  // Regla 2: Dentro del margen, pero supera la autonomía máxima del agente para esa cuenta
  if (requestedDiscount > clientInfo.maxAutoDiscount) {
    addTrace('alerta', 'Guardrail de Autonomía Excedido', `Descuento solicitado (${Math.round(requestedDiscount*100)}%) es mayor al límite autorizado para el agente en esta cuenta (${Math.round(clientInfo.maxAutoDiscount*100)}%). Requiere aprobación humana.`);
    
    let html = `
      <p>👨‍💼 **Escalación a Humano-en-el-Loop (Aprobación Requerida)**</p>
      <p>El descuento del **${Math.round(requestedDiscount*100)}%** es viable financieramente para nuestra compañía, pero supera mi nivel de autorización autónoma para cuentas de nivel **${clientInfo.tier}**.</p>
      <p>He enviado una **solicitud de validación express** a tu Ejecutivo de Cuentas. Responderá a través de este chat en menos de 5 minutos.</p>
    `;
    appendAgentMessage(html);

    // Simular aprobación humana después de 3 segundos
    setTimeout(() => {
      addTrace('ejecuta', 'Aprobación Humana Recibida', `El Ejecutivo de cuentas aprobó manualmente el presupuesto ${state.b2b.quoteNumber} con ${Math.round(requestedDiscount*100)}% de descuento.`);
      appendSystemAlert(`<strong>Ejecutivo de Cuentas (Humano)</strong> aprobó el descuento del ${Math.round(requestedDiscount*100)}%.`);
      
      const discountedTotal = listPriceTotal * (1 - requestedDiscount);
      let approvedHtml = `
        <p>✅ **Cotización Aprobada por Ejecutivo**</p>
        <p>Se ha emitido la actualización de la cotización **${state.b2b.quoteNumber}** con el **${Math.round(requestedDiscount*100)}%** de descuento solicitado.</p>
        
        <div class="quote-sheet">
          <div class="quote-line"><span>Descuento Especial (${Math.round(requestedDiscount*100)}%):</span> <span>-$${(listPriceTotal * requestedDiscount).toFixed(2)} USD</span></div>
          <div class="quote-line total"><span>Total Aprobado:</span> <span>$${discountedTotal.toFixed(2)} USD</span></div>
        </div>
        <button class="send-btn" style="margin-top: 0.8rem; background: var(--success); color: var(--bg-primary);" onclick="approveB2BQuote('${state.b2b.quoteNumber}', ${discountedTotal})">Aceptar y Enviar al ERP</button>
      `;
      appendAgentMessage(approvedHtml);
    }, 3000);
    return;
  }

  // Regla 3: Descuento autorizado automáticamente
  state.b2b.currentDiscount = requestedDiscount;
  const finalTotal = listPriceTotal * (1 - requestedDiscount);
  
  addTrace('negocia', 'Aprobación Autónoma', `Descuento del ${Math.round(requestedDiscount*100)}% autorizado directamente por el agente. Dentro de los márgenes y nivel de cuenta.`);
  
  let html = `
    <p>🤝 **Descuento Autorizado Automáticamente**</p>
    <p>He ajustado tu cotización **${state.b2b.quoteNumber}** aplicando el descuento solicitado del **${Math.round(requestedDiscount*100)}%** de manera inmediata.</p>
    
    <div class="quote-sheet">
      <div class="quote-line"><span>Producto:</span> <span>${product.name}</span></div>
      <div class="quote-line"><span>Cantidad:</span> <span>${qty} un.</span></div>
      <div class="quote-line"><span>Precio Unitario Lista:</span> <span>$${product.listPrice.toFixed(2)} USD</span></div>
      <div class="quote-line"><span>Descuento Comercial (${Math.round(requestedDiscount*100)}%):</span> <span>-$${(listPriceTotal * requestedDiscount).toFixed(2)} USD</span></div>
      <div class="quote-line total"><span>Total Neto:</span> <span>$${finalTotal.toFixed(2)} USD</span></div>
    </div>
    <button class="send-btn" style="margin-top: 0.8rem; background: var(--success); color: var(--bg-primary);" onclick="approveB2BQuote('${state.b2b.quoteNumber}', ${finalTotal})">Aceptar y Enviar al ERP</button>
  `;
  appendAgentMessage(html);
}

// Aprobación final y envío al ERP
function approveB2BQuote(quoteNum, total) {
  const clientInfo = window.Catalog.b2bClients[state.b2b.clientKey];
  // Mapeo de correos según la cuenta seleccionada
  const emails = {
    "CLI-GLOBAL-TECH": "billing@globaltech.com",
    "CLI-PAPYRUS-INC": "compras@papyrus.com",
    "CLI-STARTUP-NEX": "finanzas@nexus.com"
  };
  const email = emails[state.b2b.clientKey] || "administracion@empresa.com";

  addTrace('ejecuta', 'Agente -> Sistema (ERP)', `Enviando orden de compra generada de cotización ${quoteNum} al ERP para facturación y asignación de stock.`);
  appendSystemAlert(`Enviando Orden de Compra al ERP...`);
  
  setTimeout(() => {
    addTrace('ejecuta', 'Fulfillment Trigger', `Notificando a Sistema de Almacén (WMS) para preparar el envío de la orden.`);
    appendAgentMessage(`🎉 **¡Orden Confirmada!** Hemos generado la orden de compra en tu ERP. Los equipos están reservados en el almacén. La factura electrónica ha sido enviada al correo registrado de la cuenta: **${email}**.`);
    
    // Registrar la orden en la base de datos simulada
    registerOrder("B2B", clientInfo.name, `${state.b2b.quantity}x ${state.b2b.activeProduct.name}`, total);

    updateCFOkpis({ 
      conversion: 18.5, 
      nps: 65, 
      reorder: 25 // Sube la recompra porque facilitamos el proceso
    });
  }, 1000);
}

// -------------------------------------------------------------
// SIMULACIÓN DE ALMACÉN & LOGÍSTICA (PICKING CANVAS)
// -------------------------------------------------------------
let canvas, ctx;
let pickingBot = { x: 50, y: 50 };
let pickItems = [];
let routePoints = [];
let animationFrameId = null;
let isPicking = false;

function setupWarehouseCanvas() {
  canvas = document.getElementById('warehouse-canvas');
  ctx = canvas.getContext('2d');
  
  // Adaptar dimensiones reales del canvas al contenedor
  // Si clientWidth mide 0 debido a un retraso de layout, usamos 600px de ancho y 280px de alto por defecto
  const width = canvas.parentElement.clientWidth || 600;
  const height = canvas.parentElement.clientHeight || 280;
  
  canvas.width = width;
  canvas.height = height;
}

// Redibujar la grilla del almacén
function drawWarehouseGrid(path) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const cols = 8;
  const rows = 4;
  const w = canvas.width / (cols + 1);
  const h = canvas.height / (rows + 1);

  // Dibujar Estanterías (Pasillos de picking)
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;

  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= cols; c++) {
      if (c % 2 !== 0) { // Dejar pasillos entre columnas de estanterías
        ctx.fillRect(c * w - w/4, r * h - h/4, w/2, h/2);
        ctx.strokeRect(c * w - w/4, r * h - h/4, w/2, h/2);
      }
    }
  }

  // Dibujar Etiquetas de Bahías (Texto de apoyo)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '500 9px var(--font-sans)';
  ctx.textAlign = 'center';
  ctx.fillText('Bahía Despacho', w/2, h/2 + 15); // Movido abajo del punto de inicio para evitar traslape
  ctx.fillText('Dock Devoluciones', w/2, canvas.height - h/2 + 15);

  // Dibujar Nombres de Estanterías (Pasillos / Categorías de productos)
  ctx.fillStyle = '#38bdf8'; // Celeste brillante muy legible en fondo oscuro
  ctx.font = 'bold 8.5px var(--font-sans)';
  ctx.fillText('ESTANTE A (Calzado)', 1 * w, 15);
  ctx.fillText('ESTANTE B (Outdoor)', 3 * w, 15);
  ctx.fillText('ESTANTE C (Laptops)', 5 * w, 15);
  ctx.fillText('ESTANTE D (Servidores)', 7 * w, 15);

  // Dibujar Ruta de Picking si existe
  if (path && path.length > 0) {
    ctx.strokeStyle = 'rgba(0, 210, 255, 0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.stroke();
  }

  // Dibujar Ítems a recolectar / devolver
  pickItems.forEach(item => {
    if (item.isReturn) {
      ctx.fillStyle = item.collected ? 'rgba(217, 70, 239, 0.3)' : '#d946ef';
      ctx.strokeStyle = 'var(--accent-purple)';
    } else {
      ctx.fillStyle = item.collected ? 'rgba(16, 185, 129, 0.3)' : '#f59e0b';
      ctx.strokeStyle = item.collected ? 'var(--success)' : 'var(--warning)';
    }
    ctx.beginPath();
    ctx.arc(item.x, item.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  // Dibujar Bot del Operador (Picker)
  ctx.fillStyle = '#00d2ff';
  ctx.beginPath();
  ctx.arc(pickingBot.x, pickingBot.y, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();
}

// Simular el Algoritmo de Picking Óptimo (TSP / Greedy)
function startPickingDemo() {
  if (isPicking) return;
  isPicking = true;
  
  document.getElementById('picking-status').innerHTML = `<span class="logo-badge" style="background: rgba(245, 158, 11, 0.1); border-color: rgba(245, 158, 11, 0.2); color: var(--warning);">Orquestando...</span>`;
  
  const cols = 8;
  const rows = 4;
  const w = canvas.width / (cols + 1);
  const h = canvas.height / (rows + 1);

  // Inicializar Bot de Picking en la Bahía de salida
  pickingBot = { x: w/2, y: h/2 };

  // Generar 5 ítems aleatorios de picking en los pasillos de estanterías
  pickItems = [];
  for (let i = 0; i < 5; i++) {
    const r = Math.floor(1 + Math.random() * rows);
    const c = Math.floor(1 + Math.random() * cols);
    // Asegurar que queden en pasillos
    const pasilloCol = c % 2 === 0 ? c : c + 1;
    pickItems.push({
      id: i,
      x: pasilloCol * w - w/2,
      y: r * h,
      collected: false
    });
  }

  addTrace('interpreta', 'Orquestación de Pedidos WMS', 'Recibido lote de picking para preparación. Analizando posiciones óptimas.');
  addTrace('consulta', 'Cálculo de Ruta Óptima', 'Calculando el camino más corto del recolector (Resolución del problema del viajante heurística).');

  // Ordenar ítems por cercanía para el bot (algoritmo greedy simple)
  let currentPos = { x: pickingBot.x, y: pickingBot.y };
  let remainingItems = [...pickItems];
  routePoints = [ { x: currentPos.x, y: currentPos.y } ];

  while (remainingItems.length > 0) {
    // Buscar el más cercano
    let closestIndex = 0;
    let minDistance = Infinity;
    for (let i = 0; i < remainingItems.length; i++) {
      const dist = Math.hypot(remainingItems[i].x - currentPos.x, remainingItems[i].y - currentPos.y);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = i;
      }
    }
    const nextItem = remainingItems.splice(closestIndex, 1)[0];
    routePoints.push(nextItem);
    currentPos = { x: nextItem.x, y: nextItem.y };
  }
  
  // Volver a la bahía de salida
  routePoints.push({ x: w/2, y: h/2 });

  // Animación del movimiento del bot a lo largo de la ruta
  let pointIndex = 0;
  
  function animate() {
    if (pointIndex >= routePoints.length) {
      // Finalizado
      isPicking = false;
      document.getElementById('picking-status').innerHTML = `<span class="logo-badge" style="background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.2); color: var(--success);">Listo</span>`;
      addTrace('ejecuta', 'Picking Completado', 'Todos los ítems recolectados con éxito. Ruta optimizada en un 38% vs. ruta lineal.');
      updateCFOkpis({ 
        cost: 65, // Reducción de costos de picking de warehouse (-35%)
      });
      return;
    }

    const target = routePoints[pointIndex];
    const dx = target.x - pickingBot.x;
    const dy = target.y - pickingBot.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 4) {
      // Llegó al punto
      pickingBot.x = target.x;
      pickingBot.y = target.y;
      
      // Marcar item como recolectado
      const matchedItem = pickItems.find(item => item.x === target.x && item.y === target.y);
      if (matchedItem && !matchedItem.collected) {
        matchedItem.collected = true;
        addTrace('ejecuta', 'Ítem Recolectado', `Operador recolectó el producto en la posición (${Math.round(target.x)}, ${Math.round(target.y)}).`);
      }
      
      pointIndex++;
    } else {
      // Mover hacia el objetivo
      pickingBot.x += (dx / dist) * 3;
      pickingBot.y += (dy / dist) * 3;
    }

    drawWarehouseGrid(routePoints.slice(0, pointIndex + 1));
    animationFrameId = requestAnimationFrame(animate);
  }

  animate();
}

// Simular Procesamiento Automatizado de Devoluciones (Excepciones logísticas)
function startReturnsDemo() {
  if (isPicking) return;
  isPicking = true;
  
  const cols = 8;
  const rows = 4;
  const w = canvas.width / (cols + 1);
  const h = canvas.height / (rows + 1);

  // Lista de ítems retornables para simulación aleatoria
  const RETURNABLE_ITEMS = [
    { name: "SpeedTrail Pro", price: 150.00, col: 1, shelfName: "Estante A (Calzado)", channel: "B2C", client: "mljordanoff@baufest.com", reason: "por talle incorrecto" },
    { name: "UltraBoost Nova 2026", price: 180.00, col: 1, shelfName: "Estante A (Calzado)", channel: "B2C", client: "mljordanoff@baufest.com", reason: "por disconformidad con amortiguación" },
    { name: "Mochila Explorer 45L", price: 120.00, col: 3, shelfName: "Estante B (Outdoor)", channel: "B2C", client: "mljordanoff@baufest.com", reason: "por color incorrecto" },
    { name: "SmartFit Band X", price: 99.00, col: 3, shelfName: "Estante B (Outdoor)", channel: "B2C", client: "mljordanoff@baufest.com", reason: "por detalle estético" },
    { name: "Notebook ThinkWork Pro", price: 1200.00, col: 5, shelfName: "Estante C (Laptops)", channel: "B2B", client: "Global Tech Solutions", reason: "por excedente de proyecto" }
  ];

  const chosenItem = RETURNABLE_ITEMS[Math.floor(Math.random() * RETURNABLE_ITEMS.length)];
  const randomRow = Math.floor(1 + Math.random() * rows);

  document.getElementById('picking-status').innerHTML = `<span class="logo-badge" style="background: rgba(139, 92, 246, 0.1); border-color: rgba(139, 92, 246, 0.2); color: var(--accent-purple);">Retorno: ${chosenItem.name}</span>`;

  // Posición inicial del bot (Bahía de salida)
  pickingBot = { x: w/2, y: h/2 };
  
  // Definir la bahía de recepción (Dock de Devoluciones) y la estantería de restock
  const returnDock = { x: w/2, y: canvas.height - h/2 };
  const restockShelf = { x: chosenItem.col * w - w/2, y: randomRow * h };
  
  // Representar el ítem retornado en el Dock (magenta)
  pickItems = [{
    id: 99,
    x: returnDock.x,
    y: returnDock.y,
    collected: false,
    isReturn: true
  }];

  // Definir los puntos de la ruta
  routePoints = [
    { x: pickingBot.x, y: pickingBot.y }, // Inicio (Salida)
    { x: returnDock.x, y: returnDock.y }, // Bahía de Devoluciones
    { x: restockShelf.x, y: restockShelf.y }, // Estante de Restock
    { x: w/2, y: h/2 } // Retorno a base
  ];

  addTrace('interpreta', 'Recepción de Devolución', `Cliente ${chosenItem.channel} solicita devolución de ${chosenItem.name} ${chosenItem.reason}.`);
  addTrace('consulta', 'OMS & Política de Retornos', 'Validando plazo de compra (14 días). Compra realizada hace 3 días. Permitido.');
  addTrace('ejecuta', 'Generación de RMA', 'Generando ticket de retorno automatizado. Notificando a correo del cliente.');

  let pointIndex = 0;
  
  function animate() {
    if (pointIndex >= routePoints.length) {
      isPicking = false;
      document.getElementById('picking-status').innerHTML = `<span class="logo-badge" style="background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.2); color: var(--success);">Listo</span>`;
      
      addTrace('ejecuta', 'Devolución Completada', `Producto ${chosenItem.name} reintegrado al inventario físico en ${chosenItem.shelfName} (Fila ${randomRow}) y disponible para la venta.`);
      
      // Registrar la devolución en la base de datos simulada (monto negativo, prefijo RET y estado Devuelto)
      registerOrder(chosenItem.channel, chosenItem.client, `1x ${chosenItem.name} (Devolución)`, -chosenItem.price, "Devuelto", "RET");
      
      updateCFOkpis({ nps: 78 }); // Sube el NPS por posventa proactiva y veloz
      return;
    }

    const target = routePoints[pointIndex];
    const dx = target.x - pickingBot.x;
    const dy = target.y - pickingBot.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 4) {
      pickingBot.x = target.x;
      pickingBot.y = target.y;
      
      // Acciones específicas en los puntos
      if (pointIndex === 1) { // Llegó al dock a retirar el producto
        const item = pickItems.find(i => i.isReturn);
        if (item && !item.collected) {
          item.collected = true;
          addTrace('ejecuta', 'Recepción en Dock', `Robot recolectó el producto retornado en la bahía de carga.`);
        }
      } else if (pointIndex === 2) { // Llegó a la estantería a colocar el producto
        addTrace('ejecuta', 'Restock en Estantería', `Robot colocó el producto en la estantería de destino. Casillero ${chosenItem.shelfName} - Fila ${randomRow} actualizado en WMS y stock incrementado.`);
        pickItems = []; // Limpiar para que desaparezca
      }
      
      pointIndex++;
    } else {
      // Mover hacia el objetivo
      pickingBot.x += (dx / dist) * 3;
      pickingBot.y += (dy / dist) * 3;
    }

    drawWarehouseGrid(routePoints.slice(0, pointIndex + 1));
    animationFrameId = requestAnimationFrame(animate);
  }

  animate();
}

// -------------------------------------------------------------
// ACTUALIZACIÓN DE GRÁFICOS Y MÉTRICAS DEL CFO
// -------------------------------------------------------------
function updateCFOkpis(newKpis) {
  Object.keys(newKpis).forEach(key => {
    state.kpis[key] = newKpis[key];
  });

  // Renderizar valores en el DOM
  // 1. Conversión
  const conversionEl = document.getElementById('kpi-conversion');
  const convProgress = document.getElementById('progress-conversion');
  const convDiff = document.getElementById('kpi-conversion-diff');
  
  conversionEl.innerText = `${state.kpis.conversion.toFixed(1)}%`;
  convProgress.style.width = `${state.kpis.conversion * 5}%`; // escala representativa
  if (state.kpis.conversion > 2.4) {
    convDiff.innerHTML = `<i class="fa-solid fa-arrow-up"></i> +${(state.kpis.conversion - 2.4).toFixed(1)}%`;
    convDiff.className = "kpi-diff up";
  }

  // 2. Velocidad de Cotización
  const speedEl = document.getElementById('kpi-speed');
  const speedProgress = document.getElementById('progress-speed');
  const speedDiff = document.getElementById('kpi-speed-diff');
  
  speedEl.innerText = state.kpis.speed;
  if (state.kpis.speed === '12 seg') {
    speedProgress.style.width = '95%';
    speedDiff.innerHTML = `<i class="fa-solid fa-bolt"></i> Inmediato`;
    speedDiff.style.color = 'var(--success)';
  }

  // 3. Recompra Predictiva
  const reorderEl = document.getElementById('kpi-reorder');
  const reorderProgress = document.getElementById('progress-reorder');
  const reorderDiff = document.getElementById('kpi-reorder-diff');
  
  reorderEl.innerText = `${state.kpis.reorder}%`;
  reorderProgress.style.width = `${state.kpis.reorder}%`;
  if (state.kpis.reorder > 0) {
    reorderDiff.innerHTML = `<i class="fa-solid fa-arrow-up"></i> +${state.kpis.reorder}%`;
    reorderDiff.className = "kpi-diff up";
  }

  // 4. Costo de Picking
  const costEl = document.getElementById('kpi-cost');
  const costProgress = document.getElementById('progress-cost');
  const costDiff = document.getElementById('kpi-cost-diff');
  
  costEl.innerText = `${state.kpis.cost}%`;
  costProgress.style.width = `${state.kpis.cost}%`;
  if (state.kpis.cost < 100) {
    costDiff.innerHTML = `<i class="fa-solid fa-arrow-down"></i> -${100 - state.kpis.cost}%`;
    costDiff.className = "kpi-diff down";
  }

  // 5. NPS Posventa
  const npsEl = document.getElementById('kpi-nps');
  const npsProgress = document.getElementById('progress-nps');
  const npsDiff = document.getElementById('kpi-nps-diff');
  
  npsEl.innerText = `+${state.kpis.nps}`;
  npsProgress.style.width = `${state.kpis.nps}%`;
  if (state.kpis.nps > 45) {
    npsDiff.innerHTML = `<i class="fa-solid fa-plus"></i> +${state.kpis.nps - 45}`;
    npsDiff.className = "kpi-diff up";
  }
}

// =============================================================
// GESTIÓN DE BASE DE DATOS TRANSACCIONAL SIMULADA
// =============================================================

// Registrar una nueva orden en la base de datos
function registerOrder(channel, client, items, total, status = "Facturado", idPrefix = "ORD") {
  const orderId = `${idPrefix}-${Math.floor(10500 + Math.random() * 9000)}`;
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  // Agregar al inicio del arreglo
  state.orders.unshift({
    id: orderId,
    time: `Hoy ${timeStr}`,
    channel: channel,
    client: client,
    items: items,
    total: total,
    status: status,
    isNew: true // Flag para activar la animación de resalte
  });

  // Guardar en localStorage
  localStorage.setItem('baufest_sim_orders', JSON.stringify(state.orders));

  renderOrdersTable();
  addTrace('ejecuta', 'Base de Datos (ERP)', `Registro ID ${orderId} escrito en la Base de Datos transaccional.`);
}

// Renderizar la tabla de órdenes
function renderOrdersTable() {
  const body = document.getElementById('db-orders-body');
  const counter = document.getElementById('db-counter');
  if (!body) return;

  body.innerHTML = '';
  counter.innerText = `${state.orders.length} Registros`;

  state.orders.forEach(order => {
    const tr = document.createElement('tr');
    tr.setAttribute('onclick', `showInvoiceDetails('${order.id}')`);
    if (order.isNew) {
      tr.className = 'new-row';
      order.isNew = false; // Resetear para futuros renders
    }
    
    // Configurar clase y contenido del estado de manera dinámica
    const isRefund = order.status === "Devuelto" || order.status === "Nota de Crédito";
    const statusClass = isRefund ? "status-refund" : "status-ok";
    const statusIcon = isRefund ? "fa-rotate-left" : "fa-check";
    
    // Configurar color y formato del total
    const isNegative = order.total < 0;
    const totalColor = isNegative ? "var(--warning)" : "var(--success)";
    const totalStr = isNegative ? `-$${Math.abs(order.total).toFixed(2)}` : `$${order.total.toFixed(2)}`;
    
    tr.innerHTML = `
      <td style="font-family: var(--font-mono); font-weight: 600;">${order.id}</td>
      <td>${order.time}</td>
      <td><span class="db-badge ${order.channel.toLowerCase()}">${order.channel}</span></td>
      <td><strong>${order.client}</strong></td>
      <td style="font-size: 0.8rem; color: var(--text-secondary);">${order.items}</td>
      <td style="font-weight: 600; color: ${totalColor};">${totalStr}</td>
      <td><span class="db-badge ${statusClass}"><i class="fa-solid fa-${statusIcon}"></i> ${order.status}</span></td>
    `;
    body.appendChild(tr);
  });
}

// Restablecer la base de datos simulada a los valores predeterminados
function resetSimulatedDatabase() {
  if (confirm("¿Estás seguro de que deseas limpiar la base de datos simulada y restablecer los registros de ejemplo?")) {
    state.orders = [...DEFAULT_ORDERS];
    localStorage.setItem('baufest_sim_orders', JSON.stringify(state.orders));
    renderOrdersTable();
    addTrace('alerta', 'Base de Datos (ERP)', 'Base de datos transaccional restablecida a valores predeterminados.');
  }
}

// Mostrar detalles de Factura Electrónica (estilo AFIP)
function showInvoiceDetails(orderId) {
  const order = state.orders.find(o => o.id === orderId);
  if (!order) return;

  const isRefund = order.status === "Devuelto" || order.status === "Nota de Crédito" || order.total < 0;
  
  // Decidir tipo de documento
  const invoiceType = order.channel === 'B2B' ? 'A' : 'B';
  const docTitle = isRefund ? `NOTA DE CRÉDITO "${invoiceType}"` : `FACTURA ELECTRÓNICA "${invoiceType}"`;
  const accentColor = isRefund ? 'var(--warning)' : 'var(--accent-cyan)';
  
  // Calcular Neto y 21% de IVA
  // En Argentina, la factura B o A tiene el IVA desglosado (total = neto * 1.21 => neto = total / 1.21, IVA = total - neto)
  const totalAbs = Math.abs(order.total);
  const subtotal = totalAbs / 1.21;
  const vat = totalAbs - subtotal;

  // Correo del receptor
  let clientEmail = order.client;
  let clientName = order.client;
  if (order.channel === 'B2B') {
    const clientKey = Object.keys(window.Catalog.b2bClients).find(key => {
      const c = window.Catalog.b2bClients[key];
      return c.name === order.client || order.client.includes(c.name) || c.name.includes(order.client);
    });
    if (clientKey) {
      clientName = window.Catalog.b2bClients[clientKey].name;
      const emails = {
        "CLI-GLOBAL-TECH": "billing@globaltech.com",
        "CLI-PAPYRUS-INC": "compras@papyrus.com",
        "CLI-STARTUP-NEX": "finanzas@nexus.com"
      };
      clientEmail = emails[clientKey];
    } else {
      clientEmail = "administracion@empresa.com";
    }
  }

  // CAE Vencimiento (10 días después de hoy)
  const today = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  const expirationDate = new Date(today);
  expirationDate.setDate(today.getDate() + 10);
  const caeVencimiento = `${pad(expirationDate.getDate())}/${pad(expirationDate.getMonth() + 1)}/${expirationDate.getFullYear()}`;

  const bodyEl = document.getElementById('invoice-modal-body');
  if (bodyEl) {
    bodyEl.innerHTML = `
      <div class="afip-invoice">
        <!-- Top header -->
        <div style="display: flex; justify-content: space-between; border-bottom: 2px solid var(--border-color); padding-bottom: 0.75rem; margin-bottom: 0.75rem;">
          <div>
            <div style="font-size: 1.2rem; font-weight: 800; color: #fff;"><i class="fa-solid fa-robot" style="color: var(--accent-cyan); font-size: 1rem;"></i> baufest</div>
            <div style="font-size: 0.7rem; color: var(--text-secondary);">Baufest Argentina S.A.</div>
            <div style="font-size: 0.7rem; color: var(--text-secondary);">Av. del Libertador 6350, CABA</div>
            <div style="font-size: 0.7rem; color: var(--text-secondary);">CUIT: 30-70809012-9</div>
          </div>
          <div style="border: 2px solid ${accentColor}; width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; font-weight: 900; color: ${accentColor}; border-radius: 4px; background: rgba(255,255,255,0.02);">
            ${invoiceType}
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 700; color: ${accentColor}; font-size: 0.85rem; letter-spacing: 0.5px;">${docTitle}</div>
            <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.2rem;">${order.id}</div>
            <div style="font-size: 0.7rem; color: var(--text-secondary); margin-top: 0.2rem;">Fecha: ${order.time}</div>
          </div>
        </div>

        <!-- Client info -->
        <div style="background: rgba(255, 255, 255, 0.01); border: 1px solid var(--border-color); padding: 0.6rem 0.8rem; border-radius: 8px; margin-bottom: 0.75rem;">
          <div style="font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">Receptor / Cliente</div>
          <div style="font-weight: 600; font-size: 0.85rem; color: #fff; margin-top: 0.15rem;">${clientName}</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.1rem;">Email: ${clientEmail}</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary);">Condición IVA: ${order.channel === 'B2B' ? 'Responsable Inscripto' : 'Consumidor Final'}</div>
        </div>

        <!-- Items list -->
        <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem; margin-bottom: 1rem;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border-color);">
              <th style="text-align: left; padding: 0.4rem 0; color: var(--text-secondary); font-weight: 500;">Concepto / Producto</th>
              <th style="text-align: right; padding: 0.4rem 0; color: var(--text-secondary); font-weight: 500;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px dashed rgba(255, 255, 255, 0.05);">
              <td style="padding: 0.5rem 0; color: #cbd5e1;">${order.items}</td>
              <td style="text-align: right; padding: 0.5rem 0; font-family: var(--font-mono); color: #cbd5e1;">${isRefund ? '-' : ''}$${subtotal.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <!-- Calculation totals -->
        <div style="border-top: 1px solid var(--border-color); padding-top: 0.5rem; display: flex; flex-direction: column; gap: 0.3rem; align-items: flex-end; font-size: 0.8rem;">
          <div style="display: flex; justify-content: space-between; width: 100%; max-width: 240px; color: var(--text-secondary);">
            <span>Neto Gravado (Excl. IVA):</span>
            <span style="font-family: var(--font-mono);">${isRefund ? '-' : ''}$${subtotal.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; width: 100%; max-width: 240px; color: var(--text-secondary);">
            <span>Alícuota IVA (21.00%):</span>
            <span style="font-family: var(--font-mono);">${isRefund ? '-' : ''}$${vat.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; width: 100%; max-width: 240px; font-weight: 700; font-size: 0.95rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 0.3rem; color: ${accentColor};">
            <span>Total Facturado:</span>
            <span style="font-family: var(--font-mono);">${isRefund ? '-' : ''}$${totalAbs.toFixed(2)}</span>
          </div>
        </div>

        <!-- CAE certification footer -->
        <div style="margin-top: 1.25rem; border-top: 1px solid var(--border-color); padding-top: 0.5rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.7rem; color: var(--text-muted); font-family: var(--font-mono);">
          <div>CAE Nº: 76192837482938</div>
          <div>Vto. CAE: ${caeVencimiento}</div>
        </div>
      </div>
    `;
  }

  // Mostrar el modal
  const modalEl = document.getElementById('invoice-modal');
  if (modalEl) {
    modalEl.style.display = 'flex';
  }
  
  addTrace('consulta', 'Factura Electrónica', `Recuperada Factura / Nota de Crédito para ${order.id}. CAE verificado con AFIP.`);
}

function closeInvoiceModal() {
  const modalEl = document.getElementById('invoice-modal');
  if (modalEl) {
    modalEl.style.display = 'none';
  }
}

function printInvoiceSim() {
  alert("Simulando impresión de la Factura Electrónica en PDF...");
}
