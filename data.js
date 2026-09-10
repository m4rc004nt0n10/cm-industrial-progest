// CM INDUSTRIAL — Data Store & Business Logic
const STORAGE_KEY = "cm_progest_v4";

// Clean dataset for real operational use (0 mock records)
function defaultSeedData() {
  return {
    version: "4.0",
    settings: {
      companyName: "CM Industrial",
      currency: "CLP",
      currencySymbol: "$",
      trafficLight: {
        alertGapPercent: 10,   // gap between planned and real
        criticalGapPercent: 20,
        budgetWarningPercent: 85
      }
    },
    // App users. Roles: "Desarrollador" (edición y administración total), "Usuario" (solo consulta)
    users: [
      {
        id: "usr-dev",
        name: "Desarrollador CM",
        email: "desarrollador@cmindustrial.cl",
        role: "Desarrollador",
        avatar: "DEV",
        createdAt: new Date().toISOString().split("T")[0]
      },
      {
        id: "usr-user",
        name: "Operador de Terreno",
        email: "usuario@cmindustrial.cl",
        role: "Usuario",
        avatar: "OP",
        createdAt: new Date().toISOString().split("T")[0]
      }
    ],
    projects: [],
    expenses: [],
    workers: [],
    overtime: [],
    tools: [],
    documents: []
  };
}

// Datos de demostración industrial (opcionales para pruebas)
function demoSeedData() {
  return {
    version: "4.0",
    settings: {
      companyName: "CM Industrial",
      currency: "CLP",
      currencySymbol: "$",
      trafficLight: {
        alertGapPercent: 10,
        criticalGapPercent: 20,
        budgetWarningPercent: 85
      }
    },
    users: [
      {
        id: "usr-dev",
        name: "Desarrollador CM",
        email: "desarrollador@cmindustrial.cl",
        role: "Desarrollador",
        avatar: "DEV",
        createdAt: "2026-01-10"
      },
      {
        id: "usr-user",
        name: "Operador de Terreno",
        email: "usuario@cmindustrial.cl",
        role: "Usuario",
        avatar: "OP",
        createdAt: "2026-01-15"
      }
    ],
    projects: [
      {
        id: "PRJ-001",
        name: "Montaje Electromecánico Subestación Ventanas",
        client: "Minera Andina SpA",
        location: "Quintero, V Región",
        manager: "Ing. Rodrigo Silva",
        budget: 450000000,
        spent: 310000000,
        plannedProgress: 75,
        realProgress: 72,
        startDate: "2026-01-15",
        endDate: "2026-11-30",
        status: "En Ejecución"
      },
      {
        id: "PRJ-002",
        name: "Mantenimiento Integral Planta Chancado",
        client: "Codelco División Norte",
        location: "Calama, II Región",
        manager: "Ing. Marcela Pardo",
        budget: 280000000,
        spent: 245000000,
        plannedProgress: 60,
        realProgress: 42,
        startDate: "2026-02-01",
        endDate: "2026-10-15",
        status: "En Ejecución"
      },
      {
        id: "PRJ-003",
        name: "Sistema de Impulsión de Agua Concentradora",
        client: "Antofagasta Minerals",
        location: "Sierra Gorda",
        manager: "Ing. Cristian Morales",
        budget: 620000000,
        spent: 180000000,
        plannedProgress: 35,
        realProgress: 36,
        startDate: "2026-04-01",
        endDate: "2026-12-20",
        status: "En Ejecución"
      }
    ],
    expenses: [
      {
        id: "EXP-101",
        folio: "F-4582",
        projectId: "PRJ-001",
        category: "Materiales",
        amount: 85000000,
        supplier: "Aceros Industriales del Pacífico",
        date: "2026-05-12",
        status: "Aprobado",
        note: "Vigas estructurales y pernos de alta resistencia"
      },
      {
        id: "EXP-102",
        folio: "F-4599",
        projectId: "PRJ-002",
        category: "Servicios",
        amount: 42000000,
        supplier: "Grúas & Montajes del Norte",
        date: "2026-06-05",
        status: "Aprobado",
        note: "Arriendo grúa telescópica 70T para tolva"
      },
      {
        id: "EXP-103",
        folio: "F-4610",
        projectId: "PRJ-003",
        category: "Equipamiento",
        amount: 54000000,
        supplier: "Bombas y Tuberías Mineras S.A.",
        date: "2026-06-20",
        status: "Aprobado",
        note: "Válvulas de retención y acoples victaulic"
      }
    ],
    workers: [
      {
        id: "WRK-001",
        rut: "15.420.890-K",
        name: "Carlos Morales",
        role: "Soldador Calificado 6G",
        projectId: "PRJ-001",
        phone: "+56 9 8451 2291",
        certifications: "ASME IX, Oxicorte, Altura",
        medExamExpiry: "2026-12-30",
        workSchedule: "40 hrs/semana (Turno 5x2)",
        hourlyRate: 14500,
        hoursWorked: 160,
        overtimeHours: 21.5,
        status: "Activo en Obra"
      },
      {
        id: "WRK-002",
        rut: "16.890.123-4",
        name: "Matías Alarcón",
        role: "Técnico Electricista SEC",
        projectId: "PRJ-001",
        phone: "+56 9 7312 9044",
        certifications: "Licencia Clase A SEC, Espacios Confinados",
        medExamExpiry: "2026-10-15",
        workSchedule: "Turno 7x7 (Faena Minera 12 hrs/día)",
        hourlyRate: 13000,
        hoursWorked: 168,
        overtimeHours: 15.0,
        status: "Activo en Obra"
      },
      {
        id: "WRK-003",
        rut: "14.230.981-2",
        name: "Hernán Sepúlveda",
        role: "Rigger / Maniobrista",
        projectId: "PRJ-002",
        phone: "+56 9 6621 0032",
        certifications: "Rigger Alta Tensión Certificado",
        medExamExpiry: "2026-08-01",
        workSchedule: "40 hrs/semana (Turno 5x2)",
        hourlyRate: 11500,
        hoursWorked: 152,
        overtimeHours: 12.5,
        status: "Disponible (En Base)"
      },
      {
        id: "WRK-004",
        rut: "17.654.321-8",
        name: "Rodrigo Fuentes",
        role: "Mecánico Montajista",
        projectId: "PRJ-003",
        phone: "+56 9 5543 8812",
        certifications: "Torque Controlado, Trabajo en Caliente",
        medExamExpiry: "2026-11-20",
        workSchedule: "Turno 4x3 (Jornada 10 hrs/día)",
        hourlyRate: 12000,
        hoursWorked: 160,
        overtimeHours: 18.0,
        status: "Activo en Obra"
      }
    ],
    overtime: [
      {
        id: "OVT-101",
        workerId: "WRK-001",
        projectId: "PRJ-001",
        date: "2026-08-28",
        workSchedule: "40 hrs/semana (Turno 5x2)",
        regularHours: 8,
        overtimeHours: 3.5,
        hourlyRate: 14500,
        overtimeRate: 21750,
        overtimeTotal: 76125,
        totalDayPay: 192125,
        reason: "Soldadura urgente de tubería de relave fuera de turno",
        supervisor: "Ing. Residente",
        status: "Aprobado"
      },
      {
        id: "OVT-102",
        workerId: "WRK-001",
        projectId: "PRJ-001",
        date: "2026-09-02",
        workSchedule: "40 hrs/semana (Turno 5x2)",
        regularHours: 8,
        overtimeHours: 4.0,
        hourlyRate: 14500,
        overtimeRate: 21750,
        overtimeTotal: 87000,
        totalDayPay: 203000,
        reason: "Prueba hidrostática y pase de raíz en spool principal",
        supervisor: "Ing. Residente",
        status: "Aprobado"
      }
    ],
    tools: [
      {
        id: "TLS-001",
        code: "GEN-01",
        name: "Generador Diésel Insonorizado 150 kVA",
        brand: "Cummins Power",
        serialNumber: "CP-88421",
        projectId: "PRJ-001",
        responsible: "Carlos Morales",
        nextMaintenance: "2026-09-30",
        lastMaintenance: "2026-06-01",
        status: "En Faena",
        photo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" width="240" height="180"><rect width="240" height="180" fill="%230f172a"/><rect x="25" y="35" width="190" height="110" rx="8" fill="%231e293b" stroke="%23f97316" stroke-width="2"/><rect x="35" y="45" width="80" height="90" rx="4" fill="%23334155"/><line x1="45" y1="55" x2="105" y2="55" stroke="%2394a3b8" stroke-width="3"/><line x1="45" y1="65" x2="105" y2="65" stroke="%2394a3b8" stroke-width="3"/><line x1="45" y1="75" x2="105" y2="75" stroke="%2394a3b8" stroke-width="3"/><line x1="45" y1="85" x2="105" y2="85" stroke="%2394a3b8" stroke-width="3"/><rect x="130" y="45" width="75" height="50" rx="4" fill="%230f172a" stroke="%2338bdf8" stroke-width="1.5"/><circle cx="150" cy="70" r="10" fill="%2322c55e"/><circle cx="180" cy="70" r="10" fill="%23ef4444"/><rect x="130" y="105" width="75" height="30" rx="3" fill="%23334155"/><text x="120" y="165" font-family="Arial" font-size="11" fill="%23f97316" font-weight="bold" text-anchor="middle">GEN-01: Cummins 150 kVA</text></svg>'
      }
    ],
    documents: [
      {
        id: "DOC-001",
        code: "PTS-MEC-01",
        name: "Procedimiento de Trabajo Seguro - Montaje Estructuras",
        type: "Seguridad / Prevención",
        projectId: "PRJ-001",
        date: "2026-06-10",
        expiryDate: "2026-12-31",
        status: "Vigente",
        amount: 0,
        supplier: "Depto. HSE & Prevención",
        fileName: "PTS-MEC-01_Seguridad.pdf",
        fileType: "pdf"
      }
    ]
  };
}

function freshDB() {
  return defaultSeedData();
}

// Storage management
let DB = null;

function loadDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      DB = JSON.parse(raw);
      // Ensure essential arrays and settings exist without overwriting empty user collections
      if (!DB.users || DB.users.length === 0) {
        DB.users = defaultSeedData().users;
      }
      if (!DB.settings) {
        DB.settings = defaultSeedData().settings;
      }
      DB.projects = DB.projects || [];
      DB.expenses = DB.expenses || [];
      DB.workers = DB.workers || [];
      DB.tools = DB.tools || [];
      DB.documents = DB.documents || [];
      DB.overtime = DB.overtime || [];
    } else {
      DB = defaultSeedData();
      saveDB();
    }
  } catch (e) {
    console.error("Error loading DB from localStorage:", e);
    DB = defaultSeedData();
    saveDB();
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
  DB = defaultSeedData();
  saveDB();
}

function loadDemoData() {
  DB = demoSeedData();
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
    if (raw) currentSession = JSON.parse(raw);
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

// RBAC Permissions Helpers
function isDeveloper() {
  const s = getSession();
  if (!s || !s.user) return false;
  const r = (s.user.role || "").trim().toLowerCase();
  return r === "desarrollador" || r === "administrador";
}

function isReadOnlyUser() {
  return !isDeveloper();
}

function getUserRole() {
  const s = getSession();
  return (s && s.user && s.user.role) || "Usuario";
}
