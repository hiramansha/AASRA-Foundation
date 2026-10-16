
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  /* =========================================
     AASRA FOUNDATION — MAIN JAVASCRIPT
  ========================================= */

  // Mobile navigation
  const menuToggle = document.getElementById("menu-toggle");
  const mainNav = document.getElementById("main-nav");

  function closeMenu() {
    if (!menuToggle || !mainNav) return;

    mainNav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
  }

  if (menuToggle && mainNav) {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-controls", "main-nav");

    menuToggle.addEventListener("click", () => {
      const isOpen = mainNav.classList.toggle("is-open");

      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.setAttribute(
        "aria-label",
        isOpen ? "Close navigation" : "Open navigation"
      );
    });

    mainNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    });

    document.addEventListener("click", (event) => {
      const clickedInsideMenu =
        mainNav.contains(event.target) ||
        menuToggle.contains(event.target);

      if (!clickedInsideMenu) {
        closeMenu();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 850) {
        closeMenu();
      }
    });
  }

  // Automatically update the footer year.
  const yearElement = document.getElementById("current-year");

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  // Smooth scrolling for same-page navigation.
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");

      if (!targetId || targetId === "#") return;

      const target = document.querySelector(targetId);

      if (target) {
        event.preventDefault();

        const reduceMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;

        target.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start",
        });

        if (window.location.hash !== targetId) {
          history.replaceState(null, "", targetId);
        }
      }
    });
  });

  // Demo form handling.
  // Form data is not transmitted or stored by this script.
  function setupDemoForm(formId, messageId, message) {
    const form = document.getElementById(formId);
    const messageElement = document.getElementById(messageId);

    if (!form || !messageElement) return;

    messageElement.setAttribute("role", "status");
    messageElement.setAttribute("aria-live", "polite");

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      messageElement.textContent = "";

      if (!form.reportValidity()) {
        return;
      }

      // Validate email when an email field is provided.
      const emailField = form.querySelector('input[type="email"]');

      if (emailField && emailField.value.trim()) {
        const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          emailField.value.trim()
        );

        if (!emailValid) {
          emailField.setCustomValidity(
            "Please enter a valid email address."
          );
          emailField.reportValidity();
          emailField.setCustomValidity("");
          return;
        }
      }

      // Show the appropriate demo message.
      messageElement.textContent = message;

      // Clear fields after displaying the message.
      form.reset();
    });
  }

  // Help Request form
  setupDemoForm(
    "help-form",
    "help-message",
    "Demo only: your help request was not submitted or saved. A secure backend connection is needed to receive requests."
  );

  // Volunteer form
  setupDemoForm(
    "volunteer-form-element",
    "volunteer-message",
    "Demo only: your volunteer interest was not submitted or saved. A secure backend connection is needed to register you."
  );

  // Contact form
  setupDemoForm(
    "contact-form",
    "contact-message",
    "Demo only: your message was not sent or saved. A secure backend connection is needed to contact the foundation."
  );

  // Allow Escape to dismiss keyboard focus from text fields.
  document
    .querySelectorAll("input, textarea")
    .forEach((element) => {
      element.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          element.blur();
        }
      });
    });
});
