// CM INDUSTRIAL — UI Controller & Views
let currentView = "dashboard";
let chartInstances = {};
let activeModalEntity = null;
let activeModalRecord = null;

// Currency & formatting helpers (Norma con puntos para separación de miles y millones de pesos)
function formatNumberCL(amount) {
  if (amount === undefined || amount === null || amount === "") return "0";
  const clean = String(amount).replace(/\./g, "").replace(/\D/g, "");
  if (!clean) return "0";
  const normalized = clean.replace(/^0+(?=\d)/, "");
  return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function parseCurrencyNumber(val) {
  if (!val) return 0;
  const clean = String(val).replace(/\./g, "").replace(/\D/g, "");
  return Number(clean) || 0;
}

function fmtMoney(amount) {
  return "$" + formatNumberCL(amount);
}

function fmtPercent(val) {
  return Number(val || 0).toFixed(1) + "%";
}

// Genera descriptor visual y legible para diferenciar miles de millones en tiempo real
function describeAmountInWords(val) {
  const num = parseCurrencyNumber(val);
  if (num === 0) {
    return `<span style="display:inline-flex;align-items:center;gap:6px;color:var(--text-muted);font-size:11px;"><i class="fa-solid fa-coins" style="font-size:10px;"></i><span>$ 0 pesos (cero)</span></span>`;
  }

  let magnitudeText = "";
  if (num >= 1000000000) {
    const b = (num / 1000000000).toLocaleString("es-CL", { maximumFractionDigits: 2 });
    magnitudeText = `<strong>${b} mil millones</strong> de pesos`;
  } else if (num >= 1000000) {
    const m = (num / 1000000).toLocaleString("es-CL", { maximumFractionDigits: 2 });
    magnitudeText = num === 1000000 ? `<strong>1 Millón</strong> de pesos` : `<strong>${m} Millones</strong> de pesos`;
  } else if (num >= 1000) {
    const k = (num / 1000).toLocaleString("es-CL", { maximumFractionDigits: 1 });
    magnitudeText = `<strong>${k} mil</strong> pesos`;
  } else {
    magnitudeText = `<strong>${num}</strong> pesos`;
  }

  const isMillion = num >= 1000000;
  const badgeBg = isMillion ? "rgba(34, 197, 94, 0.12)" : "rgba(249, 115, 22, 0.12)";
  const badgeBorder = isMillion ? "rgba(34, 197, 94, 0.3)" : "rgba(249, 115, 22, 0.3)";
  const badgeColor = isMillion ? "#4ade80" : "var(--primary)";
  const icon = isMillion ? "fa-money-bill-trend-up" : "fa-coins";

  return `
    <span style="display:inline-flex;align-items:center;gap:6px;background:${badgeBg};border:1px solid ${badgeBorder};color:${badgeColor};border-radius:6px;padding:3px 8px;font-weight:600;font-size:11px;">
      <i class="fa-solid ${icon}"></i>
      <span>$ ${formatNumberCL(num)} &bull; ${magnitudeText}</span>
    </span>
  `;
}

// Formateo automático de inputs en vivo con puntos de miles y millones
function handleCurrencyInput(input, helperId) {
  if (!input) return;

  const prevVal = input.value;
  const prevPos = input.selectionEnd || 0;
  const digitsBeforeCursor = (prevVal.slice(0, prevPos).match(/\d/g) || []).length;

  const rawDigits = input.value.replace(/\D/g, "");
  if (!rawDigits) {
    input.value = "0";
    if (input.setSelectionRange) input.setSelectionRange(1, 1);
  } else {
    const normalized = rawDigits.replace(/^0+(?=\d)/, "");
    const formatted = formatNumberCL(normalized);
    input.value = formatted;

    if (input.setSelectionRange) {
      let currentDigits = 0;
      let newPos = formatted.length;
      for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i])) currentDigits++;
        if (currentDigits >= digitsBeforeCursor) {
          newPos = i + 1;
          break;
        }
      }
      input.setSelectionRange(newPos, newPos);
    }
  }

  if (helperId) {
    const helper = document.getElementById(helperId);
    if (helper) {
      helper.innerHTML = describeAmountInWords(input.value);
    }
  }
}

// Builds a 2-letter avatar from a person's name, e.g. "Carlos Morales" -> "CM"
function getInitials(name) {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// Navigation & RBAC Control
function verifyDeveloperPermission(actionDesc = "modificar información") {
  if (!isDeveloper()) {
    alert(`Acceso Denegado: Tu perfil es de tipo 'Usuario' (Solo Consulta).\n\nNo tienes permisos para ${actionDesc}.\nDebes ingresar con una cuenta de 'Desarrollador' para realizar modificaciones.`);
    return false;
  }
  return true;
}

function updateNavPermissions() {
  const userIsDev = isDeveloper();
  
  const navUsers = document.getElementById("nav-item-usuarios");
  if (navUsers) {
    if (userIsDev) {
      navUsers.style.opacity = "1";
      navUsers.style.cursor = "pointer";
      navUsers.innerHTML = `<i class="fa-solid fa-users" style="width:20px;"></i> <span>Usuarios</span>`;
      navUsers.title = "Gestión de usuarios y roles";
    } else {
      navUsers.style.opacity = "0.45";
      navUsers.style.cursor = "not-allowed";
      navUsers.innerHTML = `<i class="fa-solid fa-users" style="width:20px;"></i> <span>Usuarios</span> <i class="fa-solid fa-lock" style="font-size:10px;margin-left:auto;color:var(--warning);" title="Restringido a Desarrolladores"></i>`;
      navUsers.title = "Restringido: Solo Desarrolladores";
    }
  }

  const navConfig = document.getElementById("nav-item-config");
  if (navConfig) {
    if (userIsDev) {
      navConfig.style.opacity = "1";
      navConfig.style.cursor = "pointer";
      navConfig.innerHTML = `<i class="fa-solid fa-sliders" style="width:20px;"></i> <span>Configuración / DB</span>`;
      navConfig.title = "Configuración y base de datos";
    } else {
      navConfig.style.opacity = "0.45";
      navConfig.style.cursor = "not-allowed";
      navConfig.innerHTML = `<i class="fa-solid fa-sliders" style="width:20px;"></i> <span>Configuración / DB</span> <i class="fa-solid fa-lock" style="font-size:10px;margin-left:auto;color:var(--warning);" title="Restringido a Desarrolladores"></i>`;
      navConfig.title = "Restringido: Solo Desarrolladores";
    }
  }

  // Update topbar role badge
  const topbarBadge = document.getElementById("topbar-role-badge");
  if (topbarBadge) {
    if (userIsDev) {
      topbarBadge.innerHTML = `
        <div class="topbar-role-wrapper">
          <span class="badge badge-blue" style="font-size:11px;padding:4px 9px;" title="Perfil con permisos totales de edición">
            <i class="fa-solid fa-code"></i>
            <span class="role-name-full">Desarrollador (Edición Habilitada)</span>
            <span class="role-name-short">Dev</span>
          </span>
          <button class="btn btn-secondary btn-sm topbar-switch-btn" onclick="switchActiveRole('Usuario')" title="Probar restricciones como perfil Usuario" style="font-size:11px;padding:4px 8px;">
            <i class="fa-solid fa-user-shield"></i>
            <span class="switch-label-full">Probar como Usuario</span>
          </button>
        </div>
      `;
    } else {
      topbarBadge.innerHTML = `
        <div class="topbar-role-wrapper">
          <span class="badge badge-yellow" style="font-size:11px;padding:4px 9px;" title="Perfil restringido a solo consulta">
            <i class="fa-solid fa-lock"></i>
            <span class="role-name-full">Usuario (Solo Consulta)</span>
            <span class="role-name-short">Usuario</span>
          </span>
          <button class="btn btn-primary btn-sm topbar-switch-btn" onclick="switchActiveRole('Desarrollador')" title="Cambiar a Desarrollador para habilitar edición" style="font-size:11px;padding:4px 8px;">
            <i class="fa-solid fa-code"></i>
            <span class="switch-label-full">Entrar Desarrollador</span>
          </button>
        </div>
      `;
    }
  }
}

function toggleMobileSidebar(forceState) {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  if (!sidebar) return;

  const willOpen = typeof forceState === "boolean" 
    ? forceState 
    : !sidebar.classList.contains("mobile-open");

  if (willOpen) {
    sidebar.classList.add("mobile-open");
    if (overlay) overlay.classList.add("active");
    document.body.classList.add("mobile-nav-locked");
  } else {
    sidebar.classList.remove("mobile-open");
    if (overlay) overlay.classList.remove("active");
    document.body.classList.remove("mobile-nav-locked");
  }
}
window.toggleMobileSidebar = toggleMobileSidebar;

function navigateTo(viewId) {
  // Enforce access boundary: regular users cannot enter 'usuarios' or 'config'
  if (!isDeveloper() && (viewId === "usuarios" || viewId === "config")) {
    const sectionName = viewId === "usuarios" ? "Administración de Usuarios" : "Configuración / DB";
    alert(`Acceso Denegado: La sección "${sectionName}" es de uso exclusivo para Desarrolladores.\n\nTu perfil actual es "Usuario" (Solo Consulta).`);
    return;
  }

  if (viewId === "horas_extras") {
    currentView = "horas_extras";
    activeLaborTab = "horas_extras";
  } else if (viewId === "trabajadores") {
    currentView = "trabajadores";
    activeLaborTab = "nomina";
  } else {
    currentView = viewId;
  }
  document.querySelectorAll(".nav-item").forEach(item => {
    const isAct = item.dataset.view === viewId;
    item.classList.toggle("active", isAct);
  });
  
  // Close mobile sidebar if open
  if (typeof window.toggleMobileSidebar === "function") {
    window.toggleMobileSidebar(false);
  } else {
    const sidebar = document.getElementById("sidebar");
    if (sidebar) sidebar.classList.remove("mobile-open");
  }
  
  renderCurrentView();
}

function renderCurrentView() {
  const container = document.getElementById("view-root");
  if (!container) return;

  // Clean old charts
  Object.values(chartInstances).forEach(c => {
    try { c.destroy(); } catch (e) {}
  });
  chartInstances = {};

  renderSidebarUserCard();
  updateNavPermissions();

  switch (currentView) {
    case "dashboard":
      renderDashboard(container);
      break;
    case "proyectos":
      renderProjects(container);
      break;
    case "gantt":
      renderGantt(container);
      break;
    case "gastos":
      renderExpenses(container);
      break;
    case "trabajadores":
      renderWorkers(container);
      break;
    case "horas_extras":
      activeLaborTab = "horas_extras";
      renderWorkers(container);
      break;
    case "herramientas":
      renderTools(container);
      break;
    case "documentos":
      renderDocuments(container);
      break;
    case "usuarios":
      renderUsers(container);
      break;
    case "alertas":
      renderAlerts(container);
      break;
    case "config":
      renderConfig(container);
      break;
    default:
      renderDashboard(container);
  }
}

// Fills the sidebar footer card with role and active profile
function renderSidebarUserCard() {
  const card = document.getElementById("sidebar-user-card");
  if (!card) return;

  const session = getSession();
  const user = session && session.user;

  if (!user) {
    card.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;cursor:pointer;" onclick="quickLoginRole('Desarrollador')">
        <div style="width:34px;height:34px;border-radius:50%;background:#1e293b;border:1px dashed var(--border-subtle);display:flex;align-items:center;justify-content:center;font-size:13px;color:var(--text-sub);">
          <i class="fa-solid fa-user-plus"></i>
        </div>
        <div>
          <div style="font-size:12px;font-weight:700;color:#fff;">Sin sesión</div>
          <div style="font-size:10px;color:var(--primary);">Ingresar</div>
        </div>
      </div>
    `;
    return;
  }

  const userIsDev = isDeveloper();
  const roleBadge = userIsDev ? "badge-blue" : "badge-yellow";
  const roleIcon = userIsDev ? "fa-code" : "fa-user-shield";
  const roleText = userIsDev ? "DESARROLLADOR" : "USUARIO (CONSULTA)";

  card.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;min-width:0;">
      <div style="width:34px;height:34px;border-radius:50%;background:#1e293b;border:1px solid ${userIsDev ? 'var(--blue-accent)' : 'var(--warning)'};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:${userIsDev ? 'var(--blue-accent)' : 'var(--warning)'};flex-shrink:0;">
        ${user.avatar || getInitials(user.name)}
      </div>
      <div style="min-width:0;">
        <div style="font-size:12px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${user.name}</div>
        <div style="font-size:10px;color:var(--text-sub);"><span class="badge ${roleBadge}" style="padding:2px 5px;font-size:8px;"><i class="fa-solid ${roleIcon}"></i> ${roleText}</span></div>
      </div>
    </div>
    <button class="btn btn-secondary btn-sm" onclick="handleLogout()" title="Cerrar sesión" style="padding:6px 9px;flex-shrink:0;">
      <i class="fa-solid fa-right-from-bracket"></i>
    </button>
  `;
}

// 1. DASHBOARD VIEW WITH 10 KPIS & 4 CHARTS
function renderDashboard(container) {
  const totalBudget = DB.projects.reduce((acc, p) => acc + (p.budget || 0), 0);
  const totalSpent = DB.projects.reduce((acc, p) => acc + (p.spent || 0), 0);
  const margin = totalBudget - totalSpent;
  const marginPercent = totalBudget > 0 ? (margin / totalBudget) * 100 : 0;
  
  const avgPlanned = DB.projects.length > 0 
    ? DB.projects.reduce((acc, p) => acc + (p.plannedProgress || 0), 0) / DB.projects.length 
    : 0;
  const avgReal = DB.projects.length > 0 
    ? DB.projects.reduce((acc, p) => acc + (p.realProgress || 0), 0) / DB.projects.length 
    : 0;

  // Status breakdown via Smart Traffic Light
  let criticalCount = 0;
  let alertCount = 0;
  let normalCount = 0;
  DB.projects.forEach(p => {
    const health = getProjectHealth(p, DB.settings);
    if (health.color === "red") criticalCount++;
    else if (health.color === "yellow") alertCount++;
    else normalCount++;
  });

  const activeWorkers = DB.workers.filter(w => w.status === "Activo").length;
  const toolsInUse = DB.tools.filter(t => t.status === "En Faena").length;
  const toolsMaintenance = DB.tools.filter(t => t.status === "En Mantenimiento").length;
  const docsExpired = DB.documents.filter(d => d.status === "Vencido" || d.status === "Por Vencer").length;

  const userIsDev = isDeveloper();

  container.innerHTML = `
    ${!userIsDev ? `
      <div class="mode-banner">
        <div class="mode-banner-content">
          <div class="mode-banner-icon">
            <i class="fa-solid fa-user-lock"></i>
          </div>
          <div class="mode-banner-text">
            <div class="mode-banner-title">Perfil: Usuario (Modo Consulta Protegido)</div>
            <div class="mode-banner-sub">Tienes acceso para revisar indicadores y estados en tiempo real. Las acciones de modificación, creación y eliminación están reservadas para cuentas de Desarrollador.</div>
          </div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="switchActiveRole('Desarrollador')">
          <i class="fa-solid fa-code"></i> Entrar como Desarrollador
        </button>
      </div>
    ` : ""}

    <!-- Top KPI Row (10 KPIs) -->
    <div class="kpi-grid">
      <div class="kpi-card highlight">
        <div class="kpi-title"><span>Proyectos Activos</span> <i class="fa-solid fa-briefcase"></i></div>
        <div class="kpi-value">${DB.projects.filter(p => p.status !== "Finalizado").length} <span style="font-size:13px;font-weight:500;color:var(--text-sub);">/ ${DB.projects.length} tot</span></div>
        <div class="kpi-sub">${normalCount} en norma, ${criticalCount} críticos</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-title"><span>Presupuesto Asignado</span> <i class="fa-solid fa-dollar-sign"></i></div>
        <div class="kpi-value">${fmtMoney(totalBudget)}</div>
        <div class="kpi-sub">Total cartera de proyectos</div>
      </div>

      <div class="kpi-card warning">
        <div class="kpi-title"><span>Gasto Ejecutado</span> <i class="fa-solid fa-receipt"></i></div>
        <div class="kpi-value">${fmtMoney(totalSpent)}</div>
        <div class="kpi-sub">${fmtPercent((totalSpent / (totalBudget || 1)) * 100)} del presupuesto</div>
      </div>

      <div class="kpi-card ${margin >= 0 ? 'success' : 'danger'}">
        <div class="kpi-title"><span>Margen / Saldo</span> <i class="fa-solid fa-chart-line"></i></div>
        <div class="kpi-value">${fmtMoney(margin)}</div>
        <div class="kpi-sub">${fmtPercent(marginPercent)} disponible</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-title"><span>Avance Ponderado</span> <i class="fa-solid fa-percent"></i></div>
        <div class="kpi-value">${fmtPercent(avgReal)}</div>
        <div class="kpi-sub">Planificado: ${fmtPercent(avgPlanned)}</div>
      </div>

      <div class="kpi-card danger">
        <div class="kpi-title"><span>Semáforo Crítico</span> <i class="fa-solid fa-triangle-exclamation"></i></div>
        <div class="kpi-value">${criticalCount}</div>
        <div class="kpi-sub">${alertCount} en alerta amarilla</div>
      </div>

      <div class="kpi-card highlight">
        <div class="kpi-title"><span>Personal en Faena</span> <i class="fa-solid fa-hard-hat"></i></div>
        <div class="kpi-value">${activeWorkers}</div>
        <div class="kpi-sub">${DB.workers.length} total colaboradores</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-title"><span>Herramientas Activas</span> <i class="fa-solid fa-wrench"></i></div>
        <div class="kpi-value">${toolsInUse}</div>
        <div class="kpi-sub">${toolsMaintenance} en mantenimiento</div>
      </div>

      <div class="kpi-card ${docsExpired > 0 ? 'warning' : 'success'}">
        <div class="kpi-title"><span>Docs por Vencer/Vencidos</span> <i class="fa-solid fa-file-contract"></i></div>
        <div class="kpi-value">${docsExpired}</div>
        <div class="kpi-sub">${DB.documents.length} documentos auditados</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-title"><span>Desvío Global (SPI)</span> <i class="fa-solid fa-gauge-high"></i></div>
        <div class="kpi-value">${(avgPlanned > 0 ? (avgReal / avgPlanned).toFixed(2) : "1.00")}</div>
        <div class="kpi-sub">${avgReal >= avgPlanned ? 'En o sobre meta' : 'Desfase -' + (avgPlanned - avgReal).toFixed(1) + '%'}</div>
      </div>
    </div>

    <!-- 4 Main Charts -->
    <div class="charts-grid">
      <!-- Chart 1: Presupuesto vs Gasto -->
      <div class="chart-box">
        <div class="chart-header">
          <div class="chart-title"><i class="fa-solid fa-chart-column" style="color:var(--primary);"></i> Presupuesto vs Gasto por Proyecto</div>
        </div>
        <div style="height:250px;position:relative;">
          <canvas id="chart-budget-spent"></canvas>
        </div>
      </div>

      <!-- Chart 2: Avance Planificado vs Real -->
      <div class="chart-box">
        <div class="chart-header">
          <div class="chart-title"><i class="fa-solid fa-chart-line" style="color:var(--blue-accent);"></i> Avance Físico: Planificado vs Real (%)</div>
        </div>
        <div style="height:250px;position:relative;">
          <canvas id="chart-progress"></canvas>
        </div>
      </div>

      <!-- Chart 3: Distribución de Gastos -->
      <div class="chart-box">
        <div class="chart-header">
          <div class="chart-title"><i class="fa-solid fa-chart-pie" style="color:var(--warning);"></i> Gastos por Categoría</div>
        </div>
        <div style="height:250px;position:relative;">
          <canvas id="chart-categories"></canvas>
        </div>
      </div>

      <!-- Chart 4: Evolución Inversión Mensual -->
      <div class="chart-box">
        <div class="chart-header">
          <div class="chart-title"><i class="fa-solid fa-arrow-trend-up" style="color:var(--success);"></i> Evolución Acumulada de Inversión ($)</div>
        </div>
        <div style="height:250px;position:relative;">
          <canvas id="chart-timeline"></canvas>
        </div>
      </div>
    </div>

    <!-- Critical Projects Quick Table -->
    <div class="data-table-container">
      <div class="table-toolbar">
        <div class="toolbar-title-group">
          <div style="font-weight:700;font-size:14px;"><i class="fa-solid fa-traffic-light" style="color:var(--danger);margin-right:8px;"></i> Estado de Salud de Proyectos (Semáforo Inteligente)</div>
        </div>
        <div class="toolbar-actions-group">
          <button class="btn btn-secondary btn-sm" onclick="navigateTo('proyectos')">Ver todos los proyectos <i class="fa-solid fa-arrow-right"></i></button>
        </div>
      </div>
      <div class="table-scroll-hint"><i class="fa-solid fa-arrows-left-right"></i> Desliza horizontalmente para ver más columnas</div>
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Semáforo</th>
              <th>Proyecto</th>
              <th>Cliente</th>
              <th>Presupuesto</th>
              <th>Gasto Real</th>
              <th>Avance Físico</th>
              <th>Plazo</th>
              <th style="text-align:center;">${userIsDev ? "Acción" : "Permiso"}</th>
            </tr>
          </thead>
          <tbody>
            ${DB.projects.length === 0 ? `
              <tr>
                <td colspan="8" style="text-align:center;padding:36px 20px;">
                  <i class="fa-solid fa-folder-open" style="font-size:28px;color:var(--text-sub);margin-bottom:8px;display:block;"></i>
                  <div style="font-size:14px;color:#fff;font-weight:600;">Sin proyectos registrados en la base de datos</div>
                  <p style="color:var(--text-sub);font-size:12px;margin:4px 0 12px;">Comienza agregando tu primer proyecto u obra industrial para monitorear el semáforo de salud y avances.</p>
                  ${userIsDev ? `
                    <button class="btn btn-primary btn-sm" onclick="openCreateModal('projects')"><i class="fa-solid fa-plus"></i> Registrar Primer Proyecto</button>
                  ` : ""}
                </td>
              </tr>
            ` : DB.projects.map(p => {
              const h = getProjectHealth(p, DB.settings);
              const badgeClass = h.color === 'red' ? 'badge-red' : h.color === 'yellow' ? 'badge-yellow' : 'badge-green';
              return `
                <tr>
                  <td><span class="badge ${badgeClass}"><i class="fa-solid fa-circle" style="font-size:7px;"></i> ${h.text}</span></td>
                  <td><strong>${p.name}</strong><br><small style="color:var(--text-sub);">${p.id} · ${p.manager}</small></td>
                  <td>${p.client}</td>
                  <td>${fmtMoney(p.budget)}</td>
                  <td>${fmtMoney(p.spent)}</td>
                  <td style="min-width:130px;">
                    <div style="display:flex;justify-content:space-between;font-size:11px;">
                      <span>R: ${p.realProgress}%</span>
                      <span style="color:var(--text-sub);">P: ${p.plannedProgress}%</span>
                    </div>
                    <div class="prog-bar-bg">
                      <div class="prog-bar-fill" style="width:${p.realProgress}%;background:${p.realProgress >= p.plannedProgress ? 'var(--success)' : 'var(--danger)'};"></div>
                    </div>
                  </td>
                  <td><small>${p.endDate}<br>(${h.diffDays > 0 ? h.diffDays + ' días' : 'Vencido'})</small></td>
                  <td style="text-align:center;">
                    ${userIsDev ? `
                      <button class="btn btn-secondary btn-sm" onclick="openEditModal('projects', '${p.id}')" title="Editar proyecto"><i class="fa-solid fa-pen"></i></button>
                    ` : `
                      <span class="badge badge-gray" style="font-size:10px;" title="Acceso de solo lectura"><i class="fa-solid fa-lock"></i> Lectura</span>
                    `}
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;

  mountDashboardCharts();
}

function mountDashboardCharts() {
  // Chart 1: Presupuesto vs Gasto
  const ctx1 = document.getElementById("chart-budget-spent");
  if (ctx1 && typeof Chart !== "undefined") {
    chartInstances.budget = new Chart(ctx1, {
      type: "bar",
      data: {
        labels: DB.projects.map(p => p.id),
        datasets: [
          {
            label: "Presupuesto ($)",
            data: DB.projects.map(p => p.budget),
            backgroundColor: "#f97316",
            borderRadius: 4
          },
          {
            label: "Gasto ($)",
            data: DB.projects.map(p => p.spent),
            backgroundColor: "#38bdf8",
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: "#9ca3af", font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: function(context) {
                return " " + context.dataset.label + ": " + fmtMoney(context.raw);
              }
            }
          }
        },
        scales: {
          x: { ticks: { color: "#9ca3af" }, grid: { color: "#1f293d" } },
          y: {
            ticks: {
              color: "#9ca3af",
              callback: function(val) { return "$" + formatNumberCL(val); }
            },
            grid: { color: "#1f293d" }
          }
        }
      }
    });
  }

  // Chart 2: Avance Planificado vs Real
  const ctx2 = document.getElementById("chart-progress");
  if (ctx2 && typeof Chart !== "undefined") {
    chartInstances.progress = new Chart(ctx2, {
      type: "bar",
      data: {
        labels: DB.projects.map(p => p.id),
        datasets: [
          {
            label: "Planificado (%)",
            data: DB.projects.map(p => p.plannedProgress),
            backgroundColor: "rgba(156, 163, 175, 0.4)",
            borderRadius: 4
          },
          {
            label: "Real (%)",
            data: DB.projects.map(p => p.realProgress),
            backgroundColor: "#10b981",
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: "#9ca3af", font: { size: 11 } } }
        },
        scales: {
          x: { ticks: { color: "#9ca3af" }, grid: { color: "#1f293d" } },
          y: { max: 100, ticks: { color: "#9ca3af" }, grid: { color: "#1f293d" } }
        }
      }
    });
  }

  // Chart 3: Categorías
  const ctx3 = document.getElementById("chart-categories");
  if (ctx3 && typeof Chart !== "undefined") {
    const catMap = {};
    DB.expenses.forEach(e => {
      catMap[e.category] = (catMap[e.category] || 0) + e.amount;
    });

    chartInstances.categories = new Chart(ctx3, {
      type: "doughnut",
      data: {
        labels: Object.keys(catMap),
        datasets: [
          {
            data: Object.values(catMap),
            backgroundColor: ["#f97316", "#38bdf8", "#10b981", "#f59e0b", "#a855f7", "#ec4899"],
            borderWidth: 1,
            borderColor: "#111827"
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "right", labels: { color: "#9ca3af", font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: function(context) {
                return " " + context.label + ": " + fmtMoney(context.raw);
              }
            }
          }
        }
      }
    });
  }

  // Chart 4: Evolución Inversión (acumulado real, calculado desde los gastos registrados)
  const ctx4 = document.getElementById("chart-timeline");
  if (ctx4 && typeof Chart !== "undefined") {
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const monthlyTotals = {};
    DB.expenses.forEach(e => {
      if (!e.date) return;
      const key = e.date.slice(0, 7); // "YYYY-MM"
      monthlyTotals[key] = (monthlyTotals[key] || 0) + (Number(e.amount) || 0);
    });
    const sortedMonths = Object.keys(monthlyTotals).sort();
    let running = 0;
    const timelineData = sortedMonths.map(m => (running += monthlyTotals[m]));
    const timelineLabels = sortedMonths.map(m => {
      const [y, mm] = m.split("-");
      return `${monthNames[Number(mm) - 1]} ${y}`;
    });

    chartInstances.timeline = new Chart(ctx4, {
      type: "line",
      data: {
        labels: timelineLabels,
        datasets: [
          {
            label: "Gasto Acumulado ($)",
            data: timelineData,
            borderColor: "#10b981",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            fill: true,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: "#9ca3af", font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: function(context) {
                return " " + context.dataset.label + ": " + fmtMoney(context.raw);
              }
            }
          }
        },
        scales: {
          x: { ticks: { color: "#9ca3af" }, grid: { color: "#1f293d" } },
          y: {
            ticks: {
              color: "#9ca3af",
              callback: function(val) { return "$" + formatNumberCL(val); }
            },
            grid: { color: "#1f293d" }
          }
        }
      }
    });
  }
}

// 2. PROYECTOS VIEW
function renderProjects(container) {
  const userIsDev = isDeveloper();

  container.innerHTML = `
    ${!userIsDev ? `
      <div class="mode-banner">
        <div class="mode-banner-content">
          <div class="mode-banner-icon">
            <i class="fa-solid fa-lock"></i>
          </div>
          <div class="mode-banner-text">
            <div class="mode-banner-title">Modo Consulta: Proyectos Industriales</div>
            <div class="mode-banner-sub">Como perfil Usuario puedes explorar el estado y costos de todos los proyectos. Para crear o modificar proyectos, ingresa como Desarrollador.</div>
          </div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="switchActiveRole('Desarrollador')">
          <i class="fa-solid fa-code"></i> Modo Desarrollador
        </button>
      </div>
    ` : ""}

    <div class="data-table-container">
      <div class="table-toolbar">
        <div class="toolbar-title-group">
          <h2 style="font-size:18px;font-weight:700;">Proyectos Industriales</h2>
          <span class="badge badge-orange">${DB.projects.length} Registros</span>
        </div>
        <div class="toolbar-actions-group">
          <div class="search-box">
            <i class="fa-solid fa-search search-icon"></i>
            <input type="text" id="proj-search" class="search-input" placeholder="Buscar proyecto, cliente..." oninput="filterTable('proj-table', this.value)">
          </div>
          <div class="toolbar-btn-group">
            <button class="btn btn-secondary btn-sm" onclick="exportCSV('projects')"><i class="fa-solid fa-file-export"></i> Exportar</button>
            ${userIsDev ? `
              <button class="btn btn-primary btn-sm" onclick="openCreateModal('projects')"><i class="fa-solid fa-plus"></i> Nuevo Proyecto</button>
            ` : ""}
          </div>
        </div>
      </div>
      <div class="table-scroll-hint"><i class="fa-solid fa-arrows-left-right"></i> Desliza horizontalmente para ver más columnas</div>
      <div class="table-responsive">
        <table id="proj-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre & Cliente</th>
              <th>Ubicación & Faena</th>
              <th>Jefe Proyecto</th>
              <th>Presupuesto</th>
              <th>Gasto Real</th>
              <th>Avance Físico</th>
              <th>Plazo</th>
              <th>Estado</th>
              <th style="text-align:${userIsDev ? 'right' : 'center'};">${userIsDev ? 'Acciones' : 'Permiso'}</th>
            </tr>
          </thead>
          <tbody>
            ${DB.projects.length === 0 ? `
              <tr>
                <td colspan="10" style="text-align:center;padding:48px 20px;">
                  <i class="fa-solid fa-folder-open" style="font-size:32px;color:var(--text-sub);margin-bottom:12px;display:block;"></i>
                  <h3 style="font-size:15px;color:#fff;margin-bottom:6px;">Sin proyectos registrados</h3>
                  <p style="color:var(--text-sub);font-size:13px;max-width:400px;margin:0 auto 16px;">Comienza agregando tu primer proyecto u obra industrial con sus datos reales.</p>
                  ${userIsDev ? `
                    <button class="btn btn-primary btn-sm" onclick="openCreateModal('projects')"><i class="fa-solid fa-plus"></i> Registrar Primer Proyecto</button>
                  ` : ""}
                </td>
              </tr>
            ` : DB.projects.map(p => {
              const h = getProjectHealth(p, DB.settings);
              const badgeClass = h.color === 'red' ? 'badge-red' : h.color === 'yellow' ? 'badge-yellow' : 'badge-green';
              return `
                <tr>
                  <td><strong>${p.id}</strong></td>
                  <td><strong>${p.name}</strong><br><small style="color:var(--text-sub);">${p.client}</small></td>
                  <td>${p.location}</td>
                  <td>${p.manager}</td>
                  <td>${fmtMoney(p.budget)}</td>
                  <td>${fmtMoney(p.spent)}</td>
                  <td style="min-width:130px;">
                    <div style="display:flex;justify-content:space-between;font-size:11px;">
                      <span>R: ${p.realProgress}%</span>
                      <span style="color:var(--text-sub);">P: ${p.plannedProgress}%</span>
                    </div>
                    <div class="prog-bar-bg">
                      <div class="prog-bar-fill" style="width:${p.realProgress}%;background:${p.realProgress >= p.plannedProgress ? 'var(--success)' : 'var(--danger)'};"></div>
                    </div>
                  </td>
                  <td><small>${p.startDate} al<br>${p.endDate}</small></td>
                  <td><span class="badge ${badgeClass}">${h.text}</span></td>
                  <td style="text-align:${userIsDev ? 'right' : 'center'};">
                    ${userIsDev ? `
                      <button class="btn btn-secondary btn-sm" onclick="openEditModal('projects', '${p.id}')" title="Editar"><i class="fa-solid fa-pen"></i></button>
                      <button class="btn btn-danger btn-sm" onclick="deleteRecord('projects', '${p.id}')" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
                    ` : `
                      <span class="badge badge-gray" style="font-size:10px;"><i class="fa-solid fa-lock"></i> Solo Lectura</span>
                    `}
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 3. GANTT VISUAL VIEW
function renderGantt(container) {
  if (DB.projects.length === 0) {
    container.innerHTML = `
      <div style="margin-bottom:18px;">
        <h2 style="font-size:18px;font-weight:700;">Gantt Visual de Proyectos</h2>
        <p style="font-size:13px;color:var(--text-sub);">Línea de tiempo general con marcador de HOY y avance físico</p>
      </div>
      <div class="data-table-container" style="padding:40px;text-align:center;">
        <i class="fa-solid fa-timeline" style="font-size:32px;color:var(--text-sub);margin-bottom:12px;"></i>
        <h3 style="font-size:15px;">Sin proyectos registrados</h3>
        <p style="color:var(--text-sub);font-size:13px;margin-top:6px;">Crea tu primer proyecto en "Proyectos & Faenas" para ver el cronograma aquí.</p>
      </div>
    `;
    return;
  }

  // Compute timeline boundaries
  const allDates = DB.projects.flatMap(p => [new Date(p.startDate), new Date(p.endDate)]);
  const minDate = new Date(Math.min(...allDates));
  const maxDate = new Date(Math.max(...allDates));
  const totalDays = Math.max(1, Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)));
  
  const today = new Date();
  const todayOffsetDays = Math.max(0, Math.ceil((today - minDate) / (1000 * 60 * 60 * 24)));
  const todayPercent = Math.min(100, Math.max(0, (todayOffsetDays / totalDays) * 100));

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h2 style="font-size:18px;font-weight:700;">Gantt Visual de Proyectos</h2>
        <p style="font-size:13px;color:var(--text-sub);">Línea de tiempo general con marcador de HOY y avance físico</p>
      </div>
      <div style="display:flex;gap:8px;">
        <span class="badge badge-red"><i class="fa-solid fa-location-dot"></i> Hoy: ${today.toISOString().split("T")[0]}</span>
      </div>
    </div>

    <div class="table-scroll-hint" style="display:flex;margin-bottom:8px;border-radius:8px;"><i class="fa-solid fa-arrows-left-right"></i> Desliza horizontalmente para explorar el cronograma completo</div>
    <div class="gantt-wrapper">
      <div style="position:relative;min-width:700px;padding-top:20px;">
        <!-- Today vertical indicator -->
        <div class="gantt-today-line" style="left: calc(220px + (100% - 220px) * ${todayPercent / 100});">
          <div class="gantt-today-badge">HOY</div>
        </div>

        ${DB.projects.map(p => {
          const start = new Date(p.startDate);
          const end = new Date(p.endDate);
          const offsetDays = Math.max(0, Math.ceil((start - minDate) / (1000 * 60 * 60 * 24)));
          const durationDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
          
          const leftPercent = (offsetDays / totalDays) * 100;
          const widthPercent = (durationDays / totalDays) * 100;
          
          const h = getProjectHealth(p, DB.settings);
          const barColor = h.color === 'red' ? '#ef4444' : h.color === 'yellow' ? '#f59e0b' : '#10b981';

          return `
            <div class="gantt-row">
              <div class="gantt-label" title="${p.name}">
                <strong>${p.id}</strong> - ${p.name}
              </div>
              <div class="gantt-timeline">
                <div class="gantt-bar" style="left:${leftPercent}%;width:${widthPercent}%;background:${barColor};">
                  <span>${p.realProgress}% · ${p.client}</span>
                </div>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

// 4. GASTOS VIEW
function renderExpenses(container) {
  const total = DB.expenses.reduce((acc, e) => acc + e.amount, 0);
  const userIsDev = isDeveloper();

  container.innerHTML = `
    ${!userIsDev ? `
      <div class="mode-banner">
        <div class="mode-banner-content">
          <div class="mode-banner-icon">
            <i class="fa-solid fa-lock"></i>
          </div>
          <div class="mode-banner-text">
            <div class="mode-banner-title">Modo Consulta: Gastos & Adquisiciones</div>
            <div class="mode-banner-sub">Como perfil Usuario puedes revisar compras y facturación. El registro y eliminación de gastos requiere perfil de Desarrollador.</div>
          </div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="switchActiveRole('Desarrollador')">
          <i class="fa-solid fa-code"></i> Modo Desarrollador
        </button>
      </div>
    ` : ""}

    <div class="data-table-container">
      <div class="table-toolbar">
        <div class="toolbar-title-group">
          <h2 style="font-size:18px;font-weight:700;">Gastos & Adquisiciones</h2>
          <span class="badge badge-blue">Total: ${fmtMoney(total)}</span>
        </div>
        <div class="toolbar-actions-group">
          <div class="search-box">
            <i class="fa-solid fa-search search-icon"></i>
            <input type="text" class="search-input" placeholder="Buscar folio, proveedor..." oninput="filterTable('exp-table', this.value)">
          </div>
          <div class="toolbar-btn-group">
            <button class="btn btn-secondary btn-sm" onclick="exportCSV('expenses')"><i class="fa-solid fa-file-export"></i> Exportar</button>
            ${userIsDev ? `
              <button class="btn btn-primary btn-sm" onclick="openCreateModal('expenses')"><i class="fa-solid fa-plus"></i> Registrar Gasto</button>
            ` : ""}
          </div>
        </div>
      </div>
      <div class="table-scroll-hint"><i class="fa-solid fa-arrows-left-right"></i> Desliza horizontalmente para ver más columnas</div>
      <div class="table-responsive">
        <table id="exp-table">
          <thead>
            <tr>
              <th>Folio / Doc</th>
              <th>Proyecto</th>
              <th>Categoría</th>
              <th>Monto</th>
              <th>Proveedor</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Glosa / Detalle</th>
              <th style="text-align:${userIsDev ? 'right' : 'center'};">${userIsDev ? 'Acciones' : 'Permiso'}</th>
            </tr>
          </thead>
          <tbody>
            ${DB.expenses.length === 0 ? `
              <tr>
                <td colspan="9" style="text-align:center;padding:48px 20px;">
                  <i class="fa-solid fa-receipt" style="font-size:32px;color:var(--text-sub);margin-bottom:12px;display:block;"></i>
                  <h3 style="font-size:15px;color:#fff;margin-bottom:6px;">Sin gastos registrados</h3>
                  <p style="color:var(--text-sub);font-size:13px;max-width:400px;margin:0 auto 16px;">Registra compras, facturas, arriendos o adquisiciones reales de tus obras.</p>
                  ${userIsDev ? `
                    <button class="btn btn-primary btn-sm" onclick="openCreateModal('expenses')"><i class="fa-solid fa-plus"></i> Registrar Primer Gasto</button>
                  ` : ""}
                </td>
              </tr>
            ` : DB.expenses.map(e => `
              <tr>
                <td><strong>${e.folio}</strong></td>
                <td>${e.projectId}</td>
                <td><span class="badge badge-gray">${e.category}</span></td>
                <td><strong>${fmtMoney(e.amount)}</strong></td>
                <td>${e.supplier}</td>
                <td>${e.date}</td>
                <td><span class="badge badge-green">${e.status}</span></td>
                <td><small>${e.note || "-"}</small></td>
                <td style="text-align:${userIsDev ? 'right' : 'center'};">
                  ${userIsDev ? `
                    <button class="btn btn-secondary btn-sm" onclick="openEditModal('expenses', '${e.id}')" title="Editar"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="deleteRecord('expenses', '${e.id}')" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
                  ` : `
                    <span class="badge badge-gray" style="font-size:10px;"><i class="fa-solid fa-lock"></i> Solo Lectura</span>
                  `}
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 5. TRABAJADORES VIEW & CONTROL DE HORAS EXTRAS
let activeLaborTab = "nomina"; // "nomina" | "horas_extras"
let activeWorkerStatusFilter = "all"; // "all" | "activo" | "disponible" | "licencia" | "finiquitado"
let preselectedOvertimeWorkerId = null;

function switchLaborTab(tab) {
  activeLaborTab = tab;
  renderCurrentView();
}

function setWorkerStatusFilter(status) {
  activeWorkerStatusFilter = status;
  const pills = document.querySelectorAll(".status-pill-btn");
  pills.forEach(p => {
    p.classList.toggle("active", p.getAttribute("data-status-filter") === status);
  });
  filterWorkersTable();
}

function filterWorkersTable() {
  const searchInput = document.getElementById("wrk-search");
  const prjSelect = document.getElementById("wrk-filter-prj");
  const statusSelect = document.getElementById("wrk-filter-status");

  const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const prj = prjSelect ? prjSelect.value : "";
  const selectStatus = statusSelect ? statusSelect.value.toLowerCase() : "";

  const rows = document.querySelectorAll("#wrk-table tbody tr");
  let visibleCount = 0;

  rows.forEach(row => {
    const rowPrj = row.getAttribute("data-prj") || "";
    const rowStatus = (row.getAttribute("data-status") || "").toLowerCase();
    const text = row.innerText.toLowerCase();

    // Match Project
    const matchPrj = !prj || rowPrj === prj;

    // Match Dropdown Status
    let matchDropdownStatus = true;
    if (selectStatus) {
      matchDropdownStatus = rowStatus.includes(selectStatus);
    }

    // Match Status Pill Filter
    let matchPillStatus = true;
    if (activeWorkerStatusFilter === "activo") {
      matchPillStatus = rowStatus.includes("activo") || rowStatus.includes("faena");
    } else if (activeWorkerStatusFilter === "disponible") {
      matchPillStatus = rowStatus.includes("disponible") || rowStatus.includes("base");
    } else if (activeWorkerStatusFilter === "licencia") {
      matchPillStatus = rowStatus.includes("licencia") || rowStatus.includes("vacaciones") || rowStatus.includes("permiso");
    } else if (activeWorkerStatusFilter === "finiquitado") {
      matchPillStatus = rowStatus.includes("finiquitado") || rowStatus.includes("inactivo") || rowStatus.includes("desvinculado");
    }

    // Match Search Query
    const matchQuery = !query || text.includes(query);

    if (matchPrj && matchDropdownStatus && matchPillStatus && matchQuery) {
      row.style.display = "";
      visibleCount++;
    } else {
      row.style.display = "none";
    }
  });

  const emptyMsg = document.getElementById("wrk-empty-filter-msg");
  if (emptyMsg) {
    emptyMsg.style.display = (visibleCount === 0 && rows.length > 0) ? "block" : "none";
  }
}

function toggleWorkerStatus(id) {
  if (!verifyDeveloperPermission("cambiar el estado del trabajador")) return;
  const worker = (DB.workers || []).find(w => w.id === id);
  if (!worker) return;

  const current = (worker.status || "Activo").toLowerCase();
  let next = "Activo en Obra";
  if (current.includes("activo")) {
    next = "Disponible (En Base)";
  } else if (current.includes("disponible") || current.includes("base")) {
    next = "Licencia Médica";
  } else if (current.includes("licencia") || current.includes("vacaciones")) {
    next = "Finiquitado / No Vigente";
  } else {
    next = "Activo en Obra";
  }

  worker.status = next;
  saveDB();
  renderCurrentView();
}

function openCreateOvertimeForWorker(workerId) {
  preselectedOvertimeWorkerId = workerId;
  openCreateModal("overtime");
}

function filterOvertimeTable() {
  const searchInput = document.getElementById("ovt-search");
  const prjSelect = document.getElementById("ovt-filter-prj");
  const wrkSelect = document.getElementById("ovt-filter-wrk");
  const statusSelect = document.getElementById("ovt-filter-status");

  const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const prj = prjSelect ? prjSelect.value : "";
  const wrk = wrkSelect ? wrkSelect.value : "";
  const status = statusSelect ? statusSelect.value : "";

  const rows = document.querySelectorAll("#ovt-table tbody tr");
  let visibleCount = 0;

  rows.forEach(row => {
    const rowPrj = row.getAttribute("data-prj") || "";
    const rowWrk = row.getAttribute("data-wrk") || "";
    const rowStatus = row.getAttribute("data-status") || "";
    const text = row.innerText.toLowerCase();

    const matchPrj = !prj || rowPrj === prj;
    const matchWrk = !wrk || rowWrk === wrk;
    const matchStatus = !status || rowStatus === status;
    const matchQuery = !query || text.includes(query);

    if (matchPrj && matchWrk && matchStatus && matchQuery) {
      row.style.display = "";
      visibleCount++;
    } else {
      row.style.display = "none";
    }
  });

  const emptyMsg = document.getElementById("ovt-empty-filter-msg");
  if (emptyMsg) {
    emptyMsg.style.display = (visibleCount === 0 && rows.length > 0) ? "block" : "none";
  }
}

function toggleOvertimeStatus(id) {
  if (!verifyDeveloperPermission("cambiar el estado de la hora extra")) return;
  const item = (DB.overtime || []).find(o => o.id === id);
  if (!item) return;

  const cycle = {
    "Aprobado": "Pagado",
    "Pagado": "Pendiente",
    "Pendiente": "Aprobado"
  };
  item.status = cycle[item.status] || "Aprobado";
  saveDB();
  renderCurrentView();
}

function calcWorkerFormTotals() {
  const rateInput = document.getElementById("f_whourly");
  const regHoursInput = document.getElementById("f_whours");
  const ovtHoursInput = document.getElementById("f_wovertime");
  
  if (!rateInput) return;
  const rate = parseCurrencyNumber(rateInput.value) || 0;
  const regHours = Number(regHoursInput ? regHoursInput.value : 0) || 0;
  const ovtHours = Number(ovtHoursInput ? ovtHoursInput.value : 0) || 0;

  const extraRate = Math.round(rate * 1.5);
  const regPay = Math.round(regHours * rate);
  const ovtPay = Math.round(ovtHours * extraRate);
  const totalPay = regPay + ovtPay;

  const extraRateEl = document.getElementById("f_whourly_extra_preview");
  if (extraRateEl) extraRateEl.innerText = `$ ${formatNumberCL(extraRate)}`;

  const regPayEl = document.getElementById("f_w_calc_reg");
  if (regPayEl) regPayEl.innerText = `$ ${formatNumberCL(regPay)}`;

  const ovtPayEl = document.getElementById("f_w_calc_ovt");
  if (ovtPayEl) ovtPayEl.innerText = `$ ${formatNumberCL(ovtPay)}`;

  const totalPayEl = document.getElementById("f_w_calc_total");
  if (totalPayEl) totalPayEl.innerText = `$ ${formatNumberCL(totalPay)}`;
}

function updateOvertimeModalFromWorker(workerId) {
  const worker = (DB.workers || []).find(w => w.id === workerId);
  if (!worker) return;

  const prjSelect = document.getElementById("f_o_prj");
  if (prjSelect && worker.projectId) {
    prjSelect.value = worker.projectId;
  }

  const scheduleInput = document.getElementById("f_o_schedule");
  if (scheduleInput && worker.workSchedule) {
    scheduleInput.value = worker.workSchedule;
  }

  const rateInput = document.getElementById("f_o_rate");
  if (rateInput && worker.hourlyRate) {
    rateInput.value = formatNumberCL(worker.hourlyRate);
    const helper = document.getElementById("f_o_rate_helper");
    if (helper) helper.innerHTML = describeAmountInWords(worker.hourlyRate);
  }

  calcOvertimeFormTotals();
}

function calcOvertimeFormTotals() {
  const rateInput = document.getElementById("f_o_rate");
  const regHoursInput = document.getElementById("f_o_reg_hours");
  const ovtHoursInput = document.getElementById("f_o_hours");

  const rate = parseCurrencyNumber(rateInput ? rateInput.value : 0) || 0;
  const regHours = Number(regHoursInput ? regHoursInput.value : 0) || 0;
  const ovtHours = Number(ovtHoursInput ? ovtHoursInput.value : 0) || 0;

  const extraRate = Math.round(rate * 1.5);
  const ovtTotal = Math.round(ovtHours * extraRate);
  const dayTotal = Math.round((regHours * rate) + ovtTotal);

  const extraRateEl = document.getElementById("f_o_extra_rate_preview");
  if (extraRateEl) extraRateEl.innerText = `$ ${formatNumberCL(extraRate)}`;

  const ovtTotalEl = document.getElementById("f_o_extra_total_preview");
  if (ovtTotalEl) ovtTotalEl.innerText = `$ ${formatNumberCL(ovtTotal)}`;

  const dayTotalEl = document.getElementById("f_o_day_total_preview");
  if (dayTotalEl) dayTotalEl.innerText = `$ ${formatNumberCL(dayTotal)}`;
}

function renderWorkers(container) {
  const userIsDev = isDeveloper();
  const workers = DB.workers || [];
  const overtimeList = DB.overtime || [];

  // Conteo de colaboradores por estado
  const activeCount = workers.filter(w => (w.status || 'Activo').toLowerCase().includes('activo') || (w.status || '').toLowerCase().includes('faena')).length;
  const availableCount = workers.filter(w => (w.status || '').toLowerCase().includes('disponible') || (w.status || '').toLowerCase().includes('base')).length;
  const leaveCount = workers.filter(w => (w.status || '').toLowerCase().includes('licencia') || (w.status || '').toLowerCase().includes('vacaciones') || (w.status || '').toLowerCase().includes('permiso')).length;
  const terminatedCount = workers.filter(w => (w.status || '').toLowerCase().includes('finiquitado') || (w.status || '').toLowerCase().includes('inactivo') || (w.status || '').toLowerCase().includes('desvinculado')).length;

  // Cálculos de nómina
  const totalRegHours = workers.reduce((s, w) => s + (Number(w.hoursWorked) || 0), 0);
  const totalOvtHours = workers.reduce((s, w) => s + (Number(w.overtimeHours) || 0), 0);
  const totalPayroll = workers.reduce((s, w) => {
    const reg = Number(w.hoursWorked) || 0;
    const rate = Number(w.hourlyRate) || 0;
    const ovt = Number(w.overtimeHours) || 0;
    return s + (reg * rate) + Math.round(ovt * rate * 1.5);
  }, 0);

  // Cálculos de horas extras
  const totalOvtHoursSum = overtimeList.reduce((s, o) => s + (Number(o.overtimeHours) || 0), 0);
  const totalOvtPaySum = overtimeList.reduce((s, o) => {
    const amount = Number(o.overtimeTotal) || Math.round((Number(o.overtimeHours) || 0) * ((Number(o.hourlyRate) || 0) * 1.5));
    return s + amount;
  }, 0);
  const uniqueWorkersWithOvt = new Set(overtimeList.map(o => o.workerId)).size;
  const pendingOvtHours = overtimeList.filter(o => o.status === "Pendiente").reduce((s, o) => s + (Number(o.overtimeHours) || 0), 0);
  const pendingOvtRecords = overtimeList.filter(o => o.status === "Pendiente").length;

  container.innerHTML = `
    ${!userIsDev ? `
      <div class="mode-banner">
        <div class="mode-banner-content">
          <div class="mode-banner-icon">
            <i class="fa-solid fa-lock"></i>
          </div>
          <div class="mode-banner-text">
            <div class="mode-banner-title">Modo Consulta: Control de Mano de Obra & Horas Extras</div>
            <div class="mode-banner-sub">Como perfil Usuario puedes revisar las jornadas, dotación, horas normales y horas extras. Para agregar nuevo personal, editar perfiles o quitar colaboradores, ingresa como Desarrollador.</div>
          </div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="switchActiveRole('Desarrollador')">
          <i class="fa-solid fa-code"></i> Modo Desarrollador
        </button>
      </div>
    ` : ""}

    <!-- SELECTOR DE SUBMÓDULO: NÓMINA VS CONTROL DE HORAS EXTRAS -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:12px;border-bottom:1px solid var(--border-color);padding-bottom:12px;">
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn ${activeLaborTab === 'nomina' ? 'btn-primary' : 'btn-secondary'}" onclick="switchLaborTab('nomina')" style="font-size:13px;padding:8px 16px;display:inline-flex;align-items:center;gap:8px;">
          <i class="fa-solid fa-users-gear"></i>
          <span>Ficha & Nómina de Trabajadores</span>
          <span class="badge ${activeLaborTab === 'nomina' ? 'badge-blue' : 'badge-gray'}" style="background:rgba(255,255,255,0.2);color:#fff;font-size:11px;">${workers.length}</span>
        </button>

        <button class="btn ${activeLaborTab === 'horas_extras' ? 'btn-primary' : 'btn-secondary'}" onclick="switchLaborTab('horas_extras')" style="font-size:13px;padding:8px 16px;display:inline-flex;align-items:center;gap:8px;">
          <i class="fa-solid fa-business-time"></i>
          <span>Apartado de Horas Extras & Jornadas</span>
          <span class="badge ${activeLaborTab === 'horas_extras' ? 'badge-orange' : 'badge-gray'}" style="background:rgba(255,255,255,0.2);color:#fff;font-size:11px;">
            ${overtimeList.length} registros (${totalOvtHoursSum} hrs)
          </span>
          ${pendingOvtRecords > 0 ? `
            <span class="badge badge-yellow" style="font-size:10px;padding:2px 6px;" title="${pendingOvtRecords} registros pendientes de aprobación">
              <i class="fa-solid fa-clock"></i> ${pendingOvtRecords} pendientes
            </span>
          ` : ""}
        </button>
      </div>

      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        ${activeLaborTab === 'nomina' ? `
          <button class="btn btn-secondary btn-sm" onclick="exportCSV('workers')" style="font-size:12px;">
            <i class="fa-solid fa-file-export"></i> Exportar Nómina
          </button>
          ${userIsDev ? `
            <button class="btn btn-secondary btn-sm" onclick="openCreateModal('overtime')" style="font-size:12px;" title="Cargar horas extras o turno">
              <i class="fa-solid fa-stopwatch" style="color:var(--primary);"></i> + H. Extra
            </button>
            <button class="btn btn-primary btn-sm" onclick="openCreateModal('workers')" style="font-size:12px;">
              <i class="fa-solid fa-user-plus"></i> Registrar Nuevo Personal
            </button>
          ` : ""}
        ` : `
          <button class="btn btn-secondary btn-sm" onclick="exportCSV('overtime')" style="font-size:12px;">
            <i class="fa-solid fa-file-export"></i> Exportar H. Extras
          </button>
          ${userIsDev ? `
            <button class="btn btn-secondary btn-sm" onclick="openCreateModal('workers')" style="font-size:12px;" title="Registrar nuevo personal en la nómina">
              <i class="fa-solid fa-user-plus" style="color:var(--blue-accent);"></i> + Nuevo Personal
            </button>
            <button class="btn btn-primary btn-sm" onclick="openCreateModal('overtime')" style="font-size:12px;">
              <i class="fa-solid fa-plus"></i> Registrar Horas Extras
            </button>
          ` : ""}
        `}
      </div>
    </div>

    ${activeLaborTab === 'nomina' ? `
      <!-- SUBMÓDULO 1: FICHA Y NÓMINA DE TRABAJADORES -->
      <div class="stats-grid" style="margin-bottom:18px;">
        <div class="stat-card">
          <div class="stat-label"><i class="fa-solid fa-users" style="color:var(--primary);margin-right:6px;"></i> Base de Datos Personal</div>
          <div class="stat-value">${workers.length} <span style="font-size:13px;color:var(--text-muted);">registrados</span></div>
          <div class="stat-sub" style="color:var(--secondary);font-weight:600;"><i class="fa-solid fa-hard-hat"></i> ${activeCount} en obra &bull; ${availableCount} en base</div>
        </div>
        <div class="stat-card">
          <div class="stat-label"><i class="fa-solid fa-calendar-check" style="color:var(--blue-accent);margin-right:6px;"></i> Horas Ordinarias Período</div>
          <div class="stat-value">${totalRegHours.toLocaleString('es-CL')} <span style="font-size:14px;color:var(--text-muted);">hrs</span></div>
          <div class="stat-sub">Jornadas base pactadas</div>
        </div>
        <div class="stat-card">
          <div class="stat-label"><i class="fa-solid fa-stopwatch" style="color:var(--warning);margin-right:6px;"></i> Total Horas Extras</div>
          <div class="stat-value" style="color:var(--warning);">${totalOvtHours.toLocaleString('es-CL')} <span style="font-size:14px;color:var(--text-muted);">hrs</span></div>
          <div class="stat-sub" style="color:#fbbf24;"><i class="fa-solid fa-bolt"></i> Recargo legal Art. 32 (+50%)</div>
        </div>
        <div class="stat-card">
          <div class="stat-label"><i class="fa-solid fa-sack-dollar" style="color:var(--secondary);margin-right:6px;"></i> Nómina / Mano de Obra Estimada</div>
          <div class="stat-value" style="color:var(--secondary);font-size:20px;">$ ${formatNumberCL(totalPayroll)}</div>
          <div class="stat-sub" style="color:var(--text-sub);">Base ordinaria + Sobretiempo</div>
        </div>
      </div>

      <!-- FILTRO DE ESTADO / CONTROL DE DOTACIÓN (EN OBRA VS EN BASE) -->
      <div class="status-pill-bar">
        <button class="status-pill-btn ${activeWorkerStatusFilter === 'all' ? 'active' : ''}" data-status-filter="all" onclick="setWorkerStatusFilter('all')">
          <i class="fa-solid fa-users"></i> Todos los Colaboradores <span class="pill-count">${workers.length}</span>
        </button>
        <button class="status-pill-btn ${activeWorkerStatusFilter === 'activo' ? 'active' : ''}" data-status-filter="activo" onclick="setWorkerStatusFilter('activo')">
          <i class="fa-solid fa-hard-hat" style="color:var(--secondary);"></i> En Faena / Activos en Obra <span class="pill-count">${activeCount}</span>
        </button>
        <button class="status-pill-btn ${activeWorkerStatusFilter === 'disponible' ? 'active' : ''}" data-status-filter="disponible" onclick="setWorkerStatusFilter('disponible')">
          <i class="fa-solid fa-circle-check" style="color:var(--blue-accent);"></i> Disponibles en Base <span class="pill-count">${availableCount}</span>
        </button>
        <button class="status-pill-btn ${activeWorkerStatusFilter === 'licencia' ? 'active' : ''}" data-status-filter="licencia" onclick="setWorkerStatusFilter('licencia')">
          <i class="fa-solid fa-kit-medical" style="color:var(--warning);"></i> Licencia Médica / Permiso <span class="pill-count">${leaveCount}</span>
        </button>
        <button class="status-pill-btn ${activeWorkerStatusFilter === 'finiquitado' ? 'active' : ''}" data-status-filter="finiquitado" onclick="setWorkerStatusFilter('finiquitado')">
          <i class="fa-solid fa-user-slash" style="color:var(--danger);"></i> Finiquitados / No en Obra <span class="pill-count">${terminatedCount}</span>
        </button>
      </div>

      <div class="data-table-container">
        <div class="table-toolbar">
          <div class="toolbar-title-group">
            <h2 style="font-size:16px;font-weight:700;">Control Individual de Personal & Nómina</h2>
            <span class="badge badge-orange">${workers.length} en Base de Datos</span>
          </div>
          <div class="toolbar-actions-group">
            <div class="search-box">
              <i class="fa-solid fa-search search-icon"></i>
              <input type="text" id="wrk-search" class="search-input" placeholder="Buscar trabajador, RUT, especialidad, faena..." oninput="filterWorkersTable()">
            </div>

            <div class="toolbar-filters-row">
              <select id="wrk-filter-prj" onchange="filterWorkersTable()" class="form-control" style="font-size:12px;padding:4px 8px;height:34px;">
                <option value="">Todos los Proyectos</option>
                <option value="General">Sin Asignar / En Base</option>
                ${DB.projects.map(p => `<option value="${p.id}">${p.id} - ${p.name.slice(0, 18)}...</option>`).join("")}
              </select>

              <select id="wrk-filter-status" onchange="filterWorkersTable()" class="form-control" style="font-size:12px;padding:4px 8px;height:34px;">
                <option value="">Todos los Estados</option>
                <option value="activo">Activo en Obra</option>
                <option value="disponible">Disponible (En Base)</option>
                <option value="licencia">Licencia Médica</option>
                <option value="finiquitado">Finiquitado / No Vigente</option>
              </select>
            </div>

            <div class="toolbar-btn-group">
              ${userIsDev ? `
                <button class="btn btn-primary btn-sm" onclick="openCreateModal('workers')" title="Registrar nuevo personal en la nómina">
                  <i class="fa-solid fa-user-plus"></i> + Nuevo Personal
                </button>
              ` : ""}
            </div>
          </div>
        </div>
        <div class="table-scroll-hint"><i class="fa-solid fa-arrows-left-right"></i> Desliza horizontalmente para ver las 12 columnas de información</div>
        <div class="table-responsive">
        <table id="wrk-table">
          <thead>
            <tr>
              <th>RUT / DNI</th>
              <th>Colaborador</th>
              <th>Especialidad / Cargo</th>
              <th>Proyecto Asignado</th>
              <th>Jornada / Turno</th>
              <th>Tarifa Base & Extra</th>
              <th style="text-align:center;">Horas Ord.</th>
              <th style="text-align:center;">Horas Extras</th>
              <th style="text-align:right;">Total a Pagar</th>
              <th>Examen Médico</th>
              <th>Estado Operativo</th>
              <th style="text-align:right;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${workers.length === 0 ? `
              <tr>
                <td colspan="12" style="text-align:center;padding:48px 20px;">
                  <i class="fa-solid fa-users" style="font-size:32px;color:var(--text-sub);margin-bottom:12px;display:block;"></i>
                  <h3 style="font-size:15px;color:#fff;margin-bottom:6px;">Sin personal registrado en la base de datos</h3>
                  <p style="color:var(--text-sub);font-size:13px;max-width:420px;margin:0 auto 16px;">Agrega a tus colaboradores, técnicos, soldadores y personal de terreno para gestionar sus turnos y tarifas.</p>
                  ${userIsDev ? `
                    <button class="btn btn-primary btn-sm" onclick="openCreateModal('workers')"><i class="fa-solid fa-user-plus"></i> Registrar Primer Personal</button>
                  ` : ""}
                </td>
              </tr>
            ` : workers.map(w => {
              const isExp = new Date(w.medExamExpiry) < new Date();
              const regHours = Number(w.hoursWorked) || 0;
              const ovtHours = Number(w.overtimeHours) || 0;
              const rate = Number(w.hourlyRate) || 0;
              const extraRate = Math.round(rate * 1.5);
              const regPay = regHours * rate;
              const ovtPay = Math.round(ovtHours * extraRate);
              const totalEstPay = regPay + ovtPay;

              const statusLower = (w.status || 'Activo').toLowerCase();
              let statusBadgeClass = 'badge-green';
              let statusIcon = 'fa-hard-hat';
              if (statusLower.includes('disponible') || statusLower.includes('base')) {
                statusBadgeClass = 'badge-blue';
                statusIcon = 'fa-circle-check';
              } else if (statusLower.includes('licencia') || statusLower.includes('vacaciones')) {
                statusBadgeClass = 'badge-yellow';
                statusIcon = 'fa-kit-medical';
              } else if (statusLower.includes('finiquitado') || statusLower.includes('inactivo') || statusLower.includes('desvinculado')) {
                statusBadgeClass = 'badge-red';
                statusIcon = 'fa-user-slash';
              }

              const isUnassigned = !w.projectId || w.projectId === 'General' || w.projectId === 'Sin Asignar';

              return `
                <tr data-prj="${w.projectId || 'General'}" data-status="${w.status || 'Activo'}">
                  <td><strong>${w.rut}</strong></td>
                  <td>
                    <div style="font-weight:700;color:#fff;">${w.name}</div>
                    <small style="color:var(--text-muted);"><i class="fa-solid fa-phone" style="font-size:10px;"></i> ${w.phone || 'Sin tel.'}</small>
                  </td>
                  <td>
                    <div style="font-weight:600;color:var(--text-main);">${w.role}</div>
                    <small style="color:var(--text-muted);font-size:11px;">${w.certifications || 'Sin cert.'}</small>
                  </td>
                  <td>
                    ${isUnassigned ? `
                      <span class="badge badge-gray" style="font-size:11px;color:var(--text-sub);border:1px solid rgba(255,255,255,0.1);">
                        <i class="fa-solid fa-warehouse"></i> En Base
                      </span>
                    ` : `
                      <span class="badge badge-blue">${w.projectId}</span>
                    `}
                  </td>
                  <td>
                    <span style="display:inline-flex;align-items:center;gap:5px;font-size:12px;color:var(--text-main);background:rgba(255,255,255,0.04);padding:3px 8px;border-radius:6px;border:1px solid rgba(255,255,255,0.08);white-space:nowrap;">
                      <i class="fa-solid fa-business-time" style="color:var(--blue-accent);font-size:11px;"></i>
                      ${w.workSchedule || '40 hrs/semana'}
                    </span>
                  </td>
                  <td>
                    <div style="font-weight:700;color:var(--text-main);">$ ${formatNumberCL(rate)} <span style="font-size:10px;color:var(--text-muted);">/ hr</span></div>
                    <small style="color:var(--primary);font-size:10.5px;font-weight:600;">
                      <i class="fa-solid fa-arrow-trend-up"></i> Extra: $ ${formatNumberCL(extraRate)}
                    </small>
                  </td>
                  <td style="text-align:center;">
                    <strong style="color:#fff;font-size:13px;">${regHours}</strong>
                    <div style="font-size:10px;color:var(--text-muted);">hrs ord.</div>
                  </td>
                  <td style="text-align:center;">
                    ${ovtHours > 0 ? `
                      <span class="badge badge-orange" style="font-weight:700;font-size:11px;" title="Horas extras con 50% recargo legal">
                        <i class="fa-solid fa-stopwatch"></i> +${ovtHours} hrs
                      </span>
                    ` : `
                      <span style="color:var(--text-muted);font-size:12px;">0 hrs</span>
                    `}
                  </td>
                  <td style="text-align:right;">
                    <div style="font-weight:800;color:var(--secondary);font-size:13px;">$ ${formatNumberCL(totalEstPay)}</div>
                    <div style="font-size:10px;color:var(--text-muted);" title="Base: $${formatNumberCL(regPay)} | Extras: $${formatNumberCL(ovtPay)}">
                      Base: $${formatNumberCL(regPay)}
                    </div>
                  </td>
                  <td>
                    <span class="badge ${isExp ? 'badge-red' : 'badge-green'}" style="font-size:11px;" title="Vencimiento Examen Ocupacional">
                      <i class="fa-solid ${isExp ? 'fa-triangle-exclamation' : 'fa-circle-check'}"></i> ${w.medExamExpiry || 'Al día'}
                    </span>
                  </td>
                  <td>
                    <button class="badge ${statusBadgeClass}" onclick="${userIsDev ? `toggleWorkerStatus('${w.id}')` : ''}" style="border:none;cursor:${userIsDev ? 'pointer' : 'default'};font-size:11px;" title="${userIsDev ? 'Clic para alternar estado de dotación' : ''}">
                      <i class="fa-solid ${statusIcon}"></i> ${w.status || 'Activo en Obra'} ${userIsDev ? '<i class="fa-solid fa-rotate" style="font-size:9px;margin-left:3px;opacity:0.7;"></i>' : ''}
                    </button>
                  </td>
                  <td style="text-align:right;white-space:nowrap;">
                    ${userIsDev ? `
                      <button class="btn btn-secondary btn-sm" onclick="openCreateOvertimeForWorker('${w.id}')" title="Cargar Horas Extras o Turno a este colaborador" style="font-size:11px;padding:4px 8px;margin-right:2px;color:var(--primary);border-color:rgba(249,115,22,0.3);">
                        <i class="fa-solid fa-plus"></i> H. Extra
                      </button>
                      <button class="btn btn-secondary btn-sm" onclick="openEditModal('workers', '${w.id}')" title="Editar Perfil del Trabajador"><i class="fa-solid fa-pen"></i></button>
                      <button class="btn btn-danger btn-sm" onclick="deleteRecord('workers', '${w.id}')" title="Quitar Personal de la Base de Datos"><i class="fa-solid fa-trash"></i></button>
                    ` : `
                      <button class="btn btn-secondary btn-sm" onclick="switchLaborTab('horas_extras')" title="Ver horas extras">
                        <i class="fa-solid fa-eye"></i> Detalle
                      </button>
                    `}
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
        </div>
        <div id="wrk-empty-filter-msg" style="display:none;padding:24px;text-align:center;color:var(--text-muted);font-size:13px;">
          <i class="fa-solid fa-filter-circle-xmark" style="font-size:24px;margin-bottom:8px;color:var(--text-sub);display:block;"></i>
          No se encontraron colaboradores con los filtros seleccionados.
        </div>
      </div>
    ` : `
      <!-- SUBMÓDULO 2: APARTADO DE CONTROL DE HORAS EXTRAS Y JORNADAS -->
      <div class="stats-grid" style="margin-bottom:18px;">
        <div class="stat-card">
          <div class="stat-label"><i class="fa-solid fa-stopwatch" style="color:var(--warning);margin-right:6px;"></i> Total Horas Extras Faena</div>
          <div class="stat-value" style="color:var(--warning);">${totalOvtHoursSum.toFixed(1)} <span style="font-size:14px;color:var(--text-muted);">hrs</span></div>
          <div class="stat-sub" style="color:var(--text-main);">${overtimeList.length} faenas registradas</div>
        </div>
        <div class="stat-card">
          <div class="stat-label"><i class="fa-solid fa-hand-holding-dollar" style="color:var(--secondary);margin-right:6px;"></i> Costo Total Horas Extras (+50%)</div>
          <div class="stat-value" style="color:var(--secondary);font-size:20px;">$ ${formatNumberCL(totalOvtPaySum)}</div>
          <div class="stat-sub" style="color:var(--text-sub);"><i class="fa-solid fa-scale-balanced"></i> Recargo legal Art. 32 aplicado</div>
        </div>
        <div class="stat-card">
          <div class="stat-label"><i class="fa-solid fa-users" style="color:var(--blue-accent);margin-right:6px;"></i> Personal con Horas Extras</div>
          <div class="stat-value">${uniqueWorkersWithOvt} <span style="font-size:13px;color:var(--text-muted);">/ ${workers.length} trab.</span></div>
          <div class="stat-sub">Colaboradores con sobretiempo</div>
        </div>
        <div class="stat-card">
          <div class="stat-label"><i class="fa-solid fa-hourglass-half" style="color:#f59e0b;margin-right:6px;"></i> Horas Pendientes de Aprobación</div>
          <div class="stat-value" style="color:#f59e0b;">${pendingOvtHours.toFixed(1)} <span style="font-size:14px;color:var(--text-muted);">hrs</span></div>
          <div class="stat-sub">${pendingOvtRecords} turnos por validar</div>
        </div>
      </div>

      <div class="data-table-container">
        <div class="table-toolbar">
          <div class="toolbar-title-group">
            <h2 style="font-size:16px;font-weight:700;">Libro Diario de Horas Extras & Jornadas</h2>
            <span class="badge badge-orange">${overtimeList.length} Registros</span>
          </div>

          <!-- FILTROS AVANZADOS -->
          <div class="toolbar-actions-group">
            <div class="search-box">
              <i class="fa-solid fa-search search-icon"></i>
              <input type="text" id="ovt-search" class="search-input" placeholder="Buscar trabajador, RUT, faena..." oninput="filterOvertimeTable()">
            </div>

            <div class="toolbar-filters-row">
              <select id="ovt-filter-prj" onchange="filterOvertimeTable()" class="form-control" style="font-size:12px;padding:4px 8px;height:34px;">
                <option value="">Todos los Proyectos</option>
                ${DB.projects.map(p => `<option value="${p.id}">${p.id} - ${p.name.slice(0, 18)}...</option>`).join("")}
              </select>

              <select id="ovt-filter-wrk" onchange="filterOvertimeTable()" class="form-control" style="font-size:12px;padding:4px 8px;height:34px;">
                <option value="">Todos los Trabajadores</option>
                ${workers.map(w => `<option value="${w.id}">${w.name}</option>`).join("")}
              </select>

              <select id="ovt-filter-status" onchange="filterOvertimeTable()" class="form-control" style="font-size:12px;padding:4px 8px;height:34px;">
                <option value="">Todos Estados</option>
                <option value="Aprobado">Aprobado</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Pagado">Pagado</option>
              </select>
            </div>

            <div class="toolbar-btn-group">
              <button class="btn btn-secondary btn-sm" onclick="exportCSV('overtime')">
                <i class="fa-solid fa-file-export"></i> CSV
              </button>

              ${userIsDev ? `
                <button class="btn btn-secondary btn-sm" onclick="openCreateModal('workers')" title="Registrar nuevo personal en la nómina">
                  <i class="fa-solid fa-user-plus" style="color:var(--blue-accent);"></i> + Nuevo Personal
                </button>
                <button class="btn btn-primary btn-sm" onclick="openCreateModal('overtime')">
                  <i class="fa-solid fa-plus"></i> Registrar Horas Extras
                </button>
              ` : ""}
            </div>
          </div>
        </div>

        <div class="table-scroll-hint"><i class="fa-solid fa-arrows-left-right"></i> Desliza horizontalmente para ver el detalle de tarifas y turnos</div>
        <div class="table-responsive">
        <table id="ovt-table">
          <thead>
            <tr>
              <th>Fecha Turno</th>
              <th>Colaborador</th>
              <th>Proyecto</th>
              <th>Jornada / Turno</th>
              <th style="text-align:center;">Horas Ord.</th>
              <th style="text-align:center;">Horas Extras</th>
              <th>Tarifa Base</th>
              <th>Tarifa Extra (+50%)</th>
              <th style="text-align:right;">Monto H. Extras</th>
              <th style="text-align:right;">Total Turno</th>
              <th>Motivo / Faena Extraordinaria</th>
              <th>Supervisor</th>
              <th style="text-align:center;">Estado</th>
              <th style="text-align:right;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${overtimeList.length === 0 ? `
              <tr>
                <td colspan="14" style="text-align:center;padding:48px 20px;">
                  <i class="fa-solid fa-business-time" style="font-size:32px;color:var(--text-sub);margin-bottom:12px;display:block;"></i>
                  <h3 style="font-size:15px;color:#fff;margin-bottom:6px;">Sin horas extras registradas</h3>
                  <p style="color:var(--text-sub);font-size:13px;max-width:420px;margin:0 auto 16px;">Registra sobretiempos, turnos especiales o faenas extraordinarias para calcular la remuneración con recargo legal.</p>
                  ${userIsDev ? `
                    <button class="btn btn-primary btn-sm" onclick="openCreateModal('overtime')"><i class="fa-solid fa-plus"></i> Registrar Primera Hora Extra</button>
                  ` : ""}
                </td>
              </tr>
            ` : overtimeList.map(o => {
              const worker = workers.find(w => w.id === o.workerId);
              const baseRate = Number(o.hourlyRate) || (worker ? Number(worker.hourlyRate) || 0 : 0);
              const extraRate = o.overtimeRate || Math.round(baseRate * 1.5);
              const ovtTotal = o.overtimeTotal || Math.round((Number(o.overtimeHours) || 0) * extraRate);
              const dayTotal = o.totalDayPay || Math.round(((Number(o.regularHours) || 0) * baseRate) + ovtTotal);

              const statusBadgeClass = o.status === "Aprobado" 
                ? "badge-green" 
                : (o.status === "Pagado" ? "badge-blue" : "badge-yellow");

              return `
                <tr data-prj="${o.projectId}" data-wrk="${o.workerId}" data-status="${o.status}">
                  <td>
                    <div style="font-weight:700;color:#fff;white-space:nowrap;">
                      <i class="fa-solid fa-calendar-day" style="color:var(--primary);font-size:11px;margin-right:4px;"></i>
                      ${o.date}
                    </div>
                    <small style="color:var(--text-muted);font-size:10px;">ID: ${o.id}</small>
                  </td>
                  <td>
                    <div style="font-weight:700;color:var(--text-main);">${worker ? worker.name : (o.workerId || 'N/A')}</div>
                    <small style="color:var(--text-muted);">${worker ? worker.rut : ''} &bull; ${worker ? worker.role : ''}</small>
                  </td>
                  <td><span class="badge badge-blue">${o.projectId}</span></td>
                  <td>
                    <span style="font-size:11px;color:var(--text-sub);white-space:nowrap;">
                      ${o.workSchedule || (worker ? worker.workSchedule : 'Turno Estándar')}
                    </span>
                  </td>
                  <td style="text-align:center;">
                    <strong style="color:var(--text-main);">${o.regularHours || 0}</strong> <small style="color:var(--text-muted);">hrs</small>
                  </td>
                  <td style="text-align:center;">
                    <span class="badge badge-orange" style="font-weight:700;font-size:12px;">
                      <i class="fa-solid fa-stopwatch"></i> +${o.overtimeHours} hrs
                    </span>
                  </td>
                  <td>
                    <div style="font-weight:600;color:var(--text-main);">$ ${formatNumberCL(baseRate)}</div>
                    <small style="color:var(--text-muted);font-size:10px;">/ hr ord.</small>
                  </td>
                  <td>
                    <div style="font-weight:700;color:var(--primary);">$ ${formatNumberCL(extraRate)}</div>
                    <small style="color:var(--warning);font-size:10px;font-weight:600;">+50% legal</small>
                  </td>
                  <td style="text-align:right;">
                    <strong style="color:var(--warning);font-size:13px;">$ ${formatNumberCL(ovtTotal)}</strong>
                  </td>
                  <td style="text-align:right;">
                    <strong style="color:var(--secondary);font-size:13px;">$ ${formatNumberCL(dayTotal)}</strong>
                  </td>
                  <td style="max-width:200px;">
                    <div style="font-size:12px;color:var(--text-main);line-height:1.4;">${o.reason || '-'}</div>
                  </td>
                  <td>
                    <small style="color:var(--text-sub);"><i class="fa-solid fa-user-shield" style="font-size:10px;"></i> ${o.supervisor || 'Residente'}</small>
                  </td>
                  <td style="text-align:center;">
                    <button class="badge ${statusBadgeClass}" onclick="${userIsDev ? `toggleOvertimeStatus('${o.id}')` : ''}" style="border:none;cursor:${userIsDev ? 'pointer' : 'default'};font-size:11px;" title="${userIsDev ? 'Clic para cambiar estado' : ''}">
                      ${o.status || 'Aprobado'} ${userIsDev ? '<i class="fa-solid fa-rotate" style="font-size:9px;margin-left:3px;opacity:0.7;"></i>' : ''}
                    </button>
                  </td>
                  <td style="text-align:right;white-space:nowrap;">
                    ${userIsDev ? `
                      <button class="btn btn-secondary btn-sm" onclick="openEditModal('overtime', '${o.id}')" title="Editar"><i class="fa-solid fa-pen"></i></button>
                      <button class="btn btn-danger btn-sm" onclick="deleteRecord('overtime', '${o.id}')" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
                    ` : `
                      <span class="badge badge-gray" style="font-size:10px;"><i class="fa-solid fa-lock"></i> Consulta</span>
                    `}
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
        </div>
        <div id="ovt-empty-filter-msg" style="display:none;padding:24px;text-align:center;color:var(--text-muted);font-size:13px;">
          <i class="fa-solid fa-filter-circle-xmark" style="font-size:24px;margin-bottom:8px;color:var(--text-sub);display:block;"></i>
          No se encontraron registros de horas extras con los filtros seleccionados.
        </div>
      </div>
    `}
  `;
}

// 6. HERRAMIENTAS VIEW
function renderTools(container) {
  const userIsDev = isDeveloper();

  container.innerHTML = `
    ${!userIsDev ? `
      <div class="mode-banner">
        <div class="mode-banner-content">
          <div class="mode-banner-icon">
            <i class="fa-solid fa-lock"></i>
          </div>
          <div class="mode-banner-text">
            <div class="mode-banner-title">Modo Consulta: Inventario de Maquinaria</div>
            <div class="mode-banner-sub">Como perfil Usuario puedes ver la asignación y calibración de equipos. Para ingresar o dar de baja equipos, ingresa como Desarrollador.</div>
          </div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="switchActiveRole('Desarrollador')">
          <i class="fa-solid fa-code"></i> Modo Desarrollador
        </button>
      </div>
    ` : ""}

    <div class="data-table-container">
      <div class="table-toolbar">
        <div class="toolbar-title-group">
          <h2 style="font-size:18px;font-weight:700;">Inventario de Herramientas & Maquinaria</h2>
          <span class="badge badge-orange">${DB.tools.length} Equipos</span>
        </div>
        <div class="toolbar-actions-group">
          <div class="search-box">
            <i class="fa-solid fa-search search-icon"></i>
            <input type="text" class="search-input" placeholder="Buscar tag, marca, equipo..." oninput="filterTable('tool-table', this.value)">
          </div>
          <div class="toolbar-btn-group">
            <button class="btn btn-secondary btn-sm" onclick="exportCSV('tools')"><i class="fa-solid fa-file-export"></i> Exportar</button>
            ${userIsDev ? `
              <button class="btn btn-primary btn-sm" onclick="openCreateModal('tools')"><i class="fa-solid fa-plus"></i> Añadir Equipo</button>
            ` : ""}
          </div>
        </div>
      </div>
      <div class="table-scroll-hint"><i class="fa-solid fa-arrows-left-right"></i> Desliza horizontalmente para ver las especificaciones y estado</div>
      <div class="table-responsive">
      <table id="tool-table">
        <thead>
          <tr>
            <th style="width:52px;text-align:center;">Foto</th>
            <th>Tag / Código</th>
            <th>Equipo & Marca</th>
            <th>Nº Serie</th>
            <th>Ubicación / Proyecto</th>
            <th>Responsable</th>
            <th>Última Mantención</th>
            <th>Próxima Mantención</th>
            <th>Estado</th>
            <th style="text-align:${userIsDev ? 'right' : 'center'};">${userIsDev ? 'Acciones' : 'Permiso'}</th>
          </tr>
        </thead>
        <tbody>
          ${DB.tools.length === 0 ? `
            <tr>
              <td colspan="10" style="text-align:center;padding:48px 20px;">
                <i class="fa-solid fa-toolbox" style="font-size:32px;color:var(--text-sub);margin-bottom:12px;display:block;"></i>
                <h3 style="font-size:15px;color:#fff;margin-bottom:6px;">Sin herramientas ni maquinaria registradas</h3>
                <p style="color:var(--text-sub);font-size:13px;max-width:400px;margin:0 auto 16px;">Ingresa tus equipos, generadores, máquinas de soldar y herramientas calibradas.</p>
                ${userIsDev ? `
                  <button class="btn btn-primary btn-sm" onclick="openCreateModal('tools')"><i class="fa-solid fa-plus"></i> Añadir Primer Equipo</button>
                ` : ""}
              </td>
            </tr>
          ` : DB.tools.map(t => {
            const isDue = new Date(t.nextMaintenance) < new Date();
            return `
              <tr>
                <td style="text-align:center;">
                  ${t.photo ? `
                    <div onclick="openToolPhotoViewer('${t.id}')" title="Ver fotografía del equipo" style="width:40px;height:40px;border-radius:6px;overflow:hidden;border:1px solid var(--border-color);background:#080c14;margin:0 auto;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform 0.15s ease;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                      <img src="${t.photo}" alt="${t.name}" style="width:100%;height:100%;object-fit:cover;">
                    </div>
                  ` : `
                    <div style="width:40px;height:40px;border-radius:6px;border:1px dashed var(--border-color);background:rgba(255,255,255,0.02);margin:0 auto;display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:13px;" title="Sin fotografía registrada">
                      <i class="fa-solid fa-camera" style="opacity:0.35;"></i>
                    </div>
                  `}
                </td>
                <td><strong>${t.code}</strong></td>
                <td><strong>${t.name}</strong><br><small style="color:var(--text-sub);">${t.brand}</small></td>
                <td><small>${t.serialNumber}</small></td>
                <td><span class="badge badge-blue">${t.projectId}</span></td>
                <td>${t.responsible}</td>
                <td>${t.lastMaintenance}</td>
                <td><span class="badge ${isDue ? 'badge-red' : 'badge-green'}">${t.nextMaintenance}</span></td>
                <td><span class="badge ${t.status === 'En Faena' ? 'badge-green' : 'badge-yellow'}">${t.status}</span></td>
                <td style="text-align:${userIsDev ? 'right' : 'center'};">
                  ${userIsDev ? `
                    <button class="btn btn-secondary btn-sm" onclick="openEditModal('tools', '${t.id}')" title="Editar"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="deleteRecord('tools', '${t.id}')" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
                  ` : `
                    <span class="badge badge-gray" style="font-size:10px;"><i class="fa-solid fa-lock"></i> Solo Lectura</span>
                  `}
                </td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
      </div>
    </div>
  `;
}

// 7. DOCUMENTOS VIEW
function renderDocuments(container) {
  const userIsDev = isDeveloper();

  container.innerHTML = `
    ${!userIsDev ? `
      <div class="mode-banner">
        <div class="mode-banner-content">
          <div class="mode-banner-icon">
            <i class="fa-solid fa-lock"></i>
          </div>
          <div class="mode-banner-text">
            <div class="mode-banner-title">Modo Consulta: Control Documental & Facturación</div>
            <div class="mode-banner-sub">Como perfil Usuario puedes verificar vigencias, facturas/boletas asociadas a proyectos y carpetas de calidad. La carga y modificación requiere perfil Desarrollador.</div>
          </div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="switchActiveRole('Desarrollador')">
          <i class="fa-solid fa-code"></i> Modo Desarrollador
        </button>
      </div>
    ` : ""}

    <!-- Banner de Registro Rápido de Facturas & Documentos -->
    <div class="feature-banner">
      <div class="feature-banner-left">
        <div class="feature-banner-icon">
          <i class="fa-solid fa-receipt"></i>
        </div>
        <div>
          <div class="feature-banner-title">Registro Directo de Facturas, Boletas & Documentos</div>
          <div class="feature-banner-sub">Toma la foto con la cámara en vivo o sube el archivo (PDF/imagen), asociándolo al proyecto con su fecha y monto.</div>
        </div>
      </div>
      ${userIsDev ? `
        <button class="btn btn-primary" onclick="openCreateModal('documents')">
          <i class="fa-solid fa-camera"></i> Subir Foto Factura / Boleta
        </button>
      ` : ""}
    </div>

    <div class="data-table-container">
      <div class="table-toolbar">
        <div class="toolbar-title-group">
          <h2 style="font-size:18px;font-weight:700;">Control Documental & Facturación</h2>
          <span class="badge badge-orange">${DB.documents.length} Registros</span>
        </div>
        <div class="toolbar-actions-group">
          <div class="search-box">
            <i class="fa-solid fa-search search-icon"></i>
            <input type="text" id="doc-search-input" class="search-input" placeholder="Buscar por folio, glosa, emisor, fecha..." oninput="applyDocFilters()">
          </div>
          <div class="toolbar-filters-row">
            <select id="doc-prj-filter" class="form-control" style="font-size:12px;height:34px;" onchange="applyDocFilters()">
              <option value="">Todos los Proyectos</option>
              ${DB.projects.map(p => `<option value="${p.id}">${p.id} - ${p.name}</option>`).join("")}
              <option value="General">General / Corporativo</option>
            </select>
            <select id="doc-type-filter" class="form-control" style="font-size:12px;height:34px;" onchange="applyDocFilters()">
              <option value="">Todos los Tipos</option>
              <option value="facturas">Facturas y Boletas</option>
              <option value="tecnicos">Técnicos / QA / HSE</option>
            </select>
          </div>
          <div class="toolbar-btn-group">
            <button class="btn btn-secondary btn-sm" onclick="exportCSV('documents')"><i class="fa-solid fa-file-export"></i> Exportar</button>
            ${userIsDev ? `
              <button class="btn btn-primary btn-sm" onclick="openCreateModal('documents')"><i class="fa-solid fa-plus"></i> Registrar Documento</button>
            ` : ""}
          </div>
        </div>
      </div>
      <div class="table-scroll-hint"><i class="fa-solid fa-arrows-left-right"></i> Desliza horizontalmente para ver las fotos y montos</div>
      <div class="table-responsive">
      <table id="doc-table">
        <thead>
          <tr>
            <th>Código / Folio</th>
            <th>Glosa / Título</th>
            <th>Tipo</th>
            <th>Proyecto Asociado</th>
            <th>Fecha</th>
            <th style="text-align:right;">Monto ($)</th>
            <th style="text-align:center;">Foto / Documento</th>
            <th>Estado</th>
            <th style="text-align:${userIsDev ? 'right' : 'center'};">${userIsDev ? 'Acciones' : 'Permiso'}</th>
          </tr>
        </thead>
        <tbody>
          ${DB.documents.length === 0 ? `
            <tr>
              <td colspan="9" style="text-align:center;padding:48px 20px;">
                <i class="fa-solid fa-folder-open" style="font-size:32px;color:var(--text-sub);margin-bottom:12px;display:block;"></i>
                <h3 style="font-size:15px;color:#fff;margin-bottom:6px;">Sin documentos ni facturas registradas</h3>
                <p style="color:var(--text-sub);font-size:13px;max-width:400px;margin:0 auto 16px;">Sube procedimientos de trabajo seguro, carpetas de calidad, boletas de garantía o fotos de facturas asociadas a tus proyectos.</p>
                ${userIsDev ? `
                  <button class="btn btn-primary btn-sm" onclick="openCreateModal('documents')"><i class="fa-solid fa-plus"></i> Registrar Primer Documento</button>
                ` : ""}
              </td>
            </tr>
          ` : DB.documents.map(d => {
            const prj = DB.projects.find(p => p.id === d.projectId);
            const isInvoice = (d.type && (d.type.includes("Factura") || d.type.includes("Boleta"))) || Boolean(d.invoiceFolio);
            const isExp = d.expiryDate ? new Date(d.expiryDate) < new Date() : false;
            const hasFile = Boolean(d.fileData || d.photo);
            const isPdf = d.fileType === "pdf" || (d.fileData && d.fileData.startsWith("data:application/pdf"));
            return `
              <tr data-prj="${d.projectId || ''}" data-type="${(d.type || '').toLowerCase()}" data-has-invoice="${isInvoice ? 'true' : 'false'}">
                <td>
                  ${isInvoice ? `
                    <span class="badge badge-orange" style="font-family:monospace;font-size:12px;">
                      <i class="fa-solid fa-file-invoice-dollar"></i> ${d.code}
                    </span>
                  ` : `
                    <strong style="font-family:monospace;font-size:12px;">${d.code}</strong>
                  `}
                </td>
                <td>
                  <strong>${d.name}</strong>
                  ${d.supplier ? `
                    <div style="font-size:11px;color:var(--text-sub);margin-top:2px;">
                      <i class="fa-solid fa-building" style="font-size:10px;"></i> ${d.supplier}
                    </div>
                  ` : ""}
                </td>
                <td>
                  <span class="badge ${isInvoice ? 'badge-yellow' : (d.type && d.type.includes('Calidad')) ? 'badge-blue' : (d.type && d.type.includes('Seguridad')) ? 'badge-green' : 'badge-gray'}">
                    ${d.type || 'General'}
                  </span>
                </td>
                <td>
                  <span class="badge badge-blue" title="${prj ? prj.name : d.projectId}">${d.projectId}</span>
                  ${prj ? `
                    <div style="font-size:11px;color:var(--text-muted);margin-top:2px;max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${prj.name} (${prj.client})">
                      ${prj.name}
                    </div>
                  ` : ""}
                </td>
                <td>
                  <div>
                    <i class="fa-solid fa-calendar-day" style="font-size:10px;color:var(--primary);margin-right:4px;"></i>
                    <strong>${d.date || d.expiryDate || '-'}</strong>
                  </div>
                  ${d.expiryDate && d.expiryDate !== d.date ? `
                    <div style="font-size:10px;color:var(--text-sub);margin-top:2px;">
                      Vence: <span class="${isExp && d.status !== 'Pagado' ? 'text-danger' : ''}">${d.expiryDate}</span>
                    </div>
                  ` : ""}
                </td>
                <td style="text-align:right;">
                  ${d.amount ? `
                    <strong style="color:var(--text-main);font-size:12px;">${fmtMoney(d.amount)}</strong>
                  ` : `
                    <span style="color:var(--text-muted);font-size:12px;">-</span>
                  `}
                </td>
                <td style="text-align:center;">
                  ${hasFile ? (
                    isPdf ? `
                      <button class="btn btn-secondary btn-sm" onclick="openDocPhotoViewer('${d.id}')" title="Ver Documento PDF" style="font-size:11px;padding:4px 8px;gap:5px;">
                        <i class="fa-solid fa-file-pdf" style="color:#ef4444;font-size:13px;"></i> Ver PDF
                      </button>
                    ` : `
                      <div style="display:inline-flex;align-items:center;gap:6px;">
                        <div onclick="openDocPhotoViewer('${d.id}')" title="Clic para ampliar foto de factura" style="width:36px;height:36px;border-radius:6px;overflow:hidden;border:1px solid var(--border-color);background:#080c14;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,0.3);transition:transform 0.15s ease;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                          <img src="${d.fileData || d.photo}" alt="${d.code}" style="width:100%;height:100%;object-fit:cover;">
                        </div>
                        <button class="btn btn-secondary btn-sm" onclick="openDocPhotoViewer('${d.id}')" title="Ampliar foto" style="padding:3px 7px;font-size:11px;">
                          <i class="fa-solid fa-eye"></i>
                        </button>
                      </div>
                    `
                  ) : (
                    userIsDev ? `
                      <button class="btn btn-secondary btn-sm" onclick="openEditModal('documents', '${d.id}')" title="Subir foto o PDF" style="font-size:11px;padding:3px 8px;color:var(--text-sub);">
                        <i class="fa-solid fa-camera"></i> + Foto
                      </button>
                    ` : `
                      <span style="font-size:11px;color:var(--text-muted);">Sin foto</span>
                    `
                  )}
                </td>
                <td>
                  <span class="badge ${d.status === 'Vigente' ? 'badge-green' : d.status === 'Pagado' ? 'badge-blue' : d.status === 'Por Vencer' ? 'badge-yellow' : 'badge-red'}">
                    ${d.status}
                  </span>
                </td>
                <td style="text-align:${userIsDev ? 'right' : 'center'};">
                  ${userIsDev ? `
                    <button class="btn btn-secondary btn-sm" onclick="openEditModal('documents', '${d.id}')" title="Editar"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="deleteRecord('documents', '${d.id}')" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
                  ` : `
                    <span class="badge badge-gray" style="font-size:10px;"><i class="fa-solid fa-lock"></i> Solo Lectura</span>
                  `}
                </td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
      </div>
    </div>
  `;
}

// 8. USUARIOS VIEW (roster of app users, not a login/access-control system)
function renderUsers(container) {
  const userIsDev = isDeveloper();

  if (!userIsDev) {
    container.innerHTML = `
      <div class="data-table-container" style="padding:48px 24px;text-align:center;">
        <div style="width:60px;height:60px;border-radius:50%;background:rgba(239,68,68,0.12);color:var(--danger);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:26px;">
          <i class="fa-solid fa-lock"></i>
        </div>
        <h3 style="font-size:18px;font-weight:700;margin-bottom:8px;color:#fff;">Acceso Restringido: Administración de Usuarios</h3>
        <p style="color:var(--text-sub);font-size:13px;max-width:520px;margin:0 auto 24px;line-height:1.6;">
          Tu perfil actual es <strong>Usuario (Solo Consulta)</strong>. El módulo de administración de cuentas, asignación de roles y control de accesos es de uso exclusivo para Desarrolladores y Administradores.
        </p>
        <div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap;">
          <button class="btn btn-secondary" onclick="navigateTo('dashboard')"><i class="fa-solid fa-arrow-left"></i> Volver al Dashboard</button>
          <button class="btn btn-primary" onclick="switchActiveRole('Desarrollador')"><i class="fa-solid fa-code"></i> Entrar como Desarrollador</button>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="margin-bottom:16px;">
      <p style="font-size:13px;color:var(--text-sub);">Directorio de personas que usan la plataforma. Roles disponibles: Desarrollador, Administrador y Usuario.</p>
    </div>
    <div class="data-table-container">
      <div class="table-toolbar">
        <div class="toolbar-title-group">
          <h2 style="font-size:18px;font-weight:700;">Usuarios del Sistema</h2>
          <span class="badge badge-orange">${DB.users.length} Registrados</span>
        </div>
        <div class="toolbar-actions-group">
          <div class="search-box">
            <i class="fa-solid fa-search search-icon"></i>
            <input type="text" class="search-input" placeholder="Buscar usuario, correo..." oninput="filterTable('usr-table', this.value)">
          </div>
          <div class="toolbar-btn-group">
            <button class="btn btn-secondary btn-sm" onclick="exportCSV('users')"><i class="fa-solid fa-file-export"></i> Exportar</button>
            <button class="btn btn-primary btn-sm" onclick="openCreateModal('users')"><i class="fa-solid fa-plus"></i> Nuevo Usuario</button>
          </div>
        </div>
      </div>
      <div class="table-scroll-hint"><i class="fa-solid fa-arrows-left-right"></i> Desliza horizontalmente para ver las opciones</div>
      <div class="table-responsive">
      <table id="usr-table">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Correo</th>
            <th>Rol</th>
            <th>Creado</th>
            <th style="text-align:right;">Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${DB.users.map(u => {
            const roleBadge = u.role === "Administrador" ? "badge-orange" : u.role === "Desarrollador" ? "badge-blue" : "badge-gray";
            return `
              <tr>
                <td>
                  <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:30px;height:30px;border-radius:50%;background:#1e293b;border:1px solid var(--border-subtle);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:var(--text-main);flex-shrink:0;">${u.avatar || getInitials(u.name)}</div>
                    <strong>${u.name}</strong>
                  </div>
                </td>
                <td>${u.email || "-"}</td>
                <td><span class="badge ${roleBadge}">${u.role}</span></td>
                <td><small>${u.createdAt || "-"}</small></td>
                <td style="text-align:right;">
                  <button class="btn btn-secondary btn-sm" onclick="openEditModal('users', '${u.id}')"><i class="fa-solid fa-pen"></i></button>
                  <button class="btn btn-danger btn-sm" onclick="deleteRecord('users', '${u.id}')"><i class="fa-solid fa-trash"></i></button>
                </td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
      </div>
      ${DB.users.length === 0 ? `
        <div style="padding:32px;text-align:center;">
          <i class="fa-solid fa-users" style="font-size:32px;color:var(--text-sub);margin-bottom:12px;"></i>
          <h3 style="font-size:15px;">Aún no hay usuarios registrados</h3>
          <p style="color:var(--text-sub);font-size:13px;margin-top:6px;">Usa "Nuevo Usuario" para agregar al primero.</p>
        </div>
      ` : ""}
    </div>
  `;
}

// 9. ALERTAS VIEW
function renderAlerts(container) {
  const alerts = [];

  // Project alerts
  DB.projects.forEach(p => {
    const h = getProjectHealth(p, DB.settings);
    if (h.color === "red") {
      alerts.push({
        type: "danger",
        icon: "fa-triangle-exclamation",
        title: `Proyecto Crítico: ${p.name} (${p.id})`,
        desc: `Motivo: ${h.text}. Avance real: ${p.realProgress}% vs planificado: ${p.plannedProgress}%. Presupuesto: ${fmtMoney(p.spent)} / ${fmtMoney(p.budget)}.`,
        link: "proyectos"
      });
    } else if (h.color === "yellow") {
      alerts.push({
        type: "warning",
        icon: "fa-circle-exclamation",
        title: `Alerta Proyecto: ${p.name} (${p.id})`,
        desc: `Motivo: ${h.text}. Faltan ${h.diffDays} días para la fecha de término estimada.`,
        link: "proyectos"
      });
    }
  });

  // Maintenance alerts
  DB.tools.forEach(t => {
    const isDue = new Date(t.nextMaintenance) < new Date();
    if (isDue) {
      alerts.push({
        type: "danger",
        icon: "fa-screwdriver-wrench",
        title: `Mantención Vencida: ${t.name} (${t.code})`,
        desc: `La fecha requerida era ${t.nextMaintenance}. Responsable: ${t.responsible}. Ubicación: ${t.projectId}.`,
        link: "herramientas"
      });
    }
  });

  // Worker exam alerts
  DB.workers.forEach(w => {
    const isDue = new Date(w.medExamExpiry) < new Date();
    if (isDue) {
      alerts.push({
        type: "warning",
        icon: "fa-user-nurse",
        title: `Examen Médico Vencido: ${w.name}`,
        desc: `Venció el ${w.medExamExpiry}. Cargo: ${w.role}. Asignado a: ${w.projectId}.`,
        link: "trabajadores"
      });
    }
  });

  // Document expiry alerts
  DB.documents.forEach(d => {
    if (d.status === "Vencido" || d.status === "Por Vencer") {
      alerts.push({
        type: d.status === "Vencido" ? "danger" : "warning",
        icon: "fa-file-circle-exclamation",
        title: `Documento ${d.status}: ${d.name} (${d.code})`,
        desc: `Tipo: ${d.type}. Fecha límite: ${d.expiryDate}. Proyecto: ${d.projectId}.`,
        link: "documentos"
      });
    }
  });

  container.innerHTML = `
    <div style="margin-bottom:20px;">
      <h2 style="font-size:18px;font-weight:700;">Centro de Alertas Proactivas</h2>
      <p style="font-size:13px;color:var(--text-sub);">Detección inteligente de riesgos operacionales, presupuestarios y de seguridad</p>
    </div>

    <div style="display:flex;flex-direction:column;gap:12px;">
      ${alerts.length === 0 ? `
        <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:12px;padding:32px;text-align:center;">
          <i class="fa-solid fa-circle-check" style="font-size:36px;color:var(--success);margin-bottom:12px;"></i>
          <h3>¡Todo en orden!</h3>
          <p style="color:var(--text-sub);font-size:13px;">No existen desviaciones críticas ni documentos vencidos en este momento.</p>
        </div>
      ` : alerts.map(a => `
        <div class="alert-card-item" style="background:var(--bg-card);border:1px solid var(--border-color);border-left:4px solid var(--${a.type});border-radius:10px;padding:16px;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;">
          <div style="display:flex;gap:14px;">
            <div style="background:var(--${a.type}-light);color:var(--${a.type});width:38px;height:38px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">
              <i class="fa-solid ${a.icon}"></i>
            </div>
            <div>
              <div style="font-weight:700;font-size:14px;color:#fff;">${a.title}</div>
              <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">${a.desc}</div>
            </div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="navigateTo('${a.link}')">Ir a vista <i class="fa-solid fa-arrow-right"></i></button>
        </div>
      `).join("")}
    </div>
  `;
}

// 10. CONFIGURACIÓN VIEW (CSV / JSON BACKUP / RESET / SEED)
function renderConfig(container) {
  const userIsDev = isDeveloper();

  if (!userIsDev) {
    container.innerHTML = `
      <div class="data-table-container" style="padding:48px 24px;text-align:center;">
        <div style="width:60px;height:60px;border-radius:50%;background:rgba(239,68,68,0.12);color:var(--danger);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:26px;">
          <i class="fa-solid fa-lock"></i>
        </div>
        <h3 style="font-size:18px;font-weight:700;margin-bottom:8px;color:#fff;">Acceso Restringido: Configuración del Sistema</h3>
        <p style="color:var(--text-sub);font-size:13px;max-width:520px;margin:0 auto 24px;line-height:1.6;">
          Tu perfil actual es <strong>Usuario (Solo Consulta)</strong>. Los parámetros técnicos, umbrales de semáforo inteligente, restauraciones y reseteos de la base de datos están restringidos a Desarrolladores.
        </p>
        <div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap;">
          <button class="btn btn-secondary" onclick="navigateTo('dashboard')"><i class="fa-solid fa-arrow-left"></i> Volver al Dashboard</button>
          <button class="btn btn-primary" onclick="switchActiveRole('Desarrollador')"><i class="fa-solid fa-code"></i> Entrar como Desarrollador</button>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="margin-bottom:20px;">
      <h2 style="font-size:18px;font-weight:700;">Configuración del Sistema</h2>
      <p style="font-size:13px;color:var(--text-sub);">Administración de respaldos, umbrales de semáforo y base de datos</p>
    </div>

    <div class="charts-grid" style="margin-bottom:24px;">
      <!-- Semáforo thresholds -->
      <div class="chart-box">
        <div class="chart-title" style="margin-bottom:14px;"><i class="fa-solid fa-sliders" style="color:var(--primary);"></i> Umbrales de Semáforo Inteligente</div>
        <div class="form-group" style="margin-bottom:12px;">
          <label class="form-label">Desfase Alerta Amarilla (% gap avance)</label>
          <div class="percent-input-wrap">
            <input type="number" id="cfg-alert" class="form-control" value="${DB.settings.trafficLight.alertGapPercent}" min="1" max="100">
            <span class="percent-suffix">%</span>
          </div>
        </div>
        <div class="form-group" style="margin-bottom:12px;">
          <label class="form-label">Desfase Alerta Crítica (% gap avance)</label>
          <div class="percent-input-wrap">
            <input type="number" id="cfg-critical" class="form-control" value="${DB.settings.trafficLight.criticalGapPercent}" min="1" max="100">
            <span class="percent-suffix">%</span>
          </div>
        </div>
        <div class="form-group" style="margin-bottom:16px;">
          <label class="form-label">Alerta de Presupuesto Consumido (%)</label>
          <div class="percent-input-wrap">
            <input type="number" id="cfg-budget" class="form-control" value="${DB.settings.trafficLight.budgetWarningPercent}" min="1" max="100">
            <span class="percent-suffix">%</span>
          </div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="saveTrafficSettings()">Guardar Umbrales</button>
      </div>

      <!-- Backup & Restore -->
      <div class="chart-box">
        <div class="chart-title" style="margin-bottom:14px;"><i class="fa-solid fa-database" style="color:var(--blue-accent);"></i> Gestión de Base de Datos Local</div>
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:14px;">Clave de persistencia: <code>cm_progest_v4</code></p>
        
        <div style="display:flex;flex-direction:column;gap:10px;">
          <button class="btn btn-secondary" onclick="downloadJSONBackup()"><i class="fa-solid fa-download"></i> Descargar Copia de Datos (JSON)</button>
          
          <label class="btn btn-secondary" style="cursor:pointer;">
            <i class="fa-solid fa-upload"></i> Restaurar Copia (JSON)
            <input type="file" accept=".json" style="display:none;" onchange="restoreJSONBackup(event)">
          </label>

          <button class="btn btn-secondary" onclick="restoreDemoSeed()"><i class="fa-solid fa-rotate-left"></i> Cargar Datos de Demostración Industrial</button>
          
          <button class="btn btn-danger" onclick="confirmResetDB()"><i class="fa-solid fa-trash"></i> Resetear a Base de Datos Limpia</button>
        </div>
      </div>

      <!-- GitHub & Cloud Sync Card -->
      <div class="chart-box" style="border: 1px solid rgba(249,115,22,0.3); background: rgba(249,115,22,0.03);">
        <div class="chart-title" style="margin-bottom:14px;"><i class="fa-brands fa-github" style="color:var(--primary);"></i> Sincronización & Exportar a GitHub</div>
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:14px;">Publica y sincroniza todo el código fuente y las actualizaciones en tu repositorio de GitHub.</p>
        
        <div style="display:flex;flex-direction:column;gap:10px;">
          <button class="btn btn-primary" onclick="openGitHubExportModal()">
            <i class="fa-brands fa-github"></i> Instrucciones para Exportar a GitHub
          </button>
          <button class="btn btn-secondary" onclick="downloadJSONBackup()">
            <i class="fa-solid fa-file-code"></i> Respaldar Base de Datos Actual
          </button>
        </div>
      </div>
    </div>
  `;
}

function openGitHubExportModal() {
  const modal = document.getElementById("generic-modal");
  const modalContent = document.getElementById("modal-content-slot");
  if (!modal || !modalContent) return;

  modalContent.innerHTML = `
    <div style="padding:4px 0;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;">
        <div style="width:44px;height:44px;border-radius:10px;background:rgba(255,255,255,0.08);color:#fff;display:flex;align-items:center;justify-content:center;font-size:24px;">
          <i class="fa-brands fa-github"></i>
        </div>
        <div>
          <h3 style="font-size:17px;font-weight:700;color:#fff;">Exportar y Sincronizar con GitHub</h3>
          <p style="color:var(--text-sub);font-size:12px;margin-top:2px;">Opciones para sincronizar este proyecto con tu repositorio</p>
        </div>
      </div>

      <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border-color);border-radius:8px;padding:16px;margin-bottom:16px;">
        <div style="font-weight:700;font-size:14px;color:var(--primary);margin-bottom:6px;">
          <i class="fa-solid fa-cloud-arrow-up"></i> Método 1: Exportar directamente desde Google AI Studio
        </div>
        <p style="font-size:13px;color:var(--text-main);line-height:1.5;margin-bottom:10px;">
          En la barra superior de <strong>Google AI Studio</strong> (arriba a la derecha):
        </p>
        <ol style="font-size:13px;color:var(--text-sub);padding-left:20px;line-height:1.6;margin:0 0 10px 0;">
          <li>Haz clic en el menú <strong>⋮</strong> o en el botón de <strong>Export / Settings</strong>.</li>
          <li>Selecciona <strong>"Export to GitHub"</strong>.</li>
          <li>Conecta tu cuenta de GitHub y elige tu repositorio para subir todos los cambios automáticamente.</li>
        </ol>
      </div>

      <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border-color);border-radius:8px;padding:16px;margin-bottom:20px;">
        <div style="font-weight:700;font-size:14px;color:var(--blue-accent);margin-bottom:6px;">
          <i class="fa-solid fa-file-zipper"></i> Método 2: Descargar código completo (ZIP)
        </div>
        <p style="font-size:13px;color:var(--text-main);line-height:1.5;margin-bottom:8px;">
          También puedes elegir <strong>"Export as ZIP"</strong> en el menú superior para tener el proyecto completo en tu computador y hacer <code>git push</code> manualmente.
        </p>
      </div>

      <div style="display:flex;justify-content:flex-end;gap:10px;">
        <button class="btn btn-secondary" onclick="closeModal()">Entendido</button>
        <button class="btn btn-primary" onclick="downloadJSONBackup()"><i class="fa-solid fa-download"></i> Descargar Datos (JSON)</button>
      </div>
    </div>
  `;

  modal.classList.add("open");
}

function saveTrafficSettings() {
  if (!verifyDeveloperPermission("modificar los umbrales del sistema")) return;
  DB.settings.trafficLight.alertGapPercent = Number(document.getElementById("cfg-alert").value) || 10;
  DB.settings.trafficLight.criticalGapPercent = Number(document.getElementById("cfg-critical").value) || 20;
  DB.settings.trafficLight.budgetWarningPercent = Number(document.getElementById("cfg-budget").value) || 85;
  saveDB();
  alert("¡Umbrales actualizados correctamente!");
}

function restoreDemoSeed() {
  if (!verifyDeveloperPermission("restaurar datos de demostración")) return;
  if (confirm("¿Deseas cargar el set de datos de demostración industrial para pruebas?")) {
    loadDemoData();
    renderCurrentView();
    alert("Datos de demostración industrial cargados con éxito.");
  }
}

function confirmResetDB() {
  if (!verifyDeveloperPermission("resetear la base de datos")) return;
  if (confirm("¿Estás seguro de dejar la base de datos limpia para empezar a ingresar datos reales?")) {
    resetDB();
    renderCurrentView();
    alert("Base de datos limpia correctamente.");
  }
}

// JSON Backup & Restore
function downloadJSONBackup() {
  const blob = new Blob([JSON.stringify(DB, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `CM_Industrial_Backup_${new Date().toISOString().split("T")[0]}.json`;
  a.click();
}

function restoreJSONBackup(evt) {
  if (!verifyDeveloperPermission("restaurar copias de seguridad")) {
    evt.target.value = "";
    return;
  }
  const file = evt.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (parsed.projects && parsed.expenses) {
        DB = parsed;
        saveDB();
        renderCurrentView();
        alert("¡Copia de seguridad restaurada correctamente!");
      } else {
        alert("El archivo no tiene un formato válido para esta aplicación.");
      }
    } catch (err) {
      alert("Error al leer el archivo JSON: " + err.message);
    }
  };
  reader.readAsText(file);
}

// CSV Export
function exportCSV(entity) {
  let rows = [];
  let filename = `CM_Industrial_${entity}_${new Date().toISOString().split("T")[0]}.csv`;

  if (entity === "projects") {
    rows = [["ID", "Nombre", "Cliente", "Ubicación", "Jefe", "Inicio", "Fin", "Presupuesto", "Gasto", "AvancePlan", "AvanceReal", "Estado"]];
    DB.projects.forEach(p => {
      rows.push([p.id, p.name, p.client, p.location, p.manager, p.startDate, p.endDate, p.budget, p.spent, p.plannedProgress, p.realProgress, p.status]);
    });
  } else if (entity === "expenses") {
    rows = [["ID", "Folio", "Proyecto", "Categoria", "Monto", "Proveedor", "Fecha", "Estado", "Glosa"]];
    DB.expenses.forEach(e => {
      rows.push([e.id, e.folio, e.projectId, e.category, e.amount, e.supplier, e.date, e.status, e.note]);
    });
  } else if (entity === "workers") {
    rows = [["ID", "RUT", "Nombre", "Cargo", "Proyecto", "JornadaLaboral", "PagoPorHora_CLP", "TarifaExtra_50pct", "HorasTrabajadas_Ord", "HorasExtras", "Subtotal_Ordinario", "Subtotal_HorasExtras", "TotalEstimadoPagar", "Estado", "Telefono", "Certificaciones", "VencMedico"]];
    (DB.workers || []).forEach(w => {
      const reg = Number(w.hoursWorked) || 0;
      const rate = Number(w.hourlyRate) || 0;
      const ovt = Number(w.overtimeHours) || 0;
      const extraRate = Math.round(rate * 1.5);
      const subReg = reg * rate;
      const subOvt = Math.round(ovt * extraRate);
      const total = subReg + subOvt;
      rows.push([
        w.id, w.rut, w.name, w.role, w.projectId, 
        w.workSchedule || "40 hrs/semana", rate, extraRate, 
        reg, ovt, subReg, subOvt, total,
        w.status, w.phone, w.certifications, w.medExamExpiry
      ]);
    });
  } else if (entity === "overtime") {
    rows = [["ID", "Fecha", "Trabajador_ID", "Colaborador", "RUT", "Proyecto", "Jornada", "HorasOrdinarias", "HorasExtras", "TarifaBase_Hora", "TarifaExtra_50pct", "MontoHorasExtras", "TotalTurno", "MotivoFaena", "Supervisor", "Estado"]];
    (DB.overtime || []).forEach(o => {
      const worker = (DB.workers || []).find(w => w.id === o.workerId);
      const baseRate = Number(o.hourlyRate) || (worker ? Number(worker.hourlyRate) || 0 : 0);
      const extraRate = o.overtimeRate || Math.round(baseRate * 1.5);
      const ovtTotal = o.overtimeTotal || Math.round((Number(o.overtimeHours) || 0) * extraRate);
      const dayTotal = o.totalDayPay || Math.round(((Number(o.regularHours) || 0) * baseRate) + ovtTotal);
      rows.push([
        o.id, o.date, o.workerId, worker ? worker.name : "", worker ? worker.rut : "",
        o.projectId, o.workSchedule || "", o.regularHours || 0, o.overtimeHours || 0,
        baseRate, extraRate, ovtTotal, dayTotal,
        o.reason || "", o.supervisor || "", o.status || "Aprobado"
      ]);
    });
  } else if (entity === "tools") {
    rows = [["ID", "Codigo", "Nombre", "Marca", "Proyecto", "Estado", "UltimaMant", "ProximaMant", "Serie", "Responsable", "TieneFoto"]];
    DB.tools.forEach(t => {
      rows.push([t.id, t.code, t.name, t.brand, t.projectId, t.status, t.lastMaintenance, t.nextMaintenance, t.serialNumber, t.responsible, t.photo ? "Si" : "No"]);
    });
  } else if (entity === "documents") {
    rows = [["ID", "Folio_Codigo", "Glosa_Titulo", "Tipo", "Proyecto", "Fecha", "Monto", "Proveedor", "Vencimiento", "Estado", "TieneAdjunto", "TipoArchivo"]];
    DB.documents.forEach(d => {
      rows.push([d.id, d.code, d.name, d.type, d.projectId, d.date || "", d.amount || 0, d.supplier || "", d.expiryDate || "", d.status, (d.fileData || d.photo) ? "Si" : "No", d.fileType || ""]);
    });
  } else if (entity === "users") {
    rows = [["ID", "Nombre", "Correo", "Rol", "Creado"]];
    DB.users.forEach(u => {
      rows.push([u.id, u.name, u.email, u.role, u.createdAt]);
    });
  }

  const csvContent = rows.map(r => r.map(c => `"${String(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}

// Table search filter
function filterTable(tableId, query) {
  const q = (query || "").toLowerCase();
  const rows = document.querySelectorAll(`#${tableId} tbody tr`);
  rows.forEach(tr => {
    const text = tr.innerText.toLowerCase();
    tr.style.display = text.includes(q) ? "" : "none";
  });
}

// Dedicated filter for Document Control & Invoices
function applyDocFilters() {
  const searchEl = document.getElementById("doc-search-input");
  const prjEl = document.getElementById("doc-prj-filter");
  const typeEl = document.getElementById("doc-type-filter");

  const query = (searchEl ? searchEl.value : "").toLowerCase().trim();
  const selectedPrj = prjEl ? prjEl.value : "";
  const selectedType = typeEl ? typeEl.value : "";

  const rows = document.querySelectorAll("#doc-table tbody tr");
  rows.forEach(tr => {
    const text = tr.innerText.toLowerCase();
    const rowPrj = tr.getAttribute("data-prj") || "";
    const rowType = (tr.getAttribute("data-type") || "").toLowerCase();
    const hasInvoice = tr.getAttribute("data-has-invoice") === "true";

    let matchQuery = !query || text.includes(query);
    let matchPrj = !selectedPrj || rowPrj === selectedPrj;
    let matchType = true;
    if (selectedType === "facturas") {
      matchType = hasInvoice || rowType.includes("factura") || rowType.includes("boleta");
    } else if (selectedType === "tecnicos") {
      matchType = !hasInvoice && !rowType.includes("factura") && !rowType.includes("boleta");
    }

    tr.style.display = (matchQuery && matchPrj && matchType) ? "" : "none";
  });
}

// ==========================================
// CAMERA & PHOTO HANDLING FOR EQUIPMENT
// ==========================================
let toolCameraStream = null;
let currentCameraFacingMode = "environment"; // default to rear camera on mobile devices

async function startToolCamera() {
  const container = document.getElementById("tool-camera-container");
  const video = document.getElementById("tool-camera-video");
  if (!container || !video) return;

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert("Tu navegador o entorno de ejecución no soporta acceso directo a la cámara por API web. Puedes utilizar el botón 'Subir Archivo' para capturar o seleccionar una imagen desde tu dispositivo.");
    return;
  }

  try {
    stopToolCameraStreamOnly();
    container.style.display = "block";

    const constraints = {
      video: {
        facingMode: { ideal: currentCameraFacingMode },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    };

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (conErr) {
      // Fallback if specific facingMode constraint fails
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    }

    toolCameraStream = stream;
    video.srcObject = stream;
    await video.play();
  } catch (error) {
    console.error("Camera access error:", error);
    container.style.display = "none";
    if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
      alert("Permiso de cámara denegado. Para tomar la foto directamente, por favor concede permisos de cámara en tu navegador o sube una imagen con el botón 'Subir Archivo'.");
    } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      alert("No se encontró ningún dispositivo de cámara conectado. Puedes cargar una foto con 'Subir Archivo'.");
    } else {
      alert("No fue posible inicializar la cámara (" + (error.message || error.name) + "). Puedes adjuntar la foto del equipo con 'Subir Archivo'.");
    }
  }
}

async function switchCameraFacing() {
  currentCameraFacingMode = currentCameraFacingMode === "environment" ? "user" : "environment";
  await startToolCamera();
}

function captureToolPhoto() {
  const video = document.getElementById("tool-camera-video");
  if (!video || !video.videoWidth) {
    alert("Esperando señal activa de la cámara para capturar...");
    return;
  }

  const canvas = document.createElement("canvas");
  const maxDim = 960;
  let width = video.videoWidth;
  let height = video.videoHeight;

  if (width > maxDim || height > maxDim) {
    if (width > height) {
      height = Math.round((height * maxDim) / width);
      width = maxDim;
    } else {
      width = Math.round((width * maxDim) / height);
      height = maxDim;
    }
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, width, height);

  const dataURL = canvas.toDataURL("image/jpeg", 0.85);
  applyToolPhoto(dataURL);
  stopToolCamera();
}

function stopToolCamera() {
  stopToolCameraStreamOnly();
  const container = document.getElementById("tool-camera-container");
  if (container) container.style.display = "none";
}

function stopToolCameraStreamOnly() {
  if (toolCameraStream) {
    toolCameraStream.getTracks().forEach(track => {
      try { track.stop(); } catch(e) {}
    });
    toolCameraStream = null;
  }
  const video = document.getElementById("tool-camera-video");
  if (video) {
    video.srcObject = null;
  }
}

function applyToolPhoto(dataURL) {
  const hiddenInput = document.getElementById("f_tphoto");
  if (hiddenInput) hiddenInput.value = dataURL;

  const img = document.getElementById("tool-photo-img");
  const emptyIcon = document.getElementById("tool-photo-empty-icon");
  const title = document.getElementById("tool-photo-status-title");
  const desc = document.getElementById("tool-photo-status-desc");
  const removeBtn = document.getElementById("btn-tool-remove-photo");
  const badge = document.getElementById("photo-indicator-badge");

  if (img) {
    img.src = dataURL;
    img.style.display = "block";
  }
  if (emptyIcon) emptyIcon.style.display = "none";
  if (title) title.innerText = "Fotografía lista y adjuntada";
  if (desc) desc.innerText = "Se guardará con la ficha de este equipo al confirmar los cambios. Clic en la foto para ampliar.";
  if (removeBtn) removeBtn.style.display = "inline-flex";
  if (badge) {
    badge.className = "badge badge-green";
    badge.innerHTML = '<i class="fa-solid fa-check"></i> Foto Lista';
  }
}

function removeToolPhoto() {
  const hiddenInput = document.getElementById("f_tphoto");
  if (hiddenInput) hiddenInput.value = "";

  const fileInput = document.getElementById("f_tphoto_file");
  if (fileInput) fileInput.value = "";

  const img = document.getElementById("tool-photo-img");
  const emptyIcon = document.getElementById("tool-photo-empty-icon");
  const title = document.getElementById("tool-photo-status-title");
  const desc = document.getElementById("tool-photo-status-desc");
  const removeBtn = document.getElementById("btn-tool-remove-photo");
  const badge = document.getElementById("photo-indicator-badge");

  if (img) {
    img.src = "";
    img.style.display = "none";
  }
  if (emptyIcon) emptyIcon.style.display = "block";
  if (title) title.innerText = "Sin fotografía capturada";
  if (desc) desc.innerText = 'Pulsa "Tomar Foto" para abrir la cámara o arrastra una imagen aquí.';
  if (removeBtn) removeBtn.style.display = "none";
  if (badge) {
    badge.className = "badge badge-gray";
    badge.innerHTML = '<i class="fa-solid fa-image"></i> Sin Foto';
  }
}

function handleToolPhotoUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  processPhotoFile(file);
}

function processPhotoFile(file) {
  if (!file.type.startsWith("image/")) {
    alert("Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP).");
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const maxDim = 960;
      let width = img.width;
      let height = img.height;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      const dataURL = canvas.toDataURL("image/jpeg", 0.85);
      applyToolPhoto(dataURL);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function handlePhotoDragOver(event) {
  event.preventDefault();
  const el = document.getElementById("tool-photo-preview-container");
  if (el) el.classList.add("dragover");
}

function handlePhotoDragLeave(event) {
  event.preventDefault();
  const el = document.getElementById("tool-photo-preview-container");
  if (el) el.classList.remove("dragover");
}

function handlePhotoDrop(event) {
  event.preventDefault();
  const el = document.getElementById("tool-photo-preview-container");
  if (el) el.classList.remove("dragover");
  if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
    processPhotoFile(event.dataTransfer.files[0]);
  }
}

// Lightbox for viewing photos
function openToolPhotoViewer(toolId) {
  const tool = DB.tools.find(t => t.id === toolId);
  if (!tool || !tool.photo) return;

  const modal = document.getElementById("photo-lightbox-modal");
  const img = document.getElementById("lightbox-img");
  const title = document.getElementById("lightbox-title");
  const meta = document.getElementById("lightbox-meta");
  const downloadLink = document.getElementById("lightbox-download-link");

  if (!modal || !img) return;

  title.innerText = `${tool.code} - ${tool.name}`;
  img.src = tool.photo;
  downloadLink.href = tool.photo;
  downloadLink.download = `${tool.code}_foto.jpg`;

  meta.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;">
      <div><strong>Tag / Código:</strong> ${tool.code}</div>
      <div><strong>Marca / Modelo:</strong> ${tool.brand || '-'}</div>
      <div><strong>Nº Serie:</strong> ${tool.serialNumber || '-'}</div>
      <div><strong>Ubicación:</strong> ${tool.projectId}</div>
      <div><strong>Responsable:</strong> ${tool.responsible || '-'}</div>
      <div><strong>Estado:</strong> <span class="badge ${tool.status === 'En Faena' ? 'badge-green' : 'badge-yellow'}">${tool.status}</span></div>
    </div>
  `;

  modal.classList.add("active");
}

function showImageLightboxCurrent() {
  const photoEl = document.getElementById("f_tphoto");
  const photo = photoEl ? photoEl.value : "";
  if (!photo) return;

  const codeEl = document.getElementById("f_tcode");
  const nameEl = document.getElementById("f_tname");
  const code = codeEl && codeEl.value ? codeEl.value : "Equipo";
  const name = nameEl && nameEl.value ? nameEl.value : "Maquinaria";

  const modal = document.getElementById("photo-lightbox-modal");
  const img = document.getElementById("lightbox-img");
  const title = document.getElementById("lightbox-title");
  const meta = document.getElementById("lightbox-meta");
  const downloadLink = document.getElementById("lightbox-download-link");

  if (!modal || !img) return;

  title.innerText = `Fotografía: ${code} - ${name}`;
  img.src = photo;
  downloadLink.href = photo;
  downloadLink.download = `foto_${code}.jpg`;
  meta.innerHTML = `<div style="font-size:12px;color:var(--text-sub);">Vista previa de la fotografía registrada para este equipo.</div>`;
  modal.classList.add("active");
}

function closePhotoLightbox(event) {
  if (event && event.target && event.target.id !== "photo-lightbox-modal" && event.target.id !== "lightbox-close-btn" && event.target.id !== "lightbox-done-btn") {
    // clicked inside modal content
  }
  const modal = document.getElementById("photo-lightbox-modal");
  if (modal) modal.classList.remove("active");
}

// ==========================================
// DOCUMENT & INVOICE/RECEIPT ASSOCIATIONS & CAMERA
// ==========================================
let docCameraStream = null;
let docCameraFacingMode = "environment";

async function startDocCamera() {
  const container = document.getElementById("doc-camera-container");
  const video = document.getElementById("doc-camera-video");
  const errorEl = document.getElementById("doc-camera-error");
  if (!container || !video) return;

  if (errorEl) errorEl.style.display = "none";
  container.style.display = "block";

  if (docCameraStream) {
    docCameraStream.getTracks().forEach(t => t.stop());
    docCameraStream = null;
  }

  try {
    const constraints = {
      video: {
        facingMode: { ideal: docCameraFacingMode },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    };

    docCameraStream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = docCameraStream;
    await video.play();
  } catch (err) {
    console.error("Camera access error:", err);
    if (errorEl) {
      errorEl.innerText = "No se pudo acceder a la cámara: " + (err.message || "Permiso denegado o dispositivo sin cámara disponible. Usa el botón 'Subir Foto o PDF'.");
      errorEl.style.display = "block";
    }
  }
}

function stopDocCamera() {
  if (docCameraStream) {
    docCameraStream.getTracks().forEach(t => t.stop());
    docCameraStream = null;
  }
  const video = document.getElementById("doc-camera-video");
  if (video) video.srcObject = null;
  const container = document.getElementById("doc-camera-container");
  if (container) container.style.display = "none";
}

function switchDocCameraFacing() {
  docCameraFacingMode = docCameraFacingMode === "environment" ? "user" : "environment";
  startDocCamera();
}

function captureDocPhoto() {
  const video = document.getElementById("doc-camera-video");
  if (!video || !video.videoWidth) {
    alert("La cámara aún se está iniciando. Por favor espera un momento.");
    return;
  }

  const canvas = document.createElement("canvas");
  const maxDimension = 1200;
  let w = video.videoWidth;
  let h = video.videoHeight;
  if (w > maxDimension || h > maxDimension) {
    if (w > h) {
      h = Math.round((h * maxDimension) / w);
      w = maxDimension;
    } else {
      w = Math.round((w * maxDimension) / h);
      h = maxDimension;
    }
  }

  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, w, h);

  const base64 = canvas.toDataURL("image/jpeg", 0.85);
  const nowStr = new Date().toISOString().slice(0, 10);
  const codeEl = document.getElementById("f_dcode");
  const name = (codeEl && codeEl.value.trim()) ? `factura_${codeEl.value.trim()}.jpg` : `foto_factura_${nowStr}.jpg`;

  applyDocFile(base64, name, "image");
  stopDocCamera();
}

function handleDocFileUpload(evt) {
  const file = evt.target.files && evt.target.files[0];
  if (!file) return;

  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const isImg = file.type.startsWith("image/");

  if (!isPdf && !isImg) {
    alert("Formato no soportado. Por favor sube una imagen (JPG, PNG) o un archivo PDF.");
    return;
  }

  if (file.size > 8 * 1024 * 1024) {
    alert("El archivo es demasiado pesado (máximo 8 MB para almacenamiento local).");
    return;
  }

  const reader = new FileReader();
  reader.onload = e => {
    const dataUrl = e.target.result;
    if (isImg) {
      compressImageIfPossible(dataUrl, 1400, 0.82, (compressed) => {
        applyDocFile(compressed, file.name, "image");
      });
    } else {
      applyDocFile(dataUrl, file.name, "pdf");
    }
  };
  reader.readAsDataURL(file);
}

function compressImageIfPossible(dataUrl, maxDim, quality, callback) {
  const img = new Image();
  img.onload = () => {
    let w = img.width;
    let h = img.height;
    if (w > maxDim || h > maxDim) {
      if (w > h) {
        h = Math.round((h * maxDim) / w);
        w = maxDim;
      } else {
        w = Math.round((w * maxDim) / h);
        h = maxDim;
      }
    }
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, w, h);
    callback(canvas.toDataURL("image/jpeg", quality));
  };
  img.onerror = () => callback(dataUrl);
  img.src = dataUrl;
}

function applyDocFile(fileData, fileName, fileType) {
  const dataInput = document.getElementById("f_doc_filedata");
  const nameInput = document.getElementById("f_doc_filename");
  const typeInput = document.getElementById("f_doc_filetype");
  const emptyBox = document.getElementById("doc-photo-empty-box");
  const imgPreview = document.getElementById("doc-photo-img");
  const pdfCard = document.getElementById("doc-pdf-card");
  const pdfName = document.getElementById("doc-pdf-name");
  const statusBadge = document.getElementById("doc-indicator-badge");
  const statusTitle = document.getElementById("doc-photo-status-title");
  const statusDesc = document.getElementById("doc-photo-status-desc");
  const removeBtn = document.getElementById("btn-doc-remove-file");

  if (!fileData) {
    removeDocFile();
    return;
  }

  const detectedType = fileType || (fileData.startsWith("data:application/pdf") ? "pdf" : "image");

  if (dataInput) dataInput.value = fileData;
  if (nameInput) nameInput.value = fileName || "";
  if (typeInput) typeInput.value = detectedType;

  if (emptyBox) emptyBox.style.display = "none";
  if (removeBtn) removeBtn.style.display = "inline-flex";

  if (detectedType === "pdf") {
    if (imgPreview) imgPreview.style.display = "none";
    if (pdfCard) pdfCard.style.display = "flex";
    if (pdfName) pdfName.innerText = fileName || "Documento_Factura.pdf";
    if (statusBadge) {
      statusBadge.className = "badge badge-red";
      statusBadge.innerHTML = '<i class="fa-solid fa-file-pdf"></i> PDF Listo';
    }
    if (statusTitle) statusTitle.innerText = fileName || "Documento PDF Listo";
    if (statusDesc) statusDesc.innerText = "Archivo PDF vinculado. Se guardará con este registro.";
  } else {
    if (pdfCard) pdfCard.style.display = "none";
    if (imgPreview) {
      imgPreview.src = fileData;
      imgPreview.style.display = "block";
    }
    if (statusBadge) {
      statusBadge.className = "badge badge-green";
      statusBadge.innerHTML = '<i class="fa-solid fa-check"></i> Foto Lista';
    }
    if (statusTitle) statusTitle.innerText = fileName || "Fotografía de Factura / Boleta";
    if (statusDesc) statusDesc.innerText = "Imagen cargada con éxito. Clic en la foto para ampliarla.";
  }
}

function removeDocFile() {
  const dataInput = document.getElementById("f_doc_filedata");
  const nameInput = document.getElementById("f_doc_filename");
  const typeInput = document.getElementById("f_doc_filetype");
  const fileInput = document.getElementById("f_doc_file");
  const emptyBox = document.getElementById("doc-photo-empty-box");
  const imgPreview = document.getElementById("doc-photo-img");
  const pdfCard = document.getElementById("doc-pdf-card");
  const statusBadge = document.getElementById("doc-indicator-badge");
  const statusTitle = document.getElementById("doc-photo-status-title");
  const statusDesc = document.getElementById("doc-photo-status-desc");
  const removeBtn = document.getElementById("btn-doc-remove-file");

  if (dataInput) dataInput.value = "";
  if (nameInput) nameInput.value = "";
  if (typeInput) typeInput.value = "image";
  if (fileInput) fileInput.value = "";

  if (emptyBox) emptyBox.style.display = "flex";
  if (imgPreview) {
    imgPreview.style.display = "none";
    imgPreview.src = "";
  }
  if (pdfCard) pdfCard.style.display = "none";
  if (removeBtn) removeBtn.style.display = "none";

  if (statusBadge) {
    statusBadge.className = "badge badge-gray";
    statusBadge.innerHTML = '<i class="fa-solid fa-camera"></i> Sin Foto';
  }
  if (statusTitle) statusTitle.innerText = "Sin Foto ni Archivo Adjunto";
  if (statusDesc) statusDesc.innerText = "Toma una foto con la cámara o sube un archivo JPG, PNG o PDF.";
}

function showDocImageLightboxCurrent() {
  const fileData = document.getElementById("f_doc_filedata") ? document.getElementById("f_doc_filedata").value : "";
  const fileType = document.getElementById("f_doc_filetype") ? document.getElementById("f_doc_filetype").value : "image";
  const fileName = document.getElementById("f_doc_filename") ? document.getElementById("f_doc_filename").value : "";
  const code = document.getElementById("f_dcode") ? document.getElementById("f_dcode").value : "DOC";
  const name = document.getElementById("f_dname") ? document.getElementById("f_dname").value : "Factura";

  if (!fileData) return;

  const modal = document.getElementById("photo-lightbox-modal");
  const img = document.getElementById("lightbox-img");
  const pdfContainer = document.getElementById("lightbox-pdf-container");
  const title = document.getElementById("lightbox-title");
  const meta = document.getElementById("lightbox-meta");
  const downloadLink = document.getElementById("lightbox-download-link");

  if (!modal) return;

  title.innerText = `Vista Previa: ${code} - ${name}`;
  downloadLink.href = fileData;
  downloadLink.download = fileName || `${code}.${fileType === 'pdf' ? 'pdf' : 'jpg'}`;

  if (fileType === "pdf" || fileData.startsWith("data:application/pdf")) {
    if (img) img.style.display = "none";
    if (pdfContainer) {
      pdfContainer.style.display = "block";
      pdfContainer.innerHTML = `<iframe src="${fileData}" style="width:100%;height:520px;border:none;border-radius:8px;background:#fff;"></iframe>`;
    }
    meta.innerHTML = `<div style="font-size:12px;color:var(--text-sub);">Documento PDF de factura/boleta listo para guardar.</div>`;
  } else {
    if (pdfContainer) {
      pdfContainer.style.display = "none";
      pdfContainer.innerHTML = "";
    }
    if (img) {
      img.src = fileData;
      img.style.display = "block";
    }
    meta.innerHTML = `<div style="font-size:12px;color:var(--text-sub);">Fotografía cargada para este registro.</div>`;
  }
  modal.classList.add("active");
}

function openDocPhotoViewer(docId) {
  const doc = (DB.documents || []).find(d => d.id === docId);
  if (!doc) return;

  const fileData = doc.fileData || doc.photo;
  if (!fileData) {
    alert("Este registro no tiene foto ni documento adjunto.");
    return;
  }

  const modal = document.getElementById("photo-lightbox-modal");
  const img = document.getElementById("lightbox-img");
  const pdfContainer = document.getElementById("lightbox-pdf-container");
  const title = document.getElementById("lightbox-title");
  const meta = document.getElementById("lightbox-meta");
  const downloadLink = document.getElementById("lightbox-download-link");

  if (!modal) return;

  const isPdf = doc.fileType === "pdf" || fileData.startsWith("data:application/pdf");
  title.innerText = `${isPdf ? 'Documento PDF' : 'Foto de Factura / Boleta'}: ${doc.code}`;
  downloadLink.href = fileData;
  downloadLink.download = doc.fileName || `${doc.code}.${isPdf ? 'pdf' : 'jpg'}`;

  const prj = DB.projects.find(p => p.id === doc.projectId);

  if (isPdf) {
    if (img) img.style.display = "none";
    if (pdfContainer) {
      pdfContainer.style.display = "block";
      pdfContainer.innerHTML = `<iframe src="${fileData}" style="width:100%;height:560px;border:none;border-radius:8px;background:#fff;"></iframe>`;
    }
  } else {
    if (pdfContainer) {
      pdfContainer.style.display = "none";
      pdfContainer.innerHTML = "";
    }
    if (img) {
      img.src = fileData;
      img.style.display = "block";
    }
  }

  meta.innerHTML = `
    <div style="font-size:13px;font-weight:600;color:var(--text-main);margin-bottom:6px;">${doc.name}</div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:var(--text-sub);">
      <div><strong>Proyecto:</strong> <span class="badge badge-blue">${doc.projectId}</span> ${prj ? prj.name : ''}</div>
      <div><strong>Fecha:</strong> ${doc.date || doc.expiryDate || '-'}</div>
      ${doc.amount ? `<div><strong>Monto:</strong> <span style="color:var(--primary);font-weight:700;">${fmtMoney(doc.amount)}</span></div>` : ''}
      ${doc.supplier ? `<div><strong>Emisor:</strong> ${doc.supplier}</div>` : ''}
      <div><strong>Estado:</strong> <span class="badge ${doc.status === 'Vigente' ? 'badge-green' : doc.status === 'Pagado' ? 'badge-blue' : 'badge-yellow'}">${doc.status}</span></div>
    </div>
  `;

  modal.classList.add("active");
}

function initDocInvoiceForm(data) {
  const prjSelect = document.getElementById("f_dprj");
  const selectedPrj = prjSelect ? prjSelect.value : (data ? data.projectId : "");
  updateDocLinkedExpenses(selectedPrj, data ? (data.expenseId || data.invoiceFolio) : null);

  if (data && (data.fileData || data.photo)) {
    applyDocFile(data.fileData || data.photo, data.fileName || `${data.code || 'documento'}.jpg`, data.fileType || "image");
  } else {
    removeDocFile();
  }
}

function handleDocProjectChange(projectId) {
  updateDocLinkedExpenses(projectId, null);
}

function updateDocLinkedExpenses(projectId, selectedExpenseIdOrFolio) {
  const select = document.getElementById("f_d_linked_expense");
  if (!select) return;

  const projectExpenses = (DB.expenses || []).filter(e => e.projectId === projectId);

  let html = `<option value="">-- [Opcional] Vincular Factura/Boleta de gastos ya registrada en este proyecto --</option>`;
  if (projectExpenses.length > 0) {
    projectExpenses.forEach(e => {
      const isSel = Boolean(selectedExpenseIdOrFolio && (selectedExpenseIdOrFolio === e.id || selectedExpenseIdOrFolio === e.folio));
      html += `<option value="${e.id}" ${isSel ? 'selected' : ''}>
        Folio: ${e.folio} &bull; ${fmtMoney(e.amount)} (${e.supplier} - ${e.category})
      </option>`;
    });
  } else if (projectId && projectId !== "General") {
    html += `<option value="" disabled>Sin facturas ni gastos registrados aún en este proyecto</option>`;
  }

  select.innerHTML = html;
}

function onSelectExistingExpenseInvoice(expenseId) {
  if (!expenseId) return;
  const exp = (DB.expenses || []).find(e => e.id === expenseId);
  if (!exp) return;

  const amountInput = document.getElementById("f_d_amount");
  const helper = document.getElementById("f_d_amount_helper");
  const supplierInput = document.getElementById("f_d_supplier");
  const codeInput = document.getElementById("f_dcode");
  const nameInput = document.getElementById("f_dname");
  const dateInput = document.getElementById("f_ddate");
  const typeSelect = document.getElementById("f_dtype");

  if (amountInput) {
    amountInput.value = formatNumberCL(exp.amount);
    if (helper) helper.innerHTML = describeAmountInWords(exp.amount);
  }
  if (supplierInput) supplierInput.value = exp.supplier;
  if (dateInput && exp.date) dateInput.value = exp.date;

  if (codeInput && (!codeInput.value || codeInput.value.startsWith("DOC-") || codeInput.value.startsWith("FACT-") || codeInput.value.startsWith("FAC-"))) {
    codeInput.value = exp.folio;
  }
  if (nameInput && (!nameInput.value || nameInput.value === "Factura / Boleta")) {
    nameInput.value = `Factura ${exp.folio} - ${exp.supplier}${exp.note ? ' (' + exp.note + ')' : ''}`;
  }
  if (typeSelect && (!typeSelect.value || typeSelect.value === "HSE / Calidad")) {
    typeSelect.value = "Factura Comercial / Proveedor";
  }
}

function syncDocInvoiceCode(val) {
  const codeInput = document.getElementById("f_dcode");
  if (codeInput && (!codeInput.value || codeInput.value.startsWith("FAC") || codeInput.value.startsWith("BOL") || codeInput.value.startsWith("DOC-"))) {
    codeInput.value = val;
  }
}

function toggleDocTypeFields(type) {
  const card = document.getElementById("doc-invoice-card");
  if (!card) return;
  const isInvoice = type.includes("Factura") || type.includes("Boleta");
  if (isInvoice) {
    card.style.borderColor = "rgba(249, 115, 22, 0.6)";
    card.style.background = "rgba(249, 115, 22, 0.12)";
  } else {
    card.style.borderColor = "rgba(249, 115, 22, 0.25)";
    card.style.background = "rgba(249, 115, 22, 0.05)";
  }
}

// CRUD Modal handling
function openCreateModal(entity) {
  stopToolCamera();
  stopDocCamera();
  if (!verifyDeveloperPermission(`crear nuevos registros en ${entity}`)) return;
  activeModalEntity = entity;
  activeModalRecord = null;
  const modal = document.getElementById("crud-modal");
  const title = document.getElementById("modal-title");
  const body = document.getElementById("modal-body-content");
  
  if (entity === "documents") {
    title.innerText = "Subir Factura / Boleta o Documento";
  } else if (entity === "overtime") {
    title.innerText = "Registrar Turno y Horas Extras de Mano de Obra";
  } else if (entity === "workers") {
    title.innerText = "Registrar Nuevo Trabajador & Jornada Laboral";
  } else {
    title.innerText = `Nuevo Registro: ${entity.toUpperCase()}`;
  }
  body.innerHTML = getEntityFormHTML(entity, {});
  if (entity === "documents") {
    initDocInvoiceForm(null);
  } else if (entity === "overtime") {
    if (preselectedOvertimeWorkerId) {
      const wrkSelect = document.getElementById("f_o_wrk");
      if (wrkSelect) wrkSelect.value = preselectedOvertimeWorkerId;
      updateOvertimeModalFromWorker(preselectedOvertimeWorkerId);
      preselectedOvertimeWorkerId = null;
    } else {
      const wrkSelect = document.getElementById("f_o_wrk");
      if (wrkSelect && wrkSelect.value) {
        updateOvertimeModalFromWorker(wrkSelect.value);
      } else {
        calcOvertimeFormTotals();
      }
    }
  } else if (entity === "workers") {
    calcWorkerFormTotals();
  }
  modal.classList.add("active");
}

function openEditModal(entity, id) {
  stopToolCamera();
  stopDocCamera();
  if (!verifyDeveloperPermission(`editar el registro ${id}`)) return;
  activeModalEntity = entity;
  activeModalRecord = DB[entity].find(x => x.id === id);
  if (!activeModalRecord) return;

  const modal = document.getElementById("crud-modal");
  const title = document.getElementById("modal-title");
  const body = document.getElementById("modal-body-content");
  
  if (entity === "documents") {
    title.innerText = `Editar Factura / Documento: ${activeModalRecord.code || id}`;
  } else if (entity === "overtime") {
    title.innerText = `Editar Turno & Horas Extras: ${id}`;
  } else if (entity === "workers") {
    title.innerText = `Editar Ficha de Trabajador: ${activeModalRecord.name}`;
  } else {
    title.innerText = `Editar ${entity.toUpperCase()}: ${id}`;
  }
  body.innerHTML = getEntityFormHTML(entity, activeModalRecord);
  if (entity === "documents") {
    initDocInvoiceForm(activeModalRecord);
  } else if (entity === "overtime") {
    calcOvertimeFormTotals();
  } else if (entity === "workers") {
    calcWorkerFormTotals();
  }
  modal.classList.add("active");
}

function closeModal() {
  stopToolCamera();
  stopDocCamera();
  document.getElementById("crud-modal").classList.remove("active");
}

function getEntityFormHTML(entity, data) {
  if (entity === "projects") {
    return `
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Código / ID</label>
          <input type="text" id="f_id" class="form-control" value="${data.id || 'PRJ-' + String(DB.projects.length + 1).padStart(3, '0')}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Nombre del Proyecto</label>
          <input type="text" id="f_name" class="form-control" value="${data.name || ''}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Cliente / Faena</label>
          <input type="text" id="f_client" class="form-control" value="${data.client || ''}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Ubicación</label>
          <input type="text" id="f_location" class="form-control" value="${data.location || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Jefe de Proyecto / Responsable</label>
          <input type="text" id="f_manager" class="form-control" value="${data.manager || ''}">
        </div>
        <div class="form-group">
          <label class="form-label" for="f_budget">Presupuesto Asignado ($)</label>
          <div class="currency-input-wrap">
            <span class="currency-prefix">$</span>
            <input type="text" inputmode="numeric" id="f_budget" class="form-control" value="${formatNumberCL(data.budget ?? 0)}" oninput="handleCurrencyInput(this, 'f_budget_helper')" placeholder="0" autocomplete="off">
          </div>
          <div id="f_budget_helper" style="margin-top:4px;">
            ${describeAmountInWords(data.budget ?? 0)}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="f_spent">Gasto Ejecutado Real ($)</label>
          <div class="currency-input-wrap">
            <span class="currency-prefix">$</span>
            <input type="text" inputmode="numeric" id="f_spent" class="form-control" value="${formatNumberCL(data.spent ?? 0)}" oninput="handleCurrencyInput(this, 'f_spent_helper')" placeholder="0" autocomplete="off">
          </div>
          <div id="f_spent_helper" style="margin-top:4px;">
            ${describeAmountInWords(data.spent ?? 0)}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="f_plan">Avance Planificado (%)</label>
          <div class="percent-input-wrap">
            <input type="number" id="f_plan" class="form-control" value="${data.plannedProgress || 0}" min="0" max="100" step="0.1">
            <span class="percent-suffix">%</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="f_real">Avance Real (%)</label>
          <div class="percent-input-wrap">
            <input type="number" id="f_real" class="form-control" value="${data.realProgress || 0}" min="0" max="100" step="0.1">
            <span class="percent-suffix">%</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Fecha Inicio</label>
          <input type="date" id="f_start" class="form-control" value="${data.startDate || '2026-01-01'}">
        </div>
        <div class="form-group">
          <label class="form-label">Fecha Término</label>
          <input type="date" id="f_end" class="form-control" value="${data.endDate || '2026-06-30'}">
        </div>
        <div class="form-group">
          <label class="form-label">Estado</label>
          <select id="f_status" class="form-control">
            <option ${data.status === 'En Ejecución' ? 'selected' : ''}>En Ejecución</option>
            <option ${data.status === 'Planificación' ? 'selected' : ''}>Planificación</option>
            <option ${data.status === 'Detenido' ? 'selected' : ''}>Detenido</option>
            <option ${data.status === 'Finalizado' ? 'selected' : ''}>Finalizado</option>
          </select>
        </div>
      </div>
    `;
  } else if (entity === "expenses") {
    return `
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Folio / Factura</label>
          <input type="text" id="f_folio" class="form-control" value="${data.folio || ''}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Proyecto Asociado</label>
          <select id="f_prjId" class="form-control">
            ${DB.projects.map(p => `<option value="${p.id}" ${data.projectId === p.id ? 'selected' : ''}>${p.id} - ${p.name}</option>`).join("")}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Categoría</label>
          <select id="f_category" class="form-control">
            <option ${data.category === 'Materiales' ? 'selected' : ''}>Materiales</option>
            <option ${data.category === 'Mano de Obra' ? 'selected' : ''}>Mano de Obra</option>
            <option ${data.category === 'Equipos' ? 'selected' : ''}>Equipos</option>
            <option ${data.category === 'Subcontratos' ? 'selected' : ''}>Subcontratos</option>
            <option ${data.category === 'Logística' ? 'selected' : ''}>Logística</option>
            <option ${data.category === 'Otros' ? 'selected' : ''}>Otros</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="f_amount">Monto ($)</label>
          <div class="currency-input-wrap">
            <span class="currency-prefix">$</span>
            <input type="text" inputmode="numeric" id="f_amount" class="form-control" value="${formatNumberCL(data.amount ?? 0)}" oninput="handleCurrencyInput(this, 'f_amount_helper')" required placeholder="0" autocomplete="off">
          </div>
          <div id="f_amount_helper" style="margin-top:4px;">
            ${describeAmountInWords(data.amount ?? 0)}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Proveedor</label>
          <input type="text" id="f_supplier" class="form-control" value="${data.supplier || ''}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Fecha</label>
          <input type="date" id="f_date" class="form-control" value="${data.date || new Date().toISOString().split('T')[0]}">
        </div>
        <div class="form-group full">
          <label class="form-label">Glosa / Observación</label>
          <input type="text" id="f_note" class="form-control" value="${data.note || ''}">
        </div>
      </div>
    `;
  } else if (entity === "workers") {
    const hourlyRate = data.hourlyRate || 8500;
    const hoursWorked = data.hoursWorked ?? 160;
    const overtimeHours = data.overtimeHours ?? 0;
    const extraRate = Math.round(hourlyRate * 1.5);
    const regPay = Math.round(hoursWorked * hourlyRate);
    const ovtPay = Math.round(overtimeHours * extraRate);
    const totalPay = regPay + ovtPay;
    const isEditing = !!data.id;

    return `
      <div class="form-grid">
        <!-- SECCIÓN 1: DATOS PERSONALES & CONTACTO -->
        <div class="form-group full" style="border-bottom:1px solid var(--border-color);padding-bottom:6px;margin-bottom:4px;">
          <span style="font-size:12px;font-weight:700;color:var(--primary);text-transform:uppercase;letter-spacing:0.5px;display:flex;align-items:center;gap:6px;">
            <i class="fa-solid fa-id-card"></i> 1. Identificación & Contacto del Colaborador
          </span>
        </div>

        <div class="form-group">
          <label class="form-label" style="font-weight:700;">RUT / DNI <span style="color:var(--danger);">*</span></label>
          <input type="text" id="f_rut" class="form-control" value="${data.rut || ''}" required placeholder="Ej. 12.345.678-9">
        </div>
        <div class="form-group">
          <label class="form-label" style="font-weight:700;">Nombre Completo <span style="color:var(--danger);">*</span></label>
          <input type="text" id="f_wname" class="form-control" value="${data.name || ''}" required placeholder="Nombres y Apellidos">
        </div>
        <div class="form-group">
          <label class="form-label"><i class="fa-solid fa-phone" style="color:var(--blue-accent);"></i> Teléfono Móvil</label>
          <input type="text" id="f_phone" class="form-control" value="${data.phone || ''}" placeholder="+56 9 1234 5678">
        </div>
        <div class="form-group">
          <label class="form-label"><i class="fa-solid fa-envelope" style="color:var(--text-sub);"></i> Correo Electrónico (Opcional)</label>
          <input type="email" id="f_wemail" class="form-control" value="${data.email || ''}" placeholder="colaborador@empresa.cl">
        </div>

        <!-- SECCIÓN 2: CARGO & ASIGNACIÓN DE FAENA -->
        <div class="form-group full" style="border-bottom:1px solid var(--border-color);padding-bottom:6px;margin-top:8px;margin-bottom:4px;">
          <span style="font-size:12px;font-weight:700;color:var(--blue-accent);text-transform:uppercase;letter-spacing:0.5px;display:flex;align-items:center;gap:6px;">
            <i class="fa-solid fa-hard-hat"></i> 2. Especialidad, Asignación & Dotación
          </span>
        </div>

        <div class="form-group">
          <label class="form-label" style="font-weight:700;">Cargo / Especialidad <span style="color:var(--danger);">*</span></label>
          <input type="text" id="f_role" list="roles-options" class="form-control" value="${data.role || ''}" required placeholder="Ej. Maestro Mayor Cañerías">
          <datalist id="roles-options">
            <option value="Maestro Mayor Cañerías">
            <option value="Maestro Mayor Estructuras">
            <option value="Soldador Calificado 6G / TIG">
            <option value="Soldador MIG / Arco Manual">
            <option value="Rigger Nivel 1 (Alta Tensión)">
            <option value="Eléctrico SEC Clase A">
            <option value="Eléctrico Instrumentista">
            <option value="Operador Maquinaria Pesada">
            <option value="Operador Grúa Pluma / Telescópica">
            <option value="Carpintero de Obra Gruesa">
            <option value="Enfierrador Especialista">
            <option value="Trazador / Alarifes">
            <option value="Maestro Segunda / Montajista">
            <option value="Ayudante Avanzado">
            <option value="Jornalero / Cuadrilla">
            <option value="Capataz de Especialidad">
            <option value="Supervisor de Obra / Residente">
            <option value="Prevencionista de Riesgos (SERNAGEOMIN/SNS)">
          </datalist>
        </div>

        <div class="form-group">
          <label class="form-label" style="font-weight:700;">Proyecto / Faena Asignada</label>
          <select id="f_wprj" class="form-control">
            <option value="General" ${(!data.projectId || data.projectId === 'General') ? 'selected' : ''}>Sin Asignar (Disponible en Base Central)</option>
            ${DB.projects.map(p => `<option value="${p.id}" ${data.projectId === p.id ? 'selected' : ''}>${p.id} - ${p.name}</option>`).join("")}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" style="font-weight:700;">Estado de Dotación</label>
          <select id="f_wstatus" class="form-control">
            <option value="Activo en Obra" ${(!data.status || data.status === 'Activo' || data.status === 'Activo en Obra') ? 'selected' : ''}>Activo en Obra (En Faena)</option>
            <option value="Disponible (En Base)" ${(data.status === 'Disponible' || data.status === 'Disponible (En Base)') ? 'selected' : ''}>Disponible (En Base / Pool Central)</option>
            <option value="Licencia Médica" ${(data.status === 'Licencia' || data.status === 'Licencia Médica') ? 'selected' : ''}>Licencia Médica / Permiso Legal</option>
            <option value="Finiquitado / No Vigente" ${(data.status === 'Finiquitado' || data.status === 'Finiquitado / No Vigente' || data.status === 'Inactivo') ? 'selected' : ''}>Finiquitado / No Vigente (Desvinculado)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Acreditaciones & Certificaciones</label>
          <input type="text" id="f_cert" class="form-control" value="${data.certifications || ''}" placeholder="Ej. ASME IX 6G, SEC Clase A, Rigger">
        </div>

        <!-- SECCIÓN 3: JORNADA LABORAL, TURNOS & REMUNERACIÓN -->
        <div class="form-group full" style="border-bottom:1px solid var(--border-color);padding-bottom:6px;margin-top:8px;margin-bottom:4px;">
          <span style="font-size:12px;font-weight:700;color:var(--warning);text-transform:uppercase;letter-spacing:0.5px;display:flex;align-items:center;gap:6px;">
            <i class="fa-solid fa-business-time"></i> 3. Jornada Laboral, Turno & Remuneración Base
          </span>
        </div>

        <div class="form-group">
          <label class="form-label" style="color:var(--primary);font-weight:700;">
            <i class="fa-solid fa-clock-rotate-left"></i> Turno / Jornada Pactada
          </label>
          <input type="text" id="f_wschedule" list="schedule-options" class="form-control" value="${data.workSchedule || '40 hrs/semana (Turno 5x2)'}" placeholder="Ej. 40 hrs/semana (Turno 5x2)">
          <datalist id="schedule-options">
            <option value="40 hrs/semana (Turno 5x2)">
            <option value="Turno 7x7 (Faena Minera 12 hrs/día)">
            <option value="Turno 4x3 (Jornada 10 hrs/día)">
            <option value="Turno 5x2 (Jornada 8 hrs/día)">
            <option value="Turno 6x1 (6.6 hrs/día)">
            <option value="Turno Nocturno 7x7">
            <option value="Turno Rotativo 14x14">
          </datalist>
        </div>

        <div class="form-group">
          <label class="form-label" style="color:var(--primary);font-weight:700;" for="f_whourly">
            <i class="fa-solid fa-dollar-sign"></i> Tarifa Hora Base ($ CLP) <span style="color:var(--danger);">*</span>
          </label>
          <div class="currency-input-wrap">
            <span class="currency-prefix">$</span>
            <input type="text" inputmode="numeric" id="f_whourly" class="form-control" value="${formatNumberCL(hourlyRate)}" oninput="handleCurrencyInput(this, 'f_whourly_helper'); calcWorkerFormTotals();" required placeholder="0" autocomplete="off">
          </div>
          <div id="f_whourly_helper" style="margin-top:4px;">
            ${describeAmountInWords(hourlyRate)}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" style="color:var(--blue-accent);font-weight:700;">
            <i class="fa-solid fa-clock"></i> Horas Ordinarias (Base Período)
          </label>
          <input type="number" id="f_whours" class="form-control" value="${hoursWorked}" min="0" step="0.5" oninput="calcWorkerFormTotals()" placeholder="160">
          <div style="font-size:11px;color:var(--text-sub);margin-top:2px;">Horas normales contratadas</div>
        </div>

        <div class="form-group">
          <label class="form-label" style="color:var(--warning);font-weight:700;">
            <i class="fa-solid fa-stopwatch"></i> Horas Extras Acumuladas
          </label>
          <input type="number" id="f_wovertime" class="form-control" value="${overtimeHours}" min="0" step="0.5" oninput="calcWorkerFormTotals()" placeholder="0">
          <div style="font-size:11px;color:var(--text-sub);margin-top:2px;">Horas adicionales con +50% legal</div>
        </div>

        <!-- RESUMEN EN VIVO DE REMUNERACIÓN ESTIMADA -->
        <div class="form-group full" style="background:rgba(255,255,255,0.02);border:1px solid var(--border-color);border-radius:10px;padding:12px 16px;">
          <div style="font-size:12px;font-weight:700;color:var(--text-main);margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;">
            <span><i class="fa-solid fa-calculator" style="color:var(--primary);margin-right:6px;"></i> Liquidación Estimada / Mano de Obra</span>
            <span style="font-size:11px;color:var(--warning);"><i class="fa-solid fa-scale-balanced"></i> Art. 32 Código del Trabajo (+50%)</span>
          </div>
          <div class="modal-calc-grid" style="gap:10px;">
            <div style="background:#090d16;padding:8px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.06);">
              <div style="font-size:10px;color:var(--text-sub);">Tarifa Hora Extra (+50%)</div>
              <div id="f_whourly_extra_preview" style="font-weight:700;color:var(--primary);font-size:13px;">$ ${formatNumberCL(extraRate)}</div>
            </div>
            <div style="background:#090d16;padding:8px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.06);">
              <div style="font-size:10px;color:var(--text-sub);">Subtotal Horas Ordinarias</div>
              <div id="f_w_calc_reg" style="font-weight:700;color:#fff;font-size:13px;">$ ${formatNumberCL(regPay)}</div>
            </div>
            <div style="background:#090d16;padding:8px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.06);">
              <div style="font-size:10px;color:var(--text-sub);">Subtotal Horas Extras</div>
              <div id="f_w_calc_ovt" style="font-weight:700;color:var(--warning);font-size:13px;">$ ${formatNumberCL(ovtPay)}</div>
            </div>
            <div style="background:#090d16;padding:8px 12px;border-radius:6px;border:1px solid rgba(16,185,129,0.3);">
              <div style="font-size:10px;color:var(--secondary);font-weight:600;">Total Estimado a Pagar</div>
              <div id="f_w_calc_total" style="font-weight:800;color:var(--secondary);font-size:14px;">$ ${formatNumberCL(totalPay)}</div>
            </div>
          </div>
        </div>

        <!-- SECCIÓN 4: SALUD OCUPACIONAL & NOTAS -->
        <div class="form-group full" style="border-bottom:1px solid var(--border-color);padding-bottom:6px;margin-top:8px;margin-bottom:4px;">
          <span style="font-size:12px;font-weight:700;color:var(--secondary);text-transform:uppercase;letter-spacing:0.5px;display:flex;align-items:center;gap:6px;">
            <i class="fa-solid fa-notes-medical"></i> 4. Salud Ocupacional & Observaciones
          </span>
        </div>

        <div class="form-group">
          <label class="form-label"><i class="fa-solid fa-calendar-check" style="color:var(--secondary);"></i> Vencimiento Examen Ocupacional</label>
          <input type="date" id="f_med" class="form-control" value="${data.medExamExpiry || '2026-12-31'}">
        </div>

        <div class="form-group">
          <label class="form-label">Notas / Observaciones Internas</label>
          <input type="text" id="f_wnotes" class="form-control" value="${data.notes || ''}" placeholder="Ej. Requiere EPP dieléctrico">
        </div>
      </div>
    `;
  } else if (entity === "overtime") {
    const defaultWrkId = data.workerId || preselectedOvertimeWorkerId || (DB.workers[0] ? DB.workers[0].id : "");
    const selectedWrk = (DB.workers || []).find(w => w.id === defaultWrkId);
    const hourlyRate = data.hourlyRate || (selectedWrk ? selectedWrk.hourlyRate : 8500);
    const regularHours = data.regularHours ?? 8;
    const overtimeHours = data.overtimeHours ?? 2;
    const extraRate = data.overtimeRate || Math.round(hourlyRate * 1.5);
    const ovtTotal = data.overtimeTotal || Math.round(overtimeHours * extraRate);
    const dayTotal = data.totalDayPay || Math.round((regularHours * hourlyRate) + ovtTotal);

    return `
      <div class="form-grid">
        <div class="form-group full" style="display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.03);padding:8px 12px;border-radius:8px;border:1px solid var(--border-color);margin-bottom:6px;">
          <div style="font-size:12px;color:var(--text-sub);">
            <i class="fa-solid fa-circle-info" style="color:var(--primary);margin-right:4px;"></i>
            Selecciona el colaborador para auto-cargar su tarifa base y faena. ¿Es un personal nuevo?
          </div>
          <button type="button" class="btn btn-secondary btn-sm" onclick="closeModal(); openCreateModal('workers');" style="font-size:11px;padding:3px 8px;color:var(--blue-accent);white-space:nowrap;">
            <i class="fa-solid fa-user-plus"></i> Registrar Nuevo Personal
          </button>
        </div>

        <div class="form-group">
          <label class="form-label" style="color:var(--primary);font-weight:700;">
            <i class="fa-solid fa-user"></i> Colaborador / Trabajador <span style="color:var(--danger);">*</span>
          </label>
          <select id="f_o_wrk" class="form-control" onchange="updateOvertimeModalFromWorker(this.value)" required>
            ${(DB.workers || []).map(w => `<option value="${w.id}" ${w.id === defaultWrkId ? 'selected' : ''}>${w.name} (${w.rut}) - ${w.role} [${w.status || 'Activo'}]</option>`).join("")}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label"><i class="fa-solid fa-calendar-day"></i> Fecha del Turno</label>
          <input type="date" id="f_o_date" class="form-control" value="${data.date || new Date().toISOString().split('T')[0]}" required>
        </div>

        <div class="form-group">
          <label class="form-label"><i class="fa-solid fa-diagram-project"></i> Proyecto / Faena</label>
          <select id="f_o_prj" class="form-control">
            ${DB.projects.map(p => `<option value="${p.id}" ${((data.projectId || (selectedWrk ? selectedWrk.projectId : '')) === p.id) ? 'selected' : ''}>${p.id} - ${p.name}</option>`).join("")}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label"><i class="fa-solid fa-business-time"></i> Jornada Laboral / Turno</label>
          <input type="text" id="f_o_schedule" class="form-control" value="${data.workSchedule || (selectedWrk ? selectedWrk.workSchedule : '40 hrs/semana (Turno 5x2)')}" placeholder="Ej. 40 hrs/semana (Turno 5x2)">
        </div>

        <div class="form-group">
          <label class="form-label" style="color:var(--blue-accent);font-weight:700;">
            <i class="fa-solid fa-clock"></i> Horas Ordinarias Turno
          </label>
          <input type="number" id="f_o_reg_hours" class="form-control" value="${regularHours}" min="0" step="0.5" oninput="calcOvertimeFormTotals()">
          <div style="font-size:11px;color:var(--text-sub);margin-top:2px;">Horas pactadas de la jornada base</div>
        </div>

        <div class="form-group">
          <label class="form-label" style="color:var(--warning);font-weight:700;">
            <i class="fa-solid fa-stopwatch"></i> Cantidad de Horas Extras
          </label>
          <input type="number" id="f_o_hours" class="form-control" value="${overtimeHours}" min="0.5" step="0.5" oninput="calcOvertimeFormTotals()" required>
          <div style="font-size:11px;color:var(--text-sub);margin-top:2px;">Horas adicionales trabajadas (+50%)</div>
        </div>

        <div class="form-group">
          <label class="form-label" for="f_o_rate">
            <i class="fa-solid fa-dollar-sign"></i> Pago por Hora Base ($ CLP)
          </label>
          <div class="currency-input-wrap">
            <span class="currency-prefix">$</span>
            <input type="text" inputmode="numeric" id="f_o_rate" class="form-control" value="${formatNumberCL(hourlyRate)}" oninput="handleCurrencyInput(this, 'f_o_rate_helper'); calcOvertimeFormTotals();" required placeholder="0" autocomplete="off">
          </div>
          <div id="f_o_rate_helper" style="margin-top:4px;">
            ${describeAmountInWords(hourlyRate)}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Estado de Aprobación</label>
          <select id="f_o_status" class="form-control">
            <option ${(!data.status || data.status === 'Aprobado') ? 'selected' : ''}>Aprobado</option>
            <option ${data.status === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
            <option ${data.status === 'Pagado' ? 'selected' : ''}>Pagado</option>
          </select>
        </div>

        <!-- CÁLCULOS DINÁMICOS DEL TURNO Y HORAS EXTRAS -->
        <div class="form-group full" style="background:rgba(255,255,255,0.02);border:1px solid var(--border-color);border-radius:10px;padding:12px 16px;">
          <div style="font-size:12px;font-weight:700;color:var(--text-main);margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;">
            <span><i class="fa-solid fa-bolt" style="color:var(--primary);margin-right:6px;"></i> Liquidación del Turno / Recargo Legal 50%</span>
            <span style="font-size:11px;color:var(--warning);"><i class="fa-solid fa-file-contract"></i> Código del Trabajo Art. 32</span>
          </div>
          <div class="modal-calc-grid" style="gap:10px;">
            <div style="background:#090d16;padding:8px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.06);">
              <div style="font-size:10px;color:var(--text-sub);">Tarifa Hora Extra (+50%)</div>
              <div id="f_o_extra_rate_preview" style="font-weight:700;color:var(--primary);font-size:13px;">$ ${formatNumberCL(extraRate)}</div>
            </div>
            <div style="background:#090d16;padding:8px 12px;border-radius:6px;border:1px solid rgba(245,158,11,0.3);">
              <div style="font-size:10px;color:var(--warning);font-weight:600;">Monto Horas Extras</div>
              <div id="f_o_extra_total_preview" style="font-weight:800;color:var(--warning);font-size:14px;">$ ${formatNumberCL(ovtTotal)}</div>
            </div>
            <div style="background:#090d16;padding:8px 12px;border-radius:6px;border:1px solid rgba(16,185,129,0.3);">
              <div style="font-size:10px;color:var(--secondary);font-weight:600;">Total a Pagar Turno Completo</div>
              <div id="f_o_day_total_preview" style="font-weight:800;color:var(--secondary);font-size:14px;">$ ${formatNumberCL(dayTotal)}</div>
            </div>
          </div>
        </div>

        <div class="form-group full">
          <label class="form-label"><i class="fa-solid fa-clipboard-list"></i> Motivo / Faena Extraordinaria</label>
          <input type="text" id="f_o_reason" class="form-control" value="${data.reason || ''}" placeholder="Ej. Soldadura y ajuste urgente fuera de jornada por atraso de despacho">
        </div>

        <div class="form-group full">
          <label class="form-label"><i class="fa-solid fa-user-shield"></i> Supervisor / Jefe de Faena que Autoriza</label>
          <input type="text" id="f_o_supervisor" class="form-control" value="${data.supervisor || 'Ing. Residente'}" placeholder="Nombre o cargo del supervisor">
        </div>
      </div>
    `;
  } else if (entity === "tools") {
    const hasPhoto = Boolean(data.photo);
    return `
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Tag / Código</label>
          <input type="text" id="f_tcode" class="form-control" value="${data.code || ''}" required placeholder="Ej. GEN-04">
        </div>
        <div class="form-group">
          <label class="form-label">Nombre del Equipo</label>
          <input type="text" id="f_tname" class="form-control" value="${data.name || ''}" required placeholder="Ej. Compresor Diésel 250 CFM">
        </div>
        <div class="form-group">
          <label class="form-label">Marca y Modelo</label>
          <input type="text" id="f_tbrand" class="form-control" value="${data.brand || ''}" placeholder="Ej. Atlas Copco">
        </div>
        <div class="form-group">
          <label class="form-label">Nº Serie</label>
          <input type="text" id="f_tserial" class="form-control" value="${data.serialNumber || ''}" placeholder="Ej. AC-88210">
        </div>
        <div class="form-group">
          <label class="form-label">Ubicación / Proyecto</label>
          <input type="text" id="f_tprj" class="form-control" value="${data.projectId || 'Bodega Central'}">
        </div>
        <div class="form-group">
          <label class="form-label">Responsable</label>
          <input type="text" id="f_tresp" class="form-control" value="${data.responsible || ''}" placeholder="Encargado del equipo">
        </div>
        <div class="form-group full">
          <label class="form-label">Próxima Mantención</label>
          <input type="date" id="f_tnext" class="form-control" value="${data.nextMaintenance || '2026-06-30'}">
        </div>

        <!-- APARTADO PARA TOMAR FOTO DEL EQUIPO -->
        <div class="form-group full" id="tool-photo-group" style="margin-top:6px;padding-top:14px;border-top:1px solid var(--border-color);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px;">
            <div>
              <label class="form-label" style="color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;gap:8px;margin-bottom:2px;">
                <i class="fa-solid fa-camera" style="color:var(--primary);"></i>
                Fotografía del Equipo / Registro en Terreno
              </label>
              <div style="font-size:11px;color:var(--text-sub);">
                Captura una foto en vivo directamente desde la cámara de tu dispositivo o carga un archivo existente.
              </div>
            </div>
            <span id="photo-indicator-badge" class="badge ${hasPhoto ? 'badge-green' : 'badge-gray'}" style="font-size:11px;">
              ${hasPhoto ? '<i class="fa-solid fa-check"></i> Foto Lista' : '<i class="fa-solid fa-image"></i> Sin Foto'}
            </span>
          </div>

          <!-- Hidden storage inputs for photo data -->
          <input type="hidden" id="f_tphoto" value="${data.photo || ''}">
          <input type="file" id="f_tphoto_file" accept="image/*" capture="environment" style="display:none;" onchange="handleToolPhotoUpload(event)">

          <!-- Live Camera Viewport (Activated when clicking 'Tomar Foto') -->
          <div id="tool-camera-container" class="tool-camera-box" style="display:none;background:#050811;border:2px dashed var(--primary);border-radius:12px;padding:14px;margin-bottom:12px;text-align:center;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
              <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:#fff;font-weight:600;">
                <span class="camera-live-indicator"></span>
                <span>Cámara Activa: Encuadra el equipo o placa técnica</span>
              </div>
              <button type="button" id="btn-camera-flip" class="btn btn-secondary btn-sm" onclick="switchCameraFacing()" title="Cambiar a cámara frontal/trasera">
                <i class="fa-solid fa-camera-rotate"></i> Cambiar Lente
              </button>
            </div>

            <div style="position:relative;background:#000;border-radius:8px;overflow:hidden;max-height:260px;display:flex;align-items:center;justify-content:center;">
              <video id="tool-camera-video" playsinline autoplay muted style="width:100%;max-height:260px;object-fit:contain;"></video>
              <div class="camera-reticle"></div>
            </div>

            <div style="display:flex;justify-content:center;gap:12px;margin-top:12px;flex-wrap:wrap;">
              <button type="button" id="btn-camera-snap" class="btn btn-primary" onclick="captureToolPhoto()" style="padding:8px 20px;font-weight:700;">
                <i class="fa-solid fa-camera-retro"></i> Capturar Foto
              </button>
              <button type="button" id="btn-camera-cancel" class="btn btn-secondary" onclick="stopToolCamera()">
                <i class="fa-solid fa-xmark"></i> Cancelar
              </button>
            </div>
          </div>

          <!-- Photo Preview & Actions Bar (Dropzone) -->
          <div id="tool-photo-preview-container" class="tool-photo-dropzone" ondragover="handlePhotoDragOver(event)" ondragleave="handlePhotoDragLeave(event)" ondrop="handlePhotoDrop(event)" style="background:#0d121f;border:1px solid var(--border-color);border-radius:10px;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;">
            
            <div style="display:flex;align-items:center;gap:14px;min-width:220px;">
              <div id="tool-photo-thumb-wrapper" style="width:68px;height:68px;border-radius:8px;background:#161f30;border:1px solid var(--border-color);display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;position:relative;">
                ${hasPhoto ? `
                  <img id="tool-photo-img" src="${data.photo}" alt="Foto del equipo" style="width:100%;height:100%;object-fit:cover;cursor:pointer;" onclick="showImageLightboxCurrent()" title="Clic para ampliar">
                ` : `
                  <div id="tool-photo-empty-icon" style="color:var(--text-muted);font-size:22px;">
                    <i class="fa-solid fa-camera" style="opacity:0.4;"></i>
                  </div>
                  <img id="tool-photo-img" src="" alt="Foto del equipo" style="display:none;width:100%;height:100%;object-fit:cover;cursor:pointer;" onclick="showImageLightboxCurrent()" title="Clic para ampliar">
                `}
              </div>
              <div>
                <div id="tool-photo-status-title" style="font-size:13px;font-weight:700;color:#fff;">
                  ${hasPhoto ? 'Fotografía cargada' : 'Sin fotografía capturada'}
                </div>
                <div id="tool-photo-status-desc" style="font-size:12px;color:var(--text-muted);margin-top:2px;">
                  ${hasPhoto ? 'Se almacenará con la ficha del equipo. Clic en la miniatura para ampliar.' : 'Pulsa "Tomar Foto" para abrir la cámara o arrastra una imagen aquí.'}
                </div>
              </div>
            </div>

            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
              <button type="button" id="btn-tool-start-camera" class="btn btn-primary btn-sm" onclick="startToolCamera()">
                <i class="fa-solid fa-camera"></i> Tomar Foto
              </button>
              <button type="button" id="btn-tool-upload-file" class="btn btn-secondary btn-sm" onclick="document.getElementById('f_tphoto_file').click()">
                <i class="fa-solid fa-upload"></i> Subir Archivo
              </button>
              <button type="button" id="btn-tool-remove-photo" class="btn btn-danger btn-sm" onclick="removeToolPhoto()" style="display:${hasPhoto ? 'inline-flex' : 'none'};">
                <i class="fa-solid fa-trash"></i> Quitar
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  } else if (entity === "documents") {
    const currentPrj = data.projectId || (DB.projects && DB.projects[0] ? DB.projects[0].id : "General");
    const currentType = data.type || "Factura Comercial / Proveedor";
    const currentDate = data.date || data.expiryDate || new Date().toISOString().slice(0, 10);
    const docAmount = Number(data.amount) || 0;
    const hasFile = Boolean(data.fileData || data.photo);
    const fileType = data.fileType || (data.fileData && data.fileData.includes("pdf") ? "pdf" : "image");

    const standardDocTypes = [
      "Factura Comercial / Proveedor",
      "Boleta de Honorarios / Servicios",
      "Boleta de Garantía / Fiel Cumplimiento",
      "Factura de Venta / Estado de Pago",
      "Seguridad / Prevención (PTS/HSE)",
      "Calidad QA/QC",
      "Ingeniería / Planos As-Built",
      "Contrato / Carpeta de Arranque",
      "Certificado / Calibración",
      "Otro Documento"
    ];
    if (data.type && !standardDocTypes.includes(data.type)) {
      standardDocTypes.unshift(data.type);
    }

    return `
      <div class="form-grid">
        <!-- SELECCIÓN DE PROYECTO ASOCIADO EXISTENTE -->
        <div class="form-group full" style="background:rgba(59, 130, 246, 0.08);border:1px solid rgba(59, 130, 246, 0.28);border-radius:10px;padding:12px 16px;">
          <label class="form-label" for="f_dprj" style="color:#60a5fa;font-weight:700;display:flex;align-items:center;gap:8px;font-size:13px;margin-bottom:4px;">
            <i class="fa-solid fa-diagram-project"></i>
            Proyecto Asociado Existente
          </label>
          <div style="font-size:11px;color:var(--text-sub);margin-bottom:8px;">
            Selecciona el proyecto al cual pertenecerá esta factura, boleta o documento:
          </div>
          <select id="f_dprj" class="form-control" onchange="handleDocProjectChange(this.value)" required style="border-color:rgba(59,130,246,0.5);font-weight:600;font-size:13px;">
            ${(DB.projects || []).map(p => `
              <option value="${p.id}" ${currentPrj === p.id ? 'selected' : ''}>
                ${p.id} &bull; ${p.name} (${p.client})
              </option>
            `).join("")}
            <option value="General" ${currentPrj === 'General' ? 'selected' : ''}>General / Corporativo (Sin Proyecto Específico)</option>
          </select>
        </div>

        <!-- TIPO DE DOCUMENTO Y CÓDIGO/FOLIO -->
        <div class="form-group">
          <label class="form-label" for="f_dtype">Tipo de Documento</label>
          <select id="f_dtype" class="form-control" onchange="toggleDocTypeFields(this.value)">
            ${standardDocTypes.map(t => `<option value="${t}" ${currentType === t ? 'selected' : ''}>${t}</option>`).join("")}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="f_dcode">Nº Folio / Código</label>
          <input type="text" id="f_dcode" class="form-control" value="${data.code || data.invoiceFolio || ''}" required placeholder="Ej: FAC-8921, BOL-1044, PIE-03" oninput="syncDocInvoiceCode(this.value)">
        </div>

        <!-- FECHA DEL REGISTRO Y FECHA DE VENCIMIENTO -->
        <div class="form-group">
          <label class="form-label" for="f_ddate">
            <i class="fa-solid fa-calendar-day" style="color:var(--primary);margin-right:4px;"></i>
            Fecha del Documento / Emisión
          </label>
          <input type="date" id="f_ddate" class="form-control" value="${currentDate}" required>
        </div>

        <div class="form-group">
          <label class="form-label" for="f_dexp">Fecha de Vencimiento / Plazo (Opcional)</label>
          <input type="date" id="f_dexp" class="form-control" value="${data.expiryDate || ''}">
        </div>

        <!-- GLOSA O TÍTULO DESCRIPTIVO -->
        <div class="form-group full">
          <label class="form-label" for="f_dname">Glosa o Título Descriptivo</label>
          <input type="text" id="f_dname" class="form-control" value="${data.name || ''}" required placeholder="Ej: Factura de Suministro de Perfiles de Acero o Procedimiento de Calidad">
        </div>

        <!-- DETALLE CONTABLE: MONTO, EMISOR, GASTO VINCULADO -->
        <div class="form-group full" id="doc-invoice-card" style="background:rgba(249, 115, 22, 0.08);border:1px solid rgba(249, 115, 22, 0.3);border-radius:10px;padding:14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:8px;">
            <label class="form-label" style="color:var(--primary);font-size:13px;font-weight:700;margin:0;display:flex;align-items:center;gap:8px;">
              <i class="fa-solid fa-file-invoice-dollar"></i>
              Detalle Contable de la Factura / Boleta
            </label>
            <span class="badge badge-orange" style="font-size:10px;"><i class="fa-solid fa-link"></i> Contabilidad & Finanzas</span>
          </div>

          <div style="font-size:11px;color:var(--text-sub);margin-bottom:12px;">
            Indica el monto y proveedor emisor, o selecciona un gasto ya anotado para autocompletar:
          </div>

          <div class="form-group full" style="margin-bottom:10px;">
            <label class="form-label" style="font-size:11px;" for="f_d_linked_expense">Autocompletar desde Gasto existente del proyecto (opcional):</label>
            <select id="f_d_linked_expense" class="form-control" onchange="onSelectExistingExpenseInvoice(this.value)">
              <!-- Loaded by updateDocLinkedExpenses -->
            </select>
          </div>

          <div class="doc-accounting-grid">
            <div>
              <label class="form-label" style="font-size:11px;" for="f_d_amount">Monto ($)</label>
              <div class="currency-input-wrap">
                <span class="currency-prefix">$</span>
                <input type="text" inputmode="numeric" id="f_d_amount" class="form-control" value="${formatNumberCL(docAmount)}" oninput="handleCurrencyInput(this, 'f_d_amount_helper')" placeholder="0">
              </div>
              <div id="f_d_amount_helper" style="margin-top:3px;">
                ${describeAmountInWords(docAmount)}
              </div>
            </div>
            <div>
              <label class="form-label" style="font-size:11px;" for="f_d_supplier">Emisor / Proveedor</label>
              <input type="text" id="f_d_supplier" class="form-control" value="${data.supplier || ''}" placeholder="Ej: Maestranza Austral SpA o Sodimac">
            </div>
            <div>
              <label class="form-label" style="font-size:11px;" for="f_dstatus">Estado</label>
              <select id="f_dstatus" class="form-control">
                <option value="Vigente" ${(!data.status || data.status === 'Vigente') ? 'selected' : ''}>Vigente</option>
                <option value="Pagado" ${data.status === 'Pagado' ? 'selected' : ''}>Pagado / Rendido</option>
                <option value="Por Vencer" ${data.status === 'Por Vencer' ? 'selected' : ''}>Por Vencer</option>
                <option value="Vencido" ${data.status === 'Vencido' ? 'selected' : ''}>Vencido</option>
                <option value="En Tramite" ${data.status === 'En Tramite' ? 'selected' : ''}>En Trámite</option>
              </select>
            </div>
          </div>
        </div>

        <!-- ADJUNTAR FOTO O DOCUMENTO (CÁMARA / PDF / IMAGEN) -->
        <div class="form-group full" style="background:#0b111e;border:1px solid rgba(249, 115, 22, 0.35);border-radius:12px;padding:16px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
            <div>
              <label class="form-label" style="color:var(--primary);font-weight:700;font-size:14px;margin-bottom:2px;display:flex;align-items:center;gap:8px;">
                <i class="fa-solid fa-camera"></i>
                Foto o Archivo de la Factura / Boleta
              </label>
              <div style="font-size:11px;color:var(--text-sub);">
                Toma una foto en tiempo real con tu cámara o sube un documento PDF o imagen desde tu equipo.
              </div>
            </div>
            <span id="doc-indicator-badge" class="badge ${hasFile ? (fileType === 'pdf' ? 'badge-red' : 'badge-green') : 'badge-gray'}">
              ${hasFile ? (fileType === 'pdf' ? '<i class="fa-solid fa-file-pdf"></i> PDF Listo' : '<i class="fa-solid fa-check"></i> Foto Lista') : '<i class="fa-solid fa-camera"></i> Sin Foto'}
            </span>
          </div>

          <!-- Hidden storage fields -->
          <input type="hidden" id="f_doc_filedata" value="${data.fileData || data.photo || ''}">
          <input type="hidden" id="f_doc_filename" value="${data.fileName || ''}">
          <input type="hidden" id="f_doc_filetype" value="${fileType}">
          <input type="file" id="f_doc_file" accept="image/*,application/pdf" style="display:none;" onchange="handleDocFileUpload(event)">

          <!-- BOTONES DE ACCIÓN: CÁMARA Y ARCHIVO -->
          <div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap;">
            <button type="button" class="btn btn-primary btn-sm" onclick="startDocCamera()" style="box-shadow:0 0 10px rgba(249,115,22,0.25);">
              <i class="fa-solid fa-camera"></i> Tomar Foto con Cámara
            </button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('f_doc_file').click()">
              <i class="fa-solid fa-file-arrow-up"></i> Subir Archivo (Foto o PDF)
            </button>
            <button type="button" id="btn-doc-remove-file" class="btn btn-danger btn-sm" onclick="removeDocFile()" style="display:${hasFile ? 'inline-flex' : 'none'};">
              <i class="fa-solid fa-trash"></i> Quitar Adjunto
            </button>
          </div>

          <!-- CONTENEDOR DE CÁMARA EN VIVO -->
          <div id="doc-camera-container" style="display:none;background:#05070d;border:2px solid var(--primary);border-radius:10px;padding:12px;margin-bottom:14px;text-align:center;">
            <div style="font-size:12px;font-weight:700;color:var(--primary);margin-bottom:8px;display:flex;align-items:center;justify-content:center;gap:6px;">
              <i class="fa-solid fa-video"></i> Enfoca la factura o boleta con buena iluminación
            </div>
            <div style="max-width:540px;margin:0 auto;position:relative;border-radius:8px;overflow:hidden;background:#000;border:1px solid var(--border-color);">
              <video id="doc-camera-video" playsinline autoplay style="width:100%;height:auto;max-height:380px;display:block;object-fit:contain;"></video>
            </div>
            <div id="doc-camera-error" style="display:none;color:#ef4444;font-size:11px;margin-top:8px;"></div>
            <div style="display:flex;justify-content:center;gap:8px;margin-top:10px;flex-wrap:wrap;">
              <button type="button" class="btn btn-primary" onclick="captureDocPhoto()" style="padding:7px 18px;font-size:13px;">
                <i class="fa-solid fa-circle-dot"></i> Capturar Foto
              </button>
              <button type="button" class="btn btn-secondary" onclick="switchDocCameraFacing()" title="Cambiar a cámara frontal/trasera">
                <i class="fa-solid fa-camera-rotate"></i> Girar Cámara
              </button>
              <button type="button" class="btn btn-secondary" onclick="stopDocCamera()">
                <i class="fa-solid fa-xmark"></i> Cancelar
              </button>
            </div>
          </div>

          <!-- ZONA DE VISTA PREVIA / ARRASTRAR ARCHIVO -->
          <div id="doc-file-preview-container" 
               ondragover="event.preventDefault();this.style.borderColor='var(--primary)';" 
               ondragleave="event.preventDefault();this.style.borderColor='var(--border-color)';" 
               ondrop="event.preventDefault();this.style.borderColor='var(--border-color)';if(event.dataTransfer.files.length){document.getElementById('f_doc_file').files=event.dataTransfer.files;handleDocFileUpload({target:{files:event.dataTransfer.files}});}"
               style="border:2px dashed var(--border-color);border-radius:10px;padding:16px;background:#060a12;display:flex;align-items:center;gap:14px;min-height:90px;transition:all 0.2s ease;">
            
            <!-- Estado Vacío -->
            <div id="doc-photo-empty-box" style="display:${hasFile ? 'none' : 'flex'};align-items:center;gap:14px;width:100%;cursor:pointer;" onclick="document.getElementById('f_doc_file').click()">
              <div style="width:52px;height:52px;border-radius:8px;background:rgba(255,255,255,0.04);display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:24px;flex-shrink:0;">
                <i class="fa-solid fa-cloud-arrow-up"></i>
              </div>
              <div>
                <div style="font-weight:700;color:var(--text-main);font-size:13px;">Sin foto ni archivo adjunto</div>
                <div style="font-size:11px;color:var(--text-sub);margin-top:2px;">Haz clic aquí para seleccionar una foto o PDF, o arrastra el archivo directamente a esta caja.</div>
              </div>
            </div>

            <!-- Vista Previa de Imagen -->
            <img id="doc-photo-img" 
                 src="${(hasFile && fileType !== 'pdf') ? (data.fileData || data.photo) : ''}" 
                 alt="Foto Factura" 
                 onclick="showDocImageLightboxCurrent()" 
                 title="Clic para ampliar foto"
                 style="display:${(hasFile && fileType !== 'pdf') ? 'block' : 'none'};width:70px;height:70px;border-radius:8px;object-fit:cover;border:1px solid var(--border-color);cursor:pointer;flex-shrink:0;box-shadow:0 2px 8px rgba(0,0,0,0.4);">

            <!-- Vista Previa de PDF -->
            <div id="doc-pdf-card" 
                 onclick="showDocImageLightboxCurrent()" 
                 title="Clic para previsualizar PDF"
                 style="display:${(hasFile && fileType === 'pdf') ? 'flex' : 'none'};align-items:center;gap:12px;padding:8px 12px;background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.3);border-radius:8px;cursor:pointer;flex-shrink:0;">
              <i class="fa-solid fa-file-pdf" style="color:#ef4444;font-size:28px;"></i>
              <div>
                <div id="doc-pdf-name" style="font-weight:700;font-size:12px;color:#fff;max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                  ${data.fileName || 'factura.pdf'}
                </div>
                <div style="font-size:10px;color:var(--text-sub);">Documento PDF &bull; Clic para ver</div>
              </div>
            </div>

            <!-- Textos de estado cuando hay archivo -->
            <div id="doc-photo-status-info" style="flex:1;">
              <div id="doc-photo-status-title" style="font-weight:700;font-size:13px;color:var(--text-main);">
                ${hasFile ? (data.fileName || 'Foto / Archivo Adjunto') : 'Sin Foto'}
              </div>
              <div id="doc-photo-status-desc" style="font-size:11px;color:var(--text-sub);margin-top:2px;">
                ${hasFile ? 'Documento cargado correctamente. Clic sobre la miniatura para visualizar.' : 'Toma una foto con la cámara o arrastra un archivo JPG, PNG o PDF.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  } else if (entity === "users") {
    const isCreating = !data.id;
    return `
      <div class="form-grid">
        <div class="form-group full">
          <label class="form-label">Nombre Completo</label>
          <input type="text" id="f_uname" class="form-control" value="${data.name || ''}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Correo Electrónico</label>
          <input type="email" id="f_uemail" class="form-control" value="${data.email || ''}" ${isCreating ? '' : 'disabled'}>
        </div>
        <div class="form-group">
          <label class="form-label">Rol</label>
          <select id="f_urole" class="form-control">
            <option value="Desarrollador" ${data.role === 'Desarrollador' ? 'selected' : ''}>Desarrollador</option>
            <option value="Administrador" ${data.role === 'Administrador' ? 'selected' : ''}>Administrador</option>
            <option value="Usuario" ${(!data.role || data.role === 'Usuario') ? 'selected' : ''}>Usuario</option>
          </select>
        </div>
        ${isCreating ? `
          <div class="form-group full">
            <label class="form-label">Contraseña</label>
            <input type="password" id="f_upass" class="form-control" placeholder="Mínimo 4 caracteres" autocomplete="new-password" required>
          </div>
        ` : `
          <div class="form-group full" style="color:var(--text-sub);font-size:12px;padding:8px;background:#1e293b;border-radius:6px;border:1px solid var(--border-color);">
            Para cambiar contraseña, usa la función de "Cambiar contraseña" en tu cuenta de Firebase.
          </div>
        `}
      </div>
    `;
  }
  return "";
}

async function saveModalRecord() {
  if (!verifyDeveloperPermission("guardar modificaciones")) return;
  if (!activeModalEntity) return;

  if (activeModalEntity === "projects") {
    const record = activeModalRecord || { id: document.getElementById("f_id").value.trim() };
    record.id = document.getElementById("f_id").value.trim();
    record.name = document.getElementById("f_name").value.trim();
    record.client = document.getElementById("f_client").value.trim();
    record.location = document.getElementById("f_location").value.trim();
    record.manager = document.getElementById("f_manager").value.trim();
    record.budget = parseCurrencyNumber(document.getElementById("f_budget").value);
    record.spent = parseCurrencyNumber(document.getElementById("f_spent").value);
    record.plannedProgress = Number(document.getElementById("f_plan").value) || 0;
    record.realProgress = Number(document.getElementById("f_real").value) || 0;
    record.startDate = document.getElementById("f_start").value;
    record.endDate = document.getElementById("f_end").value;
    record.status = document.getElementById("f_status").value;

    if (!activeModalRecord) DB.projects.push(record);
  } else if (activeModalEntity === "expenses") {
    const record = activeModalRecord || { id: "EXP-" + Date.now() };
    record.folio = document.getElementById("f_folio").value.trim();
    record.projectId = document.getElementById("f_prjId").value;
    record.category = document.getElementById("f_category").value;
    record.amount = parseCurrencyNumber(document.getElementById("f_amount").value);
    record.supplier = document.getElementById("f_supplier").value.trim();
    record.date = document.getElementById("f_date").value;
    record.status = "Aprobado";
    record.note = document.getElementById("f_note").value.trim();

    if (!activeModalRecord) DB.expenses.push(record);
  } else if (activeModalEntity === "workers") {
    const record = activeModalRecord || { id: "WRK-" + Date.now() };
    record.rut = document.getElementById("f_rut").value.trim();
    record.name = document.getElementById("f_wname").value.trim();
    record.role = document.getElementById("f_role").value.trim();
    record.projectId = document.getElementById("f_wprj").value;
    record.phone = document.getElementById("f_phone").value.trim();
    
    const emailEl = document.getElementById("f_wemail");
    record.email = emailEl ? emailEl.value.trim() : (record.email || "");

    record.medExamExpiry = document.getElementById("f_med").value;
    record.certifications = document.getElementById("f_cert").value.trim();
    record.status = document.getElementById("f_wstatus") ? document.getElementById("f_wstatus").value : (record.status || "Activo en Obra");

    const notesEl = document.getElementById("f_wnotes");
    record.notes = notesEl ? notesEl.value.trim() : (record.notes || "");

    // Datos de jornada laboral y remuneración
    const schedEl = document.getElementById("f_wschedule");
    record.workSchedule = schedEl ? schedEl.value.trim() : (record.workSchedule || "40 hrs/semana (Turno 5x2)");

    const hourlyEl = document.getElementById("f_whourly");
    record.hourlyRate = hourlyEl ? (parseCurrencyNumber(hourlyEl.value) || 8500) : (record.hourlyRate || 8500);

    const hoursEl = document.getElementById("f_whours");
    record.hoursWorked = hoursEl ? (Number(hoursEl.value) || 0) : (record.hoursWorked || 0);

    const ovtEl = document.getElementById("f_wovertime");
    record.overtimeHours = ovtEl ? (Number(ovtEl.value) || 0) : (record.overtimeHours || 0);

    if (!activeModalRecord) DB.workers.push(record);
  } else if (activeModalEntity === "overtime") {
    const record = activeModalRecord || { id: "OVT-" + String(Date.now()).slice(-6) };
    record.workerId = document.getElementById("f_o_wrk").value;
    record.date = document.getElementById("f_o_date").value || new Date().toISOString().split("T")[0];
    record.projectId = document.getElementById("f_o_prj").value;
    record.workSchedule = document.getElementById("f_o_schedule").value.trim();
    record.regularHours = Number(document.getElementById("f_o_reg_hours").value) || 0;
    record.overtimeHours = Number(document.getElementById("f_o_hours").value) || 0;
    
    const rate = parseCurrencyNumber(document.getElementById("f_o_rate").value) || 0;
    record.hourlyRate = rate;
    record.overtimeRate = Math.round(rate * 1.5);
    record.overtimeTotal = Math.round(record.overtimeHours * record.overtimeRate);
    record.totalDayPay = Math.round((record.regularHours * rate) + record.overtimeTotal);

    record.reason = document.getElementById("f_o_reason").value.trim();
    record.supervisor = document.getElementById("f_o_supervisor").value.trim();
    record.status = document.getElementById("f_o_status").value;

    if (!DB.overtime) DB.overtime = [];
    if (!activeModalRecord) {
      DB.overtime.unshift(record);
    }

    // Mantener sincronizado el acumulado de horas extras del colaborador en DB.workers
    const targetWorker = (DB.workers || []).find(w => w.id === record.workerId);
    if (targetWorker) {
      const allWorkerOvt = DB.overtime.filter(o => o.workerId === targetWorker.id);
      const totalOvtHours = allWorkerOvt.reduce((sum, item) => sum + (Number(item.overtimeHours) || 0), 0);
      if (totalOvtHours > 0) {
        targetWorker.overtimeHours = totalOvtHours;
      }
    }
  } else if (activeModalEntity === "tools") {
    const record = activeModalRecord || { id: "TLS-" + Date.now() };
    record.code = document.getElementById("f_tcode").value.trim();
    record.name = document.getElementById("f_tname").value.trim();
    record.brand = document.getElementById("f_tbrand").value.trim();
    record.serialNumber = document.getElementById("f_tserial").value.trim();
    record.projectId = document.getElementById("f_tprj").value.trim();
    record.responsible = document.getElementById("f_tresp").value.trim();
    record.nextMaintenance = document.getElementById("f_tnext").value;
    record.lastMaintenance = activeModalRecord && activeModalRecord.lastMaintenance ? activeModalRecord.lastMaintenance : new Date().toISOString().split("T")[0];
    record.status = activeModalRecord && activeModalRecord.status ? activeModalRecord.status : "En Faena";
    
    // Save equipment photo
    const photoEl = document.getElementById("f_tphoto");
    record.photo = photoEl ? photoEl.value : (activeModalRecord ? activeModalRecord.photo || "" : "");

    if (!activeModalRecord) DB.tools.push(record);
  } else if (activeModalEntity === "documents") {
    const record = activeModalRecord || { id: "DOC-" + Date.now() };
    record.code = document.getElementById("f_dcode").value.trim();
    record.name = document.getElementById("f_dname").value.trim();
    record.type = document.getElementById("f_dtype").value.trim();
    record.projectId = document.getElementById("f_dprj").value.trim();
    
    // Fecha de emisión / registro
    const dateEl = document.getElementById("f_ddate");
    record.date = dateEl && dateEl.value ? dateEl.value : (record.date || new Date().toISOString().slice(0, 10));
    
    // Fecha de vencimiento / plazo
    const expEl = document.getElementById("f_dexp");
    record.expiryDate = expEl ? expEl.value : (record.expiryDate || "");

    const statusEl = document.getElementById("f_dstatus");
    record.status = statusEl ? statusEl.value : (record.status || "Vigente");

    // Factura / Boleta association & Folio
    record.invoiceFolio = record.code;

    const amountEl = document.getElementById("f_d_amount");
    record.amount = amountEl ? parseCurrencyNumber(amountEl.value) : 0;

    const supplierEl = document.getElementById("f_d_supplier");
    record.supplier = supplierEl ? supplierEl.value.trim() : "";

    const linkedExpEl = document.getElementById("f_d_linked_expense");
    record.expenseId = linkedExpEl ? linkedExpEl.value : "";

    // Foto o Documento adjunto (PDF / Imagen)
    const fileDataEl = document.getElementById("f_doc_filedata");
    const fileNameEl = document.getElementById("f_doc_filename");
    const fileTypeEl = document.getElementById("f_doc_filetype");
    
    record.fileData = fileDataEl ? fileDataEl.value : (activeModalRecord ? activeModalRecord.fileData || "" : "");
    record.photo = record.fileData;
    record.fileName = fileNameEl ? fileNameEl.value : (activeModalRecord ? activeModalRecord.fileName || "" : "");
    record.fileType = fileTypeEl ? fileTypeEl.value : (activeModalRecord ? activeModalRecord.fileType || "image" : "image");

    stopDocCamera();

    if (!activeModalRecord) DB.documents.push(record);
  } else if (activeModalEntity === "users") {
    const isCreating = !activeModalRecord;
    const name = document.getElementById("f_uname").value.trim();
    const email = document.getElementById("f_uemail").value.trim();
    const role = document.getElementById("f_urole").value;
    
    if (isCreating) {
      const password = document.getElementById("f_upass").value;
      
      if (!password) {
        alert("La contraseña es requerida para crear un usuario.");
        return;
      }
      
      try {
        // Crear en Firebase si está disponible
        if (window.firebaseAuth) {
          try {
            await firebaseAuth.createUserWithEmailAndPassword(email, password);
          } catch (fbErr) {
            if (fbErr.code === "auth/email-already-in-use") {
              alert("Este correo ya está registrado en Firebase.");
              return;
            } else if (fbErr.code === "auth/weak-password") {
              alert("Contraseña muy débil. Usa al menos 6 caracteres.");
              return;
            }
            console.warn("Nota de Firebase Auth:", fbErr);
          }
        }
        
        // Crear perfil local en DB.users
        const user = {
          id: "usr-" + Date.now(),
          name,
          email,
          role,
          avatar: getInitials(name),
          createdAt: new Date().toISOString().split("T")[0]
        };
        DB.users.push(user);
      } catch (error) {
        alert("Error al crear usuario: " + error.message);
        return;
      }
    } else {
      // Editar: solo actualizar nombre/rol (no email ni contraseña)
      activeModalRecord.name = name;
      activeModalRecord.role = role;
      activeModalRecord.avatar = getInitials(name);
    }
  }

  saveDB();
  closeModal();
  renderCurrentView();
}

function deleteRecord(entity, id) {
  if (!verifyDeveloperPermission(`eliminar el registro ${id}`)) return;

  if (entity === "workers") {
    const worker = (DB.workers || []).find(w => w.id === id);
    const name = worker ? `${worker.name} (${worker.rut})` : id;
    const confirmDelete = confirm(
      `¿Estás seguro de quitar a ${name} de la nómina?\n\n` +
      `Consejo: Si el colaborador solo terminó su faena pero deseas mantener su historial de turnos y horas extras, puedes cambiar su estado a "Finiquitado / No Vigente" o "Disponible (En Base)" en vez de eliminarlo.`
    );
    if (confirmDelete) {
      DB.workers = (DB.workers || []).filter(x => x.id !== id);
      saveDB();
      renderCurrentView();
    }
    return;
  }

  if (confirm(`¿Estás seguro de eliminar el registro ${id}?`)) {
    DB[entity] = (DB[entity] || []).filter(x => x.id !== id);
    saveDB();
    renderCurrentView();
  }
}

// ===== AUTENTICACIÓN CON FIREBASE & SESIÓN LOCAL =====

function showApp() {
  const authScreen = document.getElementById("auth-screen");
  const appLayout = document.getElementById("app-layout");
  if (authScreen) authScreen.style.display = "none";
  if (appLayout) appLayout.style.display = "flex";
  renderCurrentView();
}

function showAuthScreen(showSetupForm = false) {
  const authScreen = document.getElementById("auth-screen");
  const appLayout = document.getElementById("app-layout");
  const loginForm = document.getElementById("auth-login-form");
  const setupForm = document.getElementById("auth-setup-form");
  if (authScreen) authScreen.style.display = "flex";
  if (appLayout) appLayout.style.display = "none";
  if (loginForm) loginForm.style.display = showSetupForm ? "none" : "block";
  if (setupForm) setupForm.style.display = showSetupForm ? "block" : "none";
}

function initAuth() {
  const session = getSession();
  if (session && session.user && DB.users.some(u => u.email === session.user.email)) {
    showApp();
    return;
  }

  if (window.firebaseAuth) {
    try {
      firebaseAuth.onAuthStateChanged((firebaseUser) => {
        if (firebaseUser) {
          const localUser = DB.users.find(u => u.email === firebaseUser.email);
          if (localUser) {
            setLocalSession(localUser);
            showApp();
          } else {
            const current = getSession();
            if (current && current.user && DB.users.some(u => u.email === current.user.email)) {
              showApp();
            } else {
              firebaseAuth.signOut().catch(e => console.error("Logout error:", e));
              showAuthScreen(DB.users.length === 0);
            }
          }
        } else {
          const current = getSession();
          if (current && current.user && DB.users.some(u => u.email === current.user.email)) {
            showApp();
          } else {
            showAuthScreen(DB.users.length === 0);
          }
        }
      });
      return;
    } catch (e) {
      console.warn("onAuthStateChanged error:", e);
    }
  }

  showAuthScreen(DB.users.length === 0);
}

// Guarda datos del usuario en sessionStorage (para la sesión actual)
function setLocalSession(user) {
  currentSession = {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar || getInitials(user.name)
    },
    loginTime: new Date().toISOString()
  };
  sessionStorage.setItem("cm_progest_session", JSON.stringify(currentSession));
}

async function attemptLogin() {
  const emailInput = document.getElementById("auth-email");
  const passInput = document.getElementById("auth-password");
  const errorBox = document.getElementById("auth-login-error");
  const email = emailInput ? emailInput.value.trim() : "";
  const password = passInput ? passInput.value : "";

  if (errorBox) errorBox.textContent = "";

  if (!email || !password) {
    if (errorBox) errorBox.textContent = "Ingresa tu correo y contraseña.";
    return;
  }

  let loggedInViaFirebase = false;

  if (window.firebaseAuth) {
    try {
      await firebaseAuth.signInWithEmailAndPassword(email, password);
      loggedInViaFirebase = true;
    } catch (error) {
      if (error.code === "auth/wrong-password") {
        if (errorBox) errorBox.textContent = "Contraseña incorrecta.";
        if (passInput) passInput.value = "";
        return;
      }
      console.warn("Firebase sign-in notice:", error.message);
    }
  }

  // Verificar perfil en base de datos local
  const localUser = DB.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (localUser) {
    setLocalSession(localUser);
    if (passInput) passInput.value = "";
    showApp();
    return;
  }

  if (loggedInViaFirebase) {
    // Si Firebase lo autenticó pero no estaba en DB local
    const user = {
      id: "usr-" + Date.now(),
      name: email.split("@")[0],
      email: email,
      role: "Usuario",
      avatar: getInitials(email.split("@")[0]),
      createdAt: new Date().toISOString().split("T")[0]
    };
    DB.users.push(user);
    saveDB();
    setLocalSession(user);
    if (passInput) passInput.value = "";
    showApp();
    return;
  }

  if (errorBox) errorBox.textContent = "Correo o contraseña incorrectos.";
  if (passInput) passInput.value = "";
}

async function createFirstUser() {
  const nameInput = document.getElementById("setup-name");
  const emailInput = document.getElementById("setup-email");
  const passInput = document.getElementById("setup-password");
  const errorBox = document.getElementById("auth-setup-error");

  const name = nameInput ? nameInput.value.trim() : "";
  const email = emailInput ? emailInput.value.trim() : "";
  const password = passInput ? passInput.value : "";

  if (errorBox) errorBox.textContent = "";

  if (!name || !email || !password) {
    if (errorBox) errorBox.textContent = "Completa todos los campos.";
    return;
  }
  if (password.length < 4) {
    if (errorBox) errorBox.textContent = "La contraseña debe tener al menos 4 caracteres.";
    return;
  }

  try {
    if (window.firebaseAuth) {
      try {
        await firebaseAuth.createUserWithEmailAndPassword(email, password);
      } catch (fbErr) {
        if (fbErr.code === "auth/email-already-in-use") {
          if (errorBox) errorBox.textContent = "Este correo ya está registrado.";
          return;
        } else if (fbErr.code === "auth/weak-password") {
          if (errorBox) errorBox.textContent = "Contraseña muy débil. Usa al menos 6 caracteres.";
          return;
        } else if (fbErr.code === "auth/invalid-email") {
          if (errorBox) errorBox.textContent = "Correo inválido.";
          return;
        }
        console.warn("Nota de Firebase Auth en creación inicial:", fbErr);
      }
    }
    
    const roleSelect = document.getElementById("setup-role");
    const role = roleSelect ? roleSelect.value : "Desarrollador";
    
    // Crear perfil local en DB.users
    const user = {
      id: "usr-" + Date.now(),
      name,
      email,
      role: role,
      avatar: getInitials(name),
      createdAt: new Date().toISOString().split("T")[0]
    };
    
    DB.users.push(user);
    saveDB();
    setLocalSession(user);
    
    if (passInput) passInput.value = "";
    showApp();
  } catch (error) {
    if (errorBox) errorBox.textContent = "Error: " + error.message;
  }
}

function quickLoginRole(targetRole) {
  loadDB();
  let user = DB.users.find(u => (u.role || "").toLowerCase() === targetRole.toLowerCase());
  if (!user) {
    user = {
      id: "usr-" + (targetRole === "Desarrollador" ? "dev" : "user"),
      name: targetRole === "Desarrollador" ? "Marco Antonio (Dev)" : "Operador Técnico",
      email: targetRole === "Desarrollador" ? "desarrollador@cmindustrial.cl" : "usuario@cmindustrial.cl",
      role: targetRole,
      avatar: targetRole === "Desarrollador" ? "DEV" : "USR",
      createdAt: new Date().toISOString().split("T")[0]
    };
    DB.users.push(user);
    saveDB();
  }
  setLocalSession(user);
  showApp();
}

function switchActiveRole(targetRole) {
  loadDB();
  let user = DB.users.find(u => (u.role || "").toLowerCase() === targetRole.toLowerCase());
  if (!user) {
    user = {
      id: "usr-" + (targetRole === "Desarrollador" ? "dev" : "user"),
      name: targetRole === "Desarrollador" ? "Marco Antonio (Dev)" : "Operador Técnico",
      email: targetRole === "Desarrollador" ? "desarrollador@cmindustrial.cl" : "usuario@cmindustrial.cl",
      role: targetRole,
      avatar: targetRole === "Desarrollador" ? "DEV" : "USR",
      createdAt: new Date().toISOString().split("T")[0]
    };
    DB.users.push(user);
    saveDB();
  }
  setLocalSession(user);
  
  // If current view was a restricted view and switching to Usuario, navigate to dashboard
  if (targetRole === "Usuario" && (currentView === "usuarios" || currentView === "config")) {
    currentView = "dashboard";
    document.querySelectorAll(".nav-item").forEach(item => {
      item.classList.toggle("active", item.dataset.view === "dashboard");
    });
  }
  renderCurrentView();
}

function handleLogout() {
  if (confirm("¿Cerrar sesión?")) {
    if (window.firebaseAuth) {
      firebaseAuth.signOut().catch(e => console.error("Logout error:", e));
    }
    currentSession = null;
    sessionStorage.removeItem("cm_progest_session");
    showAuthScreen(DB.users.length === 0);
  }
}

// App Initialization
document.addEventListener("DOMContentLoaded", () => {
  loadDB();

  // Escape key handler to close mobile sidebar
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      toggleMobileSidebar(false);
    }
  });

  initAuth();
});
