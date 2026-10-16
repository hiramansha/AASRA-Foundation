
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
        menuToggle.focus();
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

    // Close the mobile menu when switching to desktop layout.
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

        target.scrollIntoView({
          behavior: window.matchMedia(
            "(prefers-reduced-motion: reduce)"
          ).matches
            ? "auto"
            : "smooth",
          block: "start",
        });

        // Keep the URL in sync without forcing an immediate jump.
        if (window.location.hash !== targetId) {
          history.replaceState(null, "", targetId);
        }
      }
    });
  });

  // Demo form handling.
  // No form data is transmitted or stored by this script.
  function setupDemoForm(formId, messageId, message) {
    const form = document.getElementById(formId);
    const messageElement = document.getElementById(messageId);

    if (!form || !messageElement) return;

    // Make feedback accessible to screen readers.
    messageElement.setAttribute("role", "status");
    messageElement.setAttribute("aria-live", "polite");

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      messageElement.textContent = "";

      if (!form.reportValidity()) {
        return;
      }

      // Check email fields when present.
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

      messageElement.textContent = message;
      form.reset();
    });
  }

  setupDemoForm(
    "volunteer-form-element",
    "volunteer-message",
    "Demo only: your volunteer interest was not submitted or saved. A secure backend connection is needed to register you."
  );

  setupDemoForm(
    "contact-form",
    "contact-message",
    "Demo only: your message was not sent or saved. A secure backend connection is needed to contact the foundation."
  );

  // Improve keyboard focus visibility for interactive elements.
  document.querySelectorAll("a, button, input, select, textarea").forEach(
    (element) => {
      element.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && element.matches("input, textarea")) {
          element.blur();
        }
      });
    }
  );
});

