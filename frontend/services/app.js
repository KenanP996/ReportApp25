import { api, clearSession, getState, hydrateSession, requireRole, setSession } from "./api.js";
import { showFormErrors, validateLoginForm, validateRegisterForm } from "./forms.js";

const routes = {
  dashboard: { view: "dashboard", handler: renderDashboard, requiresAuth: true },
  reports: { view: "reports", handler: renderReports, requiresAuth: true },
  teams: { view: "teams", handler: renderTeams, requiresAuth: true },
  pickups: { view: "pickups", handler: renderPickups, requiresAuth: true },
  applications: { view: "applications", handler: renderApplications, requiresAuth: true },
  profile: { view: "profile", handler: renderProfile, requiresAuth: true },
  admin: { view: "admin", handler: renderAdmin, requiresAuth: true, role: "manager" },
  login: { view: "login", handler: renderLogin },
  register: { view: "register", handler: renderRegister },
  recover: { view: "recover" },
  privacy: { view: "privacy" },
  terms: { view: "terms" }
};

let applicationsCache = [];
let companiesCache = null;
let usersCache = null;
const COMPANY_DATALIST_IDS = ["company-options", "filter-company-options"];
const ITEM_LABELS = {
  numPcs: "PCs",
  numLaptops: "Laptops",
  numSurface: "Surface",
  numServers: "Servers",
  numSwitchers: "Switchers",
  numHdds: "HDDs",
  memberships: "Memberships"
};
const POINT_WEIGHTS = {
  numPcs: 1,
  numLaptops: 2,
  numSurface: 2,
  numServers: 3,
  numSwitchers: 2,
  numHdds: 1,
  memberships: 1
};
const ITEM_KEY_ALIASES = {
  numPcs: ["num_pcs", "pcs", "pc"],
  numLaptops: ["num_laptops", "laptops", "laptop"],
  numSurface: ["num_surface", "num_surfaces", "surface", "surfaces"],
  numServers: ["num_servers", "servers", "server"],
  numSwitchers: ["num_switchers", "switches", "switchers", "switcher"],
  numHdds: ["num_hdds", "hdds", "hdd", "totalshreddingamount", "total_shredding_amount", "shredding"],
  memberships: ["num_memberships", "membership", "memberships", "members"]
};
const ITEM_KEYS = Object.keys(ITEM_LABELS);
const PICKUP_ITEM_FIELDS = {
  numPcs: "pickup-num-pcs",
  numLaptops: "pickup-num-laptops",
  numSurface: "pickup-num-surface",
  numServers: "pickup-num-servers",
  numSwitchers: "pickup-num-switchers",
  numHdds: "pickup-num-hdds",
  memberships: "pickup-memberships"
};
let dashboardChart = null;

const viewContainer = document.getElementById("view-container");

document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("year").textContent = String(new Date().getFullYear());
  bindNavigation();

  if (getState().token) {
    await hydrateSession();
    updateNav();
  }

  const initialRoute = getRouteFromHash(window.location.hash) || (getState().user ? "dashboard" : "login");
  navigate(initialRoute);
});

window.addEventListener("hashchange", () => {
  const route = getRouteFromHash(window.location.hash);
  navigate(route || "dashboard");
});

function bindNavigation() {
  document.querySelectorAll("[data-route]").forEach((element) => {
    element.addEventListener("click", (event) => {
      const route = element.dataset.route;
      if (!route) return;
      event.preventDefault();
      navigate(route);
    });
  });

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      clearSession();
      updateNav();
      navigate("login");
    });
  }

}

function getRouteFromHash(hash) {
  if (!hash) return null;
  const normalized = hash.replace("#", "");
  return routes[normalized] ? normalized : null;
}

function promptNumber(message) {
  const value = window.prompt(message);
  if (value === null) return null;
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function downloadCSV(filename, rows) {
  if (!rows || !rows.length) {
    alert("No data to export.");
    return;
  }
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(",")].concat(
    rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h] ?? "";
          const safe = String(val).replace(/"/g, '""');
          return `"${safe}"`;
        })
        .join(",")
    )
  );
  const blob = new Blob([csv.join("\n")], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function navigate(routeKey) {
  const route = routes[routeKey];
  if (!route) return;

  const needsAuth = route.requiresAuth;
  const needsRole = route.role;

  if (needsAuth && !getState().user) {
    window.location.hash = "#login";
    await loadAndRender("login");
    return;
  }

  if (needsRole && (!getState().user || getState().user.role !== needsRole)) {
    window.location.hash = "#dashboard";
    await loadAndRender("dashboard");
    return;
  }

  await loadAndRender(routeKey);
}

async function loadAndRender(routeKey) {
  const route = routes[routeKey];
  setActiveNav(routeKey);
  const markup = await loadView(route.view);
  viewContainer.innerHTML = markup;
  applyRoleVisibility();
  if (route.handler) {
    route.handler();
  }
  window.location.hash = `#${routeKey}`;
}

function setActiveNav(route) {
  document.querySelectorAll(".nav-link").forEach((link) => {
    if (link.dataset.route === route) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

async function loadView(view) {
  try {
    const response = await fetch(`./views/${view}.html`, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Failed to load view: ${view}`);
    return await response.text();
  } catch (error) {
    console.error(error);
    return `<section class="text-center py-5"><h2 class="mb-3">View unavailable</h2><p class="text-muted">We could not load the <strong>${view}</strong> page.</p></section>`;
  }
}

function updateNav() {
  const navAdmin = document.querySelector(".nav-admin");
  const navSignin = document.getElementById("nav-signin");
  const navUserMenu = document.getElementById("nav-user-menu");
  const userMenuToggle = document.getElementById("user-menu-toggle");
  const user = getState().user;

  if (user) {
    navSignin?.classList.add("d-none");
    navUserMenu?.classList.remove("d-none");
    if (userMenuToggle) userMenuToggle.textContent = user.full_name || user.email;

    if (navAdmin) {
      requireRole("manager") ? navAdmin.classList.remove("d-none") : navAdmin.classList.add("d-none");
    }
  } else {
    navSignin?.classList.remove("d-none");
    navUserMenu?.classList.add("d-none");
    navAdmin?.classList.add("d-none");
  }
}

function applyRoleVisibility() {
  const isElevated = requireRole("manager") || requireRole("team_lead");
  document.querySelectorAll("[data-role='admin']").forEach((el) => {
    if (isElevated) {
      el.classList.remove("d-none");
    } else {
      el.classList.add("d-none");
    }
  });
}

// View handlers

function renderDashboard() {
  const welcome = document.getElementById("dashboard-greeting");
  if (welcome && getState().user) {
    welcome.textContent = `Welcome back, ${getState().user.full_name || getState().user.email}`;
  }

  refreshDashboardStats();
  const refreshBtn = document.getElementById("dashboard-refresh-btn");
  refreshBtn?.addEventListener("click", refreshDashboardStats);
}

async function refreshDashboardStats() {
  const [stats, pickups, teams] = await Promise.all([
    fetchReportStatistics().catch(() => null),
    api("/api/pickups").catch(() => []),
    api("/api/teams").catch(() => [])
  ]);
  const companyMap = await getCompanyMap();
  const reportMap = new Map((stats?.reports ?? []).map((report) => [report.id, report]));

  const statReports = document.getElementById("stat-reports");
  const statPickups = document.getElementById("stat-pickups");
  const statTeams = document.getElementById("stat-teams");
  const statPoints = document.getElementById("stat-points");
  if (statReports) statReports.textContent = formatNumber(stats?.totals?.count ?? 0);
  if (statPickups) statPickups.textContent = formatNumber(pickups.length ?? 0);
  if (statTeams) statTeams.textContent = formatNumber(teams.length ?? 0);
  if (statPoints) statPoints.textContent = formatNumber(stats?.totals?.points ?? 0);

  renderDashboardChart(stats?.summary_by_month ?? []);

  const pickupList = document.getElementById("dashboard-pickups");
  if (pickupList) {
    pickupList.innerHTML = pickups
      .slice(0, 5)
      .map((pickup) => {
        const report = reportMap.get(pickup.report_id);
        const company = report ? companyMap.get(report.company_id) : null;
        const companyLabel = describeCompany(company, report?.company_id);
        const start = pickup.pickup_window_start ? new Date(pickup.pickup_window_start).toLocaleString() : "TBD";
        const end = pickup.pickup_window_end ? new Date(pickup.pickup_window_end).toLocaleString() : "TBD";
        return `
        <li class="list-group-item px-0">
          <div class="fw-semibold">${companyLabel}</div>
          <small class="text-muted">Ticket ${pickup.id} • ${start} – ${end}</small>
          <div class="small text-muted">${pickup.location ?? "No location provided"}</div>
        </li>`;
      })
      .join("");
  }

  const reportTable = document.getElementById("dashboard-reports");
  if (reportTable) {
    const reports = stats?.reports ?? [];
    reportTable.innerHTML = reports
      .slice(0, 5)
      .map((report) => {
        const company = companyMap.get(report.company_id);
        return `
        <tr>
          <td>${report.id}</td>
          <td>${describeCompany(company, report.company_id)}</td>
          <td>${report.total_items ?? 0}</td>
          <td>${report.points ?? 0}</td>
          <td><span class="badge bg-primary">${report.status}</span></td>
        </tr>
      `;
      })
      .join("");
  }

  const itemsTable = document.getElementById("dashboard-items");
  if (itemsTable) {
    const items = stats?.totals?.items || {};
    itemsTable.innerHTML = Object.entries(items)
      .map(
        ([key, value]) => `
        <tr>
          <td class="text-muted text-uppercase small">${key}</td>
          <td class="fw-semibold">${value}</td>
        </tr>
      `
      )
      .join("");
  }

  const statusTable = document.getElementById("dashboard-statuses");
  if (statusTable) {
    const byStatus = stats?.totals?.by_status || {};
    statusTable.innerHTML = Object.entries(byStatus)
      .map(
        ([key, value]) => `
        <tr>
          <td class="text-muted text-uppercase small">${key}</td>
          <td class="fw-semibold">${value}</td>
        </tr>
      `
      )
      .join("");
  }
}

function renderDashboardChart(summaryByMonth) {
  const canvas = document.getElementById("productivity-chart");
  if (!canvas) {
    if (dashboardChart) {
      dashboardChart.destroy();
      dashboardChart = null;
    }
    return;
  }

  if (dashboardChart) {
    dashboardChart.destroy();
  }

  if (!summaryByMonth || !summaryByMonth.length) {
    dashboardChart = null;
    return;
  }

  const labels = summaryByMonth.map((entry) => entry.month ?? "Unknown");
  const data = summaryByMonth.map((entry) => entry.points ?? 0);

  dashboardChart = new window.Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Points Earned",
          data,
          fill: false,
          tension: 0.35,
          borderColor: "#1d4ed8",
          backgroundColor: "#38bdf8",
          pointRadius: 5
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

async function renderReports() {
  const tableBody = document.querySelector("#reports-table tbody");
  if (!tableBody) return;

  await populateCompanyDatalists();

  const filterForm = document.getElementById("report-filter-form");
  const resetBtn = document.getElementById("report-reset-btn");
  const exportBtn = document.getElementById("reports-export-btn");
  const filterCompanyInput = document.getElementById("filter-company");
  const summaryEls = {
    points: document.getElementById("report-summary-points"),
    count: document.getElementById("report-summary-count"),
    companies: document.getElementById("report-summary-companies"),
    pcs: document.getElementById("report-summary-pcs"),
    laptops: document.getElementById("report-summary-laptops"),
    surface: document.getElementById("report-summary-surface"),
    servers: document.getElementById("report-summary-servers"),
    switchers: document.getElementById("report-summary-switchers"),
    hdds: document.getElementById("report-summary-hdds"),
    memberships: document.getElementById("report-summary-memberships")
  };
  const provinceBody = document.getElementById("report-province-body");
  const cityBody = document.getElementById("report-city-body");
  const companyTableBody = document.querySelector("#reports-company-table tbody");
  const userTableBody = document.getElementById("report-users-body");
  const alertBox = document.getElementById("reports-alert");

  let currentStats = null;
  let reportCharts = {
    monthly: null,
    province: null
  };

  const getFilters = () => {
    const numberFromInput = (id) => {
      const value = document.getElementById(id)?.value;
      if (!value) return null;
      const parsed = parseInt(value, 10);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const filters = {
      month: numberFromInput("filter-month"),
      year: numberFromInput("filter-year"),
      province: document.getElementById("filter-province")?.value.trim().toUpperCase() || "",
      status: document.getElementById("filter-status")?.value || ""
    };
    const companyIdAttr = filterCompanyInput?.dataset.companyId;
    if (companyIdAttr) {
      const parsed = parseInt(companyIdAttr, 10);
      if (Number.isFinite(parsed)) {
        filters.company_id = parsed;
      }
    }
    return filters;
  };

  const renderSummaryCards = (totals) => {
    if (!totals) return;
    if (summaryEls.points) summaryEls.points.textContent = formatNumber(totals.points ?? 0);
    if (summaryEls.count) summaryEls.count.textContent = formatNumber(totals.count ?? 0);
    if (summaryEls.companies) summaryEls.companies.textContent = formatNumber(totals.companies ?? 0);
    const items = totals.items ?? {};
    if (summaryEls.pcs) summaryEls.pcs.textContent = formatNumber(items.numPcs ?? 0);
    if (summaryEls.laptops) summaryEls.laptops.textContent = formatNumber(items.numLaptops ?? 0);
    if (summaryEls.surface) summaryEls.surface.textContent = formatNumber(items.numSurface ?? 0);
    if (summaryEls.servers) summaryEls.servers.textContent = formatNumber(items.numServers ?? 0);
    if (summaryEls.switchers) summaryEls.switchers.textContent = formatNumber(items.numSwitchers ?? 0);
    if (summaryEls.hdds) summaryEls.hdds.textContent = formatNumber(items.numHdds ?? 0);
    if (summaryEls.memberships) summaryEls.memberships.textContent = formatNumber(items.memberships ?? 0);
  };

  const renderSummaryTable = (container, rows, type) => {
    if (!container) return;
    if (!rows || !rows.length) {
      const colspan = type === "city" ? 12 : 11;
      container.innerHTML = `<tr><td colspan="${colspan}" class="text-muted">No ${type} data for current filters.</td></tr>`;
      return;
    }
    const deviceKeys = Object.keys(ITEM_LABELS);
    container.innerHTML = rows
      .map((entry) => {
        const deviceCells = deviceKeys.map((key) => `<td>${formatNumber(entry.items?.[key] ?? 0)}</td>`).join("");
        if (type === "city") {
          return `
            <tr>
              <td>${entry.city ?? "Unknown"}</td>
              <td>${entry.province ?? "—"}</td>
              <td>${formatNumber(entry.companies ?? 0)}</td>
              <td>${formatNumber(entry.total_items ?? 0)}</td>
              <td>${formatNumber(entry.points ?? 0)}</td>
              ${deviceCells}
            </tr>
          `;
        }
        return `
          <tr>
            <td>${entry.province ?? "Unknown"}</td>
            <td>${formatNumber(entry.companies ?? 0)}</td>
            <td>${formatNumber(entry.total_items ?? 0)}</td>
            <td>${formatNumber(entry.points ?? 0)}</td>
            ${deviceCells}
          </tr>
        `;
      })
      .join("");
  };

  const renderReportsTable = async (reports) => {
    const companyMap = await getCompanyMap();
    if (!reports || !reports.length) {
      tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No reports for the selected filters.</td></tr>`;
      alertBox?.classList.remove("d-none");
      if (alertBox) alertBox.textContent = "Adjust filters or create a report to see results.";
      return;
    }

    alertBox?.classList.add("d-none");
    if (alertBox) alertBox.textContent = "";

    tableBody.innerHTML = reports
      .map((report) => {
        const company = companyMap.get(report.company_id);
        return `
        <tr>
          <td>${report.id}</td>
          <td>${describeCompany(company, report.company_id)}</td>
          <td>${report.total_items ?? 0}</td>
          <td>${summarizeItemBreakdown(report.items)}</td>
          <td>${report.points ?? 0}</td>
          <td><span class="badge bg-primary">${report.status}</span></td>
          <td>${report.submitted_at ?? "-"}</td>
        </tr>
      `;
      })
      .join("");
  };

  const renderCompanyTable = (companyDetails) => {
    if (!companyTableBody) {
      return;
    }
    if (!companyDetails || !companyDetails.length) {
      companyTableBody.innerHTML = `<tr><td colspan="13" class="text-muted text-center">No company data to display.</td></tr>`;
      return;
    }

    companyTableBody.innerHTML = companyDetails
      .map((detail) => {
        return `
          <tr>
            <td>${detail.company_name}</td>
            <td>${(detail.owners && detail.owners.length) ? detail.owners.join(", ") : "—"}</td>
            <td>${detail.province ?? "—"}</td>
            <td>${detail.city ?? "—"}</td>
            <td>${detail.points ?? 0}</td>
            <td>${detail.items?.numPcs ?? 0}</td>
            <td>${detail.items?.numLaptops ?? 0}</td>
            <td>${detail.items?.numSurface ?? 0}</td>
            <td>${detail.items?.numServers ?? 0}</td>
            <td>${detail.items?.numSwitchers ?? 0}</td>
            <td>${detail.items?.numHdds ?? 0}</td>
            <td>${detail.items?.memberships ?? 0}</td>
            <td>${detail.last_reported_at ?? "—"}</td>
          </tr>
        `;
      })
      .join("");
  };

  const renderTopUsers = (users) => {
    if (!userTableBody) return;
    if (!users || !users.length) {
      userTableBody.innerHTML = `<tr><td colspan="5" class="text-muted text-center">No user data yet.</td></tr>`;
      return;
    }

    const sorted = [...users].sort((a, b) => (b.points ?? 0) - (a.points ?? 0)).slice(0, 10);
    userTableBody.innerHTML = sorted
      .map(
        (user) => `
        <tr>
          <td>${user.name}</td>
          <td>${user.email ?? "—"}</td>
          <td>${user.reports}</td>
          <td>${user.companies}</td>
          <td>${user.points ?? 0}</td>
        </tr>
      `
      )
      .join("");
  };

  const renderCharts = (stats) => {
    const monthlyCtx = document.getElementById("report-monthly-chart");
    const provinceCtx = document.getElementById("report-province-chart");
    if (reportCharts.monthly) {
      reportCharts.monthly.destroy();
      reportCharts.monthly = null;
    }
    if (reportCharts.province) {
      reportCharts.province.destroy();
      reportCharts.province = null;
    }

    if (monthlyCtx && stats.summary_by_month?.length) {
      const labels = stats.summary_by_month.map((entry) => entry.month);
      const points = stats.summary_by_month.map((entry) => entry.points ?? 0);
      reportCharts.monthly = new window.Chart(monthlyCtx, {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "Points",
              data: points,
              backgroundColor: "#1d4ed8"
            }
          ]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } }
        }
      });
    }

    if (provinceCtx && stats.summary_by_province?.length) {
      const labels = stats.summary_by_province.map((entry) => entry.province);
      const points = stats.summary_by_province.map((entry) => entry.points ?? 0);
      reportCharts.province = new window.Chart(provinceCtx, {
        type: "pie",
        data: {
          labels,
          datasets: [
            {
              data: points,
              backgroundColor: labels.map((_, index) => {
                const hue = (index * 47) % 360;
                return `hsl(${hue}, 70%, 60%)`;
              })
            }
          ]
        },
        options: {
          responsive: true
        }
      });
    }
  };

  const loadReports = async () => {
    const filters = getFilters();
    try {
      const stats = await fetchReportStatistics(filters);
      currentStats = stats;
      renderSummaryCards(stats.totals);
      renderSummaryTable(provinceBody, stats.summary_by_province ?? [], "province");
      renderSummaryTable(cityBody, stats.summary_by_city ?? [], "city");
      const reports = stats.reports ?? [];
      await renderReportsTable(reports);
      renderCompanyTable(stats.company_details ?? []);
      renderTopUsers(stats.summary_by_user ?? []);
      renderCharts(stats);
    } catch (error) {
      tableBody.innerHTML = `<tr><td colspan="7" class="text-danger">${error.message}</td></tr>`;
      if (companyTableBody) {
        companyTableBody.innerHTML = `<tr><td colspan="13" class="text-danger">${error.message}</td></tr>`;
      }
      if (userTableBody) {
        userTableBody.innerHTML = `<tr><td colspan="5" class="text-danger">${error.message}</td></tr>`;
      }
    }
  };

  filterForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    loadReports();
  });

  resetBtn?.addEventListener("click", () => {
    filterForm?.reset();
    if (filterCompanyInput) {
      filterCompanyInput.dataset.companyId = "";
    }
    loadReports();
  });

  const syncFilterCompany = async () => {
    if (!filterCompanyInput) return;
    const value = filterCompanyInput.value.trim();
    if (!value) {
      filterCompanyInput.dataset.companyId = "";
      return;
    }
    const company = await matchCompanyByInput(value);
    filterCompanyInput.dataset.companyId = company?.id ? String(company.id) : "";
  };

  filterCompanyInput?.addEventListener("input", syncFilterCompany);
  filterCompanyInput?.addEventListener("change", syncFilterCompany);
  filterCompanyInput?.addEventListener("blur", syncFilterCompany);
  syncFilterCompany();

  exportBtn?.addEventListener("click", () => {
    if (!currentStats || !currentStats.reports) {
      alert("Load reports before exporting.");
      return;
    }
    downloadCSV(
      "reports.csv",
      currentStats.reports.map((report) => ({
        id: report.id,
        company_id: report.company_id,
        company_name: report.company_name ?? describeCompany(null, report.company_id),
        company_province: report.company_province ?? "",
        company_city: report.company_city ?? "",
        status: report.status,
        total_items: report.total_items,
        points: report.points,
        num_pcs: report.items?.numPcs ?? 0,
        num_laptops: report.items?.numLaptops ?? 0,
        num_surface: report.items?.numSurface ?? 0,
        num_servers: report.items?.numServers ?? 0,
        num_switchers: report.items?.numSwitchers ?? 0,
        num_hdds: report.items?.numHdds ?? 0,
        memberships: report.items?.memberships ?? 0,
        submitted_by: report.submitted_by,
        submitted_by_name: report.submitted_by_name ?? "",
        submitted_by_email: report.submitted_by_email ?? "",
        submitted_at: report.submitted_at
      }))
    );
  });

  loadReports();
}

async function renderTeams() {
  const list = document.getElementById("team-cards");
  if (!list) return;

  const inviteBtn = document.getElementById("btn-invite-member");
  const createTeamBtn = document.getElementById("btn-create-team");
  const createTeamForm = document.getElementById("team-form");

  inviteBtn?.addEventListener("click", async () => {
    if (!(requireRole("manager") || requireRole("team_lead"))) {
      alert("Only managers or team leads can invite members.");
      return;
    }
    const teamId = promptNumber("Enter Team ID to invite into:");
    if (teamId === null) return;
    const email = window.prompt("Enter applicant email:");
    const name = window.prompt("Enter applicant name:");
    if (!email || !name) return;
    try {
      await api("/api/team-applications", {
        method: "POST",
        body: JSON.stringify({
          team_id: teamId,
          applicant_email: email,
          applicant_name: name,
          status: "approved"
        })
      });
      alert("Invite recorded as approved application.");
      await renderApplications();
    } catch (error) {
      alert(`Invite failed: ${error.message}`);
    }
  });

  createTeamForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!(requireRole("manager") || requireRole("team_lead"))) {
      alert("Only managers or team leads can create teams.");
      return;
    }
    const name = document.getElementById("team-name").value;
    const region = document.getElementById("team-region").value;
    const managerId = getState().user?.id || null;
    if (!name || !region) {
      alert("Name and region are required.");
      return;
    }
    try {
      await api("/api/teams", {
        method: "POST",
        body: JSON.stringify({
          name,
          region,
          manager_id: managerId
        })
      });
      await renderTeams();
      alert("Team created.");
    } catch (error) {
      alert(`Create team failed: ${error.message}`);
    }
  });

  try {
    const teams = await api("/api/teams");
    list.innerHTML = teams
      .map(
        (team) => `
        <div class="col-12 col-md-6 col-lg-4 d-flex">
          <div class="card flex-fill mb-4">
            <div class="card-body">
              <h5 class="card-title d-flex align-items-center">
                <span class="avatar-ring me-3">${team.name
                  .split(" ")
                  .map((word) => word[0])
                  .join("")}</span>
                ${team.name}
              </h5>
              <ul class="list-unstyled small mb-4">
                <li><strong>Region:</strong> ${team.region}</li>
                <li><strong>Manager:</strong> ${team.manager_id ?? "-"}</li>
              </ul>
              <button class="btn btn-outline-primary w-100">View Team Details</button>
            </div>
          </div>
        </div>
      `
      )
      .join("");
  } catch (error) {
    list.innerHTML = `<p class="text-danger">${error.message}</p>`;
  }
}

async function renderPickups() {
  const list = document.getElementById("pickup-list");
  if (!list) return;

  const pickupForm = document.getElementById("pickup-form");
  const scheduleButton = pickupForm?.querySelector("button[type='submit']");
  const companyInput = document.getElementById("pickup-company");
  const pickupPrefillMap = {
    name: "pickup-company-name",
    city: "pickup-company-city",
    province: "pickup-company-province",
    onboarding_date: "pickup-company-onboard",
    contact_name: "pickup-company-contact-name",
    contact_email: "pickup-company-contact-email"
  };

  await populateCompanyDatalists();

  const handleCompanyPrefill = async () => {
    if (!companyInput) return;
    const current = companyInput.value.trim();
    if (!current) return;
    const match = await matchCompanyByInput(current);
    prefillCompanyFields(pickupPrefillMap, match);
  };

  companyInput?.addEventListener("input", handleCompanyPrefill);
  companyInput?.addEventListener("change", handleCompanyPrefill);
  companyInput?.addEventListener("blur", handleCompanyPrefill);

  pickupForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!(requireRole("manager") || requireRole("team_lead"))) {
      alert("Only managers or team leads can plan pickups.");
      return;
    }
    const companyRaw = companyInput?.value?.trim() || "";
    if (!companyRaw) {
      alert("Provide a company to schedule the pickup.");
      return;
    }

    let companyId = null;
    let companyName = companyRaw;
    let existingCompany = await matchCompanyByInput(companyRaw);

    if (existingCompany) {
      companyId = existingCompany.id;
      companyName = existingCompany.name;
      prefillCompanyFields(pickupPrefillMap, existingCompany);
    }

    if (!existingCompany) {
      const user = getState().user;
      const name = document.getElementById("pickup-company-name").value.trim() || companyRaw;
      const city = document.getElementById("pickup-company-city").value.trim() || (user?.officeLocation ?? "");
      const provinceRaw = (document.getElementById("pickup-company-province").value.trim() || "BC").toUpperCase();
      const onboardingInput = document.getElementById("pickup-company-onboard").value;
      const onboarding_date = onboardingInput || new Date().toISOString().slice(0, 10);
      const contact_name = document.getElementById("pickup-company-contact-name").value.trim() || (user?.full_name ?? name);
      const contact_email = document.getElementById("pickup-company-contact-email").value.trim() || user?.email || "";

      if (!name || !city || provinceRaw.length !== 2 || !contact_name || !contact_email) {
        alert("Please provide at least company name, city, and contact info to create a new company.");
        return;
      }

      try {
        const company = await api("/api/companies", {
          method: "POST",
          body: JSON.stringify({
            name,
            city,
            province: provinceRaw,
            contact_name,
            contact_email,
            onboarding_date
          })
        });
        const created = company.company ?? company;
        companyId = created.id ?? null;
        companyName = created.name ?? name;
        await getCompanyMap(true);
        await populateCompanyDatalists(true);
        prefillCompanyFields(pickupPrefillMap, created);
      } catch (error) {
        alert(`Create company failed: ${error.message}`);
        return;
      }

      if (!Number.isFinite(companyId)) {
        alert("Could not determine company ID after creation.");
        return;
      }
    }
    const location = document.getElementById("pickup-location").value;
    const start = document.getElementById("pickup-window-start").value;
    const end = document.getElementById("pickup-window-end").value;
    if (!location || !start || !end) {
      alert("Location and window times are required.");
      return;
    }
    const item_breakdown = readItemInputs(PICKUP_ITEM_FIELDS);
    try {
      const body = {
        company_id: Number.isFinite(companyId) ? companyId : null,
        scheduled_by: getState().user?.id || null,
        pickup_window_start: start,
        pickup_window_end: end,
        location,
        status: "scheduled",
        payload: {
          item_breakdown,
          company_name: companyName
        }
      };
      scheduleButton?.setAttribute("disabled", "true");
      scheduleButton?.classList.add("disabled");
      await api("/api/pickups-with-report", {
        method: "POST",
        body: JSON.stringify(body)
      });
      await loadPickupList(list);
      pickupForm.reset();
      if (companyInput) {
        companyInput.value = companyName;
      }
      alert("Pickup planned.");
    } catch (error) {
      alert(`Plan pickup failed: ${error.message}`);
    } finally {
      scheduleButton?.removeAttribute("disabled");
      scheduleButton?.classList.remove("disabled");
    }
  });

  await loadPickupList(list);
}

async function loadPickupList(container) {
  try {
    const [pickups, stats, companyMap] = await Promise.all([
      api("/api/pickups"),
      api("/api/reports/statistics").catch(() => ({ reports: [] })),
      getCompanyMap()
    ]);
    const reportMap = new Map((stats.reports ?? []).map((report) => [report.id, report]));
    if (!pickups.length) {
      container.innerHTML = `<p class="text-muted mb-0">No pickups scheduled yet.</p>`;
      return;
    }
    container.innerHTML = pickups
      .map((pickup) => {
        const report = reportMap.get(pickup.report_id);
        const company = report ? companyMap.get(report.company_id) : null;
        const companyLabel = describeCompany(company, report?.company_id);
        const window = `${pickup.pickup_window_start ?? "TBD"} - ${pickup.pickup_window_end ?? "TBD"}`;
        return `
        <div class="card mb-3">
          <div class="card-body">
            <div class="d-flex justify-content-between flex-column flex-md-row">
              <div>
                <h6 class="fw-semibold">${companyLabel}</h6>
                <p class="mb-1 text-muted small">Ticket ${pickup.id} • Report ${pickup.report_id}</p>
                <p class="mb-0 text-muted">Window: ${window}</p>
              </div>
              <div class="text-md-end mt-3 mt-md-0">
                <span class="badge bg-info text-dark mb-2">${pickup.status}</span>
              </div>
            </div>
          </div>
        </div>
      `;
      })
      .join("");
  } catch (error) {
    container.innerHTML = `<p class="text-danger">${error.message}</p>`;
  }
}

async function renderApplications() {
  const timeline = document.getElementById("application-timeline");
  if (!timeline) return;

  const filterBtn = document.getElementById("btn-filter-applicants");
  const downloadBtn = document.getElementById("btn-download-applicants");

  filterBtn?.addEventListener("click", () => {
    if (!applicationsCache.length) {
      alert("No applications loaded yet.");
      return;
    }
    const status = window.prompt("Filter by status (pending/interview/approved/denied). Leave blank for all:");
    if (status === null) return;
    const filtered =
      status.trim() === ""
        ? applicationsCache
        : applicationsCache.filter((a) => (a.status || "").toLowerCase() === status.toLowerCase());
    renderApplicationsList(filtered, timeline);
  });

  downloadBtn?.addEventListener("click", () => {
    if (!applicationsCache.length) {
      alert("No applications to download.");
      return;
    }
    downloadCSV(
      "applications.csv",
      applicationsCache.map((a) => ({
        id: a.id,
        team_id: a.team_id,
        applicant_name: a.applicant_name,
        applicant_email: a.applicant_email,
        status: a.status,
        submitted_at: a.submitted_at,
        reviewed_at: a.reviewed_at
      }))
    );
  });

  try {
    applicationsCache = await api("/api/team-applications");
    renderApplicationsList(applicationsCache, timeline);
  } catch (error) {
    timeline.innerHTML = `<p class="text-danger">${error.message}</p>`;
  }
}

function renderApplicationsList(list, container) {
  container.innerHTML = list
    .map(
      (application) => `
      <div class="card mb-3">
        <div class="card-body d-flex justify-content-between flex-column flex-md-row">
          <div>
            <h6 class="fw-semibold mb-1">${application.applicant_name}</h6>
            <p class="mb-0 text-muted small">Team ${application.team_id} • ${application.submitted_at ?? ""}</p>
          </div>
          <div class="d-flex align-items-center gap-2 mt-3 mt-md-0">
            <span class="badge bg-secondary">${application.status}</span>
          </div>
        </div>
      </div>
    `
    )
    .join("");
}

function renderProfile() {
  const name = document.getElementById("profile-name");
  const email = document.getElementById("profile-email");
  const role = document.getElementById("profile-role");
  const team = document.getElementById("profile-team");
  const avatar = document.getElementById("profile-avatar");
  const refreshBtn = document.getElementById("profile-refresh-btn");
  const logoutBtn = document.getElementById("profile-logout-btn");

  const applyUser = () => {
    if (getState().user) {
      if (name) name.textContent = getState().user.full_name || "User";
      if (email) email.textContent = getState().user.email;
      if (role) role.textContent = getState().user.role;
      if (team) team.textContent = getState().user.team_id ?? "Unassigned";
      if (avatar) avatar.textContent = (getState().user.full_name || getState().user.email || "U").substring(0, 2).toUpperCase();
    }
  };

  applyUser();

  refreshBtn?.addEventListener("click", async () => {
    try {
      const { user } = await api("/api/auth/me");
      setSession(getState().token, user);
      updateNav();
      applyUser();
    } catch (error) {
      alert(error.message);
    }
  });

  logoutBtn?.addEventListener("click", () => {
    clearSession();
    navigate("login");
  });
}

async function renderAdmin() {
  if (!getState().user || getState().user.role !== "manager") {
    navigate("dashboard");
    return;
  }

  const countEls = {
    users: document.getElementById("admin-users-count"),
    teams: document.getElementById("admin-teams-count"),
    reports: document.getElementById("admin-reports-count"),
    pickups: document.getElementById("admin-pickups-count")
  };

  const [users, teams, reports, pickups] = await Promise.all([
    api("/api/users"),
    api("/api/teams"),
    api("/api/reports"),
    api("/api/pickups")
  ]);

  if (countEls.users) countEls.users.textContent = users.length;
  if (countEls.teams) countEls.teams.textContent = teams.length;
  if (countEls.reports) countEls.reports.textContent = reports.length;
  if (countEls.pickups) countEls.pickups.textContent = pickups.length;

  const usersTable = document.querySelector("#admin-users-table tbody");
  if (usersTable) {
    usersTable.innerHTML = users
      .map(
        (user) => `
        <tr>
          <td>${user.full_name ?? "-"}</td>
          <td>${user.email}</td>
          <td><span class="badge ${user.role === "manager" ? "bg-primary" : "bg-secondary"}">${user.role}</span></td>
          <td>${user.team_id ?? "-"}</td>
        </tr>
      `
      )
      .join("");
  }

  const reportList = document.getElementById("admin-report-list");
  if (reportList) {
    reportList.innerHTML = reports
      .slice(0, 5)
      .map(
        (report) => `
        <li class="list-group-item d-flex justify-content-between align-items-center">
          <span>Report ${report.id} • Company ${report.company_id}</span>
          <span class="badge bg-primary">${report.status}</span>
        </li>
      `
      )
      .join("");
  }
}

function renderLogin() {
  const form = document.querySelector("form");
  const errorBox = document.createElement("div");
  form?.prepend(errorBox);

  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const errors = validateLoginForm();
    if (errors.length) {
      showFormErrors(errorBox, errors);
      return;
    }
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    try {
      const { token, user } = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      setSession(token, user);
      updateNav();
      navigate("dashboard");
    } catch (error) {
      showFormErrors(errorBox, [error.message]);
    }
  });
}

function renderRegister() {
  const form = document.querySelector("form");
  const errorBox = document.createElement("div");
  form?.prepend(errorBox);
  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const errors = validateRegisterForm();
    if (errors.length) {
      showFormErrors(errorBox, errors);
      return;
    }
    const full_name = document.getElementById("register-name").value;
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;
    try {
      const { token, user } = await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ full_name, email, password })
      });
      setSession(token, user);
      updateNav();
      navigate("dashboard");
    } catch (error) {
      showFormErrors(errorBox, [error.message]);
    }
  });
}

function formatNumber(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return "0";
  }
  return new Intl.NumberFormat().format(numeric);
}

async function populateCompanyDatalists(forceRefresh = false) {
  const companies = await getCompanyList(forceRefresh);
  const options = companies
    .map((company) => {
      const location = [company.city, company.province].filter(Boolean).join(", ");
      return `<option value="${escapeAttr(company.name ?? "")}">${escapeHtml(location)}</option>`;
    })
    .join("");
  COMPANY_DATALIST_IDS.forEach((id) => {
    const dataList = document.getElementById(id);
    if (dataList) {
      dataList.innerHTML = options;
    }
  });
}

async function getCompanyMap(forceRefresh = false) {
  if (forceRefresh || !(companiesCache instanceof Map)) {
    try {
      const companies = await api("/api/companies");
      companiesCache = new Map(companies.map((company) => [company.id, company]));
    } catch (error) {
      console.error("Failed to load companies", error);
      companiesCache = new Map();
    }
  }
  return companiesCache;
}

async function getCompanyList(forceRefresh = false) {
  const map = await getCompanyMap(forceRefresh);
  return Array.from(map.values());
}

async function matchCompanyByInput(input) {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  const map = await getCompanyMap();
  const numeric = parseInt(trimmed, 10);
  if (Number.isFinite(numeric) && map.has(numeric)) {
    return map.get(numeric);
  }
  const lower = trimmed.toLowerCase();
  for (const company of map.values()) {
    if ((company.name ?? "").toLowerCase() === lower) {
      return company;
    }
  }
  return null;
}

function prefillCompanyFields(fieldMap, company) {
  if (!company) return;
  Object.entries(fieldMap).forEach(([field, elementId]) => {
    const element = document.getElementById(elementId);
    if (!(element instanceof HTMLInputElement) || element.value) return;
    let value = company[field] ?? null;
    if ((value === null || value === undefined) && field === "name") {
      value = company.name ?? null;
    }
    if (value === null || value === undefined) {
      return;
    }
    if (field === "province" && typeof value === "string") {
      value = value.toUpperCase();
    }
    if (element.type === "date" && typeof value === "string") {
      element.value = value.slice(0, 10);
    } else {
      element.value = value;
    }
  });
}

function describeCompany(company, fallbackId) {
  if (!company) {
    return fallbackId ? `Company #${fallbackId}` : "Unknown Company";
  }
  const details = [company.city, company.province].filter(Boolean).join(", ");
  return details ? `${company.name} (${details})` : company.name;
}

function summarizeItemBreakdown(items) {
  if (!items || typeof items !== "object") {
    return "—";
  }
  const summary = Object.entries(items)
    .filter(([, value]) => Number(value) > 0)
    .map(([key, value]) => `${ITEM_LABELS[key] ?? key}: ${value}`);

  return summary.length ? summary.join(", ") : "—";
}

function readItemInputs(fieldMap) {
  return Object.entries(fieldMap).reduce((acc, [key, elementId]) => {
    const value = document.getElementById(elementId)?.value ?? "0";
    const parsed = parseInt(value, 10);
    acc[key] = Number.isFinite(parsed) ? parsed : 0;
    return acc;
  }, {});
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

async function getUserMap(forceRefresh = false) {
  if (forceRefresh || !(usersCache instanceof Map)) {
    try {
      const users = await api("/api/users");
      usersCache = new Map(users.map((user) => [user.id, user]));
    } catch (error) {
      console.error("Failed to load users", error);
      usersCache = new Map();
    }
  }
  return usersCache;
}

function buildReportQuery(filters = {}) {
  const params = new URLSearchParams();
  if (filters.month) params.append("month", String(filters.month));
  if (filters.year) params.append("year", String(filters.year));
  if (filters.province) params.append("province", filters.province);
  if (filters.status) params.append("status", filters.status);
  if (filters.company_id) params.append("company_id", String(filters.company_id));
  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

async function fetchReportStatistics(filters = {}) {
  const query = buildReportQuery(filters);
  try {
    return await api(`/api/reports/statistics${query}`);
  } catch (error) {
    console.warn("Falling back to client-side report aggregation", error);
    const reports = await api("/api/reports");
    return buildClientReportStats(reports, filters);
  }
}

async function buildClientReportStats(rawReports, filters = {}) {
  const [companyMap, userMap] = await Promise.all([getCompanyMap(), getUserMap()]);
  const normalizedReports = rawReports.map((report) => {
    const items = normalizeItemCounts(report.item_breakdown || report.items || {});
    const company = report.company_id ? companyMap.get(report.company_id) : null;
    const user = report.submitted_by ? userMap.get(report.submitted_by) : null;
    const totalItems = sumItems(items);

    return {
      id: report.id,
      company_id: report.company_id ?? null,
      company_name: report.company_name ?? company?.name ?? null,
      company_province: report.company_province ?? company?.province ?? null,
      company_city: report.company_city ?? company?.city ?? null,
      submitted_by: report.submitted_by ?? null,
      submitted_by_name: report.submitted_by_name ?? user?.full_name ?? null,
      submitted_by_email: report.submitted_by_email ?? user?.email ?? null,
      status: (report.status || "submitted").toLowerCase(),
      total_items: report.total_items ?? totalItems,
      points: calculatePointsFromItems(items),
      items,
      submitted_at: report.submitted_at ?? null
    };
  });

  const filtered = applyReportFilters(normalizedReports, filters);
  filtered.sort((a, b) => {
    const aDate = a.submitted_at ? new Date(a.submitted_at).getTime() : 0;
    const bDate = b.submitted_at ? new Date(b.submitted_at).getTime() : 0;
    return bDate - aDate;
  });

  return {
    filters,
    totals: buildReportTotals(filtered),
    summary_by_province: buildProvinceSummary(filtered),
    summary_by_city: buildCitySummary(filtered),
    summary_by_month: buildMonthlySummary(filtered),
    summary_by_user: buildUserSummary(filtered),
    company_details: buildCompanyDetails(filtered),
    reports: filtered
  };
}

function normalizeItemCounts(rawItems = {}) {
  const flattened = {};
  Object.entries(rawItems).forEach(([key, value]) => {
    if (typeof key === "string") {
      flattened[key.toLowerCase()] = Number(value) || 0;
    }
  });

  const normalized = {};
  ITEM_KEYS.forEach((key) => {
    const aliases = ITEM_KEY_ALIASES[key] || [];
    const candidates = [key.toLowerCase(), ...aliases.map((alias) => alias.toLowerCase())];
    let found = 0;
    for (const candidate of candidates) {
      if (candidate in flattened) {
        found = flattened[candidate];
        break;
      }
    }
    normalized[key] = Number(found) || 0;
  });
  return normalized;
}

function calculatePointsFromItems(items) {
  return ITEM_KEYS.reduce((sum, key) => sum + (items[key] || 0) * (POINT_WEIGHTS[key] || 0), 0);
}

function sumItems(items) {
  return ITEM_KEYS.reduce((sum, key) => sum + (Number(items[key]) || 0), 0);
}

function applyReportFilters(reports, filters = {}) {
  return reports.filter((report) => {
    if (filters.company_id && report.company_id !== filters.company_id) {
      return false;
    }
    if (filters.status && report.status !== filters.status) {
      return false;
    }
    if (filters.province && (report.company_province || "").toUpperCase() !== filters.province) {
      return false;
    }
    if (filters.month || filters.year) {
      const submitted = report.submitted_at ? new Date(report.submitted_at) : null;
      if (!submitted || Number.isNaN(submitted.getTime())) {
        return false;
      }
      if (filters.month && submitted.getMonth() + 1 !== Number(filters.month)) {
        return false;
      }
      if (filters.year && submitted.getFullYear() !== Number(filters.year)) {
        return false;
      }
    }
    return true;
  });
}

function buildReportTotals(reports) {
  const totals = {
    count: reports.length,
    points: 0,
    items: ITEM_KEYS.reduce((acc, key) => ({ ...acc, [key]: 0 }), {}),
    by_status: {},
    companies: 0
  };
  const companyIds = new Set();
  reports.forEach((report) => {
    totals.points += report.points ?? 0;
    ITEM_KEYS.forEach((key) => {
      totals.items[key] += report.items?.[key] ?? 0;
    });
    const status = report.status ?? "unknown";
    totals.by_status[status] = (totals.by_status[status] ?? 0) + 1;
    if (report.company_id) {
      companyIds.add(report.company_id);
    }
  });
  totals.companies = companyIds.size;
  return totals;
}

function buildProvinceSummary(reports) {
  const provinceMap = {};
  reports.forEach((report) => {
    const province = (report.company_province || "Unknown").toUpperCase();
    if (!provinceMap[province]) {
      provinceMap[province] = {
        province,
        companies: new Set(),
        total_items: 0,
        points: 0,
        items: ITEM_KEYS.reduce((acc, key) => ({ ...acc, [key]: 0 }), {})
      };
    }
    if (report.company_id) {
      provinceMap[province].companies.add(report.company_id);
    }
    provinceMap[province].total_items += report.total_items ?? 0;
    provinceMap[province].points += report.points ?? 0;
    ITEM_KEYS.forEach((key) => {
      provinceMap[province].items[key] += report.items?.[key] ?? 0;
    });
  });

  return Object.values(provinceMap).map((entry) => ({
    province: entry.province,
    companies: entry.companies.size,
    total_items: entry.total_items,
    points: entry.points,
    items: entry.items
  }));
}

function buildCitySummary(reports) {
  const cityMap = {};
  reports.forEach((report) => {
    const province = (report.company_province || "Unknown").toUpperCase();
    const city = report.company_city || "Unknown";
    const key = `${city}|${province}`;
    if (!cityMap[key]) {
      cityMap[key] = {
        city,
        province,
        companies: new Set(),
        total_items: 0,
        points: 0,
        items: ITEM_KEYS.reduce((acc, mappedKey) => ({ ...acc, [mappedKey]: 0 }), {})
      };
    }
    if (report.company_id) {
      cityMap[key].companies.add(report.company_id);
    }
    cityMap[key].total_items += report.total_items ?? 0;
    cityMap[key].points += report.points ?? 0;
    ITEM_KEYS.forEach((mappedKey) => {
      cityMap[key].items[mappedKey] += report.items?.[mappedKey] ?? 0;
    });
  });

  return Object.values(cityMap).map((entry) => ({
    city: entry.city,
    province: entry.province,
    companies: entry.companies.size,
    total_items: entry.total_items,
    points: entry.points,
    items: entry.items
  }));
}

function buildCompanyDetails(reports) {
  const details = {};
  reports.forEach((report) => {
    if (!report.company_id) {
      return;
    }
    if (!details[report.company_id]) {
      details[report.company_id] = {
        company_id: report.company_id,
        company_name: report.company_name ?? `Company #${report.company_id}`,
        province: report.company_province ?? null,
        city: report.company_city ?? null,
        points: 0,
        total_items: 0,
        items: ITEM_KEYS.reduce((acc, key) => ({ ...acc, [key]: 0 }), {}),
        reports: 0,
        last_reported_at: null,
        owners: new Map()
      };
    }
    const detail = details[report.company_id];
    detail.points += report.points ?? 0;
    detail.total_items += report.total_items ?? 0;
    detail.reports += 1;
    ITEM_KEYS.forEach((key) => {
      detail.items[key] += report.items?.[key] ?? 0;
    });
    if (report.submitted_by) {
      const label = report.submitted_by_name || `User #${report.submitted_by}`;
      detail.owners.set(report.submitted_by, label);
    }
    if (report.submitted_at) {
      if (!detail.last_reported_at || report.submitted_at > detail.last_reported_at) {
        detail.last_reported_at = report.submitted_at;
      }
    }
  });

  return Object.values(details).map((entry) => ({
    company_id: entry.company_id,
    company_name: entry.company_name,
    province: entry.province,
    city: entry.city,
    points: entry.points,
    total_items: entry.total_items,
    items: entry.items,
    reports: entry.reports,
    last_reported_at: entry.last_reported_at,
    owners: Array.from(entry.owners.values())
  }));
}

function buildMonthlySummary(reports) {
  const monthly = {};
  reports.forEach((report) => {
    const key = formatMonthKey(report.submitted_at);
    if (!monthly[key]) {
      monthly[key] = { month: key, points: 0, total_items: 0, reports: 0 };
    }
    monthly[key].points += report.points ?? 0;
    monthly[key].total_items += report.total_items ?? 0;
    monthly[key].reports += 1;
  });

  return Object.values(monthly).sort((a, b) => (a.month > b.month ? 1 : -1));
}

function buildUserSummary(reports) {
  const users = {};
  reports.forEach((report) => {
    if (!report.submitted_by) {
      return;
    }
    if (!users[report.submitted_by]) {
      users[report.submitted_by] = {
        user_id: report.submitted_by,
        name: report.submitted_by_name ?? `User #${report.submitted_by}`,
        email: report.submitted_by_email ?? null,
        reports: 0,
        points: 0,
        companies: new Set()
      };
    }
    const entry = users[report.submitted_by];
    entry.reports += 1;
    entry.points += report.points ?? 0;
    if (report.company_id) {
      entry.companies.add(report.company_id);
    }
  });

  return Object.values(users).map((entry) => ({
    user_id: entry.user_id,
    name: entry.name,
    email: entry.email,
    reports: entry.reports,
    points: entry.points,
    companies: entry.companies.size
  }));
}

function formatMonthKey(value) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${date.getFullYear()}-${month}`;
}
