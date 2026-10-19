document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  /* =========================================
     AASRA FOUNDATION
     Frontend + LocalStorage
  ========================================= */

  // MOBILE NAVIGATION
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

  // FOOTER YEAR
  const yearElement = document.getElementById("current-year");

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  // SMOOTH SCROLLING — FOR LINKS ON THE SAME PAGE
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

  // LOCAL STORAGE FORM HANDLER
  function setupLocalStorageForm(
    formIds,
    messageId,
    storageKey,
    successMessage
  ) {
    // Support alternative form IDs without attaching duplicate handlers.
    const ids = Array.isArray(formIds) ? formIds : [formIds];

    const form = ids
      .map((id) => document.getElementById(id))
      .find(Boolean);

    const messageElement = document.getElementById(messageId);

    if (!form || !messageElement) {
      console.info(
        `AASRA form not found: ${ids.join(" / ")} or #${messageId}`
      );
      return;
    }

    // Prevent accidental duplicate event listeners.
    if (form.dataset.localStorageReady === "true") return;
    form.dataset.localStorageReady = "true";

    messageElement.setAttribute("role", "status");
    messageElement.setAttribute("aria-live", "polite");

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      messageElement.textContent = "";

      if (!form.reportValidity()) return;

      // Basic email validation.
      const emailField = form.querySelector('input[type="email"]');

      if (emailField && emailField.value.trim()) {
        const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          emailField.value.trim()
        );

        if (!validEmail) {
          emailField.setCustomValidity(
            "Please enter a valid email address."
          );
          emailField.reportValidity();
          emailField.setCustomValidity("");
          return;
        }
      }

      // Collect named form fields.
      const formData = {};

      new FormData(form).forEach((value, key) => {
        if (typeof value === "string") {
          formData[key] = value.trim();
        }
      });

      try {
        // Read existing entries safely.
        const existingValue = localStorage.getItem(storageKey);
        const savedData = existingValue ? JSON.parse(existingValue) : [];

        if (!Array.isArray(savedData)) {
          throw new Error("Saved data is not in the expected format.");
        }

        // Save this submission.
        savedData.push({
          ...formData,
          savedAt: new Date().toISOString(),
        });

        localStorage.setItem(storageKey, JSON.stringify(savedData));

        messageElement.textContent = successMessage;
        form.reset();
      } catch (error) {
        console.error("AASRA LocalStorage error:", error);

        messageElement.textContent =
          "Could not save your information in this browser. Please try again.";
      }
    });
  }

  // HELP REQUEST FORM
  setupLocalStorageForm(
    ["help-form"],
    "help-message",
    "aasra_help_requests",
    "Your demo help request has been saved in this browser."
  );

  // VOLUNTEER FORM
  // Supports either ID if your HTML uses one of these.
  setupLocalStorageForm(
    ["volunteer-form-element", "volunteer-form"],
    "volunteer-message",
    "aasra_volunteers",
    "Your demo volunteer information has been saved in this browser."
  );

  // CONTACT FORM
  setupLocalStorageForm(
    ["contact-form"],
    "contact-message",
    "aasra_contact_messages",
    "Your demo contact message has been saved in this browser."
  );

  // ESCAPE KEY: REMOVE FOCUS FROM INPUTS
  document.querySelectorAll("input, textarea").forEach((element) => {
    element.addEventListener("keydown", (event) => {
      if (event.key === "Escape") element.blur();
    });
  });
});

