// CM INDUSTRIAL · ProGest v3.0 — Data Store & Business Logic
const STORAGE_KEY = "cm_progest_v3";

// SHA-256 password hash using browser Web Crypto API
async function sha256(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// Initial default database structure
function freshDB() {
  return {
    version: "3.0",
    settings: {
      companyName: "CM Industrial SpA",
      currency: "USD",
      currencySymbol: "$",
      trafficLight: {
        alertGapPercent: 10,   // gap between planned and real
        criticalGapPercent: 20,
        budgetWarningPercent: 85
      }
    },
    users: [
      {
        id: "usr-1",
        name: "Carlos Morales",
        email: "admin@cmindustrial.cl",
        role: "admin", // admin, supervisor, operador, lectura
        passHash: "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918", // 'admin'
        avatar: "CM",
        createdAt: "2026-01-15"
      },
      {
        id: "usr-2",
        name: "Valeria Soto",
        email: "vsoto@cmindustrial.cl",
        role: "supervisor",
        passHash: "04f8996da763b7a969b1028ee3007569eaf3a635486ddab211d512c85b9df8fb", // 'user'
        avatar: "VS",
        createdAt: "2026-02-01"
      },
      {
        id: "usr-3",
        name: "Rodrigo Araya",
        email: "raraya@cmindustrial.cl",
        role: "operador",
        passHash: "04f8996da763b7a969b1028ee3007569eaf3a635486ddab211d512c85b9df8fb",
        avatar: "RA",
        createdAt: "2026-02-10"
      },
      {
        id: "usr-4",
        name: "Auditor Cliente",
        email: "auditor@cliente.com",
        role: "lectura",
        passHash: "04f8996da763b7a969b1028ee3007569eaf3a635486ddab211d512c85b9df8fb",
        avatar: "AC",
        createdAt: "2026-02-15"
      }
    ],
    projects: [
      {
        id: "PRJ-001",
        name: "Montaje Piping Concentradora",
        client: "Minera El Teniente",
        location: "Rancagua, Región de O'Higgins",
        manager: "Carlos Morales",
        startDate: "2026-01-10",
        endDate: "2026-06-30",
        budget: 450000,
        spent: 312000,
        plannedProgress: 70,
        realProgress: 68,
        status: "En Ejecución",
        description: "Reemplazo de líneas de relaves y spooling en sector molienda SAG."
      },
      {
        id: "PRJ-002",
        name: "Mantención Mayor Caldera N°2",
        client: "Planta Celulosa Arauco",
        location: "Nueva Aldea, Ñuble",
        manager: "Valeria Soto",
        startDate: "2026-02-01",
        endDate: "2026-04-15",
        budget: 280000,
        spent: 245000,
        plannedProgress: 85,
        realProgress: 60,
        status: "En Ejecución",
        description: "Retubado de sobrecalentador y cambio de refractarios de alta alúmina."
      },
      {
        id: "PRJ-003",
        name: "Automatización Subestación 66kV",
        client: "Refinería Biobío",
        location: "Hualpén, Biobío",
        manager: "Carlos Morales",
        startDate: "2026-03-01",
        endDate: "2026-08-30",
        budget: 195000,
        spent: 42000,
        plannedProgress: 25,
        realProgress: 28,
        status: "En Ejecución",
        description: "Instalación de celdas GIS y tableros de control con fibra óptica."
      },
      {
        id: "PRJ-004",
        name: "Fabricación Chute Traspaso 500 TPH",
        client: "Codelco Andina",
        location: "Los Andes, Valparaíso",
        manager: "Valeria Soto",
        startDate: "2026-01-15",
        endDate: "2026-03-10",
        budget: 120000,
        spent: 128500,
        plannedProgress: 100,
        realProgress: 94,
        status: "En Ejecución",
        description: "Estructura metálica pesada en acero ASTM A514 con revestimiento cerámico."
      },
      {
        id: "PRJ-005",
        name: "Reparación Puente Grúa 80T",
        client: "Puerto Coronel",
        location: "Coronel, Biobío",
        manager: "Carlos Morales",
        startDate: "2025-11-01",
        endDate: "2026-01-20",
        budget: 85000,
        spent: 81400,
        plannedProgress: 100,
        realProgress: 100,
        status: "Finalizado",
        description: "Revisión electromecánica de testers, reductor principal y cables de izaje."
      }
    ],
    expenses: [
      {
        id: "EXP-101",
        folio: "FAC-8842",
        projectId: "PRJ-001",
        category: "Materiales",
        amount: 84000,
        supplier: "Aceros AZA S.A.",
        date: "2026-02-12",
        status: "Aprobado",
        note: "Tubería ASTM A106 Gr B de 12 y 16 pulgadas con bridas ANSI 300."
      },
      {
        id: "EXP-102",
        folio: "BOL-3310",
        projectId: "PRJ-001",
        category: "Mano de Obra",
        amount: 128000,
        supplier: "Personal Especializado Soldadura",
        date: "2026-02-28",
        status: "Aprobado",
        note: "Nómina quincena febrero equipo soldadores 6G TIG/SMAW."
      },
      {
        id: "EXP-103",
        folio: "FAC-9102",
        projectId: "PRJ-002",
        category: "Equipos",
        amount: 45000,
        supplier: "Grúas y Maniobras del Sur",
        date: "2026-02-18",
        status: "Aprobado",
        note: "Arriendo camión pluma 50T por 15 días en faena Arauco."
      },
      {
        id: "EXP-104",
        folio: "FAC-9240",
        projectId: "PRJ-002",
        category: "Materiales",
        amount: 110000,
        supplier: "Refractarios del Pacífico",
        date: "2026-02-25",
        status: "Aprobado",
        note: "Ladrillos y hormigón refractario para bóveda caldera."
      },
      {
        id: "EXP-105",
        folio: "FAC-9401",
        projectId: "PRJ-003",
        category: "Subcontratos",
        amount: 32000,
        supplier: "Ingeniería en Automatización SCADA Ltda.",
        date: "2026-03-02",
        status: "Aprobado",
        note: "Programación PLC Allen-Bradley y pruebas FAT."
      },
      {
        id: "EXP-106",
        folio: "FAC-9550",
        projectId: "PRJ-004",
        category: "Materiales",
        amount: 68000,
        supplier: "Chapas Estructurales CAP",
        date: "2026-01-20",
        status: "Aprobado",
        note: "Planchas antidesgaste HARDOX 450 1/2 pulgada."
      }
    ],
    workers: [
      {
        id: "WRK-01",
        rut: "14.321.876-2",
        name: "Héctor Valenzuela",
        role: "Soldador Alta Presión 6G",
        projectId: "PRJ-001",
        status: "Activo",
        phone: "+56 9 8452 1199",
        certifications: "Calificación 6G ASME IX (Vigente), Trabajo en Altura",
        medExamExpiry: "2026-11-20"
      },
      {
        id: "WRK-02",
        rut: "16.890.412-K",
        name: "Mauricio Sanhueza",
        role: "Mecánico Montajista",
        projectId: "PRJ-001",
        status: "Activo",
        phone: "+56 9 7321 0045",
        certifications: "Rigger Calificado Nivel II, Espacios Confinados",
        medExamExpiry: "2026-08-15"
      },
      {
        id: "WRK-03",
        rut: "17.432.190-8",
        name: "Claudio Morales G.",
        role: "Técnico Eléctrico Instrumentista SEC",
        projectId: "PRJ-003",
        status: "Activo",
        phone: "+56 9 6554 9912",
        certifications: "Licencia Clase A SEC, Termografía Infrarroja Nivel 1",
        medExamExpiry: "2026-09-30"
      },
      {
        id: "WRK-04",
        rut: "15.112.980-3",
        name: "José Luis Riquelme",
        role: "Prevencionista de Riesgos (APR)",
        projectId: "PRJ-002",
        status: "Activo",
        phone: "+56 9 9110 3344",
        certifications: "Registro SNS Nº 45210, Auditor Interno ISO 45001",
        medExamExpiry: "2026-03-25" // vence pronto
      },
      {
        id: "WRK-05",
        rut: "18.234.567-1",
        name: "Patricio Díaz M.",
        role: "Operador de Grúa y Alzahombre",
        projectId: "PRJ-002",
        status: "Licencia",
        phone: "+56 9 5422 1890",
        certifications: "Licencia Clase D Municipal, Certificación Camión Pluma",
        medExamExpiry: "2026-02-10" // ya vencido
      }
    ],
    tools: [
      {
        id: "TLS-01",
        code: "SLD-004",
        name: "Soldadora Inverter Miller XMT 350",
        brand: "Miller Electric",
        projectId: "PRJ-001",
        status: "En Faena",
        lastMaintenance: "2025-12-10",
        nextMaintenance: "2026-06-10",
        serialNumber: "ML-350-9921",
        responsible: "Héctor Valenzuela"
      },
      {
        id: "TLS-02",
        code: "TRQ-002",
        name: "Torquímetro Digital 3/4 (100-600 Nm)",
        brand: "Norbar",
        projectId: "PRJ-001",
        status: "En Faena",
        lastMaintenance: "2025-09-15",
        nextMaintenance: "2026-03-15", // vence pronto!
        serialNumber: "NB-600-0814",
        responsible: "Mauricio Sanhueza"
      },
      {
        id: "TLS-03",
        code: "GEN-001",
        name: "Generador Diésel Insonorizado 60 kVA",
        brand: "Caterpillar Olympian",
        projectId: "PRJ-002",
        status: "En Faena",
        lastMaintenance: "2026-01-20",
        nextMaintenance: "2026-07-20",
        serialNumber: "CAT-OLY-60K-44",
        responsible: "José Luis Riquelme"
      },
      {
        id: "TLS-04",
        code: "ALZ-003",
        name: "Plataforma Tijera Eléctrica 12m JLG",
        brand: "JLG 3246ES",
        projectId: "Bodega Central",
        status: "En Mantenimiento",
        lastMaintenance: "2025-08-01",
        nextMaintenance: "2026-02-01", // vencido
        serialNumber: "JLG-12M-7712",
        responsible: "Bodega Central"
      },
      {
        id: "TLS-05",
        code: "MED-009",
        name: "Megóhmetro / Medidor Aislamiento 5kV",
        brand: "Megger MIT515",
        projectId: "PRJ-003",
        status: "En Faena",
        lastMaintenance: "2025-11-05",
        nextMaintenance: "2026-05-05",
        serialNumber: "MEG-515-3001",
        responsible: "Claudio Morales G."
      }
    ],
    documents: [
      {
        id: "DOC-01",
        code: "PTS-TEN-004",
        name: "Procedimiento de Trabajo Seguro: Maniobras de Izaje",
        projectId: "PRJ-001",
        type: "Seguridad / HSE",
        expiryDate: "2026-12-31",
        status: "Vigente"
      },
      {
        id: "DOC-02",
        code: "DOS-CAL-ARA-02",
        name: "Dossier de Calidad Retubado Caldera",
        projectId: "PRJ-002",
        type: "Calidad / QA",
        expiryDate: "2026-03-20", // próximo a vencer
        status: "Por Vencer"
      },
      {
        id: "DOC-03",
        code: "POL-SEG-CIV-26",
        name: "Póliza de Responsabilidad Civil Faenas Mineras",
        projectId: "General",
        type: "Legal / Seguros",
        expiryDate: "2026-02-28", // vencido
        status: "Vencido"
      },
      {
        id: "DOC-04",
        code: "IPER-REF-BIO-01",
        name: "Matriz IPER Subestación Eléctrica 66kV",
        projectId: "PRJ-003",
        type: "Seguridad / HSE",
        expiryDate: "2026-08-30",
        status: "Vigente"
      }
    ]
  };
}

// Storage management
let DB = null;

function loadDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      DB = JSON.parse(raw);
    } else {
      DB = freshDB();
      saveDB();
    }
  } catch (e) {
    console.error("Error loading DB from localStorage:", e);
    DB = freshDB();
  }
  return DB;
}

function saveDB() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DB));
  } catch (e) {
    console.error("Error saving DB to localStorage:", e);
  }
}

function resetDB() {
  DB = freshDB();
  saveDB();
}

// Smart traffic light calculation for projects
function getProjectHealth(project, settings) {
  const cfg = (settings && settings.trafficLight) || {
    alertGapPercent: 10,
    criticalGapPercent: 20,
    budgetWarningPercent: 85
  };

  const gap = (project.plannedProgress || 0) - (project.realProgress || 0);
  const budgetRatio = project.budget > 0 ? (project.spent / project.budget) * 100 : 0;
  
  const today = new Date();
  const end = new Date(project.endDate);
  const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));

  if (project.status === "Finalizado") {
    return { color: "green", text: "Finalizado", gap, diffDays, code: "OK" };
  }

  // Critical conditions
  if (gap > cfg.criticalGapPercent || budgetRatio > 100 || (diffDays < 0 && project.realProgress < 100)) {
    let reason = "Atraso crítico";
    if (budgetRatio > 100) reason = "Sobregiro presupuestario";
    if (diffDays < 0) reason = "Plazo vencido";
    return { color: "red", text: reason, gap, diffDays, code: "CRITICO" };
  }

  // Alert conditions
  if (gap > cfg.alertGapPercent || budgetRatio > cfg.budgetWarningPercent || (diffDays <= 15 && project.realProgress < 85)) {
    let reason = "Desfase moderado";
    if (budgetRatio > cfg.budgetWarningPercent) reason = "Presupuesto en límite";
    if (diffDays <= 15) reason = "Próximo a plazo";
    return { color: "yellow", text: reason, gap, diffDays, code: "ALERTA" };
  }

  return { color: "green", text: "En Plazo y Costo", gap, diffDays, code: "NORMAL" };
}

// Session state management
let currentSession = null;

function getSession() {
  if (currentSession) return currentSession;
  try {
    const raw = sessionStorage.getItem("cm_progest_session");
    if (raw) {
      currentSession = JSON.parse(raw);
    } else {
      // Default to first user (Admin) for seamless preview
      if (DB && DB.users && DB.users.length > 0) {
        currentSession = {
          user: DB.users[0],
          loginTime: new Date().toISOString()
        };
        sessionStorage.setItem("cm_progest_session", JSON.stringify(currentSession));
      }
    }
  } catch (e) {
    console.error("Session error:", e);
  }
  return currentSession;
}

function setSession(user) {
  currentSession = {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar || user.name.substring(0, 2).toUpperCase()
    },
    loginTime: new Date().toISOString()
  };
  sessionStorage.setItem("cm_progest_session", JSON.stringify(currentSession));
}

function logout() {
  currentSession = null;
  sessionStorage.removeItem("cm_progest_session");
}
