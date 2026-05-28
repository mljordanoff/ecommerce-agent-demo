// Catálogo y Reglas de Negocio Simuladas (Golden Dataset)

const Catalog = {
  // Productos B2C (Minoristas)
  b2cProducts: [
    {
      id: "RUN-001",
      name: "UltraBoost Nova 2026",
      category: "Zapatillas",
      price: 180.00,
      stock: 45,
      description: "Zapatillas de running premium con amortiguación Boost de alta densidad, ideales para asfalto.",
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
      specs: {
        peso: "310g",
        drop: "6mm",
        terreno: "Montaña/Tierra",
        amortiguacion: "Media-Alta"
      }
    },
    {
      id: "FIT-001",
      name: "SmartFit Band X",
      category: "Accesorios",
      price: 99.00,
      stock: 150,
      description: "Smartband con sensor de ritmo cardíaco continuo, GPS integrado y batería de 14 días.",
      specs: {
        bateria: "14 días",
        resistencia: "IP68 (50m)",
        pantalla: "AMOLED 1.62\""
      }
    },
    {
      id: "OUT-001",
      name: "Mochila Explorer 45L",
      category: "Equipamiento",
      price: 120.00,
      stock: 8,
      description: "Mochila de trekking ergonómica con cobertor de lluvia y soporte para bastones.",
      specs: {
        capacidad: "45 Litros",
        material: "Nylon Ripstop",
        peso: "1.2kg"
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
