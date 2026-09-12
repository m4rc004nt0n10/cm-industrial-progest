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
        id: "usr-marco",
        name: "Marco Antonio",
        email: "marco@aiep.cl",
        role: "Desarrollador",
        avatar: "MA",
        createdAt: "2026-09-10"
      },
      {
        id: "usr-medali",
        name: "Medali",
        email: "medali@aiep.cl",
        role: "Desarrollador",
        avatar: "ME",
        createdAt: "2026-09-10"
      },
      {
        id: "usr-adita",
        name: "Adita",
        email: "adita@aiep.cl",
        role: "Desarrollador",
        avatar: "AD",
        createdAt: "2026-09-10"
      },
      {
        id: "usr-ricardo",
        name: "Ricardo",
        email: "ricardo@aiep.cl",
        role: "Desarrollador",
        avatar: "RI",
        createdAt: "2026-09-10"
      }
    ],
    projects: [],
    expenses: [],
    workers: [],
    overtime: [],
    tools: [],
    documents: [],
    quotations: [
      {
        id: "COT-001",
        code: "COT-2026-001",
        title: "AGRICOLA VAL VALLE - PROYECTO SECADORA DE NUECES",
        client: "Agrícola Val Valle",
        executionTime: "4 Meses (Por confirmar fechas)",
        months: 4,
        status: "Enviada", // "Borrador", "Enviada", "Aprobada", "Rechazada", "Convertida"
        createdAt: "2026-09-10",
        validUntil: "2026-10-10",
        notes: "Fabricación, plegado de acero 3mm, pintura anticorrosiva, motores y montaje en terreno para secadora de nueces.",
        laborItems: [
          { role: "Operarios", count: 2, taxableMonthly: 2025000, fonasa: 70875, afp: 121500, liquidMonthly: 820125 },
          { role: "Ayudantes", count: 2, taxableMonthly: 1730000, fonasa: 60550, afp: 103800, liquidMonthly: 700650 },
          { role: "Bono Supervisión", count: 1, taxableMonthly: 247000, fonasa: 17290, afp: 29640, liquidMonthly: 200070 }
        ],
        laborMonthlySubtotal: 4002000,
        laborTotal: 16008000,
        fieldItems: [
          { name: "Ropa y EE.PP.", qty: 3, unitPrice: 70000, total: 210000 },
          { name: "Colaciones (22 días x 5 personas)", qty: 210, unitPrice: 7000, total: 1470000 },
          { name: "Fletes ida y vuelta", qty: 11, unitPrice: 430000, total: 4730000 },
          { name: "Traslado (Bencina)", qty: 22, unitPrice: 15000, total: 330000 }
        ],
        materialItems: [
          { name: "Máquina de soldar, cilindro y carga", qty: 1, unitPrice: 2000000, total: 2000000 },
          { name: "Gas máquina soldar", qty: 10, unitPrice: 100000, total: 1000000 },
          { name: "Alambre máquina de soldar", qty: 6, unitPrice: 40000, total: 240000 },
          { name: "Pintura anticorrosivo (galones) diluyente", qty: 50, unitPrice: 80000, total: 4000000 },
          { name: "Planchas de acero plegado (3mm)", qty: 1, unitPrice: 29205000, total: 29205000 },
          { name: "Perfiles estructurales", qty: 1, unitPrice: 2878000, total: 2878000 },
          { name: "Motores eléctricos", qty: 5, unitPrice: 700000, total: 3500000 },
          { name: "Correas y accesorios", qty: 1, unitPrice: 5860000, total: 5860000 },
          { name: "Componentes varios", qty: 1, unitPrice: 3435000, total: 3435000 }
        ],
        expensesSubtotal: 58858000,
        costCenterSubtotal: 74866000,
        adminPercent: 2,
        adminTotal: 1497320,
        contingencyPercent: 5,
        contingencyTotal: 3743300,
        adminSubtotal: 5240620,
        totalCostCenter: 80106620,
        profitPercent: 50,
        profitAmount: 40053310,
        totalNet: 120159930,
        discountPercent: 5,
        discountAmount: 6007997,
        totalNetNegotiated: 114151934
      },
      {
        id: "COT-002",
        code: "COT-2026-002",
        title: "MOLINO - INSTALACION DE ALIMENTADOR LLENADO DE SILOS",
        client: "Molino Industrial SpA",
        executionTime: "4 Meses",
        months: 4,
        status: "Aprobada",
        createdAt: "2026-09-08",
        validUntil: "2026-10-08",
        notes: "Instalación de alimentador para llenado de silos. Incluye planchas de acero plegado 2mm, pintura sintética y montaje.",
        laborItems: [
          { role: "Operarios", count: 2, taxableMonthly: 2025000, fonasa: 70875, afp: 121500, liquidMonthly: 820125 },
          { role: "Ayudantes", count: 2, taxableMonthly: 1730000, fonasa: 60550, afp: 103800, liquidMonthly: 700650 },
          { role: "Bono Supervisión", count: 1, taxableMonthly: 247000, fonasa: 17290, afp: 29640, liquidMonthly: 200070 }
        ],
        laborMonthlySubtotal: 4002000,
        laborTotal: 16008000,
        fieldItems: [
          { name: "Ropa y EE.PP.", qty: 3, unitPrice: 70000, total: 210000 },
          { name: "Colaciones (22 días x 5 personas)", qty: 210, unitPrice: 7000, total: 1470000 },
          { name: "Fletes ida y vuelta", qty: 11, unitPrice: 430000, total: 4730000 },
          { name: "Traslado (Bencina)", qty: 22, unitPrice: 15000, total: 330000 }
        ],
        materialItems: [
          { name: "Máquina de soldar, cilindro y carga", qty: 1, unitPrice: 2000000, total: 2000000 },
          { name: "Gas máquina soldar", qty: 10, unitPrice: 100000, total: 1000000 },
          { name: "Alambre máquina de soldar", qty: 6, unitPrice: 40000, total: 240000 },
          { name: "Pintura sintética (galones) diluyente", qty: 50, unitPrice: 48000, total: 2400000 },
          { name: "Planchas de acero plegado (2mm)", qty: 1, unitPrice: 19617000, total: 19617000 },
          { name: "Perfiles estructurales", qty: 1, unitPrice: 2878000, total: 2878000 },
          { name: "Motores eléctricos", qty: 5, unitPrice: 700000, total: 3500000 },
          { name: "Correas y accesorios", qty: 1, unitPrice: 5860000, total: 5860000 },
          { name: "Componentes varios", qty: 1, unitPrice: 3435000, total: 3435000 }
        ],
        expensesSubtotal: 47460000,
        costCenterSubtotal: 63468000,
        adminPercent: 2,
        adminTotal: 1269360,
        contingencyPercent: 5,
        contingencyTotal: 3173400,
        adminSubtotal: 4442760,
        totalCostCenter: 67910760,
        profitPercent: 50,
        profitAmount: 33955380,
        totalNet: 101866140,
        discountPercent: 5,
        discountAmount: 5093307,
        totalNetNegotiated: 96772833
      }
    ]
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

// Cloud synchronization state (Firebase Firestore)
let cloudSyncStatus = "connecting";
let isRemoteUpdate = false;
let cloudSyncDebounceTimer = null;
let cloudSyncInitialized = false;

function updateCloudStatusBadge(status, text) {
  cloudSyncStatus = status;
  const badge = document.getElementById("cloud-sync-status-badge");
  if (!badge) return;
  if (status === "synced") {
    badge.className = "badge badge-green";
    badge.innerHTML = `<i class="fa-solid fa-cloud-check"></i> ${text || "Nube Conectada"}`;
    badge.title = "Base de datos en la nube (Firestore) sincronizada en tiempo real para todos los usuarios y dispositivos";
  } else if (status === "syncing") {
    badge.className = "badge badge-blue";
    badge.innerHTML = `<i class="fa-solid fa-rotate fa-spin"></i> ${text || "Sincronizando..."}`;
  } else if (status === "offline") {
    badge.className = "badge badge-gray";
    badge.innerHTML = `<i class="fa-solid fa-hard-drive"></i> ${text || "Memoria Local"}`;
    badge.title = "Modo local: los cambios se guardan en este dispositivo y se subirán cuando haya conexión";
  } else {
    badge.className = "badge badge-yellow";
    badge.innerHTML = `<i class="fa-solid fa-cloud"></i> ${text || "Nube"}`;
  }
}

// Push local state to Firestore
function pushToCloud() {
  if (isRemoteUpdate) return;
  if (!window.firebaseDb) {
    updateCloudStatusBadge("offline", "Memoria Local");
    return;
  }
  
  updateCloudStatusBadge("syncing", "Guardando...");
  
  if (cloudSyncDebounceTimer) clearTimeout(cloudSyncDebounceTimer);
  cloudSyncDebounceTimer = setTimeout(() => {
    try {
      if (!DB) return;
      const payload = {
        version: DB.version || "4.0",
        settings: DB.settings || defaultSeedData().settings,
        users: DB.users || defaultSeedData().users,
        projects: DB.projects || [],
        expenses: DB.expenses || [],
        workers: DB.workers || [],
        overtime: DB.overtime || [],
        tools: DB.tools || [],
        documents: DB.documents || [],
        quotations: DB.quotations || [],
        lastUpdated: new Date().toISOString()
      };
      
      // Sync consolidated workspace
      window.firebaseDb.collection("cm_workspace").doc("global_data")
        .set(payload)
        .then(() => {
          updateCloudStatusBadge("synced", "Nube Conectada");
        })
        .catch(err => {
          console.warn("Firestore save warning:", err);
          updateCloudStatusBadge("offline", "Memoria Local");
        });

      // Also sync individual user documents into the 'users' collection for clear visibility in Firebase Console
      if (Array.isArray(DB.users)) {
        DB.users.forEach(u => {
          if (u && u.email) {
            const userDocId = u.email.replace(/[^a-zA-Z0-9_-]/g, "_");
            window.firebaseDb.collection("users").doc(userDocId).set({
              id: u.id || "usr-" + Date.now(),
              name: u.name || "",
              email: u.email,
              role: u.role || "Usuario",
              avatar: u.avatar || "US",
              createdAt: u.createdAt || new Date().toISOString().split("T")[0],
              lastUpdated: new Date().toISOString()
            }, { merge: true }).catch(uErr => console.log("User doc sync note:", uErr));
          }
        });
      }
    } catch (e) {
      console.warn("Cloud push exception:", e);
      updateCloudStatusBadge("offline", "Memoria Local");
    }
  }, 250);
}

// Listen to Firestore real-time changes
let activeFirestoreUnsubscribe = null;

function initCloudSync(force = false) {
  if (cloudSyncInitialized && !force) return;
  
  if (!window.firebaseDb) {
    updateCloudStatusBadge("offline", "Memoria Local");
    setTimeout(() => {
      if (window.firebaseDb) {
        initCloudSync();
      }
    }, 1500);
    return;
  }

  if (activeFirestoreUnsubscribe) {
    try { activeFirestoreUnsubscribe(); } catch (e) {}
    activeFirestoreUnsubscribe = null;
  }

  cloudSyncInitialized = true;
  updateCloudStatusBadge("syncing", "Conectando...");

  try {
    const docRef = window.firebaseDb.collection("cm_workspace").doc("global_data");
    
    activeFirestoreUnsubscribe = docRef.onSnapshot(doc => {
      if (doc && doc.exists) {
        const remoteData = doc.data();
        if (remoteData) {
          isRemoteUpdate = true;
          DB = DB || defaultSeedData();
          DB.version = remoteData.version || DB.version || "4.0";
          DB.settings = remoteData.settings || DB.settings;
          if (Array.isArray(remoteData.users) && remoteData.users.length > 0) {
            DB.users = remoteData.users;
          }
          DB.projects = Array.isArray(remoteData.projects) ? remoteData.projects : [];
          DB.expenses = Array.isArray(remoteData.expenses) ? remoteData.expenses : [];
          DB.workers = Array.isArray(remoteData.workers) ? remoteData.workers : [];
          DB.overtime = Array.isArray(remoteData.overtime) ? remoteData.overtime : [];
          DB.tools = Array.isArray(remoteData.tools) ? remoteData.tools : [];
          DB.documents = Array.isArray(remoteData.documents) ? remoteData.documents : [];
          DB.quotations = Array.isArray(remoteData.quotations) ? remoteData.quotations : (DB.quotations || defaultSeedData().quotations || []);
          
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(DB));
          } catch (e) {}

          updateCloudStatusBadge("synced", "Nube Conectada");
          
          if (typeof renderCurrentView === "function") {
            const layout = document.getElementById("app-layout");
            if (layout && layout.style.display !== "none") {
              renderCurrentView();
            }
          }
          isRemoteUpdate = false;
        }
      } else {
        console.log("Inicializando espacio de trabajo en Firestore...");
        pushToCloud();
      }
    }, err => {
      if (err && err.code === "permission-denied") {
        updateCloudStatusBadge("offline", "Inicia sesión para sincronizar");
      } else {
        console.log("Nota de sincronización:", err.message || err);
        updateCloudStatusBadge("offline", "Memoria Local");
      }
    });
  } catch (e) {
    updateCloudStatusBadge("offline", "Memoria Local");
  }
}

// Auto-reconnect Firestore when user signs in with email/password
if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", () => {
    if (window.firebaseAuth) {
      window.firebaseAuth.onAuthStateChanged(user => {
        if (user) {
          console.log("Usuario autenticado en Firebase:", user.email || user.uid);
          initCloudSync(true);
        }
      });
    }
  });
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
      DB.quotations = DB.quotations || defaultSeedData().quotations || [];
    } else {
      DB = defaultSeedData();
      saveDB();
    }
  } catch (e) {
    console.error("Error loading DB from localStorage:", e);
    DB = defaultSeedData();
    saveDB();
  }

  // Initialize Firestore real-time cloud listener
  initCloudSync();

  return DB;
}

function saveDB() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DB));
  } catch (e) {
    console.error("Error saving DB to localStorage:", e);
  }
  pushToCloud();
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
