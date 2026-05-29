// Servidor Express local para conectar el simulador de Baufest 2026 con MySQL
// Ejecutar con: npm start (después de correr 'npm install')

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const STOP_WORDS = new Set([
  'de', 'la', 'que', 'el', 'en', 'y', 'a', 'los', 'un', 'una', 'unos', 'unas', 
  'con', 'para', 'este', 'esta', 'como', 'o', 'u', 'del', 'al', 'por', 'sus', 
  'tus', 'mis', 'su', 'tu', 'mi', 'deben', 'tienen', 'tiene', 'tengo', 'hay', 
  'es', 'son', 'las', 'cual', 'cuales'
]);

function cleanText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?\!¡,\.;:\(\)\[\]"]/g, " ")
    .trim();
}

const CATEGORY_KEYWORDS = {
  'Zapatillas': ['zapatilla', 'zapatillas', 'calzado', 'calzados', 'zapato', 'zapatos', 'tenis', 'gym', 'gimnasio'],
  'Indumentaria': ['campera', 'camperas', 'remera', 'remeras', 'calza', 'calzas', 'leggings', 'ropa', 'abrigo', 'abrigos', 'indumentaria', 'vestir'],
  'Accesorios': ['reloj', 'relojes', 'smartband', 'band', 'auricular', 'auriculares', 'audifono', 'audifonos', 'tecnologia', 'smartwatch'],
  'Equipamiento': ['mochila', 'mochilas', 'termo', 'termos', 'botella', 'botellas', 'bolsa de dormir', 'sleeping', 'saco de dormir', 'sacos de dormir', 'equipamiento', 'camping', 'outdoor']
};

// Configuración de la conexión a tu MySQL local
// Modifica los campos 'user' y 'password' según la configuración de tu motor MySQL local.
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'ecommerce', // coloca tu password de mysql aquí
  database: 'baufest_agent',
  port: 3306
});

db.connect((err) => {
  if (err) {
    console.error('❌ Error al conectar a la base de datos MySQL:', err.message);
    console.log('👉 Asegúrate de tener instalado MySQL, haber corrido el script schema.sql,');
    console.log('   y que el servicio local de MySQL esté en ejecución.');
  } else {
    console.log('✅ Conectado exitosamente a la base de datos MySQL [baufest_agent]');
  }
});

// 1. Endpoint para buscar productos B2C de manera dinámica
app.get('/api/b2c/products', (req, res) => {
  const query = req.query.q ? req.query.q.trim().toLowerCase() : '';
  const maxPrice = req.query.max_price ? parseFloat(req.query.max_price) : null;

  // Caso 1: Obtener todos los productos (sin búsqueda ni presupuesto)
  if (!query && maxPrice === null) {
    db.query('SELECT * FROM b2c_products', (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      const products = results.map(p => formatB2CProduct(p));
      return res.json({ products });
    });
    return;
  }

  // Caso 2: Filtrado puramente por presupuesto
  if (!query && maxPrice !== null) {
    db.query('SELECT * FROM b2c_products WHERE price <= ?', [maxPrice], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      const products = results.map(p => formatB2CProduct(p));
      return res.json({ products });
    });
    return;
  }

  // Caso 3: Búsqueda dinámica con relevancia y tags
  const cleanedQuery = cleanText(query);
  const words = cleanedQuery.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));

  // Si después de limpiar no quedan palabras, retornar todo
  if (words.length === 0) {
    db.query('SELECT * FROM b2c_products', (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      const products = results.map(p => formatB2CProduct(p));
      return res.json({ products });
    });
    return;
  }

  db.query('SELECT * FROM b2c_products', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    db.query('SELECT * FROM b2c_product_tags', (err, tagResults) => {
      if (err) return res.status(500).json({ error: err.message });

      // Agrupar tags por product_id
      const tagsMap = {};
      tagResults.forEach(row => {
        if (!tagsMap[row.product_id]) tagsMap[row.product_id] = [];
        tagsMap[row.product_id].push(row.tag);
      });

      let productsWithScore = results.map(p => {
        let product = formatB2CProduct(p);
        product.tags = tagsMap[p.id] || [];

        let score = 0;
        const cleanCategory = cleanText(product.category);

        words.forEach(word => {
          // 1. Coincidencia de Categoría
          if (cleanCategory === word) {
            score += 8;
          } else if (cleanCategory.includes(word) || word.includes(cleanCategory)) {
            score += 4;
          }

          // 2. Coincidencia de Tags
          if (product.tags) {
            product.tags.forEach(tag => {
              const cleanTag = cleanText(tag);
              if (cleanTag === word) {
                score += 5;
              } else if (cleanTag.includes(word) || word.includes(cleanTag)) {
                score += 3;
              }
            });
          }

          // 3. Coincidencia de Nombre (por palabras individuales del nombre)
          const cleanName = cleanText(product.name);
          const nameWords = cleanName.split(/\s+/).filter(w => w.length > 2);
          nameWords.forEach(nw => {
            if (nw === word) {
              score += 4;
            } else if (nw.includes(word) || word.includes(nw)) {
              score += 2;
            }
          });

          // 4. Coincidencia de Descripción
          const cleanDesc = cleanText(product.description);
          if (cleanDesc.includes(word)) {
            score += 1;
          }
        });

        return { product, score };
      });

      // Filtrar aquellos productos que tengan al menos una coincidencia (score > 0)
      let filtered = productsWithScore.filter(item => item.score > 0);

      // Filtrar por categoría explícitamente solicitada
      const requestedCategories = [];
      for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.some(keyword => cleanedQuery.includes(keyword))) {
          requestedCategories.push(category);
        }
      }
      if (requestedCategories.length === 1) {
        filtered = filtered.filter(item => item.product.category === requestedCategories[0]);
      }

      // Aplicar filtro de presupuesto
      if (maxPrice !== null) {
        filtered = filtered.filter(item => item.product.price <= maxPrice);
      }

      // Ordenar por relevancia descendente
      filtered.sort((a, b) => b.score - a.score);

      // Enviar resultados
      res.json({ products: filtered.map(item => item.product) });
    });
  });
});

// 2. Endpoint para obtener catálogo B2B
app.get('/api/b2b/products', (req, res) => {
  db.query('SELECT * FROM b2b_products', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const products = results.map(p => {
      const specs = {};
      if (p.procesador) specs.procesador = p.procesador;
      if (p.memoria) specs.memoria = p.memoria;
      if (p.almacenamiento) specs.almacenamiento = p.almacenamiento;
      if (p.garantia) specs.garantia = p.garantia;
      if (p.resolucion) specs.resolucion = p.resolucion;
      if (p.tasa_refresco) specs.tasa_refresco = p.tasa_refresco;
      if (p.entradas) specs.entradas = p.entradas;
      if (p.redundancia) specs.redundancia = p.redundancia;

      return {
        id: p.id,
        name: p.name,
        category: p.category,
        listPrice: parseFloat(p.list_price),
        cost: parseFloat(p.cost),
        stock: p.stock,
        minOrderQty: p.min_order_qty,
        description: p.description,
        specs: specs
      };
    });
    
    res.json({ products });
  });
});

// 3. Endpoint para obtener clientes corporativos (CRM)
app.get('/api/b2b/clients', (req, res) => {
  db.query('SELECT * FROM b2b_clients', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const clients = {};
    results.forEach(c => {
      clients[c.client_key] = {
        name: c.name,
        tier: c.tier,
        maxAutoDiscount: parseFloat(c.max_auto_discount),
        contractTerm: c.contract_term,
        paymentTerms: c.payment_terms
      };
    });
    
    res.json({ clients });
  });
});

// Helper para convertir base de datos plana a estructura con objeto specs anidado
function formatB2CProduct(p) {
  const specs = {};
  if (p.peso) specs.peso = p.peso;
  if (p.drop_val) specs.drop = p.drop_val;
  if (p.terreno) specs.terreno = p.terreno;
  if (p.amortiguacion) specs.amortiguacion = p.amortiguacion;
  if (p.bateria) specs.bateria = p.bateria;
  if (p.resistencia) specs.resistencia = p.resistencia;
  if (p.pantalla) specs.pantalla = p.pantalla;
  if (p.capacidad) specs.capacidad = p.capacidad;
  if (p.material) specs.material = p.material;
  if (p.uso) specs.uso = p.uso;
  if (p.suela) specs.suela = p.suela;
  if (p.impermeabilidad) specs.impermeabilidad = p.impermeabilidad;
  if (p.bolsillos) specs.bolsillos = p.bolsillos;
  if (p.tecnologia) specs.tecnologia = p.tecnologia;
  if (p.corte) specs.corte = p.corte;
  if (p.proteccion_uv) specs.proteccion_uv = p.proteccion_uv;
  if (p.autonomia) specs.autonomia = p.autonomia;
  if (p.conexion) specs.conexion = p.conexion;
  if (p.resistencia_agua) specs.resistencia = p.resistencia_agua;
  if (p.drivers) specs.drivers = p.drivers;
  if (p.rango_temp) specs.rango_temp = p.rango_temp;
  if (p.forma) specs.forma = p.forma;
  if (p.relleno) specs.relleno = p.relleno;
  if (p.compresion) specs.compresion = p.compresion;
  if (p.cintura) specs.cintura = p.cintura;
  if (p.aislacion) specs.aislacion = p.aislacion;
  if (p.tapa) specs.tapa = p.tapa;

  return {
    id: p.id,
    name: p.name,
    category: p.category,
    price: parseFloat(p.price),
    stock: p.stock,
    description: p.description,
    specs: specs
  };
}

// Iniciar servidor local
app.listen(PORT, () => {
  console.log(`=====================================================================`);
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
  console.log(`👉 Búsqueda B2C: http://localhost:${PORT}/api/b2c/products?q=zapatilla`);
  console.log(`👉 Productos B2B: http://localhost:${PORT}/api/b2b/products`);
  console.log(`👉 Clientes B2B: http://localhost:${PORT}/api/b2b/clients`);
  console.log(`=====================================================================`);
});
