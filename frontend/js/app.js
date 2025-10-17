const routes = [
  "dashboard",
  "reports",
  "teams",
  "pickups",
  "applications",
  "profile",
  "login",
  "register",
  "recover",
  "privacy",
  "terms"
];

const viewHandlers = {
  dashboard: renderDashboard,
  reports: renderReports,
  teams: renderTeams,
  pickups: renderPickups,
  applications: renderApplications,
  profile: renderProfile,
  login: renderLogin,
  register: renderRegister,
  recover: renderRecover
};

const mockData = {
  reports: [
    {
      id: "RPT-202501",
      company: "ElectroRecycle BC",
      items: 128,
      status: "Approved",
      scheduled: "2025-01-05",
      technician: "Alex Ramos"
    },
    {
      id: "RPT-202502",
      company: "GreenTech Calgary",
      items: 94,
      status: "In Review",
      scheduled: "2025-01-12",
      technician: "Priya Nair"
    },
    {
      id: "RPT-202503",
      company: "Prairie Logistics",
      items: 205,
      status: "Pending",
      scheduled: "2025-01-18",
      technician: "Jordan Smith"
    }
  ],
  teams: [
    {
      name: "West Coast Leads",
      members: 12,
      activePickups: 4,
      performance: 92
    },
    {
      name: "Prairie Movers",
      members: 9,
      activePickups: 3,
      performance: 88
    },
    {
      name: "Atlantic Care",
      members: 7,
      activePickups: 2,
      performance: 81
    }
  ],
  applications: [
    {
      applicant: "Taylor Wong",
      team: "West Coast Leads",
      submittedOn: "2025-01-03",
      status: "Awaiting Review"
    },
    {
      applicant: "Morgan Lee",
      team: "Prairie Movers",
      submittedOn: "2025-01-08",
      status: "Interview Scheduled"
    }
  ],
  pickups: [
    {
      ticket: "PKP-4112",
      location: "Vancouver, BC",
      window: "Jan 8, 10:00-12:00",
      contact: "Jamie Fox",
      status: "Scheduled"
    },
    {
      ticket: "PKP-4120",
      location: "Calgary, AB",
      window: "Jan 10, 14:00-16:00",
      contact: "Sasha Green",
      status: "Awaiting Approval"
    },
    {
      ticket: "PKP-4124",
      location: "Halifax, NS",
      window: "Jan 11, 09:00-11:00",
      contact: "River Chen",
      status: "Pending Assignment"
    }
  ]
};

const viewContainer = document.getElementById("view-container");

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("year").textContent = String(new Date().getFullYear());

  document.querySelectorAll("[data-route]").forEach((element) => {
    element.addEventListener("click", (event) => {
      const route = element.dataset.route;
      if (!route || !routes.includes(route)) {
        return;
      }
      event.preventDefault();
      navigate(route);
    });
  });

  const initialRoute = getRouteFromHash(window.location.hash) || "dashboard";
  navigate(initialRoute);
});

window.addEventListener("hashchange", () => {
  const route = getRouteFromHash(window.location.hash);
  if (route) {
    navigate(route);
  }
});

function getRouteFromHash(hash) {
  if (!hash) {
    return null;
  }
  const normalized = hash.replace("#", "");
  return routes.includes(normalized) ? normalized : null;
}

async function navigate(route) {
  setActiveNav(route);
  const markup = await loadView(route);
  viewContainer.innerHTML = markup;
  const handler = viewHandlers[route];
  if (handler) {
    handler();
  }
  window.location.hash = `#${route}`;
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

async function loadView(route) {
  try {
    const response = await fetch(`./views/${route}.html`, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`Failed to load view: ${route}`);
    }
    return await response.text();
  } catch (error) {
    console.error(error);
    return `<section class="text-center py-5"><h2 class="mb-3">View unavailable</h2><p class="text-muted">We could not load the <strong>${route}</strong> page.</p></section>`;
  }
}

function renderDashboard() {
  const chartCanvas = document.getElementById("productivity-chart");
  if (!chartCanvas) {
    return;
  }

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
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function renderReports() {
  const tableBody = document.querySelector("#reports-table tbody");
  if (!tableBody) {
    return;
  }
  tableBody.innerHTML = mockData.reports
    .map(
      (report) => `
        <tr>
          <td>${report.id}</td>
          <td>${report.company}</td>
          <td>${report.items}</td>
          <td><span class="badge bg-primary">${report.status}</span></td>
          <td>${report.scheduled}</td>
          <td>${report.technician}</td>
        </tr>
      `
    )
    .join("");
}

function renderTeams() {
  const list = document.getElementById("team-cards");
  if (!list) {
    return;
  }
  list.innerHTML = mockData.teams
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
                <li><strong>Members:</strong> ${team.members}</li>
                <li><strong>Active Pickups:</strong> ${team.activePickups}</li>
                <li><strong>Performance Index:</strong> ${team.performance}%</li>
              </ul>
              <button class="btn btn-outline-primary w-100">View Team Details</button>
            </div>
          </div>
        </div>
      `
    )
    .join("");
}

function renderApplications() {
  const timeline = document.getElementById("application-timeline");
  if (!timeline) {
    return;
  }
  timeline.innerHTML = mockData.applications
    .map(
      (application) => `
        <div class="card mb-3">
          <div class="card-body d-flex justify-content-between flex-column flex-md-row">
            <div>
              <h6 class="fw-semibold mb-1">${application.applicant}</h6>
              <p class="mb-0 text-muted small">${application.team} &bull; Submitted ${application.submittedOn}</p>
            </div>
            <div class="d-flex align-items-center gap-2 mt-3 mt-md-0">
              <span class="badge bg-secondary">${application.status}</span>
              <button class="btn btn-sm btn-success">Approve</button>
              <button class="btn btn-sm btn-outline-danger">Decline</button>
            </div>
          </div>
        </div>
      `
    )
    .join("");
}

function renderPickups() {
  const list = document.getElementById("pickup-list");
  if (!list) {
    return;
  }
  list.innerHTML = mockData.pickups
    .map(
      (pickup) => `
        <div class="card mb-3">
          <div class="card-body">
            <div class="d-flex justify-content-between flex-column flex-md-row">
              <div>
                <h6 class="fw-semibold">${pickup.ticket}</h6>
                <p class="mb-1 text-muted small">${pickup.location}</p>
                <p class="mb-0 text-muted">Window: ${pickup.window}</p>
              </div>
              <div class="text-md-end mt-3 mt-md-0">
                <span class="badge bg-info text-dark mb-2">${pickup.status}</span>
                <div>
                  <button class="btn btn-sm btn-outline-primary me-2">Assign</button>
                  <button class="btn btn-sm btn-outline-secondary">Reschedule</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `
    )
    .join("");
}

function renderProfile() {
  const history = document.getElementById("activity-history");
  if (!history) {
    return;
  }
  history.innerHTML = `
    <tr>
      <td>Jan 05, 2025</td>
      <td>Submitted report RPT-202501</td>
      <td><span class="badge bg-primary">Manager</span></td>
    </tr>
    <tr>
      <td>Jan 02, 2025</td>
      <td>Approved pickup PKP-4112 for West Coast Leads</td>
      <td><span class="badge bg-secondary">Team Lead</span></td>
    </tr>
    <tr>
      <td>Dec 28, 2024</td>
      <td>Updated team roster for Prairie Movers</td>
      <td><span class="badge bg-info text-dark">Coordinator</span></td>
    </tr>
  `;
}

function renderLogin() {
  attachAuthHandlers("login");
}

function renderRegister() {
  attachAuthHandlers("register");
}

function renderRecover() {
  attachAuthHandlers("recover");
}

function attachAuthHandlers(type) {
  const form = document.querySelector("form.needs-validation");
  if (!form) {
    return;
  }
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }
    const submitButton = form.querySelector("button[type='submit']");
    if (submitButton) {
      submitButton.disabled = true;
      const loadingText = {
        login: "Signing In...",
        register: "Creating Account...",
        recover: "Sending Reset Link..."
      };
      const defaultText = {
        login: "Sign In",
        register: "Create Account",
        recover: "Send Reset Link"
      };
      submitButton.textContent = loadingText[type] || "Processing...";
      setTimeout(() => {
        submitButton.disabled = false;
        submitButton.textContent = defaultText[type] || "Submit";
        if (type === "recover") {
          const alert = document.createElement("div");
          alert.className = "alert alert-success mt-3";
          alert.textContent = "If that email exists, a reset link has been sent to your inbox.";
          form.appendChild(alert);
          setTimeout(() => alert.remove(), 5000);
        } else {
          navigate("dashboard");
        }
      }, 1000);
    }
  });
}
