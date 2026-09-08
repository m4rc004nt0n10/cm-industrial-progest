// CM INDUSTRIAL — UI Controller & Views
let currentView = "dashboard";
let chartInstances = {};
let activeModalEntity = null;
let activeModalRecord = null;

// Currency & formatting helpers
function fmtMoney(amount) {
  return "$" + Number(amount || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function fmtPercent(val) {
  return Number(val || 0).toFixed(1) + "%";
}

// Builds a 2-letter avatar from a person's name, e.g. "Carlos Morales" -> "CM"
function getInitials(name) {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// Navigation
function navigateTo(viewId) {
  currentView = viewId;
  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.toggle("active", item.dataset.view === viewId);
  });
  
  // Close mobile sidebar if open
  const sidebar = document.getElementById("sidebar");
  if (sidebar) sidebar.classList.remove("mobile-open");
  
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

// Fills the sidebar footer card from the real user roster (DB.users) instead
// of a hardcoded name. Shows the first registered user, or a prompt to create one.
function renderSidebarUserCard() {
  const card = document.getElementById("sidebar-user-card");
  if (!card) return;

  const user = DB.users && DB.users[0];

  if (!user) {
    card.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;cursor:pointer;" onclick="navigateTo('usuarios')">
        <div style="width:34px;height:34px;border-radius:50%;background:#1e293b;border:1px dashed var(--border-subtle);display:flex;align-items:center;justify-content:center;font-size:13px;color:var(--text-sub);">
          <i class="fa-solid fa-user-plus"></i>
        </div>
        <div>
          <div style="font-size:12px;font-weight:700;color:#fff;">Sin usuarios</div>
          <div style="font-size:10px;color:var(--primary);">+ Crear usuario</div>
        </div>
      </div>
    `;
    return;
  }

  const roleBadge = user.role === "Administrador" ? "badge-orange" : user.role === "Desarrollador" ? "badge-blue" : "badge-gray";

  card.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="width:34px;height:34px;border-radius:50%;background:#1e293b;border:1px solid var(--primary);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:var(--primary);">
        ${user.avatar || getInitials(user.name)}
      </div>
      <div>
        <div style="font-size:12px;font-weight:700;color:#fff;">${user.name}</div>
        <div style="font-size:10px;color:var(--text-sub);"><span class="badge ${roleBadge}" style="padding:2px 5px;font-size:9px;">${(user.role || "").toUpperCase()}</span></div>
      </div>
    </div>
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

  container.innerHTML = `
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
        <div style="font-weight:700;font-size:14px;"><i class="fa-solid fa-traffic-light" style="color:var(--danger);margin-right:8px;"></i> Estado de Salud de Proyectos (Semáforo Inteligente)</div>
        <button class="btn btn-secondary btn-sm" onclick="navigateTo('proyectos')">Ver todos los proyectos <i class="fa-solid fa-arrow-right"></i></button>
      </div>
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
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          ${DB.projects.map(p => {
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
                <td>
                  <button class="btn btn-secondary btn-sm" onclick="openEditModal('projects', '${p.id}')"><i class="fa-solid fa-pen"></i></button>
                </td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
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
          legend: { labels: { color: "#9ca3af", font: { size: 11 } } }
        },
        scales: {
          x: { ticks: { color: "#9ca3af" }, grid: { color: "#1f293d" } },
          y: { ticks: { color: "#9ca3af" }, grid: { color: "#1f293d" } }
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
          legend: { position: "right", labels: { color: "#9ca3af", font: { size: 11 } } }
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
          legend: { labels: { color: "#9ca3af", font: { size: 11 } } }
        },
        scales: {
          x: { ticks: { color: "#9ca3af" }, grid: { color: "#1f293d" } },
          y: { ticks: { color: "#9ca3af" }, grid: { color: "#1f293d" } }
        }
      }
    });
  }
}

// 2. PROYECTOS VIEW
function renderProjects(container) {
  container.innerHTML = `
    <div class="data-table-container">
      <div class="table-toolbar">
        <div style="display:flex;align-items:center;gap:12px;">
          <h2 style="font-size:18px;font-weight:700;">Proyectos Industriales</h2>
          <span class="badge badge-orange">${DB.projects.length} Registros</span>
        </div>
        <div style="display:flex;gap:10px;">
          <div class="search-box">
            <i class="fa-solid fa-search search-icon"></i>
            <input type="text" id="proj-search" class="search-input" placeholder="Buscar proyecto, cliente..." oninput="filterTable('proj-table', this.value)">
          </div>
          <button class="btn btn-secondary btn-sm" onclick="exportCSV('projects')"><i class="fa-solid fa-file-export"></i> Exportar</button>
          <button class="btn btn-primary btn-sm" onclick="openCreateModal('projects')"><i class="fa-solid fa-plus"></i> Nuevo Proyecto</button>
        </div>
      </div>
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
            <th style="text-align:right;">Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${DB.projects.map(p => {
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
                <td style="text-align:right;">
                  <button class="btn btn-secondary btn-sm" onclick="openEditModal('projects', '${p.id}')"><i class="fa-solid fa-pen"></i></button>
                  <button class="btn btn-danger btn-sm" onclick="deleteRecord('projects', '${p.id}')"><i class="fa-solid fa-trash"></i></button>
                </td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
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
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
      <div>
        <h2 style="font-size:18px;font-weight:700;">Gantt Visual de Proyectos</h2>
        <p style="font-size:13px;color:var(--text-sub);">Línea de tiempo general con marcador de HOY y avance físico</p>
      </div>
      <div style="display:flex;gap:8px;">
        <span class="badge badge-red"><i class="fa-solid fa-location-dot"></i> Hoy: ${today.toISOString().split("T")[0]}</span>
      </div>
    </div>

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

  container.innerHTML = `
    <div class="data-table-container">
      <div class="table-toolbar">
        <div style="display:flex;align-items:center;gap:12px;">
          <h2 style="font-size:18px;font-weight:700;">Gastos & Adquisiciones</h2>
          <span class="badge badge-blue">Total: ${fmtMoney(total)}</span>
        </div>
        <div style="display:flex;gap:10px;">
          <div class="search-box">
            <i class="fa-solid fa-search search-icon"></i>
            <input type="text" class="search-input" placeholder="Buscar folio, proveedor..." oninput="filterTable('exp-table', this.value)">
          </div>
          <button class="btn btn-secondary btn-sm" onclick="exportCSV('expenses')"><i class="fa-solid fa-file-export"></i> Exportar</button>
          <button class="btn btn-primary btn-sm" onclick="openCreateModal('expenses')"><i class="fa-solid fa-plus"></i> Registrar Gasto</button>
        </div>
      </div>
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
            <th style="text-align:right;">Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${DB.expenses.map(e => `
            <tr>
              <td><strong>${e.folio}</strong></td>
              <td>${e.projectId}</td>
              <td><span class="badge badge-gray">${e.category}</span></td>
              <td><strong>${fmtMoney(e.amount)}</strong></td>
              <td>${e.supplier}</td>
              <td>${e.date}</td>
              <td><span class="badge badge-green">${e.status}</span></td>
              <td><small>${e.note || "-"}</small></td>
              <td style="text-align:right;">
                <button class="btn btn-secondary btn-sm" onclick="openEditModal('expenses', '${e.id}')"><i class="fa-solid fa-pen"></i></button>
                <button class="btn btn-danger btn-sm" onclick="deleteRecord('expenses', '${e.id}')"><i class="fa-solid fa-trash"></i></button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

// 5. TRABAJADORES VIEW
function renderWorkers(container) {
  container.innerHTML = `
    <div class="data-table-container">
      <div class="table-toolbar">
        <div style="display:flex;align-items:center;gap:12px;">
          <h2 style="font-size:18px;font-weight:700;">Dotación de Personal & Mano de Obra</h2>
          <span class="badge badge-orange">${DB.workers.length} Colaboradores</span>
        </div>
        <div style="display:flex;gap:10px;">
          <div class="search-box">
            <i class="fa-solid fa-search search-icon"></i>
            <input type="text" class="search-input" placeholder="Buscar trabajador, RUT, cargo..." oninput="filterTable('wrk-table', this.value)">
          </div>
          <button class="btn btn-secondary btn-sm" onclick="exportCSV('workers')"><i class="fa-solid fa-file-export"></i> Exportar</button>
          <button class="btn btn-primary btn-sm" onclick="openCreateModal('workers')"><i class="fa-solid fa-plus"></i> Registrar Trabajador</button>
        </div>
      </div>
      <table id="wrk-table">
        <thead>
          <tr>
            <th>RUT / DNI</th>
            <th>Nombre Completo</th>
            <th>Especialidad / Cargo</th>
            <th>Proyecto Asignado</th>
            <th>Teléfono Contacto</th>
            <th>Certificaciones</th>
            <th>Venc. Examen Médico</th>
            <th>Estado</th>
            <th style="text-align:right;">Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${DB.workers.map(w => {
            const isExp = new Date(w.medExamExpiry) < new Date();
            return `
              <tr>
                <td><strong>${w.rut}</strong></td>
                <td><strong>${w.name}</strong></td>
                <td>${w.role}</td>
                <td><span class="badge badge-blue">${w.projectId}</span></td>
                <td>${w.phone}</td>
                <td><small>${w.certifications || "-"}</small></td>
                <td><span class="badge ${isExp ? 'badge-red' : 'badge-green'}">${w.medExamExpiry}</span></td>
                <td><span class="badge ${w.status === 'Activo' ? 'badge-green' : 'badge-yellow'}">${w.status}</span></td>
                <td style="text-align:right;">
                  <button class="btn btn-secondary btn-sm" onclick="openEditModal('workers', '${w.id}')"><i class="fa-solid fa-pen"></i></button>
                  <button class="btn btn-danger btn-sm" onclick="deleteRecord('workers', '${w.id}')"><i class="fa-solid fa-trash"></i></button>
                </td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

// 6. HERRAMIENTAS VIEW
function renderTools(container) {
  container.innerHTML = `
    <div class="data-table-container">
      <div class="table-toolbar">
        <div style="display:flex;align-items:center;gap:12px;">
          <h2 style="font-size:18px;font-weight:700;">Inventario de Herramientas & Maquinaria</h2>
          <span class="badge badge-orange">${DB.tools.length} Equipos</span>
        </div>
        <div style="display:flex;gap:10px;">
          <div class="search-box">
            <i class="fa-solid fa-search search-icon"></i>
            <input type="text" class="search-input" placeholder="Buscar tag, marca, equipo..." oninput="filterTable('tool-table', this.value)">
          </div>
          <button class="btn btn-secondary btn-sm" onclick="exportCSV('tools')"><i class="fa-solid fa-file-export"></i> Exportar</button>
          <button class="btn btn-primary btn-sm" onclick="openCreateModal('tools')"><i class="fa-solid fa-plus"></i> Añadir Equipo</button>
        </div>
      </div>
      <table id="tool-table">
        <thead>
          <tr>
            <th>Tag / Código</th>
            <th>Equipo & Marca</th>
            <th>Nº Serie</th>
            <th>Ubicación / Proyecto</th>
            <th>Responsable</th>
            <th>Última Mantención</th>
            <th>Próxima Mantención</th>
            <th>Estado</th>
            <th style="text-align:right;">Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${DB.tools.map(t => {
            const isDue = new Date(t.nextMaintenance) < new Date();
            return `
              <tr>
                <td><strong>${t.code}</strong></td>
                <td><strong>${t.name}</strong><br><small style="color:var(--text-sub);">${t.brand}</small></td>
                <td><small>${t.serialNumber}</small></td>
                <td><span class="badge badge-blue">${t.projectId}</span></td>
                <td>${t.responsible}</td>
                <td>${t.lastMaintenance}</td>
                <td><span class="badge ${isDue ? 'badge-red' : 'badge-green'}">${t.nextMaintenance}</span></td>
                <td><span class="badge ${t.status === 'En Faena' ? 'badge-green' : 'badge-yellow'}">${t.status}</span></td>
                <td style="text-align:right;">
                  <button class="btn btn-secondary btn-sm" onclick="openEditModal('tools', '${t.id}')"><i class="fa-solid fa-pen"></i></button>
                  <button class="btn btn-danger btn-sm" onclick="deleteRecord('tools', '${t.id}')"><i class="fa-solid fa-trash"></i></button>
                </td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

// 7. DOCUMENTOS VIEW
function renderDocuments(container) {
  container.innerHTML = `
    <div class="data-table-container">
      <div class="table-toolbar">
        <div style="display:flex;align-items:center;gap:12px;">
          <h2 style="font-size:18px;font-weight:700;">Control Documental & Calidad</h2>
          <span class="badge badge-orange">${DB.documents.length} Archivos</span>
        </div>
        <div style="display:flex;gap:10px;">
          <div class="search-box">
            <i class="fa-solid fa-search search-icon"></i>
            <input type="text" class="search-input" placeholder="Buscar código, nombre doc..." oninput="filterTable('doc-table', this.value)">
          </div>
          <button class="btn btn-secondary btn-sm" onclick="exportCSV('documents')"><i class="fa-solid fa-file-export"></i> Exportar</button>
          <button class="btn btn-primary btn-sm" onclick="openCreateModal('documents')"><i class="fa-solid fa-plus"></i> Subir Documento</button>
        </div>
      </div>
      <table id="doc-table">
        <thead>
          <tr>
            <th>Código Doc</th>
            <th>Título del Documento</th>
            <th>Tipo / Especialidad</th>
            <th>Proyecto Asociado</th>
            <th>Fecha Vencimiento</th>
            <th>Estado</th>
            <th style="text-align:right;">Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${DB.documents.map(d => `
            <tr>
              <td><strong>${d.code}</strong></td>
              <td><strong>${d.name}</strong></td>
              <td><span class="badge badge-gray">${d.type}</span></td>
              <td><span class="badge badge-blue">${d.projectId}</span></td>
              <td>${d.expiryDate}</td>
              <td><span class="badge ${d.status === 'Vigente' ? 'badge-green' : d.status === 'Por Vencer' ? 'badge-yellow' : 'badge-red'}">${d.status}</span></td>
              <td style="text-align:right;">
                <button class="btn btn-secondary btn-sm" onclick="openEditModal('documents', '${d.id}')"><i class="fa-solid fa-pen"></i></button>
                <button class="btn btn-danger btn-sm" onclick="deleteRecord('documents', '${d.id}')"><i class="fa-solid fa-trash"></i></button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

// 8. USUARIOS VIEW (roster of app users, not a login/access-control system)
function renderUsers(container) {
  container.innerHTML = `
    <div style="margin-bottom:16px;">
      <p style="font-size:13px;color:var(--text-sub);">Directorio de personas que usan la plataforma. Roles disponibles: Desarrollador, Administrador y Usuario.</p>
    </div>
    <div class="data-table-container">
      <div class="table-toolbar">
        <div style="display:flex;align-items:center;gap:12px;">
          <h2 style="font-size:18px;font-weight:700;">Usuarios del Sistema</h2>
          <span class="badge badge-orange">${DB.users.length} Registrados</span>
        </div>
        <div style="display:flex;gap:10px;">
          <div class="search-box">
            <i class="fa-solid fa-search search-icon"></i>
            <input type="text" class="search-input" placeholder="Buscar usuario, correo..." oninput="filterTable('usr-table', this.value)">
          </div>
          <button class="btn btn-secondary btn-sm" onclick="exportCSV('users')"><i class="fa-solid fa-file-export"></i> Exportar</button>
          <button class="btn btn-primary btn-sm" onclick="openCreateModal('users')"><i class="fa-solid fa-plus"></i> Nuevo Usuario</button>
        </div>
      </div>
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
        <div style="background:var(--bg-card);border:1px solid var(--border-color);border-left:4px solid var(--${a.type});border-radius:10px;padding:16px;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;">
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
  const session = getSession();

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
          <input type="number" id="cfg-alert" class="form-control" value="${DB.settings.trafficLight.alertGapPercent}">
        </div>
        <div class="form-group" style="margin-bottom:12px;">
          <label class="form-label">Desfase Alerta Crítica (% gap avance)</label>
          <input type="number" id="cfg-critical" class="form-control" value="${DB.settings.trafficLight.criticalGapPercent}">
        </div>
        <div class="form-group" style="margin-bottom:16px;">
          <label class="form-label">Alerta de Presupuesto Consumido (%)</label>
          <input type="number" id="cfg-budget" class="form-control" value="${DB.settings.trafficLight.budgetWarningPercent}">
        </div>
        <button class="btn btn-primary btn-sm" onclick="saveTrafficSettings()">Guardar Umbrales</button>
      </div>

      <!-- Backup & Restore -->
      <div class="chart-box">
        <div class="chart-title" style="margin-bottom:14px;"><i class="fa-solid fa-database" style="color:var(--blue-accent);"></i> Gestión de Base de Datos Local</div>
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:14px;">Clave de persistencia: <code>cm_progest_v3</code></p>
        
        <div style="display:flex;flex-direction:column;gap:10px;">
          <button class="btn btn-secondary" onclick="downloadJSONBackup()"><i class="fa-solid fa-download"></i> Descargar Copia Completa (JSON)</button>
          
          <label class="btn btn-secondary" style="cursor:pointer;">
            <i class="fa-solid fa-upload"></i> Restaurar Copia (JSON)
            <input type="file" accept=".json" style="display:none;" onchange="restoreJSONBackup(event)">
          </label>

          <button class="btn btn-secondary" onclick="restoreDemoSeed()"><i class="fa-solid fa-rotate-left"></i> Cargar Datos de Demostración Industrial</button>
          
          <button class="btn btn-danger" onclick="confirmResetDB()"><i class="fa-solid fa-trash"></i> Resetear Base de Datos</button>
        </div>
      </div>
    </div>
  `;
}

function saveTrafficSettings() {
  DB.settings.trafficLight.alertGapPercent = Number(document.getElementById("cfg-alert").value) || 10;
  DB.settings.trafficLight.criticalGapPercent = Number(document.getElementById("cfg-critical").value) || 20;
  DB.settings.trafficLight.budgetWarningPercent = Number(document.getElementById("cfg-budget").value) || 85;
  saveDB();
  alert("¡Umbrales actualizados correctamente!");
}

function restoreDemoSeed() {
  if (confirm("¿Deseas restablecer los datos de demostración industrial?")) {
    resetDB();
    renderCurrentView();
    alert("Datos de demostración cargados con éxito.");
  }
}

function confirmResetDB() {
  if (confirm("¿Estás seguro de resetear la base de datos a un estado limpio?")) {
    DB = {
      version: "3.0",
      settings: freshDB().settings,
      users: freshDB().users,
      projects: [],
      expenses: [],
      workers: [],
      tools: [],
      documents: []
    };
    saveDB();
    renderCurrentView();
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
    rows = [["ID", "RUT", "Nombre", "Cargo", "Proyecto", "Estado", "Telefono", "Certificaciones", "VencMedico"]];
    DB.workers.forEach(w => {
      rows.push([w.id, w.rut, w.name, w.role, w.projectId, w.status, w.phone, w.certifications, w.medExamExpiry]);
    });
  } else if (entity === "tools") {
    rows = [["ID", "Codigo", "Nombre", "Marca", "Proyecto", "Estado", "UltimaMant", "ProximaMant", "Serie", "Responsable"]];
    DB.tools.forEach(t => {
      rows.push([t.id, t.code, t.name, t.brand, t.projectId, t.status, t.lastMaintenance, t.nextMaintenance, t.serialNumber, t.responsible]);
    });
  } else if (entity === "documents") {
    rows = [["ID", "Codigo", "Nombre", "Proyecto", "Tipo", "Vencimiento", "Estado"]];
    DB.documents.forEach(d => {
      rows.push([d.id, d.code, d.name, d.projectId, d.type, d.expiryDate, d.status]);
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

// CRUD Modal handling
function openCreateModal(entity) {
  activeModalEntity = entity;
  activeModalRecord = null;
  const modal = document.getElementById("crud-modal");
  const title = document.getElementById("modal-title");
  const body = document.getElementById("modal-body-content");
  
  title.innerText = `Nuevo Registro: ${entity.toUpperCase()}`;
  body.innerHTML = getEntityFormHTML(entity, {});
  modal.classList.add("active");
}

function openEditModal(entity, id) {
  activeModalEntity = entity;
  activeModalRecord = DB[entity].find(x => x.id === id);
  if (!activeModalRecord) return;

  const modal = document.getElementById("crud-modal");
  const title = document.getElementById("modal-title");
  const body = document.getElementById("modal-body-content");
  
  title.innerText = `Editar ${entity.toUpperCase()}: ${id}`;
  body.innerHTML = getEntityFormHTML(entity, activeModalRecord);
  modal.classList.add("active");
}

function closeModal() {
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
          <label class="form-label">Presupuesto Asignado ($)</label>
          <input type="number" id="f_budget" class="form-control" value="${data.budget || 0}">
        </div>
        <div class="form-group">
          <label class="form-label">Gasto Ejecutado Real ($)</label>
          <input type="number" id="f_spent" class="form-control" value="${data.spent || 0}">
        </div>
        <div class="form-group">
          <label class="form-label">Avance Planificado (%)</label>
          <input type="number" id="f_plan" class="form-control" value="${data.plannedProgress || 0}">
        </div>
        <div class="form-group">
          <label class="form-label">Avance Real (%)</label>
          <input type="number" id="f_real" class="form-control" value="${data.realProgress || 0}">
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
          <label class="form-label">Monto ($)</label>
          <input type="number" id="f_amount" class="form-control" value="${data.amount || 0}" required>
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
    return `
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">RUT / DNI</label>
          <input type="text" id="f_rut" class="form-control" value="${data.rut || ''}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Nombre Completo</label>
          <input type="text" id="f_wname" class="form-control" value="${data.name || ''}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Cargo / Especialidad</label>
          <input type="text" id="f_role" class="form-control" value="${data.role || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Proyecto Asignado</label>
          <select id="f_wprj" class="form-control">
            ${DB.projects.map(p => `<option value="${p.id}" ${data.projectId === p.id ? 'selected' : ''}>${p.id} - ${p.name}</option>`).join("")}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Teléfono Contacto</label>
          <input type="text" id="f_phone" class="form-control" value="${data.phone || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Vencimiento Examen Médico</label>
          <input type="date" id="f_med" class="form-control" value="${data.medExamExpiry || '2026-12-31'}">
        </div>
        <div class="form-group full">
          <label class="form-label">Certificaciones y Calificaciones</label>
          <input type="text" id="f_cert" class="form-control" value="${data.certifications || ''}">
        </div>
      </div>
    `;
  } else if (entity === "tools") {
    return `
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Tag / Código</label>
          <input type="text" id="f_tcode" class="form-control" value="${data.code || ''}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Nombre del Equipo</label>
          <input type="text" id="f_tname" class="form-control" value="${data.name || ''}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Marca y Modelo</label>
          <input type="text" id="f_tbrand" class="form-control" value="${data.brand || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Nº Serie</label>
          <input type="text" id="f_tserial" class="form-control" value="${data.serialNumber || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Ubicación / Proyecto</label>
          <input type="text" id="f_tprj" class="form-control" value="${data.projectId || 'Bodega Central'}">
        </div>
        <div class="form-group">
          <label class="form-label">Responsable</label>
          <input type="text" id="f_tresp" class="form-control" value="${data.responsible || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Próxima Mantención</label>
          <input type="date" id="f_tnext" class="form-control" value="${data.nextMaintenance || '2026-06-30'}">
        </div>
      </div>
    `;
  } else if (entity === "documents") {
    return `
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Código Doc</label>
          <input type="text" id="f_dcode" class="form-control" value="${data.code || ''}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Nombre del Documento</label>
          <input type="text" id="f_dname" class="form-control" value="${data.name || ''}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Tipo de Documento</label>
          <input type="text" id="f_dtype" class="form-control" value="${data.type || 'HSE / Calidad'}">
        </div>
        <div class="form-group">
          <label class="form-label">Proyecto Asociado</label>
          <input type="text" id="f_dprj" class="form-control" value="${data.projectId || 'General'}">
        </div>
        <div class="form-group">
          <label class="form-label">Fecha de Vencimiento</label>
          <input type="date" id="f_dexp" class="form-control" value="${data.expiryDate || '2026-12-31'}">
        </div>
      </div>
    `;
  } else if (entity === "users") {
    return `
      <div class="form-grid">
        <div class="form-group full">
          <label class="form-label">Nombre Completo</label>
          <input type="text" id="f_uname" class="form-control" value="${data.name || ''}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Correo Electrónico</label>
          <input type="email" id="f_uemail" class="form-control" value="${data.email || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Rol</label>
          <select id="f_urole" class="form-control">
            <option value="Desarrollador" ${data.role === 'Desarrollador' ? 'selected' : ''}>Desarrollador</option>
            <option value="Administrador" ${data.role === 'Administrador' ? 'selected' : ''}>Administrador</option>
            <option value="Usuario" ${(!data.role || data.role === 'Usuario') ? 'selected' : ''}>Usuario</option>
          </select>
        </div>
      </div>
    `;
  }
  return "";
}

function saveModalRecord() {
  if (!activeModalEntity) return;

  if (activeModalEntity === "projects") {
    const record = activeModalRecord || { id: document.getElementById("f_id").value.trim() };
    record.id = document.getElementById("f_id").value.trim();
    record.name = document.getElementById("f_name").value.trim();
    record.client = document.getElementById("f_client").value.trim();
    record.location = document.getElementById("f_location").value.trim();
    record.manager = document.getElementById("f_manager").value.trim();
    record.budget = Number(document.getElementById("f_budget").value) || 0;
    record.spent = Number(document.getElementById("f_spent").value) || 0;
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
    record.amount = Number(document.getElementById("f_amount").value) || 0;
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
    record.medExamExpiry = document.getElementById("f_med").value;
    record.certifications = document.getElementById("f_cert").value.trim();
    record.status = "Activo";

    if (!activeModalRecord) DB.workers.push(record);
  } else if (activeModalEntity === "tools") {
    const record = activeModalRecord || { id: "TLS-" + Date.now() };
    record.code = document.getElementById("f_tcode").value.trim();
    record.name = document.getElementById("f_tname").value.trim();
    record.brand = document.getElementById("f_tbrand").value.trim();
    record.serialNumber = document.getElementById("f_tserial").value.trim();
    record.projectId = document.getElementById("f_tprj").value.trim();
    record.responsible = document.getElementById("f_tresp").value.trim();
    record.nextMaintenance = document.getElementById("f_tnext").value;
    record.lastMaintenance = new Date().toISOString().split("T")[0];
    record.status = "En Faena";

    if (!activeModalRecord) DB.tools.push(record);
  } else if (activeModalEntity === "documents") {
    const record = activeModalRecord || { id: "DOC-" + Date.now() };
    record.code = document.getElementById("f_dcode").value.trim();
    record.name = document.getElementById("f_dname").value.trim();
    record.type = document.getElementById("f_dtype").value.trim();
    record.projectId = document.getElementById("f_dprj").value.trim();
    record.expiryDate = document.getElementById("f_dexp").value;
    record.status = "Vigente";

    if (!activeModalRecord) DB.documents.push(record);
  } else if (activeModalEntity === "users") {
    const record = activeModalRecord || { id: "usr-" + Date.now(), createdAt: new Date().toISOString().split("T")[0] };
    record.name = document.getElementById("f_uname").value.trim();
    record.email = document.getElementById("f_uemail").value.trim();
    record.role = document.getElementById("f_urole").value;
    record.avatar = getInitials(record.name);

    if (!activeModalRecord) DB.users.push(record);
  }

  saveDB();
  closeModal();
  renderCurrentView();
}

function deleteRecord(entity, id) {
  if (confirm(`¿Estás seguro de eliminar el registro ${id}?`)) {
    DB[entity] = DB[entity].filter(x => x.id !== id);
    saveDB();
    renderCurrentView();
  }
}

// App Initialization
document.addEventListener("DOMContentLoaded", () => {
  loadDB();
  getSession();
  
  // Mobile sidebar toggling
  const menuBtn = document.getElementById("mobile-menu-btn");
  const sidebar = document.getElementById("sidebar");
  if (menuBtn && sidebar) {
    menuBtn.addEventListener("click", () => {
      sidebar.classList.toggle("mobile-open");
    });
  }

  renderCurrentView();
});
