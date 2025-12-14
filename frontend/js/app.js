const API_BASE = "";

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

const state = {
  token: localStorage.getItem("token"),
  user: null
};

const viewContainer = document.getElementById("view-container");

document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("year").textContent = String(new Date().getFullYear());
  bindNavigation();

  if (state.token) {
    await hydrateSession();
  }

  const initialRoute = getRouteFromHash(window.location.hash) || (state.user ? "dashboard" : "login");
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
      navigate("login");
    });
  }
}

async function hydrateSession() {
  try {
    const { user } = await api("/api/auth/me");
    state.user = user;
    updateNav();
  } catch (error) {
    clearSession();
  }
}

function getRouteFromHash(hash) {
  if (!hash) return null;
  const normalized = hash.replace("#", "");
  return routes[normalized] ? normalized : null;
}

async function navigate(routeKey) {
  const route = routes[routeKey];
  if (!route) return;

  const needsAuth = route.requiresAuth;
  const needsRole = route.role;

  if (needsAuth && !state.user) {
    window.location.hash = "#login";
    await loadAndRender("login");
    return;
  }

  if (needsRole && state.user?.role !== needsRole) {
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

  if (state.user) {
    navSignin?.classList.add("d-none");
    navUserMenu?.classList.remove("d-none");
    if (userMenuToggle) userMenuToggle.textContent = state.user.full_name || state.user.email;

    if (navAdmin) {
      if (state.user.role === "manager") {
        navAdmin.classList.remove("d-none");
      } else {
        navAdmin.classList.add("d-none");
      }
    }
  } else {
    navSignin?.classList.remove("d-none");
    navUserMenu?.classList.add("d-none");
    navAdmin?.classList.add("d-none");
  }
}

async function api(path, options = {}) {
  const headers = Object.assign(
    { Accept: "application/json" },
    options.headers || {},
    options.body ? { "Content-Type": "application/json" } : {}
  );

  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (response.status === 401) {
    clearSession();
    navigate("login");
    throw new Error("Unauthorized");
  }
  if (response.status === 204) return {};

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error || "Request failed";
    throw new Error(message);
  }
  return data;
}

function persistSession(token, user) {
  state.token = token;
  state.user = user;
  localStorage.setItem("token", token);
  updateNav();
}

function clearSession() {
  state.token = null;
  state.user = null;
  localStorage.removeItem("token");
  updateNav();
}

// View handlers

function renderDashboard() {
  const chartCanvas = document.getElementById("productivity-chart");
  if (chartCanvas) {
    new window.Chart(chartCanvas, {
      type: "line",
      data: {
        labels: ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"],
        datasets: [
          {
            label: "Points Earned",
            data: [420, 460, 510, 580, 610, 640],
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

  const welcome = document.getElementById("dashboard-greeting");
  if (welcome && state.user) {
    welcome.textContent = `Welcome back, ${state.user.full_name || state.user.email}`;
  }

  refreshDashboardStats();
  const refreshBtn = document.getElementById("dashboard-refresh-btn");
  refreshBtn?.addEventListener("click", refreshDashboardStats);
}

async function refreshDashboardStats() {
  const [reports, pickups, teams] = await Promise.all([
    api("/api/reports").catch(() => []),
    api("/api/pickups").catch(() => []),
    api("/api/teams").catch(() => [])
  ]);

  const statReports = document.getElementById("stat-reports");
  const statPickups = document.getElementById("stat-pickups");
  const statTeams = document.getElementById("stat-teams");
  if (statReports) statReports.textContent = reports.length;
  if (statPickups) statPickups.textContent = pickups.length;
  if (statTeams) statTeams.textContent = teams.length;

  const pickupList = document.getElementById("dashboard-pickups");
  if (pickupList) {
    pickupList.innerHTML = pickups
      .slice(0, 5)
      .map(
        (pickup) => `
        <li class="list-group-item px-0">
          <div class="fw-semibold">Pickup ${pickup.id}</div>
          <small class="text-muted">${pickup.pickup_window_start ?? ""}</small>
        </li>
      `
      )
      .join("");
  }

  const reportTable = document.getElementById("dashboard-reports");
  if (reportTable) {
    reportTable.innerHTML = reports
      .slice(0, 5)
      .map(
        (report) => `
        <tr>
          <td>${report.id}</td>
          <td>${report.company_id}</td>
          <td><span class="badge bg-primary">${report.status}</span></td>
          <td>${report.total_items ?? 0}</td>
        </tr>
      `
      )
      .join("");
  }
}

async function renderReports() {
  const tableBody = document.querySelector("#reports-table tbody");
  if (!tableBody) return;
  try {
    const reports = await api("/api/reports");
    tableBody.innerHTML = reports
      .map(
        (report) => `
        <tr>
          <td>${report.id}</td>
          <td>${report.company_id}</td>
          <td>${report.total_items ?? 0}</td>
          <td><span class="badge bg-primary">${report.status}</span></td>
          <td>${report.submitted_at ?? "-"}</td>
          <td>${report.submitted_by ?? "-"}</td>
        </tr>
      `
      )
      .join("");
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="6" class="text-danger">${error.message}</td></tr>`;
  }
}

async function renderTeams() {
  const list = document.getElementById("team-cards");
  if (!list) return;
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
  try {
    const pickups = await api("/api/pickups");
    list.innerHTML = pickups
      .map(
        (pickup) => `
        <div class="card mb-3">
          <div class="card-body">
            <div class="d-flex justify-content-between flex-column flex-md-row">
              <div>
                <h6 class="fw-semibold">Ticket ${pickup.id}</h6>
                <p class="mb-1 text-muted small">Report: ${pickup.report_id}</p>
                <p class="mb-0 text-muted">Window: ${pickup.pickup_window_start ?? ""} - ${pickup.pickup_window_end ?? ""}</p>
              </div>
              <div class="text-md-end mt-3 mt-md-0">
                <span class="badge bg-info text-dark mb-2">${pickup.status}</span>
              </div>
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

async function renderApplications() {
  const timeline = document.getElementById("application-timeline");
  if (!timeline) return;
  try {
    const applications = await api("/api/team-applications");
    timeline.innerHTML = applications
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
  } catch (error) {
    timeline.innerHTML = `<p class="text-danger">${error.message}</p>`;
  }
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
    if (state.user) {
      if (name) name.textContent = state.user.full_name || "User";
      if (email) email.textContent = state.user.email;
      if (role) role.textContent = state.user.role;
      if (team) team.textContent = state.user.team_id ?? "Unassigned";
      if (avatar) avatar.textContent = (state.user.full_name || state.user.email || "U").substring(0, 2).toUpperCase();
    }
  };

  applyUser();

  refreshBtn?.addEventListener("click", async () => {
    try {
      const { user } = await api("/api/auth/me");
      state.user = user;
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
  if (!state.user || state.user.role !== "manager") {
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
  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    try {
      const { token, user } = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      persistSession(token, user);
      navigate("dashboard");
    } catch (error) {
      alert(error.message);
    }
  });
}

function renderRegister() {
  const form = document.querySelector("form");
  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const full_name = document.getElementById("register-name").value;
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;
    try {
      const { token, user } = await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ full_name, email, password })
      });
      persistSession(token, user);
      navigate("dashboard");
    } catch (error) {
      alert(error.message);
    }
  });
}
