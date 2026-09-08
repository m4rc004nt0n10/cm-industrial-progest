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
    projects: [],
    expenses: [],
    workers: [],
    tools: [],
    documents: []
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
