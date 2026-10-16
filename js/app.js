
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  /* =========================================
     AASRA FOUNDATION — MAIN JAVASCRIPT
     Frontend + Local Storage
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
      if (event.key === "Escape") closeMenu();
    });

    document.addEventListener("click", (event) => {
      if (
        !mainNav.contains(event.target) &&
        !menuToggle.contains(event.target)
      ) {
        closeMenu();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 850) closeMenu();
    });
  }

  // Footer year
  const yearElement = document.getElementById("current-year");

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  // Smooth scrolling
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");

      if (!targetId || targetId === "#") return;

      const target = document.querySelector(targetId);

      if (!target) return;

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
    });
  });

  // Local Storage form handling
  function setupLocalStorageForm(formId, messageId, storageKey, successMessage) {
    const form = document.getElementById(formId);
    const messageElement = document.getElementById(messageId);

    if (!form || !messageElement) return;

    messageElement.setAttribute("role", "status");
    messageElement.setAttribute("aria-live", "polite");

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      messageElement.textContent = "";

      if (!form.reportValidity()) return;

      // Validate email if the form contains an email field.
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

      // Read form values.
      const formData = {};

      new FormData(form).forEach((value, key) => {
        if (typeof value === "string") {
          formData[key] = value.trim();
        }
      });

      try {
        // Load previously saved entries.
        const savedData = JSON.parse(
          localStorage.getItem(storageKey) || "[]"
        );

        if (!Array.isArray(savedData)) {
          throw new Error("Stored data format is invalid.");
        }

        // Save the new entry locally.
        savedData.push({
          ...formData,
          savedAt: new Date().toISOString(),
        });

        localStorage.setItem(storageKey, JSON.stringify(savedData));

        messageElement.textContent = successMessage;
        form.reset();
      } catch (error) {
        console.error("AASRA Local Storage error:", error);

        messageElement.textContent =
          "Unable to save your information in this browser. Please try again.";
      }
    });
  }

  // Help Request form
  setupLocalStorageForm(
    "help-form",
    "help-message",
    "aasra_help_requests",
    "Your demo help request has been saved in this browser."
  );

  // Volunteer form
  setupLocalStorageForm(
    "volunteer-form-element",
    "volunteer-message",
    "aasra_volunteers",
    "Your demo volunteer information has been saved in this browser."
  );

  // Contact form
  setupLocalStorageForm(
    "contact-form",
    "contact-message",
    "aasra_contact_messages",
    "Your demo contact message has been saved in this browser."
  );

  // Allow Escape to dismiss focus from text fields.
  document.querySelectorAll("input, textarea").forEach((element) => {
    element.addEventListener("keydown", (event) => {
      if (event.key === "Escape") element.blur();
    });
  });
});

