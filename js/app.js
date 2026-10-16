
document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("menu-toggle");
  const mainNav = document.getElementById("main-nav");

  // Mobile navigation
  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", () => {
      const isOpen = mainNav.classList.toggle("is-open");

      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.setAttribute(
        "aria-label",
        isOpen ? "Close navigation" : "Open navigation"
      );
    });

    mainNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mainNav.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Open navigation");
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        mainNav.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Automatically update the footer year
  const yearElement = document.getElementById("current-year");

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  // Demo form handling — no data is stored or transmitted
  function setupDemoForm(formId, messageId, message) {
    const form = document.getElementById(formId);
    const messageElement = document.getElementById(messageId);

    if (!form || !messageElement) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!form.reportValidity()) return;

      messageElement.textContent = message;
      form.reset();
    });
  }

  setupDemoForm(
    "volunteer-form-element",
    "volunteer-message",
    "Demo only: your information was not submitted or saved. A backend connection is required to register your interest."
  );

  setupDemoForm(
    "contact-form",
    "contact-message",
    "Demo only: your message was not sent or saved. A backend connection is required to contact the foundation."
  );
});
