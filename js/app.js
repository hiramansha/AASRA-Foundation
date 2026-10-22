document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  /* =========================================
     AASRA FOUNDATION
     Frontend + Cloudflare API
  ========================================= */

  const API_BASE_URL =
    "https://aasra-foundation.23-st-028.workers.dev";

  // BILINGUAL MESSAGES
  function getLanguage() {
    return localStorage.getItem("aasra-language") === "ur"
      ? "ur"
      : "en";
  }

  function showMessage(element, english, urdu, isError = false) {
    if (!element) return;

    const language = getLanguage();

    element.textContent = language === "ur" ? urdu : english;
    element.setAttribute("dir", language === "ur" ? "rtl" : "ltr");
    element.setAttribute("role", "status");
    element.setAttribute("aria-live", "polite");

    element.classList.toggle("error", isError);
  }

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

  // SMOOTH SCROLLING
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

  // SHARED LOCALSTORAGE FORM HANDLER
  // Used by Help and Volunteer forms only.
  function setupLocalStorageForm(
    formIds,
    messageId,
    storageKey,
    successMessage
  ) {
    const ids = Array.isArray(formIds) ? formIds : [formIds];

    const form = ids
      .map((id) => document.getElementById(id))
      .find(Boolean);

    const messageElement = document.getElementById(messageId);

    if (!form || !messageElement) return;

    if (form.dataset.localStorageReady === "true") return;
    form.dataset.localStorageReady = "true";

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      messageElement.textContent = "";

      if (!form.reportValidity()) return;

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

      const formData = {};

      new FormData(form).forEach((value, key) => {
        if (typeof value === "string") {
          formData[key] = value.trim();
        }
      });

      try {
        const existingValue = localStorage.getItem(storageKey);
        const savedData = existingValue
          ? JSON.parse(existingValue)
          : [];

        if (!Array.isArray(savedData)) {
          throw new Error("Unexpected saved data format.");
        }

        savedData.push({
          ...formData,
          savedAt: new Date().toISOString(),
        });

        localStorage.setItem(storageKey, JSON.stringify(savedData));

        const messages = {
          en: {
            "help-message":
              "Your demo help request has been saved in this browser.",
            "volunteer-message":
              "Your demo volunteer information has been saved in this browser.",
          },
          ur: {
            "help-message":
              "آپ کی مدد کی درخواست اس براؤزر میں محفوظ ہو گئی ہے۔",
            "volunteer-message":
              "آپ کی رضاکارانہ معلومات اس براؤزر میں محفوظ ہو گئی ہیں۔",
          },
        };

        const language = getLanguage();

        showMessage(
          messageElement,
          messages.en[messageId] || successMessage,
          messages.ur[messageId] || successMessage
        );

        form.reset();
      } catch (error) {
        console.error("AASRA local storage error:", error);

        showMessage(
          messageElement,
          "Could not save your information in this browser. Please try again.",
          "آپ کی معلومات محفوظ نہیں ہو سکیں۔ براہِ کرم دوبارہ کوشش کریں۔",
          true
        );
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
  setupLocalStorageForm(
    ["volunteer-form-element", "volunteer-form"],
    "volunteer-message",
    "aasra_volunteers",
    "Your demo volunteer information has been saved in this browser."
  );

  // CONTACT FORM — CLOUDFLARE API
  const contactForm = document.getElementById("contact-form");
  const contactMessage = document.getElementById("contact-message");

  if (contactForm && contactMessage) {
    contactMessage.setAttribute("role", "status");
    contactMessage.setAttribute("aria-live", "polite");

    if (contactForm.dataset.apiReady !== "true") {
      contactForm.dataset.apiReady = "true";

      contactForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        contactMessage.textContent = "";

        if (!contactForm.reportValidity()) return;

        const formData = new FormData(contactForm);

        // The API expects these exact property names.
        const name = String(formData.get("name") || "").trim();
        const email = String(formData.get("email") || "").trim();
        const message = String(formData.get("message") || "").trim();

        if (!name || !email || !message) {
          showMessage(
            contactMessage,
            "Please complete your name, email, and message.",
            "براہِ کرم اپنا نام، ای میل اور پیغام مکمل درج کریں۔",
            true
          );
          return;
        }

        const submitButton = contactForm.querySelector(
          'button[type="submit"], input[type="submit"]'
        );

        const originalButtonText = submitButton
          ? submitButton.textContent
          : "";

        if (submitButton) {
          submitButton.disabled = true;

          if (submitButton.tagName === "BUTTON") {
            submitButton.textContent =
              getLanguage() === "ur" ? "بھیجا جا رہا ہے..." : "Sending...";
          }
        }

        try {
          const response = await fetch(
            `${API_BASE_URL}/api/contact`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name,
                email,
                message,
              }),
            }
          );

          let result;

          try {
            result = await response.json();
          } catch {
            throw new Error("The server returned an invalid response.");
          }

          if (!response.ok || !result.success) {
            throw new Error(
              result.message || "Could not send your message."
            );
          }

          showMessage(
            contactMessage,
            "Your message reached the API. Database storage is not configured yet.",
            "آپ کا پیغام API تک پہنچ گیا ہے۔ ڈیٹابیس میں محفوظ کرنے کی سہولت ابھی ترتیب نہیں دی گئی۔"
          );

          contactForm.reset();
        } catch (error) {
          console.error("AASRA contact API error:", error);

          showMessage(
            contactMessage,
            "We could not send your message. Please try again later.",
            "آپ کا پیغام نہیں بھیجا جا سکا۔ براہِ کرم کچھ دیر بعد دوبارہ کوشش کریں۔",
            true
          );
        } finally {
          if (submitButton) {
            submitButton.disabled = false;

            if (submitButton.tagName === "BUTTON") {
              submitButton.textContent = originalButtonText;
            }
          }
        }
      });
    }
  }

  // ESCAPE KEY: REMOVE FOCUS FROM INPUTS
  document.querySelectorAll("input, textarea").forEach((element) => {
    element.addEventListener("keydown", (event) => {
      if (event.key === "Escape") element.blur();
    });
  });
});

