import { validateEmail } from "./api.js";

export function validateLoginForm() {
  const email = document.getElementById("login-email")?.value || "";
  const password = document.getElementById("login-password")?.value || "";
  const errors = [];

  if (!validateEmail(email)) errors.push("A valid email is required.");
  if (password.length < 8) errors.push("Password must be at least 8 characters.");

  return errors;
}

export function validateRegisterForm() {
  const fullName = document.getElementById("register-name")?.value || "";
  const email = document.getElementById("register-email")?.value || "";
  const password = document.getElementById("register-password")?.value || "";
  const errors = [];

  if (fullName.trim().length < 2) errors.push("Full name is required.");
  if (!validateEmail(email)) errors.push("A valid email is required.");
  if (password.length < 8) errors.push("Password must be at least 8 characters.");

  return errors;
}

export function showFormErrors(container, errors) {
  if (!container) return;
  container.innerHTML = errors.map((err) => `<div class="alert alert-danger">${err}</div>`).join("");
}
