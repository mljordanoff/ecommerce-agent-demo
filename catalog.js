// Catálogo y Reglas de Negocio Simuladas (Golden Dataset)

const Catalog = {
  b2cProducts: [
    {
      id: "RUN-001",
      name: "UltraBoost Nova 2026",
      category: "Zapatillas",
      price: 180.00,
      stock: 45,
      description: "Zapatillas de running premium con amortiguación Boost de alta densidad, ideales para asfalto.",
      tags: ["zapatilla", "zapatillas", "running", "correr", "calzado", "asfalto", "amortiguacion", "ciudad", "deporte"],
      specs: {
        peso: "280g",
        drop: "10mm",
        terreno: "Asfalto",
        amortiguacion: "Alta"
      }
    },
    {
      id: "RUN-002",
      name: "SpeedTrail Pro",
      category: "Zapatillas",
      price: 150.00,
      stock: 12,
      description: "Zapatillas de trail running con suela de alta tracción y protección impermeable.",
      tags: ["zapatilla", "zapatillas", "trail", "montaña", "correr", "calzado", "tierra", "barro", "impermeable", "deporte"],
      specs: {
        peso: "310g",
        drop: "6mm",
        terreno: "Montaña/Tierra",
        amortiguacion: "Media-Alta"
      }
    },
    {
      id: "FIT-002",
      name: "FlexTrainer Core",
      category: "Zapatillas",
      price: 85.00,
      stock: 60,
      description: "Calzado de entrenamiento funcional y gimnasio con suela plana para máxima estabilidad.",
      tags: ["zapatilla", "zapatillas", "entrenamiento", "gimnasio", "gym", "calzado", "estabilidad", "plana", "crossfit", "deporte"],
      specs: {
        peso: "250g",
        drop: "4mm",
        uso: "Gimnasio / Funcional",
        suela: "Goma Grip de Alta Tracción"
      }
    },
    {
      id: "APP-001",
      name: "Campera WindBreaker Shield",
      category: "Indumentaria",
      price: 95.00,
      stock: 35,
      description: "Campera rompevientos ultraliviana, repelente al agua y térmica para entrenar en climas fríos o lluvia.",
      tags: ["campera", "abrigo", "rompevientos", "lluvia", "impermeable", "frio", "indumentaria", "ropa", "correr", "trekking"],
      specs: {
        material: "Poliéster Ripstop 100%",
        impermeabilidad: "DWR Coating",
        bolsillos: "3 con cierre reflectivo",
        peso: "180g"
      }
    },
    {
      id: "APP-002",
      name: "DryFit Active Tee",
      category: "Indumentaria",
      price: 30.00,
      stock: 200,
      description: "Remera deportiva técnica con tecnología de secado rápido y paneles de ventilación lateral.",
      tags: ["remera", "remeras", "tecnica", "dryfit", "ropa", "indumentaria", "ventilacion", "secado rapido", "entrenamiento"],
      specs: {
        material: "Microfibra de Poliéster",
        tecnologia: "Dri-FIT Respirable",
        corte: "Athletic Fit",
        proteccion_uv: "UPF 40+"
      }
    },
    {
      id: "APP-003",
      name: "Leggings PowerStretch",
      category: "Indumentaria",
      price: 45.00,
      stock: 90,
      description: "Calzas deportivas de compresión media con cintura alta y bolsillo lateral porta celular.",
      tags: ["calza", "calzas", "leggings", "compresion", "indumentaria", "ropa", "gimnasio", "fitness", "yoga"],
      specs: {
        material: "80% Nylon, 20% Elastano",
        compresion: "Media-Alta",
        cintura: "Alta Antipinchaduras",
        bolsillos: "1 Lateral elástico"
      }
    },
    {
      id: "FIT-001",
      name: "SmartFit Band X",
      category: "Accesorios",
      price: 99.00,
      stock: 150,
      description: "Smartband con sensor de ritmo cardíaco continuo, GPS integrado y batería de 14 días.",
      tags: ["reloj", "smartband", "pulsera", "band", "accesorios", "gps", "ritmo", "corazon", "bateria", "tecnologia"],
      specs: {
        bateria: "14 días",
        resistencia: "IP68 (50m)",
        pantalla: "AMOLED 1.62\""
      }
    },
    {
      id: "TEC-001",
      name: "Auriculares AeroBuds Sport",
      category: "Accesorios",
      price: 120.00,
      stock: 80,
      description: "Auriculares inalámbricos deportivos con ganchos de sujeción ergonómicos y cancelación activa de ruido.",
      tags: ["auriculares", "audifonos", "musica", "bluetooth", "inalambricos", "cancelacion", "ruido", "accesorios", "tecnologia", "deporte"],
      specs: {
        autonomia: "8 horas (32h con estuche)",
        conexion: "Bluetooth 5.3",
        resistencia: "IPX7 al sudor/agua",
        drivers: "10mm dinámicos"
      }
    },
    {
      id: "OUT-001",
      name: "Mochila Explorer 45L",
      category: "Equipamiento",
      price: 120.00,
      stock: 8,
      description: "Mochila de trekking ergonómica con cobertor de lluvia y soporte para bastones.",
      tags: ["mochila", "mochilas", "trekking", "montaña", "viaje", "equipamiento", "bolso", "camping", "explorer"],
      specs: {
        capacidad: "45 Litros",
        material: "Nylon Ripstop",
        peso: "1.2kg"
      }
    },
    {
      id: "OUT-002",
      name: "Botella ThermoFlask Elite 1L",
      category: "Equipamiento",
      price: 35.00,
      stock: 110,
      description: "Botella térmica de acero inoxidable de doble pared. Mantiene bebidas frías por 24 horas y calientes por 12 horas.",
      tags: ["termo", "botella", "termica", "bebida", "agua", "frio", "calor", "acero", "equipamiento", "camping", "outdoor"],
      specs: {
        capacidad: "1 Litro",
        material: "Acero Inoxidable 18/8",
        aislacion: "Doble pared al vacío",
        tapa: "A prueba de fugas"
      }
    },
    {
      id: "OUT-003",
      name: "Bolsa PolarCamp Sleeping Bag",
      category: "Equipamiento",
      price: 110.00,
      stock: 25,
      description: "Bolsa de dormir térmica tipo sarcófago para temperaturas extremas de hasta -5°C, ultracompacta.",
      tags: ["bolsa de dormir", "bolsa dormir", "sleeping", "saco dormir", "camping", "frio", "montaña", "equipamiento", "outdoor"],
      specs: {
        rango_temp: "-5°C a 10°C",
        forma: "Sarcófago ergonómico",
        relleno: "Fibra sintética 3D",
        peso: "1.4kg"
      }
    }
  ],

  // Productos B2B (Mayoristas)
  b2bProducts: [
    {
      id: "B2B-LAP-01",
      name: "ThinkWork Pro v6",
      category: "Notebooks Corporativas",
      listPrice: 1200.00, // Precio de lista por unidad
      cost: 850.00,        // Costo interno (para validar márgenes)
      stock: 450,
      minOrderQty: 10,     // Pedido mínimo B2B
      description: "Notebook empresarial con procesador Intel i7, 16GB RAM, 512GB SSD y seguridad TPM 2.0.",
      specs: {
        procesador: "Intel Core i7 13va Gen",
        memoria: "16GB LPDDR5",
        almacenamiento: "512GB NVMe SSD",
        garantia: "3 años On-Site"
      }
    },
    {
      id: "B2B-MON-02",
      name: "FlexMonitor IPS 24\"",
      category: "Monitores",
      listPrice: 180.00,
      cost: 120.00,
      stock: 1200,
      minOrderQty: 15,
      description: "Monitor de oficina Full HD IPS con base regulable en altura y certificación anti-parpadeo.",
      specs: {
        resolucion: "1920x1080 (FHD)",
        tasa_refresco: "75Hz",
        entradas: "HDMI, DisplayPort, VGA"
      }
    },
    {
      id: "B2B-SRV-03",
      name: "Baufest CloudBox S1",
      category: "Servidores Edge",
      listPrice: 4500.00,
      cost: 3200.00,
      stock: 35,
      minOrderQty: 2,
      description: "Servidor híbrido para oficinas satélite con soporte Kubernetes local y almacenamiento en RAID.",
      specs: {
        procesador: "Dual AMD EPYC 16-Core",
        memoria: "128GB ECC RAM",
        almacenamiento: "4TB SSD RAID-5",
        redundancia: "Fuente doble hot-swap"
      }
    }
  ],

  // Clientes Corporativos B2B Registrados
  b2bClients: {
    "CLI-GLOBAL-TECH": {
      name: "Global Tech Solutions",
      tier: "GOLD",
      maxAutoDiscount: 0.15, // Permite al agente negociar hasta el 15% automáticamente
      contractTerm: "Anual v2026",
      paymentTerms: "Net 30"
    },
    "CLI-PAPYRUS-INC": {
      name: "Papyrus Industrias",
      tier: "SILVER",
      maxAutoDiscount: 0.08, // Permite al agente negociar hasta el 8% automáticamente
      contractTerm: "Estándar",
      paymentTerms: "Net 15"
    },
    "CLI-STARTUP-NEX": {
      name: "Nexus Innovación S.A.S.",
      tier: "BRONZE",
      maxAutoDiscount: 0.04, // Permite al agente negociar hasta el 4% automáticamente
      contractTerm: "Sin Contrato",
      paymentTerms: "Pago Inmediato"
    }
  },

  // Reglas de Margen Globales
  rules: {
    absoluteMinMargin: 0.15, // Ninguna venta puede dejar menos del 15% de margen (PrecioVenta > Costo * 1.15)
    humanApprovalRequiredMessage: "El descuento solicitado supera los límites de autonomía del agente. Se ha escalado la cotización a tu Ejecutivo de Cuentas."
  }
};

// Exportar si se usa en ambiente Node, o exponer globalmente en navegador
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Catalog;
} else {
  window.Catalog = Catalog;
}
