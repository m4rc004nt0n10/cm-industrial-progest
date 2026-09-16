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
        plannedProgress: 100,
        realProgress: 78,
        startDate: "2026-02-01",
        endDate: "2026-08-30",
        status: "Vencido"
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
      },
      {
        id: "PRJ-004",
        name: "Fabricación & Montaje Secadora de Nueces",
        client: "Agrícola Val Valle",
        location: "San Felipe, V Región",
        manager: "Ing. Marco Antonio",
        budget: 114151934,
        spent: 0,
        plannedProgress: 0,
        realProgress: 0,
        startDate: "2026-10-15",
        endDate: "2027-02-28",
        status: "Planificación"
      },
      {
        id: "PRJ-005",
        name: "Instalación de Alimentador Llenado de Silos",
        client: "Molino Industrial SpA",
        location: "Rancagua, VI Región",
        manager: "Ing. Rodrigo Silva",
        budget: 96772833,
        spent: 94800000,
        plannedProgress: 100,
        realProgress: 100,
        startDate: "2026-01-10",
        endDate: "2026-08-20",
        status: "Finalizado"
      },
      {
        id: "PRJ-006",
        name: "Overhaul de Puente Grúa & Estructuras Nave Piping",
        client: "Celulosa Arauco",
        location: "Constitución, VII Región",
        manager: "Ing. Marcela Pardo",
        budget: 175000000,
        spent: 58000000,
        plannedProgress: 50,
        realProgress: 48,
        startDate: "2026-06-01",
        endDate: "2026-11-15",
        status: "En Ejecución"
      },
      {
        id: "PRJ-007",
        name: "Montaje Línea de Transmisión 110kV",
        client: "Transelec",
        location: "Copiapó, III Región",
        manager: "Ing. Rodrigo Silva",
        budget: 320000000,
        spent: 0,
        plannedProgress: 0,
        realProgress: 0,
        startDate: "2026-11-01",
        endDate: "2027-05-30",
        status: "Planificación"
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
      },
      {
        id: "EXP-104",
        folio: "F-4635",
        projectId: "PRJ-004",
        category: "Materiales",
        amount: 29205000,
        supplier: "Maestranza & Aceros Plegados Chile",
        date: "2026-07-15",
        status: "Aprobado",
        note: "Planchas de acero plegado 3mm para tolva y ductos"
      },
      {
        id: "EXP-105",
        folio: "F-4652",
        projectId: "PRJ-005",
        category: "Equipamiento",
        amount: 35000000,
        supplier: "Motores & Reductores del Valle",
        date: "2026-08-01",
        status: "Aprobado",
        note: "Motorreductores y correas de transmisión reforzadas"
      },
      {
        id: "EXP-106",
        folio: "F-4670",
        projectId: "PRJ-001",
        category: "Mano de Obra",
        amount: 38500000,
        supplier: "Nómina Especialistas Soldadura",
        date: "2026-08-20",
        status: "Aprobado",
        note: "Turnos soldadores calificados 6G montaje subestación"
      },
      {
        id: "EXP-107",
        folio: "F-4688",
        projectId: "PRJ-002",
        category: "Transporte",
        amount: 14200000,
        supplier: "Transportes Faena Norte SpA",
        date: "2026-09-02",
        status: "Aprobado",
        note: "Fletes de carga sobredimensionada y escolta vial"
      },
      {
        id: "EXP-108",
        folio: "F-4701",
        projectId: "PRJ-001",
        category: "Materiales",
        amount: 4850000,
        supplier: "3M Industrial Chile",
        date: "2026-09-05",
        status: "Aprobado",
        note: "Trajes de cuero, caretas fotosensibles y arneses dieléctricos"
      },
      {
        id: "EXP-109",
        folio: "F-4712",
        projectId: "PRJ-003",
        category: "Servicios",
        amount: 6200000,
        supplier: "CESMEC Bureau Veritas",
        date: "2026-09-08",
        status: "Aprobado",
        note: "Radiografía industrial y tintas penetrantes en uniones de impulsión"
      },
      {
        id: "EXP-110",
        folio: "F-4720",
        projectId: "PRJ-002",
        category: "Equipamiento",
        amount: 8900000,
        supplier: "Copec Combustibles Faena",
        date: "2026-09-10",
        status: "Aprobado",
        note: "Petróleo diésel para generadores y compresores auxiliares"
      },
      {
        id: "EXP-111",
        folio: "F-4735",
        projectId: "PRJ-001",
        category: "Materiales",
        amount: 7600000,
        supplier: "Sherwin Williams Protective",
        date: "2026-09-11",
        status: "Aprobado",
        note: "Pintura epóxica marina anticorrosiva de alto espesor"
      },
      {
        id: "EXP-112",
        folio: "F-4740",
        projectId: "PRJ-005",
        category: "Servicios",
        amount: 11400000,
        supplier: "Maestranza Rancagua",
        date: "2026-09-12",
        status: "Aprobado",
        note: "Mecanizado de poleas y tambores de tracción de alimentador"
      },
      {
        id: "EXP-113",
        folio: "F-4752",
        projectId: "PRJ-002",
        category: "Materiales",
        amount: 3800000,
        supplier: "Wurth Chile",
        date: "2026-09-13",
        status: "Aprobado",
        note: "Pernos de torque calibrados Grado 8.8 y arandelas biseladas"
      },
      {
        id: "EXP-114",
        folio: "F-4760",
        projectId: "PRJ-006",
        category: "Materiales",
        amount: 9500000,
        supplier: "Prodalam Industrial",
        date: "2026-09-14",
        status: "Aprobado",
        note: "Cables de acero galvanizado para izaje y carros de traslación"
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
        email: "carlos.morales@cmindustrial.cl",
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
        email: "matias.alarcon@cmindustrial.cl",
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
        email: "hernan.sepulveda@cmindustrial.cl",
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
        email: "rodrigo.fuentes@cmindustrial.cl",
        certifications: "Torque Controlado, Trabajo en Caliente",
        medExamExpiry: "2026-11-20",
        workSchedule: "Turno 4x3 (Jornada 10 hrs/día)",
        hourlyRate: 12000,
        hoursWorked: 160,
        overtimeHours: 18.0,
        status: "Activo en Obra"
      },
      {
        id: "WRK-005",
        rut: "18.321.456-9",
        name: "Jorge Valenzuela",
        role: "Operario Armador Estructural",
        projectId: "PRJ-004",
        phone: "+56 9 4432 1198",
        email: "jorge.valenzuela@cmindustrial.cl",
        certifications: "Plegado de Acero, Esmeril Angular",
        medExamExpiry: "2026-12-15",
        workSchedule: "40 hrs/semana (Turno 5x2)",
        hourlyRate: 11000,
        hoursWorked: 160,
        overtimeHours: 8.0,
        status: "Activo en Obra"
      },
      {
        id: "WRK-006",
        rut: "13.780.455-1",
        name: "Luis Navarro",
        role: "Supervisor de Montaje & HSE",
        projectId: "PRJ-002",
        phone: "+56 9 3321 7765",
        email: "luis.navarro@cmindustrial.cl",
        certifications: "Prevención SERNAGEOMIN B, Auditor ISO 45001",
        medExamExpiry: "2026-12-28",
        workSchedule: "Turno 7x7 (Faena Minera 12 hrs/día)",
        hourlyRate: 18000,
        hoursWorked: 168,
        overtimeHours: 14.5,
        status: "Activo en Obra"
      },
      {
        id: "WRK-007",
        rut: "16.234.901-7",
        name: "Esteban Carrasco",
        role: "Técnico Instrumentista",
        projectId: "PRJ-003",
        phone: "+56 9 2211 4433",
        email: "esteban.carrasco@cmindustrial.cl",
        certifications: "Calibración Hart / Fieldbus, Lazos 4-20mA",
        medExamExpiry: "2026-10-30",
        workSchedule: "40 hrs/semana (Turno 5x2)",
        hourlyRate: 14000,
        hoursWorked: 160,
        overtimeHours: 10.0,
        status: "Activo en Obra"
      },
      {
        id: "WRK-008",
        rut: "15.891.220-3",
        name: "Pedro Salinas",
        role: "Maestro Calderero Piping",
        projectId: "PRJ-006",
        phone: "+56 9 9988 1234",
        email: "pedro.salinas@cmindustrial.cl",
        certifications: "Spools ASME B31.3, TIG Inox, Puente Grúa",
        medExamExpiry: "2026-11-15",
        workSchedule: "Turno 4x3 (Jornada 10 hrs/día)",
        hourlyRate: 13500,
        hoursWorked: 160,
        overtimeHours: 16.0,
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
      },
      {
        id: "OVT-103",
        workerId: "WRK-004",
        projectId: "PRJ-003",
        date: "2026-09-08",
        workSchedule: "Turno 4x3 (Jornada 10 hrs/día)",
        regularHours: 10,
        overtimeHours: 3.0,
        hourlyRate: 12000,
        overtimeRate: 18000,
        overtimeTotal: 54000,
        totalDayPay: 174000,
        reason: "Alineación láser de bomba centrífuga de impulsión",
        supervisor: "Ing. Cristian Morales",
        status: "Aprobado"
      },
      {
        id: "OVT-104",
        workerId: "WRK-002",
        projectId: "PRJ-001",
        date: "2026-09-09",
        workSchedule: "Turno 7x7 (Faena Minera 12 hrs/día)",
        regularHours: 12,
        overtimeHours: 4.5,
        hourlyRate: 13000,
        overtimeRate: 19500,
        overtimeTotal: 87750,
        totalDayPay: 243750,
        reason: "Cableado y comisionamiento de tablero de fuerza nocturno",
        supervisor: "Ing. Rodrigo Silva",
        status: "Aprobado"
      },
      {
        id: "OVT-105",
        workerId: "WRK-003",
        projectId: "PRJ-002",
        date: "2026-09-11",
        workSchedule: "40 hrs/semana (Turno 5x2)",
        regularHours: 8,
        overtimeHours: 5.0,
        hourlyRate: 11500,
        overtimeRate: 17250,
        overtimeTotal: 86250,
        totalDayPay: 178250,
        reason: "Maniobra de izaje crítico de tolva primaria 45T",
        supervisor: "Ing. Marcela Pardo",
        status: "Aprobado"
      },
      {
        id: "OVT-106",
        workerId: "WRK-006",
        projectId: "PRJ-002",
        date: "2026-09-12",
        workSchedule: "Turno 7x7 (Faena Minera 12 hrs/día)",
        regularHours: 12,
        overtimeHours: 2.5,
        hourlyRate: 18000,
        overtimeRate: 27000,
        overtimeTotal: 67500,
        totalDayPay: 283500,
        reason: "Inspección de seguridad y liberación de trabajo en caliente",
        supervisor: "Ing. Marcela Pardo",
        status: "Aprobado"
      },
      {
        id: "OVT-107",
        workerId: "WRK-008",
        projectId: "PRJ-006",
        date: "2026-09-14",
        workSchedule: "Turno 4x3 (Jornada 10 hrs/día)",
        regularHours: 10,
        overtimeHours: 3.5,
        hourlyRate: 13500,
        overtimeRate: 20250,
        overtimeTotal: 70875,
        totalDayPay: 205875,
        reason: "Armado y biselado de spools de alta presión en nave",
        supervisor: "Ing. Marcela Pardo",
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
      },
      {
        id: "TLS-002",
        code: "SOL-04",
        name: "Máquina Soldadora Multiproceso MIG/TIG 400A",
        brand: "Miller Electric",
        serialNumber: "ML-54910",
        projectId: "PRJ-001",
        responsible: "Carlos Morales",
        nextMaintenance: "2026-11-15",
        lastMaintenance: "2026-07-10",
        status: "En Faena",
        photo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" width="240" height="180"><rect width="240" height="180" fill="%230f172a"/><rect x="40" y="40" width="160" height="100" rx="6" fill="%231e293b" stroke="%2338bdf8" stroke-width="2"/><circle cx="85" cy="90" r="22" fill="%230f172a" stroke="%23f97316" stroke-width="2"/><circle cx="155" cy="90" r="18" fill="%230f172a"/><text x="120" y="165" font-family="Arial" font-size="11" fill="%2338bdf8" font-weight="bold" text-anchor="middle">SOL-04: Miller MIG/TIG 400A</text></svg>'
      },
      {
        id: "TLS-003",
        code: "ALN-02",
        name: "Alineador Láser de Ejes y Poleas",
        brand: "Easy-Laser XT440",
        serialNumber: "EL-33290",
        projectId: "PRJ-003",
        responsible: "Rodrigo Fuentes",
        nextMaintenance: "2026-10-05",
        lastMaintenance: "2026-04-12",
        status: "En Faena",
        photo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" width="240" height="180"><rect width="240" height="180" fill="%230f172a"/><rect x="50" y="45" width="140" height="90" rx="8" fill="%231e293b" stroke="%2310b981" stroke-width="2"/><line x1="60" y1="90" x2="180" y2="90" stroke="%23ef4444" stroke-dasharray="4" stroke-width="2"/><circle cx="120" cy="90" r="12" fill="%2310b981" opacity="0.3"/><text x="120" y="165" font-family="Arial" font-size="11" fill="%2310b981" font-weight="bold" text-anchor="middle">ALN-02: Easy-Laser XT440</text></svg>'
      },
      {
        id: "TLS-004",
        code: "CMP-01",
        name: "Compresor de Aire Portátil 185 CFM",
        brand: "Atlas Copco",
        serialNumber: "AC-99214",
        projectId: "PRJ-002",
        responsible: "Hernán Sepúlveda",
        nextMaintenance: "2026-09-15",
        lastMaintenance: "2026-05-20",
        status: "En Mantenimiento",
        photo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" width="240" height="180"><rect width="240" height="180" fill="%230f172a"/><rect x="35" y="45" width="170" height="90" rx="6" fill="%231e293b" stroke="%23f59e0b" stroke-width="2"/><circle cx="75" cy="135" r="14" fill="%23475569"/><circle cx="165" cy="135" r="14" fill="%23475569"/><text x="120" y="165" font-family="Arial" font-size="11" fill="%23f59e0b" font-weight="bold" text-anchor="middle">CMP-01: Atlas Copco 185 CFM</text></svg>'
      },
      {
        id: "TLS-005",
        code: "TRQ-03",
        name: "Torquímetro Hidráulico de Bajo Perfil 10.000 Nm",
        brand: "Hytorc Stealth",
        serialNumber: "HY-10482",
        projectId: "PRJ-002",
        responsible: "Rodrigo Fuentes",
        nextMaintenance: "2026-10-20",
        lastMaintenance: "2026-05-15",
        status: "En Faena",
        photo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" width="240" height="180"><rect width="240" height="180" fill="%230f172a"/><rect x="35" y="55" width="170" height="70" rx="8" fill="%231e293b" stroke="%2338bdf8" stroke-width="2"/><circle cx="75" cy="90" r="20" fill="%230f172a" stroke="%2338bdf8" stroke-width="2"/><rect x="110" y="75" width="80" height="30" rx="4" fill="%23334155"/><text x="120" y="165" font-family="Arial" font-size="11" fill="%2338bdf8" font-weight="bold" text-anchor="middle">TRQ-03: Hytorc Stealth 10k</text></svg>'
      },
      {
        id: "TLS-006",
        code: "CAM-02",
        name: "Camión Pluma 15T con Capacho Aislado",
        brand: "Mercedes-Benz / Fassi",
        serialNumber: "MB-77301",
        projectId: "PRJ-006",
        responsible: "Luis Navarro",
        nextMaintenance: "2026-11-01",
        lastMaintenance: "2026-07-25",
        status: "En Faena",
        photo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" width="240" height="180"><rect width="240" height="180" fill="%230f172a"/><rect x="30" y="70" width="130" height="60" rx="4" fill="%231e293b" stroke="%23f97316" stroke-width="2"/><rect x="130" y="50" width="50" height="80" rx="4" fill="%23334155"/><line x1="50" y1="70" x2="110" y2="30" stroke="%23f97316" stroke-width="4"/><circle cx="65" cy="130" r="14" fill="%23475569"/><circle cx="155" cy="130" r="14" fill="%23475569"/><text x="120" y="165" font-family="Arial" font-size="11" fill="%23f97316" font-weight="bold" text-anchor="middle">CAM-02: MB Actros Pluma 15T</text></svg>'
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
      },
      {
        id: "DOC-002",
        code: "CRT-SLD-6G",
        name: "Calificación de Procedimiento y Soldador ASME IX 6G",
        type: "Calidad / Certificación",
        projectId: "PRJ-001",
        date: "2026-01-20",
        expiryDate: "2026-12-30",
        status: "Vigente",
        amount: 0,
        supplier: "CESMEC / Bureau Veritas",
        fileName: "Certificado_ASME_IX_CarlosMorales.pdf",
        fileType: "pdf"
      },
      {
        id: "DOC-003",
        code: "POL-SEG-MIN",
        name: "Póliza de Responsabilidad Civil & Todo Riesgo Faena",
        type: "Legal / Seguros",
        projectId: "PRJ-002",
        date: "2026-02-01",
        expiryDate: "2026-09-20",
        status: "Por Vencer",
        amount: 4500000,
        supplier: "Seguros Generales BCI",
        fileName: "Poliza_RC_CodelcoNorte.pdf",
        fileType: "pdf"
      },
      {
        id: "DOC-004",
        code: "FAC-88421",
        name: "Factura Electrónica Compra Vigas Estructurales",
        type: "Factura / Compra",
        projectId: "PRJ-001",
        date: "2026-05-12",
        expiryDate: "2026-06-12",
        status: "Vigente",
        amount: 85000000,
        supplier: "Aceros Industriales del Pacífico",
        fileName: "Factura_F-4582_Aceros.pdf",
        fileType: "pdf"
      },
      {
        id: "DOC-005",
        code: "EDP-N03",
        name: "Estado de Pago N°3 Aprobado Subestación Ventanas",
        type: "Estado de Pago",
        projectId: "PRJ-001",
        date: "2026-08-30",
        expiryDate: "2026-09-30",
        status: "Vigente",
        amount: 95400000,
        supplier: "Minera Andina SpA",
        fileName: "EDP_03_Aprobado_MineraAndina.pdf",
        fileType: "pdf"
      },
      {
        id: "DOC-006",
        code: "PRO-HID-02",
        name: "Protocolo de Prueba Hidrostática Tuberías 800 PSI",
        type: "Calidad / Certificación",
        projectId: "PRJ-003",
        date: "2026-09-01",
        expiryDate: "2026-12-31",
        status: "Vigente",
        amount: 0,
        supplier: "Inspección Técnica ITO",
        fileName: "Protocolo_Hidrostatica_PRJ003.pdf",
        fileType: "pdf"
      },
      {
        id: "DOC-007",
        code: "INF-SERNAG",
        name: "Informe de Fiscalización SERNAGEOMIN Sin Observaciones",
        type: "Inspección Técnica",
        projectId: "PRJ-002",
        date: "2026-08-15",
        expiryDate: "2026-11-15",
        status: "Vigente",
        amount: 0,
        supplier: "SERNAGEOMIN Región de Antofagasta",
        fileName: "Acta_Fiscalizacion_SERNAGEOMIN.pdf",
        fileType: "pdf"
      }
    ],
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
      },
      {
        id: "COT-003",
        code: "COT-2026-003",
        title: "SUBESTACIÓN VENTANAS - MONTAJE ESTRUCTURAS & BANCO DE DUCTOS",
        client: "Minera Andina SpA",
        executionTime: "6 Meses",
        months: 6,
        status: "Convertida",
        createdAt: "2026-08-15",
        validUntil: "2026-09-15",
        notes: "Montaje electromecánico de soportes de alta tensión, bancos de ductos subterráneos y canalizaciones blindadas.",
        laborItems: [
          { role: "Maestro Mayor Estructuras", count: 2, taxableMonthly: 2350000, fonasa: 164500, afp: 282000, liquidMonthly: 1903500 },
          { role: "Soldador Calificado 6G ASME", count: 2, taxableMonthly: 2480000, fonasa: 173600, afp: 297600, liquidMonthly: 2008800 },
          { role: "Rigger Nivel 1 Certificado", count: 1, taxableMonthly: 1950000, fonasa: 136500, afp: 234000, liquidMonthly: 1579500 },
          { role: "Ayudantes Especializados", count: 3, taxableMonthly: 1550000, fonasa: 108500, afp: 186000, liquidMonthly: 1255500 }
        ],
        laborMonthlySubtotal: 11460000,
        laborTotal: 68760000,
        fieldItems: [
          { name: "EPP Especial Alta Tensión & Calzado Dieléctrico", qty: 8, unitPrice: 120000, total: 960000 },
          { name: "Alimentación & Viáticos Faena (132 días x 8 pers)", qty: 1056, unitPrice: 8500, total: 8976000 },
          { name: "Fletes y Transporte Grúas 70T", qty: 6, unitPrice: 1850000, total: 11100000 },
          { name: "Camioneta Escolta y Combustible", qty: 6, unitPrice: 950000, total: 5700000 }
        ],
        materialItems: [
          { name: "Perfiles HEB-300 y Ángulos L100 Galvanizados", qty: 1, unitPrice: 85000000, total: 85000000 },
          { name: "Pernos de Anclaje ASTM A325 & Graderío", qty: 1, unitPrice: 14500000, total: 14500000 },
          { name: "Bandejas Portacables Ranuradas C20", qty: 1, unitPrice: 22400000, total: 22400000 },
          { name: "Pintura Epóxica Marina Alto Espesor", qty: 80, unitPrice: 95000, total: 7600000 }
        ],
        expensesSubtotal: 156236000,
        costCenterSubtotal: 224996000,
        adminPercent: 3,
        adminTotal: 6749880,
        contingencyPercent: 5,
        contingencyTotal: 11249800,
        adminSubtotal: 17999680,
        totalCostCenter: 242995680,
        profitPercent: 45,
        profitAmount: 109348056,
        totalNet: 352343736,
        discountPercent: 0,
        discountAmount: 0,
        totalNetNegotiated: 352343736
      },
      {
        id: "COT-004",
        code: "COT-2026-004",
        title: "PLANTA CHANCADO - OVERHAUL DE TOLVA & REVESTIMIENTO ANTIABRASIVO",
        client: "Codelco División Norte",
        executionTime: "3 Meses",
        months: 3,
        status: "Borrador",
        createdAt: "2026-09-12",
        validUntil: "2026-10-12",
        notes: "Cambio de placas de desgaste Hardox 500 en tolva primaria, vigas de soporte y cambio de pernos de alto torque.",
        laborItems: [
          { role: "Técnico Calderero Especialista", count: 2, taxableMonthly: 2200000, fonasa: 154000, afp: 264000, liquidMonthly: 1782000 },
          { role: "Soldador Arco Sumergido", count: 2, taxableMonthly: 2150000, fonasa: 150500, afp: 258000, liquidMonthly: 1741500 },
          { role: "Ayudante de Terreno", count: 2, taxableMonthly: 1400000, fonasa: 98000, afp: 168000, liquidMonthly: 1134000 }
        ],
        laborMonthlySubtotal: 8500000,
        laborTotal: 25500000,
        fieldItems: [
          { name: "Inducción y Exámenes Ocupacionales Gran Altura", qty: 6, unitPrice: 180000, total: 1080000 },
          { name: "Alojamiento y Pensión Completa Calama", qty: 3, unitPrice: 3200000, total: 9600000 },
          { name: "Arriendo Grúa Horquilla & Manlift 16m", qty: 3, unitPrice: 2800000, total: 8400000 }
        ],
        materialItems: [
          { name: "Placas Antiabrasivas Hardox 500 (20mm)", qty: 1, unitPrice: 48600000, total: 48600000 },
          { name: "Soldadura E7018 & Alambre Tubulado", qty: 1, unitPrice: 6200000, total: 6200000 },
          { name: "Pernos Cabeza Avellanada Grado 8.8", qty: 1, unitPrice: 3800000, total: 3800000 }
        ],
        expensesSubtotal: 77680000,
        costCenterSubtotal: 103180000,
        adminPercent: 2,
        adminTotal: 2063600,
        contingencyPercent: 5,
        contingencyTotal: 5159000,
        adminSubtotal: 7222600,
        totalCostCenter: 110402600,
        profitPercent: 50,
        profitAmount: 55201300,
        totalNet: 165603900,
        discountPercent: 3,
        discountAmount: 4968117,
        totalNetNegotiated: 160635783
      }
    ]
  };
}

// Datos de demostración industrial (opcionales para pruebas)
function demoSeedData() {
  return JSON.parse(JSON.stringify(defaultSeedData()));
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
          const seed = defaultSeedData();
          DB.projects = Array.isArray(remoteData.projects) && remoteData.projects.length > 0 ? remoteData.projects : (DB.projects && DB.projects.length > 0 ? DB.projects : seed.projects);
          DB.expenses = Array.isArray(remoteData.expenses) && remoteData.expenses.length > 0 ? remoteData.expenses : (DB.expenses && DB.expenses.length > 0 ? DB.expenses : seed.expenses);
          DB.workers = Array.isArray(remoteData.workers) && remoteData.workers.length > 0 ? remoteData.workers : (DB.workers && DB.workers.length > 0 ? DB.workers : seed.workers);
          DB.overtime = Array.isArray(remoteData.overtime) && remoteData.overtime.length > 0 ? remoteData.overtime : (DB.overtime && DB.overtime.length > 0 ? DB.overtime : seed.overtime);
          DB.tools = Array.isArray(remoteData.tools) && remoteData.tools.length > 0 ? remoteData.tools : (DB.tools && DB.tools.length > 0 ? DB.tools : seed.tools);
          DB.documents = Array.isArray(remoteData.documents) && remoteData.documents.length > 0 ? remoteData.documents : (DB.documents && DB.documents.length > 0 ? DB.documents : seed.documents);
          DB.quotations = Array.isArray(remoteData.quotations) && remoteData.quotations.length > 0 ? remoteData.quotations : (DB.quotations && DB.quotations.length > 0 ? DB.quotations : seed.quotations);
          
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(DB));
          } catch (e) {}

          updateCloudStatusBadge("synced", "Nube Conectada");

          // If the currently logged-in user's role was changed elsewhere (e.g. by an
          // admin in the Usuarios panel), refresh their session and permission-based UI
          // immediately instead of waiting for a manual logout/login.
          const roleChanged = syncSessionRoleFromDB();
          if (roleChanged) {
            if (typeof renderSidebarUserCard === "function") renderSidebarUserCard();
            if (typeof updateNavPermissions === "function") updateNavPermissions();
          }

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
      
      const seed = defaultSeedData();
      
      // Merge projects
      if (!DB.projects || DB.projects.length === 0) {
        DB.projects = seed.projects;
      } else {
        seed.projects.forEach(sp => {
          const existingIdx = DB.projects.findIndex(p => p.id === sp.id);
          if (existingIdx === -1) {
            DB.projects.push(sp);
          } else if (!DB.projects[existingIdx].customUserEdited) {
            // Update default seed projects with the latest demo dates and progress
            DB.projects[existingIdx] = Object.assign({}, sp, DB.projects[existingIdx]);
            DB.projects[existingIdx].startDate = sp.startDate;
            DB.projects[existingIdx].endDate = sp.endDate;
            DB.projects[existingIdx].plannedProgress = sp.plannedProgress;
            DB.projects[existingIdx].realProgress = sp.realProgress;
            DB.projects[existingIdx].status = sp.status;
          }
        });
      }

      // Merge expenses
      if (!DB.expenses || DB.expenses.length === 0) {
        DB.expenses = seed.expenses;
      } else {
        seed.expenses.forEach(se => {
          if (!DB.expenses.some(e => e.id === se.id)) {
            DB.expenses.push(se);
          }
        });
      }

      // Merge workers
      if (!DB.workers || DB.workers.length === 0) {
        DB.workers = seed.workers;
      } else {
        seed.workers.forEach(sw => {
          if (!DB.workers.some(w => w.id === sw.id || (w.rut && w.rut === sw.rut))) {
            DB.workers.push(sw);
          }
        });
      }

      // Merge tools
      if (!DB.tools || DB.tools.length === 0) {
        DB.tools = seed.tools;
      } else {
        seed.tools.forEach(st => {
          if (!DB.tools.some(t => t.id === st.id || t.code === st.code)) {
            DB.tools.push(st);
          }
        });
      }

      // Merge documents
      if (!DB.documents || DB.documents.length === 0) {
        DB.documents = seed.documents;
      } else {
        seed.documents.forEach(sd => {
          if (!DB.documents.some(d => d.id === sd.id || d.code === sd.code)) {
            DB.documents.push(sd);
          }
        });
      }

      // Merge overtime
      if (!DB.overtime || DB.overtime.length === 0) {
        DB.overtime = seed.overtime;
      } else {
        seed.overtime.forEach(so => {
          if (!DB.overtime.some(o => o.id === so.id)) {
            DB.overtime.push(so);
          }
        });
      }

      // Merge quotations
      if (!DB.quotations || DB.quotations.length === 0) {
        DB.quotations = seed.quotations;
      } else {
        seed.quotations.forEach(sq => {
          if (!DB.quotations.some(q => q.id === sq.id || q.code === sq.code)) {
            DB.quotations.push(sq);
          }
        });
      }
      saveDB();
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

// Automatic Progress Calculation based on elapsed project timeline
function calculateAutoProjectProgress(project) {
  if (!project) return 0;
  if (project.status === "Finalizado") return 100;
  if (!project.startDate || !project.endDate) return 0;

  const start = new Date(project.startDate + "T00:00:00");
  const end = new Date(project.endDate + "T23:59:59");
  const now = new Date();

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

  // Before start date
  if (now < start) return 0;

  // After or on end date
  if (now >= end) return 100;

  const totalDuration = end.getTime() - start.getTime();
  if (totalDuration <= 0) return 100;

  const elapsed = now.getTime() - start.getTime();
  const rawPct = (elapsed / totalDuration) * 100;
  return Math.min(100, Math.max(0, Math.round(rawPct * 10) / 10));
}

// Automatic Project Status Calculation Engine
function calculateAutoProjectStatus(project) {
  if (!project) return "Planificación";

  // If user explicitly marked it as "Detenido", respect manual pause
  if (project.status === "Detenido" && project.manualStatusOverride) {
    return "Detenido";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = project.startDate ? new Date(project.startDate + "T00:00:00") : new Date("2026-01-01T00:00:00");
  const end = project.endDate ? new Date(project.endDate + "T23:59:59") : new Date("2026-12-31T23:59:59");

  // 1. Completion rule
  if (project.status === "Finalizado" || (Number(project.realProgress) >= 100 && today >= end)) {
    return "Finalizado";
  }

  // 2. Overdue rule
  if (today > end) {
    return "Vencido";
  }

  // 3. Not started yet rule
  if (today < start) {
    return "Planificación";
  }

  // 4. Active execution rule
  return "En Ejecución";
}

// Helper to get detailed badge and automated explanation for a project's status
function getProjectStatusDetails(project) {
  const status = project.status || calculateAutoProjectStatus(project);
  const realProgress = Number(project.realProgress) || 0;
  const startStr = project.startDate || "2026-01-01";
  const endStr = project.endDate || "2026-12-31";

  switch (status) {
    case "Finalizado":
      return {
        label: "Finalizado",
        badgeClass: "badge-green",
        icon: "fa-circle-check",
        color: "#10b981",
        description: `Completado al 100% (${project.spent ? '$ ' + formatNumberCL(project.spent) + ' invertidos' : 'Obra entregada'})`
      };
    case "Vencido":
      return {
        label: "Fuera de Plazo",
        badgeClass: "badge-red",
        icon: "fa-triangle-exclamation",
        color: "#ef4444",
        description: `Fecha límite superada (${endStr}) con avance del ${realProgress}%`
      };
    case "Planificación":
      return {
        label: "Planificación",
        badgeClass: "badge-blue",
        icon: "fa-calendar-clock",
        color: "#38bdf8",
        description: `Inicio programado para ${startStr} (Avance: 0%)`
      };
    case "Detenido":
      return {
        label: "Detenido",
        badgeClass: "badge-gray",
        icon: "fa-circle-pause",
        color: "#9ca3af",
        description: "Faena pausada por administración o terreno"
      };
    case "En Ejecución":
    default:
      return {
        label: "En Ejecución",
        badgeClass: "badge-orange",
        icon: "fa-person-digging",
        color: "#f97316",
        description: `Obra en progreso activo (${realProgress}% de avance automático por fecha)`
      };
  }
}

function syncAllProjectsAutoStatus() {
  if (!DB || !Array.isArray(DB.projects)) return;
  let changed = false;
  DB.projects.forEach(p => {
    // 1. Calculate automatic progress based on calendar dates
    const autoProgress = calculateAutoProjectProgress(p);
    if (p.realProgress !== autoProgress) {
      p.realProgress = autoProgress;
      p.plannedProgress = autoProgress;
      changed = true;
    }

    // 2. If not manually locked as paused, compute auto status
    if (!p.manualStatusOverride || p.status !== "Detenido") {
      const autoStatus = calculateAutoProjectStatus(p);
      if (p.status !== autoStatus) {
        p.status = autoStatus;
        changed = true;
      }
    }
  });
  if (changed) {
    saveDB();
  }
}

// Smart traffic light calculation for projects
// Verde: lejos de la fecha de entrega
// Ámbar: tiempo moderado restante
// Rojo: etapa crítica (pocos días / plazo vencido) O cuando nos pasamos del presupuesto
function getProjectHealth(project, settings) {
  const budgetRatio = project.budget > 0 ? (project.spent / project.budget) * 100 : 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = project.startDate ? new Date(project.startDate + "T00:00:00") : new Date("2026-01-01T00:00:00");
  const end = project.endDate ? new Date(project.endDate + "T23:59:59") : new Date("2026-12-31T23:59:59");
  
  const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
  const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  const daysRemainingRatio = (diffDays / totalDays) * 100;

  // 1. REGLA ROJA ESTRICTA DE SOBREGIRO DE PRESUPUESTO
  if (project.budget > 0 && project.spent > project.budget) {
    const overSpent = project.spent - project.budget;
    return {
      color: "red",
      text: `Presupuesto Excedido (+$ ${formatNumberCL(overSpent)})`,
      diffDays,
      budgetRatio,
      code: "SOBREPRESUPUESTO"
    };
  }

  // 2. Si el proyecto está finalizado y dentro de presupuesto
  if (project.status === "Finalizado" || (project.realProgress >= 100 && diffDays >= 0)) {
    return { color: "green", text: "Finalizado en Plazo", diffDays, budgetRatio, code: "OK" };
  }

  // 3. REGLA ROJA POR ETAPA CRÍTICA / PLAZO VENCIDO
  // Plazo vencido (días < 0) o cuando queda menos de 7 días / menos del 15% del plazo
  if (diffDays <= 0) {
    return {
      color: "red",
      text: "Plazo Vencido",
      diffDays,
      budgetRatio,
      code: "CRITICO_VENCIDO"
    };
  }
  if (diffDays <= 7 || daysRemainingRatio <= 15) {
    return {
      color: "red",
      text: `Etapa Crítica (${diffDays} días restantes)`,
      diffDays,
      budgetRatio,
      code: "CRITICO_TIEMPO"
    };
  }

  // 4. REGLA ÁMBAR / AMARILLO POR TIEMPO MODERADO RESTANTE
  // Quedan entre 8 y 25 días (o entre 15% y 40% del tiempo total del proyecto)
  if (diffDays <= 25 || daysRemainingRatio <= 40) {
    return {
      color: "yellow",
      text: `Plazo Moderado (${diffDays} días)`,
      diffDays,
      budgetRatio,
      code: "ALERTA_MODERADO"
    };
  }

  // 5. REGLA VERDE: LEJOS DE LA FECHA DE ENTREGA
  return {
    color: "green",
    text: `Holgura de Plazo (${diffDays} días)`,
    diffDays,
    budgetRatio,
    code: "HOLGURA_VERDE"
  };
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

// Keeps the active session's role in sync with the latest data coming from Firestore,
// so a role change made by an admin/developer takes effect immediately for a user
// who is already logged in, without requiring them to log out and back in.
function syncSessionRoleFromDB() {
  const session = getSession();
  if (!session || !session.user || !Array.isArray(DB && DB.users)) return false;

  const match = DB.users.find(u =>
    (u.id && u.id === session.user.id) ||
    (u.email && session.user.email && u.email.toLowerCase() === session.user.email.toLowerCase())
  );

  if (!match) return false;

  const roleChanged = (match.role || "Usuario") !== session.user.role;
  if (!roleChanged) return false;

  currentSession.user.role = match.role || "Usuario";
  currentSession.user.name = match.name || session.user.name;
  currentSession.user.avatar = match.avatar || session.user.avatar;

  try {
    sessionStorage.setItem("cm_progest_session", JSON.stringify(currentSession));
  } catch (e) {}

  return true;
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
