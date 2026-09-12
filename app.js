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
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

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
      const realRole = getUserRole();
      const isDesarrollador = (realRole || "").trim().toLowerCase() === "desarrollador";
      const badgeIcon = isDesarrollador ? "fa-code" : "fa-user-shield";
      topbarBadge.innerHTML = `
        <div class="topbar-role-wrapper">
          <span class="badge badge-blue" style="font-size:11px;padding:4px 9px;" title="Perfil con permisos totales de edición">
            <i class="fa-solid ${badgeIcon}"></i>
            <span class="role-name-full">${realRole} (Edición Habilitada)</span>
            <span class="role-name-short">${realRole}</span>
          </span>
        </div>
      `;
    } else {
      topbarBadge.innerHTML = `
        <div class="topbar-role-wrapper">
          <span class="badge badge-yellow" style="font-size:11px;padding:4px 9px;" title="Perfil restringido a solo consulta">
            <i class="fa-solid fa-user-shield"></i>
            <span class="role-name-full">Usuario (Solo Consulta)</span>
            <span class="role-name-short">Usuario</span>
          </span>
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
    case "cotizaciones":
      renderQuotations(container);
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
  const realRole = (user.role || getUserRole() || "Usuario").toUpperCase();
  const roleBadge = userIsDev ? "badge-blue" : "badge-yellow";
  const roleIcon = userIsDev ? "fa-code" : "fa-user-shield";
  const roleText = userIsDev ? realRole : "USUARIO (CONSULTA)";

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
  syncAllProjectsAutoStatus();
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
              const st = getProjectStatusDetails(p);
              return `
                <tr>
                  <td>
                    <span class="badge ${badgeClass}"><i class="fa-solid fa-circle" style="font-size:7px;"></i> ${h.text}</span>
                    <div style="margin-top:4px;">
                      <span class="badge ${st.badgeClass}" style="font-size:10px;padding:2px 6px;">
                        <i class="fa-solid ${st.icon}"></i> ${st.label}
                      </span>
                    </div>
                  </td>
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

// ==========================================
// 1.5. COTIZACIONES & COSTOS INDUSTRIALES (ESTRUCTURA EXCEL CM INDUSTRIAL)
// ==========================================

let activeQuotationFilter = "todas";
let quotationSearchTerm = "";

function renderQuotations(container) {
  const userIsDev = isDeveloper();
  const quotations = DB.quotations || [];

  // Filtered list
  const filteredQuotes = quotations.filter(q => {
    const matchStatus = activeQuotationFilter === "todas" || (q.status || "Borrador").toLowerCase() === activeQuotationFilter.toLowerCase();
    const term = quotationSearchTerm.toLowerCase();
    const matchSearch = !term || 
      (q.title || "").toLowerCase().includes(term) ||
      (q.code || "").toLowerCase().includes(term) ||
      (q.client || "").toLowerCase().includes(term);
    return matchStatus && matchSearch;
  });

  // Calculate high-level KPIs
  const totalCotizaciones = quotations.length;
  const totalMontoCotizado = quotations.reduce((acc, q) => acc + (Number(q.totalNet) || 0), 0);
  const aprobadas = quotations.filter(q => q.status === "Aprobada" || q.status === "Convertida").length;
  const totalUtilidad = quotations.reduce((acc, q) => acc + (Number(q.profitAmount) || 0), 0);

  container.innerHTML = `
    ${!userIsDev ? `
      <div class="mode-banner">
        <div class="mode-banner-content">
          <div class="mode-banner-icon">
            <i class="fa-solid fa-user-shield"></i>
          </div>
          <div>
            <div class="mode-banner-title">Perfil: Usuario (Modo Consulta Protegido)</div>
            <div class="mode-banner-desc">Puedes revisar las cotizaciones, exportar las hojas de costos y generar presupuestos en PDF. La creación y edición requiere rol de Desarrollador.</div>
          </div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="showAuthScreen(true)" style="align-self:center;font-size:12px;">
          <i class="fa-solid fa-code"></i> Entrar como Desarrollador
        </button>
      </div>
    ` : ""}

    <!-- Module Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
      <div>
        <h1 style="font-size:22px;font-weight:800;color:#fff;margin:0 0 4px;display:flex;align-items:center;gap:10px;">
          <i class="fa-solid fa-file-invoice-dollar" style="color:var(--primary);"></i>
          Cotizaciones & Presupuestos
        </h1>
        <p style="font-size:13px;color:var(--text-sub);margin:0;">
          Calculadora de costos según estructura CM Industrial (Mano de Obra, Insumos, Materiales, Administración, Imprevistos y Margen de Utilidad).
        </p>
      </div>

      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-secondary" onclick="openQuotationSimulatorModal()" style="font-size:13px;border-color:var(--primary);color:#fed7aa;" title="Simulador manual sin alterar datos reales">
          <i class="fa-solid fa-calculator" style="color:var(--primary);"></i> Simulador Manual (Sin alterar datos)
        </button>
        <button class="btn btn-secondary" onclick="openQuotationTemplateModal()" style="font-size:13px;">
          <i class="fa-solid fa-file-import"></i> Plantillas Rápidas
        </button>
        ${userIsDev ? `
          <button class="btn btn-primary" onclick="openQuotationModal()" style="font-size:13px;">
            <i class="fa-solid fa-plus"></i> Nueva Cotización
          </button>
        ` : ""}
      </div>
    </div>

    <!-- KPI Summary Cards -->
    <div class="kpi-grid" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-bottom: 22px;">
      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">TOTAL COTIZACIONES</span>
          <i class="fa-solid fa-folder-open kpi-icon" style="color:var(--primary);"></i>
        </div>
        <div class="kpi-value" style="color:#fff;">${totalCotizaciones} <span style="font-size:13px;font-weight:400;color:var(--text-sub);">emitidas</span></div>
        <div class="kpi-subtext">Histórico en plataforma</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">MONTO TOTAL COTIZADO</span>
          <i class="fa-solid fa-money-bill-wave kpi-icon" style="color:#38bdf8;"></i>
        </div>
        <div class="kpi-value" style="color:#38bdf8;">$ ${formatNumberCL(totalMontoCotizado)}</div>
        <div class="kpi-subtext">Suma de cartera neta</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">APROBADAS / CONVERTIDAS</span>
          <i class="fa-solid fa-circle-check kpi-icon" style="color:var(--success);"></i>
        </div>
        <div class="kpi-value" style="color:var(--success);">${aprobadas} <span style="font-size:13px;font-weight:400;color:var(--text-sub);">obras</span></div>
        <div class="kpi-subtext">${totalCotizaciones > 0 ? ((aprobadas / totalCotizaciones) * 100).toFixed(0) : 0}% tasa de adjudicación</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">UTILIDAD PROYECTADA (50%)</span>
          <i class="fa-solid fa-arrow-trend-up kpi-icon" style="color:#a855f7;"></i>
        </div>
        <div class="kpi-value" style="color:#a855f7;">$ ${formatNumberCL(totalUtilidad)}</div>
        <div class="kpi-subtext">Margen bruto estimado</div>
      </div>
    </div>

    <!-- Filter & Search Bar -->
    <div class="card" style="padding:14px 16px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;background:#0d1424;">
      <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:260px;">
        <i class="fa-solid fa-magnifying-glass" style="color:var(--text-muted);font-size:14px;"></i>
        <input type="text" class="form-control" placeholder="Buscar por proyecto, código o cliente..." value="${escapeHtml(quotationSearchTerm)}" oninput="quotationSearchTerm=this.value;renderQuotations(document.getElementById('view-root'))" style="background:transparent;border:none;padding:6px 0;font-size:13px;color:#fff;">
      </div>

      <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
        <span style="font-size:11px;color:var(--text-sub);text-transform:uppercase;font-weight:700;margin-right:4px;">Estado:</span>
        ${["todas", "borrador", "enviada", "aprobada", "convertida", "rechazada"].map(st => `
          <button class="btn btn-sm ${activeQuotationFilter === st ? 'btn-primary' : 'btn-secondary'}" onclick="activeQuotationFilter='${st}';renderQuotations(document.getElementById('view-root'))" style="font-size:11px;padding:4px 10px;text-transform:capitalize;">
            ${st}
          </button>
        `).join("")}
      </div>
    </div>

    <!-- Quotations Table / List -->
    <div class="card" style="padding:0;overflow:hidden;background:#0d1424;">
      <div style="padding:16px 20px;border-bottom:1px solid var(--border-color);display:flex;align-items:center;justify-content:space-between;">
        <h3 style="font-size:15px;font-weight:700;color:#fff;margin:0;">
          Listado de Presupuestos & Cotizaciones (${filteredQuotes.length})
        </h3>
        <span style="font-size:11px;color:var(--text-sub);">Estructura Centro de Costos + Utilidad 50%</span>
      </div>

      <div style="overflow-x:auto;">
        <table class="table" style="margin:0;width:100%;">
          <thead>
            <tr>
              <th style="padding:12px 16px;">Código / Obra</th>
              <th style="padding:12px 16px;">Cliente</th>
              <th style="padding:12px 16px;">Duración</th>
              <th style="padding:12px 16px;text-align:right;">Mano de Obra</th>
              <th style="padding:12px 16px;text-align:right;">Insumos & Mat.</th>
              <th style="padding:12px 16px;text-align:right;">C. Costos</th>
              <th style="padding:12px 16px;text-align:right;">Utilidad</th>
              <th style="padding:12px 16px;text-align:right;">Total Neto</th>
              <th style="padding:12px 16px;text-align:center;">Estado</th>
              <th style="padding:12px 16px;text-align:center;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${filteredQuotes.length === 0 ? `
              <tr>
                <td colspan="10" style="text-align:center;padding:36px;color:var(--text-sub);">
                  <i class="fa-solid fa-file-circle-question" style="font-size:32px;margin-bottom:10px;opacity:0.4;display:block;"></i>
                  No se encontraron cotizaciones con los filtros seleccionados.
                  <div style="margin-top:10px;">
                    <button class="btn btn-secondary btn-sm" onclick="openQuotationTemplateModal()">Cargar Plantilla de Ejemplo</button>
                  </div>
                </td>
              </tr>
            ` : filteredQuotes.map(q => {
              const statusColors = {
                "Borrador": { bg: "rgba(156,163,175,0.12)", color: "#9ca3af", border: "rgba(156,163,175,0.3)" },
                "Enviada": { bg: "rgba(56,189,248,0.12)", color: "#38bdf8", border: "rgba(56,189,248,0.3)" },
                "Aprobada": { bg: "rgba(34,197,94,0.15)", color: "#4ade80", border: "rgba(34,197,94,0.4)" },
                "Convertida": { bg: "rgba(168,85,247,0.15)", color: "#c084fc", border: "rgba(168,85,247,0.4)" },
                "Rechazada": { bg: "rgba(239,68,68,0.12)", color: "#f87171", border: "rgba(239,68,68,0.3)" }
              };
              const st = statusColors[q.status] || statusColors["Borrador"];

              return `
                <tr>
                  <td style="padding:14px 16px;">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                      <span class="badge" style="background:#1e293b;color:#f8fafc;font-size:10px;font-weight:700;letter-spacing:0.04em;">${escapeHtml(q.code || q.id)}</span>
                    </div>
                    <div style="font-weight:700;color:#fff;font-size:13px;max-width:280px;line-height:1.3;">
                      ${escapeHtml(q.title || "Cotización sin título")}
                    </div>
                  </td>
                  <td style="padding:14px 16px;color:var(--text-sub);font-size:12.5px;">
                    <i class="fa-solid fa-building" style="font-size:10px;margin-right:4px;"></i>
                    ${escapeHtml(q.client || "Cliente no especificado")}
                  </td>
                  <td style="padding:14px 16px;font-size:12.5px;color:#fff;">
                    <span class="badge badge-gray" style="font-size:11px;">
                      <i class="fa-regular fa-clock"></i> ${escapeHtml(q.executionTime || `${q.months || 4} Meses`)}
                    </span>
                  </td>
                  <td style="padding:14px 16px;text-align:right;font-size:12.5px;color:#cbd5e1;font-weight:600;">
                    $ ${formatNumberCL(q.laborTotal || 0)}
                  </td>
                  <td style="padding:14px 16px;text-align:right;font-size:12.5px;color:#cbd5e1;font-weight:600;">
                    $ ${formatNumberCL(q.expensesSubtotal || 0)}
                  </td>
                  <td style="padding:14px 16px;text-align:right;font-size:12.5px;color:#e2e8f0;font-weight:700;">
                    $ ${formatNumberCL(q.totalCostCenter || 0)}
                  </td>
                  <td style="padding:14px 16px;text-align:right;font-size:12.5px;color:#a855f7;font-weight:700;">
                    $ ${formatNumberCL(q.profitAmount || 0)}
                    <div style="font-size:10px;color:var(--text-sub);font-weight:400;">(${q.profitPercent || 50}%)</div>
                  </td>
                  <td style="padding:14px 16px;text-align:right;font-size:14px;color:#4ade80;font-weight:800;">
                    $ ${formatNumberCL(q.totalNet || 0)}
                    ${q.discountPercent ? `
                      <div style="font-size:10px;color:var(--warning);font-weight:500;">
                        Desc. ${q.discountPercent}%: $ ${formatNumberCL(q.totalNetNegotiated || q.totalNet)}
                      </div>
                    ` : ""}
                  </td>
                  <td style="padding:14px 16px;text-align:center;">
                    ${userIsDev ? `
                      <select class="form-control form-control-sm" style="background:${st.bg};color:${st.color};border:1px solid ${st.border};font-weight:700;font-size:11px;padding:3px 6px;border-radius:6px;cursor:pointer;" onchange="onQuotationStatusChange('${q.id}', this.value)" title="Seleccionar estado: si marcas 'Aprobada' se cargará y guardará directamente en Proyectos y Faenas">
                        <option value="Borrador" ${q.status === "Borrador" ? "selected" : ""} style="background:#0f172a;color:#9ca3af;">Borrador</option>
                        <option value="Enviada" ${q.status === "Enviada" ? "selected" : ""} style="background:#0f172a;color:#38bdf8;">Enviada</option>
                        <option value="Aprobada" ${q.status === "Aprobada" ? "selected" : ""} style="background:#0f172a;color:#4ade80;">✔ Aprobada (Cargar a Obra)</option>
                        <option value="Convertida" ${q.status === "Convertida" ? "selected" : ""} style="background:#0f172a;color:#c084fc;">Convertida</option>
                        <option value="Rechazada" ${q.status === "Rechazada" ? "selected" : ""} style="background:#0f172a;color:#f87171;">Rechazada</option>
                      </select>
                    ` : `
                      <span class="badge" style="background:${st.bg};color:${st.color};border:1px solid ${st.border};font-size:11px;padding:3px 9px;">
                        ${escapeHtml(q.status || "Borrador")}
                      </span>
                    `}
                  </td>
                  <td style="padding:14px 16px;text-align:center;">
                    <div style="display:inline-flex;gap:4px;align-items:center;">
                      <button class="btn btn-secondary btn-sm" onclick="openQuotationDetails('${q.id}')" title="Ver Hoja de Costos Estilo Excel" style="padding:5px 8px;font-size:11px;background:#1e293b;border:1px solid var(--border-color);">
                        <i class="fa-solid fa-table-cells" style="color:#38bdf8;"></i> Excel
                      </button>
                      
                      <button class="btn btn-secondary btn-sm" onclick="printQuotation('${q.id}')" title="Imprimir / Exportar PDF Formal" style="padding:5px 8px;font-size:11px;">
                        <i class="fa-solid fa-print"></i>
                      </button>

                      ${userIsDev ? `
                        <button class="btn btn-sm" onclick="approveQuotationAndLoadProject('${q.id}', true)" title="Aprobar proyecto y cargar a Proyectos & Faenas para rellenar recuadros" style="padding:5px 8px;font-size:11px;background:rgba(34,197,94,0.18);color:#4ade80;border:1px solid rgba(34,197,94,0.35);font-weight:700;">
                          <i class="fa-solid fa-circle-check"></i> ${q.status === "Aprobada" || q.status === "Convertida" ? "Ver en Obra" : "Aprobar y Cargar"}
                        </button>

                        <button class="btn btn-secondary btn-sm" onclick="openQuotationModal('${q.id}')" title="Editar Cotización" style="padding:5px 8px;font-size:11px;">
                          <i class="fa-solid fa-pen"></i>
                        </button>

                        <button class="btn btn-secondary btn-sm" onclick="deleteQuotation('${q.id}')" title="Eliminar Cotización" style="padding:5px 8px;font-size:11px;color:var(--danger);">
                          <i class="fa-solid fa-trash"></i>
                        </button>
                      ` : ""}
                    </div>
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

// Open detailed Excel-like Sheet Modal (The exact structure from user's images)
function openQuotationDetails(quoteId) {
  const quote = (DB.quotations || []).find(q => q.id === quoteId);
  if (!quote) return;

  const modal = document.getElementById("record-modal");
  const title = document.getElementById("modal-title");
  const body = document.getElementById("modal-body");
  const footer = document.getElementById("modal-footer");

  if (!modal || !title || !body) return;

  title.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;">
      <i class="fa-solid fa-table" style="color:var(--primary);"></i>
      <span>Hoja de Costos & Cotización Industrial &bull; ${escapeHtml(quote.code || quote.id)}</span>
    </div>
  `;

  body.innerHTML = `
    <div style="background:#090d16;border-radius:10px;padding:18px;border:1px solid #1e293b;font-family:Inter,system-ui,sans-serif;">
      
      <!-- Excel Header Block -->
      <div style="background:#1e293b;border:2px solid #334155;border-radius:6px;padding:12px 16px;margin-bottom:16px;text-align:center;">
        <div style="font-size:16px;font-weight:900;color:#f8fafc;letter-spacing:0.03em;text-transform:uppercase;">
          ${escapeHtml(quote.title || "PROYECTO INDUSTRIAL")}
        </div>
        <div style="font-size:12px;font-weight:700;color:var(--primary);margin-top:4px;">
          EJECUCIÓN: ${escapeHtml(quote.executionTime || `${quote.months || 4} MESES`)}
        </div>
      </div>

      <div style="display:grid;grid-template-columns: 2fr 1fr;gap:16px;align-items:start;">
        
        <!-- Main Cost Sheet (Left Table) -->
        <div>
          
          <!-- SECTION 1: MANO DE OBRA -->
          <table style="width:100%;border-collapse:collapse;margin-bottom:14px;font-size:12px;border:1px solid #334155;">
            <thead>
              <tr style="background:#0284c7;color:#fff;">
                <th style="padding:6px 10px;text-align:left;border:1px solid #334155;font-weight:800;">DESCRIPCION</th>
                <th style="padding:6px 10px;text-align:center;border:1px solid #334155;width:60px;">CANT</th>
                <th style="padding:6px 10px;text-align:right;border:1px solid #334155;">VALORES (IMPONIBLE)</th>
              </tr>
              <tr style="background:#fed7aa;color:#7c2d12;">
                <th colspan="3" style="padding:4px 10px;text-align:left;font-size:11px;font-weight:800;">SUELDOS POR MES</th>
              </tr>
            </thead>
            <tbody>
              ${(quote.laborItems || []).map(item => `
                <tr style="background:#0f172a;color:#f8fafc;">
                  <td style="padding:6px 10px;border:1px solid #1e293b;">${escapeHtml(item.role)}</td>
                  <td style="padding:6px 10px;border:1px solid #1e293b;text-align:center;">${item.count}</td>
                  <td style="padding:6px 10px;border:1px solid #1e293b;text-align:right;font-weight:600;">$ ${formatNumberCL(item.taxableMonthly)}</td>
                </tr>
              `).join("")}
              <tr style="background:#1e293b;color:#f8fafc;font-weight:700;">
                <td style="padding:6px 10px;border:1px solid #334155;">SUBTOTAL MENSUAL</td>
                <td style="padding:6px 10px;border:1px solid #334155;text-align:center;">-</td>
                <td style="padding:6px 10px;border:1px solid #334155;text-align:right;">$ ${formatNumberCL(quote.laborMonthlySubtotal || 0)}</td>
              </tr>
              <tr style="background:#1e293b;color:#38bdf8;font-weight:700;">
                <td style="padding:6px 10px;border:1px solid #334155;">POR ${quote.months || 4} MESES</td>
                <td style="padding:6px 10px;border:1px solid #334155;text-align:center;">${quote.months || 4}</td>
                <td style="padding:6px 10px;border:1px solid #334155;text-align:right;">$ ${formatNumberCL(quote.laborTotal || 0)}</td>
              </tr>
              <tr style="background:#334155;color:#fff;font-weight:900;">
                <td colspan="2" style="padding:8px 10px;border:1px solid #475569;font-size:12px;">TOTAL MANO DE OBRA</td>
                <td style="padding:8px 10px;border:1px solid #475569;text-align:right;font-size:13px;color:#fed7aa;">$ ${formatNumberCL(quote.laborTotal || 0)}</td>
              </tr>
            </tbody>
          </table>

          <!-- SECTION 2: GASTOS E INSUMOS -->
          <table style="width:100%;border-collapse:collapse;margin-bottom:14px;font-size:12px;border:1px solid #334155;">
            <thead>
              <tr style="background:#fdba74;color:#7c2d12;">
                <th colspan="4" style="padding:6px 10px;text-align:center;font-weight:900;letter-spacing:0.04em;">GASTOS E INSUMOS</th>
              </tr>
              <tr style="background:#fed7aa;color:#7c2d12;">
                <th style="padding:5px 10px;text-align:left;border:1px solid #334155;font-weight:800;">DETALLE</th>
                <th style="padding:5px 10px;text-align:center;border:1px solid #334155;width:60px;">CANT</th>
                <th style="padding:5px 10px;text-align:right;border:1px solid #334155;width:100px;">VALOR UNIT</th>
                <th style="padding:5px 10px;text-align:right;border:1px solid #334155;width:120px;">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              <tr style="background:#1e293b;color:#f97316;font-weight:800;">
                <td colspan="4" style="padding:4px 10px;border:1px solid #334155;font-size:11px;">TRABAJO EN TERRENO & LOGISTICA</td>
              </tr>
              ${(quote.fieldItems || []).map(item => `
                <tr style="background:#0f172a;color:#f8fafc;">
                  <td style="padding:5px 10px;border:1px solid #1e293b;">${escapeHtml(item.name)}</td>
                  <td style="padding:5px 10px;border:1px solid #1e293b;text-align:center;">${item.qty}</td>
                  <td style="padding:5px 10px;border:1px solid #1e293b;text-align:right;">$ ${formatNumberCL(item.unitPrice)}</td>
                  <td style="padding:5px 10px;border:1px solid #1e293b;text-align:right;font-weight:600;">$ ${formatNumberCL(item.total)}</td>
                </tr>
              `).join("")}

              <tr style="background:#fed7aa;color:#7c2d12;font-weight:800;">
                <td colspan="4" style="padding:4px 10px;border:1px solid #334155;font-size:11px;">MATERIALES Y EQUIPOS</td>
              </tr>
              ${(quote.materialItems || []).map(item => `
                <tr style="background:#0f172a;color:#f8fafc;">
                  <td style="padding:5px 10px;border:1px solid #1e293b;">${escapeHtml(item.name)}</td>
                  <td style="padding:5px 10px;border:1px solid #1e293b;text-align:center;">${item.qty || '-'}</td>
                  <td style="padding:5px 10px;border:1px solid #1e293b;text-align:right;">${item.unitPrice ? `$ ${formatNumberCL(item.unitPrice)}` : '-'}</td>
                  <td style="padding:5px 10px;border:1px solid #1e293b;text-align:right;font-weight:600;">$ ${formatNumberCL(item.total)}</td>
                </tr>
              `).join("")}

              <tr style="background:#334155;color:#fff;font-weight:900;">
                <td colspan="3" style="padding:8px 10px;border:1px solid #475569;">SUBTOTAL GASTOS</td>
                <td style="padding:8px 10px;border:1px solid #475569;text-align:right;font-size:13px;color:#fed7aa;">$ ${formatNumberCL(quote.expensesSubtotal || 0)}</td>
              </tr>
            </tbody>
          </table>

          <!-- SECTION 3: CENTRO DE COSTOS, ADMIN Y UTILIDAD -->
          <table style="width:100%;border-collapse:collapse;font-size:12px;border:1px solid #334155;">
            <tbody>
              <tr style="background:#1e293b;color:#f8fafc;font-weight:800;">
                <td style="padding:8px 10px;border:1px solid #334155;">SUB TOTAL CENTRO DE COSTOS</td>
                <td style="padding:8px 10px;border:1px solid #334155;text-align:right;font-size:13px;">$ ${formatNumberCL(quote.costCenterSubtotal || 0)}</td>
              </tr>
              <tr style="background:#fed7aa;color:#7c2d12;font-weight:800;">
                <td colspan="2" style="padding:4px 10px;font-size:11px;">ADMINISTRACION E IMPREVISTOS</td>
              </tr>
              <tr style="background:#0f172a;color:#cbd5e1;">
                <td style="padding:5px 10px;border:1px solid #1e293b;">COMISION ADMINISTRACION (${quote.adminPercent || 2}%)</td>
                <td style="padding:5px 10px;border:1px solid #1e293b;text-align:right;">$ ${formatNumberCL(quote.adminTotal || 0)}</td>
              </tr>
              <tr style="background:#0f172a;color:#cbd5e1;">
                <td style="padding:5px 10px;border:1px solid #1e293b;">GASTOS IMPREVISTOS (${quote.contingencyPercent || 5}%)</td>
                <td style="padding:5px 10px;border:1px solid #1e293b;text-align:right;">$ ${formatNumberCL(quote.contingencyTotal || 0)}</td>
              </tr>
              <tr style="background:#1e293b;color:#cbd5e1;font-weight:700;">
                <td style="padding:6px 10px;border:1px solid #334155;">SUBTOTAL ADMINISTRACION</td>
                <td style="padding:6px 10px;border:1px solid #334155;text-align:right;">$ ${formatNumberCL(quote.adminSubtotal || 0)}</td>
              </tr>
              <tr style="background:#334155;color:#fff;font-weight:900;">
                <td style="padding:8px 10px;border:1px solid #475569;font-size:13px;">TOTAL CENTRO DE COSTOS</td>
                <td style="padding:8px 10px;border:1px solid #475569;text-align:right;font-size:14px;color:#38bdf8;">$ ${formatNumberCL(quote.totalCostCenter || 0)}</td>
              </tr>
              <tr style="background:rgba(34,197,94,0.18);color:#4ade80;font-weight:900;">
                <td style="padding:8px 10px;border:1px solid rgba(34,197,94,0.4);font-size:13px;">UTILIDAD (${quote.profitPercent || 50}%)</td>
                <td style="padding:8px 10px;border:1px solid rgba(34,197,94,0.4);text-align:right;font-size:14px;">$ ${formatNumberCL(quote.profitAmount || 0)}</td>
              </tr>
              <tr style="background:#052e16;color:#22c55e;font-weight:900;border:2px solid #22c55e;">
                <td style="padding:10px;font-size:14px;letter-spacing:0.02em;">TOTAL NETO DE VENTA</td>
                <td style="padding:10px;text-align:right;font-size:16px;">$ ${formatNumberCL(quote.totalNet || 0)}</td>
              </tr>
              ${quote.discountPercent ? `
                <tr style="background:#451a03;color:#fbbf24;font-weight:800;">
                  <td style="padding:8px 10px;border:1px solid #d97706;">FACTOR NEGOCIACIÓN / DESCUENTO (${quote.discountPercent}%)</td>
                  <td style="padding:8px 10px;border:1px solid #d97706;text-align:right;font-size:14px;">$ ${formatNumberCL(quote.totalNetNegotiated || quote.totalNet)}</td>
                </tr>
              ` : ""}
            </tbody>
          </table>

        </div>

        <!-- Right Side: Payroll Deductions Breakdown (Calculo Mensual Fonasa/AFP) -->
        <div>
          <div style="background:#fef08a;color:#854d0e;padding:8px 12px;font-weight:900;font-size:12px;text-align:center;border-radius:6px 6px 0 0;border:1px solid #ca8a04;">
            CALCULO MENSUAL LIQUIDO / IMPONIBLE
          </div>
          <div style="background:#0f172a;border:1px solid #ca8a04;border-top:none;border-radius:0 0 6px 6px;padding:12px;font-size:11px;">
            
            <!-- Ayudante Card -->
            <div style="margin-bottom:12px;padding-bottom:10px;border-bottom:1px dashed #334155;">
              <div style="font-weight:800;color:#38bdf8;margin-bottom:4px;">AYUDANTE</div>
              <div style="display:flex;justify-content:space-between;color:#e2e8f0;"><span>Imponible:</span> <strong>$ 865.000</strong></div>
              <div style="display:flex;justify-content:space-between;color:#94a3b8;"><span>FONASA (7%):</span> <span>$ 60.550</span></div>
              <div style="display:flex;justify-content:space-between;color:#94a3b8;"><span>AFP (~12%):</span> <span>$ 103.800</span></div>
              <div style="display:flex;justify-content:space-between;color:#4ade80;font-weight:700;margin-top:2px;"><span>Líquido Estimado:</span> <span>$ 700.650</span></div>
            </div>

            <!-- Operario Card -->
            <div style="margin-bottom:12px;padding-bottom:10px;border-bottom:1px dashed #334155;">
              <div style="font-weight:800;color:#38bdf8;margin-bottom:4px;">OPERARIO</div>
              <div style="display:flex;justify-content:space-between;color:#e2e8f0;"><span>Imponible:</span> <strong>$ 1.012.500</strong></div>
              <div style="display:flex;justify-content:space-between;color:#94a3b8;"><span>FONASA (7%):</span> <span>$ 70.875</span></div>
              <div style="display:flex;justify-content:space-between;color:#94a3b8;"><span>AFP (~12%):</span> <span>$ 121.500</span></div>
              <div style="display:flex;justify-content:space-between;color:#4ade80;font-weight:700;margin-top:2px;"><span>Líquido Estimado:</span> <span>$ 820.125</span></div>
            </div>

            <!-- Bono Supervisión -->
            <div style="margin-bottom:6px;">
              <div style="font-weight:800;color:#38bdf8;margin-bottom:4px;">BONO SUPERVISIÓN</div>
              <div style="display:flex;justify-content:space-between;color:#e2e8f0;"><span>Imponible:</span> <strong>$ 247.000</strong></div>
              <div style="display:flex;justify-content:space-between;color:#94a3b8;"><span>FONASA:</span> <span>$ 17.290</span></div>
              <div style="display:flex;justify-content:space-between;color:#94a3b8;"><span>AFP:</span> <span>$ 29.640</span></div>
              <div style="display:flex;justify-content:space-between;color:#4ade80;font-weight:700;margin-top:2px;"><span>Líquido Estimado:</span> <span>$ 200.070</span></div>
            </div>

          </div>

          <!-- Notes / Observations -->
          ${quote.notes ? `
            <div style="margin-top:14px;background:#1e293b;border-radius:6px;padding:10px 12px;font-size:11.5px;color:#94a3b8;">
              <strong style="color:#fff;display:block;margin-bottom:4px;"><i class="fa-solid fa-circle-info" style="color:var(--primary);"></i> Observaciones Técnicas:</strong>
              ${escapeHtml(quote.notes)}
            </div>
          ` : ""}

          <!-- Quick Action Buttons -->
          <div style="margin-top:16px;display:flex;flex-direction:column;gap:8px;">
            <button class="btn btn-primary" onclick="printQuotation('${quote.id}')" style="width:100%;justify-content:center;font-size:12px;">
              <i class="fa-solid fa-print"></i> Imprimir Cotización Formal
            </button>
            ${isDeveloper() ? `
              <button class="btn btn-secondary" onclick="approveQuotationAndLoadProject('${quote.id}', true)" style="width:100%;justify-content:center;font-size:12px;background:rgba(34,197,94,0.18);color:#4ade80;border-color:rgba(34,197,94,0.4);font-weight:700;">
                <i class="fa-solid fa-circle-check"></i> ${quote.status === "Aprobada" || quote.status === "Convertida" ? "Ver en Proyectos & Faenas" : "Aprobar Proyecto y Cargar a Faenas"}
              </button>
            ` : ""}
          </div>
        </div>

      </div>

    </div>
  `;

  if (footer) {
    footer.innerHTML = `
      <button class="btn btn-secondary" onclick="closeModal()">Cerrar</button>
    `;
  }

  modal.style.display = "flex";
}

// Helper when changing status from the select dropdown
function onQuotationStatusChange(quoteId, newStatus) {
  if (!verifyDeveloperPermission("cambiar estado de la cotización")) return;
  const quote = (DB.quotations || []).find(q => q.id === quoteId);
  if (!quote) return;

  if (newStatus === "Aprobada") {
    approveQuotationAndLoadProject(quoteId, true);
  } else {
    quote.status = newStatus;
    saveDB();
    renderQuotations(document.getElementById("view-root"));
  }
}

// Approve quotation, map all fields to Proyectos & Faenas, save project, and load into form
function approveQuotationAndLoadProject(quoteId, openEditModalAfter = true) {
  if (!verifyDeveloperPermission("aprobar y cargar cotización a proyecto")) return;
  
  const quote = (DB.quotations || []).find(q => q.id === quoteId);
  if (!quote) return;

  // Mark quote as Aprobada
  quote.status = "Aprobada";

  DB.projects = DB.projects || [];
  
  // Check if project already exists for this quote
  let project = DB.projects.find(p => p.quoteId === quote.id || (p.quoteCode && p.quoteCode === (quote.code || quote.id)));

  const today = new Date().toISOString().split("T")[0];
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + (Number(quote.months) || 4));
  const endFormatted = endDate.toISOString().split("T")[0];
  const netBudget = Number(quote.totalNet) || Number(quote.totalCostCenter) || 0;

  let targetProjectId = "";

  if (project) {
    project.name = quote.title;
    project.client = quote.client || project.client || "Cliente General";
    project.budget = netBudget;
    project.status = project.status || "En Ejecución";
    project.notes = `Cotización Aprobada ${quote.code || quote.id}. Presupuesto Asignado: $ ${formatNumberCL(netBudget)} Neto.`;
    targetProjectId = project.id;
  } else {
    const newProjectId = "PRJ-" + (String(DB.projects.length + 1).padStart(3, "0"));
    project = {
      id: newProjectId,
      quoteId: quote.id,
      quoteCode: quote.code || quote.id,
      name: quote.title,
      client: quote.client || "Cliente General",
      location: "Faena en Terreno / Planta",
      manager: "Jefe de Proyecto / Ing. Residente",
      budget: netBudget,
      spent: 0,
      plannedProgress: 0,
      realProgress: 0,
      startDate: today,
      endDate: endFormatted,
      status: "En Ejecución",
      notes: `Proyecto cargado automáticamente desde la Cotización Aprobada ${quote.code || quote.id} ($ ${formatNumberCL(netBudget)} Neto).`
    };
    DB.projects.unshift(project);
    targetProjectId = newProjectId;
  }

  saveDB();
  closeModal();

  // Navigate to Proyectos & Faenas view
  navigateTo("proyectos");

  // Open the project edit modal so all boxes/recuadros are loaded and displayed to the user
  if (openEditModalAfter && targetProjectId) {
    setTimeout(() => {
      openEditModal("projects", targetProjectId);
    }, 120);
  }
}

// Convert an approved quotation into an active Project
function convertQuotationToProject(quoteId) {
  approveQuotationAndLoadProject(quoteId, true);
}

// Print formal quotation for client
function printQuotation(quoteId) {
  const quote = (DB.quotations || []).find(q => q.id === quoteId);
  if (!quote) return;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Por favor habilita las ventanas emergentes (popups) para imprimir la cotización.");
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Cotización ${quote.code || quote.id} - CM Industrial</title>
      <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; padding: 40px; margin: 0; background: #fff; font-size: 13px; line-height: 1.5; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f97316; padding-bottom: 16px; margin-bottom: 24px; }
        .logo { font-size: 24px; font-weight: 900; color: #f97316; }
        .logo span { color: #0f172a; }
        .company-info { text-align: right; font-size: 12px; color: #64748b; }
        .quote-title-box { background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #f97316; padding: 14px 18px; margin-bottom: 24px; border-radius: 4px; }
        .quote-title { font-size: 16px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 4px; }
        .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; font-size: 12px; background: #f1f5f9; padding: 12px; border-radius: 4px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #0f172a; color: #fff; text-align: left; padding: 8px 10px; font-size: 12px; font-weight: 700; }
        td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
        .section-header { background: #fed7aa; color: #7c2d12; font-weight: 800; }
        .totals-table { width: 320px; margin-left: auto; border: 1px solid #cbd5e1; }
        .totals-table td { padding: 6px 12px; }
        .total-final { background: #f97316; color: #fff; font-weight: 900; font-size: 14px; }
        .footer-terms { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #64748b; }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">CM <span>INDUSTRIAL</span></div>
          <div style="font-size:12px;color:#64748b;margin-top:2px;">Servicios de Ingeniería, Montajes & Construcción Industrial</div>
        </div>
        <div class="company-info">
          <strong>CM Industrial SpA</strong><br>
          RUT: 77.890.123-K<br>
          Quintero / V Región, Chile<br>
          contacto@cmindustrial.cl
        </div>
      </div>

      <div class="quote-title-box">
        <div class="quote-title">${escapeHtml(quote.title)}</div>
        <div style="color:#64748b;font-size:12px;">Código: <strong>${escapeHtml(quote.code || quote.id)}</strong> &bull; Fecha: ${quote.createdAt || new Date().toLocaleDateString('es-CL')}</div>
      </div>

      <div class="meta-grid">
        <div><strong>Cliente:</strong><br>${escapeHtml(quote.client || "Cliente")}</div>
        <div><strong>Tiempo Ejecución:</strong><br>${escapeHtml(quote.executionTime || `${quote.months || 4} Meses`)}</div>
        <div><strong>Validez Oferta:</strong><br>30 Días</div>
        <div><strong>Forma de Pago:</strong><br>Estado de Pago / Hitos</div>
      </div>

      <!-- Partidas y Desglose -->
      <table>
        <thead>
          <tr>
            <th>ITEM / PARTIDA</th>
            <th style="text-align:center;width:60px;">CANT</th>
            <th style="text-align:right;width:120px;">VALOR UNIT.</th>
            <th style="text-align:right;width:130px;">TOTAL NETO</th>
          </tr>
        </thead>
        <tbody>
          <tr class="section-header">
            <td colspan="4">1. MANO DE OBRA ESPECIALIZADA EN FAENA</td>
          </tr>
          ${(quote.laborItems || []).map(item => `
            <tr>
              <td>Personal: ${escapeHtml(item.role)} (Duración: ${quote.months || 4} Meses)</td>
              <td style="text-align:center;">${item.count}</td>
              <td style="text-align:right;">$ ${formatNumberCL(item.taxableMonthly)}/mes</td>
              <td style="text-align:right;font-weight:600;">$ ${formatNumberCL(item.taxableMonthly * item.count * (quote.months || 4))}</td>
            </tr>
          `).join("")}

          <tr class="section-header">
            <td colspan="4">2. TRABAJO EN TERRENO, TRASLADOS Y EPP</td>
          </tr>
          ${(quote.fieldItems || []).map(item => `
            <tr>
              <td>${escapeHtml(item.name)}</td>
              <td style="text-align:center;">${item.qty}</td>
              <td style="text-align:right;">$ ${formatNumberCL(item.unitPrice)}</td>
              <td style="text-align:right;font-weight:600;">$ ${formatNumberCL(item.total)}</td>
            </tr>
          `).join("")}

          <tr class="section-header">
            <td colspan="4">3. MATERIALES, FABRICACIÓN Y EQUIPOS</td>
          </tr>
          ${(quote.materialItems || []).map(item => `
            <tr>
              <td>${escapeHtml(item.name)}</td>
              <td style="text-align:center;">${item.qty || 1}</td>
              <td style="text-align:right;">${item.unitPrice ? `$ ${formatNumberCL(item.unitPrice)}` : '-'}</td>
              <td style="text-align:right;font-weight:600;">$ ${formatNumberCL(item.total)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      <!-- Resumen de Totales -->
      <table class="totals-table">
        <tr>
          <td><strong>Subtotal Costo Directo:</strong></td>
          <td style="text-align:right;">$ ${formatNumberCL(quote.costCenterSubtotal || quote.totalCostCenter)}</td>
        </tr>
        <tr>
          <td>Gastos Generales & Admin:</td>
          <td style="text-align:right;">$ ${formatNumberCL(quote.adminSubtotal || 0)}</td>
        </tr>
        <tr class="total-final">
          <td><strong>TOTAL NETO (+IVA):</strong></td>
          <td style="text-align:right;">$ ${formatNumberCL(quote.totalNet || 0)}</td>
        </tr>
        <tr>
          <td>IVA (19%):</td>
          <td style="text-align:right;">$ ${formatNumberCL(Math.round((quote.totalNet || 0) * 0.19))}</td>
        </tr>
        <tr style="background:#f1f5f9;font-weight:bold;">
          <td>TOTAL BRUTO:</td>
          <td style="text-align:right;">$ ${formatNumberCL(Math.round((quote.totalNet || 0) * 1.19))}</td>
        </tr>
      </table>

      <div class="footer-terms">
        <strong>Condiciones Comerciales:</strong>
        <ul>
          <li>Precios expresados en Pesos Chilenos (CLP), no incluyen IVA salvo indicación contraria.</li>
          <li>Cotización válida por 30 días corridos a contar de la fecha de emisión.</li>
          <li>Los trabajos se iniciarán previa emisión de Orden de Compra (OC) y firma del acta de entrega de terreno.</li>
        </ul>
      </div>

      <div style="margin-top:40px;display:flex;justify-content:space-between;text-align:center;">
        <div style="border-top:1px solid #0f172a;width:200px;padding-top:6px;font-size:11px;">
          <strong>CM Industrial SpA</strong><br>Departamento de Proyectos
        </div>
        <div style="border-top:1px solid #0f172a;width:200px;padding-top:6px;font-size:11px;">
          <strong>Aceptación Cliente</strong><br>Firma & Timbre
        </div>
      </div>

      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

// Modal to choose pre-made templates (Secadora de Nueces, Alimentador Silos, En blanco)
function openQuotationTemplateModal() {
  const modal = document.getElementById("record-modal");
  const title = document.getElementById("modal-title");
  const body = document.getElementById("modal-body");
  const footer = document.getElementById("modal-footer");

  if (!modal || !title || !body) return;

  title.textContent = "Cargar Plantilla de Cotización Industrial";

  body.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:12px;">
      <p style="font-size:13px;color:var(--text-sub);margin:0;">Selecciona una plantilla base para comenzar rápidamente tu presupuesto:</p>

      <div class="card" style="padding:14px;background:#0f172a;border:1px solid var(--border-color);cursor:pointer;" onclick="loadTemplateAndOpen('secadora')">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <strong style="color:#fff;font-size:14px;">1. Proyecto Secadora de Nueces (Agrícola)</strong>
          <span class="badge badge-green">$ 120.159.930 Neto</span>
        </div>
        <p style="font-size:12px;color:var(--text-sub);margin:4px 0 0;">
          Incluye: 2 operarios, 2 ayudantes, bono supervisión (4 meses), planchas acero 3mm, 5 motores, pintura anticorrosiva, colaciones y fletes.
        </p>
      </div>

      <div class="card" style="padding:14px;background:#0f172a;border:1px solid var(--border-color);cursor:pointer;" onclick="loadTemplateAndOpen('silos')">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <strong style="color:#fff;font-size:14px;">2. Instalación Alimentador Llenado de Silos (Molino)</strong>
          <span class="badge badge-blue">$ 101.866.140 Neto</span>
        </div>
        <p style="font-size:12px;color:var(--text-sub);margin:4px 0 0;">
          Incluye: 2 operarios, 2 ayudantes, planchas plegadas 2mm, motores, pintura sintética y traslados.
        </p>
      </div>

      <div class="card" style="padding:14px;background:#0f172a;border:1px solid var(--border-color);cursor:pointer;" onclick="openQuotationModal()">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <strong style="color:#fff;font-size:14px;">3. Cotización Personalizada en Blanco</strong>
          <span class="badge badge-gray">Nueva Hoja</span>
        </div>
        <p style="font-size:12px;color:var(--text-sub);margin:4px 0 0;">
          Comenzar una cotización desde cero agregando tus propias partidas y materiales.
        </p>
      </div>
    </div>
  `;

  if (footer) {
    footer.innerHTML = `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>`;
  }

  modal.style.display = "flex";
}

function loadTemplateAndOpen(templateType) {
  closeModal();
  if (templateType === 'secadora') {
    const newQ = JSON.parse(JSON.stringify(defaultSeedData().quotations[0]));
    newQ.id = "COT-" + Date.now().toString().slice(-4);
    newQ.code = "COT-2026-" + Math.floor(100 + Math.random() * 900);
    newQ.title = newQ.title + " (Copia)";
    newQ.status = "Borrador";
    DB.quotations = DB.quotations || [];
    DB.quotations.push(newQ);
    saveDB();
    renderQuotations(document.getElementById("view-root"));
    openQuotationModal(newQ.id);
  } else if (templateType === 'silos') {
    const newQ = JSON.parse(JSON.stringify(defaultSeedData().quotations[1]));
    newQ.id = "COT-" + Date.now().toString().slice(-4);
    newQ.code = "COT-2026-" + Math.floor(100 + Math.random() * 900);
    newQ.title = newQ.title + " (Copia)";
    newQ.status = "Borrador";
    DB.quotations = DB.quotations || [];
    DB.quotations.push(newQ);
    saveDB();
    renderQuotations(document.getElementById("view-root"));
    openQuotationModal(newQ.id);
  }
}

// Interactive Quotation Modal Builder with Live Math Recalculation & Manual / Itemized Inputs
let quoteEntryMode = "itemized"; // "itemized" | "quick"

function openQuotationModal(quoteId = null) {
  if (!verifyDeveloperPermission("crear o editar cotizaciones")) return;

  const isEdit = Boolean(quoteId);
  const quote = isEdit ? (DB.quotations || []).find(q => q.id === quoteId) : {
    id: "COT-" + Date.now().toString().slice(-4),
    code: "COT-2026-" + String((DB.quotations || []).length + 1).padStart(3, "0"),
    title: "",
    client: "",
    executionTime: "4 Meses",
    months: 4,
    status: "Borrador",
    createdAt: new Date().toISOString().split("T")[0],
    notes: "",
    laborItems: [
      { role: "Operarios", count: 2, taxableMonthly: 2025000 },
      { role: "Ayudantes", count: 2, taxableMonthly: 1730000 },
      { role: "Bono Supervisión", count: 1, taxableMonthly: 247000 }
    ],
    fieldItems: [
      { name: "Ropa y EE.PP.", qty: 3, unitPrice: 70000, total: 210000 },
      { name: "Colaciones (22 días x 5 pers)", qty: 210, unitPrice: 7000, total: 1470000 },
      { name: "Fletes ida y vuelta", qty: 11, unitPrice: 430000, total: 4730000 },
      { name: "Traslado (Bencina)", qty: 22, unitPrice: 15000, total: 330000 }
    ],
    materialItems: [
      { name: "Planchas de acero plegado", qty: 1, unitPrice: 20000000, total: 20000000 },
      { name: "Pintura y diluyente", qty: 50, unitPrice: 60000, total: 3000000 },
      { name: "Perfiles estructurales", qty: 1, unitPrice: 2800000, total: 2800000 }
    ],
    adminPercent: 2,
    contingencyPercent: 5,
    profitPercent: 50,
    discountPercent: 0
  };

  const modal = document.getElementById("record-modal");
  const title = document.getElementById("modal-title");
  const body = document.getElementById("modal-body");
  const footer = document.getElementById("modal-footer");

  if (!modal || !title || !body) return;

  title.textContent = isEdit ? `Editar Cotización: ${quote.code}` : "Nueva Cotización & Presupuesto";

  // Store active temporary object for live editing
  window.activeEditingQuote = JSON.parse(JSON.stringify(quote));

  renderQuotationModalBody(quote, isEdit);

  if (footer) {
    footer.innerHTML = `
      <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveQuotationRecord('${quote.id}')">
        <i class="fa-solid fa-floppy-disk"></i> Guardar Cotización
      </button>
    `;
  }

  modal.style.display = "flex";
  recalculateQuoteLive();
}

function switchQuoteEntryMode(mode) {
  quoteEntryMode = mode;
  const quote = window.activeEditingQuote;
  renderQuotationModalBody(quote, Boolean(quote && quote.id));
  recalculateQuoteLive();
}

function renderQuotationModalBody(quote, isEdit) {
  const body = document.getElementById("modal-body");
  if (!body || !quote) return;

  body.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:14px;max-height:75vh;overflow-y:auto;padding-right:4px;">
      
      <!-- General Data -->
      <div style="display:grid;grid-template-columns: 1fr 2fr 1fr;gap:10px;">
        <div class="form-group" style="margin:0;">
          <label class="form-label">Código</label>
          <input type="text" id="q-code" class="form-control" value="${escapeHtml(quote.code || '')}">
        </div>
        <div class="form-group" style="margin:0;">
          <label class="form-label">Título del Proyecto / Cotización *</label>
          <input type="text" id="q-title" class="form-control" placeholder="Ej: Montaje Secadora y Tolvas" value="${escapeHtml(quote.title || '')}">
        </div>
        <div class="form-group" style="margin:0;">
          <label class="form-label">Cliente</label>
          <input type="text" id="q-client" class="form-control" placeholder="Ej: Agrícola Val Valle" value="${escapeHtml(quote.client || '')}">
        </div>
      </div>

      <div style="display:grid;grid-template-columns: repeat(3, 1fr);gap:10px;">
        <div class="form-group" style="margin:0;">
          <label class="form-label">Meses de Duración</label>
          <input type="number" id="q-months" class="form-control" min="1" max="36" value="${quote.months || 4}" oninput="recalculateQuoteLive()">
        </div>
        <div class="form-group" style="margin:0;">
          <label class="form-label">Texto Plazo de Ejecución</label>
          <input type="text" id="q-time-text" class="form-control" value="${escapeHtml(quote.executionTime || '4 Meses')}">
        </div>
        <div class="form-group" style="margin:0;">
          <label class="form-label">Estado</label>
          <select id="q-status" class="form-control">
            <option value="Borrador" ${quote.status === "Borrador" ? "selected" : ""}>Borrador</option>
            <option value="Enviada" ${quote.status === "Enviada" ? "selected" : ""}>Enviada al Cliente</option>
            <option value="Aprobada" ${quote.status === "Aprobada" ? "selected" : ""}>Aprobada</option>
            <option value="Convertida" ${quote.status === "Convertida" ? "selected" : ""}>Convertida a Obra</option>
            <option value="Rechazada" ${quote.status === "Rechazada" ? "selected" : ""}>Rechazada</option>
          </select>
        </div>
      </div>

      <!-- Mode Selector Tabs -->
      <div style="display:flex;gap:8px;background:#090d16;padding:6px;border-radius:8px;border:1px solid #1e293b;">
        <button type="button" class="btn btn-sm ${quoteEntryMode === 'itemized' ? 'btn-primary' : 'btn-secondary'}" onclick="switchQuoteEntryMode('itemized')" style="flex:1;justify-content:center;font-size:12px;">
          <i class="fa-solid fa-list-check"></i> Desglose Detallado por Partidas (Excel)
        </button>
        <button type="button" class="btn btn-sm ${quoteEntryMode === 'quick' ? 'btn-primary' : 'btn-secondary'}" onclick="switchQuoteEntryMode('quick')" style="flex:1;justify-content:center;font-size:12px;">
          <i class="fa-solid fa-calculator"></i> Ingreso Rápido de Montos Globales
        </button>
      </div>

      ${quoteEntryMode === 'quick' ? `
        <!-- QUICK GLOBAL AMOUNTS INPUT -->
        <div style="background:#0d1424;border:1px solid #1e293b;border-radius:8px;padding:14px;display:flex;flex-direction:column;gap:12px;">
          <div style="font-size:12.5px;font-weight:700;color:var(--primary);display:flex;align-items:center;gap:6px;">
            <i class="fa-solid fa-bolt"></i> Ingreso Directo de Totales (Separador de Miles & Millones)
          </div>
          <div style="display:grid;grid-template-columns: repeat(3, 1fr);gap:12px;">
            <div class="form-group" style="margin:0;">
              <label class="form-label" style="font-size:11px;">Mano de Obra Mensual ($)</label>
              <div class="currency-input-wrap">
                <span class="currency-prefix">$</span>
                <input type="text" inputmode="numeric" id="q-quick-labor" class="form-control" style="text-align:right;" value="${formatNumberCL(quote.laborMonthlySubtotal || (quote.laborItems || []).reduce((acc, it) => acc + ((Number(it.taxableMonthly) || 0) * (Number(it.count) || 1)), 0) || 4002000)}" oninput="handleCurrencyInput(this, 'q-quick-labor-words');syncQuickLabor();recalculateQuoteLive();" autocomplete="off">
              </div>
              <div id="q-quick-labor-words" style="margin-top:2px;">
                ${describeAmountInWords(quote.laborMonthlySubtotal || 4002000)}
              </div>
              <span style="font-size:10px;color:var(--text-sub);">Se multiplica por los meses</span>
            </div>
            <div class="form-group" style="margin:0;">
              <label class="form-label" style="font-size:11px;">Gastos Terreno & EPP ($)</label>
              <div class="currency-input-wrap">
                <span class="currency-prefix">$</span>
                <input type="text" inputmode="numeric" id="q-quick-field" class="form-control" style="text-align:right;" value="${formatNumberCL((quote.fieldItems || []).reduce((acc, it) => acc + (Number(it.total) || 0), 0) || 6740000)}" oninput="handleCurrencyInput(this, 'q-quick-field-words');syncQuickField();recalculateQuoteLive();" autocomplete="off">
              </div>
              <div id="q-quick-field-words" style="margin-top:2px;">
                ${describeAmountInWords((quote.fieldItems || []).reduce((acc, it) => acc + (Number(it.total) || 0), 0) || 6740000)}
              </div>
              <span style="font-size:10px;color:var(--text-sub);">Colaciones, traslados, fletes</span>
            </div>
            <div class="form-group" style="margin:0;">
              <label class="form-label" style="font-size:11px;">Materiales & Equipos ($)</label>
              <div class="currency-input-wrap">
                <span class="currency-prefix">$</span>
                <input type="text" inputmode="numeric" id="q-quick-mat" class="form-control" style="text-align:right;" value="${formatNumberCL((quote.materialItems || []).reduce((acc, it) => acc + (Number(it.total) || 0), 0) || 52118000)}" oninput="handleCurrencyInput(this, 'q-quick-mat-words');syncQuickMaterials();recalculateQuoteLive();" autocomplete="off">
              </div>
              <div id="q-quick-mat-words" style="margin-top:2px;">
                ${describeAmountInWords((quote.materialItems || []).reduce((acc, it) => acc + (Number(it.total) || 0), 0) || 52118000)}
              </div>
              <span style="font-size:10px;color:var(--text-sub);">Planchas, soldadura, motores</span>
            </div>
          </div>
        </div>
      ` : `
        <!-- DETAILED ITEM TABLES -->
        
        <!-- 1. MANO DE OBRA -->
        <div style="background:#0d1424;border:1px solid #1e293b;border-radius:8px;padding:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <div style="font-size:12.5px;font-weight:700;color:#38bdf8;display:flex;align-items:center;gap:6px;">
              <i class="fa-solid fa-users-gear"></i> 1. Mano de Obra (Sueldos Imponibles Mensuales)
            </div>
            <button type="button" class="btn btn-secondary btn-sm" onclick="addQuoteLaborRow()" style="font-size:11px;padding:3px 8px;">
              <i class="fa-solid fa-plus"></i> Añadir Cargo
            </button>
          </div>
          <table style="width:100%;font-size:12px;border-collapse:collapse;" id="quote-labor-table">
            <thead>
              <tr style="background:#1e293b;color:var(--text-sub);text-align:left;">
                <th style="padding:6px 8px;">Cargo / Rol</th>
                <th style="padding:6px 8px;width:70px;text-align:center;">Cant</th>
                <th style="padding:6px 8px;width:150px;text-align:right;">Sueldo Imponible ($)</th>
                <th style="padding:6px 8px;width:40px;text-align:center;"></th>
              </tr>
            </thead>
            <tbody id="quote-labor-tbody">
              ${(quote.laborItems || []).map((it, idx) => `
                <tr style="border-bottom:1px solid #1e293b;">
                  <td style="padding:4px 6px;">
                    <input type="text" class="form-control" style="font-size:12px;padding:4px 8px;" value="${escapeHtml(it.role)}" oninput="quote.laborItems[${idx}].role=this.value;">
                  </td>
                  <td style="padding:4px 6px;">
                    <input type="number" class="form-control" style="font-size:12px;padding:4px 8px;text-align:center;" min="1" value="${it.count}" oninput="quote.laborItems[${idx}].count=Number(this.value)||1;recalculateQuoteLive();">
                  </td>
                  <td style="padding:4px 6px;">
                    <input type="text" inputmode="numeric" id="q-l-taxable-${idx}" class="form-control" style="font-size:12px;padding:4px 8px;text-align:right;font-weight:600;" value="${formatNumberCL(it.taxableMonthly)}" oninput="handleCurrencyInput(this);quote.laborItems[${idx}].taxableMonthly=parseCurrencyNumber(this.value);recalculateQuoteLive();" autocomplete="off">
                  </td>
                  <td style="padding:4px 6px;text-align:center;">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="removeQuoteLaborRow(${idx})" style="padding:4px 6px;color:var(--danger);font-size:11px;">
                      <i class="fa-solid fa-trash"></i>
                    </button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>

        <!-- 2. GASTOS E INSUMOS EN TERRENO -->
        <div style="background:#0d1424;border:1px solid #1e293b;border-radius:8px;padding:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <div style="font-size:12.5px;font-weight:700;color:#f97316;display:flex;align-items:center;gap:6px;">
              <i class="fa-solid fa-truck-ramp-box"></i> 2. Trabajo en Terreno, EPP, Colaciones & Fletes
            </div>
            <button type="button" class="btn btn-secondary btn-sm" onclick="addQuoteFieldRow()" style="font-size:11px;padding:3px 8px;">
              <i class="fa-solid fa-plus"></i> Añadir Gasto
            </button>
          </div>
          <table style="width:100%;font-size:12px;border-collapse:collapse;">
            <thead>
              <tr style="background:#1e293b;color:var(--text-sub);text-align:left;">
                <th style="padding:6px 8px;">Detalle / Partida</th>
                <th style="padding:6px 8px;width:70px;text-align:center;">Cant</th>
                <th style="padding:6px 8px;width:125px;text-align:right;">Valor Unit ($)</th>
                <th style="padding:6px 8px;width:125px;text-align:right;">Total ($)</th>
                <th style="padding:6px 8px;width:40px;text-align:center;"></th>
              </tr>
            </thead>
            <tbody id="quote-field-tbody">
              ${(quote.fieldItems || []).map((it, idx) => `
                <tr style="border-bottom:1px solid #1e293b;">
                  <td style="padding:4px 6px;">
                    <input type="text" class="form-control" style="font-size:12px;padding:4px 8px;" value="${escapeHtml(it.name)}" oninput="quote.fieldItems[${idx}].name=this.value;">
                  </td>
                  <td style="padding:4px 6px;">
                    <input type="number" class="form-control" style="font-size:12px;padding:4px 8px;text-align:center;" min="1" value="${it.qty}" oninput="updateQuoteFieldQty(${idx}, this.value);">
                  </td>
                  <td style="padding:4px 6px;">
                    <input type="text" inputmode="numeric" id="q-f-unit-${idx}" class="form-control" style="font-size:12px;padding:4px 8px;text-align:right;font-weight:600;" value="${formatNumberCL(it.unitPrice)}" oninput="handleCurrencyInput(this);updateQuoteFieldUnit(${idx}, this.value);" autocomplete="off">
                  </td>
                  <td style="padding:4px 6px;">
                    <input type="text" inputmode="numeric" id="q-f-tot-${idx}" class="form-control" style="font-size:12px;padding:4px 8px;text-align:right;font-weight:600;color:#38bdf8;" value="${formatNumberCL(it.total)}" oninput="handleCurrencyInput(this);updateQuoteFieldTotal(${idx}, this.value);" autocomplete="off">
                  </td>
                  <td style="padding:4px 6px;text-align:center;">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="removeQuoteFieldRow(${idx})" style="padding:4px 6px;color:var(--danger);font-size:11px;">
                      <i class="fa-solid fa-trash"></i>
                    </button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>

        <!-- 3. MATERIALES, FABRICACIÓN Y EQUIPOS -->
        <div style="background:#0d1424;border:1px solid #1e293b;border-radius:8px;padding:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <div style="font-size:12.5px;font-weight:700;color:#fed7aa;display:flex;align-items:center;gap:6px;">
              <i class="fa-solid fa-cubes-stacked"></i> 3. Materiales, Planchas Plegadas, Soldadura & Equipos
            </div>
            <button type="button" class="btn btn-secondary btn-sm" onclick="addQuoteMaterialRow()" style="font-size:11px;padding:3px 8px;">
              <i class="fa-solid fa-plus"></i> Añadir Material
            </button>
          </div>
          <table style="width:100%;font-size:12px;border-collapse:collapse;">
            <thead>
              <tr style="background:#1e293b;color:var(--text-sub);text-align:left;">
                <th style="padding:6px 8px;">Material / Equipo</th>
                <th style="padding:6px 8px;width:70px;text-align:center;">Cant</th>
                <th style="padding:6px 8px;width:125px;text-align:right;">Valor Unit ($)</th>
                <th style="padding:6px 8px;width:125px;text-align:right;">Total ($)</th>
                <th style="padding:6px 8px;width:40px;text-align:center;"></th>
              </tr>
            </thead>
            <tbody id="quote-mat-tbody">
              ${(quote.materialItems || []).map((it, idx) => `
                <tr style="border-bottom:1px solid #1e293b;">
                  <td style="padding:4px 6px;">
                    <input type="text" class="form-control" style="font-size:12px;padding:4px 8px;" value="${escapeHtml(it.name)}" oninput="quote.materialItems[${idx}].name=this.value;">
                  </td>
                  <td style="padding:4px 6px;">
                    <input type="number" class="form-control" style="font-size:12px;padding:4px 8px;text-align:center;" min="1" value="${it.qty || 1}" oninput="updateQuoteMaterialQty(${idx}, this.value);">
                  </td>
                  <td style="padding:4px 6px;">
                    <input type="text" inputmode="numeric" id="q-m-unit-${idx}" class="form-control" style="font-size:12px;padding:4px 8px;text-align:right;font-weight:600;" value="${formatNumberCL(it.unitPrice || 0)}" oninput="handleCurrencyInput(this);updateQuoteMaterialUnit(${idx}, this.value);" autocomplete="off">
                  </td>
                  <td style="padding:4px 6px;">
                    <input type="text" inputmode="numeric" id="q-m-tot-${idx}" class="form-control" style="font-size:12px;padding:4px 8px;text-align:right;font-weight:600;color:#38bdf8;" value="${formatNumberCL(it.total || 0)}" oninput="handleCurrencyInput(this);updateQuoteMaterialTotal(${idx}, this.value);" autocomplete="off">
                  </td>
                  <td style="padding:4px 6px;text-align:center;">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="removeQuoteMaterialRow(${idx})" style="padding:4px 6px;color:var(--danger);font-size:11px;">
                      <i class="fa-solid fa-trash"></i>
                    </button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `}

      <!-- Percentages Configuration -->
      <div style="background:#090d16;border:1px solid #1e293b;border-radius:8px;padding:12px;display:grid;grid-template-columns: repeat(4, 1fr);gap:10px;">
        <div class="form-group" style="margin:0;">
          <label class="form-label" style="font-size:11px;">Comisión Admin (%)</label>
          <input type="number" id="q-admin-pct" class="form-control" value="${quote.adminPercent || 2}" oninput="recalculateQuoteLive()">
        </div>
        <div class="form-group" style="margin:0;">
          <label class="form-label" style="font-size:11px;">Imprevistos (%)</label>
          <input type="number" id="q-contingency-pct" class="form-control" value="${quote.contingencyPercent || 5}" oninput="recalculateQuoteLive()">
        </div>
        <div class="form-group" style="margin:0;">
          <label class="form-label" style="font-size:11px;color:#a855f7;font-weight:700;">Margen Utilidad (%)</label>
          <input type="number" id="q-profit-pct" class="form-control" value="${quote.profitPercent || 50}" oninput="recalculateQuoteLive()">
        </div>
        <div class="form-group" style="margin:0;">
          <label class="form-label" style="font-size:11px;color:#f59e0b;">Desc. Negociación (%)</label>
          <input type="number" id="q-discount-pct" class="form-control" value="${quote.discountPercent || 0}" oninput="recalculateQuoteLive()">
        </div>
      </div>

      <!-- Live Calculation Card -->
      <div id="quote-live-summary" style="background:#022c22;border:1px solid #059669;border-radius:8px;padding:14px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
        <!-- Filled dynamically by recalculateQuoteLive() -->
      </div>

      <div class="form-group" style="margin:0;">
        <label class="form-label">Observaciones y Condiciones Comerciales</label>
        <textarea id="q-notes" class="form-control" rows="2" placeholder="Detalles de alcance, exclusiones, plazos...">${escapeHtml(quote.notes || '')}</textarea>
      </div>

    </div>
  `;
}

// Helpers for row additions
function addQuoteLaborRow() {
  const quote = window.activeEditingQuote;
  if (!quote) return;
  quote.laborItems = quote.laborItems || [];
  quote.laborItems.push({ role: "Nuevo Cargo", count: 1, taxableMonthly: 900000 });
  renderQuotationModalBody(quote, Boolean(quote && quote.id));
  recalculateQuoteLive();
}

function removeQuoteLaborRow(idx) {
  const quote = window.activeEditingQuote;
  if (!quote || !quote.laborItems) return;
  quote.laborItems.splice(idx, 1);
  renderQuotationModalBody(quote, Boolean(quote && quote.id));
  recalculateQuoteLive();
}

function addQuoteFieldRow() {
  const quote = window.activeEditingQuote;
  if (!quote) return;
  quote.fieldItems = quote.fieldItems || [];
  quote.fieldItems.push({ name: "Nuevo Gasto Terreno", qty: 1, unitPrice: 150000, total: 150000 });
  renderQuotationModalBody(quote, Boolean(quote && quote.id));
  recalculateQuoteLive();
}

function removeQuoteFieldRow(idx) {
  const quote = window.activeEditingQuote;
  if (!quote || !quote.fieldItems) return;
  quote.fieldItems.splice(idx, 1);
  renderQuotationModalBody(quote, Boolean(quote && quote.id));
  recalculateQuoteLive();
}

function addQuoteMaterialRow() {
  const quote = window.activeEditingQuote;
  if (!quote) return;
  quote.materialItems = quote.materialItems || [];
  quote.materialItems.push({ name: "Nuevo Material / Insumo", qty: 1, unitPrice: 500000, total: 500000 });
  renderQuotationModalBody(quote, Boolean(quote && quote.id));
  recalculateQuoteLive();
}

function removeQuoteMaterialRow(idx) {
  const quote = window.activeEditingQuote;
  if (!quote || !quote.materialItems) return;
  quote.materialItems.splice(idx, 1);
  renderQuotationModalBody(quote, Boolean(quote && quote.id));
  recalculateQuoteLive();
}

function updateQuoteFieldQty(idx, val) {
  const quote = window.activeEditingQuote;
  if (!quote || !quote.fieldItems || !quote.fieldItems[idx]) return;
  const qty = Number(val) || 1;
  quote.fieldItems[idx].qty = qty;
  const unitPrice = quote.fieldItems[idx].unitPrice || 0;
  quote.fieldItems[idx].total = qty * unitPrice;
  const totEl = document.getElementById(`q-f-tot-${idx}`);
  if (totEl) totEl.value = formatNumberCL(quote.fi
